/**
 * 爬取 peachperfectweddings.com 7个目的地详情页
 * 统一存入 cd_test_peachperfectweddings 表
 * 
 * 用法: node scripts/crawl-ppw-destinations.cjs
 */

const cheerio = require('cheerio')
const mysql = require('mysql2/promise')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const COUNTRY = 'Test PeachPerfectWeddings'
const COUNTRY_CN = '测试peachperfectweddings'
const SUFFIX = 'test_peachperfectweddings'
const MAX_IMAGES = 20
const SUPABASE_BASE = 'https://edculdonasdlqjrowlzt.supabase.co/storage/v1/render/image/public/cms/'

const DB_CONFIG = {
  host: 'localhost', port: 3306, user: 'root', password: '',
  database: 'verra_voile', waitForConnections: true, connectionLimit: 3,
}

const DESTINATIONS = [
  { name: 'Ireland', url: 'https://peachperfectweddings.com/destinations/ireland' },
  { name: 'Italy', url: 'https://peachperfectweddings.com/destinations/italy' },
  { name: 'Spain', url: 'https://peachperfectweddings.com/destinations/spain' },
  { name: 'Portugal', url: 'https://peachperfectweddings.com/destinations/portugal' },
  { name: 'Germany', url: 'https://peachperfectweddings.com/destinations/germany' },
  { name: 'Austria', url: 'https://peachperfectweddings.com/destinations/austria' },
  { name: 'Switzerland', url: 'https://peachperfectweddings.com/destinations/switzerland' },
]

// 清理转义文本
function cleanText(text) {
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

// ===== 从 SvelteKit 数据提取目的地信息 =====
function extractDestinationData(html, destName) {
  const $ = cheerio.load(html)
  let scriptText = ''
  $('script').each((_, el) => {
    const t = $(el).text() || ''
    if (t.includes('sections') && t.includes('heading') && t.length > 500) scriptText = t
  })
  if (!scriptText) return null

  const result = {}

  // title
  const titleMatch = scriptText.match(/title:"([^"]+)"/)
  result.title = titleMatch ? titleMatch[1] : destName

  // heading
  const headingMatch = scriptText.match(/heading:"([^"]+)"/)
  result.heading = headingMatch ? headingMatch[1] : ''

  // subhead
  const subheadMatch = scriptText.match(/subhead:"([^"]+)"/)
  result.subhead = subheadMatch ? subheadMatch[1] : ''

  // meta description
  result.metaDesc = $('meta[property="og:description"]').attr('content') || ''

  // 提取所有文本块，构建描述
  const textBlocks = []
  const textMatches = scriptText.matchAll(/text:"((?:[^"\\]|\\.)*)"/g)
  for (const m of textMatches) {
    const text = cleanText(m[1])
    if (text.trim().length > 30) {
      textBlocks.push(text.trim())
    }
  }
  result.description = textBlocks.slice(0, 8).join('\n\n')

  // 提取所有 heading 构建特色
  const headings = []
  const headingMatches = scriptText.matchAll(/heading:"([^"]+)"/g)
  for (const m of headingMatches) {
    const h = m[1].trim()
    if (h.length > 2 && h.length < 60 && !h.includes('Destination Wedding') && !h.includes('Our other')) {
      headings.push(h)
    }
  }
  result.features = headings.slice(0, 12)

  // 提取图片
  const images = []
  const imgSet = new Set()
  const pathMatches = scriptText.matchAll(/path:"([^"]+)"/g)
  for (const m of pathMatches) {
    const p = m[1]
    if (!p.includes('avatar') && !p.includes('planner') && !p.includes('headshot') && !imgSet.has(p)) {
      imgSet.add(p)
      images.push(SUPABASE_BASE + p + '?height=1920&width=1920&resize=contain&quality=80')
    }
    if (images.length >= MAX_IMAGES) break
  }
  result.images = images
  result.coverImage = images[0] || ''

  // FAQ
  const faq = []
  const faqIdx = scriptText.indexOf('FAQ')
  if (faqIdx > -1) {
    const faqSection = scriptText.substring(faqIdx, faqIdx + 5000)
    const qMatches = [...faqSection.matchAll(/heading:"([^"]+)"/g)]
    const aMatches = [...faqSection.matchAll(/text:"((?:[^"\\]|\\.)*)"/g)]
    for (let i = 0; i < Math.min(qMatches.length, aMatches.length, 10); i++) {
      const q = qMatches[i][1].trim()
      const a = cleanText(aMatches[i][1]).trim().slice(0, 500)
      if (q && a.length > 10) {
        faq.push({ q, a })
      }
    }
  }
  result.faq = faq

  // 子区域
  const regions = []
  const subheadMatches = scriptText.matchAll(/subhead:"([^"]+)"/g)
  for (const m of subheadMatches) {
    const s = m[1].trim()
    if (s && s.length < 50 && !regions.includes(s)) regions.push(s)
  }
  result.regions = regions.slice(0, 8)

  return result
}

