/**
 * 爬取 Amarante London 所有商品图片
 * 1. 逐个商品页抓取主图 URL
 * 2. 下载图片到 uploads/crawled/amarante-products/
 * 3. 输出商品数据 JSON（含本地图片路径）
 */
const https = require('https')
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.join(__dirname, '..', 'uploads', 'crawled', 'amarante-products')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// 商品列表
const freshFlowers = [
  { slug: 'soleil', name: 'Soleil', nameCn: '日光', price: 105, priceFrom: true, category: '鲜花花束', url: '/products/soleil-sunflower-bouquet' },
  { slug: 'riviera', name: 'Riviera', nameCn: '里维埃拉', price: 125, priceFrom: true, category: '鲜花花束', url: '/products/riviera-hydrangea-bouquet' },
  { slug: 'electra', name: 'Electra', nameCn: '艾蕾克特拉', price: 95, priceFrom: true, category: '鲜花花束', url: '/products/electra-coral-rose-bouquet' },
  { slug: 'sienna', name: 'Sienna', nameCn: '锡耶纳', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/sienna-rose-bouquet' },
  { slug: 'eden', name: 'Eden', nameCn: '伊甸', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/eden-fresh-flower-bouquet' },
  { slug: 'beloved', name: 'Beloved', nameCn: '挚爱', price: 115, priceFrom: true, category: '鲜花花束', url: '/products/beloved-fresh-flower-bouquet' },
  { slug: 'rosa', name: 'Rosa', nameCn: '罗莎', price: 130, priceFrom: true, category: '鲜花花束', url: '/products/rosa-fresh-flower-bouquet' },
  { slug: 'selene', name: 'Selene', nameCn: '塞勒涅', price: 95, priceFrom: true, category: '鲜花花束', url: '/products/selene-fresh-flower-bouquet' },
  { slug: 'aurora', name: 'Aurora', nameCn: '极光', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/aurora-fresh-flower-bouquet' },
  { slug: 'hera', name: 'Hera', nameCn: '赫拉', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/hera-fresh-flower-bouquet' },
  { slug: 'velvet-initial', name: 'Velvet with Initial', nameCn: '丝绒字母玫瑰', price: 225, priceFrom: true, category: '鲜花花束', url: '/products/initial-rose-bouquet' },
  { slug: 'velvet-rose', name: 'Velvet Rose', nameCn: '丝绒玫瑰', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/fresh-rose-bouquet' },
  { slug: 'velvet-mixed', name: 'Velvet Rose - Mixed', nameCn: '丝绒玫瑰混合', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/mixed-red-white-pink-rose-bouquet' },
  { slug: 'velvet-pastels', name: 'Velvet Rose - Pastels', nameCn: '丝绒玫瑰粉彩', price: 90, priceFrom: true, category: '鲜花花束', url: '/products/velvet-fresh-rose-bouquet-mixed-pastels' },
  { slug: 'celeste', name: 'Celeste Pink Lily', nameCn: '天蓝粉百合', price: 65, priceFrom: true, category: '鲜花花束', url: '/products/celeste-pink-lily-bouquet' },
  { slug: 'florist-choice', name: 'Florist Choice', nameCn: '花艺师精选', price: 55, priceFrom: true, category: '鲜花花束', url: '/products/the-florist-choice-bouquet' },
]

const infinityRoses = [
  { slug: 'ir-deluxe-black-sq', name: '80-100 Roses Deluxe Square Black', nameCn: '80-100支豪华黑色方盒', price: 625, url: '/products/100-roses-deluxe-square-black-suede-rose-box' },
  { slug: 'ir-super-deluxe-black-rd', name: '85-100 Roses Super Deluxe Round Black', nameCn: '85-100支超级豪华黑色圆盒', price: 825, url: '/products/85-100-roses-super-deluxe-round-black-suede-rose-box' },
  { slug: 'ir-xl-black-rd', name: 'Extra Large Round Black', nameCn: '特大黑色圆盒', price: 295, url: '/products/extra-large-round-box-black-suede' },
  { slug: 'ir-large-white-rd', name: 'Large White Round Matte', nameCn: '大号白色圆盒', price: 195, url: '/products/large-round-collection-1' },
  { slug: 'ir-large-grey-rd', name: 'Large Round Grey Suede', nameCn: '大号灰色圆盒', price: 225, url: '/products/large-round-box-grey-suede' },
  { slug: 'ir-medium-white-sq', name: 'Medium White Square Matte', nameCn: '中号白色方盒', price: 95, url: '/products/copy-of-small-square-collection' },
  { slug: 'ir-ultimate-deluxe-black', name: '140 Roses Ultimate Deluxe Black', nameCn: '140支至臻豪华黑色盒', price: 1295, url: '/products/ultimate-deluxe-rectangular-black-suede-rose-box' },
  { slug: 'ir-ultimate-deluxe-white', name: '140 Roses Elegant White', nameCn: '140支优雅白色盒', price: 1295, url: '/products/ultimate-deluxe-rectangular-white-matte-rose-box' },
  { slug: 'ir-super-deluxe-black-sq2', name: '120-150 Roses Super Deluxe Square Black', nameCn: '120-150支超级豪华黑色方盒', price: 1095, url: '/products/130-150-roses-super-deluxe-square-black-suede-rose-box' },
  { slug: 'ir-super-deluxe-grey-sq', name: '120-150 Roses Super Deluxe Square Grey', nameCn: '120-150支超级豪华灰色方盒', price: 1095, url: '/products/130-150-roses-super-deluxe-square-grey-suede-rose-box' },
  { slug: 'ir-deluxe-grey-sq', name: '80-100 Roses Deluxe Square Grey', nameCn: '80-100支豪华灰色方盒', price: 625, url: '/products/deluxe-square-grey-suede-rose-box' },
  { slug: 'ir-super-deluxe-grey-rd', name: '85-100 Roses Super Deluxe Round Grey', nameCn: '85-100支超级豪华灰色圆盒', price: 825, url: '/products/85-100-roses-super-deluxe-round-grey-suede-rose-box' },
  { slug: 'ir-deluxe-black-rd', name: '60-70 Roses Deluxe Round Black', nameCn: '60-70支豪华黑色圆盒', price: 495, url: '/products/black-round-suede-hatbox-deluxe' },
  { slug: 'ir-deluxe-grey-rd', name: '60-70 Roses Deluxe Round Grey', nameCn: '60-70支豪华灰色圆盒', price: 495, url: '/products/grey-round-suede-hatbox-deluxe' },
  { slug: 'ir-xl-black-sq', name: 'Extra Large Black Square', nameCn: '特大黑色方盒', price: 325, url: '/products/black-extra-large-square-suede' },
  { slug: 'ir-xl-grey-sq', name: 'Extra Large Grey Square', nameCn: '特大灰色方盒', price: 325, url: '/products/grey-extra-large-square-suede' },
  { slug: 'ir-large-black-sq', name: 'Large Black Square Suede', nameCn: '大号黑色方盒', price: 250, url: '/products/infinity-roses-black-large-square-suede' },
  { slug: 'ir-large-black-rd', name: 'Large Black Round Suede', nameCn: '大号黑色圆盒', price: 225, url: '/products/large-round-box-black-suede' },
  { slug: 'ir-large-pink-rd', name: 'Large Pink Round Suede', nameCn: '大号粉色圆盒', price: 225, url: '/products/large-round-box-pink-suede' },
  { slug: 'ir-large-beige-rd', name: 'Large Beige Round Suede', nameCn: '大号米色圆盒', price: 225, url: '/products/large-beige-round-suede-rose-box' },
  { slug: 'ir-medium-black-sq', name: 'Medium Black Square Matte', nameCn: '中号黑色方盒', price: 95, url: '/products/medium-square-black-box' },
  { slug: 'ir-medium-black-rd', name: 'Medium Round Black Suede', nameCn: '中号黑色圆盒', price: 150, url: '/products/medium-round-box-black-suede' },
  { slug: 'ir-medium-white-rd', name: 'Medium White Round Matte', nameCn: '中号白色圆盒', price: 125, url: '/products/infinity-roses-medium-round-white-hatbox' },
  { slug: 'ir-medium-grey-rd', name: 'Medium Round Grey Suede', nameCn: '中号灰色圆盒', price: 150, url: '/products/medium-round-box-grey-suede' },
  { slug: 'ir-medium-blue-rd', name: 'Medium Round Royal Blue', nameCn: '中号宝蓝色圆盒', price: 150, url: '/products/medium-round-infinity-roses-royal-blue' },
  { slug: 'ir-medium-pink-rd', name: 'Medium Pink Round Suede', nameCn: '中号粉色圆盒', price: 150, url: '/products/medium-round-box-pink-suede' },
  { slug: 'ir-medium-beige', name: 'Medium Beige Suede', nameCn: '中号米色盒', price: 150, url: '/products/medium-beige-suede-rose-box' },
  { slug: 'ir-small-black-sq', name: 'Small Black Square Matte', nameCn: '小号黑色方盒', price: 75, url: '/products/copy-of-single-collection' },
  { slug: 'ir-small-white-sq', name: 'Small White Square Matte', nameCn: '小号白色方盒', price: 75, url: '/products/small-square-white-box' },
  { slug: 'ir-small-black-rd', name: 'Small Black Round Matte', nameCn: '小号黑色圆盒', price: 75, url: '/products/small-round-black-rose-box' },
  { slug: 'ir-small-white-rd', name: 'Small White Round Matte', nameCn: '小号白色圆盒', price: 75, url: '/products/small-round-white-rose-box' },
  { slug: 'ir-small-pink-rd', name: 'Small Pink Round Suede', nameCn: '小号粉色圆盒', price: 90, url: '/products/small-pink-round-suede-rose-box' },
  { slug: 'ir-small-beige-rd', name: 'Small Beige Round Suede', nameCn: '小号米色圆盒', price: 90, url: '/products/small-beige-round-suede-rose-box' },
  { slug: 'ir-single', name: 'Single Infinity Rose', nameCn: '单支永生玫瑰', price: 45, url: '/products/single-long-stem-infinity-rose' },
]

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject)
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data }))
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('//') ? 'https:' + url : url
    const req = https.get(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, filepath).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${fullUrl}`))
      }
      const ws = fs.createWriteStream(filepath)
      res.pipe(ws)
      ws.on('finish', () => { ws.close(); resolve() })
      ws.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('download timeout')) })
  })
}

// 从 Shopify 商品页 HTML 提取主图 URL
function extractProductImage(html, productSlug) {
  // 方法1: 从 og:image meta 标签提取
  const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
  if (ogMatch) return ogMatch[1].replace('http://', 'https://')

  // 方法2: 从 product media JSON 提取
  const mediaMatch = html.match(/"featured_media":\s*\{\s*"src":\s*"([^"]+)"/i)
  if (mediaMatch) return mediaMatch[1].replace('\\/', '/')

  // 方法3: 从 Shopify product JSON 提取
  const jsonMatch = html.match(/"image":\s*"([^"]+cdn\/shop[^"]+)"/i)
  if (jsonMatch) return jsonMatch[1].replace('\\/', '/')

  // 方法4: 从任意 cdn/shop 图片提取
  const cdnMatch = html.match(/(https?:\/\/www\.amarantelondon\.com\/cdn\/shop\/files\/[^"'\s?]+)/i)
  if (cdnMatch) return cdnMatch[1]

  return null
}

async function crawlProduct(product, index, total) {
  const url = `https://www.amarantelondon.com${product.url}`
  try {
    const { data: html } = await fetch(url)
    const imageUrl = extractProductImage(html, product.slug)
    console.log(`[${index + 1}/${total}] ${product.nameCn} → ${imageUrl ? '✓ 找到图片' : '✗ 未找到'}`)
    return { ...product, imageUrl }
  } catch (err) {
    console.log(`[${index + 1}/${total}] ${product.nameCn} → ✗ 错误: ${err.message}`)
    return { ...product, imageUrl: null }
  }
}

async function main() {
  const allProducts = [
    ...freshFlowers.map(p => ({ ...p, type: 'fresh' })),
    ...infinityRoses.map(p => ({ ...p, type: 'infinity' })),
  ]
  const total = allProducts.length

  console.log(`\n🌸 开始爬取 ${total} 个商品页面...\n`)

  // 逐个爬取商品页面（避免太快被限流）
  const results = []
  for (let i = 0; i < total; i++) {
    const result = await crawlProduct(allProducts[i], i, total)
    results.push(result)
    // 每次请求间隔 300ms
    if (i < total - 1) await new Promise(r => setTimeout(r, 300))
  }

  // 统计
  const withImage = results.filter(r => r.imageUrl)
  const withoutImage = results.filter(r => !r.imageUrl)
  console.log(`\n📊 爬取完成: ${withImage.length}/${total} 找到图片`)
  if (withoutImage.length > 0) {
    console.log(`   未找到图片的商品: ${withoutImage.map(p => p.nameCn).join(', ')}`)
  }

  // 下载图片到本地
  console.log(`\n📥 开始下载 ${withImage.length} 张图片...\n`)
  let downloaded = 0
  let failed = 0

  for (const product of results) {
    if (!product.imageUrl) continue
    const ext = product.imageUrl.includes('.webp') ? '.webp' : '.jpg'
    const filename = `${product.slug}${ext}`
    const filepath = path.join(OUTPUT_DIR, filename)

    // 跳过已存在的文件
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
      console.log(`  ⏭ ${product.nameCn} - 已存在`)
      product.localImage = `/uploads/crawled/amarante-products/${filename}`
      downloaded++
      continue
    }

    try {
      await downloadFile(product.imageUrl, filepath)
      const size = (fs.statSync(filepath).size / 1024).toFixed(1)
      console.log(`  ✓ ${product.nameCn} (${size}KB)`)
      product.localImage = `/uploads/crawled/amarante-products/${filename}`
      downloaded++
    } catch (err) {
      console.log(`  ✗ ${product.nameCn} - ${err.message}`)
      product.localImage = null
      failed++
    }
  }

  console.log(`\n📊 下载完成: ${downloaded} 成功, ${failed} 失败`)

  // 输出最终数据 JSON
  const freshOutput = results.filter(r => r.type === 'fresh').map(p => ({
    slug: p.slug, name: p.name, name_cn: p.nameCn,
    price: p.price, price_from: p.priceFrom, category: p.category,
    image: p.localImage || '',
  }))
  const infinityOutput = results.filter(r => r.type === 'infinity').map(p => ({
    slug: p.slug, name: p.name, name_cn: p.nameCn,
    price: p.price,
    image: p.localImage || '',
  }))

  const outputData = { freshFlowerProducts: freshOutput, infinityRoseProducts: infinityOutput }
  const jsonPath = path.join(OUTPUT_DIR, 'products-data.json')
  fs.writeFileSync(jsonPath, JSON.stringify(outputData, null, 2))
  console.log(`\n💾 数据已保存到: ${jsonPath}`)
  console.log(`   鲜花: ${freshOutput.length} 个, 永生玫瑰: ${infinityOutput.length} 个`)
}

main().catch(console.error)
