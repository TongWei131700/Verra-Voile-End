const express = require('express')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'

// 用户鉴权中间件
function userAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.userPhone = decoded.phone
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'token已过期' })
  }
}

router.use(userAuthMiddleware)

/**
 * GET /api/wishlist
 * 获取当前用户的所有意向单条目
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT category_id, product_id, item_name, item_name_en, image, base_price, total_price, unit, options_json FROM user_wishlist WHERE user_id = ? ORDER BY created_at ASC',
      [req.userId]
    )
    // 将 options_json 从 JSON 字符串转为对象
    const data = rows.map(row => ({
      ...row,
      options_json: row.options_json ? (typeof row.options_json === 'string' ? JSON.parse(row.options_json) : row.options_json) : null,
    }))
    res.json({ success: true, data })
  } catch (error) {
    console.error('获取意向单失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * PUT /api/wishlist
 * 更新（upsert）单条意向单
 * body: { categoryId, productId, itemName, itemNameEn, image, basePrice, totalPrice, unit, optionsJson }
 */
router.put('/', async (req, res) => {
  try {
    const {
      categoryId,
      productId,
      itemName = '',
      itemNameEn = '',
      image = '',
      basePrice = 0,
      totalPrice = 0,
      unit = '£',
      optionsJson = null,
    } = req.body

    if (!categoryId || !productId) {
      return res.status(400).json({ success: false, message: 'categoryId 和 productId 必填' })
    }

    const optionsStr = optionsJson ? JSON.stringify(optionsJson) : null

    await pool.execute(
      `INSERT INTO user_wishlist (user_id, category_id, product_id, item_name, item_name_en, image, base_price, total_price, unit, options_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         item_name = VALUES(item_name),
         item_name_en = VALUES(item_name_en),
         image = VALUES(image),
         base_price = VALUES(base_price),
         total_price = VALUES(total_price),
         unit = VALUES(unit),
         options_json = VALUES(options_json)`,
      [req.userId, categoryId, productId, itemName, itemNameEn, image, basePrice, totalPrice, unit, optionsStr]
    )

    res.json({ success: true, message: '意向单已更新' })
  } catch (error) {
    console.error('更新意向单失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * DELETE /api/wishlist/:categoryId/:productId
 * 删除单条意向单
 */
router.delete('/:categoryId/:productId', async (req, res) => {
  try {
    const { categoryId, productId } = req.params
    const [result] = await pool.execute(
      'DELETE FROM user_wishlist WHERE user_id = ? AND category_id = ? AND product_id = ?',
      [req.userId, categoryId, productId]
    )
    res.json({ success: true, deleted: result.affectedRows })
  } catch (error) {
    console.error('删除意向单失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/wishlist/sync
 * 全量同步某个 category 下的所有意向单（覆盖式）
 * body: { categoryId, items: [{ productId, itemName, itemNameEn, image, basePrice, totalPrice, unit, optionsJson }] }
 */
router.post('/sync', async (req, res) => {
  try {
    const { categoryId, items } = req.body
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'categoryId 必填' })
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items 必须是数组' })
    }

    // 先删除该 category 下该用户的所有旧数据
    await pool.execute(
      'DELETE FROM user_wishlist WHERE user_id = ? AND category_id = ?',
      [req.userId, categoryId]
    )

    // 批量插入新数据
    if (items.length > 0) {
      const values = items.map(item => [
        req.userId,
        categoryId,
        item.productId || '',
        item.itemName || '',
        item.itemNameEn || '',
        item.image || '',
        item.basePrice || 0,
        item.totalPrice || 0,
        item.unit || '£',
        item.optionsJson ? JSON.stringify(item.optionsJson) : null,
      ])
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
      const flatValues = values.flat()

      await pool.execute(
        `INSERT INTO user_wishlist (user_id, category_id, product_id, item_name, item_name_en, image, base_price, total_price, unit, options_json) VALUES ${placeholders}`,
        flatValues
      )
    }

    res.json({ success: true, message: '同步成功' })
  } catch (error) {
    console.error('同步意向单失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router
