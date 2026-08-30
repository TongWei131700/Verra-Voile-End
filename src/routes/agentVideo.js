/**
 * AI Agent 视频/图片上传路由
 * - 视频：上传 → ffmpeg 提取关键帧 → 删除视频 → 保留关键帧
 * - 图片：上传 → 直接作为分析素材
 * - 定时清理临时文件（10 分钟过期）
 */
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const router = express.Router()

// 临时存储根目录
const TMP_BASE = path.join(__dirname, '../../uploads/tmp')
if (!fs.existsSync(TMP_BASE)) {
  fs.mkdirSync(TMP_BASE, { recursive: true })
}

// multer 配置：接受视频和图片
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const videoId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    req.videoId = videoId
    const dir = path.join(TMP_BASE, videoId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4'
    cb(null, `original${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|mkv|webm|m4v|jpg|jpeg|png|webp)$/i
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error('仅支持视频文件（mp4/mov/avi/mkv/webm）或图片文件（jpg/png/webp）'))
    }
  },
})

/**
 * POST /api/agent/upload-media
 * 上传视频或图片，提取关键帧
 * Response: { success, data: { videoId, type, keyframes, frameCount } }
 */
router.post('/upload-media', upload.single('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请选择文件' })
  }

  const videoId = req.videoId
  const filePath = req.file.path
  const framesDir = path.join(TMP_BASE, videoId, 'frames')
  fs.mkdirSync(framesDir, { recursive: true })

  const isVideo = req.file.mimetype.startsWith('video/')

  try {
    if (isVideo) {
      // ── 视频：ffmpeg 提取关键帧 ──
      // 策略1：场景检测（阈值 0.3）
      try {
        execSync(
          `ffmpeg -i "${filePath}" -vf "select='gt(scene,0.3)',scale=1280:-1" -vsync vfr -q:v 2 -frames:v 12 "${framesDir}/frame_%03d.jpg" -y 2>&1`,
          { timeout: 60000 }
        )
      } catch (e) {
        console.error('[upload-media] 场景检测失败:', e.message)
      }

      let frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg'))

      // 策略2：场景检测帧数不足 → 均匀采样兜底
      if (frames.length < 6) {
        // 清空之前的帧
        for (const f of fs.readdirSync(framesDir)) {
          fs.unlinkSync(path.join(framesDir, f))
        }

        try {
          // 获取视频时长
          const durOut = execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}" 2>&1`,
            { timeout: 10000 }
          ).toString().trim()
          const duration = parseFloat(durOut) || 60

          // 每 8 秒取一帧，至少 6 帧最多 12 帧
          const interval = Math.max(4, Math.min(duration / 8, duration / 6))
          execSync(
            `ffmpeg -i "${filePath}" -vf "fps=1/${interval},scale=1280:-1" -frames:v 12 -q:v 2 "${framesDir}/frame_%03d.jpg" -y 2>&1`,
            { timeout: 60000 }
          )
        } catch (e) {
          console.error('[upload-media] 均匀采样失败:', e.message)
        }

        frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg'))
      }

      // ✅ 立即删除视频文件（关键帧已提取完毕）
      try { fs.unlinkSync(filePath) } catch {}

      const keyframeUrls = frames
        .sort()
        .map(f => `/uploads/tmp/${videoId}/frames/${f}`)

      res.json({
        success: true,
        data: {
          videoId,
          type: 'video',
          keyframes: keyframeUrls,
          frameCount: keyframeUrls.length,
        },
      })
    } else {
      // ── 图片：直接复制到 frames 目录 ──
      const ext = path.extname(req.file.originalname) || '.jpg'
      const destPath = path.join(framesDir, `frame_001${ext}`)
      fs.copyFileSync(filePath, destPath)
      try { fs.unlinkSync(filePath) } catch {}

      res.json({
        success: true,
        data: {
          videoId,
          type: 'image',
          keyframes: [`/uploads/tmp/${videoId}/frames/frame_001${ext}`],
          frameCount: 1,
        },
      })
    }
  } catch (error) {
    console.error('[upload-media] 处理失败:', error.message)
    // 清理
    try { fs.rmSync(path.join(TMP_BASE, videoId), { recursive: true, force: true }) } catch {}
    res.status(500).json({ success: false, message: '文件处理失败，请重试' })
  }
})

/**
 * POST /api/agent/analyze-visuals
 * 分析关键帧，返回结构化婚礼要素（供前端预览或调试用）
 */
router.post('/analyze-visuals', express.json(), async (req, res) => {
  const { videoId } = req.body
  if (!videoId) return res.status(400).json({ success: false, message: '缺少 videoId' })

  const framesDir = path.join(TMP_BASE, videoId, 'frames')
  if (!fs.existsSync(framesDir)) {
    return res.status(404).json({ success: false, message: '关键帧不存在或已过期' })
  }

  try {
    const { analyzeVisuals } = require('../agent/tool-executor')
    const result = await analyzeVisuals({ video_id: videoId })
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('[analyze-visuals] 失败:', error.message)
    res.status(500).json({ success: false, message: '分析失败: ' + error.message })
  }
})

// ── 定时清理：删除超过 10 分钟的临时文件 ──
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 分钟扫描一次
const MAX_AGE = 10 * 60 * 1000         // 10 分钟过期

const cleanupTimer = setInterval(() => {
  if (!fs.existsSync(TMP_BASE)) return
  const now = Date.now()
  for (const dir of fs.readdirSync(TMP_BASE)) {
    const fullPath = path.join(TMP_BASE, dir)
    try {
      const stat = fs.statSync(fullPath)
      if (now - stat.mtimeMs > MAX_AGE) {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`[cleanup] 已清理临时目录: ${dir}`)
      }
    } catch {}
  }
}, CLEANUP_INTERVAL)

// 优雅退出
process.on('SIGTERM', () => clearInterval(cleanupTimer))
process.on('SIGINT', () => clearInterval(cleanupTimer))

// 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件不能超过 200MB' })
    }
    return res.status(400).json({ success: false, message: err.message })
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
  next()
})

module.exports = router
