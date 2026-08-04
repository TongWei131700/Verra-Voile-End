/**
 * 爬取4个英国场地，直接写入测试英国表（cv_test_uk / cd_test_uk）
 * 不动正式英国表（cv_uk / cd_uk）
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const cheerio = require('cheerio')
const mysql = require('mysql2/promise')

const VENUES = [
  { name: 'Orchardleigh Estate', url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/orchardleigh-estate--e2193716' },
  { name: 'Brinsop Court Manor House and Barn', url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/brinsop-court-manor-house-and-barn--e2189560' },
  { name: 'St Giles House', url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/st-giles-house--e2189270' },
  { name: 'Morden Hall', url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/morden-hall--e2229594' }
]

const COUNTRY = 'Test United Kingdom'
const COUNTRY_CN = '测试英国'
const SLUG_PREFIX = 'test-uk-'
const CV_TABLE = 'cv_test_uk'
const CD_TABLE = 'cd_test_uk'
const MAX_IMAGES = 24

async function crawlVenue(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8'
    }
  })
  const html = await resp.text()
  const $ = cheerio.load(html)

  const title = $('h1').first().text().trim() || $('title').text().split(' - ')[0].trim()

  // 图片
  const imageSet = new Set()
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || ''
    if (src && (src.includes('cdn0.mariages.net/vendor/') || src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.hitched.co.uk/vendor/'))) {
      const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
      imageSet.add(hd)
    }
  })
  $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html())
      const str = JSON.stringify(json)
      const matches = str.match(/https?:\/\/cdn0\.(weddingwire|mariages|hitched)\.com\/vendor\/[^"\\]+\.(jpeg|jpg|png)/gi)
      if (matches) {
        matches.forEach(u => {
          const hd = u.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          imageSet.add(hd)
        })
      }
    } catch (e) {}
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

  // 评分
  const bodyText = $('body').text()
  let rating = ''
  const ratingMatch = bodyText.match(/(\d+\.?\d*)\s+out of 5/)
  if (ratingMatch) rating = ratingMatch[1]
  let reviewCount = '0'
  const reviewMatch = bodyText.match(/(\d+)\s+reviews?/i)
  if (reviewMatch) reviewCount = reviewMatch[1]

  // 特色
  const features = []
  $('li, [class*="feature"], [class*="amenity"], [class*="service"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 3 && text.length < 100 && !text.includes('http')) features.push(text)
  })
  const uniqueFeatures = [...new Set(features)].slice(0, 15)

  // 位置
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
    const mapLink = $('a[href*="maps.google.com"]').attr('href') || ''
    if (mapLink) location = mapLink
  }

  // FAQ
  const faq = []
  const faqSection = $('[class*="faq"], [class*="FAQ"]')
  faqSection.find('[class*="question"], details, [class*="item"]').each((_, el) => {
    const q = $(el).find('[class*="question"], summary, h3, h4').text().trim()
    const a = $(el).find('[class*="answer"], p').text().trim()
    if (q && a) faq.push({ q, a })
  })

  // slug
  const slug = SLUG_PREFIX + title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 60)

  return {
    slug,
    name: title,
    name_cn: title,
    country: COUNTRY,
    country_cn: COUNTRY_CN,
    source_url: url,
    tagline: description.split('\n')[0] || '',
    tagline_cn: '',
    description,
    description_cn: '',
    features: JSON.stringify(uniqueFeatures),
    venue_types: JSON.stringify([{ name: '庄园', name_en: 'Manor & Château' }]),
    towns: JSON.stringify(location ? [{ name: location.split(',')[0]?.trim() || '', name_cn: '' }] : []),
    images: JSON.stringify(images),
    budget_ranges: JSON.stringify([]),
    guest_capacities: JSON.stringify(['50-150人', '150-220人']),
    faq: JSON.stringify(faq),
    cover_image: images[0] || '',
    rating: rating || '5.0',
    review_count: reviewCount || '0',
    location,
    sort_order: 100
  }
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 1. 清空测试英国旧数据
  console.log('🗑️ 清空测试英国旧数据...')
  await pool.execute(`DELETE FROM \`${CV_TABLE}\``)
  await pool.execute(`DELETE FROM \`${CD_TABLE}\``)
  await pool.execute(`DELETE FROM products WHERE product_id LIKE 'test-uk-%'`)
  console.log('✅ 已清空')

  // 2. 逐个爬取
  for (const venue of VENUES) {
    console.log(`\n🔍 爬取: ${venue.name}`)
    try {
      const data = await crawlVenue(venue.url)
      console.log(`   📸 ${JSON.parse(data.images).length} 张图片 | ⭐ ${data.rating} | 📍 ${data.location || '无'}`)

      // 写入 cv_test_uk
      await pool.execute(
        `INSERT INTO \`${CV_TABLE}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,rating,review_count,location,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [data.slug,data.name,data.name_cn,data.country,data.country_cn,data.source_url,data.tagline,data.tagline_cn,data.description,data.description_cn,data.features,data.venue_types,data.towns,data.images,data.budget_ranges,data.guest_capacities,data.faq,data.cover_image,data.rating,data.review_count,data.location,data.sort_order]
      )

      // 写入 cd_test_uk
      await pool.execute(
        `INSERT INTO \`${CD_TABLE}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [data.slug,data.name,data.name_cn,data.country,data.country_cn,data.source_url,data.tagline,data.tagline_cn,data.description,data.description_cn,data.features,data.venue_types,data.towns,data.images,data.budget_ranges,data.guest_capacities,data.faq,data.cover_image,data.sort_order]
      )

      // 写入 products
      await pool.execute(
        'INSERT INTO products (category_id, product_id, name, name_en, description, image, price, unit, highlight, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
        ['destination', data.slug, data.name_cn, data.name, data.tagline_cn || data.tagline, data.cover_image, 0, '€', '', 100]
      )

      console.log(`   ✅ ${data.slug}`)
    } catch (err) {
      console.error(`   ❌ 失败: ${err.message}`)
    }

    // 随机延时
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))
  }

  // 3. 验证
  const [cvCount] = await pool.execute(`SELECT COUNT(*) as c FROM \`${CV_TABLE}\``)
  const [cdCount] = await pool.execute(`SELECT COUNT(*) as c FROM \`${CD_TABLE}\``)
  console.log(`\n📊 结果: ${CV_TABLE}=${cvCount[0].c} 条, ${CD_TABLE}=${cdCount[0].c} 条`)

  await pool.end()
  console.log('🎉 完成')
}

main().catch(err => {
  console.error('❌ 失败:', err.message)
  process.exit(1)
})
