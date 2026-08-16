/**
 * 爬取 Amarante London 所有商品描述并更新数据库
 */
const https = require('https')
const mysql = require('mysql2/promise')

function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve, reject)
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

// 从 HTML 提取商品描述
function extractDescription(html) {
  // 找到所有 "description":"..." 匹配项，取包含商品内容的那个
  const regex = /"description"\s*:\s*"((?:[^"\\]|\\.)*)"/g
  let match
  const candidates = []
  while ((match = regex.exec(html)) !== null) {
    candidates.push(match[1])
  }

  for (const raw of candidates) {
    // 跳过 AI 聊天助手、schema 等无关描述
    if (raw.includes('natural language query') || raw.includes('user demographics') || raw.includes('return policy')) continue
    if (raw.length < 30) continue

    let desc = raw
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\u003c/g, '<')
      .replace(/\\u003e/g, '>')
      .replace(/\\u0026amp;/g, '&')
      .replace(/\\u0026/g, '&')
    // 去除 HTML 标签
    desc = desc.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    // 清理空白
    desc = desc.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim()
    // 提取描述正文：跳过标题行和配送/尺寸信息
    const lines = desc.split('\n').filter(l => l.trim())
    const descLines = []
    for (const line of lines) {
      if (line.match(/^(Same day delivery|Same-Day Delivery|Need your flowers|Please note|Pickup available|Amarante endeavours)/i)) break
      if (line.match(/^(Bouquet Sizes|Regular:|Large:|Deluxe:|Extra Large:|Small:|Medium:)/i)) continue
      if (line.match(/^(Description|Delivery|You might also|Related products)/i)) break
      // 跳过以产品名开头的标题行（如 "The Soleil Sunflower Bouquet"）
      if (line.match(/^The\s+[A-Z]/) && line.length < 60 && descLines.length === 0) continue
      if (line.match(/^[A-Z][a-z]+\s+(Fresh|Sunflower|Rose|Lily|Infinity)/) && line.length < 50 && descLines.length === 0) continue
      descLines.push(line)
    }
    if (descLines.length > 0) {
      return descLines.join(' ').trim().substring(0, 300)
    }
  }
  return ''
}

const products = [
  { slug: 'soleil', url: '/products/soleil-sunflower-bouquet' },
  { slug: 'riviera', url: '/products/riviera-hydrangea-bouquet' },
  { slug: 'electra', url: '/products/electra-coral-rose-bouquet' },
  { slug: 'sienna', url: '/products/sienna-rose-bouquet' },
  { slug: 'eden', url: '/products/eden-fresh-flower-bouquet' },
  { slug: 'beloved', url: '/products/beloved-fresh-flower-bouquet' },
  { slug: 'rosa', url: '/products/rosa-fresh-flower-bouquet' },
  { slug: 'selene', url: '/products/selene-fresh-flower-bouquet' },
  { slug: 'aurora', url: '/products/aurora-fresh-flower-bouquet' },
  { slug: 'hera', url: '/products/hera-fresh-flower-bouquet' },
  { slug: 'velvet-initial', url: '/products/initial-rose-bouquet' },
  { slug: 'velvet-rose', url: '/products/fresh-rose-bouquet' },
  { slug: 'velvet-mixed', url: '/products/mixed-red-white-pink-rose-bouquet' },
  { slug: 'velvet-pastels', url: '/products/velvet-fresh-rose-bouquet-mixed-pastels' },
  { slug: 'celeste', url: '/products/celeste-pink-lily-bouquet' },
  { slug: 'florist-choice', url: '/products/the-florist-choice-bouquet' },
  { slug: 'ir-deluxe-black-sq', url: '/products/100-roses-deluxe-square-black-suede-rose-box' },
  { slug: 'ir-super-deluxe-black-rd', url: '/products/85-100-roses-super-deluxe-round-black-suede-rose-box' },
  { slug: 'ir-xl-black-rd', url: '/products/extra-large-round-box-black-suede' },
  { slug: 'ir-large-white-rd', url: '/products/large-round-collection-1' },
  { slug: 'ir-large-grey-rd', url: '/products/large-round-box-grey-suede' },
  { slug: 'ir-medium-white-sq', url: '/products/copy-of-small-square-collection' },
  { slug: 'ir-ultimate-deluxe-black', url: '/products/ultimate-deluxe-rectangular-black-suede-rose-box' },
  { slug: 'ir-ultimate-deluxe-white', url: '/products/ultimate-deluxe-rectangular-white-matte-rose-box' },
  { slug: 'ir-super-deluxe-black-sq2', url: '/products/130-150-roses-super-deluxe-square-black-suede-rose-box' },
  { slug: 'ir-super-deluxe-grey-sq', url: '/products/130-150-roses-super-deluxe-square-grey-suede-rose-box' },
  { slug: 'ir-deluxe-grey-sq', url: '/products/deluxe-square-grey-suede-rose-box' },
  { slug: 'ir-super-deluxe-grey-rd', url: '/products/85-100-roses-super-deluxe-round-grey-suede-rose-box' },
  { slug: 'ir-deluxe-black-rd', url: '/products/black-round-suede-hatbox-deluxe' },
  { slug: 'ir-deluxe-grey-rd', url: '/products/grey-round-suede-hatbox-deluxe' },
  { slug: 'ir-xl-black-sq', url: '/products/black-extra-large-square-suede' },
  { slug: 'ir-xl-grey-sq', url: '/products/grey-extra-large-square-suede' },
  { slug: 'ir-large-black-sq', url: '/products/infinity-roses-black-large-square-suede' },
  { slug: 'ir-large-black-rd', url: '/products/large-round-box-black-suede' },
  { slug: 'ir-large-pink-rd', url: '/products/large-round-box-pink-suede' },
  { slug: 'ir-large-beige-rd', url: '/products/large-beige-round-suede-rose-box' },
  { slug: 'ir-medium-black-sq', url: '/products/medium-square-black-box' },
  { slug: 'ir-medium-black-rd', url: '/products/medium-round-box-black-suede' },
  { slug: 'ir-medium-white-rd', url: '/products/infinity-roses-medium-round-white-hatbox' },
  { slug: 'ir-medium-grey-rd', url: '/products/medium-round-box-grey-suede' },
  { slug: 'ir-medium-blue-rd', url: '/products/medium-round-infinity-roses-royal-blue' },
  { slug: 'ir-medium-pink-rd', url: '/products/medium-round-box-pink-suede' },
  { slug: 'ir-medium-beige', url: '/products/medium-beige-suede-rose-box' },
  { slug: 'ir-small-black-sq', url: '/products/copy-of-single-collection' },
  { slug: 'ir-small-white-sq', url: '/products/small-square-white-box' },
  { slug: 'ir-small-black-rd', url: '/products/small-round-black-rose-box' },
  { slug: 'ir-small-white-rd', url: '/products/small-round-white-rose-box' },
  { slug: 'ir-small-pink-rd', url: '/products/small-pink-round-suede-rose-box' },
  { slug: 'ir-small-beige-rd', url: '/products/small-beige-round-suede-rose-box' },
  { slug: 'ir-single', url: '/products/single-long-stem-infinity-rose' },
]

