/**
 * 爬取 wonaconcept.com Adagio Set 礼服商品（测试数据）
 * 数据来源：https://wonaconcept.com/adagio-set/
 * 运行：node scripts/crawl-wona-adagio.cjs
 */
const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TARGET_URL = 'https://wonaconcept.com/adagio-set/'
const OUT_FILE = path.join(__dirname, 'wona-adagio.json')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 })
  await wait(3000)

  // 滚动页面触发懒加载
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 200))
    }
    window.scrollTo(0, 0)
  })
  await wait(2000)

  const data = await page.evaluate(() => {
    const meta = (prop) => {
      const el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)
      return el ? el.getAttribute('content') : ''
    }
    // 页面内所有图片（优先懒加载属性）
    const imgSet = new Set()
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || img.src
      if (src && !src.startsWith('data:') && !src.includes('1x1')) imgSet.add(src.split('?')[0].length > 30 ? src : '')
    })
    // 结构化数据
    let jsonLd = []
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try { jsonLd.push(JSON.parse(s.textContent)) } catch {}
    })
    return {
      title: document.title,
      ogTitle: meta('og:title'),
      ogDesc: meta('og:description'),
      ogPrice: meta('product:price:amount') || meta('og:price:amount'),
      ogCurrency: meta('product:price:currency') || meta('og:price:currency'),
      ogImages: Array.from(document.querySelectorAll('meta[property="og:image"]')).map(m => m.getAttribute('content')),
      images: Array.from(imgSet).filter(Boolean),
      bodyText: document.body.innerText.slice(0, 6000),
      jsonLd,
    }
  })

  // 保存原始 HTML 便于分析结构
  const html = await page.content()
  fs.writeFileSync(path.join(__dirname, 'wona-adagio.html'), html, 'utf8')
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2), 'utf8')
  console.log(`✅ 已保存 → ${OUT_FILE}`)
  console.log('title:', data.title)
  console.log('price:', data.ogPrice, data.ogCurrency)
  console.log('images:', data.images.length)

  await browser.close()
}

main().catch(err => {
  console.error('❌ 爬取失败:', err.message)
  process.exit(1)
})
