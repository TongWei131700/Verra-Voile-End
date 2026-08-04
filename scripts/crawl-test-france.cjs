/**
 * 测试法国 - 57个场地爬取脚本（本地运行）
 * 数据写入 cv_test_france / cd_test_france，不影响正式法国数据
 * 
 * 用法: node scripts/crawl-test-france.cjs
 */

const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 配置 =====
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'verra_voile',
  waitForConnections: true,
  connectionLimit: 3,
}
const COUNTRY = 'Test France'
const COUNTRY_CN = '测试法国'
const CV_TABLE = 'cv_test_france'
const CD_TABLE = 'cd_test_france'
const MAX_IMAGES = 24

// ===== 57个法国场地URL（从搜索页 destCountry=3 提取） =====
const VENUES = [
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-bourlie--e2225000',
  'https://www.weddingwire.com/destination-wedding/france/domaine-de-beauregard--e2229202',
  'https://www.weddingwire.com/destination-wedding/france/rocabella--e2216044',
  'https://www.weddingwire.com/destination-wedding/france/domaine-terra-rosa--e2191838',
  'https://www.weddingwire.com/destination-wedding/france/chateau-heloise--e2236838',
  'https://www.weddingwire.com/destination-wedding/france/les-domaines-de-patras--e2142416',
  'https://www.weddingwire.com/destination-wedding/france/chateau-des-briottieres--e2042507',
  'https://www.weddingwire.com/destination-wedding/france/fleurs-de-prestige--e2219288',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-tresserve--e2001745',
  'https://www.weddingwire.com/destination-wedding/france/chateau-le-fresne--e2090847',
  'https://www.weddingwire.com/biz/alliance-revee/2e788c751eb30bf8.html',
  'https://www.weddingwire.com/destination-wedding/france/les-jardins-darlias-by-la-villa-alexandra--e2218082',
  'https://www.weddingwire.com/destination-wedding/france/domaine-du-grand-lauron--e2197854',
  'https://www.weddingwire.com/destination-wedding/france/le-domaine-anse-marcel-beach--e2211738',
  'https://www.weddingwire.com/destination-wedding/france/la-dime-de-giverny--e1992655',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-faye--e2233222',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-chaumontel--e2221826',
  'https://www.weddingwire.com/biz/dream-paris-wedding/2fe93e8fc84424c5.html',
  'https://www.weddingwire.com/destination-wedding/france/le-mas-des-cinq-fontaines--e2132875',
  'https://www.weddingwire.com/destination-wedding/france/domaine-d-aveny--e2152703',
  'https://www.weddingwire.com/destination-wedding/france/chateau-comtesse-lafond--e2215968',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-laurentie--e2213646',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-serre-de-parc--e2217626',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-thorens--e2108701',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-saint-martin-du-tertre--e2200210',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-seguin--e2099525',
  'https://www.weddingwire.com/destination-wedding/france/chateau-pimo--e2214730',
  'https://www.weddingwire.com/destination-wedding/france/chateau-des-perrais--e2233910',
  'https://www.weddingwire.com/biz/samantha-bottelier-events/3c1bc49663f940b9.html',
  'https://www.weddingwire.com/destination-wedding/france/couvent-notre-dame-des-pres--e2162793',
  'https://www.weddingwire.com/destination-wedding/france/chateau-saint-laurent--e2207142',
  'https://www.weddingwire.com/destination-wedding/france/le-petit-roulet--e2114615',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-pascalette--e2232310',
  'https://www.weddingwire.com/destination-wedding/france/domaine-santa-maria--e2154721',
  'https://www.weddingwire.com/destination-wedding/france/chateau-sentout--e2216644',
  'https://www.weddingwire.com/biz/noces-du-monde/036d5b2116ec8082.html',
  'https://www.weddingwire.com/destination-wedding/france/abbaye-de-talloires--e2121487',
  'https://www.weddingwire.com/destination-wedding/france/chateau-le-chereau--e2234246',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-vergieres--e2211030',
  'https://www.weddingwire.com/destination-wedding/france/lmk-events--e2233234',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-scalibert--e2223360',
  'https://www.weddingwire.com/destination-wedding/france/le-mas-de-la-rose--e2096297',
  'https://www.weddingwire.com/destination-wedding/france/la-grange-de-javon--e2159329',
  'https://www.weddingwire.com/destination-wedding/france/mas-de-la-massane--e2234596',
  'https://www.weddingwire.com/destination-wedding/france/la-tresoriere--e2191310',
  'https://www.weddingwire.com/destination-wedding/france/la-faiseuse-de-reves--e2233224',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-noe-seche--e2233988',
  'https://www.weddingwire.com/biz/phyllis-kent-events-weddings/24042f30ed95be8f.html',
  'https://www.weddingwire.com/destination-wedding/france/white-house-cannes--e2209162',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-colaissiere--e1950453',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-courcelles-le-roy--e2008027',
  'https://www.weddingwire.com/destination-wedding/france/chateau-la-tour-vaucros--e1950435',
  'https://www.weddingwire.com/destination-wedding/france/domaine-le-grand-belly--e2092325',
  'https://www.weddingwire.com/destination-wedding/france/domaine-de-la-chartrogniere--e2136551',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-jarthe--e2224724',
  'https://www.weddingwire.com/destination-wedding/france/domaine-la-plume--e2120425',
  'https://www.weddingwire.com/biz/kiss-me-in-paris-wedding-planner/d8fea5cb214f3fbb.html',
]

