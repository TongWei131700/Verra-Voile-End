/**
 * 批量爬取 peachperfectweddings.com 奥地利场地
 * 
 * 用法: node scripts/crawl-austria.cjs
 * 
 * 数据源: SvelteKit 嵌入的 JS 对象（cheerio 提取）
 * 写入: cv_test_austria / cd_test_austria / products
 */

const cheerio = require('cheerio')
const mysql = require('mysql2/promise')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const COUNTRY = 'Test Austria'
const COUNTRY_CN = '测试奥地利'
const SUFFIX = 'test_austria'
const MAX_IMAGES = 24
const SUPABASE_BASE = 'https://edculdonasdlqjrowlzt.supabase.co/storage/v1/render/image/public/cms/'

const DB_CONFIG = {
  host: 'localhost', port: 3306, user: 'root', password: '',
  database: 'verra_voile', waitForConnections: true, connectionLimit: 3,
}

const VENUES = [
  { name: 'Schloss Leopoldskron', url: 'https://peachperfectweddings.com/austria/venues/lakeside-castle-weddings-near-salzburg' },
  { name: 'Haggenberg Castle', url: 'https://peachperfectweddings.com/austria/venues/800-year-old-castle-for-fairytale-weddings-in-weinviertel' },
  { name: 'Oberforsthofalm', url: 'https://peachperfectweddings.com/austria/venues/elope-to-a-cozy-mountain-lodge-overlooking-the-salzach-valley' },
  { name: 'Weinschloss Thaller', url: 'https://peachperfectweddings.com/austria/venues/wine-castle-for-weddings-at-the-heart-of-styria' },
  { name: 'Schloss Gurhof', url: 'https://peachperfectweddings.com/austria/venues/baroque-castle-for-dreamy-weddings-above-wachau-valley' },
  { name: 'WEINGUT HOLLER', url: 'https://peachperfectweddings.com/austria/venues/picturesque-chalet-and-winery-for-elopement-in-styria' },
  { name: 'Rufanaalp', url: 'https://peachperfectweddings.com/austria/venues/elope-to-a-charming-mountain-lodge-in-burserberg' },
  { name: 'Schloss Maria Loretto', url: 'https://peachperfectweddings.com/austria/venues/lakeside-wedding-castle-along-the-worthersee' },
  { name: 'Schloss Ottersbach', url: 'https://peachperfectweddings.com/austria/venues/fairytale-castle-for-garden-elopements-in-mantrach' },
  { name: 'Schloss Prielau', url: 'https://peachperfectweddings.com/austria/venues/dreamy-lakeside-garden-for-nature-elopements' },
  { name: 'Schloss Welsdorf', url: 'https://peachperfectweddings.com/austria/venues/exclusive-castle-with-parkland-for-weddings-in-styria' },
  { name: 'Schloss Herberstein', url: 'https://peachperfectweddings.com/austria/venues/historic-garden-castle-for-fairytale-weddings-in-styria' },
  { name: 'Hotel Schloss Obermayerhofen', url: 'https://peachperfectweddings.com/austria/venues/laidback-wedding-castle-with-vineyards-in-south-styria' },
  { name: 'Ernegg Castle', url: 'https://peachperfectweddings.com/austria/venues/exclusive-12th-century-castle-for-intimate-weddings-in-upper-austria' },
  { name: 'Jufenalm', url: 'https://peachperfectweddings.com/austria/venues/mountain-lodge-for-scenic-outdoor-weddings-in-salzburg' },
  { name: 'Eckartsau Castle', url: 'https://peachperfectweddings.com/austria/venues/elope-in-a-baroque-castle-in-vienna' },
  { name: 'Ansitz Wartenfels', url: 'https://peachperfectweddings.com/austria/venues/private-wedding-venue-near-lake-fuschl' },
  { name: 'Palais Coburg', url: 'https://peachperfectweddings.com/austria/venues/urban-palace-for-weddings-in-vienna' },
  { name: 'Hotel Schlossvilla Miralago', url: 'https://peachperfectweddings.com/austria/venues/say-yes-in-a-private-lakeside-villa-in-carinthia' },
  { name: 'Schloss Matzen', url: 'https://peachperfectweddings.com/austria/venues/12th-century-castle-for-micro-weddings-in-tyrol' },
  { name: 'Hotel Sacher Vienna', url: 'https://peachperfectweddings.com/austria/venues/first-class-wedding-hotel-in-vienna' },
  { name: 'Hochzeitswald', url: 'https://peachperfectweddings.com/austria/venues/magical-forest-elopement-near-graz' },
]

