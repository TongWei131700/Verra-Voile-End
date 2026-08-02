/**
 * WeddingWire 多国婚礼场地爬取脚本 v3
 * 爬取法国(57)、希腊(7)、意大利(419)、西班牙(71)、英国(4)
 * 
 * - 图片不做处理，最多12个
 * - 头图取最宽的，避免模糊
 * - 不翻译
 * - 先清空旧数据再爬取
 * 
 * 使用方法: node crawl-all-countries.cjs
 */

const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const mysql = require('mysql2/promise')
const path = require('path')
const http = require('http')
const https = require('https')
const { URL } = require('url')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verra_voile',
  waitForConnections: true,
  connectionLimit: 5,
})

const COUNTRIES = [
  { code: 'France', cn: '法国', searchUrl: 'https://www.weddingwire.com/shared/search?destCountry=3' },
  { code: 'Greece', cn: '希腊', searchUrl: 'https://www.weddingwire.com/shared/search?state_id=1030&region_id=10531&group_id=1' },
  { code: 'Italy', cn: '意大利', searchUrl: 'https://www.weddingwire.com/shared/search?destCountry=2' },
  { code: 'Spain', cn: '西班牙', searchUrl: 'https://www.weddingwire.com/shared/search?destCountry=4' },
  { code: 'United Kingdom', cn: '英国', searchUrl: 'https://www.weddingwire.com/shared/search?destCountry=1' },
]

let stats = { total: 0, inserted: 0, skipped: 0, failed: 0 }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// 用 HEAD 请求获取图片宽度（不下载整张图）
function getImageWidth(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr)
      const client = parsed.protocol === 'https:' ? https : http
      const req = client.request(urlStr, { method: 'HEAD', timeout: 5000 }, (res) => {
        // 尝试从内容中获取尺寸信息（有些CDN在header里有）
        const width = parseInt(res.headers['x-image-width'] || res.headers['image-width'] || '0')
        res.resume()
        if (width > 0) {
          resolve(width)
        } else {
          // 从 URL 推断尺寸 - weddingwire CDN URL 通常包含尺寸信息
          // 如 /1920/ 或 /710/ 等
          const sizeMatch = urlStr.match(/\/(\d{3,4})\//)
          if (sizeMatch) {
            resolve(parseInt(sizeMatch[1]))
          } else {
            resolve(0)
          }
        }
      })
      req.on('error', () => resolve(0))
      req.on('timeout', () => { req.destroy(); resolve(0) })
      req.end()
    } catch (e) {
      resolve(0)
    }
  })
}

// 从 URL 路径推断图片宽度（更快，不需要网络请求）
function inferWidthFromUrl(urlStr) {
  // WeddingWire CDN 格式: .../vendorId/imageId/WIDTH/...
  // 常见: /1920/, /1600/, /1280/, /1024/, /710/, /500/, /210/
  const match = urlStr.match(/\/(\d{3,4})\//)
  if (match) return parseInt(match[1])
  // 如果没有尺寸信息，假设标准宽度
  return 1024
}

// 从搜索页 HTML 中提取 venue 链接
function extractVenueLinks(html) {
  const $ = cheerio.load(html)
  const links = new Set()
  
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    if ((href.includes('/biz/') || href.includes('/destination-wedding/')) && !href.includes('/shared/search')) {
      const fullUrl = href.startsWith('http') ? href : `https://www.weddingwire.com${href}`
      links.add(fullUrl.split('?')[0])
    }
  })
  
  // 从 JSON script 标签中提取
  $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).html() || ''
      const matches = text.match(/https?:\/\/www\.weddingwire\.com\/(biz|destination-wedding)\/[^"\\]+/g)
      if (matches) matches.forEach(u => links.add(u.split('?')[0]))
    } catch (e) {}
  })
  
  return Array.from(links)
}

