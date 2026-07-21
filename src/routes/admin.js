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
      'SELECT id, phone, created_at FROM users ORDER BY created_at DESC'
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

module.exports = router
