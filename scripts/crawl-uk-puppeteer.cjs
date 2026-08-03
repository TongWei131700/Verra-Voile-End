/**
 * 英国婚礼场地爬取脚本（服务端运行，puppeteer-core 绕过反爬）
 * 
 * 爬取 WeddingWire 英国 4 个场地详情页，入库 crawled_venues 表
 * 数据放在"测试英国"下，不影响线上"英国"数据
 * 
 * 用法: node scripts/crawl-uk-puppeteer.cjs
 */

const puppeteer = require('puppeteer-core')
const mysql = require('mysql2/promise')
const nodemailer = require('nodemailer')

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
const COUNTRY = 'United Kingdom'
const COUNTRY_CN = '测试英国'
const MAX_IMAGES = 24

// ===== 英国场地 URL（从搜索页 destCountry=4 提取） =====
const VENUES = [
  { name: 'Morden Hall', url: 'https://www.weddingwire.com/destination-wedding/destination/morden-hall--e2229594' },
  { name: 'Brinsop Court Manor House and Barn', url: 'https://www.weddingwire.com/destination-wedding/destination/brinsop-court-manor-house-and-barn--e2229393' },
  { name: 'St Giles House', url: 'https://www.weddingwire.com/destination-wedding/destination/st-giles-house--e2229651' },
  { name: 'The Old Parsonage', url: 'https://www.weddingwire.com/destination-wedding/destination/the-old-parsonage--e2229710' },
]

// ===== 工具函数 =====
function makeSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