// ===== 工具函数 =====
function makeSlug(name) {
  return 'test-ppw-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
}

function buildFeatures(features, regions) {
  const result = []
  if (regions && regions.length > 0) {
    result.push(...regions.slice(0, 5).map(r => '区域: ' + r))
  }
  if (features && features.length > 0) {
    const skip = new Set(['FAQ', 'Our other European wedding destinations'])
    result.push(...features.filter(f => !skip.has(f)).slice(0, 8))
  }
  if (result.length === 0) result.push('精选婚礼目的地', '专业婚礼服务团队')
  return JSON.stringify(result)
}

function buildBudget(destName) {
  const budgetMap = {
    'Italy': [{ label: '€7,000-€15,000', min: 7000, max: 15000 }, { label: '€15,000-€40,000', min: 15000, max: 40000 }, { label: '€40,000+', min: 40000, max: null }],
    'Spain': [{ label: '€5,000-€12,000', min: 5000, max: 12000 }, { label: '€12,000-€30,000', min: 12000, max: 30000 }, { label: '€30,000+', min: 30000, max: null }],
    'Portugal': [{ label: '€5,000-€12,000', min: 5000, max: 12000 }, { label: '€12,000-€30,000', min: 12000, max: 30000 }, { label: '€30,000+', min: 30000, max: null }],
    'Ireland': [{ label: '€8,000-€20,000', min: 8000, max: 20000 }, { label: '€20,000-€50,000', min: 20000, max: 50000 }, { label: '€50,000+', min: 50000, max: null }],
    'Germany': [{ label: '€10,000-€25,000', min: 10000, max: 25000 }, { label: '€25,000-€60,000', min: 25000, max: 60000 }, { label: '€60,000+', min: 60000, max: null }],
    'Austria': [{ label: '€10,000-€25,000', min: 10000, max: 25000 }, { label: '€25,000-€60,000', min: 25000, max: 60000 }, { label: '€60,000+', min: 60000, max: null }],
    'Switzerland': [{ label: 'CHF 15,000-CHF 40,000', min: 15000, max: 40000 }, { label: 'CHF 40,000-CHF 80,000', min: 40000, max: 80000 }, { label: 'CHF 80,000+', min: 80000, max: null }],
  }
  return JSON.stringify(budgetMap[destName] || [{ label: '需咨询', min: 0, max: null }])
}

