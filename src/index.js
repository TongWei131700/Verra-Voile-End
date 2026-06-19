require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')
const reservationRouter = require('./routes/reservation')
const uploadRouter = require('./routes/upload')

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

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务
async function start() {
  try {
    await initDB()
    app.listen(PORT, () => {
      console.log(`✓ 服务已启动: http://localhost:${PORT}`)
      console.log(`  - POST /api/reservation  提交预约`)
      console.log(`  - GET  /api/reservation  查看预约列表`)
      console.log(`  - POST /api/upload        图片上传`)
      console.log(`  - GET  /health           健康检查`)
    })
  } catch (error) {
    console.error('启动失败:', error.message)
    process.exit(1)
  }
}

start()
