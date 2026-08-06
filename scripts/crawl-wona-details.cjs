/**
 * 批量爬取 wonaconcept.com 商品详情页（测试数据）
 * 输入：scripts/wona-dress-list.json（URL 列表）
 * 输出：scripts/wona-dress-details.json
 * 运行：node scripts/crawl-wona-details.cjs  （支持断点续爬，已成功的 URL 自动跳过）
 */
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const LIST_FILE = path.join(__dirname, 'wona-dress-list.json')
const OUT_FILE = path.join(__dirname, 'wona-dress-details.json')
const CONCURRENCY = 5
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (e) {
      if (i === retries - 1) throw e
      await wait(1500 * (i + 1))
    }
  }
}

function parseProduct(html, url) {
  const $ = cheerio.load(html)

  // ld+json Product 结构化数据
  let product = null, breadcrumb = null
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html())
      if (d['@type'] === 'Product') product = d
      if (d['@type'] === 'BreadcrumbList') breadcrumb = d
    } catch {}
  })
  if (!product) return null

  const images = (product.image || []).filter(i => /\.(jpe?g|png|webp)$/i.test(i))
  const video = (product.image || []).find(i => /\.(webm|mp4)$/i.test(i)) || ''

  // 系列/产品线：面包屑倒数第二层（如 Maison Blanche）
  let line = ''
  if (breadcrumb && breadcrumb.itemListElement) {
    const items = breadcrumb.itemListElement.map(i => i.name).filter(Boolean)
    line = items.length >= 2 ? items[items.length - 2] : ''
  }

  // 页面正文描述（比 ld+json 的规格串更完整）
  let desc = ''
  const descBlock = $('.product-description, [class*="description"]').first()
  if (descBlock.length) {
    desc = descBlock.text().replace(/PRODUCT DESCRIPTION/i, '').trim()
  }
  if (!desc) desc = $('meta[property="og:description"]').attr('content') || product.description || ''

  return {
    slug: url.replace(/^https:\/\/wonaconcept\.com\/|\/$/g, ''),
    name: product.name || '',
    sku: product.sku || '',
    line,
    specs: product.description || '', // 形如 ". Silhouette: A-line. Style: Modern. ..."
    desc,
    images,
    video,
    url,
    source: 'wonaconcept',
    test: true,
  }
}

async function main() {
  const urls = JSON.parse(fs.readFileSync(LIST_FILE, 'utf8'))
  const done = fs.existsSync(OUT_FILE) ? JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) : []
  const doneSet = new Set(done.map(p => p.url))
  const failed = []

  console.log(`✓ 共 ${urls.length} 个 URL，已完成 ${doneSet.size} 个，待爬 ${urls.length - doneSet.size} 个`)

  let idx = 0
  let count = done.length

  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++]
      if (doneSet.has(url)) continue
      try {
        const html = await fetchWithRetry(url)
        const p = parseProduct(html, url)
        if (p) {
          done.push(p)
          doneSet.add(url)
          count++
          if (count % 20 === 0) {
            fs.writeFileSync(OUT_FILE, JSON.stringify(done, null, 2), 'utf8')
            console.log(`  进度 ${count}/${urls.length}`)
          }
        } else {
          failed.push(url)
          console.warn(`  ⚠ 无 Product 数据: ${url}`)
        }
      } catch (e) {
        failed.push(url)
        console.warn(`  ⚠ 失败: ${url} (${e.message})`)
      }
      await wait(150) // 限速，避免给目标站点造成压力
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  fs.writeFileSync(OUT_FILE, JSON.stringify(done, null, 2), 'utf8')
  console.log(`✅ 共 ${done.length} 个商品详情 → ${OUT_FILE}`)
  if (failed.length) {
    console.log(`⚠ 失败 ${failed.length} 个：`)
    failed.forEach(f => console.log('  -', f))
    fs.writeFileSync(path.join(__dirname, 'wona-dress-failed.json'), JSON.stringify(failed, null, 2), 'utf8')
  }
}

main().catch(err => {
  console.error('❌ 爬取失败:', err.message)
  process.exit(1)
})