// 从详情页提取数据
function parseDetailPage(html, url, country, countryCn) {
  const $ = cheerio.load(html)
  
  // 名称
  const name = $('h1').first().text().trim()
  if (!name) return null

  // 描述 - 从 meta 或 about section
  let description = ''
  const metaDesc = $('meta[name="description"]').attr('content') || ''
  if (metaDesc.length > 50) description = metaDesc
  
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 200 && text.length > description.length) {
      description = text
    }
  })

  // 图片 - 收集所有图片 URL（不做处理，保持原样）
  const imgSet = new Set()
  const images = []
  
  // 从 img 标签收集
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src') || ''
    if (src.includes('cdn0.weddingwire.com') || src.includes('cdn0.mariages.net')) {
      const clean = src.split('?')[0]
      if (!imgSet.has(clean)) { imgSet.add(clean); images.push(clean) }
    }
  })
  
  // 从 script 标签提取图片
  $('script').each((_, el) => {
    const text = $(el).html() || ''
    const matches = text.match(/https?:\/\/cdn0\.(weddingwire|mariages)\.com\/[^"\\]+?\.(jpg|jpeg|png|webp)/gi)
    if (matches) {
      matches.forEach(m => {
        const clean = m.split('?')[0]
        if (!imgSet.has(clean)) { imgSet.add(clean); images.push(clean) }
      })
    }
  })
  
  // 最多12张
  const finalImages = images.slice(0, 12)

  // 头图取最宽的（通过 URL 中的尺寸信息推断）
  let coverImage = finalImages[0] || ''
  if (finalImages.length > 1) {
    let maxWidth = 0
    for (const img of finalImages) {
      const w = inferWidthFromUrl(img)
      if (w > maxWidth) {
        maxWidth = w
        coverImage = img
      }
    }
  }

  // 位置
  let location = ''
  $('address, [class*="location"], [class*="address"], [itemprop="address"]').each((_, el) => {
    const t = $(el).text().trim()
    if (t && t.length < 200 && t.length > location.length) location = t
  })

  // 场地类型
  const venueTypes = []
  $('nav a, [class*="breadcrumb"] a, [aria-label*="breadcrumb"] a').each((_, el) => {
    const t = $(el).text().trim()
    if (t && t.length > 2 && t.length < 50 && !['Home', 'Wedding Venues', country, countryCn, 'Vendor Directory'].includes(t)) {
      venueTypes.push({ name: t, name_en: t })
    }
  })
  if (venueTypes.length === 0) venueTypes.push({ name: 'Wedding Venue', name_en: 'Wedding Venue' })

  // slug
  const slug = name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80)

  // features
  const features = []
  if (description) {
    const sentences = description.split(/[.!?]/).filter(s => s.trim().length > 20 && s.trim().length < 200)
    for (const s of sentences.slice(0, 8)) features.push(s.trim())
  }

  // guest capacity
  const guestCapacities = []
  const capMatch = description.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:people|guests|attendees)/i)
  if (capMatch) guestCapacities.push(`${capMatch[1]}-${capMatch[2]}人`)
  if (guestCapacities.length === 0) guestCapacities.push('Please inquire')

  return {
    slug, name, name_cn: name, country, country_cn: countryCn,
    source_url: url,
    tagline: description.substring(0, 200),
    description: description.substring(0, 5000),
    features: JSON.stringify(features),
    venue_types: JSON.stringify(venueTypes),
    towns: location ? JSON.stringify([{ name: location, name_cn: location }]) : '[]',
    images: JSON.stringify(finalImages),
    budget_ranges: JSON.stringify([{ label: 'Please inquire', min: 0, max: null }]),
    guest_capacities: JSON.stringify(guestCapacities),
    faq: null,
    cover_image: coverImage,
    sort_order: 0,
  }
}

async function existsBySlug(slug) {
  const [rows] = await pool.execute('SELECT id FROM crawled_destinations WHERE slug = ?', [slug])
  return rows.length > 0
}

