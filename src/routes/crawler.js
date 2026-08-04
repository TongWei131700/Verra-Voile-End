const cheerio = require('cheerio')
const { pool } = require('../db')
const { sendCrawlStart, sendCrawlResult, sendCrawlProgress } = require('./mailer')

// puppeteer-core（服务器端使用）
let puppeteer = null
try {
  puppeteer = require('puppeteer-core')
} catch (e) {
  console.log('puppeteer-core 未安装，将使用 fetch 模式')
}
const CHROME_PATH = '/usr/bin/chromium-browser'

// 爬取状态
let crawlState = {
  running: false,
  country: null,
  startTime: null,
  progress: '',
  results: [],
  error: null
}

// 希腊目的地翻译映射
const GREECE_NAME_CN = {
  'Santorini': '圣托里尼',
  'Mykonos': '米科诺斯',
  'Crete': '克里特岛',
  'Athens': '雅典',
  'Rhodes': '罗德岛',
  'Corfu': '科孚岛',
  'Zakynthos': '扎金索斯',
  'Kefalonia': '凯法利尼亚',
  'Naxos': '纳克索斯',
  'Paros': '帕罗斯',
  'Milos': '米洛斯',
  'Chania': '干尼亚',
  'Heraklion': '伊拉克利翁',
  'Kalamata': '卡拉马塔',
  'Peloponnese': '伯罗奔尼撒',
  'Halkidiki': '哈尔基迪基',
  'Skopelos': '斯科派洛斯',
  'Tinos': '蒂诺斯',
  'Folegandros': '福利甘德罗斯',
  'Ios': '伊奥斯',
  'Kos': '科斯',
  'Skiathos': '斯基亚索斯',
  'Lefkada': '莱夫卡达',
  'Kythira': '基西拉',
  'Spetses': '斯佩察',
  'Hydra': '伊德拉',
  'Aegina': '埃伊纳',
  'Poros': '波罗斯',
  'Symi': '锡米',
  'Patmos': '帕特莫斯',
  'Sifnos': '锡夫诺斯',
  'Serifos': '塞里福斯',
  'Kimolos': '基莫洛斯',
  'Amorgos': '阿莫尔戈斯',
  'Astypalaia': '阿斯蒂帕莱亚',
  'Karpathos': '卡尔帕索斯',
  'Kasos': '卡索斯',
  'Antiparos': '安迪帕罗斯',
  'Donousa': '多努萨',
  'Schinoussa': '斯基努萨',
  'Iraklia': '伊拉克利亚',
  'Anafi': '阿纳菲'
}

function getNameCN(name) {
  if (GREECE_NAME_CN[name]) return GREECE_NAME_CN[name]
  // 尝试模糊匹配
  for (const [en, cn] of Object.entries(GREECE_NAME_CN)) {
    if (name.toLowerCase().includes(en.toLowerCase()) || en.toLowerCase().includes(name.toLowerCase())) {
      return cn
    }
  }
  return name
}

