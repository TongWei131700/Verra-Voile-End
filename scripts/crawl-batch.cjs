/**
 * 通用批量场地爬取脚本（本地运行，puppeteer-core）
 * 
 * 用法:
 *   node scripts/crawl-batch.cjs --country=italy
 *   node scripts/crawl-batch.cjs --country=spain
 * 
 * 从 scripts/{country}-venues.json 读取场地列表
 * 写入 cv_test_{country} / cd_test_{country} / products 表
 */

const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')
const path = require('path')
const fs = require('fs')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 配置 =====
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DB_CONFIG = {
  host: 'localhost', port: 3306, user: 'root', password: '',
  database: 'verra_voile', waitForConnections: true, connectionLimit: 3,
}
const MAX_IMAGES = 24

// 国家配置
const COUNTRY_CONFIG = {
  italy: {
    country: 'Test Italy', countryCn: '测试意大利', suffix: 'test_italy',
    flag: '🇮🇹', budgetLabel: ['2万-5万欧元', '5万-10万欧元', '10万欧元以上'],
  },
  spain: {
    country: 'Test Spain', countryCn: '测试西班牙', suffix: 'test_spain',
    flag: '🇪🇸', budgetLabel: ['2万-5万欧元', '5万-10万欧元', '10万欧元以上'],
  },
}

// ===== 解析命令行 =====
const args = process.argv.slice(2)
const countryArg = args.find(a => a.startsWith('--country='))
if (!countryArg) {
  console.error('用法: node scripts/crawl-batch.cjs --country=italy|spain')
  process.exit(1)
}
const countryKey = countryArg.split('=')[1]
const config = COUNTRY_CONFIG[countryKey]
if (!config) {
  console.error(`不支持的国家: ${countryKey}，可选: ${Object.keys(COUNTRY_CONFIG).join(', ')}`)
  process.exit(1)
}

// 读取场地列表
const venuesFile = path.join(__dirname, `${countryKey}-venues.json`)
if (!fs.existsSync(venuesFile)) {
  console.error(`场地列表文件不存在: ${venuesFile}`)
  process.exit(1)
}
const VENUES = JSON.parse(fs.readFileSync(venuesFile, 'utf-8'))

// ===== 工具函数 =====
function makeSlug(name) {
  const prefix = `test-${countryKey}-`
  const maxNameLen = 50 - prefix.length - 1  // product_id max 50
  return prefix + name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .slice(0, maxNameLen)
}

function getDefaultBudget(labels) {
  return JSON.stringify([
    { label: labels[0], min: 20000, max: 50000 },
    { label: labels[1], min: 50000, max: 100000 },
    { label: labels[2], min: 100000, max: null }
  ])
}
const DEFAULT_GUEST = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

