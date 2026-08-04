/**
 * 测试希腊婚礼场地爬取脚本（本地运行，puppeteer-core）
 * 
 * 爬取 WeddingWire 希腊 7 个场地详情页，入库 cv_test_greece / cd_test_greece 表
 * 数据放在"测试希腊"下，不影响线上"希腊"数据
 * 
 * 用法: node scripts/crawl-test-greece-puppeteer.cjs
 */

const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 配置 =====
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'verra_voile',
  waitForConnections: true,
  connectionLimit: 3,
}
const COUNTRY = 'Test Greece'
const COUNTRY_CN = '测试希腊'
const SUFFIX = 'test_greece'
const MAX_IMAGES = 24

// ===== 希腊场地 URL（从搜索页提取） =====
const VENUES = [
  { name: 'Alsos Nimfon', url: 'https://www.weddingwire.com/biz/alsos-nimfon/7ce63ab1d0565691.html' },
  { name: 'Villa Bordeaux Santorini', url: 'https://www.weddingwire.com/biz/villa-bordeaux-santorini/dddd83f70e6872e8.html' },
  { name: 'Rocabella Santorini Hotel & Spa', url: 'https://www.weddingwire.com/biz/rocabella-santorini-hotel-spa/db429a4a4862f52f.html' },
  { name: 'Love Cave', url: 'https://www.weddingwire.com/biz/love-cave/6d60128a24795b9d.html' },
  { name: 'Ktima Orizontes', url: 'https://www.weddingwire.com/biz/ktima-orizontes-kropia-194-00/2a11211c0533a03b.html' },
  { name: 'Agaze Bistro Restaurant', url: 'https://www.weddingwire.com/biz/agaze-bistro-restaurant/207426bc2a2310fa.html' },
  { name: 'Golf Prive Manor House', url: 'https://www.weddingwire.com/biz/golf-prive-manor-house/c6aefec61ea0d520.html' },
]

// ===== 工具函数 =====
function makeSlug(name) {
  return 'test-greece-' + name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)
}

const DEFAULT_BUDGET = JSON.stringify([
  { label: '2万-5万欧元', min: 20000, max: 50000 },
  { label: '5万-10万欧元', min: 50000, max: 100000 },
  { label: '10万欧元以上', min: 100000, max: null }
])
const DEFAULT_GUEST = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