const DEFAULT_BUDGET = JSON.stringify([
  { label: '2万-5万英镑', min: 20000, max: 50000 },
  { label: '5万-10万英镑', min: 50000, max: 100000 },
  { label: '10万英镑以上', min: 100000, max: null }
])
const DEFAULT_GUEST = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

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
          const paragraphs = el.querySelectorAll('p')
          if (paragraphs.length > 0) {
            return Array.from(paragraphs).map(p => p.textContent.trim()).filter(t => t).join('\n\n')
          }
          return el.textContent.trim()
        }, descEl)
      }
    } catch {}

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
      if (breadcrumbText) {
        const typeMatch = breadcrumbText.match(/(\w+)\s*Weddings?/i)
        if (typeMatch) {
          const typeEn = typeMatch[1]
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

    // 提取图片 URL
    let images = []
    // 从 JSON-LD 获取
    if (ldData && ldData.image) {
      const imgList = Array.isArray(ldData.image) ? ldData.image : [ldData.image]
      for (const img of imgList) {
        const imgUrl = typeof img === 'string' ? img : (img.contentUrl || img.url || '')
        if (imgUrl && !images.includes(imgUrl)) {
          // 高清化：替换 /960/ 为 /1920/
          const hd = imgUrl.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          images.push(hd)
        }
        if (images.length >= MAX_IMAGES) break
      }
    }

    // 如果 JSON-LD 没有图片，从 DOM 提取
    if (images.length === 0) {
      try {
        const domImages = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img')
          return Array.from(imgs).map(img => img.src || img.getAttribute('data-src') || '').filter(src =>
            src && (src.includes('cdn0.hitched.co.uk/vendor/') || src.includes('cdn0.weddingwire.com/vendor/'))
          )
        })
        const seen = new Set()
        for (const url of domImages) {
          const hd = url.replace(/(\/vendor\/\d+\/\d+_\d+)\/\d+(\/)/, '$1/1920$2').replace(/\?.*$/, '')
          if (!seen.has(hd)) {
            seen.add(hd)
            images.push(hd)
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

    // 构建 tagline
    let tagline = ''
    if (description) {
      const firstSentence = description.split(/[。\.\n]/)[0].trim()
      tagline = firstSentence.slice(0, 80)
    }

    // 构建特色
    let features = []
    if (description) {
      const sentences = description.split(/[。\.\n]/).map(s => s.trim()).filter(s => s.length > 10)
      features = sentences.slice(0, 6).map(s => s.slice(0, 100))
    }
    if (rating && reviewCount > 0) {
      features.push(`WeddingWire ${rating}分（${reviewCount}条评价）`)
    }

    // 确保至少有场地类型
    if (venueTypes.length === 0) {
      const nameLower = venue.name.toLowerCase()
      if (nameLower.includes('hall') || nameLower.includes('manor') || nameLower.includes('court')) {
        venueTypes.push({ name: '庄园', name_en: 'Manor House' })
      } else if (nameLower.includes('hotel')) {
        venueTypes.push({ name: '酒店', name_en: 'Hotel' })
      } else {
        venueTypes.push({ name: '婚礼场地', name_en: 'Wedding Venue' })
      }
    }

    if (towns.length === 0) {
      towns.push({ name: 'United Kingdom', name_cn: '英国' })
    }
    if (!description) {
      description = `${venue.name} is a selected wedding venue in the United Kingdom, offering premium wedding services and unique venue experiences.`
    }
    if (features.length === 0) {
      features = ['UK selected wedding venue', 'Professional wedding service team']
    }

    const coverImage = images[0] || ''

    result.data = {
      slug: result.slug,
      name: venue.name,
      name_cn: '',
      tagline: tagline || `${venue.name} - UK Wedding Venue`,
      description: description,
      features: JSON.stringify(features),
      venue_types: JSON.stringify(venueTypes),
      towns: JSON.stringify(towns),
      images: JSON.stringify(images),
      budget_ranges: DEFAULT_BUDGET,
      guest_capacities: DEFAULT_GUEST,
      cover_image: coverImage,
      source_url: venue.url,
      rating: rating,
      review_count: reviewCount,
      location: towns.length > 0 ? towns[0].name : '',
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
  console.log(`🇬🇧 开始爬取英国 ${VENUES.length} 个场地（测试英国）...`)

  await sendEmail(
    `🇬🇧 英国爬虫任务开始 - 共${VENUES.length}个场地`,
    `<h2>爬虫任务已启动</h2>
     <p><b>目标国家:</b> 英国（测试英国）</p>
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

  // 先访问 WeddingWire 建立会话
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
        // 检查是否已存在（只增不覆盖）
        const [existing] = await pool.execute(
          'SELECT id FROM crawled_venues WHERE slug = ?',
          [d.slug]
        )

        if (existing.length > 0) {
          console.log(`  ⏭ 已存在，跳过: ${d.slug}`)
          results.push({ name: d.name, slug: d.slug, status: '已存在' })
          skipCount++
        } else {
          await pool.execute(
            `INSERT INTO crawled_venues 
             (slug, name, name_cn, country, country_cn, source_url, tagline, description,
              features, venue_types, towns, images, budget_ranges, guest_capacities,
              faq, cover_image, rating, review_count, location, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.slug, d.name, d.name_cn, COUNTRY, COUNTRY_CN, d.source_url,
             d.tagline, d.description, d.features, d.venue_types, d.towns,
             d.images, d.budget_ranges, d.guest_capacities,
             JSON.stringify([]), d.cover_image,
             d.rating || '', d.review_count || '0',
             d.location || '', 100 + i]
          )
          const imgCount = JSON.parse(d.images).length
          console.log(`  ✓ 已入库: ${d.name} | 图片${imgCount}张 | 描述${d.description.length}字`)
          results.push({ name: d.name, slug: d.slug, images: imgCount, status: '已入库' })
          successCount++
        }
      } catch (dbErr) {
        console.error(`  ✗ 数据库操作失败: ${dbErr.message}`)
        results.push({ name: venue.name, slug: result.slug, status: `DB错误: ${dbErr.message}` })
        failCount++
      }
    } else {
      console.log(`  ✗ 爬取失败: ${result.error}`)
      results.push({ name: venue.name, slug: result.slug, status: `爬取失败: ${result.error}` })
      failCount++
    }

    // 随机延时，避免被封
    await wait(1500 + Math.random() * 1000)
  }

  await browser.close()
  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 爬取完成！成功: ${successCount}, 跳过: ${skipCount}, 失败: ${failCount}, 耗时: ${elapsed}秒`)

  // 发送结果邮件
  const status = failCount > 0 ? '⚠️ 部分完成' : '✅ 全部成功'
  const resultRows = results.map((r, i) => `
    <tr style="${r.status.includes('失败') || r.status.includes('错误') ? 'background:#ffe0e0' : ''}">
      <td>${i + 1}</td>
      <td>${r.name || '-'}</td>
      <td>${r.slug || '-'}</td>
      <td style="color:${r.status.includes('失败') || r.status.includes('错误') ? 'red' : 'green'}">${r.status}</td>
    </tr>
  `).join('')

  await sendEmail(
    `${status} 英国爬虫任务完成 - 成功${successCount}/跳过${skipCount}/失败${failCount}`,
    `<h2>爬虫任务完成</h2>
     <p><b>目标国家:</b> 英国（测试英国）</p>
     <p><b>完成时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p><b>耗时:</b> ${elapsed} 秒</p>
     <p><b>成功:</b> ${successCount} | <b>跳过:</b> ${skipCount} | <b>失败:</b> ${failCount}</p>
     <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
       <tr style="background:#f0f0f0"><th>#</th><th>场地名</th><th>Slug</th><th>状态</th></tr>
       ${resultRows}
     </table>
     <p style="margin-top:16px"><b>共处理 ${results.length} 个场地</b></p>`
  )
}

main().catch(async err => {
  console.error('❌ 脚本执行失败:', err.message)
  await sendEmail(
    `❌ 英国爬虫任务异常失败`,
    `<h2>爬虫任务异常失败</h2>
     <p><b>目标国家:</b> 英国（测试英国）</p>
     <p><b>错误信息:</b> ${err.message}</p>
     <p><b>时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>`
  )
  process.exit(1)
})
