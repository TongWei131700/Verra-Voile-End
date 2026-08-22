/**
 * 为 products_wine 表添加 tags 分类标签字段
 * tags 结构: { region: "产地", type: "酒类型", vintage: "年份" }
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

const TAGS_DATA = {
  'valpolicella-allegrini-2025': {
    region: '意大利',
    type: '红葡萄酒',
    vintage: '2025'
  },
  'soave-classico-la-rocca-pieropan-2023': {
    region: '意大利',
    type: '白葡萄酒',
    vintage: '2023'
  }
}

async function main() {
  const pool = mysql.createPool(process.env.DB_URL || process.env.DATABASE_URL)

  // 检查并添加 tags 列
  const [cols] = await pool.execute("SHOW COLUMNS FROM products_wine LIKE 'tags'")
  if (cols.length === 0) {
    console.log('添加 tags 列...')
    await pool.execute('ALTER TABLE products_wine ADD COLUMN tags JSON DEFAULT NULL AFTER overview')
    console.log('tags 列已添加')
  } else {
    console.log('tags 列已存在')
  }

  // 更新每款酒的 tags
  for (const [productId, tags] of Object.entries(TAGS_DATA)) {
    const [rows] = await pool.execute(
      'SELECT product_id FROM products_wine WHERE product_id = ?',
      [productId]
    )
    if (rows.length === 0) {
      console.log(`跳过 ${productId}（不存在）`)
      continue
    }
    await pool.execute(
      'UPDATE products_wine SET tags = ? WHERE product_id = ?',
      [JSON.stringify(tags), productId]
    )
    console.log(`已更新 ${productId}: ${JSON.stringify(tags)}`)
  }

  // 验证
  const [result] = await pool.execute('SELECT product_id, tags FROM products_wine')
  console.log('\n当前 tags 数据:')
  result.forEach(r => console.log(`  ${r.product_id}: ${r.tags}`))

  await pool.end()
  console.log('\n完成')
}

main().catch(err => { console.error(err); process.exit(1) })