const DEFAULT_BUDGET = JSON.stringify([
  { label: '2万-5万欧元', min: 20000, max: 50000 },
  { label: '5万-10万欧元', min: 50000, max: 100000 },
  { label: '10万欧元以上', min: 100000, max: null }
])
const DEFAULT_GUEST = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

function makeSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// ===== 爬取单个场地 =====
async function crawlVenue(page, url, index) {
  const venueName = url.split('/').pop().split('--')[0].replace(/-/g, ' ')
  const result = { name: venueName, url, slug: makeSlug(venueName), success: false, data: null, error: null }

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await wait(2000)

    // 点击 Read more 展开
    try {
      const btns = await page.$$('.storefrontDescription__link')
      for (const btn of btns) { try { await btn.click() } catch {} }
      await wait(500)
    } catch {}

    // 提取数据
    const data = await page.evaluate((maxImgs) => {
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
      if (imageSet.size === 0) {
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src') || ''
          if (src && (src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.mariages.net/vendor/'))) {
            const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
            imageSet.add(hd)
          }
        })
      }
      const images = [...imageSet].slice(0, maxImgs)

      let rating = '', reviewCount = '0'
      if (ldData?.aggregateRating) {
        rating = String(ldData.aggregateRating.ratingValue || '')
        reviewCount = String(ldData.aggregateRating.reviewCount || '0')
      }
      if (!rating) {
        const m = document.body.textContent.match(/(\d+\.?\d*)\s+out of 5/)
        if (m) rating = m[1]
      }

      let location = ''
      const locEl = document.querySelector('.storefrontHeadingLocation__label a')
      if (locEl) location = locEl.textContent.trim()
      if (!location && ldData?.address) {
        const addr = ldData.address
        location = [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(', ')
      }

      let venueType = ''
      const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]')
      if (breadcrumb) {
        const m = breadcrumb.textContent.match(/(\w+)\s*Weddings?/i)
        if (m) venueType = m[1]
      }

      return { name, description, images, rating, reviewCount, location, venueType }
    }, MAX_IMAGES)

    if (!data || !data.name) {
      result.error = '无法提取数据'
      return result
    }

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
      'Chateau': { name: '城堡', name_en: 'Château' },
    }
    let venueTypes = []
    if (data.venueType && typeMap[data.venueType]) {
      venueTypes.push(typeMap[data.venueType])
    }
    if (venueTypes.length === 0) {
      const nameLower = data.name.toLowerCase()
      if (nameLower.includes('chateau')) venueTypes.push({ name: '城堡', name_en: 'Château' })
      else if (nameLower.includes('domaine')) venueTypes.push({ name: '庄园', name_en: 'Estate' })
      else venueTypes.push({ name: '婚礼场地', name_en: 'Wedding Venue' })
    }

    // 构建 towns
    let towns = []
    if (data.location) {
      towns.push({ name: data.location, name_cn: data.location })
    }
    if (towns.length === 0) {
      towns.push({ name: 'France', name_cn: '法国' })
    }

    // 构建 features
    let features = []
    if (data.description) {
      const sentences = data.description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (data.rating && data.reviewCount !== '0') {
      features.push(`WeddingWire ${data.rating}分（${data.reviewCount}条评价）`)
    }
    if (features.length === 0) features = ['法国精选婚礼场地', '专业婚礼服务团队']

    // tagline
    let tagline = ''
    if (data.description) {
      const first = data.description.split(/[。\.\n]/)[0].trim()
      tagline = first.slice(0, 80)
    }
    if (!tagline) tagline = `${data.name} - 法国婚礼场地`

    const slug = makeSlug(data.name)
    const coverImage = data.images[0] || ''

    result.slug = slug
    result.data = {
      slug,
      name: data.name,
      name_cn: '',
      tagline,
      description: data.description || '',
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(data.images),
      budget_ranges: DEFAULT_BUDGET,
      guest_capacities: DEFAULT_GUEST,
      faq: JSON.stringify([]),
      cover_image: coverImage,
      rating: data.rating || '',
      review_count: data.reviewCount || '0',
      location: data.location || '',
    }
    result.success = true
    result.name = data.name

  } catch (err) {
    result.error = err.message
  }

  return result
}

