const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按年月分目录
    const now = new Date()
    const subDir = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const dir = path.join(uploadDir, subDir)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    // 时间戳 + 随机数 + 原始扩展名
    const ext = path.extname(file.originalname) || '.png'
    const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 最大 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i
    if (allowed.test(path.extname(file.originalname)) || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('仅支持图片文件'))
    }
  },
})

/**
 * POST /api/upload
 * 上传图片，返回访问地址
 */
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择图片文件' })
  }

  // 构造访问路径
  const relativePath = path.relative(uploadDir, req.file.path).replace(/\\/g, '/')
  const url = `/uploads/${relativePath}`

  res.json({
    success: true,
    data: {
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  })
})

/**
 * POST /api/upload/multiple
 * 批量上传（最多 10 张）
 */
router.post('/multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: '请选择图片文件' })
  }

  const results = req.files.map((file) => {
    const relativePath = path.relative(uploadDir, file.path).replace(/\\/g, '/')
    return {
      url: `/uploads/${relativePath}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    }
  })

  res.json({ success: true, data: results })
})

// 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件大小不能超过 10MB' })
    }
    return res.status(400).json({ success: false, message: err.message })
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
  next()
})

module.exports = router
