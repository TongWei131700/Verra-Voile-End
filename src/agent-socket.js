/**
 * AI Agent WebSocket 处理器
 * Socket.IO namespace: /agent
 * 实时推送 LLM 思考过程和流式回复
 */
const { runAgent, trimHistory } = require('./agent')
const { pool } = require('./db')
const { sendMail } = require('./routes/mailer')
const { randomUUID } = require('node:crypto')
const { sessions } = require('./agent/sessions')
const { AgentError } = require('./agent/harness')

// 已通知过的用户（避免同一用户重复发邮件）
const notifiedUsers = new Set()

/**
 * 初始化 Agent WebSocket 服务
 * @param {import('socket.io').Server} mainIo 主 Socket.IO 实例
 */
function initAgentSocket(mainIo) {
  const agentNs = mainIo.of('/agent')

  agentNs.on('connection', (socket) => {
    console.log('🤵 Agent 客户端连接')
    // 保存用户标识到 socket
    socket.data = socket.data || {}
    socket.data.userToken = socket.handshake.auth?.userToken || 'anonymous'

    socket.on('chat', async (data) => {
      if (socket.data.agentController) { socket.emit('agent_busy', { code: 'SESSION_BUSY' }); return }
      let { message, sessionId, mediaId } = data || {}
      if (typeof message !== 'string' || !message.trim() || message.length > 8000) {
        socket.emit('agent_event', { type: 'error', content: '消息为空或超过长度限制', code: 'INVALID_INPUT' }); return
      }
      if (mediaId != null && (typeof mediaId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(mediaId))) {
        socket.emit('agent_event', { type: 'error', content: '媒体编号无效', code: 'INVALID_INPUT' }); return
      }

      const sid = sessionId ?? randomUUID()
      const controller = new AbortController()
      socket.data.agentController = controller
      let release

      try {
        release = sessions.acquire(sid)
        const session = sessions.get(sid)
        const history = session ? session.history : []

        // 如果携带了 mediaId，追加到消息中供 Agent 识别
        let agentMessage = message.trim()
        if (mediaId) {
          agentMessage += `\n\n[用户已上传婚礼媒体文件，mediaId: ${mediaId}，请先调用 analyze_wedding_visuals 工具分析视觉要素，再根据分析结果推荐商品]`
        }

        // 运行 Agent，每个事件实时推送给前端
        const { reply, history: newHistory } = await runAgent(
          agentMessage,
          history,
          (event) => {
            if (socket.connected && !controller.signal.aborted) socket.emit('agent_event', event)
          },
          { signal: controller.signal }
        )
        if (controller.signal.aborted) return

        // 更新会话（保留最近 20 条）
        sessions.set(sid, {
          history: trimHistory(newHistory),
          lastActive: Date.now(),
        })

        socket.emit('agent_session', { sessionId: sid })
        release(); release = null
        if (socket.data.agentController === controller) socket.data.agentController = null

        // 审计与旧通知逻辑不再持有执行锁，避免数据库延迟阻塞下一轮。
        const userToken = socket.data?.userToken || 'anonymous'
        const thinkingLabels = []
        // 从 history 中提取思考步骤
        for (const msg of newHistory) {
          if (msg.role === 'assistant' && msg.content) {
            thinkingLabels.push(msg.content)
          }
        }
        try {
          await pool.execute(
            'INSERT INTO agent_conversations (session_id, user_token, user_message, ai_reply, thinking_steps) VALUES (?, ?, ?, ?, ?)',
            [sid, userToken, message.trim(), reply, JSON.stringify(thinkingLabels.slice(0, 5))]
          )

          // 检查是否是该用户的第一条消息 → 发邮件通知
          if (!notifiedUsers.has(userToken)) {
            const [cntRows] = await pool.execute(
              'SELECT COUNT(*) as cnt FROM agent_conversations WHERE user_token = ?',
              [userToken]
            )
            if (cntRows[0].cnt === 1) {
              notifiedUsers.add(userToken)
              const isGuest = userToken.startsWith('guest_')
              const userLabel = isGuest ? `访客 (${userToken})` : `用户 (${userToken})`
              const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
              const html = `
                <h3>🤖 AI 助手新用户消息</h3>
                <p><b>${userLabel}</b> 首次使用了 AI 婚礼规划助手！</p>
                <p><b>时间:</b> ${time}</p>
                <p><b>用户提问:</b> ${message.trim().substring(0, 200)}</p>
                <hr/>
                <p><b>AI 回复摘要:</b></p>
                <div style="background:#f5f5f5;padding:12px;border-radius:6px;max-height:200px;overflow:auto">${reply.substring(0, 500)}</div>
              `
              sendMail(`🤖 AI 助手新用户 - ${userLabel}`, html).catch(e => console.error('[Agent] 通知邮件发送失败:', e.message))
              console.log(`[Agent] 📧 已发送新用户通知: ${userToken}`)
            } else {
              // 数据库中已有记录，标记为已通知
              notifiedUsers.add(userToken)
            }
          }
        } catch (dbErr) {
          console.error('[Agent] 保存对话失败:', dbErr.message)
        }

      } catch (err) {
        if (!socket.connected) return
        socket.emit('agent_event', {
          type: 'error',
          content: err instanceof AgentError ? err.message : 'AI 服务暂时不可用，请稍后再试。',
          code: err.code || 'AGENT_FAILED',
        })
      } finally { release?.(); if (socket.data.agentController === controller) socket.data.agentController = null }
    })

    socket.on('clear', () => {
      // 清除由前端传 sessionId 处理，这里不主动删
    })

    socket.on('cancel', () => { socket.data.agentController?.abort() })
    socket.on('disconnect', () => {
      socket.data.agentController?.abort()
      console.log('🤵 Agent 客户端断开')
    })
  })

  console.log('✓ Agent WebSocket 服务已启动 (/agent)')
  return agentNs
}

module.exports = { initAgentSocket }
