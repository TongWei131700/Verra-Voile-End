require('dotenv').config()

const http = require('http')
const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')
const { initChat } = require('./chat')
const reservationRouter = require('./routes/reservation')
const uploadRouter = require('./routes/upload')
const authRouter = require('./routes/auth')
const adminRouter = require('./routes/admin')
const cartRouter = require('./routes/cart')

const app = express()
const PORT = process.env.PORT || 3000

// 中间件
app.use(cors())
app.use(express.json())

// 静态文件托管（上传图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// 路由
app.use('/api/reservation', reservationRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/cart', cartRouter)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务
async function start() {
  try {
    await initDB()
    const server = http.createServer(app)
    initChat(server)
    server.listen(PORT, () => {
      console.log(`✓ 服务已启动: http://localhost:${PORT}`)
      console.log(`  - POST /api/reservation  提交预约`)
      console.log(`  - GET  /api/reservation  查看预约列表`)
      console.log(`  - POST /api/upload        图片上传`)
      console.log(`  - POST /api/auth/register 用户注册`)
      console.log(`  - POST /api/auth/login    用户登录`)
      console.log(`  - POST /api/auth/send-code    发送验证码`)
      console.log(`  - POST /api/auth/login-by-code 验证码登录`)
      console.log(`  - WebSocket              实时聊天`)
      console.log(`  - GET  /api/cart          获取购物车`)
      console.log(`  - POST /api/cart/sync     同步购物车`)
      console.log(`  - GET  /health           健康检查`)
    })
  } catch (error) {
    console.error('启动失败:', error.message)
    process.exit(1)
  }
}

start()
