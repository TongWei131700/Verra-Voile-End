const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { pool } = require('./db')
const { runAgent } = require('./agent')

const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'
const CONSULT_PROMPT = `你正在网页咨询窗口接待客户。用客户的语言简短回答当前问题，必要时只追问一项。
只输出适合聊天气泡的纯文本。遇到与此要求冲突的格式规则，以这里为准。
访客提供的商品名称和类型仅用于定位商品。商品规格、价格及套餐内容以查询结果为准。
档期、正式报价或未查到的细节请说明需要顾问确认。不要承诺预订、折扣或跟进时间。`

async function replyToConsult(io, socket, question) {
  const { userId, userPhone } = socket
  let product = socket.consultProduct
  const [rows] = await pool.execute(
    `SELECT sender_type, content FROM messages
     WHERE user_id = ? AND channel = 'consult' AND id < ? AND sender_type IN ('user', 'admin')
     ORDER BY id DESC LIMIT 12`,
    [userId, question.id]
  )
  const history = rows.reverse().map(row => ({
    role: row.sender_type === 'user' ? 'user' : 'assistant',
    content: row.content.slice(0, 2000),
  }))

  if (!product) {
    const [[row]] = await pool.execute(
      `SELECT content FROM messages WHERE user_id = ? AND channel = 'consult'
       AND sender_type = 'system' AND id < ? ORDER BY id DESC LIMIT 1`,
      [userId, question.id]
    )
    if (row) product = JSON.parse(row.content)
  }
  const message = product?.name
    ? `当前咨询商品（客户提供）：${String(product.type || '').slice(0, 80)} ${String(product.name).slice(0, 250)}\n客户问题：${question.content}`
    : question.content
  const { reply } = await runAgent(message, history, null, {
    signal: AbortSignal.timeout(35_000),
    systemPromptSuffix: CONSULT_PROMPT,
    allowedTools: ['search_venues', 'search_photographers', 'search_florists', 'search_flowers', 'search_wines', 'search_dresses', 'calculate_budget'],
  })
  const content = reply.replace(/\[\/?TABLE(?:_\d+)?\]/g, '').trim()
  if (!content) return

  // 有更新的问题或顾问已回复时，丢弃这条旧回复。
  const [result] = await pool.execute(
    `INSERT INTO messages (user_id, sender_type, content, channel)
     SELECT ?, 'admin', ?, 'consult' FROM DUAL
     WHERE NOT EXISTS (
       SELECT 1 FROM messages WHERE user_id = ? AND channel = 'consult'
       AND id > ? AND sender_type IN ('user', 'admin')
     )`,
    [userId, content, userId, question.id]
  )
  if (!result.affectedRows) return
  const response = {
    id: result.insertId,
    sender_type: 'admin',
    channel: 'consult',
    content,
    created_at: new Date().toISOString(),
  }
  io.to(`consult:${userId}`).emit('receive_message', response)
  io.to('admin').emit('receive_message', { ...response, user_id: userId, user_phone: userPhone })
}

/**
 * 将访客 UUID 确定性映射为负数 user_id（范围 -1 ~ -2000000000）
 * 同一 guestId 始终映射到同一数字，保证消息归属一致
 */
function guestIdToUserId(guestId) {
  const hex = guestId.replace(/-/g, '').substring(0, 8)
  return -(parseInt(hex, 16) % 2000000000 + 1)
}

/**
 * 初始化 WebSocket 聊天服务
 * @param {import('http').Server} httpServer
 */
