const express = require('express')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const router = express.Router()

// 磁盘缓存目录
const CACHE_DIR = path.join(__dirname, '../../uploads/cache/images')
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// 允许的图片来源域名白名单（安全限制）
const ALLOWED_DOMAINS = [
  'images.junebugweddings.com',
  'static.junebugweddings.com',
  'italiandestinationweddings.com',
  'cdn0.weddingwire.com',
  'cdn0.hitched.co.uk',
  'cdn0.mariages.net',
  'images.unsplash.com',
]

// 缓存 TTL：7 天（毫秒）
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

/**
 * GET /api/image-proxy
 * 代理外部图片，带磁盘缓存
 *
 * Query:
 *   url - 原始图片 URL（需 encodeURIComponent）
 */
router.get('/', async (req, res) => {
  const imageUrl = req.query.url
  if (!imageUrl) {
    return res.status(400).json({ error: '缺少 url 参数' })
  }

  // 校验 URL 合法性
  let parsed
  try {
    parsed = new URL(imageUrl)
  } catch {
    return res.status(400).json({ error: '无效的 URL' })
  }

  // 仅允许 http/https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: '不支持的协议' })
  }

  // 域名白名单校验
  if (!ALLOWED_DOMAINS.includes(parsed.hostname)) {
    return res.status(403).json({ error: '域名不在白名单内' })
  }

  // 用 URL 的 hash 作为缓存文件名
  const hash = crypto.createHash('md5').update(imageUrl).digest('hex')
  const ext = path.extname(parsed.pathname) || '.jpg'
  const cacheFile = path.join(CACHE_DIR, `${hash}${ext}`)

  // 检查磁盘缓存
  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile)
    if (Date.now() - stat.mtimeMs < CACHE_TTL) {
      const contentType = getContentType(ext)
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 浏览器缓存 1 天
        'X-Cache': 'HIT',
      })
      return fs.createReadStream(cacheFile).pipe(res)
    }
    // 过期，删除
    fs.unlinkSync(cacheFile)
  }

  // 从远程下载
  const client = parsed.protocol === 'https:' ? https : http
  const request = client.get(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': `${parsed.protocol}//${parsed.hostname}/`,
    },
    timeout: 15000,
  }, (remoteRes) => {
    // 处理重定向
    if ([301, 302, 307, 308].includes(remoteRes.statusCode)) {
      // 简单重定向处理：直接返回新 URL 让前端重试
      return res.redirect(302, remoteRes.headers.location)
    }

    if (remoteRes.statusCode !== 200) {
      return res.status(remoteRes.statusCode).json({ error: `远程图片返回 ${remoteRes.statusCode}` })
    }

    const contentType = remoteRes.headers['content-type'] || getContentType(ext)
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    })

    // 写入缓存文件 + 同时 pipe 给前端
    const writeStream = fs.createWriteStream(cacheFile)
    remoteRes.pipe(writeStream)
    remoteRes.pipe(res)

    remoteRes.on('error', () => {
      // 下载中断时删除不完整的缓存文件
      if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile)
    })
  })

  request.on('error', (err) => {
    console.error('[image-proxy] 请求失败:', imageUrl, err.message)
    // 清理可能的残留缓存
    if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile)
    res.status(502).json({ error: '图片获取失败' })
  })

  request.on('timeout', () => {
    request.destroy()
    if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile)
    res.status(504).json({ error: '图片请求超时' })
  })
})

/**
 * 根据扩展名返回 Content-Type
 */
function getContentType(ext) {
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
  }
  return map[ext.toLowerCase()] || 'image/jpeg'
}

module.exports = router
