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
 * GET /api/cart
 * 获取当前用户的已选商品
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT category_id, product_id, name, name_en, price, unit FROM user_selected_products WHERE user_id = ? ORDER BY created_at ASC',
      [req.userId]
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取购物车失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/cart/sync
 * 同步整个购物车到后端（覆盖式）
 * body: { items: [{ categoryId, productId, name, nameEn, price, unit }] }
 */
router.post('/sync', async (req, res) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items 必须是数组' })
    }

    // 先删除旧数据
    await pool.execute('DELETE FROM user_selected_products WHERE user_id = ?', [req.userId])

    // 批量插入新数据
    if (items.length > 0) {
      const values = items.map(item => [
        req.userId,
        item.categoryId || '',
        item.productId || '',
        item.name || '',
        item.nameEn || '',
        item.price || 0,
        item.unit || '€',
      ])
      const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
      const flatValues = values.flat()

      await pool.execute(
        `INSERT INTO user_selected_products (user_id, category_id, product_id, name, name_en, price, unit) VALUES ${placeholders}`,
        flatValues
      )
    }

    res.json({ success: true, message: '同步成功' })
  } catch (error) {
    console.error('同步购物车失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router