async function insertVenue(data) {
  await pool.execute(
    `INSERT INTO crawled_destinations 
     (slug, name, name_cn, country, country_cn, source_url, tagline, description, 
      features, venue_types, towns, images, budget_ranges, guest_capacities, faq, 
      cover_image, cover_image_url, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.slug, data.name, data.name_cn, data.country, data.country_cn,
     data.source_url, data.tagline, data.description, data.features,
     data.venue_types, data.towns, data.images, data.budget_ranges,
     data.guest_capacities, data.faq, data.cover_image, data.cover_image, data.sort_order]
  )
}

async function main() {
  console.log('========================================')
  console.log('WeddingWire 多国场地爬取 (Puppeteer v3)')
  console.log(`时间: ${new Date().toLocaleString()}`)
  console.log('========================================')

  const startTime = Date.now()

  // 先清空5国旧数据
  console.log('\n--- 清空旧数据 ---')
  for (const c of COUNTRIES) {
    const [result] = await pool.execute('DELETE FROM crawled_destinations WHERE country = ?', [c.code])
    console.log(`  已删除 ${c.cn} (${c.code}) ${result.affectedRows} 条`)
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  })

  for (const country of COUNTRIES) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`开始爬取: ${country.cn} (${country.code})`)
    console.log(`搜索页: ${country.searchUrl}`)
    console.log(`${'='.repeat(50)}`)

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1920, height: 1080 })
    
    // 阻止图片/字体/媒体加载以加速
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const type = req.resourceType()
      if (['image', 'font', 'media'].includes(type)) {
        req.abort()
      } else {
        req.continue()
      }
    })

    try {
      // 爬取搜索页
      await page.goto(country.searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await sleep(6000)

      // 滚动到底部以加载更多内容
      let prevHeight = 0
      for (let scroll = 0; scroll < 5; scroll++) {
        const currHeight = await page.evaluate('document.body.scrollHeight')
        if (currHeight === prevHeight) break
        prevHeight = currHeight
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await sleep(2000)
      }

      // 获取所有页码链接
      const pageUrls = [country.searchUrl]
      const paginationHrefs = await page.evaluate(() => {
        const links = []
        // 查找所有分页链接
        document.querySelectorAll('a[href*="page="]').forEach(a => {
          const href = a.getAttribute('href')
          if (href) {
            const fullUrl = href.startsWith('http') ? href : `https://www.weddingwire.com${href}`
            links.push(fullUrl.split('#')[0])
          }
        })
        return [...new Set(links)]
      })
      
      // 按页码排序
      paginationHrefs.sort((a, b) => {
        const pa = parseInt((a.match(/page=(\d+)/) || [])[1] || '1')
        const pb = parseInt((b.match(/page=(\d+)/) || [])[1] || '1')
        return pa - pb
      })
      pageUrls.push(...paginationHrefs)
      console.log(`  共 ${pageUrls.length} 页`)

      // 收集所有 venue 链接
      const allVenueLinks = new Set()
      
      for (let pi = 0; pi < pageUrls.length; pi++) {
        if (pi > 0) {
          console.log(`  翻页 ${pi + 1}/${pageUrls.length}: ${pageUrls[pi].substring(0, 80)}`)
          try {
            await page.goto(pageUrls[pi], { waitUntil: 'domcontentloaded', timeout: 30000 })
            await sleep(5000)
            // 滚动加载
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight / 2)')
            await sleep(2000)
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            await sleep(2000)
          } catch (e) {
            console.log(`    翻页加载失败: ${e.message.substring(0, 60)}`)
            continue
          }
        }

        const html = await page.content()
        const links = extractVenueLinks(html)
        console.log(`  第${pi + 1}页: ${links.length} 个场地链接`)
        links.forEach(l => allVenueLinks.add(l))
      }

      console.log(`\n${country.cn} 共发现 ${allVenueLinks.size} 个场地`)
      const venueLinks = Array.from(allVenueLinks)

      // 爬取每个 venue 详情
      let cInserted = 0, cSkipped = 0, cFailed = 0

      for (let i = 0; i < venueLinks.length; i++) {
        const link = venueLinks[i]

        try {
          let retries = 2
          let detailHtml = ''
          let success = false

          while (retries > 0 && !success) {
            try {
              await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 })
              await sleep(3000)
              detailHtml = await page.content()
              success = true
            } catch (navErr) {
              retries--
              if (retries > 0) {
                console.log(`    重试中... (${2 - retries}/2)`)
                await sleep(2000)
              } else {
                console.log(`    导航失败，尝试提取已加载内容...`)
                try { detailHtml = await page.content() } catch(e2) {}
              }
            }
          }

          const data = parseDetailPage(detailHtml, link, country.code, country.cn)

          if (!data || !data.name) {
            console.log(`  [${i + 1}/${venueLinks.length}] 解析失败或无名称`)
            cFailed++
            continue
          }

          const imgs = JSON.parse(data.images)
          if (imgs.length === 0) {
            console.log(`  [${i + 1}/${venueLinks.length}] 无图片，跳过`)
            cSkipped++
            continue
          }

          // 确保 slug 唯一
          let finalSlug = data.slug
          if (await existsBySlug(finalSlug)) {
            finalSlug = `${data.slug}-${Date.now().toString(36)}`
            if (await existsBySlug(finalSlug)) { cSkipped++; continue }
          }
          data.slug = finalSlug

          await insertVenue(data)
          
          if ((i + 1) % 10 === 0 || i === venueLinks.length - 1 || cInserted <= 3) {
            console.log(`  [${i + 1}/${venueLinks.length}] ✓ ${data.name.substring(0, 40)} (${imgs.length}张图) | 新增${cInserted} 跳过${cSkipped} 失败${cFailed}`)
          }
          cInserted++
        } catch (err) {
          console.log(`  [${i + 1}/${venueLinks.length}] ✗ ${err.message.substring(0, 60)}`)
          cFailed++
        }
      }

      console.log(`\n${country.cn} 完成: 新增${cInserted} 跳过${cSkipped} 失败${cFailed}`)
      stats.total += venueLinks.length
      stats.inserted += cInserted
      stats.skipped += cSkipped
      stats.failed += cFailed

    } catch (err) {
      console.error(`${country.cn} 爬取异常: ${err.message}`)
    }

    await page.close()
  }

  await browser.close()

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log('\n========================================')
  console.log('爬取完成汇总')
  console.log('========================================')
  console.log(`总链接: ${stats.total}, 新增: ${stats.inserted}, 跳过: ${stats.skipped}, 失败: ${stats.failed}`)
  console.log(`耗时: ${elapsed} 分钟`)

  for (const c of COUNTRIES) {
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM crawled_destinations WHERE country = ?', [c.code])
    console.log(`${c.cn} (${c.code}): ${rows[0].cnt} 条记录`)
  }

  await pool.end()
  console.log('\n完成！数据库连接已关闭')
}

main().catch(err => { console.error('致命错误:', err); process.exit(1) })
