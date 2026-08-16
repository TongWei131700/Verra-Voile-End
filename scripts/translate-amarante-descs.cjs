/**
 * 翻译 Amarante London 所有商品描述为中文
 * 使用 Google Translate gtx 端点
 */
const mysql = require('mysql2/promise')

async function translateText(text, retries = 3) {
  if (!text || !text.trim()) return ''
  try {
    const encoded = encodeURIComponent(text.slice(0, 1000))
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`
    const res = await fetch(url)
    const data = await res.json()
    let result = ''
    if (data && data[0]) {
      for (const segment of data[0]) {
        if (segment[0]) result += segment[0]
      }
    }
    return result || text
  } catch (e) {
    if (retries > 0) {
      const wait = (4 - retries) * 2000 + 1000
      await new Promise(r => setTimeout(r, wait))
      return translateText(text, retries - 1)
    }
    console.log(`    ⚠ 翻译失败: ${e.message}`)
    return text
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  const [rows] = await conn.execute(
    `SELECT fresh_flower_products, infinity_rose_products FROM crawled_florists WHERE slug = 'amarante-london'`
  )
  if (rows.length === 0) { console.log('❌ 未找到数据'); await conn.end(); return }

  let fresh = rows[0].fresh_flower_products
  let infinity = rows[0].infinity_rose_products
  if (typeof fresh === 'string') fresh = JSON.parse(fresh)
  if (typeof infinity === 'string') infinity = JSON.parse(infinity)

  const allProducts = [
    ...fresh.map((p, i) => ({ ...p, _type: 'fresh', _idx: i })),
    ...infinity.map((p, i) => ({ ...p, _type: 'infinity', _idx: i })),
  ]
  const needTranslate = allProducts.filter(p => p.desc && !p.desc_cn)
  console.log(`\n🌐 开始翻译 ${needTranslate.length} 个商品描述...\n`)

  for (let i = 0; i < needTranslate.length; i++) {
    const p = needTranslate[i]
    try {
      const cn = await translateText(p.desc)
      p.desc_cn = cn
      // 同步回原数组
      if (p._type === 'fresh') fresh[p._idx].desc_cn = cn
      else infinity[p._idx].desc_cn = cn
      const preview = cn.substring(0, 40) + '...'
      console.log(`[${i + 1}/${needTranslate.length}] ${p.name_cn} → ${preview}`)
    } catch (err) {
      console.log(`[${i + 1}/${needTranslate.length}] ${p.name_cn} → ✗ ${err.message}`)
    }
    if (i < needTranslate.length - 1) await new Promise(r => setTimeout(r, 200))
  }

  // 更新数据库
  await conn.execute(
    `UPDATE crawled_florists SET fresh_flower_products = ?, infinity_rose_products = ? WHERE slug = 'amarante-london'`,
    [JSON.stringify(fresh), JSON.stringify(infinity)]
  )

  const freshCn = fresh.filter(p => p.desc_cn).length
  const infinityCn = infinity.filter(p => p.desc_cn).length
  console.log(`\n✅ 翻译完成:`)
  console.log(`   鲜花: ${fresh.length} 个 (${freshCn} 含中文描述)`)
  console.log(`   永生玫瑰: ${infinity.length} 个 (${infinityCn} 含中文描述)`)

  await conn.end()
}

main().catch(err => { console.error(err); process.exit(1) })
