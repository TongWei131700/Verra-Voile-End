/**
 * 批量爬取 WeddingWire 法国场地（58个）
 * 用法: node scripts/crawl-france-batch.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const cheerio = require('cheerio')
const mysql = require('mysql2/promise')

const MAX_IMAGES = 24
const DELAY_MS = 1500 // 每次请求间隔，避免被封

const URLS = [
  'https://www.weddingwire.com/destination-wedding/france/domaine-de-beauregard--e2229202',
  'https://www.weddingwire.com/destination-wedding/france/le-mas-des-cinq-fontaines--e2132875',
  'https://www.weddingwire.com/biz/phyllis-kent-events-weddings/24042f30ed95be8f.html',
  'https://www.weddingwire.com/destination-wedding/france/la-grange-de-javon--e2159329',
  'https://www.weddingwire.com/destination-wedding/france/le-domaine-anse-marcel-beach--e2211738',
  'https://www.weddingwire.com/destination-wedding/france/chateau-la-tour-vaucros--e1950435',
  'https://www.weddingwire.com/destination-wedding/france/domaine-la-plume--e2120425',
  'https://www.weddingwire.com/biz/kiss-me-in-paris-wedding-planner/d8fea5cb214f3fbb.html',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-saint-martin-du-tertre--e2200210',
  'https://www.weddingwire.com/destination-wedding/france/mas-de-la-massane--e2234596',
  'https://www.weddingwire.com/destination-wedding/france/domaine-le-grand-belly--e2092325',
  'https://www.weddingwire.com/destination-wedding/france/chateau-sentout--e2216644',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-serre-de-parc--e2217626',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-faye--e2233222',
  'https://www.weddingwire.com/destination-wedding/france/domaine-d-aveny--e2152703',
  'https://www.weddingwire.com/destination-wedding/france/domaine-dares--e2215212',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-scalibert--e2223360',
  'https://www.weddingwire.com/destination-wedding/france/domaine-de-la-chartrogniere--e2136551',
  'https://www.weddingwire.com/destination-wedding/france/fleurs-de-prestige--e2219288',
  'https://www.weddingwire.com/destination-wedding/france/domaine-du-grand-lauron--e2197854',
  'https://www.weddingwire.com/destination-wedding/france/chateau-comtesse-lafond--e2215968',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-bourlie--e2225000',
  'https://www.weddingwire.com/destination-wedding/france/domaine-santa-maria--e2154721',
  'https://www.weddingwire.com/biz/noces-du-monde/036d5b2116ec8082.html',
  'https://www.weddingwire.com/destination-wedding/france/abbaye-de-talloires--e2121487',
  'https://www.weddingwire.com/destination-wedding/france/les-domaines-de-patras--e2142416',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-jarthe--e2224724',
  'https://www.weddingwire.com/destination-wedding/france/la-faiseuse-de-reves--e2233224',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-colaissiere--e1950453',
  'https://www.weddingwire.com/destination-wedding/france/chateau-pimo--e2214730',
  'https://www.weddingwire.com/destination-wedding/france/la-dime-de-giverny--e1992655',
  'https://www.weddingwire.com/destination-wedding/france/le-mas-de-la-rose--e2096297',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-laurentie--e2213646',
  'https://www.weddingwire.com/destination-wedding/france/chateau-des-briottieres--e2042507',
  'https://www.weddingwire.com/destination-wedding/france/rocabella--e2216044',
  'https://www.weddingwire.com/destination-wedding/france/le-petit-roulet--e2114615',
  'https://www.weddingwire.com/biz/alliance-revee/2e788c751eb30bf8.html',
  'https://www.weddingwire.com/destination-wedding/france/white-house-cannes--e2209162',
  'https://www.weddingwire.com/destination-wedding/france/chateau-heloise--e2236838',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-tresserve--e2001745',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-courcelles-le-roy--e2008027',
  'https://www.weddingwire.com/destination-wedding/france/chateau-le-chereau--e2234246',
  'https://www.weddingwire.com/destination-wedding/france/lmk-events--e2233234',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-seguin--e2099525',
  'https://www.weddingwire.com/destination-wedding/france/chateau-des-perrais--e2233910',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-noe-seche--e2233988',
  'https://www.weddingwire.com/destination-wedding/france/chateau-saint-laurent--e2207142',
  'https://www.weddingwire.com/destination-wedding/france/la-tresoriere--e2191310',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-la-pascalette--e2232310',
  'https://www.weddingwire.com/biz/samantha-bottelier-events/3c1bc49663f940b9.html',
  'https://www.weddingwire.com/destination-wedding/france/les-jardins-darlias-by-la-villa-alexandra--e2218082',
  'https://www.weddingwire.com/destination-wedding/france/chateau-le-fresne--e2090847',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-thorens--e2108701',
  'https://www.weddingwire.com/destination-wedding/france/domaine-terra-rosa--e2191838',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-vergieres--e2211030',
  'https://www.weddingwire.com/destination-wedding/france/chateau-de-chaumontel--e2221826',
  'https://www.weddingwire.com/biz/dream-paris-wedding/2fe93e8fc84424c5.html',
  'https://www.weddingwire.com/destination-wedding/france/couvent-notre-dame-des-pres--e2162793',
]

function extractSlug(url) {
  // 从URL中提取slug: /france/xxx--e1234567 或 /biz/xxx/hash.html
  const m = url.match(/\/(france|biz)\/([^/.]+)/)
  if (!m) return ''
  return m[2].toLowerCase().replace(/[^a-z0-9-]/g, '')
}

async function crawlOne(url, pool) {
  const slug = extractSlug(url)
  if (!slug) { console.log(`⚠️ 无法提取slug: ${url}`); return null }

  // 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [slug])
  if (existing.length > 0) {
    console.log(`⏭️ 已存在，跳过: ${slug}`)
    return slug
  }

  console.log(`\n🔍 [${URLS.indexOf(url) + 1}/${URLS.length}] 爬取: ${slug}`)

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8'
      }
    })
    if (!resp.ok) { console.log(`❌ HTTP ${resp.status}: ${slug}`); return null }
    const html = await resp.text()
    const $ = cheerio.load(html)

    // 提取标题
    const title = $('h1').first().text().trim() || $('title').text().split(' - ')[0].trim()

    // 提取图片
    const imageSet = new Set()
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || ''
      if (src && (src.includes('cdn0.mariages.net/vendor/') || src.includes('cdn0.weddingwire.com/vendor/'))) {
        const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
        imageSet.add(hd)
      }
    })
    $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html())
        const str = JSON.stringify(json)
        const matches = str.match(/https?:\/\/cdn0\.(weddingwire|mariages)\.com\/vendor\/[^"\\]+\.(jpeg|jpg|png)/gi)
        if (matches) matches.forEach(u => {
          const hd = u.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          imageSet.add(hd)
        })
      } catch (e) {}
    })
    const images = [...imageSet].slice(0, MAX_IMAGES)

    // 提取描述
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

    // 提取评分
    const bodyText = $('body').text()
    let rating = ''
    const ratingMatch = bodyText.match(/(\d+\.?\d*)\s+out of 5/)
    if (ratingMatch) rating = ratingMatch[1]
    let reviewCount = '0'
    const reviewMatch = bodyText.match(/(\d+)\s+reviews?/i)
    if (reviewMatch) reviewCount = reviewMatch[1]

    // 提取位置
    let location = ''
    const addrPatterns = [
      /([\d]+[\s,]+[\w\s]+(?:Chemin|Route|Rue|Avenue|Boulevard|Place|Allée|Impasse|Cours|Quai)[^\n]*\d{5}[^\n]*)/i,
      /([\w\s]+,\s*\d{4,5}[^\n]*)/i
    ]
    for (const pat of addrPatterns) {
      const m = bodyText.match(pat)
      if (m) { location = m[1].trim().substring(0, 200); break }
    }
    if (!location) {
      const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 3)
      const addrLine = lines.find(l => /\d{5}/.test(l))
      if (addrLine) location = addrLine.substring(0, 200)
    }

    // 提取特色
    const features = []
    $('li, [class*="feature"], [class*="amenity"], [class*="service"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 3 && text.length < 100 && !text.includes('http')) features.push(text)
    })
    const uniqueFeatures = [...new Set(features)].slice(0, 15)

    // 提取场地类型
    const venueTypes = []
    $('[class*="category"], [class*="type"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 50) venueTypes.push(text)
    })

    // 提取价格
    let pricing = ''
    const priceEls = $('span, div, p').filter((_, el) => {
      const t = $(el).text().trim().toLowerCase()
      return t.includes('starting at') || t.includes('starting price') || t.includes('à partir')
    })
    if (priceEls.length) pricing = priceEls.first().text().trim()

    // 提取FAQ
    const faq = []
    $('[class*="faq"], [class*="FAQ"]').find('[class*="question"], details, [class*="item"]').each((_, el) => {
      const q = $(el).find('[class*="question"], summary, h3, h4').text().trim()
      const a = $(el).find('[class*="answer"], p').text().trim()
      if (q && a) faq.push({ q, a })
    })

    const coverImage = images[0] || ''

    // 存入数据库
    await pool.execute(
      `INSERT INTO crawled_venues 
        (slug, name, name_cn, country, country_cn, source_url, tagline, description,
         features, venue_types, towns, images, budget_ranges, guest_capacities,
         faq, cover_image, rating, review_count, location, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug, title, title, 'France', '法国', url,
        description.split('\n')[0] || '',
        description,
        JSON.stringify(uniqueFeatures),
        JSON.stringify(venueTypes.length > 0 ? venueTypes.map(t => ({ name: t, name_en: t })) : []),
        JSON.stringify(location ? [{ name: location.split(',')[0]?.trim() }] : []),
        JSON.stringify(images),
        JSON.stringify(pricing ? [{ label: pricing, min: 0, max: null }] : []),
        JSON.stringify([]),
        JSON.stringify(faq),
        coverImage,
        rating || '',
        reviewCount,
        location,
        100
      ]
    )

    console.log(`✅ ${slug} | ${title} | ${images.length}图 | ★${rating || 'N/A'}`)
    return slug
  } catch (err) {
    console.log(`❌ ${slug}: ${err.message}`)
    return null
  }
}

async function main() {
  console.log(`🚀 开始批量爬取法国 ${URLS.length} 个场地...\n`)

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 确保表存在
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_venues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL,
      name VARCHAR(300) NOT NULL,
      name_cn VARCHAR(300) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '',
      source_url VARCHAR(500) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '',
      description TEXT,
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
      location VARCHAR(500) DEFAULT '',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  let success = 0, skipped = 0, failed = 0

  for (let i = 0; i < URLS.length; i++) {
    const result = await crawlOne(URLS[i], pool)
    if (result === null) failed++
    else if (i > 0) success++ // first might be skipped
    if (i > 0 && i < URLS.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  // 统计结果
  const [total] = await pool.execute('SELECT COUNT(*) as cnt FROM crawled_venues WHERE country="France"')
  console.log(`\n📊 爬取完成！`)
  console.log(`   成功: ${success}, 跳过: ${skipped}, 失败: ${failed}`)
  console.log(`   数据库法国场地总数: ${total[0].cnt}`)

  await pool.end()
}

main().catch(err => {
  console.error('❌ 批量爬取失败:', err.message)
  process.exit(1)
})
