/**
 * 通用批量场地爬取脚本（本地运行，puppeteer-core）
 * 
 * 用法:
 *   node scripts/crawl-batch.cjs --country=italy
 *   node scripts/crawl-batch.cjs --country=spain
 * 
 * 从 scripts/{country}-venues.json 读取场地列表
 * 写入 cv_test_{country} / cd_test_{country} / products 表
 */

const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')
const path = require('path')
const fs = require('fs')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 配置 =====
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DB_CONFIG = {
  host: 'localhost', port: 3306, user: 'root', password: '',
  database: 'verra_voile', waitForConnections: true, connectionLimit: 3,
}
const MAX_IMAGES = 24

// 国家配置
const COUNTRY_CONFIG = {
  italy: {
    country: 'Test Italy', countryCn: '测试意大利', suffix: 'test_italy',
    flag: '🇮🇹', budgetLabel: ['2万-5万欧元', '5万-10万欧元', '10万欧元以上'],
  },
  spain: {
    country: 'Test Spain', countryCn: '测试西班牙', suffix: 'test_spain',
    flag: '🇪🇸', budgetLabel: ['2万-5万欧元', '5万-10万欧元', '10万欧元以上'],
  },
}

// ===== 解析命令行 =====
const args = process.argv.slice(2)
const countryArg = args.find(a => a.startsWith('--country='))
if (!countryArg) {
  console.error('用法: node scripts/crawl-batch.cjs --country=italy|spain')
  process.exit(1)
}
const countryKey = countryArg.split('=')[1]
const config = COUNTRY_CONFIG[countryKey]
if (!config) {
  console.error(`不支持的国家: ${countryKey}，可选: ${Object.keys(COUNTRY_CONFIG).join(', ')}`)
  process.exit(1)
}

// 读取场地列表
const venuesFile = path.join(__dirname, `${countryKey}-venues.json`)
if (!fs.existsSync(venuesFile)) {
  console.error(`场地列表文件不存在: ${venuesFile}`)
  process.exit(1)
}
const VENUES = JSON.parse(fs.readFileSync(venuesFile, 'utf-8'))

// ===== 工具函数 =====
function makeSlug(name) {
  const prefix = `test-${countryKey}-`
  const maxNameLen = 50 - prefix.length - 1  // product_id max 50
  return prefix + name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .slice(0, maxNameLen)
}

function getDefaultBudget(labels) {
  return JSON.stringify([
    { label: labels[0], min: 20000, max: 50000 },
    { label: labels[1], min: 50000, max: 100000 },
    { label: labels[2], min: 100000, max: null }
  ])
}
const DEFAULT_GUEST = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

