/**
 * 爬取 florajet.com 生日专题页的 55 个花卉商品（测试数据）
 * 数据来源：https://www.florajet.com/occasion-5/anniversaire.html
 * 运行：node scripts/crawl-florajet.cjs
 */
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const SOURCE_URL = 'https://www.florajet.com/occasion-5/anniversaire.html'
const OUT_FILE = path.join(__dirname, 'florajet-products.json')

async function main() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  })
  const html = await res.text()
  const $ = cheerio.load(html)

  const products = []
  $('article.item-product').each((_, el) => {
    const $el = $(el)
    const id = $el.attr('data-id')
    const href = $el.attr('data-href') || ''
    const name = $el.find('meta[itemprop="name"]').attr('content') || ''
    const titleEl = $el.find('.product-title')
    const displayCategory = titleEl.find('span').first().text().replace(/-\s*$/, '').trim()
    const displayName = titleEl.clone().children('span').remove().end().text().trim()
    // 懒加载图片：优先取 data-src（首屏外的商品 src 为 1px 占位图）
    const img = $el.find('img')
    const imgSrc = img.attr('data-src') || img.attr('src') || ''
    // 300px 缩略图升级为 600px 高清图
    const image = imgSrc.replace('/produits/300/', '/produits/600/')
    const price = parseFloat($el.find('.price .value').attr('data-price') || '0')
    const delivery = $el.find('.delivery p').text().trim()

    // slug 由 URL 尾段生成
    const slugMatch = href.match(/\/([^/]+)-\d+\.html$/)
    const slug = slugMatch ? `fj-${slugMatch[1]}` : `fj-${id}`

    products.push({
      slug,
      source_id: id,
      name,                       // 法文名（大写官方名）
      display_name: displayName,  // 展示名
      display_category: displayCategory,
      image,
      price,
      delivery,
      url: `https://www.florajet.com${href}`,
      source: 'florajet',
      test: true,                 // 测试数据标识
    })
  })

  fs.writeFileSync(OUT_FILE, JSON.stringify(products, null, 2), 'utf8')
  console.log(`✅ 共爬取 ${products.length} 个商品 → ${OUT_FILE}`)
}

main().catch(err => {
  console.error('❌ 爬取失败:', err.message)
  process.exit(1)
})