// ===== 爬取单个场地 =====
async function crawlVenue(page, venue) {
  const result = { name: venue.name, url: venue.url, slug: makeSlug(venue.name), success: false, error: null, data: null }

  try {
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await wait(2000)

    // 点击 "Read more" 展开完整描述
    try {
      const readMoreBtns = await page.$$('.storefrontDescription__link')
      for (const btn of readMoreBtns) { try { await btn.click() } catch {} }
      await wait(500)
    } catch {}

    // 提取 JSON-LD
    const jsonData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      const results = []
      scripts.forEach(s => { try { results.push(JSON.parse(s.textContent)) } catch {} })
      return results
    })

    let ldData = null
    for (const item of jsonData) {
      if (item['@type'] === 'LocalBusiness' || item['@type'] === 'WeddingVenue') { ldData = item; break }
      if (item['@graph']) {
        for (const sub of item['@graph']) {
          if (sub['@type'] === 'LocalBusiness' || sub['@type'] === 'WeddingVenue') { ldData = sub; break }
        }
      }
      if (ldData) break
    }

    // 描述
    let description = ''
    try {
      const descEl = await page.$('.storefrontDescription__content')
      if (descEl) {
        description = await page.evaluate(el => {
          const paragraphs = el.querySelectorAll('p')
          if (paragraphs.length > 0) return Array.from(paragraphs).map(p => p.textContent.trim()).filter(t => t).join('\n\n')
          return el.textContent.trim()
        }, descEl)
      }
    } catch {}
    if (!description && ldData && ldData.description) description = ldData.description

    // 场地类型
    let venueTypes = []
    try {
      const breadcrumbText = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Breadcrumb"]') || document.querySelector('.storefrontNavigationBreadcrumb')
        return nav ? nav.textContent : ''
      })
      if (breadcrumbText) {
        const typeMatch = breadcrumbText.match(/(\w+)\s*Weddings?/i)
        if (typeMatch) {
          const typeEn = typeMatch[1]
          const typeMap = {
            'Mansion': { name: 'Mansion', name_cn: '庄园' }, 'Garden': { name: 'Garden', name_cn: '花园' },
            'Hotel': { name: 'Hotel', name_cn: '酒店' }, 'Restaurant': { name: 'Restaurant', name_cn: '餐厅' },
            'Barn': { name: 'Barn', name_cn: '谷仓' }, 'Banquet': { name: 'Banquet Hall', name_cn: '宴会厅' },
            'Country': { name: 'Country House', name_cn: '乡村庄园' }, 'Historic': { name: 'Historic Building', name_cn: '历史建筑' },
            'Manor': { name: 'Manor House', name_cn: '庄园' },
          }
          if (typeMap[typeEn]) venueTypes.push(typeMap[typeEn])
        }
      }
    } catch {}

    // 位置
    let towns = []
    try {
      const locationText = await page.evaluate(() => {
        const loc = document.querySelector('.storefrontHeadingLocation__label a')
        return loc ? loc.textContent.trim() : ''
      })
      if (locationText) towns.push({ name: locationText, name_cn: locationText })
      if (ldData && ldData.address) {
        const addr = ldData.address
        if (addr.addressLocality && !towns.find(t => t.name === addr.addressLocality))
          towns.push({ name: addr.addressLocality, name_cn: addr.addressLocality })
        if (addr.addressRegion && !towns.find(t => t.name === addr.addressRegion))
          towns.push({ name: addr.addressRegion, name_cn: addr.addressRegion })
      }
    } catch {}

    // 图片
    let images = []
    if (ldData && ldData.image) {
      const imgList = Array.isArray(ldData.image) ? ldData.image : [ldData.image]
      for (const img of imgList) {
        const imgUrl = typeof img === 'string' ? img : (img.contentUrl || img.url || '')
        if (imgUrl) {
          const hd = imgUrl.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          if (!images.includes(hd)) images.push(hd)
        }
        if (images.length >= MAX_IMAGES) break
      }
    }
    if (images.length === 0) {
      try {
        const domImages = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img')
          return Array.from(imgs).map(img => img.src || img.getAttribute('data-src') || '').filter(src =>
            src && (src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.mariages.net/vendor/') || src.includes('cdn0.hitched.co.uk/vendor/'))
          )
        })
        const seen = new Set()
        for (const url of domImages) {
          const hd = url.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          if (!seen.has(hd)) { seen.add(hd); images.push(hd) }
          if (images.length >= MAX_IMAGES) break
        }
      } catch {}
    }

    // 评分
    let rating = null, reviewCount = 0
    if (ldData && ldData.aggregateRating) {
      rating = parseFloat(ldData.aggregateRating.ratingValue) || null
      reviewCount = parseInt(ldData.aggregateRating.reviewCount) || 0
    }

    // tagline
    let tagline = ''
    if (description) {
      const firstSentence = description.split(/[。\.\n]/)[0].trim()
      tagline = firstSentence.slice(0, 80)
    }

    // 特色
    let features = []
    if (description) {
      const sentences = description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (rating && reviewCount > 0) features.push(`WeddingWire ${rating}分（${reviewCount}条评价）`)

    // 默认值
    if (venueTypes.length === 0) {
      const n = venue.name.toLowerCase()
      if (n.includes('hotel') || n.includes('resort') || n.includes('seleqtta') || n.includes('marriott') || n.includes('westin') || n.includes('meliá'))
        venueTypes.push({ name: 'Hotel', name_cn: '酒店' })
      else if (n.includes('villa')) venueTypes.push({ name: 'Villa', name_cn: '别墅' })
      else if (n.includes('masía') || n.includes('masia') || n.includes('finca') || n.includes('mas '))
        venueTypes.push({ name: 'Finca', name_cn: '庄园' })
      else if (n.includes('castillo') || n.includes('castell') || n.includes('castle'))
        venueTypes.push({ name: 'Castle', name_cn: '城堡' })
      else if (n.includes('restaurant') || n.includes('bistro'))
        venueTypes.push({ name: 'Restaurant', name_cn: '餐厅' })
      else if (n.includes('golf')) venueTypes.push({ name: 'Golf Course', name_cn: '高尔夫球场' })
      else venueTypes.push({ name: 'Wedding Venue', name_cn: '婚礼场地' })
    }

    if (towns.length === 0) towns.push({ name: config.country, name_cn: config.countryCn })
    if (!description) description = `${venue.name} is a selected wedding venue, offering premium wedding services.`
    if (features.length === 0) features = ['Selected wedding venue', 'Professional wedding service team']

    const coverImage = images[0] || ''

    result.data = {
      slug: result.slug, name: venue.name, name_cn: '',
      tagline: tagline || `${venue.name} - Wedding Venue`, tagline_cn: '',
      description, description_cn: '',
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(images),
      budget_ranges: getDefaultBudget(config.budgetLabel),
      guest_capacities: DEFAULT_GUEST,
      cover_image: coverImage, source_url: venue.url,
      rating, review_count: reviewCount,
      location: towns.length > 0 ? towns[0].name : '',
      faq: JSON.stringify([]),
    }
    result.success = true
  } catch (err) {
    result.error = err.message
  }
  return result
}

