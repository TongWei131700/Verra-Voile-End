/**
 * 更新 amarante-london 的商品数据（添加图片字段）
 * 读取 crawl-amarante-products 生成的 products-data.json
 * 更新 crawled_florists 表的 fresh_flower_products 和 infinity_rose_products 字段
 */
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 读取爬取的商品数据
  const jsonPath = path.join(__dirname, '..', 'uploads', 'crawled', 'amarante-products', 'products-data.json')
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  console.log(`📦 读取数据: ${data.freshFlowerProducts.length} 鲜花, ${data.infinityRoseProducts.length} 永生玫瑰`)

  // 转为数据库 JSON 格式
  const freshProducts = data.freshFlowerProducts.map(p => ({
    slug: p.slug,
    name: p.name,
    name_cn: p.name_cn,
    price: p.price,
    price_from: p.price_from,
    category: p.category,
    image: p.image,
  }))

  const infinityProducts = data.infinityRoseProducts.map(p => ({
    slug: p.slug,
    name: p.name,
    name_cn: p.name_cn,
    price: p.price,
    image: p.image,
  }))

  // 更新数据库
  const [result] = await conn.execute(
    `UPDATE crawled_florists SET fresh_flower_products = ?, infinity_rose_products = ? WHERE slug = 'amarante-london'`,
    [JSON.stringify(freshProducts), JSON.stringify(infinityProducts)]
  )

  console.log(`✅ 更新完成: affectedRows = ${result.affectedRows}`)

  // 验证
  const [rows] = await conn.execute(
    `SELECT fresh_flower_products, infinity_rose_products FROM crawled_florists WHERE slug = 'amarante-london'`
  )
  if (rows.length > 0) {
    const fresh = typeof rows[0].fresh_flower_products === 'string'
      ? JSON.parse(rows[0].fresh_flower_products) : rows[0].fresh_flower_products
    const infinity = typeof rows[0].infinity_rose_products === 'string'
      ? JSON.parse(rows[0].infinity_rose_products) : rows[0].infinity_rose_products
    console.log(`🔍 验证: 鲜花 ${fresh.length} 个 (含图片 ${fresh.filter(p => p.image).length})`)
    console.log(`🔍 验证: 永生玫瑰 ${infinity.length} 个 (含图片 ${infinity.filter(p => p.image).length})`)
  }

  await conn.end()
  console.log('\n🎉 数据库更新完成!')
}

main().catch(err => { console.error(err); process.exit(1) })