// ===== 从 SvelteKit 嵌入数据提取 =====
function extractData(html) {
  const $ = cheerio.load(html)
  let scriptText = ''
  $('script').each((_, el) => {
    const t = $(el).text() || ''
    if (t.includes('venue_type') || t.includes('venue_feature')) scriptText = t
  })
  if (!scriptText) return null

  const result = {}

  // vendor.name
  const vendorNameMatch = scriptText.match(/vendor:\{[^}]*name:"([^"]+)"/)
  result.vendorName = vendorNameMatch ? vendorNameMatch[1] : ''

  // vendor.region
  const regionMatch = scriptText.match(/region:"([^"]+)"/)
  result.region = regionMatch ? regionMatch[1] : ''

  // vendor.country
  const countryMatch = scriptText.match(/country:"([^"]+)"/)
  result.country = countryMatch ? countryMatch[1] : 'Austria'

  // price_public
  const priceMatch = scriptText.match(/price_public:"([^"]+)"/)
  result.price = priceMatch ? priceMatch[1] : ''

  // venue_type: [{type:"Castle"},{type:"Hotel"}...]
  result.types = []
  const typeBlockMatch = scriptText.match(/venue_type:\[([\s\S]*?)\]/)
  if (typeBlockMatch) {
    const typeMatches = typeBlockMatch[1].matchAll(/type:"([^"]+)"/g)
    for (const m of typeMatches) result.types.push(m[1])
  }

  // venue_feature: [{feature:"Chapel"}...]
  result.features = []
  const featBlockMatch = scriptText.match(/venue_feature:\[([\s\S]*?)\]/)
  if (featBlockMatch) {
    const featMatches = featBlockMatch[1].matchAll(/feature:"([^"]+)"/g)
    for (const m of featMatches) result.features.push(m[1])
  }

  // venue_ceremony: [{ceremony:"Legal"}...]
  result.ceremonies = []
  const cerBlockMatch = scriptText.match(/venue_ceremony:\[([\s\S]*?)\]/)
  if (cerBlockMatch) {
    const cerMatches = cerBlockMatch[1].matchAll(/ceremony:"([^"]+)"/g)
    for (const m of cerMatches) result.ceremonies.push(m[1])
  }

  // venue_space: [{ppl_min:2,ppl_max:80,...,venue_space_purpose:[{purpose:"Ceremony"}...]}...]
  result.spaces = []
  const spaceBlockMatch = scriptText.match(/venue_space:\[([\s\S]*?)\]\}\s*(?:,event|,vendor|,written)/)
  if (spaceBlockMatch) {
    const spaceStr = spaceBlockMatch[1]
    // 提取每个 space 块
    const spaceBlocks = spaceStr.match(/\{[^{}]*ppl_min:\d+[^{}]*venue_space_purpose:\[[\s\S]*?\][^{}]*\}/g)
    if (spaceBlocks) {
      for (const sb of spaceBlocks) {
        const minMatch = sb.match(/ppl_min:(\d+)/)
        const maxMatch = sb.match(/ppl_max:(\d+)/)
        const purposes = []
        const purposeMatches = sb.matchAll(/purpose:"([^"]+)"/g)
        for (const p of purposeMatches) purposes.push(p[1])
        result.spaces.push({
          min: minMatch ? parseInt(minMatch[1]) : 0,
          max: maxMatch ? parseInt(maxMatch[1]) : 0,
          purposes
        })
      }
    }
  }

  // image: [{path:"ppwp45lgyhpg6zq",...}...]
  result.images = []
  const imgBlockMatch = scriptText.match(/,image:\[(\{[^[\]]*path:[^[\]]*\})\]/)
  if (imgBlockMatch) {
    const pathMatches = imgBlockMatch[1].matchAll(/path:"([^"]+)"/g)
    for (const m of pathMatches) {
      const imgUrl = `${SUPABASE_BASE}${m[1]}?height=1920&width=1920&resize=contain&quality=80`
      result.images.push(imgUrl)
    }
  }
  result.images = result.images.slice(0, MAX_IMAGES)

  // sections/blocks 描述
  result.description = ''
  const descParts = []
  // 匹配 blocks 中的 heading + text
  const blockMatches = scriptText.matchAll(/heading:"([^"]+)",subhead:null,text:"([\s\S]*?)",ordr:/g)
  for (const m of blockMatches) {
    const heading = m[1]
    let text = m[2]
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links -> text
    if (text.trim()) {
      descParts.push(`【${heading}】\n${text.trim()}`)
    }
  }
  result.description = descParts.join('\n\n')

  // title / heading
  const titleMatch = scriptText.match(/title:"([^"]+)"/)
  result.title = titleMatch ? titleMatch[1] : ''

  return result
}