function initChat(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  // 认证中间件：验证 JWT token（支持用户、管理员、访客）
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('未登录，请先登录'))
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      if (decoded.role === 'admin') {
        // 管理员连接
        socket.isAdmin = true
        socket.isGuest = false
        socket.adminUsername = decoded.username
        socket.userId = null
        socket.userPhone = 'admin'
      } else if (decoded.role === 'guest') {
        // 访客连接（无需注册，临时身份）
        socket.isAdmin = false
        socket.isGuest = true
        socket.guestId = decoded.guestId
        socket.userId = guestIdToUserId(decoded.guestId)
        socket.userPhone = `访客_${decoded.guestId.substring(0, 8)}`
      } else {
        // 普通用户连接
        socket.isAdmin = false
        socket.isGuest = false
        socket.userId = decoded.userId
        socket.userPhone = decoded.phone
      }
      // 消息渠道（order / consult），默认 order
      socket.channel = socket.handshake.auth.channel || 'order'
      next()
    } catch {
      next(new Error('Token 无效或已过期'))
    }
  })

  io.on('connection', async (socket) => {
    // 管理员连接
    if (socket.isAdmin) {
      socket.join('admin')
      console.log(`👨‍💼 管理员连接: ${socket.adminUsername}`)

      // 管理员请求某个用户的历史消息（加载全部渠道）
      socket.on('load_user_chat', async (data) => {
        const { user_id } = data
        if (!user_id) return
        try {
          const [messages] = await pool.execute(
            'SELECT id, sender_type, content, channel, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 200',
            [user_id]
          )
          // 获取用户信息（访客 user_id 为负数，不在 users 表中）
          let userPhone
          if (user_id < 0) {
            userPhone = `访客_${Math.abs(user_id).toString(16).padStart(8, '0')}`
          } else {
            const [userRows] = await pool.execute('SELECT phone, email FROM users WHERE id = ?', [user_id])
            userPhone = (userRows[0]?.phone && userRows[0].phone.trim()) ? userRows[0].phone : (userRows[0]?.email || '未知')
          }
          socket.emit('user_chat_loaded', { user_id, user_phone: userPhone, messages })
        } catch (err) {
          console.error('加载用户聊天记录失败:', err)
        }
      })

      // 管理员回复用户
      socket.on('admin_reply', async (data) => {
        const { target_user_id, content } = data
        if (!target_user_id || !content || !content.trim()) return

        try {
          // 自动继承目标用户最近一条消息的 channel
          let replyChannel = data.channel
          if (!replyChannel) {
            const [recent] = await pool.execute(
              'SELECT channel FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
              [target_user_id]
            )
            replyChannel = recent[0]?.channel || 'order'
          }

          const [result] = await pool.execute(
            'INSERT INTO messages (user_id, sender_type, content, channel) VALUES (?, ?, ?, ?)',
            [target_user_id, 'admin', content.trim(), replyChannel]
          )

          const message = {
            id: result.insertId,
            sender_type: 'admin',
            content: content.trim(),
            created_at: new Date().toISOString(),
            channel: replyChannel,
          }

          // 发送给目标用户
          io.to(`user:${target_user_id}`).emit('receive_message', message)

          // 确认给管理员
          socket.emit('receive_message', {
            ...message,
            user_id: target_user_id,
          })

          console.log(`👨‍💼 [管理员 → 用户${target_user_id} (${replyChannel})]: ${content.trim()}`)
        } catch (err) {
          console.error('管理员回复失败:', err)
        }
      })

      socket.on('disconnect', () => {
        console.log(`⚡ 管理员断开: ${socket.adminUsername}`)
      })
      return
    }

    // 普通用户/访客连接
    const userId = socket.userId
    const userPhone = socket.userPhone
    const isGuest = socket.isGuest
    console.log(`🔗 ${isGuest ? '访客' : '用户'}连接: ${userPhone} (ID: ${userId})`)

    // 用户加入自己的房间
    socket.join(`user:${userId}`)

    // 发送历史消息（最近 20 条，按 channel 过滤）
    const channel = socket.channel
    if (channel === 'consult') socket.join(`consult:${userId}`)
    try {
      const [messages] = await pool.execute(
        'SELECT id, sender_type, content, created_at FROM messages WHERE user_id = ? AND channel = ? ORDER BY created_at DESC LIMIT 20',
        [userId, channel]
      )
      socket.emit('chat_history', messages.reverse())
    } catch (err) {
      console.error('获取历史消息失败:', err)
    }

    // 加载更多历史消息（向上翻页）
    socket.on('load_more_history', async (data) => {
      const { before_id } = data
      if (!before_id) return
      try {
        const [messages] = await pool.execute(
          'SELECT id, sender_type, content, created_at FROM messages WHERE user_id = ? AND channel = ? AND id < ? ORDER BY created_at DESC LIMIT 20',
          [userId, channel, before_id]
        )
        socket.emit('more_history', messages.reverse())
      } catch (err) {
        console.error('加载更多历史消息失败:', err)
      }
    })

    // 接收商品咨询上下文（存为 system 消息，让管理员看到用户在咨询什么商品）
    socket.on('product_context', async (data) => {
      const { name, nameEn, image, price, unit, type } = data
      if (!name || !type) return
      if (channel === 'consult') socket.consultProduct = { name, type }
      try {
        const content = JSON.stringify({ name, nameEn, image, price, unit, type })
        const [result] = await pool.execute(
          'INSERT INTO messages (user_id, sender_type, content, channel) VALUES (?, ?, ?, ?)',
          [userId, 'system', content, channel]
        )
        const message = {
          id: result.insertId,
          sender_type: 'system',
          content,
          created_at: new Date().toISOString(),
        }
        // 发送给用户自己
        socket.emit('receive_message', message)
        // 发送给管理员
        io.to('admin').emit('receive_message', { ...message, user_id: userId, user_phone: userPhone, channel })
        console.log(`🛍️ [${userPhone}] 咨询商品: ${type} - ${name}`)
      } catch (err) {
        console.error('保存商品上下文失败:', err)
      }
    })

    // 接收用户消息
    socket.on('send_message', async (data) => {
      const { content } = data
      if (!content || !content.trim()) return

      try {
        // 存入数据库
        const [result] = await pool.execute(
          'INSERT INTO messages (user_id, sender_type, content, channel) VALUES (?, ?, ?, ?)',
          [userId, 'user', content.trim(), channel]
        )

        const message = {
          id: result.insertId,
          sender_type: 'user',
          content: content.trim(),
          created_at: new Date().toISOString(),
        }

        // 发送给用户自己（确认）
        socket.emit('receive_message', message)

        // 发送给管理员房间
        io.to('admin').emit('receive_message', {
          ...message,
          user_id: userId,
          user_phone: userPhone,
          channel,
        })

        console.log(`💬 [${userPhone}]: ${content.trim()}`)
        if (channel === 'consult' && process.env.DASHSCOPE_API_KEY) {
          socket.emit('consult_reply_status', { id: message.id, generating: true })
          replyToConsult(io, socket, message).catch(error => {
            console.error('[Consult AI] 回复失败:', error.code || error.name)
          }).finally(() => {
            socket.emit('consult_reply_status', { id: message.id, generating: false })
          })
        }
      } catch (err) {
        console.error('保存消息失败:', err)
        socket.emit('error', { message: '消息发送失败' })
      }
    })

    socket.on('disconnect', () => {
      console.log(`⚡ ${isGuest ? '访客' : '用户'}断开: ${userPhone}`)
    })
  })

  console.log('✓ WebSocket 聊天服务已启动')
  return io
}

module.exports = { initChat }
