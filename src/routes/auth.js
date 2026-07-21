const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'

// 管理员账号
const ADMIN_USERNAME = 'tongwei'
const ADMIN_PASSWORD = 'TongWei131700'

/**
 * POST /api/auth/admin-login
 * 管理员登录
 */
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { role: 'admin', username },
      JWT_SECRET,
      { expiresIn: '24h' }
    )
    return res.json({
      success: true,
      message: '管理员登录成功',
      data: { token, username }
    })
  }

  return res.status(401).json({
    success: false,
    message: '用户名或密码错误'
  })
})

/**
 * POST /api/auth/register
 * 用户注册：手机号 + 密码 + 确认密码
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, password, confirmPassword } = req.body

    // 校验手机号格式（11位数字）
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的11位手机号码',
      })
    }

    // 校验密码
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6位',
      })
    }

    // 校验密码一致性
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: '两次输入的密码不一致',
      })
    }

    // 检查手机号是否已注册
    const [existing] = await pool.execute('SELECT id FROM users WHERE phone = ?', [phone])
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: '该手机号已注册，请直接登录',
      })
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 存入数据库
    const [result] = await pool.execute(
      'INSERT INTO users (phone, password) VALUES (?, ?)',
      [phone, hashedPassword]
    )

    // 生成 JWT token
    const token = jwt.sign(
      { userId: result.insertId, phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        id: result.insertId,
        phone,
        token,
      },
    })
  } catch (error) {
    console.error('注册接口错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
    })
  }
})

/**
 * POST /api/auth/login
 * 用户登录：手机号 + 密码
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body

    // 校验手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的11位手机号码',
      })
    }

    // 校验密码
    if (!password) {
      return res.status(400).json({
        success: false,
        message: '请输入密码',
      })
    }

    // 查询用户
    const [users] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone])
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误',
      })
    }

    const user = users[0]

    // 比对密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '手机号或密码错误',
      })
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        id: user.id,
        phone: user.phone,
        token,
      },
    })
  } catch (error) {
    console.error('登录接口错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
    })
  }
})

/**
 * POST /api/auth/admin-login
 * 管理员登录：用户名 + 密码
 */
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { role: 'admin', username },
      jwtSecret,
      { expiresIn: '24h' }
    )
    return res.json({
      success: true,
      message: '管理员登录成功',
      data: { token, username }
    })
  }

  return res.status(401).json({
    success: false,
    message: '用户名或密码错误'
  })
})

module.exports = router
