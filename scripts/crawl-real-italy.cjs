/**
 * 爬取"真实意大利"场地数据（Hotel Corallo）并存入 cd_real_italy / cv_real_italy 表
 * 
 * 用法: node scripts/crawl-real-italy.cjs
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

let puppeteer
try {
  puppeteer = require('puppeteer-core')
} catch (e) {
  console.error('puppeteer-core 未安装')
  process.exit(1)
}

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TARGET_URL = 'https://www.weddingwire.com/biz/hotel-corallo/44a3158d30b11e5a.html'
const MAX_IMAGES = 24

const COUNTRY = 'Italy'
const COUNTRY_CN = '真实意大利'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 1. 创建表
  console.log('===== 创建 cd_real_italy / cv_real_italy 表 =====')
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`cv_real_italy\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL,
      name VARCHAR(200) NOT NULL,
      name_cn VARCHAR(200) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '',
      source_url VARCHAR(500) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '',
      tagline_cn VARCHAR(500) DEFAULT '',
      description TEXT,
      description_cn TEXT,
      features JSON,
      venue_types JSON,
      towns JSON,
      images JSON,
      budget_ranges JSON,
      guest_capacities JSON,
      faq JSON,
      cover_image VARCHAR(500) DEFAULT '',
      rating VARCHAR(20) DEFAULT '',
      review_count VARCHAR(20) DEFAULT '0',
      location VARCHAR(300) DEFAULT '',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ cv_real_italy 表已就绪')

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`cd_real_italy\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL,
      name VARCHAR(200) NOT NULL,
      name_cn VARCHAR(200) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '',
      source_url VARCHAR(500) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '',
      tagline_cn VARCHAR(500) DEFAULT '',
      description TEXT,
      description_cn TEXT,
      features JSON,
      venue_types JSON,
      towns JSON,
      images JSON,
      budget_ranges JSON,
      guest_capacities JSON,
      faq JSON,
      cover_image VARCHAR(500) DEFAULT '',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ cd_real_italy 表已就绪')

  // 2. 爬取数据
  console.log('\n===== 开始爬取 Hotel Corallo =====')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  // 先访问首页建立会话
  try {
    await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
  } catch (e) { console.log('首页访问失败，继续...') }

  // 爬取详情
  const venueData = await crawlVenueDetail(page, TARGET_URL)
  await browser.close()

  if (!venueData) {
    console.error('爬取失败，无法获取数据')
    await pool.end()
    return
  }

  console.log('\n爬取结果:')
  console.log('  名称:', venueData.name)
  console.log('  图片数:', venueData.imageCount)
  console.log('  评分:', venueData.rating)
  console.log('  位置:', venueData.location)

  // 3. 入库
  const slug = venueData.name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)

  // 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM cv_real_italy WHERE slug = ?', [slug])
  if (existing.length > 0) {
    console.log(`\n${slug} 已存在，跳过`)
    await pool.end()
    return
  }

  // 写入 cv_real_italy（完整详情表）
  await pool.execute(
    `INSERT INTO \`cv_real_italy\`
     (slug, name, name_cn, country, country_cn, source_url, tagline, description,
      features, venue_types, towns, images, budget_ranges, guest_capacities,
      faq, cover_image, rating, review_count, location, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, venueData.name, '', COUNTRY, COUNTRY_CN, TARGET_URL, venueData.tagline || '',
     venueData.description || '', venueData.features || '[]',
     venueData.venue_types || '[{"name":"Venue","name_en":"Venue"}]',
     venueData.towns || '[]', venueData.images || '[]',
     venueData.budget_ranges || '[]', venueData.guest_capacities || '[]',
     venueData.faq || '[]', venueData.cover_image || '',
     venueData.rating || '', venueData.review_count || '0',
     venueData.location || '', 1]
  )
  console.log(`\n✓ 已写入 cv_real_italy: ${slug}`)

  // 同步写入 cd_real_italy（前端列表表）
  await pool.execute(
    `INSERT INTO \`cd_real_italy\`
     (slug, name, name_cn, country, country_cn, source_url, tagline, description,
      features, venue_types, towns, images, budget_ranges, guest_capacities,
      faq, cover_image, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, venueData.name, '', COUNTRY, COUNTRY_CN, TARGET_URL, venueData.tagline || '',
     venueData.description || '', venueData.features || '[]',
     venueData.venue_types || '[{"name":"Venue","name_en":"Venue"}]',
     venueData.towns || '[]', venueData.images || '[]',
     venueData.budget_ranges || '[]', venueData.guest_capacities || '[]',
     venueData.faq || '[]', venueData.cover_image || '', 1]
  )
  console.log(`✓ 已写入 cd_real_italy: ${slug}`)

  await pool.end()
  console.log('\n===== 完成 =====')
}

async function crawlVenueDetail(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))

    // 点击 Read more 展开描述
    try {
      const btns = await page.$$('.storefrontDescription__link')
      for (const btn of btns) { try { await btn.click() } catch {} }
      await new Promise(r => setTimeout(r, 500))
    } catch {}

    const data = await page.evaluate((maxImgs) => {
      // JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      let ldData = null
      scripts.forEach(s => {
        try {
          const json = JSON.parse(s.textContent)
          if (json['@type'] === 'LocalBusiness' || json['@type'] === 'WeddingVenue') ldData = json
          if (json['@graph']) {
            for (const sub of json['@graph']) {
              if (sub['@type'] === 'LocalBusiness' || sub['@type'] === 'WeddingVenue') ldData = sub
            }
          }
        } catch {}
      })

      const name = (document.querySelector('h1') || document.querySelector('title'))
        ?.textContent?.trim()?.split(' - ')[0] || ''
      if (!name) return null

      // 描述
      let description = ''
      const descEl = document.querySelector('.storefrontDescription__content')
      if (descEl) {
        const ps = descEl.querySelectorAll('p')
        if (ps.length > 0) {
          description = Array.from(ps).map(p => p.textContent.trim()).filter(t => t).join('\n\n')
        } else {
          description = descEl.textContent.trim()
        }
      }
      if (!description && ldData?.description) description = ldData.description

      // 图片 - 也检查 matrimonio CDN
      const imageSet = new Set()
      if (ldData?.image) {
        const imgList = Array.isArray(ldData.image) ? ldData.image : [ldData.image]
        for (const img of imgList) {
          const imgUrl = typeof img === 'string' ? img : (img.contentUrl || img.url || '')
          if (imgUrl) {
            const hd = imgUrl.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
            imageSet.add(hd)
          }
        }
      }
      // 从页面 img 标签和 script 中提取
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.getAttribute('data-src') || ''
        if (src && (src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.matrimonio.com/vendor/') || src.includes('cdn0.hitched.co.uk/vendor/'))) {
          const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          imageSet.add(hd)
        }
      })
      // 从 JSON script 中提取
      document.querySelectorAll('script[type="application/json"], script[type="application/ld+json"]').forEach(el => {
        try {
          const jsonStr = JSON.stringify(JSON.parse(el.innerHTML || el.textContent))
          const matches = jsonStr.match(/https?:\/\/cdn0\.(weddingwire|matrimonio|hitched)\.com\/vendor\/[^"\\]+\.(jpeg|jpg|png)/gi)
          if (matches) matches.forEach(u => {
            const hd = u.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
            imageSet.add(hd)
          })
        } catch {}
      })
      // 从 .storefrontMultiGallery 提取
      document.querySelectorAll('.storefrontMultiGallery img, [class*="gallery"] img').forEach(img => {
        const src = img.src || img.getAttribute('data-src') || ''
        if (src && src.includes('cdn0')) {
          const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          imageSet.add(hd)
        }
      })
      const images = [...imageSet].slice(0, maxImgs)

      // 评分
      let rating = '', reviewCount = '0'
      if (ldData?.aggregateRating) {
        rating = String(ldData.aggregateRating.ratingValue || '')
        reviewCount = String(ldData.aggregateRating.reviewCount || '0')
      }
      if (!rating) {
        const m = document.body.textContent.match(/(\d+\.?\d*)\s+out of 5/)
        if (m) rating = m[1]
      }

      // 位置
      let location = ''
      const locEl = document.querySelector('.storefrontHeadingLocation__label a')
      if (locEl) location = locEl.textContent.trim()
      if (!location && ldData?.address) {
        const addr = ldData.address
        location = [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(', ')
      }

      // 场地类型
      let venueType = ''
      const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]')
      if (breadcrumb) {
        const m = breadcrumb.textContent.match(/(\w+)\s*Weddings?/i)
        if (m) venueType = m[1]
      }

      // 提取 FAQ
      const faqItems = []
      document.querySelectorAll('.storefrontFaq__question').forEach((qEl, idx) => {
        const q = qEl.textContent.trim()
        const aEl = qEl.closest('[class*="faq"]')?.querySelector('[class*="answer"]') || qEl.nextElementSibling
        const a = aEl ? aEl.textContent.trim() : ''
        if (q && a) faqItems.push({ q, a })
      })

      // 提取预算信息
      const budgetTexts = []
      document.querySelectorAll('[class*="pricing"], [class*="Pricing"], [class*="budget"]').forEach(el => {
        const text = el.textContent.trim()
        if (text && text.match(/\$|€|£|\d{3,}/)) {
          budgetTexts.push(text.slice(0, 200))
        }
      })

      // 提取宾客容量
      const capacityTexts = []
      document.querySelectorAll('[class*="capacity"], [class*="guest"]').forEach(el => {
        const text = el.textContent.trim()
        if (text && text.match(/\d+/)) {
          capacityTexts.push(text.slice(0, 100))
        }
      })

      return { name, description, images, rating, reviewCount, location, venueType, ldData: !!ldData, faqItems, budgetTexts, capacityTexts }
    }, MAX_IMAGES)

    if (!data || !data.name) return null

    // 构建 venue_types
    const typeMap = {
      'Mansion': { name: '庄园', name_en: 'Mansion' },
      'Garden': { name: '花园', name_en: 'Garden' },
      'Hotel': { name: '酒店', name_en: 'Hotel' },
      'Restaurant': { name: '餐厅', name_en: 'Restaurant' },
      'Barn': { name: '谷仓', name_en: 'Barn' },
      'Banquet': { name: '宴会厅', name_en: 'Banquet Hall' },
      'Country': { name: '乡村', name_en: 'Country House' },
      'Historic': { name: '历史建筑', name_en: 'Historic Building' },
      'Manor': { name: '庄园', name_en: 'Manor House' },
    }
    let venueTypes = []
    if (data.venueType && typeMap[data.venueType]) {
      venueTypes.push(typeMap[data.venueType])
    }
    // Hotel Corallo is a hotel
    if (venueTypes.length === 0) {
      const nameLower = data.name.toLowerCase()
      if (nameLower.includes('hotel')) {
        venueTypes.push({ name: '酒店', name_en: 'Hotel' })
      }
    }
    if (venueTypes.length === 0) {
      venueTypes.push({ name: '婚礼场地', name_en: 'Wedding Venue' })
    }

    // 构建 towns
    const towns = []
    if (data.location) {
      towns.push({ name: data.location, name_cn: data.location })
    }
    if (towns.length === 0) towns.push({ name: 'Italy', name_cn: '意大利' })

    // 构建 features
    let features = []
    if (data.description) {
      const sentences = data.description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 8).map(s => s.slice(0, 120))
    }
    if (data.rating && data.reviewCount !== '0') {
      features.push(`WeddingWire ${data.rating}分（${data.reviewCount}条评价）`)
    }
    if (features.length === 0) features = ['Italian wedding venue', 'Professional wedding service']

    // 构建 budget_ranges
    let budgetRanges = []
    if (data.budgetTexts && data.budgetTexts.length > 0) {
      for (const bt of data.budgetTexts.slice(0, 3)) {
        const nums = bt.match(/\$?([\d,]+)/g)
        if (nums && nums.length > 0) {
          const min = parseInt(nums[0].replace(/[$,]/g, ''))
          if (!isNaN(min) && min > 0) {
            budgetRanges.push({ label: bt.slice(0, 60), min, max: null })
          }
        }
      }
    }

    // 构建 guest_capacities
    let guestCapacities = data.capacityTexts || []
    if (guestCapacities.length === 0) guestCapacities = []

    // 构建 FAQ
    let faq = data.faqItems || []

    const tagline = data.description ? data.description.split(/[。\.\n]/)[0].trim().slice(0, 100) : `${data.name} - Italy Wedding Venue`

    return {
      name: data.name,
      tagline,
      description: data.description || `${data.name} is a wedding venue in Italy.`,
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(data.images),
      imageCount: data.images.length,
      budget_ranges: JSON.stringify(budgetRanges),
      guest_capacities: JSON.stringify(guestCapacities),
      faq: JSON.stringify(faq),
      cover_image: data.images[0] || '',
      rating: data.rating,
      review_count: data.reviewCount,
      location: data.location
    }
  } catch (err) {
    console.error('爬取失败:', url, err.message)
    return null
  }
}

main().catch(err => {
  console.error('脚本执行失败:', err)
  process.exit(1)
})