// ===== 主函数 =====
async function main() {
  const startTime = Date.now()
  console.log('🌍 开始爬取' + COUNTRY_CN + ' ' + DESTINATIONS.length + ' 个目的地...\n')

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')

  const cdTable = 'cd_' + SUFFIX

  // 建表
  await pool.execute(
    'CREATE TABLE IF NOT EXISTS `' + cdTable + '` (' +
    'id INT AUTO_INCREMENT PRIMARY KEY, ' +
    'slug VARCHAR(100) NOT NULL, name VARCHAR(200) NOT NULL, ' +
    'name_cn VARCHAR(200) DEFAULT \'\', country VARCHAR(100) DEFAULT \'\', ' +
    'country_cn VARCHAR(100) DEFAULT \'\', source_url VARCHAR(500) DEFAULT \'\', ' +
    'tagline VARCHAR(300) DEFAULT \'\', tagline_cn VARCHAR(500) DEFAULT \'\', ' +
    'description TEXT, description_cn TEXT, ' +
    'features JSON, venue_types JSON, towns JSON, images JSON, ' +
    'budget_ranges JSON, guest_capacities JSON, faq JSON, ' +
    'cover_image VARCHAR(500) DEFAULT \'\', cover_image_url VARCHAR(1024) DEFAULT \'\', ' +
    'sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ' +
    'UNIQUE KEY uk_slug (slug)' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
  )
  console.log('✓ 表 ' + cdTable + ' 已就绪\n')

  let successCount = 0, failCount = 0
  const failures = []

  for (let i = 0; i < DESTINATIONS.length; i++) {
    const dest = DESTINATIONS[i]
    const slug = makeSlug(dest.name)
    console.log('[' + (i + 1) + '/' + DESTINATIONS.length + '] ' + dest.name)

    try {
      const resp = await fetch(dest.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,de;q=0.8'
        }
      })
      const html = await resp.text()
      const data = extractDestinationData(html, dest.name)

      if (!data) {
        console.log('  ✗ 无法提取数据')
        failures.push({ name: dest.name, error: '无法提取数据' })
        failCount++
        continue
      }

      const name = dest.name
      const tagline = (data.subhead || data.heading || name + ' Destination Wedding').slice(0, 300)
      const description = data.description || data.metaDesc || name + ' is a beautiful wedding destination.'
      const images = data.images
      const coverImage = data.coverImage || ''

      const d = {
        slug: slug, name: name, name_cn: '',
        tagline: tagline, tagline_cn: '',
        description: description, description_cn: '',
        features: buildFeatures(data.features, data.regions),
        venue_types: JSON.stringify([]),
        towns: JSON.stringify([{ name: name, name_cn: '' }]),
        images: JSON.stringify(images),
        budget_ranges: buildBudget(name),
        guest_capacities: JSON.stringify([]),
        faq: JSON.stringify(data.faq || []),
        cover_image: coverImage,
        cover_image_url: coverImage,
        source_url: dest.url,
      }

      // 检查是否已存在
      const [existing] = await pool.execute('SELECT id FROM `' + cdTable + '` WHERE slug = ?', [slug])
      if (existing.length > 0) {
        await pool.execute(
          'UPDATE `' + cdTable + '` SET name=?, name_cn=?, tagline=?, tagline_cn=?, description=?, description_cn=?, features=?, images=?, budget_ranges=?, faq=?, cover_image=?, cover_image_url=?, source_url=? WHERE slug=?',
          [d.name, d.name_cn, d.tagline, d.tagline_cn, d.description, d.description_cn, d.features, d.images, d.budget_ranges, d.faq, d.cover_image, d.cover_image_url, d.source_url, slug]
        )
        console.log('  ✓ 已更新 | 图片' + images.length + '张 | FAQ ' + data.faq.length + '条')
      } else {
        await pool.execute(
          'INSERT INTO `' + cdTable + '` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,cover_image_url,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, d.source_url, d.tagline, d.tagline_cn, d.description, d.description_cn, d.features, d.venue_types, d.towns, d.images, d.budget_ranges, d.guest_capacities, d.faq, d.cover_image, d.cover_image_url, 100 + i]
        )
        console.log('  ✓ 图片' + images.length + '张 | FAQ ' + data.faq.length + '条')
      }

      // 写入 products
      const prodSlug = slug.slice(0, 50).replace(/-$/, '')
      await pool.execute(
        'INSERT INTO products (category_id,product_id,name,name_en,description,image,price,unit,highlight) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        ['destination', prodSlug, name, name, COUNTRY_CN + ' - ' + name + '婚礼目的地', coverImage, 0, '€', COUNTRY_CN + '精选']
      )

      successCount++

    } catch (err) {
      console.log('  ✗ 错误: ' + err.message)
      failures.push({ name: dest.name, error: err.message })
      failCount++
    }

    if (i < DESTINATIONS.length - 1) await wait(1000 + Math.random() * 1000)
  }

  await pool.end()
  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log('\n' + '='.repeat(50))
  console.log('✅ 完成！成功: ' + successCount + ', 失败: ' + failCount + ', 耗时: ' + elapsed + '秒')
  if (failures.length > 0) {
    console.log('\n失败列表:')
    failures.forEach(function(f, i) { console.log('  ' + (i + 1) + '. ' + f.name + ': ' + f.error) })
  }
}

main().catch(function(err) { console.error('❌ 脚本失败:', err.message); process.exit(1) })