// ===== 主函数 =====
async function main() {
  const startTime = Date.now()
  console.log(`${config.flag} 开始爬取${config.countryCn} ${VENUES.length} 个场地...`)

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  console.log('✓ 浏览器已启动')

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  try {
    await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log('✓ 已建立 WeddingWire 会话')
  } catch (e) {
    console.log('⚠ WeddingWire 首页加载超时，继续...')
  }

  const cvTable = `cv_${config.suffix}`
  const cdTable = `cd_${config.suffix}`
  let successCount = 0, failCount = 0, skipCount = 0
  const failures = []

  for (let i = 0; i < VENUES.length; i++) {
    const venue = VENUES[i]
    if ((i + 1) % 20 === 0 || i === 0) {
      console.log(`\n--- 进度: ${i + 1}/${VENUES.length} ---`)
    }
    console.log(`[${i + 1}/${VENUES.length}] ${venue.name}`)

    const result = await crawlVenue(page, venue)

    if (result.success && result.data) {
      const d = result.data
      try {
        const [existing] = await pool.execute(`SELECT id FROM \`${cvTable}\` WHERE slug = ?`, [d.slug])
        if (existing.length > 0) {
          console.log(`  ⏭ 已存在，跳过`)
          skipCount++
        } else {
          await pool.execute(
            `INSERT INTO \`${cvTable}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,rating,review_count,location,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.slug,d.name,d.name_cn,config.country,config.countryCn,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,d.rating||'',d.review_count||'0',d.location||'',100+i]
          )
          await pool.execute(
            `INSERT INTO \`${cdTable}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.slug,d.name,d.name_cn,config.country,config.countryCn,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,100+i]
          )
          const prodSlug = d.slug.slice(0, 50).replace(/-$/, '')
          await pool.execute(
            `INSERT INTO products (category_id,product_id,name,name_en,description,image,price,unit,highlight) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
            ['destination',prodSlug,d.name,d.name,`${config.countryCn}婚礼场地`,d.cover_image,0,'€',config.countryCn+'精选']
          )
          const imgCount = JSON.parse(d.images).length
          console.log(`  ✓ 图片${imgCount}张`)
          successCount++
        }
      } catch (dbErr) {
        console.error(`  ✗ DB错误: ${dbErr.message}`)
        failures.push({ name: venue.name, error: dbErr.message })
        failCount++
      }
    } else {
      console.log(`  ✗ 爬取失败: ${result.error}`)
      failures.push({ name: venue.name, error: result.error })
      failCount++
    }

    if (i < VENUES.length - 1) await wait(1200 + Math.random() * 800)
  }

  await browser.close()
  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}, 耗时: ${elapsed}秒 (${Math.round(elapsed/60)}分钟)`)
  if (failures.length > 0) {
    console.log(`\n失败列表:`)
    failures.forEach((f, i) => console.log(`  ${i+1}. ${f.name}: ${f.error}`))
  }
}

main().catch(err => { console.error('❌ 脚本执行失败:', err.message); process.exit(1) })
