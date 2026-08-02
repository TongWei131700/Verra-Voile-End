/**
 * 爬取 WeddingWire 单个场地页面并存入数据库
 * 用法: node scripts/crawl-venue-detail.js [url]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const cheerio = require('cheerio')
const mysql = require('mysql2/promise')

const TARGET_URL = process.argv[2] || 'https://www.weddingwire.com/destination-wedding/destination/domaine-de-beauregard--e2229202'
const MAX_IMAGES = 24

async function main() {
  console.log(`🔍 开始爬取: ${TARGET_URL}`)

  // 1. 请求页面
  const resp = await fetch(TARGET_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8'
    }
  })
  const html = await resp.text()
  const $ = cheerio.load(html)

  // 2. 提取标题
  const title = $('h1').first().text().trim() || $('title').text().split(' - ')[0].trim()
  console.log(`📌 场地名称: ${title}`)

  // 3. 提取图片 - 只提取 vendor 场地图片（过滤掉婚纱/模板等非场地图片）
  const imageSet = new Set()
  // 方式1: 从 img 标签提取，只取 vendor 图片
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || ''
    if (src && (src.includes('cdn0.mariages.net/vendor/') || src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.hitched.co.uk/vendor/'))) {
      // 替换为最大尺寸 1920: /vendor/XXXX/3_2/960/ -> /vendor/XXXX/3_2/1920/
      const hd = src.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
      imageSet.add(hd)
    }
  })
  // 方式2: 从 script JSON 数据中提取 vendor 图片
  $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html())
      const str = JSON.stringify(json)
      const matches = str.match(/https?:\/\/cdn0\.(weddingwire|mariages|hitched)\.com\/vendor\/[^"\\]+\.(jpeg|jpg|png)/gi)
      if (matches) {
        matches.forEach(url => {
          const hd = url.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          imageSet.add(hd)
        })
      }
    } catch (e) { /* ignore */ }
  })

  const images = [...imageSet].slice(0, MAX_IMAGES)
  console.log(`📸 提取到 ${images.length} 张图片`)

  // 4. 提取描述 - About 区域
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
  // 如果上面没抓到，尝试从整个页面文本提取
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
  console.log(`📝 描述长度: ${description.length} 字符`)

  // 5. 提取评分和评论
  let rating = ''
  const bodyText = $('body').text()
  const ratingMatch = bodyText.match(/(\d+\.?\d*)\s+out of 5/)
  if (ratingMatch) rating = ratingMatch[1]

  let reviewCount = '0'
  const reviewMatch = bodyText.match(/(\d+)\s+reviews?/i)
  if (reviewMatch) reviewCount = reviewMatch[1]

  // 6. 提取评论文字
  const reviews = []
  // 尝试提取各个评论块
  const reviewBlocks = $('[class*="review"], [class*="Review"]')
  reviewBlocks.each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 30 && reviews.length < 5) {
      reviews.push(text.substring(0, 500))
    }
  })
  console.log(`⭐ 评分: ${rating}, 评论数: ${reviewCount}`)

  // 7. 提取地址/位置信息
  let location = ''
  // 从页面文本中提取地址（包含邮编的模式）
  const addrPatterns = [
    /([\d]+[\s,]+[\w\s]+(?:Chemin|Route|Rue|Avenue|Boulevard|Place|Allée|Impasse|Cours|Quai)[^\n]*\d{5}[^\n]*)/i,
    /([\w\s]+,\s*\d{4,5}[^\n]*)/i
  ]
  for (const pat of addrPatterns) {
    const m = bodyText.match(pat)
    if (m) { location = m[1].trim().substring(0, 200); break }
  }
  // 从 map link 提取坐标作为备用
  if (!location) {
    const mapLink = $('a[href*="maps.google.com"]').attr('href') || ''
    if (mapLink) location = mapLink
  }
  // 从页面底部提取
  if (!location) {
    const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 3)
    const addrLine = lines.find(l => /\d{5}/.test(l))
    if (addrLine) location = addrLine.substring(0, 200)
  }
  console.log(`📍 位置: ${location}`)

  // 8. 提取价格信息
  let pricing = ''
  const priceEls = $('span, div, p').filter((_, el) => {
    const t = $(el).text().trim().toLowerCase()
    return t.includes('starting at') || t.includes('starting price') || t.includes('à partir')
  })
  if (priceEls.length) {
    pricing = priceEls.first().text().trim()
  }

  // 9. 提取特色/服务信息
  const features = []
  // 从页面中的列表项提取
  $('li, [class*="feature"], [class*="amenity"], [class*="service"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 3 && text.length < 100 && !text.includes('http')) {
      features.push(text)
    }
  })
  // 去重并限制数量
  const uniqueFeatures = [...new Set(features)].slice(0, 15)
  console.log(`✨ 特色: ${uniqueFeatures.length} 项`)

  // 10. 提取场地类型
  const venueTypes = []
  const typeEls = $('[class*="category"], [class*="type"]')
  typeEls.each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 50) venueTypes.push(text)
  })

  // 11. 生成 slug
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)

  // 12. 选择头图（选最宽的/第一张高清的）
  const coverImage = images[0] || ''

  // 13. 提取FAQ
  const faq = []
  const faqSection = $('[class*="faq"], [class*="FAQ"]')
  faqSection.find('[class*="question"], details, [class*="item"]').each((_, el) => {
    const q = $(el).find('[class*="question"], summary, h3, h4').text().trim()
    const a = $(el).find('[class*="answer"], p').text().trim()
    if (q && a) faq.push({ q, a })
  })

  // 14. 从 URL 提取国家信息
  const countryMap = {
    'united-kingdom': { en: 'United Kingdom', cn: '英国' },
    'france': { en: 'France', cn: '法国' },
    'italy': { en: 'Italy', cn: '意大利' },
    'spain': { en: 'Spain', cn: '西班牙' },
    'portugal': { en: 'Portugal', cn: '葡萄牙' },
    'greece': { en: 'Greece', cn: '希腊' }
  }
  const urlCountryMatch = TARGET_URL.match(/\/destination-wedding\/([^/]+)\//)
  const urlCountryKey = urlCountryMatch ? urlCountryMatch[1] : ''
  const countryInfo = countryMap[urlCountryKey] || { en: urlCountryKey, cn: urlCountryKey }
  const country = countryInfo.en
  const countryCn = countryInfo.cn

  // 构建数据对象
  const venueData = {
    slug,
    name: title,
    name_cn: title, // 暂时用英文名，后续可翻译
    country,
    country_cn: countryCn,
    source_url: TARGET_URL,
    tagline: description.split('\n')[0] || '',
    tagline_cn: '',
    description,
    description_cn: '',
    features: JSON.stringify(uniqueFeatures),
    venue_types: JSON.stringify(venueTypes.length > 0 ? venueTypes.map(t => ({ name: t, name_en: t })) : [{ name: '庄园', name_en: 'Manor & Château' }]),
    towns: JSON.stringify(location ? [{ name: location.split(',')[0]?.trim() || 'Provence', name_cn: '普罗旺斯' }] : [{ name: 'Monteux', name_cn: '蒙图' }]),
    images: JSON.stringify(images),
    budget_ranges: JSON.stringify(pricing ? [{ label: pricing, min: 0, max: null }] : []),
    guest_capacities: JSON.stringify(['50-150人', '150-220人']),
    faq: JSON.stringify(faq),
    cover_image: coverImage,
    rating: rating || '5.0',
    review_count: reviewCount || '0',
    location,
    sort_order: 100
  }

  // 15. 存入数据库
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 创建表
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
      tagline_cn VARCHAR(500) DEFAULT '' COMMENT '中文宣传语',
      description TEXT COMMENT '完整描述',
      description_cn TEXT COMMENT '中文描述',
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

  // 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [venueData.slug])
  if (existing.length > 0) {
    console.log(`⚠️ 场地 ${venueData.slug} 已存在，将更新数据...`)
    await pool.execute(
      `UPDATE crawled_venues SET 
        name=?, name_cn=?, country=?, country_cn=?, source_url=?, tagline=?, tagline_cn=?,
        description=?, description_cn=?, features=?, venue_types=?, towns=?, images=?,
        budget_ranges=?, guest_capacities=?, faq=?, cover_image=?,
        rating=?, review_count=?, location=?
       WHERE slug=?`,
      [venueData.name, venueData.name_cn, venueData.country, venueData.country_cn,
       venueData.source_url, venueData.tagline, venueData.tagline_cn,
       venueData.description, venueData.description_cn,
       venueData.features, venueData.venue_types, venueData.towns, venueData.images,
       venueData.budget_ranges, venueData.guest_capacities, venueData.faq,
       venueData.cover_image, venueData.rating, venueData.review_count,
       venueData.location, venueData.slug]
    )
  } else {
    await pool.execute(
      `INSERT INTO crawled_venues 
        (slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn, description, description_cn,
         features, venue_types, towns, images, budget_ranges, guest_capacities,
         faq, cover_image, rating, review_count, location, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [venueData.slug, venueData.name, venueData.name_cn, venueData.country, venueData.country_cn,
       venueData.source_url, venueData.tagline, venueData.tagline_cn, venueData.description, venueData.description_cn,
       venueData.features, venueData.venue_types, venueData.towns, venueData.images,
       venueData.budget_ranges, venueData.guest_capacities, venueData.faq,
       venueData.cover_image, venueData.rating, venueData.review_count,
       venueData.location, venueData.sort_order]
    )
  }

  console.log(`✅ 数据已存入数据库 (slug: ${venueData.slug})`)
  console.log(`📊 数据概览:`)
  console.log(`   名称: ${venueData.name}`)
  console.log(`   图片: ${images.length} 张`)
  console.log(`   评分: ${venueData.rating}`)
  console.log(`   评论: ${venueData.review_count} 条`)
  console.log(`   位置: ${venueData.location}`)
  console.log(`   封面: ${venueData.cover_image}`)

  await pool.end()
}

main().catch(err => {
  console.error('❌ 爬取失败:', err.message)
  process.exit(1)
})
