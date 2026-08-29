/**
 * AI Agent REST API 路由
 * POST /api/agent/chat - 发送消息，获取 AI 回复（含思考过程）
 */
const express = require('express')
const { runAgent } = require('../agent')
const { sendMail } = require('./mailer')

const router = express.Router()

// 内存会话存储
const sessions = new Map()
const SESSION_TTL = 30 * 60 * 1000

/**
 * POST /api/agent/chat
 * Body: { message: string, sessionId?: string }
 * Response: { reply: string, thinking: string, sessionId: string }
 */
router.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({ error: '消息不能为空' })
  }

  const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  try {
    const session = sessions.get(sid)
    const history = session ? session.history : []

    // 收集思考步骤
    const thinkingSteps = []
    const { reply, history: newHistory } = await runAgent(
      message.trim(),
      history,
      (step) => {
        console.log('[Agent] 思考步骤:', step)
        thinkingSteps.push(step)
      }
    )

    console.log('[Agent] 思考步骤收集完毕:', thinkingSteps)
    console.log('[Agent] reply 长度:', reply.length)

    // 更新会话历史
    sessions.set(sid, {
      history: newHistory.slice(-20),
      lastActive: Date.now(),
    })

    res.json({
      reply,
      thinkingSteps,  // 返回数组，方便前端看到每一条
      thinking: thinkingSteps.join('\n'),
      sessionId: sid,
    })
  } catch (err) {
    console.error('[Agent] 错误:', err.message)
    res.status(500).json({ error: 'AI 服务暂时不可用，请稍后再试' })
  }
})

/**
 * POST /api/agent/clear
 * Body: { sessionId: string }
 */
router.post('/clear', (req, res) => {
  const { sessionId } = req.body
  if (sessionId) {
    sessions.delete(sessionId)
  }
  res.json({ success: true })
})

/**
 * POST /api/agent/feedback
 * Body: { token, rating: 'up'|'down', comment?: string, context?: string }
 */
router.post('/feedback', async (req, res) => {
  const { token, rating, comment, context } = req.body
  if (!rating) return res.status(400).json({ error: '缺少评价信息' })

  const ratingLabel = rating === 'up' ? '👍 有帮助' : '👎 没帮助'
  const userId = token || '匿名'
  const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

  const html = `
    <h3>AI 助手用户反馈</h3>
    <p><b>评价:</b> ${ratingLabel}</p>
    <p><b>用户标识:</b> ${userId}</p>
    <p><b>时间:</b> ${time}</p>
    ${comment ? `<p><b>反馈内容:</b> ${comment}</p>` : ''}
    ${context ? `<hr/><p><b>AI 回复摘要:</b></p><div style="background:#f5f5f5;padding:12px;border-radius:6px;max-height:200px;overflow:auto">${context.substring(0, 500)}</div>` : ''}
  `

  try {
    await sendMail(`🤖 AI 助手反馈 - ${ratingLabel}`, html)
    res.json({ success: true })
  } catch (err) {
    console.error('[Agent] 反馈邮件发送失败:', err.message)
    res.status(500).json({ error: '发送失败，请稍后再试' })
  }
})

// 定时清理过期会话（每 10 分钟）
setInterval(() => {
  const now = Date.now()
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastActive > SESSION_TTL) {
      sessions.delete(key)
    }
  }
}, 10 * 60 * 1000)

module.exports = router