// ===== 主函数 =====
async function main() {
  const startTime = Date.now()
  console.log(`🇫🇷 开始爬取测试法国 ${VENUES.length} 个场地...`)
  console.log(`数据写入: ${CV_TABLE} / ${CD_TABLE}`)

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 本地数据库已连接')

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  console.log('✓ 浏览器已启动')

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  // 建立会话
  try {
    await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log('✓ 已建立 WeddingWire 会话')
  } catch (e) {
    console.log('⚠ 首页加载超时，继续...')
  }

  let successCount = 0, failCount = 0, skipCount = 0

  for (let i = 0; i < VENUES.length; i++) {
    const url = VENUES[i]
    const venueName = url.split('/').pop().split('--')[0].replace(/-/g, ' ')
    console.log(`\n[${i + 1}/${VENUES.length}] 爬取: ${venueName}`)

    const result = await crawlVenue(page, url, i)

    if (result.success && result.data) {
      const d = result.data
      try {
        // 检查 cv_test_france 是否已存在
        const [existing] = await pool.execute(
          `SELECT id FROM \`${CV_TABLE}\` WHERE slug = ?`,
          [d.slug]
        )
        if (existing.length > 0) {
          console.log(`  ⏭ 已存在，跳过: ${d.slug}`)
          skipCount++
          continue
        }

        // 写入 cv_test_france（完整详情）
        await pool.execute(
          `INSERT INTO \`${CV_TABLE}\`
           (slug, name, name_cn, country, country_cn, source_url, tagline, description,
            features, venue_types, towns, images, budget_ranges, guest_capacities,
            faq, cover_image, rating, review_count, location, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, url, d.tagline,
           d.description, d.features, d.venue_types, d.towns, d.images,
           d.budget_ranges, d.guest_capacities, d.faq, d.cover_image,
           d.rating, d.review_count, d.location, 200 + i]
        )

        // 写入 cd_test_france（前端列表）
        await pool.execute(
          `INSERT INTO \`${CD_TABLE}\`
           (slug, name, name_cn, country, country_cn, source_url, tagline, description,
            features, venue_types, towns, images, budget_ranges, guest_capacities,
            faq, cover_image, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, url, d.tagline,
           d.description, d.features, d.venue_types, d.towns, d.images,
           d.budget_ranges, d.guest_capacities, d.faq, d.cover_image, 200 + i]
        )

        const imgCount = JSON.parse(d.images).length
        console.log(`  ✓ 已入库: ${d.name} | 图片${imgCount}张 | 描述${d.description.length}字`)
        successCount++
      } catch (dbErr) {
        console.error(`  ✗ 数据库失败: ${dbErr.message}`)
        failCount++
      }
    } else {
      console.log(`  ✗ 爬取失败: ${result.error}`)
      failCount++
    }

    // 随机延时
    if (i < VENUES.length - 1) await wait(1500 + Math.random() * 1000)
  }

  await browser.close()
  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 爬取完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}, 耗时: ${elapsed}秒`)
}

main().catch(err => {
  console.error('❌ 脚本失败:', err.message)
  process.exit(1)
})