// ===== 爬取单个场地 =====
async function crawlVenue(page, venue) {
  const result = { name: venue.name, url: venue.url, slug: makeSlug(venue.name), success: false, error: null, data: null }

  try {
    await page.goto(venue.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await wait(2000)

    // 点击页面所有 "Read more" 展开折叠内容（描述、FAQ、评价等）
    try {
      const readMoreSelectors = [
        '.storefrontDescription__link',
        '.storefrontFaq__link',
        '.storefrontReviews__link',
        '[class*="ReadMore"]',
        '[class*="readMore"]',
        'a[data-testid*="read-more"]',
      ]
      for (const sel of readMoreSelectors) {
        const btns = await page.$$(sel)
        for (const btn of btns) { try { await btn.click() } catch {} }
      }
      // 通用：点击所有包含 "Read more" / "Show more" 文本的可点击元素
      await page.evaluate(() => {
        const keywords = ['read more', 'show more', 'view more', 'see more', '展开', 'ver más']
        document.querySelectorAll('a, button, span[role="button"]').forEach(el => {
          const text = (el.textContent || '').toLowerCase().trim()
          if (keywords.some(k => text.includes(k))) {
            try { el.click() } catch {}
          }
        })
      })
      await wait(1500)
    } catch {}

    // 提取 JSON-LD
    const jsonData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      const results = []
      scripts.forEach(s => { try { results.push(JSON.parse(s.textContent)) } catch {} })
      return results
    })

    let ldData = null
    for (const item of jsonData) {
      if (item['@type'] === 'LocalBusiness' || item['@type'] === 'WeddingVenue') { ldData = item; break }
      if (item['@graph']) {
        for (const sub of item['@graph']) {
          if (sub['@type'] === 'LocalBusiness' || sub['@type'] === 'WeddingVenue') { ldData = sub; break }
        }
      }
      if (ldData) break
    }

    // 描述（提取所有文本内容，包括 p、ul/li 等）
    let description = ''
    try {
      // 优先从侧弹窗（Read more 弹窗）获取完整描述
      const modalContent = await page.$('.sideModal__content, .modal__content.sideModal')
      if (modalContent) {
        const modalText = await page.evaluate(el => {
          let text = el.innerText || el.textContent || ''
          // 去除末尾的 "Read more" / "Hide" 等按钮文本
          text = text.replace(/\s*(Read more|Hide|Show less|Ver m\u00e1s|Mostrar menos)\s*$/i, '')
          const lines = text.split('\n').map(l => l.trim()).filter(l => l)
          return lines.join('\n\n').replace(/\n\n\n+/g, '\n\n').trim()
        }, modalContent)
        if (modalText && modalText.length > 100) {
          description = modalText
        }
      }
      // 如果没有弹窗或弹窗内容太短，从原描述区域提取
      if (!description) {
        const descEl = await page.$('.storefrontDescription__content')
        if (descEl) {
          description = await page.evaluate(el => {
            let text = el.innerText || el.textContent || ''
            text = text.replace(/\s*(Read more|Hide|Show less|Ver m\u00e1s|Mostrar menos)\s*$/i, '')
            const lines = text.split('\n').map(l => l.trim()).filter(l => l)
            return lines.join('\n\n').replace(/\n\n\n+/g, '\n\n').trim()
          }, descEl)
        }
      }
    } catch {}
    if (!description && ldData && ldData.description) description = ldData.description

    // 场地类型
    let venueTypes = []
    try {
      const breadcrumbText = await page.evaluate(() => {
        const nav = document.querySelector('nav[aria-label="Breadcrumb"]') || document.querySelector('.storefrontNavigationBreadcrumb')
        return nav ? nav.textContent : ''
      })
      if (breadcrumbText) {
        const typeMatch = breadcrumbText.match(/(\w+)\s*Weddings?/i)
        if (typeMatch) {
          const typeEn = typeMatch[1]
          const typeMap = {
            'Mansion': { name: 'Mansion', name_cn: '庄园' }, 'Garden': { name: 'Garden', name_cn: '花园' },
            'Hotel': { name: 'Hotel', name_cn: '酒店' }, 'Restaurant': { name: 'Restaurant', name_cn: '餐厅' },
            'Barn': { name: 'Barn', name_cn: '谷仓' }, 'Banquet': { name: 'Banquet Hall', name_cn: '宴会厅' },
            'Country': { name: 'Country House', name_cn: '乡村庄园' }, 'Historic': { name: 'Historic Building', name_cn: '历史建筑' },
            'Manor': { name: 'Manor House', name_cn: '庄园' },
          }
          if (typeMap[typeEn]) venueTypes.push(typeMap[typeEn])
        }
      }
    } catch {}

    // 位置
    let towns = []
    try {
      const locationText = await page.evaluate(() => {
        const loc = document.querySelector('.storefrontHeadingLocation__label a')
        return loc ? loc.textContent.trim() : ''
      })
      if (locationText) towns.push({ name: locationText, name_cn: locationText })
      if (ldData && ldData.address) {
        const addr = ldData.address
        if (addr.addressLocality && !towns.find(t => t.name === addr.addressLocality))
          towns.push({ name: addr.addressLocality, name_cn: addr.addressLocality })
        if (addr.addressRegion && !towns.find(t => t.name === addr.addressRegion))
          towns.push({ name: addr.addressRegion, name_cn: addr.addressRegion })
      }
    } catch {}

    // 图片
    let images = []
    if (ldData && ldData.image) {
      const imgList = Array.isArray(ldData.image) ? ldData.image : [ldData.image]
      for (const img of imgList) {
        const imgUrl = typeof img === 'string' ? img : (img.contentUrl || img.url || '')
        if (imgUrl) {
          // 转换为高清：/640/ /960/ /1280/ 都转为 /1920/
          const hd = imgUrl.replace(/\/(640|960|1280)\//, '/1920/').replace(/\?.*$/, '')
          if (!images.includes(hd)) images.push(hd)
        }
        if (images.length >= MAX_IMAGES) break
      }
    }
    // 如果图片不够，从 DOM 提取（包括滚动加载的图片）
    if (images.length < 12) {
      try {
        // 滚动页面加载更多图片
        await page.evaluate(async () => {
          const gallery = document.querySelector('.storefrontGallery, [class*="gallery"]')
          if (gallery) {
            for (let i = 0; i < 3; i++) {
              gallery.scrollIntoView({ behavior: 'smooth' })
              await new Promise(r => setTimeout(r, 500))
            }
          }
        })
        await wait(1500)
        
        const domImages = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img')
          return Array.from(imgs).map(img => img.src || img.getAttribute('data-src') || '').filter(src =>
            src && (src.includes('cdn0.weddingwire.com/vendor/') || src.includes('cdn0.mariages.net/vendor/') || src.includes('cdn0.hitched.co.uk/vendor/') || src.includes('cdn0.bodas.net/vendor/') || src.includes('cdn0.matrimonio.com/vendor/'))
          )
        })
        const seen = new Set(images)
        for (const url of domImages) {
          // 转换为高清
          const hd = url.replace(/\/(640|960|1280)\//, '/1920/').replace(/\?.*$/, '')
          if (!seen.has(hd)) { seen.add(hd); images.push(hd) }
          if (images.length >= MAX_IMAGES) break
        }
      } catch {}
    }

    // 评分
    let rating = null, reviewCount = 0
    if (ldData && ldData.aggregateRating) {
      rating = parseFloat(ldData.aggregateRating.ratingValue) || null
      reviewCount = parseInt(ldData.aggregateRating.reviewCount) || 0
    }

    // tagline
    let tagline = ''
    if (description) {
      const firstSentence = description.split(/[。\.\n]/)[0].trim()
      tagline = firstSentence.slice(0, 80)
    }

    // 特色
    let features = []
    if (description) {
      const sentences = description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (rating && reviewCount > 0) features.push(`WeddingWire ${rating}分（${reviewCount}条评价）`)

    // FAQ 提取
    let faq = []
    try {
      // 方式1：结构化 FAQ 区域（Q&A 对）
      const faqData = await page.evaluate(() => {
        const result = []
        // WeddingWire FAQ 区块
        const faqSections = document.querySelectorAll('.storefrontFaq__section, .storefrontFaq__item, [class*="FaqItem"], [class*="faq-item"]')
        faqSections.forEach(section => {
          const q = section.querySelector('.storefrontFaq__question, [class*="question"], h3, h4, strong')
          const a = section.querySelector('.storefrontFaq__answer, [class*="answer"], p')
          if (q && a) {
            result.push({ q: q.textContent.trim(), a: a.textContent.trim() })
          }
        })
        // 方式2：通用 dt/dd 或 dl 结构
        if (result.length === 0) {
          const dts = document.querySelectorAll('dt, .faq-question, [class*="faqQ"]')
          dts.forEach(dt => {
            const dd = dt.nextElementSibling
            if (dd && (dd.tagName === 'DD' || dd.classList.contains('faq-answer') || dd.classList.contains('faqA'))) {
              result.push({ q: dt.textContent.trim(), a: dd.textContent.trim() })
            }
          })
        }
        // 方式3：底部 FAQ 区块（WeddingWire 页面底部的 "Frequently Asked Questions"）
        if (result.length === 0) {
          const allH2 = document.querySelectorAll('h2, h3')
          for (const h of allH2) {
            if (h.textContent.toLowerCase().includes('frequently asked') || h.textContent.toLowerCase().includes('faq')) {
              let sibling = h.nextElementSibling
              while (sibling && sibling.tagName !== 'H2' && sibling.tagName !== 'H3') {
                const qEl = sibling.querySelector('strong, b, [class*="question"]')
                const aEl = sibling.querySelector('p, span, [class*="answer"]')
                if (qEl && aEl) {
                  result.push({ q: qEl.textContent.trim(), a: aEl.textContent.trim() })
                } else if (sibling.tagName === 'P' || sibling.tagName === 'DIV') {
                  const text = sibling.textContent.trim()
                  if (text.includes('?')) {
                    const parts = text.split('?')
                    if (parts.length >= 2) {
                      result.push({ q: parts[0] + '?', a: parts.slice(1).join('?').trim() })
                    }
                  }
                }
                sibling = sibling.nextElementSibling
              }
              if (result.length > 0) break
            }
          }
        }
        return result
      })
      faq = faqData
    } catch {}

    // 默认值
    if (venueTypes.length === 0) {
      const n = venue.name.toLowerCase()
      if (n.includes('hotel') || n.includes('resort') || n.includes('seleqtta') || n.includes('marriott') || n.includes('westin') || n.includes('meliá'))
        venueTypes.push({ name: 'Hotel', name_cn: '酒店' })
      else if (n.includes('villa')) venueTypes.push({ name: 'Villa', name_cn: '别墅' })
      else if (n.includes('masía') || n.includes('masia') || n.includes('finca') || n.includes('mas '))
        venueTypes.push({ name: 'Finca', name_cn: '庄园' })
      else if (n.includes('castillo') || n.includes('castell') || n.includes('castle'))
        venueTypes.push({ name: 'Castle', name_cn: '城堡' })
      else if (n.includes('restaurant') || n.includes('bistro'))
        venueTypes.push({ name: 'Restaurant', name_cn: '餐厅' })
      else if (n.includes('golf')) venueTypes.push({ name: 'Golf Course', name_cn: '高尔夫球场' })
      else venueTypes.push({ name: 'Wedding Venue', name_cn: '婚礼场地' })
    }

    if (towns.length === 0) towns.push({ name: config.country, name_cn: config.countryCn })
    if (!description) description = `${venue.name} is a selected wedding venue, offering premium wedding services.`
    if (features.length === 0) features = ['Selected wedding venue', 'Professional wedding service team']

    const coverImage = images[0] || ''

    result.data = {
      slug: result.slug, name: venue.name, name_cn: '',
      tagline: tagline || `${venue.name} - Wedding Venue`, tagline_cn: '',
      description, description_cn: '',
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(images),
      budget_ranges: getDefaultBudget(config.budgetLabel),
      guest_capacities: DEFAULT_GUEST,
      cover_image: coverImage, source_url: venue.url,
      rating, review_count: reviewCount,
      location: towns.length > 0 ? towns[0].name : '',
      faq: JSON.stringify(faq),
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
  console.log(`${config.flag} 开始爬取${config.countryCn} ${VENUES.length} 个场地...`)

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')

  let browser = await puppeteer.launch({
    executablePath: CHROME_PATH, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  console.log('✓ 浏览器已启动')

  let page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  try {
    await page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log('✓ 已建立 WeddingWire 会话')
  } catch (e) {
    console.log('⚠ WeddingWire 首页加载超时，继续...')
  }

  const cvTable = `cv_${config.suffix}`
  const cdTable = `cd_${config.suffix}`
  let successCount = 0, failCount = 0, skipCount = 0
  const failures = []
  let consecutiveTimeouts = 0

  // 预先加载已有 slug，避免重复爬取
  const [existingRows] = await pool.execute(`SELECT slug FROM \`${cvTable}\``)
  const existingSlugs = new Set(existingRows.map(r => r.slug))
  console.log(`✓ 已有 ${existingSlugs.size} 条数据，将跳过已存在的`)

  // 浏览器重启函数
  async function restartBrowser(state) {
    try { await state.browser.close() } catch {}
    await new Promise(r => setTimeout(r, 3000))
    state.browser = await puppeteer.launch({
      executablePath: CHROME_PATH, headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    console.log('  ♻ 浏览器已完全重启')
  }

  // 创建新 page（用于超时后恢复）
  async function freshPage(state) {
    try { await state.page.close() } catch {}
    state.page = await state.browser.newPage()
    await state.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    try {
      await state.page.goto('https://www.weddingwire.com/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    } catch {}
  }

  // 使用 state 对象管理 browser/page 引用
  const state = { browser, page }

  for (let i = 0; i < VENUES.length; i++) {
    const venue = VENUES[i]
    const slug = makeSlug(venue.name)
    
    // 预检查：跳过已存在的
    if (existingSlugs.has(slug)) {
      skipCount++
      continue
    }
    
    if ((i + 1) % 20 === 0 || i === 0) {
      console.log(`\n--- 进度: ${i + 1}/${VENUES.length} ---`)
    }
    console.log(`[${i + 1}/${VENUES.length}] ${venue.name}`)

    let result
    try {
      result = await Promise.race([
        crawlVenue(state.page, venue),
        new Promise((_, reject) => setTimeout(() => reject(new Error('单场地超时(45s)')), 45000))
      ])
      consecutiveTimeouts = 0  // 成功则重置计数
    } catch (timeoutErr) {
      consecutiveTimeouts++
      console.log(`  ✗ ${timeoutErr.message} (连续${consecutiveTimeouts}次)`)
      failures.push({ name: venue.name, error: timeoutErr.message })
      failCount++
      
      // 连续3次超时，重启整个浏览器
      if (consecutiveTimeouts >= 3) {
        await restartBrowser(state)
        await freshPage(state)
        consecutiveTimeouts = 0
      } else {
        // 单次超时：创建新 page
        await freshPage(state)
      }
      continue
    }

    if (result.success && result.data) {
      const d = result.data
      try {
        await pool.execute(
          `INSERT INTO \`${cvTable}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,rating,review_count,location,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [d.slug,d.name,d.name_cn,config.country,config.countryCn,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,d.rating||'',d.review_count||'0',d.location||'',100+i]
        )
        await pool.execute(
          `INSERT INTO \`${cdTable}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [d.slug,d.name,d.name_cn,config.country,config.countryCn,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,100+i]
        )
        const prodSlug = d.slug.slice(0, 50).replace(/-$/, '')
        await pool.execute(
          `INSERT INTO products (category_id,product_id,name,name_en,description,image,price,unit,highlight) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          ['destination',prodSlug,d.name,d.name,`${config.countryCn}婚礼场地`,d.cover_image,0,'€',config.countryCn+'精选']
        )
        const imgCount = JSON.parse(d.images).length
        console.log(`  ✓ 图片${imgCount}张`)
        successCount++
      } catch (dbErr) {
        console.error(`  ✗ DB错误: ${dbErr.message}`)
        failures.push({ name: venue.name, error: dbErr.message })
        failCount++
      }
    } else {
      console.log(`  ✗ 爬取失败: ${result.error}`)
      failures.push({ name: venue.name, error: result.error })
      failCount++
      // 如果是 detached Frame 错误，创建新 page
      if (result.error && (result.error.includes('detached') || result.error.includes('Navigation'))) {
        await freshPage(state)
      }
    }

    if (i < VENUES.length - 1) await wait(1200 + Math.random() * 800)
  }

  await state.browser.close()
  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}, 耗时: ${elapsed}秒 (${Math.round(elapsed/60)}分钟)`)
  if (failures.length > 0) {
    console.log(`\n失败列表:`)
    failures.forEach((f, i) => console.log(`  ${i+1}. ${f.name}: ${f.error}`))
  }
}

main().catch(err => { console.error('❌ 脚本执行失败:', err.message); process.exit(1) })