async function main() {
  const total = products.length
  console.log(`\n🌸 开始爬取 ${total} 个商品描述...\n`)

  const descMap = {}
  for (let i = 0; i < total; i++) {
    const p = products[i]
    try {
      const html = await fetch(`https://www.amarantelondon.com${p.url}`)
      const desc = extractDescription(html)
      descMap[p.slug] = desc
      const preview = desc ? desc.substring(0, 50) + '...' : '(空)'
      console.log(`[${i + 1}/${total}] ${p.slug} → ${preview}`)
    } catch (err) {
      descMap[p.slug] = ''
      console.log(`[${i + 1}/${total}] ${p.slug} → ✗ ${err.message}`)
    }
    if (i < total - 1) await new Promise(r => setTimeout(r, 300))
  }

  const withDesc = Object.values(descMap).filter(d => d.length > 0)
  console.log(`\n📊 爬取完成: ${withDesc.length}/${total} 获取到描述`)

  // 连接数据库更新
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 读取当前数据
  const [rows] = await conn.execute(
    `SELECT fresh_flower_products, infinity_rose_products FROM crawled_florists WHERE slug = 'amarante-london'`
  )
  if (rows.length === 0) { console.log('❌ 未找到 amarante-london 数据'); await conn.end(); return }

  let fresh = rows[0].fresh_flower_products
  let infinity = rows[0].infinity_rose_products
  if (typeof fresh === 'string') fresh = JSON.parse(fresh)
  if (typeof infinity === 'string') infinity = JSON.parse(infinity)

  // 更新描述
  fresh.forEach(p => { if (descMap[p.slug]) p.desc = descMap[p.slug] })
  infinity.forEach(p => { if (descMap[p.slug]) p.desc = descMap[p.slug] })

  await conn.execute(
    `UPDATE crawled_florists SET fresh_flower_products = ?, infinity_rose_products = ? WHERE slug = 'amarante-london'`,
    [JSON.stringify(fresh), JSON.stringify(infinity)]
  )

  const freshWithDesc = fresh.filter(p => p.desc).length
  const infinityWithDesc = infinity.filter(p => p.desc).length
  console.log(`\n✅ 数据库更新完成:`)
  console.log(`   鲜花: ${fresh.length} 个 (${freshWithDesc} 含描述)`)
  console.log(`   永生玫瑰: ${infinity.length} 个 (${infinityWithDesc} 含描述)`)

  await conn.end()
}

main().catch(err => { console.error(err); process.exit(1) })