// ===== 工具函数 =====
function makeSlug(name) {
  const prefix = 'test-austria-'
  const maxLen = 50 - prefix.length - 1
  return prefix + name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .slice(0, maxLen)
}

const TYPE_MAP = {
  'Castle': '城堡', 'Hotel': '酒店', 'Waterside': '水边', 'Mountain': '山间',
  'Villa': '别墅', 'Garden': '花园', 'Palace': '宫殿', 'Forest': '森林',
  'Vineyard': '葡萄园', 'Chalet': '木屋', 'Historic': '历史建筑',
  'Manor': '庄园', 'Lodge': '山间小屋', 'Winery': '酒庄', 'Restaurant': '餐厅',
}

function buildVenueTypes(types) {
  if (!types || types.length === 0) return JSON.stringify([{ name: 'Wedding Venue', name_cn: '婚礼场地' }])
  return JSON.stringify(types.map(t => ({
    name: t,
    name_cn: TYPE_MAP[t] || t
  })))
}

function buildGuestCapacities(spaces) {
  if (!spaces || spaces.length === 0) return JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])
  const caps = spaces.map(s => {
    const label = s.purposes.length > 0 ? s.purposes.join('/') : ''
    return `${label}: ${s.min}-${s.max}人`
  })
  return JSON.stringify(caps)
}

function buildBudget(price) {
  if (!price) return JSON.stringify([{ label: '€244/人起', min: 244, max: null }])
  const numMatch = price.match(/€?\s*(\d[\d,.]*)/)
  const min = numMatch ? parseInt(numMatch[1].replace(/[,.]/g, '')) : 0
  const label = price.replace(/^Packages?\s*/i, '').trim().slice(0, 80)
  return JSON.stringify([{ label, min, max: null }])
}

function buildFeatures(features, ceremonies) {
  const result = []
  if (features && features.length > 0) result.push(...features.slice(0, 8))
  if (ceremonies && ceremonies.length > 0) result.push(`仪式: ${ceremonies.join(', ')}`)
  if (result.length === 0) result.push('精选婚礼场地', '专业婚礼服务团队')
  return JSON.stringify(result)
}

function buildTowns(region) {
  const regionMap = {
    'Salzburg': '萨尔茨堡', 'Vienna': '维也纳', 'Styria': '施泰尔马克',
    'Carinthia': '克恩顿州', 'Tyrol': '蒂罗尔', 'Upper Austria': '上奥地利',
    'Lower Austria': '下奥地利', 'Vorarlberg': '福拉尔贝格',
  }
  const cn = regionMap[region] || region || '奥地利'
  return JSON.stringify([{ name: region || 'Austria', name_cn: cn }])
}