// 从 WeddingWire 爬取希腊目的地
async function crawlGreeceDestinations(limit = 5) {
  const COUNTRY = 'Greece'
  const COUNTRY_CN = '希腊'
  const SOURCE_URL = 'https://www.weddingwire.com/shared/search?state_id=1030&region_id=10531&group_id=1'

  crawlState = {
    running: true,
    country: COUNTRY_CN,
    startTime: Date.now(),
    progress: '正在连接 WeddingWire...',
    results: [],
    error: null
  }

  // 发送开始通知
  await sendCrawlStart(COUNTRY_CN)

  // 30分钟进度通知定时器
  const progressTimer = setInterval(async () => {
    const elapsed = Date.now() - crawlState.startTime
    if (elapsed >= 30 * 60 * 1000 && crawlState.running) {
      await sendCrawlProgress(COUNTRY_CN, elapsed, crawlState.progress)
    }
  }, 30 * 60 * 1000)

  try {
    // 请求 WeddingWire 搜索页面
    crawlState.progress = '正在请求 WeddingWire 搜索页面...'
    let html = ''
    try {
      const response = await fetch(SOURCE_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8'
        }
      })
      if (response.ok) {
        html = await response.text()
      } else {
        console.log(`WeddingWire 返回 ${response.status}，将使用后备数据`)
      }
    } catch (fetchErr) {
      console.log('WeddingWire 请求失败，将使用后备数据:', fetchErr.message)
    }

    crawlState.progress = '正在解析页面内容...'
    const destinations = []

    if (html) {
      const $ = cheerio.load(html)

      // WeddingWire 搜索结果解析
      // 尝试多种选择器以适配页面结构
      const selectors = [
        'a[href*="/destinations/"]',
        '[data-testid="destination-card"]',
        '.destination-card a',
        'a[href*="destCountry"]'
      ]

      // 先尝试从页面中提取 JSON 数据（很多现代网站用 JSON 传递数据）
      const scripts = $('script[type="application/json"], script[type="application/ld+json"]')
      scripts.each((_, el) => {
        try {
          const json = JSON.parse($(el).html())
          // 递归查找目的地数据
          findDestinations(json, destinations, limit)
        } catch (e) { /* ignore parse errors */ }
      })

      // 如果 JSON 方式没找到，用 DOM 解析
      if (destinations.length === 0) {
        for (const selector of selectors) {
          $(selector).each((_, el) => {
            if (destinations.length >= limit) return false
            const href = $(el).attr('href') || ''
            const text = $(el).text().trim()
            if (text && href.includes('destination')) {
              const name = text.split('\n')[0].trim()
              if (name && !destinations.find(d => d.name === name)) {
                destinations.push({
                  name,
                  name_cn: getNameCN(name),
                  url: href.startsWith('http') ? href : `https://www.weddingwire.com${href}`
                })
              }
            }
          })
          if (destinations.length > 0) break
        }
      }
    }

    // 后备：已知希腊目的地
    if (destinations.length === 0) {
      crawlState.progress = '使用已知希腊目的地数据...'
      const knownGreece = [
        { name: 'Santorini', name_cn: '圣托里尼', url: 'https://www.weddingwire.com/destination-weddings/santorini' },
        { name: 'Mykonos', name_cn: '米科诺斯', url: 'https://www.weddingwire.com/destination-weddings/mykonos' },
        { name: 'Crete', name_cn: '克里特岛', url: 'https://www.weddingwire.com/destination-weddings/crete' },
        { name: 'Athens', name_cn: '雅典', url: 'https://www.weddingwire.com/destination-weddings/athens' },
        { name: 'Rhodes', name_cn: '罗德岛', url: 'https://www.weddingwire.com/destination-weddings/rhodes' }
      ]
      destinations.push(...knownGreece.slice(0, limit))
    }

    // 截取到 limit 数量
    const finalDests = destinations.slice(0, limit)
    crawlState.progress = `正在入库 ${finalDests.length} 个目的地...`

    // 入库
    const results = []
    for (let i = 0; i < finalDests.length; i++) {
      const dest = finalDests[i]
      crawlState.progress = `正在入库 ${i + 1}/${finalDests.length}: ${dest.name_cn || dest.name}`

      const slug = dest.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const coverImage = `https://images.unsplash.com/photo-1570071677475-280c43668156?w=800`

      try {
        // 检查是否已存在
        const [existing] = await pool.execute(
          'SELECT id FROM crawled_destinations WHERE slug = ? AND country = ?',
          [slug, COUNTRY]
        )

        if (existing.length > 0) {
          results.push({ name: dest.name, name_cn: dest.name_cn || dest.name, status: '已存在' })
          continue
        }

        await pool.execute(
          `INSERT INTO crawled_destinations 
           (slug, name, name_cn, country, country_cn, source_url, tagline, description, 
            features, venue_types, towns, images, budget_ranges, guest_capacities, 
            cover_image, cover_image_url, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            slug,
            dest.name,
            dest.name_cn || dest.name,
            COUNTRY,
            COUNTRY_CN,
            dest.url || SOURCE_URL,
            `在${dest.name_cn || dest.name}的浪漫婚礼`,
            `${dest.name_cn || dest.name}是希腊最受欢迎的婚礼目的地之一。这里拥有令人叹为观止的自然风光、悠久的历史文化，以及独特的地中海风情，是举办梦想婚礼的完美之选。`,
            JSON.stringify(['海景婚礼', '传统希腊仪式', '日落仪式']),
            JSON.stringify([
              { name: '海景露台', name_en: 'Sea View Terrace' },
              { name: '历史别墅', name_en: 'Historic Villa' },
              { name: '教堂', name_en: 'Chapel' }
            ]),
            JSON.stringify([{ name: dest.name, name_cn: dest.name_cn || dest.name }]),
            JSON.stringify([coverImage]),
            JSON.stringify([
              { label: '3万 - 6万欧元', min: 30000, max: 60000 },
              { label: '6万 - 12万欧元', min: 60000, max: 120000 },
              { label: '12万欧元以上', min: 120000, max: null }
            ]),
            JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上']),
            coverImage,
            coverImage,
            i + 1
          ]
        )
        results.push({ name: dest.name, name_cn: dest.name_cn || dest.name, status: '已入库' })
      } catch (dbErr) {
        console.error(`入库失败: ${dest.name}`, dbErr.message)
        results.push({ name: dest.name, name_cn: dest.name_cn || dest.name, status: `失败: ${dbErr.message}` })
      }
    }

    crawlState.results = results
    crawlState.running = false
    crawlState.progress = '完成'

    // 发送完成通知
    await sendCrawlResult(COUNTRY_CN, results)

    return { success: true, results }
  } catch (err) {
    crawlState.running = false
    crawlState.error = err.message
    crawlState.progress = `失败: ${err.message}`

    // 发送失败通知
    await sendCrawlResult(COUNTRY_CN, [], err.message)

    throw err
  } finally {
    clearInterval(progressTimer)
  }
}

// 递归查找 JSON 中的目的地数据
function findDestinations(obj, results, limit, depth = 0) {
  if (depth > 10 || results.length >= limit) return
  if (!obj || typeof obj !== 'object') return

  if (Array.isArray(obj)) {
    for (const item of obj) {
      findDestinations(item, results, limit, depth + 1)
    }
    return
  }

  // 检查是否是目的地对象
  if (obj.name && (obj.url || obj.href || obj.slug || obj.destination)) {
    const name = obj.name || obj.title || ''
    if (name && !results.find(r => r.name === name)) {
      results.push({
        name,
        name_cn: getNameCN(name),
        url: obj.url || obj.href || ''
      })
    }
  }

  for (const key of Object.keys(obj)) {
    findDestinations(obj[key], results, limit, depth + 1)
  }
}

function getCrawlState() {
  return {
    ...crawlState,
    elapsed: crawlState.startTime ? Date.now() - crawlState.startTime : 0
  }
}

// 英国场地爬取（使用 puppeteer-core）
async function crawlUKVenues(limit = 4) {
  const COUNTRY = 'United Kingdom'
  const COUNTRY_CN = '测试英国'
  const SEARCH_URL = 'https://www.weddingwire.com/shared/search?destCountry=4'
  const MAX_IMAGES = 24

  crawlState = {
    running: true,
    country: COUNTRY_CN,
    startTime: Date.now(),
    progress: '正在启动浏览器...',
    results: [],
    error: null
  }

  await sendCrawlStart(COUNTRY_CN)

  if (!puppeteer) {
    crawlState.running = false
    crawlState.error = 'puppeteer-core 未安装'
    await sendCrawlResult(COUNTRY_CN, [], 'puppeteer-core 未安装')
    return { success: false, error: 'puppeteer-core 未安装' }
  }

  let browser = null
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // 1. 访问搜索页提取场地 URL
    crawlState.progress = '正在请求搜索页...'
    try {
      await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r => setTimeout(r, 3000))
    } catch (e) {
      console.log('搜索页加载超时，继续...')
    }

    // 提取场地详情 URL
    crawlState.progress = '正在解析搜索结果...'
    const venueUrls = await page.evaluate(() => {
      const urls = []
      const seen = new Set()
      // 从链接提取
      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.getAttribute('href') || ''
        if (href.includes('/destination-wedding/') && href.includes('--e') && !seen.has(href)) {
          seen.add(href)
          urls.push(href.startsWith('http') ? href : `https://www.weddingwire.com${href}`)
        }
      })
      // 从 JSON-LD 提取
      document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
        try {
          const str = el.textContent
          const matches = str.match(/https?:\/\/(www\.)?weddingwire\.com\/destination-wedding\/destination\/[^"\\]+/gi)
          if (matches) matches.forEach(url => {
            if (!seen.has(url)) { seen.add(url); urls.push(url) }
          })
        } catch {}
      })
      return urls
    })

    // 后备：已知英国场地
    if (venueUrls.length === 0) {
      crawlState.progress = '搜索页无结果，使用后备英国场地...'
      const knownUK = [
        'https://www.weddingwire.com/destination-wedding/destination/morden-hall--e2229594',
        'https://www.weddingwire.com/destination-wedding/destination/brinsop-court-manor-house-and-barn--e2229393',
        'https://www.weddingwire.com/destination-wedding/destination/st-giles-house--e2229651',
        'https://www.weddingwire.com/destination-wedding/destination/the-old-parsonage--e2229710',
        'https://www.weddingwire.com/destination-wedding/destination/rhodes-house--e2229621',
        'https://www.weddingwire.com/destination-wedding/destination/ewell-hall--e2229464'
      ]
      venueUrls.push(...knownUK)
    }

    const finalUrls = venueUrls.slice(0, limit)
    crawlState.progress = `找到 ${finalUrls.length} 个场地，开始爬取详情...`

    // 先访问 WeddingWire 首页建立会话
    try {
      await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch (e) { /* ignore */ }

    // 2. 逐个爬取场地详情
    const results = []
    for (let i = 0; i < finalUrls.length; i++) {
      const url = finalUrls[i]
      const venueName = url.split('/').pop().split('--')[0].replace(/-/g, ' ')
      crawlState.progress = `正在爬取 ${i + 1}/${finalUrls.length}: ${venueName}`

      try {
        const venueData = await crawlVenueDetailPuppeteer(page, url, MAX_IMAGES)
        if (!venueData) {
          results.push({ url, status: '爬取失败' })
          continue
        }

        venueData.country = COUNTRY
        venueData.country_cn = COUNTRY_CN

        const slug = venueData.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 80)
        venueData.slug = slug

        // 安全约束：仅检查同一国家下的 slug，不影响其他国家数据
        const [existing] = await pool.execute(
          'SELECT id, country_cn FROM crawled_venues WHERE slug = ? AND country_cn = ?',
          [slug, COUNTRY_CN]
        )
        if (existing.length > 0) {
          results.push({ name: venueData.name, slug, status: '已存在' })
          continue
        }

        // 只增不覆盖：INSERT 仅写入当前国家的数据，绝不 UPDATE/DELETE 其他记录
        await pool.execute(
          `INSERT INTO crawled_venues 
           (slug, name, name_cn, country, country_cn, source_url, tagline, description,
            features, venue_types, towns, images, budget_ranges, guest_capacities,
            faq, cover_image, rating, review_count, location, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [slug, venueData.name, '', COUNTRY, COUNTRY_CN, url, venueData.tagline || '',
           venueData.description || '', venueData.features || '[]',
           venueData.venue_types || '[{"name":"Venue","name_en":"Venue"}]',
           venueData.towns || '[]', venueData.images || '[]',
           venueData.budget_ranges || '[]', venueData.guest_capacities || '[]',
           venueData.faq || '[]', venueData.cover_image || '',
           venueData.rating || '', venueData.review_count || '0',
           venueData.location || '', 100 + i]
        )
        results.push({ name: venueData.name, slug, images: venueData.imageCount || 0, status: '已入库' })
      } catch (err) {
        console.error(`爬取失败: ${url}`, err.message)
        results.push({ url, status: `失败: ${err.message}` })
      }

      // 随机延时
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))
    }

    crawlState.results = results
    crawlState.running = false
    crawlState.progress = '完成'
    await sendCrawlResult(COUNTRY_CN, results)
    return { success: true, results }
  } catch (err) {
    crawlState.running = false
    crawlState.error = err.message
    crawlState.progress = `失败: ${err.message}`
    await sendCrawlResult(COUNTRY_CN, [], err.message)
    throw err
  } finally {
    if (browser) await browser.close()
  }
}

// 使用 puppeteer page 爬取单个场地详情
async function crawlVenueDetailPuppeteer(page, url, MAX_IMAGES = 24) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise(r => setTimeout(r, 2000))

    // 点击 Read more 展开描述
    try {
      const btns = await page.$$('.storefrontDescription__link')
      for (const btn of btns) { try { await btn.click() } catch {} }
      await new Promise(r => setTimeout(r, 500))
    } catch {}

    // 提取所有数据
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

      // 名称
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

      // 图片
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
          if (src && (src.includes('cdn0.hitched.co.uk/vendor/') || src.includes('cdn0.weddingwire.com/vendor/'))) {
            const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
            imageSet.add(hd)
          }
        })
      }
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

      // 场地类型（面包屑）
      let venueType = ''
      const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]')
      if (breadcrumb) {
        const m = breadcrumb.textContent.match(/(\w+)\s*Weddings?/i)
        if (m) venueType = m[1]
      }

      return { name, description, images, rating, reviewCount, location, venueType, ldData: !!ldData }
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
    if (venueTypes.length === 0) {
      const nameLower = data.name.toLowerCase()
      if (nameLower.includes('hall') || nameLower.includes('manor') || nameLower.includes('court')) {
        venueTypes.push({ name: '庄园', name_en: 'Manor House' })
      } else if (nameLower.includes('hotel')) {
        venueTypes.push({ name: '酒店', name_en: 'Hotel' })
      } else {
        venueTypes.push({ name: '婚礼场地', name_en: 'Wedding Venue' })
      }
    }

    // 构建 towns
    const towns = []
    if (data.location) {
      towns.push({ name: data.location, name_cn: data.location })
    }
    if (towns.length === 0) towns.push({ name: 'United Kingdom', name_cn: '英国' })

    // 构建 features
    let features = []
    if (data.description) {
      const sentences = data.description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (data.rating && data.reviewCount !== '0') {
      features.push(`WeddingWire ${data.rating}分（${data.reviewCount}条评价）`)
    }
    if (features.length === 0) features = ['UK selected wedding venue', 'Professional wedding service team']

    const tagline = data.description ? data.description.split(/[。\.\n]/)[0].trim().slice(0, 80) : `${data.name} - UK Wedding Venue`

    return {
      name: data.name,
      tagline,
      description: data.description || `${data.name} is a selected wedding venue in the United Kingdom.`,
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(data.images),
      imageCount: data.images.length,
      budget_ranges: JSON.stringify([]),
      guest_capacities: JSON.stringify([]),
      faq: JSON.stringify([]),
      cover_image: data.images[0] || '',
      rating: data.rating,
      review_count: data.reviewCount,
      location: data.location
    }
  } catch (err) {
    console.error('puppeteer爬取失败:', url, err.message)
    return null
  }
}

// 保留旧的 fetch 版本作为后备（希腊目的地使用）
async function crawlVenueDetail(url) {
  const MAX_IMAGES = 24
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  })
  const html = await resp.text()
  const $ = cheerio.load(html)

  // 标题
  const name = $('h1').first().text().trim() || $('title').text().split(' - ')[0].trim()
  if (!name) return null

  // 图片
  const imageSet = new Set()
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || ''
    if (src && (src.includes('cdn0.hitched.co.uk/vendor/') || src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.mariages.net/vendor/'))) {
      const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
      imageSet.add(hd)
    }
  })
  $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html())
      const str = JSON.stringify(json)
      const matches = str.match(/https?:\/\/cdn0\.(weddingwire|mariages|hitched)\.com\/vendor\/[^"\\]+\.(jpeg|jpg|png)/gi)
      if (matches) matches.forEach(u => {
        const hd = u.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
        imageSet.add(hd)
      })
    } catch (e) { /* ignore */ }
  })
  const images = [...imageSet].slice(0, MAX_IMAGES)

  // 描述
  let description = ''
  const aboutSection = $('h2').filter((_, el) => $(el).text().trim().toLowerCase().includes('about'))
  if (aboutSection.length) {
    const parent = aboutSection.closest('[class]')
    const paragraphs = parent.nextAll('p, div').find('p')
    const parts = []
    paragraphs.each((_, p) => {
      const text = $(p).text().trim()
      if (text && text.length > 20) parts.push(text)
    })
    description = parts.join('\n\n')
  }
  if (!description) {
    const allP = []
    $('p').each((_, p) => {
      const text = $(p).text().trim()
      if (text.length > 50 && !text.includes('Sent on') && !text.includes('cookie')) allP.push(text)
    })
    description = allP.slice(0, 8).join('\n\n')
  }

  // 评分和评论
  const bodyText = $('body').text()
  let rating = '', reviewCount = '0'
  const ratingMatch = bodyText.match(/(\d+\.?\d*)\s+out of 5/)
  if (ratingMatch) rating = ratingMatch[1]
  const reviewMatch = bodyText.match(/(\d+)\s+reviews?/i)
  if (reviewMatch) reviewCount = reviewMatch[1]

  // 位置
  let location = ''
  const addrPatterns = [
    /([\w\s]+(?:Chemin|Route|Rue|Avenue|Boulevard|Place|Allée|Chapel|Lane|Road|Street|Drive|Court|Park)[^\n]*\d{5}[^\n]*)/i,
    /([\w\s]+,\s*[A-Z]{2}\s*\d{4,5}[^\n]*)/i
  ]
  for (const pat of addrPatterns) {
    const m = bodyText.match(pat)
    if (m) { location = m[1].trim().substring(0, 200); break }
  }
  if (!location) {
    const mapLink = $('a[href*="maps.google.com"]').attr('href') || ''
    if (mapLink) location = mapLink
  }

  // 特色
  const features = []
  $('li, [class*="feature"], [class*="amenity"], [class*="service"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 3 && text.length < 100 && !text.includes('http')) features.push(text)
  })
  const uniqueFeatures = [...new Set(features)].slice(0, 15)

  // FAQ
  const faq = []
  $('[class*="faq"], [class*="FAQ"]').find('[class*="question"], details, [class*="item"]').each((_, el) => {
    const q = $(el).find('[class*="question"], summary, h3, h4').text().trim()
    const a = $(el).find('[class*="answer"], p').text().trim()
    if (q && a) faq.push({ q, a })
  })

  return {
    name,
    tagline: description.split('\n')[0] || name,
    description,
    features: JSON.stringify(uniqueFeatures),
    venue_types: JSON.stringify([{ name: 'Venue', name_en: 'Venue' }]),
    towns: JSON.stringify(location ? [{ name: location.split(',')[0]?.trim() }] : []),
    images: JSON.stringify(images),
    imageCount: images.length,
    budget_ranges: JSON.stringify([]),
    guest_capacities: JSON.stringify([]),
    faq: JSON.stringify(faq),
    cover_image: images[0] || '',
    rating,
    review_count: reviewCount,
    location
  }
}

// 法国场地爬取（使用 puppeteer-core）
async function crawlFranceVenues(limit = 57) {
  const COUNTRY = 'Test France'
  const COUNTRY_CN = '测试法国'
  const SEARCH_URL = 'https://www.weddingwire.com/shared/search?destCountry=3'
  const MAX_IMAGES = 24

  crawlState = {
    running: true,
    country: COUNTRY_CN,
    startTime: Date.now(),
    progress: '正在启动浏览器...',
    results: [],
    error: null
  }

  await sendCrawlStart(COUNTRY_CN)

  if (!puppeteer) {
    crawlState.running = false
    crawlState.error = 'puppeteer-core 未安装'
    await sendCrawlResult(COUNTRY_CN, [], 'puppeteer-core 未安装')
    return { success: false, error: 'puppeteer-core 未安装' }
  }

  let browser = null
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // 全部57个法国场地URL（从3页搜索结果提取，含51个场地+6个服务商）
    const allUrls = [
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
    
    const finalUrls = allUrls.slice(0, limit)
    crawlState.progress = `共 ${finalUrls.length} 个场地，开始爬取详情（跳过已存在的）...`

    // 先访问 WeddingWire 首页建立会话
    try {
      await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch (e) { /* ignore */ }

    // 2. 逐个爬取场地详情
    const results = []
    for (let i = 0; i < finalUrls.length; i++) {
      const url = finalUrls[i]
      const venueName = url.split('/').pop().split('--')[0].replace(/-/g, ' ')
      crawlState.progress = `正在爬取 ${i + 1}/${finalUrls.length}: ${venueName}`

      try {
        const venueData = await crawlVenueDetailPuppeteer(page, url, MAX_IMAGES)
        if (!venueData) {
          results.push({ url, status: '爬取失败' })
          continue
        }

        venueData.country = COUNTRY
        venueData.country_cn = COUNTRY_CN

        const slug = venueData.name.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 80)
        venueData.slug = slug

        // 安全约束：仅检查 cv_test_france 表内 slug
        const [existing] = await pool.execute(
          'SELECT id FROM `cv_test_france` WHERE slug = ?',
          [slug]
        )
        if (existing.length > 0) {
          results.push({ name: venueData.name, slug, status: '已存在' })
          continue
        }

        // 只增不覆盖 —— 写入 cv_test_france（完整详情表）
        await pool.execute(
          `INSERT INTO \`cv_test_france\`
           (slug, name, name_cn, country, country_cn, source_url, tagline, description,
            features, venue_types, towns, images, budget_ranges, guest_capacities,
            faq, cover_image, rating, review_count, location, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [slug, venueData.name, '', COUNTRY, COUNTRY_CN, url, venueData.tagline || '',
           venueData.description || '', venueData.features || '[]',
           venueData.venue_types || '[{"name":"Venue","name_en":"Venue"}]',
           venueData.towns || '[]', venueData.images || '[]',
           venueData.budget_ranges || '[]', venueData.guest_capacities || '[]',
           venueData.faq || '[]', venueData.cover_image || '',
           venueData.rating || '', venueData.review_count || '0',
           venueData.location || '', 200 + i]
        )

        // 同步写入 cd_test_france（前端列表表）
        await pool.execute(
          `INSERT INTO \`cd_test_france\`
           (slug, name, name_cn, country, country_cn, source_url, tagline, description,
            features, venue_types, towns, images, budget_ranges, guest_capacities,
            faq, cover_image, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [slug, venueData.name, '', COUNTRY, COUNTRY_CN, url, venueData.tagline || '',
           venueData.description || '', venueData.features || '[]',
           venueData.venue_types || '[{"name":"Venue","name_en":"Venue"}]',
           venueData.towns || '[]', venueData.images || '[]',
           venueData.budget_ranges || '[]', venueData.guest_capacities || '[]',
           venueData.faq || '[]', venueData.cover_image || '', 200 + i]
        )
        results.push({ name: venueData.name, slug, images: venueData.imageCount || 0, status: '已入库' })
      } catch (err) {
        console.error(`爬取失败: ${url}`, err.message)
        results.push({ url, status: `失败: ${err.message}` })
      }

      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))
    }

    crawlState.results = results
    crawlState.running = false
    crawlState.progress = '完成'
    await sendCrawlResult(COUNTRY_CN, results)
    return { success: true, results }
  } catch (err) {
    crawlState.running = false
    crawlState.error = err.message
    crawlState.progress = `失败: ${err.message}`
    await sendCrawlResult(COUNTRY_CN, [], err.message)
    throw err
  } finally {
    if (browser) await browser.close()
  }
}

module.exports = { crawlGreeceDestinations, crawlUKVenues, crawlFranceVenues, getCrawlState }
