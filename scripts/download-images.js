/**
 * 爬取目的地图片下载 & 压缩脚本
 * 
 * 功能：
 * 1. 从 crawled_destinations 表读取所有图片URL
 * 2. 下载图片到本地
 * 3. 用 sharp 压缩（JPEG quality 80, 最大宽度 1200px）
 * 4. 存储到 uploads/crawled/{slug}/ 目录
 * 5. 更新数据库中的图片URL为本地路径
 * 
 * 用法: node scripts/download-images.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')
const sharp = require('sharp')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'crawled')
const MAX_WIDTH = 1200
const JPEG_QUALITY = 80
const WEBP_QUALITY = 75

// 创建数据库连接
async function getPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
    waitForConnections: true,
    connectionLimit: 5,
  })
}

// 下载图片
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const request = client.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`))
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    request.on('error', reject)
    request.on('timeout', () => { request.destroy(); reject(new Error(`Timeout: ${url}`)) })
  })
}

// 保存图片（原图保存，仅做方向校正）
async function compressAndSave(buffer, outputPath) {
  await sharp(buffer).rotate().toFile(outputPath)
  const stats = fs.statSync(outputPath)
  return stats.size
}

// 获取文件名
function getFilename(url, index) {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const ext = path.extname(pathname) || '.jpg'
  const base = path.basename(pathname, ext).replace(/[^a-zA-Z0-9_-]/g, '')
  return `${base}_${index}${ext}`
}

async function main() {
  const pool = await getPool()
  console.log('✓ 数据库已连接')

  // 确保输出目录存在
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }

  // 读取所有爬取目的地
  const [destinations] = await pool.execute('SELECT id, slug, name_cn, cover_image, cover_image_url, images FROM crawled_destinations ORDER BY sort_order')
  console.log(`✓ 找到 ${destinations.length} 个目的地`)

  for (const dest of destinations) {
    const slug = dest.slug
    const destDir = path.join(UPLOADS_DIR, slug)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    console.log(`\n📍 处理: ${dest.name_cn} (${slug})`)

    // 解析图片列表
    let images = []
    try {
      images = typeof dest.images === 'string' ? JSON.parse(dest.images) : (dest.images || [])
    } catch { images = [] }

    // 封面使用原始外部URL（cover_image_url），其余用images列表
    const allUrls = []
    if (dest.cover_image_url) allUrls.push(dest.cover_image_url)
    else if (dest.cover_image && !dest.cover_image.startsWith('/uploads/')) allUrls.push(dest.cover_image)
    for (const img of images) {
      // 跳过封面本地路径（已通过cover_image_url处理）
      if (dest.cover_image_url && img === dest.cover_image) continue
      if (!allUrls.includes(img)) allUrls.push(img)
    }

    const localPaths = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < allUrls.length; i++) {
      const url = allUrls[i]

      // 已经是本地路径，跳过
      if (url.startsWith('/uploads/') || url.startsWith('/uploads')) {
        localPaths.push(url)
        successCount++
        continue
      }

      const isCover = i === 0

      // 已经是本地路径，跳过（但封面如果文件丢失则用原始URL重新下载）
      if (url.startsWith('/uploads/') || url.startsWith('/uploads')) {
        const localPath = url.replace(/^\/uploads\//, 'uploads/')
        if (isCover && !fs.existsSync(localPath) && dest.cover_image_url) {
          // 封面文件丢失，用原始URL重新下载
          console.log(`  🔄 [${i + 1}/${allUrls.length}] 封面丢失，从原始URL重新下载`)
          // fall through to download
        } else {
          localPaths.push(url)
          successCount++
          continue
        }
      }

      // 封面使用原始URL下载
      const downloadUrl = (isCover && dest.cover_image_url) ? dest.cover_image_url : url
      const filename = getFilename(downloadUrl, i)
      const outputPath = path.join(destDir, filename)

      // 如果已存在则跳过（封面原图除外，上面已处理）
      if (fs.existsSync(outputPath)) {
        console.log(`  ⏭ [${i + 1}/${allUrls.length}] 已存在: ${filename}${isCover ? ' (原图)' : ''}`)
        localPaths.push(`/uploads/crawled/${slug}/${filename}`)
        successCount++
        continue
      }

      try {
        process.stdout.write(`  ⬇ [${i + 1}/${allUrls.length}] 下载中${isCover ? '(原图)' : ''}: ${downloadUrl.slice(0, 60)}...`)
        const buffer = await downloadImage(downloadUrl)
        const originalSize = (buffer.length / 1024).toFixed(1)

        const newSize = await compressAndSave(buffer, outputPath)
        const savedSize = (newSize / 1024).toFixed(1)

        console.log(` ✓ 原图保存 ${savedSize}KB`)
        localPaths.push(`/uploads/crawled/${slug}/${filename}`)
        successCount++
      } catch (err) {
        console.log(` ✗ ${err.message}`)
        // 失败时保留原URL
        localPaths.push(url)
        failCount++
      }
    }

    // 更新数据库
    const newCoverImage = localPaths[0] || dest.cover_image
    const newImages = JSON.stringify(localPaths)

    await pool.execute(
      'UPDATE crawled_destinations SET cover_image = ?, images = ? WHERE id = ?',
      [newCoverImage, newImages, dest.id]
    )

    console.log(`  ✓ 数据库已更新 | 成功: ${successCount}, 失败: ${failCount}`)
  }

  await pool.end()
  console.log('\n✅ 全部完成！')
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err)
  process.exit(1)
})