// ===== 主函数 =====
async function main() {
  const startTime = Date.now()
  console.log(`🇦🇹 开始爬取${COUNTRY_CN} ${VENUES.length} 个场地...\n`)

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')

  const cvTable = `cv_${SUFFIX}`
  const cdTable = `cd_${SUFFIX}`

  // 建表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`${cvTable}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL, name VARCHAR(300) NOT NULL,
      name_cn VARCHAR(300) DEFAULT '', country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '', source_url VARCHAR(500) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '', tagline_cn VARCHAR(500) DEFAULT '',
      description TEXT, description_cn TEXT,
      features JSON, venue_types JSON, towns JSON, images JSON,
      budget_ranges JSON, guest_capacities JSON, faq JSON,
      cover_image VARCHAR(500) DEFAULT '', rating VARCHAR(20) DEFAULT '',
      review_count VARCHAR(20) DEFAULT '0', location VARCHAR(500) DEFAULT '',
      sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`${cdTable}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL, name VARCHAR(300) NOT NULL,
      name_cn VARCHAR(300) DEFAULT '', country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '', source_url VARCHAR(500) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '', tagline_cn VARCHAR(500) DEFAULT '',
      description TEXT, description_cn TEXT,
      features JSON, venue_types JSON, towns JSON, images JSON,
      budget_ranges JSON, guest_capacities JSON, faq JSON,
      cover_image VARCHAR(500) DEFAULT '',
      sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log(`✓ 表 ${cvTable} / ${cdTable} 已就绪\n`)

  let successCount = 0, failCount = 0, skipCount = 0
  const failures = []

  for (let i = 0; i < VENUES.length; i++) {
    const venue = VENUES[i]
    const slug = makeSlug(venue.name)
    console.log(`[${i + 1}/${VENUES.length}] ${venue.name}`)

    const [existing] = await pool.execute(`SELECT id FROM \`${cvTable}\` WHERE slug = ?`, [slug])
    if (existing.length > 0) {
      console.log(`  ⏭ 已存在，跳过`)
      skipCount++
      continue
    }

    try {
      const resp = await fetch(venue.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,de;q=0.8'
        }
      })
      const html = await resp.text()
      const data = extractData(html)

      if (!data) {
        console.log(`  ✗ 无法提取 SvelteKit 数据`)
        failures.push({ name: venue.name, error: '无法提取数据' })
        failCount++
        continue
      }

      const name = data.vendorName || venue.name
      const description = data.description || `${name} is a beautiful wedding venue in ${data.region || 'Austria'}, offering premium wedding services.`
      const tagline = description.split('\n')[0].replace(/【.*?】/g, '').trim().slice(0, 80) || `${name} - Wedding Venue in Austria`
      const images = data.images
      const coverImage = images[0] || ''

      const d = {
        slug, name, name_cn: '',
        tagline, tagline_cn: '',
        description, description_cn: '',
        features: buildFeatures(data.features, data.ceremonies),
        venue_types: buildVenueTypes(data.types),
        towns: buildTowns(data.region),
        images: JSON.stringify(images),
        budget_ranges: buildBudget(data.price),
        guest_capacities: buildGuestCapacities(data.spaces),
        faq: JSON.stringify([]),
        cover_image: coverImage,
        source_url: venue.url,
        rating: '', review_count: '0',
        location: data.region || 'Austria',
      }

      await pool.execute(
        `INSERT INTO \`${cvTable}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,rating,review_count,location,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [d.slug,d.name,d.name_cn,COUNTRY,COUNTRY_CN,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,d.rating,d.review_count,d.location,100+i]
      )
      await pool.execute(
        `INSERT INTO \`${cdTable}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [d.slug,d.name,d.name_cn,COUNTRY,COUNTRY_CN,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,100+i]
      )
      const prodSlug = d.slug.slice(0, 50).replace(/-$/, '')
      await pool.execute(
        `INSERT INTO products (category_id,product_id,name,name_en,description,image,price,unit,highlight) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        ['destination',prodSlug,d.name,d.name,`${COUNTRY_CN}婚礼场地`,d.cover_image,0,'€',`${COUNTRY_CN}精选`]
      )

      console.log(`  ✓ 图片${images.length}张 | 类型: ${data.types.join(',')} | 位置: ${data.region}`)
      successCount++

    } catch (err) {
      console.log(`  ✗ 错误: ${err.message}`)
      failures.push({ name: venue.name, error: err.message })
      failCount++
    }

    if (i < VENUES.length - 1) await wait(1000 + Math.random() * 1000)
  }

  await pool.end()
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}, 耗时: ${elapsed}秒`)
  if (failures.length > 0) {
    console.log(`\n失败列表:`)
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}: ${f.error}`))
  }
}

main().catch(err => { console.error('❌ 脚本失败:', err.message); process.exit(1) })