// ===== 爬取单个场地 =====
async function crawlVenue(page, venue) {
  const result = {
    name: venue.name,
    url: venue.url,
    slug: makeSlug(venue.name),
    success: false,
    error: null,
    data: null
  }

  try {
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await wait(2500)

    // 点击 "Read more" 展开完整描述
    try {
      const readMoreBtns = await page.$$('.storefrontDescription__link')
      for (const btn of readMoreBtns) {
        try { await btn.click() } catch {}
      }
      await wait(500)
    } catch {}

    // 提取 JSON-LD 数据
    const jsonData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      const results = []
      scripts.forEach(s => {
        try { results.push(JSON.parse(s.textContent)) } catch {}
      })
      return results
    })

    // 找到 LocalBusiness 类型的 JSON-LD
    let ldData = null
    for (const item of jsonData) {
      if (item['@type'] === 'LocalBusiness' || item['@type'] === 'WeddingVenue') {
        ldData = item
        break
      }
      if (item['@graph']) {
        for (const sub of item['@graph']) {
          if (sub['@type'] === 'LocalBusiness' || sub['@type'] === 'WeddingVenue') {
            ldData = sub
            break
          }
        }
      }
      if (ldData) break
    }

    // 提取描述
    let description = ''
    try {
      const descEl = await page.$('.storefrontDescription__content')
      if (descEl) {
        description = await page.evaluate(el => {
          const paragraphs = el.querySelectorAll('p')
          if (paragraphs.length > 0) {
            return Array.from(paragraphs).map(p => p.textContent.trim()).filter(t => t).join('\n\n')
          }
          return el.textContent.trim()
        }, descEl)
      }
    } catch {}

    if (!description && ldData && ldData.description) {
      description = ldData.description
    }

    // 提取场地类型（从面包屑）
    let venueTypes = []
    try {
      const breadcrumbText = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Breadcrumb"]') || document.querySelector('.storefrontNavigationBreadcrumb')
        if (!nav) return ''
        return nav.textContent
      })
      if (breadcrumbText) {
        const typeMatch = breadcrumbText.match(/(\w+)\s*Weddings?/i)
        if (typeMatch) {
          const typeEn = typeMatch[1]
          const typeMap = {
            'Mansion': { name: 'Mansion', name_cn: '庄园' },
            'Garden': { name: 'Garden', name_cn: '花园' },
            'Hotel': { name: 'Hotel', name_cn: '酒店' },
            'Restaurant': { name: 'Restaurant', name_cn: '餐厅' },
            'Barn': { name: 'Barn', name_cn: '谷仓' },
            'Banquet': { name: 'Banquet Hall', name_cn: '宴会厅' },
            'Country': { name: 'Country House', name_cn: '乡村庄园' },
            'Historic': { name: 'Historic Building', name_cn: '历史建筑' },
            'Manor': { name: 'Manor House', name_cn: '庄园' },
          }
          if (typeMap[typeEn]) venueTypes.push(typeMap[typeEn])
        }
      }
    } catch {}

    // 提取城镇/位置
    let towns = []
    try {
      const locationText = await page.evaluate(() => {
        const loc = document.querySelector('.storefrontHeadingLocation__label a')
        return loc ? loc.textContent.trim() : ''
      })
      if (locationText) {
        towns.push({ name: locationText, name_cn: locationText })
      }
      if (ldData && ldData.address) {
        const addr = ldData.address
        if (addr.addressLocality && !towns.find(t => t.name === addr.addressLocality)) {
          towns.push({ name: addr.addressLocality, name_cn: addr.addressLocality })
        }
        if (addr.addressRegion && !towns.find(t => t.name === addr.addressRegion)) {
          towns.push({ name: addr.addressRegion, name_cn: addr.addressRegion })
        }
      }
    } catch {}

    // 提取图片 URL
    let images = []
    // 从 JSON-LD 获取
    if (ldData && ldData.image) {
      const imgList = Array.isArray(ldData.image) ? ldData.image : [ldData.image]
      for (const img of imgList) {
        const imgUrl = typeof img === 'string' ? img : (img.contentUrl || img.url || '')
        if (imgUrl && !images.includes(imgUrl)) {
          const hd = imgUrl.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          images.push(hd)
        }
        if (images.length >= MAX_IMAGES) break
      }
    }

    // 如果 JSON-LD 没有图片，从 DOM 提取
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
          if (!seen.has(hd)) {
            seen.add(hd)
            images.push(hd)
          }
          if (images.length >= MAX_IMAGES) break
        }
      } catch {}
    }

    // 提取评分
    let rating = null
    let reviewCount = 0
    if (ldData && ldData.aggregateRating) {
      rating = parseFloat(ldData.aggregateRating.ratingValue) || null
      reviewCount = parseInt(ldData.aggregateRating.reviewCount) || 0
    }

    // 构建 tagline
    let tagline = ''
    if (description) {
      const firstSentence = description.split(/[。\.\n]/)[0].trim()
      tagline = firstSentence.slice(0, 80)
    }

    // 构建特色
    let features = []
    if (description) {
      const sentences = description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (rating && reviewCount > 0) {
      features.push(`WeddingWire ${rating}分（${reviewCount}条评价）`)
    }

    // 确保至少有场地类型
    if (venueTypes.length === 0) {
      const nameLower = venue.name.toLowerCase()
      if (nameLower.includes('hall') || nameLower.includes('manor') || nameLower.includes('court')) {
        venueTypes.push({ name: 'Manor House', name_cn: '庄园' })
      } else if (nameLower.includes('hotel')) {
        venueTypes.push({ name: 'Hotel', name_cn: '酒店' })
      } else if (nameLower.includes('villa')) {
        venueTypes.push({ name: 'Villa', name_cn: '别墅' })
      } else if (nameLower.includes('cave')) {
        venueTypes.push({ name: 'Cave', name_cn: '洞穴' })
      } else if (nameLower.includes('restaurant') || nameLower.includes('bistro')) {
        venueTypes.push({ name: 'Restaurant', name_cn: '餐厅' })
      } else {
        venueTypes.push({ name: 'Wedding Venue', name_cn: '婚礼场地' })
      }
    }

    if (towns.length === 0) {
      towns.push({ name: 'Greece', name_cn: '希腊' })
    }
    if (!description) {
      description = `${venue.name} is a selected wedding venue in Greece, offering premium wedding services and unique venue experiences.`
    }
    if (features.length === 0) {
      features = ['Selected wedding venue in Greece', 'Professional wedding service team']
    }

    const coverImage = images[0] || ''

    result.data = {
      slug: result.slug,
      name: venue.name,
      name_cn: '',
      tagline: tagline || `${venue.name} - Greece Wedding Venue`,
      tagline_cn: '',
      description: description,
      description_cn: '',
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(images),
      budget_ranges: DEFAULT_BUDGET,
      guest_capacities: DEFAULT_GUEST,
      cover_image: coverImage,
      source_url: venue.url,
      rating: rating,
      review_count: reviewCount,
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
  console.log(`🇬🇷 开始爬取希腊 ${VENUES.length} 个场地（测试希腊）...`)

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  console.log('✓ 浏览器已启动')

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  // 先访问 WeddingWire 建立会话
  try {
    await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log('✓ 已建立 WeddingWire 会话')
  } catch (e) {
    console.log('⚠ WeddingWire 首页加载超时，继续...')
  }

  const results = []
  let successCount = 0
  let failCount = 0
  let skipCount = 0

  const cvTable = `cv_${SUFFIX}`
  const cdTable = `cd_${SUFFIX}`

  for (let i = 0; i < VENUES.length; i++) {
    const venue = VENUES[i]
    console.log(`\n[${i + 1}/${VENUES.length}] 爬取: ${venue.name}`)

    const result = await crawlVenue(page, venue)

    if (result.success && result.data) {
      const d = result.data
      try {
        // 检查是否已存在（只增不覆盖）
        const [existing] = await pool.execute(
          `SELECT id FROM \`${cvTable}\` WHERE slug = ?`,
          [d.slug]
        )

        if (existing.length > 0) {
          console.log(`  ⏭ 已存在，跳过: ${d.slug}`)
          results.push({ name: d.name, slug: d.slug, status: '已存在' })
          skipCount++
        } else {
          // 写入 cv_ 表
          await pool.execute(
            `INSERT INTO \`${cvTable}\` 
             (slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn, description, description_cn,
              features, venue_types, towns, images, budget_ranges, guest_capacities,
              faq, cover_image, rating, review_count, location, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, d.source_url,
             d.tagline, d.tagline_cn, d.description, d.description_cn,
             d.features, d.venue_types, d.towns,
             d.images, d.budget_ranges, d.guest_capacities,
             d.faq, d.cover_image,
             d.rating || '', d.review_count || '0',
             d.location || '', 100 + i]
          )

          // 写入 cd_ 表
          await pool.execute(
            `INSERT INTO \`${cdTable}\` 
             (slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn, description, description_cn,
              features, venue_types, towns, images, budget_ranges, guest_capacities,
              faq, cover_image, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, d.source_url,
             d.tagline, d.tagline_cn, d.description, d.description_cn,
             d.features, d.venue_types, d.towns,
             d.images, d.budget_ranges, d.guest_capacities,
             d.faq, d.cover_image, 100 + i]
          )

          // 写入 products 表
          const imgCount = JSON.parse(d.images).length
          await pool.execute(
            `INSERT INTO products (category_id, product_id, name, name_en, description, image, price, unit, highlight)
             VALUES (?, ?, ?, ?, ?, ?, 0, '€', ?)
             ON DUPLICATE KEY UPDATE name=VALUES(name)`,
            ['destination', d.slug, d.name, d.name, `${COUNTRY_CN}婚礼场地`, d.cover_image, '希腊精选']
          )

          console.log(`  ✓ 已入库: ${d.name} | 图片${imgCount}张 | 描述${d.description.length}字`)
          results.push({ name: d.name, slug: d.slug, images: imgCount, status: '已入库' })
          successCount++
        }
      } catch (dbErr) {
        console.error(`  ✗ 数据库操作失败: ${dbErr.message}`)
        results.push({ name: venue.name, slug: result.slug, status: `DB错误: ${dbErr.message}` })
        failCount++
      }
    } else {
      console.log(`  ✗ 爬取失败: ${result.error}`)
      results.push({ name: venue.name, slug: result.slug, status: `爬取失败: ${result.error}` })
      failCount++
    }

    // 随机延时，避免被封
    if (i < VENUES.length - 1) {
      await wait(1500 + Math.random() * 1000)
    }
  }

  await browser.close()
  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 爬取完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}, 耗时: ${elapsed}秒`)
  console.log(`\n结果汇总:`)
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} - ${r.status}`)
  })
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err.message)
  process.exit(1)
})
