/**
 * Puppeteer 图片下载脚本（绕过 CDN 防盗链）
 * 
 * 通过无头浏览器下载外部图片，保存原图到本地
 * 每个商品最多下载 12 张图片
 * 
 * 用法: node scripts/download-images-puppeteer.cjs
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'crawled')
const MAX_IMAGES = 12

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

  // 启动浏览器
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  })
  console.log('✓ 浏览器已启动')

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  // 先导航到 WeddingWire 建立 cookie/referer 上下文
  try {
    await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log('✓ 已建立 WeddingWire 会话上下文')
  } catch (e) {
    console.log('⚠ WeddingWire 首页加载超时，继续尝试...')
  }

  // 获取所有有外部图片的目的地
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

    // 收集外部URL（去重，保持顺序），最多 MAX_IMAGES 张
    const allUrls = []
    const seen = new Set()

    // 封面优先
    const coverUrl = dest.cover_image_url ||
      (dest.cover_image && !dest.cover_image.startsWith('/uploads/') ? dest.cover_image : null)
    if (coverUrl) { allUrls.push(coverUrl); seen.add(coverUrl) }

    // 画廊图片
    for (const img of images) {
      if (img.startsWith('/uploads/')) continue
      if (seen.has(img)) continue
      if (allUrls.length >= MAX_IMAGES) break
      allUrls.push(img)
      seen.add(img)
    }

    if (allUrls.length === 0) {
      console.log('  ⏭ 无需下载')
      continue
    }

    console.log(`  📷 共 ${allUrls.length} 张外部图片`)

    const localPaths = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < allUrls.length; i++) {
      const url = allUrls[i]
      const filename = getFilename(url, i)
      const outputPath = path.join(destDir, filename)
      const localPath = `/uploads/crawled/${slug}/${filename}`

      // 已存在则跳过
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        const size = (fs.statSync(outputPath).size / 1024).toFixed(1)
        console.log(`  ⏭ [${i + 1}/${allUrls.length}] 已存在: ${filename} (${size}KB)`)
        localPaths.push(localPath)
        successCount++
        continue
      }

      try {
        process.stdout.write(`  ⬇ [${i + 1}/${allUrls.length}] 下载中...`)

        // 导航到图片URL，浏览器直接加载（无 CORS 限制）
        await page.goto(url, { waitUntil: 'load', timeout: 20000 })

        // 用 canvas 提取图片数据
        const base64 = await page.evaluate(() => {
          const img = document.querySelector('img') || document.images[0]
          if (!img || !img.naturalWidth) throw new Error('No image found')
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
          return dataUrl.split('base64,')[1]
        })

        if (!base64) throw new Error('Canvas extraction failed')
        const buffer = Buffer.from(base64, 'base64')

        if (buffer.length < 1000) {
          throw new Error(`Image too small: ${buffer.length} bytes`)
        }

        // 检查实际文件格式，修正扩展名（CDN可能返回错误扩展名）
        const { execSync } = require('child_process')
        fs.writeFileSync(outputPath, buffer)
        let finalPath = outputPath
        let finalLocalPath = localPath
        try {
          const fileType = execSync(`file -b "${outputPath}" | head -c 10`, { encoding: 'utf8' }).trim()
          if (fileType.startsWith('JPEG') && !outputPath.endsWith('.jpeg') && !outputPath.endsWith('.jpg')) {
            const newPath = outputPath.replace(/\.\w+$/, '.jpeg')
            fs.renameSync(outputPath, newPath)
            finalPath = newPath
            finalLocalPath = localPath.replace(/\.\w+$/, '.jpeg')
            console.log(` (修正扩展名→.jpeg)`)
          }
        } catch {}

        const size = (fs.statSync(finalPath).size / 1024).toFixed(1)
        console.log(` ✓ ${size}KB`)
        localPaths.push(finalLocalPath)
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

  await browser.close()
  await pool.end()
  console.log('\n✅ 全部完成！')
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err)
  process.exit(1)
})
