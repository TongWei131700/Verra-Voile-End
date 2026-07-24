const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
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
    const { phone, email, password, confirmPassword } = req.body

    // 校验手机号格式（11位数字）
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的11位手机号码',
      })
    }

    // 校验邮箱格式（如果提供了邮箱）
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址',
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
        code: 'ALREADY_REGISTERED',
      })
    }

    // 检查邮箱是否已注册（如果提供了邮箱）
    if (email) {
      const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: '该邮箱已注册，请直接登录',
          code: 'EMAIL_ALREADY_REGISTERED',
        })
      }
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 存入数据库
    const [result] = await pool.execute(
      'INSERT INTO users (phone, email, password) VALUES (?, ?, ?)',
      [phone, email || null, hashedPassword]
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
        email: email || null,
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
      return res.status(404).json({
        success: false,
        message: '该手机号未注册，请先注册',
        code: 'NOT_REGISTERED',
      })
    }

    const user = users[0]

    // 比对密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '密码错误，请重新输入',
        code: 'WRONG_PASSWORD',
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
 * POST /api/auth/send-code
 * 发送验证码（本地调试模式：验证码打印到控制台）
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body

    // 校验手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的11位手机号码',
      })
    }

    // 检查发送频率（60秒内只能发一次）
    const [recent] = await pool.execute(
      'SELECT id FROM verification_codes WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) ORDER BY id DESC LIMIT 1',
      [phone]
    )
    if (recent.length > 0) {
      return res.status(429).json({
        success: false,
        message: '发送太频繁，请60秒后再试',
      })
    }

    // 生成6位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // 存入数据库，5分钟有效
    await pool.execute(
      'INSERT INTO verification_codes (phone, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [phone, code]
    )

    // TODO: 接入真实短信服务（阿里云/Twilio）
    // 本地调试：打印到控制台
    console.log(`\n📱 [短信验证码] 手机号: ${phone}  验证码: ${code}\n`)

    res.json({
      success: true,
      message: '验证码已发送',
    })
  } catch (error) {
    console.error('发送验证码错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
    })
  }
})

/**
 * POST /api/auth/login-by-code
 * 验证码登录（如果手机号未注册则自动注册）
 */
router.post('/login-by-code', async (req, res) => {
  try {
    const { phone, code } = req.body

    // 校验手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的11位手机号码',
      })
    }

    // 校验验证码
    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: '请输入6位验证码',
      })
    }

    // 查询验证码是否有效
    const [codes] = await pool.execute(
      'SELECT id FROM verification_codes WHERE phone = ? AND code = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [phone, code]
    )
    if (codes.length === 0) {
      return res.status(401).json({
        success: false,
        message: '验证码无效或已过期',
      })
    }

    // 标记验证码已使用
    await pool.execute('UPDATE verification_codes SET used = 1 WHERE id = ?', [codes[0].id])

    // 查询用户是否存在，不存在则自动注册
    let [users] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone])
    let userId
    if (users.length === 0) {
      // 自动注册（验证码登录无需密码）
      const [result] = await pool.execute(
        'INSERT INTO users (phone, password) VALUES (?, ?)',
        [phone, '']
      )
      userId = result.insertId
    } else {
      userId = users[0].id
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId, phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        id: userId,
        phone,
        token,
      },
    })
  } catch (error) {
    console.error('验证码登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
    })
  }
})

/**
 * POST /api/auth/send-email-code
 * 发送邮箱验证码
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

router.post('/send-email-code', async (req, res) => {
  try {
    const { email } = req.body

    // 校验邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址',
      })
    }

    // 检查发送频率（60秒内只能发一次）
    const [recent] = await pool.execute(
      "SELECT id FROM verification_codes WHERE phone = ? AND type = 'email' AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) ORDER BY id DESC LIMIT 1",
      [email]
    )
    if (recent.length > 0) {
      return res.status(429).json({
        success: false,
        message: '发送太频繁，请60秒后再试',
      })
    }

    // 生成6位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // 存入数据库，5分钟有效
    await pool.execute(
      "INSERT INTO verification_codes (phone, code, type, expires_at) VALUES (?, ?, 'email', DATE_ADD(NOW(), INTERVAL 5 MINUTE))",
      [email, code]
    )

    // 发送邮件
    await transporter.sendMail({
      from: `"薇雅与轻纱" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '薇雅与轻纱 - 邮箱验证码',
      html: `
        <div style="font-family: 'Noto Serif SC', serif; padding: 40px; background: #faf7f2;">
          <div style="max-width: 480px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #d4b896;">
            <h2 style="color: #722f37; font-family: 'Great Vibes', cursive; font-size: 36px; margin-bottom: 20px;">Éternel Amour</h2>
            <p style="color: #3a3530; font-size: 16px; margin-bottom: 24px;">您的邮箱验证码是：</p>
            <div style="background: #722f37; color: #faf7f2; font-size: 32px; letter-spacing: 8px; padding: 16px; text-align: center; font-family: monospace;">${code}</div>
            <p style="color: #999; font-size: 13px; margin-top: 24px;">验证码5分钟内有效，请勿泄露给他人。</p>
          </div>
        </div>
      `,
    })

    console.log(`\n📧 [邮箱验证码] 邮箱: ${email}  验证码: ${code}\n`)

    res.json({
      success: true,
      message: '验证码已发送到您的邮箱',
    })
  } catch (error) {
    console.error('发送邮箱验证码错误:', error)
    res.status(500).json({
      success: false,
      message: '发送失败，请稍后重试',
    })
  }
})

/**
 * POST /api/auth/login-by-email
 * 邮箱验证码登录（如果邮箱未注册则自动注册）
 */
router.post('/login-by-email', async (req, res) => {
  try {
    const { email, code } = req.body

    // 校验邮箱
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址',
      })
    }

    // 校验验证码
    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: '请输入6位验证码',
      })
    }

    // 查询验证码是否有效
    const [codes] = await pool.execute(
      "SELECT id FROM verification_codes WHERE phone = ? AND code = ? AND type = 'email' AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1",
      [email, code]
    )
    if (codes.length === 0) {
      return res.status(401).json({
        success: false,
        message: '验证码无效或已过期',
      })
    }

    // 标记验证码已使用
    await pool.execute('UPDATE verification_codes SET used = 1 WHERE id = ?', [codes[0].id])

    // 查询用户是否存在（按邮箱查找），不存在则自动注册
    let [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email])
    let userId
    if (users.length === 0) {
      // 自动注册（邮箱验证码登录无需密码）
      const [result] = await pool.execute(
        'INSERT INTO users (phone, email, password) VALUES (?, ?, ?)',
        ['', email, '']
      )
      userId = result.insertId
    } else {
      userId = users[0].id
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: '登录成功',
      data: {
        id: userId,
        email,
        token,
      },
    })
  } catch (error) {
    console.error('邮箱验证码登录错误:', error)
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

module.exports = router
