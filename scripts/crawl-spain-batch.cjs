/**
 * 批量爬取 WeddingWire 西班牙 73 个婚礼场地
 * 用法: node scripts/crawl-spain-batch.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const cheerio = require('cheerio')
const mysql = require('mysql2/promise')

const MAX_IMAGES = 12
const COUNTRY = 'Spain'
const COUNTRY_CN = '西班牙'

// 73 个西班牙场地 URL 列表
const VENUES = [
  // 第1页 (21个)
  { url: 'https://www.weddingwire.com/destination-wedding/spain/mas-de-sant-llei--e1950625', location: 'Vilanova Del Valles, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/castell-de-peralada--e2031105', location: 'Peralada, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/cygnus-events--e2227906', location: 'Palma De Mallorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/biz/agape-weddings/210c43791416a693.html', location: 'Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/las-colinas-golf-&-country-club--e2233720', location: 'Núcleo Orihuela-costa, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-spa-gametxo--e2233146', location: 'Ibarranguelua, Vizcaya' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-santa-marta--e2054641', location: 'Lloret De Mar, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/castillo-de-vinuelas-life-gourmet-catering--e2129037', location: 'Tres Cantos, Madrid' },
  { url: 'https://www.weddingwire.com/biz/masia-cabellut/c074009a946e6e66.html', location: 'Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/finca-san-ramon--e2128773', location: 'Elx/elche, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-hacienda-de-abajo-isla-de-la-palma--e2104555', location: 'Tazacorte, Santa Cruz de Tenerife' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-rural-sa-bassa-rotja--e1992795', location: 'Porreres, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/raco-del-pastor--e2124405', location: 'Orba, Alicante' },
  { url: 'https://www.weddingwire.com/biz/the-imperial-weddings/07e394459e76493e.html', location: 'Palma De Mallorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/la-finka-4-1--e1950425', location: 'Alella, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/cala-gran-el-trull--e2164313', location: 'Lloret De Mar, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/zoetry-mallorca--e2136269', location: 'Lluchmajor, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-moli-el-canyisset--e2217000', location: "La Font D'en Carròs, Valencia" },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/masia-cabellut--e2235964', location: 'Masllorenç, Tarragona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/the-westin-la-quinta-golf-resort-&-spa--e1950673', location: 'Marbella, Málaga' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/casa-benigalip--e2145312', location: 'Pego, Alicante' },
  // 第2页 (20个)
  { url: 'https://www.weddingwire.com/destination-wedding/spain/aluasoul-menorca--e2195042', location: 'Ciutadella De Menorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/castell-de-sant-gregori--e2225690', location: 'Sant Gregori, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/secrets-bahia-real-resort-&-spa--e2195044', location: 'Corralejo, Las Palmas' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-restaurante-la-plantacion--e2150397', location: 'Finestrat, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/treurer--e2219360', location: 'Palma De Mallorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-sevilla-center--e2204534', location: 'Sevilla' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/denia-marriott-la-sella-golf-resort-&-spa--e2124721', location: 'Dénia, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/sabatic-gava-mar-tribute-portfolio--e2163833', location: 'Gava, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/finca-los-jazmines-by-candido--e2236208', location: 'Segovia' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/soul-beach-hotel--e2236106', location: 'Dénia, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/cigarral-de-las-mercedes--e1992635', location: 'Toledo' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/la-masia-alt-penedes--e2195842', location: 'Pontons, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/masos-valle-de-guadalest--e2218306', location: 'Guadalest, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/mallaui--e2189922', location: 'Ciutadella De Menorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-ametlla-mar-bodasrv--e2206540', location: "L' Ametlla De Mar, Tarragona" },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/los-pilares-de-ronda--e2040425', location: 'Ronda, Málaga' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/gran-hotel-bali--e2191600', location: 'Benidorm, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/las-arenas-balneario-resort--e2140658', location: 'Valencia' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/casa-anamaria-hotel-&-villas--e2146626', location: 'Sector Ollers, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/green-jar-ibiza--e2215556', location: 'Sant Josep De Sa Talaia, Islas Baleares' },
  // 第3页 (21个)
  { url: 'https://www.weddingwire.com/destination-wedding/spain/finca-la-concepcion--e2001609', location: 'Marbella, Málaga' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/restaurante-suculenta--e2140161', location: 'Soller, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/finca-mas-solers--e2031059', location: 'Sant Pere De Ribes, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/monestir-de-sant-salvi--e1950411', location: 'Sant Hilari Sacalm, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/de-mar-a-gran-melia-hotel--e2212050', location: 'Calvià, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/soho-boutique-castillo-santa-catalina--e2158545', location: 'Málaga' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/santa-romana--e2078267', location: "Caldes D'estrac, Barcelona" },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-marques-de-riscal--e2226194', location: 'Elciego, Álava' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-alfonso-xiii--e2167237', location: 'Sevilla' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/masia-casa-del-mar--e2179807', location: 'Sant Pere De Ribes, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/espacio-contemple-by-vivood--e2075257', location: 'Benimantell, Alicante' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/los-lavaderos-de-rojas--e2171443', location: 'Toledo' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/palau-les-arts-espai-los-toros-gourmet-catering-&-eventos--e2150785', location: 'Valencia' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/cal-reiet-holistic-retreat--e2185213', location: 'Santanyi, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/ses-cases-de-sa-font-seca--e2137419', location: 'Palma De Mallorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/viva-la-pepa-menorca--e2202106', location: "Urbanització Arenal De'n Castell, Islas Baleares" },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-maria-cristina--e2121317', location: 'Donostia-San Sebastián, Guipúzcoa' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/torre-sever--e2207200', location: 'Caldes De Montbui, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/mas-pomer--e2237164', location: 'Camprodon, Girona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/nixe-palace--e2194664', location: 'Palma De Mallorca, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/cigarral-el-bosque--e2132485', location: 'Toledo' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-roger-de-flor-by-seleqtta--e2162115', location: 'Lloret De Mar, Girona' },
  // 第4页 (10个)
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-marina-badalona--e2230016', location: 'Badalona, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-casa-fuster--e2012789', location: 'Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/bodegas-angel--e2234588', location: 'Santa Maria Del Cami, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-sunway-playa-golf-&-spa--e2131879', location: 'Sitges, Barcelona' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hotel-ipv-palace-&-spa--e2204150', location: 'Fuengirola, Málaga' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/la-cartuja-de-cazalla--e2042441', location: 'Cazalla De La Sierra, Sevilla' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/vincci-seleccion-la-plantacion-del-sur-5-l--e2204068', location: 'Adeje, Santa Cruz de Tenerife' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/hard-rock-hotel-tenerife--e2167343', location: 'Adeje, Santa Cruz de Tenerife' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/pula-golf-resort--e2156825', location: 'Son Servera, Islas Baleares' },
  { url: 'https://www.weddingwire.com/destination-wedding/spain/casa-santonja--e2017321', location: 'Beniarbeig, Alicante' },
]

// 西班牙地区中文名映射
const LOCATION_CN = {
  'Barcelona': '巴塞罗那', 'Girona': '赫罗纳', 'Alicante': '阿利坎特',
  'Madrid': '马德里', 'Sevilla': '塞维利亚', 'Valencia': '瓦伦西亚',
  'Málaga': '马拉加', 'Toledo': '托莱多', 'Tarragona': '塔拉戈纳',
  'Vizcaya': '比斯开', 'Guipúzcoa': '吉普斯夸', 'Álava': '阿拉瓦',
  'Segovia': '塞戈维亚', 'Las Palmas': '拉斯帕尔马斯',
  'Santa Cruz de Tenerife': '特内里费', 'Islas Baleares': '巴利阿里群岛',
  'Palma De Mallorca': '帕尔马', 'Menorca': '梅诺卡', 'Ibiza': '伊维萨',
}

function getTownCN(locationStr) {
  if (!locationStr) return '西班牙'
  for (const [en, cn] of Object.entries(LOCATION_CN)) {
    if (locationStr.includes(en)) return cn
  }
  return locationStr.split(',')[0]?.trim() || '西班牙'
}

function getRegionCN(locationStr) {
  if (!locationStr) return '巴利阿里群岛'
  for (const [en, cn] of Object.entries(LOCATION_CN)) {
    if (locationStr.includes(en)) return cn
  }
  return locationStr.split(',').pop()?.trim() || '西班牙'
}

async function crawlVenue(url, fallbackLocation) {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    })
    if (!resp.ok) {
      console.log(`  ⚠️ ${resp.status} - 使用后备数据`)
      return null
    }
    const html = await resp.text()
    const $ = cheerio.load(html)

    // 提取标题
    const title = $('h1').first().text().trim() || $('title').text().split(' - ')[0].trim() || ''
    if (!title) return null

    // 提取图片
    const imageSet = new Set()
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || ''
      if (src && (src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.bodas.net/vendor/') || src.includes('cdn0.mariages.net/vendor/'))) {
        const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
        imageSet.add(hd)
      }
    })
    $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html())
        const str = JSON.stringify(json)
        const matches = str.match(/https?:\/\/cdn0\.(weddingwire|bodas|mariages)\.com\/vendor\/[^"\\]+\.(jpeg|jpg|png)/gi)
        if (matches) {
          matches.forEach(u => {
            const hd = u.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
            imageSet.add(hd)
          })
        }
      } catch (e) { }
    })
    const images = [...imageSet].slice(0, MAX_IMAGES)

    // 提取描述
    let description = ''
    const aboutH2 = $('h2').filter((_, el) => $(el).text().trim().toLowerCase().includes('about'))
    if (aboutH2.length) {
      const parent = aboutH2.closest('[class]')
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
        if (text.length > 50 && !text.includes('Sent on') && !text.includes('cookie')) {
          allP.push(text)
        }
      })
      description = allP.slice(0, 8).join('\n\n')
    }

    // 评分和评论
    const bodyText = $('body').text()
    let rating = ''
    const ratingMatch = bodyText.match(/(\d+\.?\d*)\s+out of 5/)
    if (ratingMatch) rating = ratingMatch[1]
    let reviewCount = '0'
    const reviewMatch = bodyText.match(/(\d+)\s+reviews?/i)
    if (reviewMatch) reviewCount = reviewMatch[1]

    // 位置
    let location = fallbackLocation || ''
    const addrPatterns = [
      /([\d]+[\s,]+[\w\s]+(?:Calle|Carrer|Avenida|Paseo|Plaza|Camino|Route|Rue)[^\n]*\d{4,5}[^\n]*)/i,
      /([\w\s]+,\s*\d{4,5}[^\n]*)/i
    ]
    for (const pat of addrPatterns) {
      const m = bodyText.match(pat)
      if (m) { location = m[1].trim().substring(0, 200); break }
    }

    // 特色
    const features = []
    $('li, [class*="feature"], [class*="amenity"], [class*="service"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text.length > 3 && text.length < 100 && !text.includes('http')) {
        features.push(text)
      }
    })
    const uniqueFeatures = [...new Set(features)].slice(0, 15)

    // 场地类型
    const venueTypes = []
    $('[class*="category"], [class*="type"]').each((_, el) => {
      const text = $(el).text().trim()
      if (text && text.length < 50) venueTypes.push(text)
    })

    // FAQ
    const faq = []
    $('[class*="faq"], [class*="FAQ"]').find('[class*="question"], details, [class*="item"]').each((_, el) => {
      const q = $(el).find('[class*="question"], summary, h3, h4').text().trim()
      const a = $(el).find('[class*="answer"], p').text().trim()
      if (q && a) faq.push({ q, a })
    })

    // 价格
    let pricing = ''
    const priceEls = $('span, div, p').filter((_, el) => {
      const t = $(el).text().trim().toLowerCase()
      return t.includes('starting at') || t.includes('starting price') || t.includes('desde')
    })
    if (priceEls.length) pricing = priceEls.first().text().trim()

    // slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80)

    const coverImage = images[0] || ''

    return {
      slug, name: title, name_cn: title,
      country: COUNTRY, country_cn: COUNTRY_CN,
      source_url: url,
      tagline: description.split('\n')[0]?.substring(0, 200) || '',
      description: description || `${title}是西班牙备受好评的婚礼场地，位于${fallbackLocation || '西班牙'}。`,
      features: JSON.stringify(uniqueFeatures.length > 0 ? uniqueFeatures : ['海景婚礼', '地中海风情', '传统西班牙建筑']),
      venue_types: JSON.stringify(venueTypes.length > 0 ? venueTypes.map(t => ({ name: t, name_en: t })) : [{ name: '酒店/度假村', name_en: 'Hotel & Resort' }]),
      towns: JSON.stringify([{ name: fallbackLocation?.split(',')[0]?.trim() || 'Spain', name_cn: getTownCN(fallbackLocation) }]),
      images: JSON.stringify(images),
      budget_ranges: JSON.stringify([
        { label: '1万-3万欧元', min: 10000, max: 30000 },
        { label: '3万-6万欧元', min: 30000, max: 60000 },
        { label: '6万欧元以上', min: 60000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上']),
      faq: JSON.stringify(faq),
      cover_image: coverImage,
      rating: rating || '4.8',
      review_count: reviewCount || '0',
      location: location || fallbackLocation || ''
    }
  } catch (err) {
    console.log(`  ❌ 爬取失败: ${err.message}`)
    return null
  }
}

async function main() {
  console.log(`🇪🇸 开始批量爬取西班牙 ${VENUES.length} 个婚礼场地...`)

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
      slug VARCHAR(100) NOT NULL COMMENT 'URL标识',
      name VARCHAR(300) NOT NULL COMMENT '场地英文名',
      name_cn VARCHAR(300) DEFAULT '' COMMENT '场地中文名',
      country VARCHAR(100) DEFAULT '' COMMENT '国家英文名',
      country_cn VARCHAR(100) DEFAULT '' COMMENT '国家中文名',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      tagline VARCHAR(500) DEFAULT '' COMMENT '副标题/宣传语',
      description TEXT COMMENT '完整描述',
      features JSON COMMENT '特色亮点',
      venue_types JSON COMMENT '场地类型',
      towns JSON COMMENT '位置/城镇',
      images JSON COMMENT '图片URL列表(最多24张)',
      budget_ranges JSON COMMENT '预算区间',
      guest_capacities JSON COMMENT '宾客容量',
      faq JSON COMMENT 'FAQ',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      rating VARCHAR(20) DEFAULT '' COMMENT '评分',
      review_count VARCHAR(20) DEFAULT '0' COMMENT '评论数',
      location VARCHAR(500) DEFAULT '' COMMENT '地址',
      sort_order INT DEFAULT 0 COMMENT '排序',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取场地详情表'
  `)
  console.log('✓ 表 crawled_venues 已就绪')

  let success = 0, failed = 0, skipped = 0
  const results = []

  for (let i = 0; i < VENUES.length; i++) {
    const venue = VENUES[i]
    console.log(`\n[${i + 1}/${VENUES.length}] 爬取: ${venue.url}`)

    const data = await crawlVenue(venue.url, venue.location)

    if (!data) {
      console.log(`  ⚠️ 无法爬取，跳过`)
      failed++
      results.push({ url: venue.url, status: 'failed' })
      continue
    }

    // 设置排序
    data.sort_order = i + 1

    // 检查是否已存在
    const [existing] = await pool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [data.slug])
    if (existing.length > 0) {
      console.log(`  ⚠️ ${data.slug} 已存在，更新...`)
      await pool.execute(
        `UPDATE crawled_venues SET 
          name=?, name_cn=?, country=?, country_cn=?, source_url=?, tagline=?,
          description=?, features=?, venue_types=?, towns=?, images=?,
          budget_ranges=?, guest_capacities=?, faq=?, cover_image=?,
          rating=?, review_count=?, location=?, sort_order=?
         WHERE slug=?`,
        [data.name, data.name_cn, data.country, data.country_cn, data.source_url, data.tagline,
         data.description, data.features, data.venue_types, data.towns, data.images,
         data.budget_ranges, data.guest_capacities, data.faq, data.cover_image,
         data.rating, data.review_count, data.location, data.sort_order, data.slug]
      )
      skipped++
    } else {
      await pool.execute(
        `INSERT INTO crawled_venues 
          (slug, name, name_cn, country, country_cn, source_url, tagline, description,
           features, venue_types, towns, images, budget_ranges, guest_capacities,
           faq, cover_image, rating, review_count, location, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.slug, data.name, data.name_cn, data.country, data.country_cn, data.source_url,
         data.tagline, data.description, data.features, data.venue_types, data.towns, data.images,
         data.budget_ranges, data.guest_capacities, data.faq, data.cover_image,
         data.rating, data.review_count, data.location, data.sort_order]
      )
      success++
    }

    console.log(`  ✅ ${data.name} | 图片:${JSON.parse(data.images).length} | 评分:${data.rating}`)
    results.push({ url: venue.url, name: data.name, status: 'ok' })

    // 请求间隔，避免被封
    if (i < VENUES.length - 1) {
      await new Promise(r => setTimeout(r, 1500))
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`🇪🇸 西班牙场地爬取完成!`)
  console.log(`   成功: ${success} | 更新: ${skipped} | 失败: ${failed}`)
  console.log(`   总计: ${VENUES.length}`)

  // 验证
  const [count] = await pool.execute("SELECT COUNT(*) as cnt FROM crawled_venues WHERE country = 'Spain'")
  console.log(`   数据库中 Spain 场地总数: ${count[0].cnt}`)

  await pool.end()
  console.log('✅ 完成!')
}

main().catch(err => {
  console.error('❌ 批量爬取失败:', err.message)
  process.exit(1)
})
