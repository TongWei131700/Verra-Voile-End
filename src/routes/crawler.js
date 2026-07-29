const cheerio = require('cheerio')
const { pool } = require('../db')
const { sendCrawlStart, sendCrawlResult, sendCrawlProgress } = require('./mailer')

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
  const SOURCE_URL = 'https://www.weddingwire.com/shared/search?destCountry=10'

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

module.exports = { crawlGreeceDestinations, getCrawlState }
