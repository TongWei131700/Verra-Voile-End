const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { pool } = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'

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
            const [userRows] = await pool.execute('SELECT phone FROM users WHERE id = ?', [user_id])
            userPhone = userRows[0]?.phone || '未知'
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
