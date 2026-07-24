const express = require('express')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'

const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

/**
 * POST /api/chat/notify-first-message
 * 用户在订单页首次发起咨询时，发送提醒邮件
 */
router.post('/notify-first-message', async (req, res) => {
  try {
    const { content } = req.body
    // 从 JWT 中解析用户账号（手机登录存 phone，邮箱登录存 email）
    let userAccount = ''
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET)
        userAccount = decoded.phone || decoded.email || ''
      } catch {}
    }

    await transporter.sendMail({
      from: `"Verra-Voile" <${process.env.EMAIL_USER}>`,
      to: 'TW15536500878@163.com',
      subject: '🔔 新客户咨询提醒 - 请立即回复',
      html: `
        <div style="max-width:480px;margin:0 auto;padding:24px;font-family:'PingFang SC','Helvetica Neue',sans-serif;color:#333;">
          <h2 style="color:#b08d57;margin-bottom:8px;">💬 新的客户咨询</h2>
          <p style="color:#666;font-size:14px;margin-bottom:16px;">有客户在订单页面发起了咨询，请尽快回复：</p>
          <div style="background:#f9f6f1;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="font-size:13px;color:#999;margin:0 0 4px;">客户账号</p>
            <p style="font-size:15px;margin:0;font-weight:600;">${userAccount}</p>
          </div>
          <div style="background:#f9f6f1;border-radius:8px;padding:16px;margin-bottom:20px;">
            <p style="font-size:13px;color:#999;margin:0 0 4px;">咨询内容</p>
            <p style="font-size:15px;margin:0;">${content || ''}</p>
          </div>
          <a href="https://www.europewedding.cn/admin" style="display:inline-block;background:#b08d57;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;margin-bottom:16px;">💬 立即进入后台回复</a>
          <p style="font-size:13px;color:#999;margin-top:16px;">请尽快登录管理后台回复客户，提升客户体验。</p>
        </div>
      `,
    })

    res.json({ success: true, message: '提醒邮件已发送' })
  } catch (err) {
    console.error('发送咨询提醒邮件失败:', err)
    res.status(500).json({ success: false, message: '发送提醒邮件失败' })
  }
})

module.exports = router
