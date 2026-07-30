/**
 * 图片本地化脚本（无压缩，保存原图）
 * 
 * 功能：
 * 1. 从 crawled_destinations 表读取所有外部图片URL
 * 2. 下载原图到 uploads/crawled/{slug}/ 目录
 * 3. 更新数据库中的 cover_image 和 images 为本地路径
 * 
 * 用法: node scripts/download-images-local.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'crawled')

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

function downloadImage(url, referer) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
    if (referer) headers['Referer'] = referer
    const request = client.get(url, { timeout: 30000, headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, referer).then(resolve).catch(reject)
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

function getFilename(url, index) {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const ext = path.extname(pathname) || '.jpeg'
    const base = path.basename(pathname, ext).replace(/[^a-zA-Z0-9_-]/g, '_')
    return `${base}_${index}${ext}`
  } catch {
    return `img_${index}.jpeg`
  }
}

async function main() {
  const pool = await getPool()
  console.log('✓ 数据库已连接')

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }

  const [destinations] = await pool.execute(
    'SELECT id, slug, name_cn, cover_image, cover_image_url, images FROM crawled_destinations ORDER BY sort_order'
  )
  console.log(`✓ 找到 ${destinations.length} 个目的地`)

  for (const dest of destinations) {
    const slug = dest.slug
    const destDir = path.join(UPLOADS_DIR, slug)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    console.log(`\n📍 处理: ${dest.name_cn} (${slug})`)

    // 解析 images JSON
    let images = []
    try {
      images = typeof dest.images === 'string' ? JSON.parse(dest.images) : (dest.images || [])
    } catch { images = [] }

    // 收集所有需要下载的外部URL（去重，保持顺序）
    const allUrls = []
    const seen = new Set()

    // 封面优先
    const coverUrl = dest.cover_image_url || (dest.cover_image && !dest.cover_image.startsWith('/uploads/') ? dest.cover_image : null)
    if (coverUrl) { allUrls.push(coverUrl); seen.add(coverUrl) }

    // 画廊图片
    for (const img of images) {
      if (img.startsWith('/uploads/')) continue // 已是本地路径
      if (seen.has(img)) continue
      allUrls.push(img)
      seen.add(img)
    }

    if (allUrls.length === 0) {
      console.log('  ⏭ 无需下载（全部已是本地路径或无图片）')
      continue
    }

    console.log(`  📷 共 ${allUrls.length} 张外部图片需下载`)

    const localPaths = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < allUrls.length; i++) {
      const url = allUrls[i]
      const filename = getFilename(url, i)
      const outputPath = path.join(destDir, filename)
      const localPath = `/uploads/crawled/${slug}/${filename}`

      // 已存在则跳过
      if (fs.existsSync(outputPath)) {
        const size = (fs.statSync(outputPath).size / 1024).toFixed(1)
        console.log(`  ⏭ [${i + 1}/${allUrls.length}] 已存在: ${filename} (${size}KB)`)
        localPaths.push(localPath)
        successCount++
        continue
      }

      // 根据URL推断Referer
      let referer = ''
      if (url.includes('weddingwire.com')) referer = 'https://www.weddingwire.com/'
      else if (url.includes('mariages.net')) referer = 'https://www.mariages.net/'

      try {
        process.stdout.write(`  ⬇ [${i + 1}/${allUrls.length}] 下载中: ${url.slice(0, 70)}...`)
        const buffer = await downloadImage(url, referer)
        // 直接保存原图，不压缩
        fs.writeFileSync(outputPath, buffer)
        const size = (buffer.length / 1024).toFixed(1)
        console.log(` ✓ ${size}KB`)
        localPaths.push(localPath)
        successCount++
      } catch (err) {
        console.log(` ✗ ${err.message}`)
        localPaths.push(url) // 失败保留原URL
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
