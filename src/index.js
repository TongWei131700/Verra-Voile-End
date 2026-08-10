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
const chatNotifyRouter = require('./routes/chat')
const productsRouter = require('./routes/products')
const versionRouter = require('./routes/version')
const crawlRouter = require('./routes/crawl')
const dataVersionRouter = require('./routes/dataVersion')
const imageProxyRouter = require('./routes/imageProxy')

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
app.use('/api/chat', chatNotifyRouter)
app.use('/api/products', productsRouter)
app.use('/api/version', versionRouter)
app.use('/api/crawl', crawlRouter)
app.use('/api/data-version', dataVersionRouter)
app.use('/api/image-proxy', imageProxyRouter)

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
      console.log(`  - POST /api/crawl/start    触发爬取任务`)
      console.log(`  - GET  /api/crawl/state    查看爬取状态`)
      console.log(`  - GET  /api/image-proxy    图片代理`)
    })
  } catch (error) {
    console.error('启动失败:', error.message)
    process.exit(1)
  }
}

start()
