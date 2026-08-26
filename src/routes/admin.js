const express = require('express')
const jwt = require('jsonwebtoken')
const { pool, getCategoryTable, ensureCategoryTable } = require('../db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'

// 鉴权中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无管理员权限' })
    }
    req.admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'token已过期，请重新登录' })
  }
}

// 所有 admin 路由都需要鉴权
router.use(authMiddleware)

/**
 * GET /api/admin/users
 * 获取所有注册用户
 */
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, phone, email, created_at FROM users ORDER BY created_at DESC'
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('查询用户列表错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/admin/stats
 * 获取仪表盘统计数据
 */
router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) AS count FROM users')
    const [reservationCount] = await pool.execute('SELECT COUNT(*) AS count FROM reservations')
    const [todayReservations] = await pool.execute(
      "SELECT COUNT(*) AS count FROM reservations WHERE DATE(created_at) = CURDATE()"
    )
    const [todayUsers] = await pool.execute(
      "SELECT COUNT(*) AS count FROM users WHERE DATE(created_at) = CURDATE()"
    )

    res.json({
      success: true,
      data: {
        totalUsers: userCount[0].count,
        totalReservations: reservationCount[0].count,
        todayReservations: todayReservations[0].count,
        todayUsers: todayUsers[0].count,
      },
    })
  } catch (error) {
    console.error('查询统计数据错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/admin/chat-users
 * 获取有聊天记录的用戶列表（含最后一条消息和时间），包括访客
 */
router.get('/chat-users', async (req, res) => {
  try {
    // 注册用户的聊天记录
    const [userRows] = await pool.execute(`
      SELECT u.id, u.phone,
        m_last.content AS last_message,
        m_last.created_at AS last_message_at,
        m_last.sender_type AS last_sender_type,
        (SELECT COUNT(*) FROM messages m WHERE m.user_id = u.id AND m.sender_type = 'user' AND m.is_read = 0) AS unread_count
      FROM users u
      INNER JOIN messages m_last ON m_last.id = (
        SELECT m2.id FROM messages m2 WHERE m2.user_id = u.id ORDER BY m2.created_at DESC LIMIT 1
      )
      ORDER BY m_last.created_at DESC
    `)

    // 访客的聊天记录（user_id 为负数，不在 users 表中）
    const [guestRows] = await pool.execute(`
      SELECT m.user_id AS id,
        CONCAT('访客_', LPAD(HEX(ABS(m.user_id)), 8, '0')) AS phone,
        m_last.content AS last_message,
        m_last.created_at AS last_message_at,
        m_last.sender_type AS last_sender_type,
        (SELECT COUNT(*) FROM messages gm WHERE gm.user_id = m.user_id AND gm.sender_type = 'user' AND gm.is_read = 0) AS unread_count
      FROM (SELECT DISTINCT user_id FROM messages WHERE user_id < 0) m
      INNER JOIN messages m_last ON m_last.id = (
        SELECT m2.id FROM messages m2 WHERE m2.user_id = m.user_id ORDER BY m2.created_at DESC LIMIT 1
      )
      ORDER BY m_last.created_at DESC
    `)

    // 合并并按时间倒序排列
    const all = [...userRows, ...guestRows]
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))

    res.json({ success: true, data: all })
  } catch (error) {
    console.error('查询聊天用户列表错误:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/admin/user-products/:userId
 * 获取指定用户的已选商品
 */
router.get('/user-products/:userId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT category_id, product_id, name, name_en, price, unit, image, created_at FROM user_selected_products WHERE user_id = ? ORDER BY created_at ASC',
      [req.params.userId]
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('查询用户商品失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/admin/mark-read/:userId
 * 将指定用户的所有未读消息标记为已读
 */
router.post('/mark-read/:userId', async (req, res) => {
  try {
    await pool.execute(
      "UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender_type = 'user' AND is_read = 0",
      [req.params.userId]
    )
    res.json({ success: true })
  } catch (error) {
    console.error('标记已读失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

// ==================== 商品管理（按种类独立表） ====================

/**
 * GET /api/admin/products
 * 获取所有商品（遍历各类别独立表）
 */
router.get('/products', async (req, res) => {
  try {
    const [modules] = await pool.execute(
      'SELECT id, name, name_en AS nameEn FROM product_modules ORDER BY sort_order ASC'
    )
    const allProducts = []
    for (const mod of modules) {
      const tableName = await ensureCategoryTable(pool, mod.id)
      const [products] = await pool.execute(
        `SELECT id, product_id AS productId, name, name_en AS nameEn, description, image, price, unit, capacity, highlight, sort_order FROM \`${tableName}\` ORDER BY sort_order ASC`
      )
      for (const p of products) {
        allProducts.push({ ...p, categoryId: mod.id })
      }
    }
    res.json({ success: true, data: { modules, products: allProducts } })
  } catch (error) {
    console.error('查询商品列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/admin/products
 * 新增商品（插入到对应种类的独立表）
 */
router.post('/products', async (req, res) => {
  try {
    const { categoryId, productId, name, nameEn, description, image, price, unit, capacity, highlight, sortOrder } = req.body
    if (!categoryId || !productId || !name) {
      return res.status(400).json({ success: false, message: 'categoryId、productId、name 为必填项' })
    }
    const tableName = await ensureCategoryTable(pool, categoryId)
    await pool.execute(
      `INSERT INTO \`${tableName}\` (product_id, name, name_en, description, image, price, unit, capacity, highlight, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, name, nameEn || '', description || '', image || '', price || 0, unit || '€', capacity || '', highlight || '', sortOrder || 0]
    )
    res.json({ success: true, message: '商品创建成功' })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '该分类下已存在相同 product_id 的商品' })
    }
    console.error('创建商品失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * PUT /api/admin/products/:id
 * 更新商品（需传 categoryId 确定对应表）
 */
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId, productId, name, nameEn, description, image, price, unit, capacity, highlight, sortOrder } = req.body
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'categoryId 为必填项' })
    }
    const tableName = await ensureCategoryTable(pool, categoryId)
    const [result] = await pool.execute(
      `UPDATE \`${tableName}\` SET product_id=?, name=?, name_en=?, description=?, image=?, price=?, unit=?, capacity=?, highlight=?, sort_order=?
       WHERE id=?`,
      [productId, name, nameEn || '', description || '', image || '', price || 0, unit || '€', capacity || '', highlight || '', sortOrder || 0, id]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    res.json({ success: true, message: '商品更新成功' })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '该分类下已存在相同 product_id 的商品' })
    }
    console.error('更新商品失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * DELETE /api/admin/products/:id
 * 删除商品（需传 categoryId 确定对应表）
 */
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { categoryId } = req.body
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'categoryId 为必填项' })
    }
    const tableName = getCategoryTable(categoryId)
    const [result] = await pool.execute(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    res.json({ success: true, message: '商品删除成功' })
  } catch (error) {
    console.error('删除商品失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

// ==================== 模块管理 ====================

/**
 * GET /api/admin/product-modules
 * 获取所有商品模块
 */
router.get('/product-modules', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, name_en AS nameEn, image, description, sort_order FROM product_modules ORDER BY sort_order ASC'
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('查询模块列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/admin/product-modules
 * 新增模块
 */
router.post('/product-modules', async (req, res) => {
  try {
    const { id, name, nameEn, image, description, sortOrder } = req.body
    if (!id || !name) {
      return res.status(400).json({ success: false, message: 'id、name 为必填项' })
    }
    await pool.execute(
      'INSERT INTO product_modules (id, name, name_en, image, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, nameEn || '', image || '', description || '', sortOrder || 0]
    )
    res.json({ success: true, message: '模块创建成功' })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '该模块 ID 已存在' })
    }
    console.error('创建模块失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * PUT /api/admin/product-modules/:id
 * 更新模块
 */
router.put('/product-modules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, nameEn, image, description, sortOrder } = req.body
    const [result] = await pool.execute(
      'UPDATE product_modules SET name=?, name_en=?, image=?, description=?, sort_order=? WHERE id=?',
      [name, nameEn || '', image || '', description || '', sortOrder || 0, id]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '模块不存在' })
    }
    res.json({ success: true, message: '模块更新成功' })
  } catch (error) {
    console.error('更新模块失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * DELETE /api/admin/product-modules/:id
 * 删除模块（同时删除其下所有商品）
 */
router.delete('/product-modules/:id', async (req, res) => {
  try {
    const { id } = req.params
    // 删除对应的独立商品表
    const tableName = getCategoryTable(id)
    await pool.execute(`DROP TABLE IF EXISTS \`${tableName}\``)
    // 删除种类记录
    const [result] = await pool.execute('DELETE FROM product_modules WHERE id = ?', [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '种类不存在' })
    }
    res.json({ success: true, message: '种类及其商品已删除' })
  } catch (error) {
    console.error('删除种类失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router
