/**
 * 葡萄牙婚礼场地全量爬取脚本（服务端运行）
 * 
 * 爬取 WeddingWire 葡萄牙 81 个场地详情页内容，入库数据库
 * 不下载图片，仅保存外部图片 URL
 * 完成后发送邮件通知
 * 
 * 用法: node scripts/crawl-portugal-full.cjs
 */

const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')
const nodemailer = require('nodemailer')

// 兼容新版 puppeteer
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 配置 =====
const CHROME_PATH = '/usr/bin/chromium-browser'
const DB_CONFIG = {
  host: '127.0.0.1',
  port: 13306,
  user: 'root',
  password: 'caoqiangiot@123',
  database: 'verra_voile',
  waitForConnections: true,
  connectionLimit: 3,
}
const SMTP_CONFIG = {
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: { user: 'TW15536500878@163.com', pass: 'DZVj2VwzTE8Amuh2' }
}
const NOTIFY_TO = 'TW15536500878@163.com'
const COUNTRY = 'Portugal'
const COUNTRY_CN = '葡萄牙'
const MAX_IMAGES = 12

// ===== 81 个葡萄牙场地 URL =====
const VENUES = [
  { name: 'Our Quinta', url: 'https://www.weddingwire.com/destination-wedding/portugal/our-quinta--e1977913' },
  { name: 'Filipe Santos Fotografia', url: 'https://www.weddingwire.com/destination-wedding/portugal/filipe-santos-fotografia--e1977945' },
  { name: 'Quinta da Fontoura', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-da-fontoura--e1972581' },
  { name: 'Lameiras Eventos', url: 'https://www.weddingwire.com/destination-wedding/portugal/lameiras-eventos--e2220698' },
  { name: 'Humus Farm', url: 'https://www.weddingwire.com/destination-wedding/portugal/humus-farm--e2148969' },
  { name: 'Quinta Vila Marita', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-vila-marita--e2189252' },
  { name: 'Acordeon', url: 'https://www.weddingwire.com/destination-wedding/portugal/acordeon--e2054647' },
  { name: 'Quinta do Outeiro', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-outeiro--e2166231' },
  { name: 'Cuá Cuá Club - Quinta do Lago', url: 'https://www.weddingwire.com/destination-wedding/portugal/cua-cua-club-quinta-do-lago--e2215416' },
  { name: 'Casa de Quintã', url: 'https://www.weddingwire.com/destination-wedding/portugal/casa-de-quinta--e1956615' },
  { name: 'Quinta dos Machados', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-dos-machados--e2206084' },
  { name: 'Quinta do Roseiral', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-roseiral--e1956755' },
  { name: 'Montebello Wedding Events', url: 'https://www.weddingwire.com/destination-wedding/portugal/montebello-wedding-events--e2078301' },
  { name: 'Tarki', url: 'https://www.weddingwire.com/destination-wedding/portugal/tarki--e2225304' },
  { name: 'Quinta do Lago', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-lago--e2218166' },
  { name: 'Ama Village', url: 'https://www.weddingwire.com/destination-wedding/portugal/ama-village--e2229106' },
  { name: 'Independente Comporta', url: 'https://www.weddingwire.com/destination-wedding/portugal/independente-comporta--e2218466' },
  { name: 'Convent Square Lisbon Hotel, Vignette Collection', url: 'https://www.weddingwire.com/destination-wedding/portugal/convent-square-lisbon-hotel-vignette-collection--e2227022' },
  { name: 'A Quinta - Parque Tematico Rural e Eventos', url: 'https://www.weddingwire.com/destination-wedding/portugal/a-quinta-parque-tematico-rural-e-eventos--e1956637' },
  { name: 'Vale Pisco', url: 'https://www.weddingwire.com/destination-wedding/portugal/vale-pisco--e2230498' },
  { name: 'Quinta do Acipreste', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-acipreste--e2188934' },
  { name: 'Sorio Valada', url: 'https://www.weddingwire.com/destination-wedding/portugal/sorio-valada--e2234924' },
  { name: 'Herdade do Peru', url: 'https://www.weddingwire.com/destination-wedding/portugal/herdade-do-peru--e2031049' },
  { name: 'Hotel Rural Casa dos Viscondes da Varzea', url: 'https://www.weddingwire.com/destination-wedding/portugal/hotel-rural-casa-dos-viscondes-da-varzea--e2230018' },
  { name: 'Quinta do Boiro', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-boiro--e2226284' },
  { name: 'Casa dos Arcos Boavista', url: 'https://www.weddingwire.com/destination-wedding/portugal/casa-dos-arcos-boavista--e1956661' },
  { name: 'Quinta do Éden', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-eden--e2222326' },
  { name: 'Quinta do Gaio de Cima', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-gaio-de-cima--e2222000' },
  { name: 'Palacete da Quinta do Egipto', url: 'https://www.weddingwire.com/destination-wedding/portugal/palacete-da-quinta-do-egipto--e1992751' },
  { name: 'Paço Real de Belas', url: 'https://www.weddingwire.com/destination-wedding/portugal/paco-real-de-belas--e2221208' },
  { name: 'Quinta do Furão', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-furao--e2232942' },
  { name: 'Quinta Cardeal', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-cardeal--e2224236' },
  { name: 'Quinta do Alto', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-alto--e2031211' },
  { name: 'Quinta de Prata', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-de-prata--e1956663' },
  { name: 'Sirius Park', url: 'https://www.weddingwire.com/destination-wedding/portugal/sirius-park--e2228490' },
  { name: 'Love Stories Events', url: 'https://www.weddingwire.com/destination-wedding/portugal/love-stories-events--e2223134' },
  { name: 'Palácio de Tancos', url: 'https://www.weddingwire.com/destination-wedding/portugal/palacio-de-tancos--e2158783' },
  { name: 'Go Mary', url: 'https://www.weddingwire.com/destination-wedding/portugal/go-mary--e2234862' },
  { name: 'Pousadela Village', url: 'https://www.weddingwire.com/destination-wedding/portugal/pousadela-village--e2232414' },
  { name: 'Palácio Ludovice Wine Experience Hotel', url: 'https://www.weddingwire.com/destination-wedding/portugal/palacio-ludovice-wine-experience-hotel--e2177133' },
  { name: 'Intiwed - Intimate Weddings in Portugal', url: 'https://www.weddingwire.com/destination-wedding/portugal/intiwed-intimate-weddings-in-portugal--e2233470' },
  { name: 'Quinta Bica da Cruz', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-bica-da-cruz--e2222096' },
  { name: 'Casas do Côro', url: 'https://www.weddingwire.com/destination-wedding/portugal/casas-do-coro--e2227820' },
  { name: 'Hotel Palácio Estoril', url: 'https://www.weddingwire.com/destination-wedding/portugal/hotel-palacio-estoril--e1950701' },
  { name: 'Quinta do Pinto', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-pinto--e2224624' },
  { name: 'Amendoeira Golf Resort', url: 'https://www.weddingwire.com/destination-wedding/portugal/amendoeira-golf-resort--e2226842' },
  { name: 'Quinta Amadeus', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-amadeus--e2197140' },
  { name: 'Cenoura-Brava', url: 'https://www.weddingwire.com/destination-wedding/portugal/cenoura-brava--e2231002' },
  { name: 'Quinta da Maria', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-da-maria--e2230026' },
  { name: 'Quinta de Santo António Country House & Villas', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-de-santo-antonio-country-house-&-villas--e2211724' },
  { name: 'W Algarve', url: 'https://www.weddingwire.com/destination-wedding/portugal/w-algarve--e2222682' },
  { name: 'Casa da Praia', url: 'https://www.weddingwire.com/destination-wedding/portugal/casa-da-praia--e1950715' },
  { name: 'Vila Alba Resort', url: 'https://www.weddingwire.com/destination-wedding/portugal/vila-alba-resort--e2192132' },
  { name: 'Quinta dos Casais', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-dos-casais--e2222002' },
  { name: 'Quinta da Cerca do Colégio', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-da-cerca-do-colegio--e1992745' },
  { name: 'The One Palácio da Anunciada', url: 'https://www.weddingwire.com/destination-wedding/portugal/the-one-palacio-da-anunciada--e2170529' },
  { name: 'Quinta da Barreta', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-da-barreta--e1972645' },
  { name: 'Colina do Romão', url: 'https://www.weddingwire.com/destination-wedding/portugal/colina-do-romao--e2001761' },
  { name: 'Quinta da Eira', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-da-eira--e1972635' },
  { name: 'Quinta da Boavista', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-da-boavista--e2001757' },
  { name: 'Monte do Giestal', url: 'https://www.weddingwire.com/destination-wedding/portugal/monte-do-giestal--e2225724' },
  { name: 'Nini Design Centre', url: 'https://www.weddingwire.com/destination-wedding/portugal/nini-design-centre--e2212470' },
  { name: '1º Plano Events', url: 'https://www.weddingwire.com/destination-wedding/portugal/1-plano-events--e2222728' },
  { name: 'Casa da Calçada', url: 'https://www.weddingwire.com/destination-wedding/portugal/casa-da-calcada--e2234526' },
  { name: 'Convento do Espinheiro', url: 'https://www.weddingwire.com/destination-wedding/portugal/convento-do-espinheiro--e2137425' },
  { name: 'Well Vale do Lobo', url: 'https://www.weddingwire.com/destination-wedding/portugal/well-vale-do-lobo--e2225134' },
  { name: 'You and the Sea', url: 'https://www.weddingwire.com/destination-wedding/portugal/you-and-the-sea--e2233016' },
  { name: 'Ynext Eventus', url: 'https://www.weddingwire.com/destination-wedding/portugal/ynext-eventus--e2220548' },
  { name: 'Quinta dos Lapiás', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-dos-lapias--e2019593' },
  { name: 'Hotel Mundial - Rooftop Bar', url: 'https://www.weddingwire.com/destination-wedding/portugal/hotel-mundial-rooftop-bar--e2227020' },
  { name: 'Quinta dos Lobos', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-dos-lobos--e2212664' },
  { name: 'Hotel Pateo dos Solares', url: 'https://www.weddingwire.com/destination-wedding/portugal/hotel-pateo-dos-solares--e2229222' },
  { name: 'Vinte-Quinta da Boavista', url: 'https://www.weddingwire.com/destination-wedding/portugal/vinte-quinta-da-boavista--e2223848' },
  { name: 'Kimpton Atlântico Algarve', url: 'https://www.weddingwire.com/destination-wedding/portugal/kimpton-atlantico-algarve--e2231138' },
  { name: 'Penedo Village', url: 'https://www.weddingwire.com/destination-wedding/portugal/penedo-village--e2236952' },
  { name: 'Quinta de Molha Pão', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-de-molha-pao--e2221206' },
  { name: 'Quinta do Joinal', url: 'https://www.weddingwire.com/destination-wedding/portugal/quinta-do-joinal--e2042489' },
  { name: 'Solar do Paço Algarve', url: 'https://www.weddingwire.com/destination-wedding/portugal/solar-do-paco-algarve--e2223946' },
  { name: 'Wedding Planner in Portugal', url: 'https://www.weddingwire.com/destination-wedding/portugal/wedding-planner-in-portugal--e2219290' },
  { name: 'Eventual Wedding Planner', url: 'https://www.weddingwire.com/destination-wedding/portugal/eventual-wedding-planner--e2234590' },
  { name: 'Sesmarias Turismo Rural Spa', url: 'https://www.weddingwire.com/destination-wedding/portugal/sesmarias-turismo-rural-spa--e2211424' },
]

// ===== 工具函数 =====
function makeSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

function cleanText(text) {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim()
}

// 预算范围（统一模板，因为页面不直接提供）
const DEFAULT_BUDGET = JSON.stringify([
  { label: '2万-5万欧元', min: 20000, max: 50000 },
  { label: '5万-10万欧元', min: 50000, max: 100000 },
  { label: '10万欧元以上', min: 100000, max: null }
])
const DEFAULT_GUEST = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

// 邮件发送
async function sendEmail(subject, html) {
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG)
    const info = await transporter.sendMail({
      from: `"薇雅爬虫通知" <TW15536500878@163.com>`,
      to: NOTIFY_TO,
      subject,
      html
    })
    console.log(`✓ 邮件已发送: ${info.messageId}`)
    return true
  } catch (err) {
    console.error('✗ 邮件发送失败:', err.message)
    return false
  }
}

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
    await wait(2000)

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
          // 获取所有段落文本
          const paragraphs = el.querySelectorAll('p')
          if (paragraphs.length > 0) {
            return Array.from(paragraphs).map(p => p.textContent.trim()).filter(t => t).join('\n\n')
          }
          return el.textContent.trim()
        }, descEl)
      }
    } catch {}

    // 如果没有从 DOM 获取到，尝试从 JSON-LD 获取
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
      // 解析面包屑中的类型，如 "Mansion Weddings"
      if (breadcrumbText) {
        const typeMatch = breadcrumbText.match(/(\w+)\s*Weddings?/i)
        if (typeMatch) {
          const typeEn = typeMatch[1]
          const typeMap = {
            'Mansion': { name: '庄园', name_en: 'Mansion' },
            'Garden': { name: '花园', name_en: 'Garden' },
            'Hotel': { name: '酒店', name_en: 'Hotel' },
            'Restaurant': { name: '餐厅', name_en: 'Restaurant' },
            'Beach': { name: '海滩', name_en: 'Beach' },
            'Barn': { name: '谷仓', name_en: 'Barn' },
            'Banquet': { name: '宴会厅', name_en: 'Banquet Hall' },
            'Country': { name: '乡村', name_en: 'Country House' },
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
      // 也从 JSON-LD 获取地址
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

    // 提取图片 URL（从 JSON-LD）
    let images = []
    if (ldData && ldData.image) {
      const imgList = Array.isArray(ldData.image) ? ldData.image : [ldData.image]
      for (const img of imgList) {
        const imgUrl = typeof img === 'string' ? img : (img.contentUrl || img.url || '')
        if (imgUrl && !images.includes(imgUrl)) {
          images.push(imgUrl)
        }
        if (images.length >= MAX_IMAGES) break
      }
    }

    // 如果 JSON-LD 没有图片，从页面 DOM 提取
    if (images.length === 0) {
      try {
        const domImages = await page.evaluate(() => {
          const imgs = document.querySelectorAll('.storefrontMultiGallery img, img[src*="cdn0.casamentos.pt"]')
          return Array.from(imgs).map(img => img.src || img.getAttribute('data-src') || '').filter(Boolean)
        })
        const seen = new Set()
        for (const url of domImages) {
          if (!seen.has(url)) {
            seen.add(url)
            images.push(url)
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

    // 构建 tagline（从描述第一句提取）
    let tagline = ''
    if (description) {
      const firstSentence = description.split(/[。\.\n]/)[0].trim()
      tagline = firstSentence.slice(0, 80)
    }

    // 构建特色列表（从描述中提取关键信息 + 评分信息）
    let features = []
    if (description) {
      // 尝试从描述中提取要点
      const sentences = description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (rating && reviewCount > 0) {
      features.push(`WeddingWire ${rating}分（${reviewCount}条评价）`)
    }

    // 确保至少有场地类型
    if (venueTypes.length === 0) {
      // 根据名称猜测类型
      const nameLower = venue.name.toLowerCase()
      if (nameLower.includes('quinta') || nameLower.includes('palacio') || nameLower.includes('palace')) {
        venueTypes.push({ name: '庄园', name_en: 'Mansion' })
      } else if (nameLower.includes('hotel') || nameLower.includes('resort')) {
        venueTypes.push({ name: '酒店', name_en: 'Hotel' })
      } else if (nameLower.includes('farm') || nameLower.includes('herdade')) {
        venueTypes.push({ name: '农场/庄园', name_en: 'Farm' })
      } else if (nameLower.includes('event') || nameLower.includes('planner')) {
        venueTypes.push({ name: '婚礼策划', name_en: 'Wedding Planner' })
      } else {
        venueTypes.push({ name: '婚礼场地', name_en: 'Wedding Venue' })
      }
    }

    // 确保至少有一个城镇
    if (towns.length === 0) {
      towns.push({ name: 'Portugal', name_cn: '葡萄牙' })
    }

    // 确保有描述
    if (!description) {
      description = `${venue.name} 是葡萄牙精选婚礼场地，提供优质的婚礼服务和独特的场地体验。`
    }

    // 确保有特色
    if (features.length === 0) {
      features = ['葡萄牙精选婚礼场地', '专业婚礼服务团队']
    }

    const coverImage = images[0] || ''

    result.data = {
      slug: result.slug,
      name: venue.name,
      name_cn: venue.name,
      tagline: tagline || `${venue.name} - 葡萄牙婚礼场地`,
      description: description,
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(images),
      budget_ranges: DEFAULT_BUDGET,
      guest_capacities: DEFAULT_GUEST,
      cover_image: coverImage,
      cover_image_url: coverImage,
      source_url: venue.url,
      rating: rating,
      review_count: reviewCount,
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
  console.log(` 开始爬取葡萄牙 ${VENUES.length} 个场地...`)

  // 发送开始通知
  await sendEmail(
    ` 葡萄牙爬虫任务开始 - 共${VENUES.length}个场地`,
    `<h2>爬虫任务已启动</h2>
     <p><b>目标国家:</b> 葡萄牙</p>
     <p><b>场地数量:</b> ${VENUES.length} 个</p>
     <p><b>开始时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p>爬取完成后将再次通知您结果。</p>`
  )

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

  // 先访问 WeddingWire 建立上下文
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

  for (let i = 0; i < VENUES.length; i++) {
    const venue = VENUES[i]
    console.log(`\n[${i + 1}/${VENUES.length}] 爬取: ${venue.name}`)

    const result = await crawlVenue(page, venue)

    if (result.success && result.data) {
      const d = result.data
      try {
        // 检查是否已存在
        const [existing] = await pool.execute(
          'SELECT id FROM crawled_destinations WHERE slug = ? AND country = ?',
          [d.slug, COUNTRY]
        )

        if (existing.length > 0) {
          // 更新
          await pool.execute(
            `UPDATE crawled_destinations SET 
              name=?, name_cn=?, tagline=?, description=?, features=?, 
              venue_types=?, towns=?, images=?, budget_ranges=?, guest_capacities=?, 
              cover_image=?, cover_image_url=?, source_url=?, sort_order=?
             WHERE slug=? AND country=?`,
            [
              d.name, d.name_cn, d.tagline, d.description, d.features,
              d.venue_types, d.towns, d.images, d.budget_ranges, d.guest_capacities,
              d.cover_image, d.cover_image_url, d.source_url, 30 + i,
              d.slug, COUNTRY
            ]
          )
          console.log(`  ✓ 已更新: ${d.name_cn}`)
          results.push({ name: d.name, name_cn: d.name_cn, status: '已更新' })
          successCount++
        } else {
          // 插入
          await pool.execute(
            `INSERT INTO crawled_destinations 
             (slug, name, name_cn, country, country_cn, source_url, tagline, description, 
              features, venue_types, towns, images, budget_ranges, guest_capacities, 
              cover_image, cover_image_url, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, d.source_url,
              d.tagline, d.description, d.features, d.venue_types, d.towns,
              d.images, d.budget_ranges, d.guest_capacities,
              d.cover_image, d.cover_image_url, 30 + i
            ]
          )
          console.log(`  ✓ 已入库: ${d.name_cn} | 图片${JSON.parse(d.images).length}张 | 描述${d.description.length}字`)
          results.push({ name: d.name, name_cn: d.name_cn, status: '已入库' })
          successCount++
        }
      } catch (dbErr) {
        console.error(`  ✗ 数据库操作失败: ${dbErr.message}`)
        results.push({ name: venue.name, name_cn: venue.name, status: `DB错误: ${dbErr.message}` })
        failCount++
      }
    } else {
      console.log(`  ✗ 爬取失败: ${result.error}`)
      results.push({ name: venue.name, name_cn: venue.name, status: `爬取失败: ${result.error}` })
      failCount++
    }

    // 每个场地之间间隔，避免被封
    await wait(1500 + Math.random() * 1000)
  }

  await browser.close()
  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 爬取完成！成功: ${successCount}, 失败: ${failCount}, 耗时: ${elapsed}秒`)

  // 发送结果邮件
  const status = failCount > 0 ? '⚠️ 部分完成' : '✅ 全部成功'
  const resultRows = results.map((r, i) => `
    <tr style="${r.status.includes('失败') || r.status.includes('错误') ? 'background:#ffe0e0' : ''}">
      <td>${i + 1}</td>
      <td>${r.name || '-'}</td>
      <td>${r.name_cn || '-'}</td>
      <td style="color:${r.status.includes('失败') || r.status.includes('错误') ? 'red' : 'green'}">${r.status}</td>
    </tr>
  `).join('')

  await sendEmail(
    `${status} 葡萄牙爬虫任务完成 - 成功${successCount}/失败${failCount}`,
    `<h2>爬虫任务完成</h2>
     <p><b>目标国家:</b> 葡萄牙</p>
     <p><b>完成时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p><b>耗时:</b> ${elapsed} 秒</p>
     <p><b>成功:</b> ${successCount} | <b>失败:</b> ${failCount}</p>
     <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
       <tr style="background:#f0f0f0"><th>#</th><th>英文名</th><th>中文名</th><th>状态</th></tr>
       ${resultRows}
     </table>
     <p style="margin-top:16px"><b>共处理 ${results.length} 个场地</b></p>
     <p style="margin-top:20px;color:#666">请前往 <a href="https://www.europewedding.cn/crawled-portugal">https://www.europewedding.cn/crawled-portugal</a> 查看结果。</p>
     <p style="color:#999;font-size:12px">注意：图片未下载，仅保存了外部URL。需要后续本地处理图片。</p>`
  )
}

main().catch(async err => {
  console.error('❌ 脚本执行失败:', err.message)
  await sendEmail(
    `❌ 葡萄牙爬虫任务异常失败`,
    `<h2>爬虫任务异常失败</h2>
     <p><b>目标国家:</b> 葡萄牙</p>
     <p><b>错误信息:</b> ${err.message}</p>
     <p><b>时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>`
  )
  process.exit(1)
})
