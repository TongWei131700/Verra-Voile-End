const express = require('express')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')

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
 * 获取有聊天记录的用戶列表（含最后一条消息和时间）
 */
router.get('/chat-users', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
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
    res.json({ success: true, data: rows })
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
      'SELECT category_id, product_id, name, name_en, price, unit, created_at FROM user_selected_products WHERE user_id = ? ORDER BY created_at ASC',
      [req.params.userId]
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('查询用户商品失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router
