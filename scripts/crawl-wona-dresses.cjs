/**
 * 收集 wonaconcept.com 婚纱列表页全部商品 URL（翻页遍历）
 * 数据来源：https://wonaconcept.com/wedding-dresses/
 * 运行：node scripts/crawl-wona-dresses.cjs
 * 输出：scripts/wona-dress-list.json
 */
const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const LIST_URL = 'https://wonaconcept.com/wedding-dresses/'
const OUT_FILE = path.join(__dirname, 'wona-dress-list.json')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function collectFromPage(page) {
  return page.evaluate(() => {
    const container = document.querySelector('#products_list') || document.body
    const urls = new Set()
    container.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL(a.href)
        if (u.hostname !== 'wonaconcept.com') return
        const seg = u.pathname.replace(/^\/|\/$/g, '')
        if (!seg || seg.includes('/')) return
        // 排除导航/国家/分类页
        const nav = new Set(['wedding-dresses','collections','white','maison-blanche','atelier','couture',
          'white-edit','bridal-alchemy','white-swan','gemini-collection','alma-de-oro','endless-styles',
          'evening-dresses','veils','where-to-buy','flagship-stores','trunk-shows','company','sustainability',
          'blog','blog-wona','become-a-partner','contact-us','login','legal-pages','size-chart',
          'customer-support','bestsellers','categories','about',
          'a-line-wedding-dresses','ball-gown-wedding-dresses','boho-wedding-dresses','classic-wedding-dresses',
          'corset-back-wedding-dresses','fit-and-flare-wedding-dresses','mermaid-wedding-dresses',
          'minimalist-wedding-dresses','modern-wedding-dresses','off-the-shoulder-wedding-dresses',
          'plus-size-wedding-dresses','sexy-wedding-dresses','sleeve-wedding-dresses','strapless-wedding-dresses',
          'vintage-wedding-dresses'])
        if (nav.has(seg)) return
        urls.add(`https://wonaconcept.com/${seg}/`)
      } catch {}
    })
    return Array.from(urls)
  })
}
async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  await page.goto(LIST_URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(2000)

  // 处理 Cookie 弹窗，避免遮挡内容
  try {
    const acceptBtn = await page.$x("//button[contains(translate(., 'ACCEPT', 'accept'), 'accept')]")
    if (acceptBtn.length) { await acceptBtn[0].click(); await wait(500) }
  } catch {}

  const total = await page.evaluate(() => {
    const el = document.querySelector('[data-total]')
    return el ? parseInt(el.getAttribute('data-total') || '0', 10) : 0
  })
  console.log(`✓ 站点声明共 ${total} 件商品，开始滚动懒加载收集…`)

  const all = new Set()
  let stable = 0

  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await wait(1500)
    const urls = await collectFromPage(page)
    const prev = all.size
    urls.forEach(u => all.add(u))
    console.log(`  第 ${i + 1} 轮滚动：累计 ${all.size} 个`)
    if (all.size >= total) break
    if (all.size === prev) {
      stable++
      if (stable >= 4) break // 连续 4 轮无新增，认为加载完毕
    } else {
      stable = 0
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(Array.from(all), null, 2), 'utf8')
  console.log(`✅ 共收集 ${all.size} 个商品 URL → ${OUT_FILE}`)
  await browser.close()
}

main().catch(err => {
  console.error('❌ 爬取失败:', err.message)
  process.exit(1)
})
