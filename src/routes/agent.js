/**
 * AI Agent REST API 路由
 * POST /api/agent/chat - 发送消息，获取 AI 回复（含思考过程）
 */
const express = require('express')
const { runAgent, trimHistory } = require('../agent')
const { sendMail } = require('./mailer')
const { randomUUID } = require('node:crypto')
const { sessions } = require('../agent/sessions')
const { AgentError } = require('../agent/harness')

const router = express.Router()


/**
 * POST /api/agent/chat
 * Body: { message: string, sessionId?: string }
 * Response: { reply: string, thinking: string, sessionId: string }
 */
router.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body || {}

  if (typeof message !== 'string' || !message.trim() || message.length > 8000) {
    return res.status(400).json({ error: '消息为空或超过长度限制', code: 'INVALID_INPUT' })
  }

  const sid = sessionId ?? randomUUID()
  const controller = new AbortController()
  const cancel = () => { if (!res.writableEnded) controller.abort() }
  res.on('close', cancel)
  let release

  try {
    release = sessions.acquire(sid)
    const session = sessions.get(sid)
    const history = session ? session.history : []

    // 收集思考步骤
    const thinkingSteps = []
    const { reply, history: newHistory } = await runAgent(
      message.trim(),
      history,
      (step) => {
        if (step.type === 'thinking') thinkingSteps.push(step)
      },
      { signal: controller.signal }
    )

    if (controller.signal.aborted) return

    // 更新会话历史
    sessions.set(sid, {
      history: trimHistory(newHistory),
      lastActive: Date.now(),
    })

    res.json({
      reply,
      thinkingSteps,  // 返回数组，方便前端看到每一条
      thinking: thinkingSteps.map(step => step.label).join('\n'),
      sessionId: sid,
    })
  } catch (err) {
    if (!controller.signal.aborted && !res.headersSent) res.status(err instanceof AgentError ? err.status : 503).json({ error: err instanceof AgentError ? err.message : 'AI 服务暂时不可用，请稍后再试', code: err.code || 'AGENT_FAILED' })
  } finally { release?.(); res.off('close', cancel) }
})

/**
 * POST /api/agent/clear
 * Body: { sessionId: string }
 */
router.post('/clear', (req, res) => {
  try {
    const { sessionId } = req.body || {}
    if (sessionId) sessions.clear(sessionId)
    res.json({ success: true })
  } catch (error) { res.status(error.status || 400).json({ error: error.message, code: error.code }) }
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

module.exports = router
