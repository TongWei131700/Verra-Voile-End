/**
 * 清理花艺服务团队的 fresh_flower_products 字段
 * 并为每个服务团队生成随机婚礼花艺价格
 */
const mysql = require('mysql2/promise')
require('dotenv').config()

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  try {
    // 查询所有服务团队（type = 'service'）
    const [rows] = await pool.execute(
      "SELECT id, slug, name, name_cn, price, fresh_flower_products FROM crawled_florists WHERE type = 'service'"
    )

    console.log(`\n📋 找到 ${rows.length} 个花艺服务团队：\n`)

    // 婚礼花艺费用区间：£1,500 - £5,000
    const MIN_PRICE = 1500
    const MAX_PRICE = 5000

    for (const row of rows) {
      // 生成随机价格（取整到百位）
      const randomPrice = Math.round((Math.random() * (MAX_PRICE - MIN_PRICE) + MIN_PRICE) / 100) * 100
      
      // 检查是否有 fresh_flower_products 数据
      let hasProducts = false
      if (row.fresh_flower_products) {
        try {
          const products = typeof row.fresh_flower_products === 'string' 
            ? JSON.parse(row.fresh_flower_products) 
            : row.fresh_flower_products
          hasProducts = Array.isArray(products) && products.length > 0
        } catch {}
      }

      // 更新数据库：清空 fresh_flower_products，设置随机价格
      await pool.execute(
        'UPDATE crawled_florists SET fresh_flower_products = NULL, price = ? WHERE id = ?',
        [randomPrice, row.id]
      )

      console.log(`  ✓ ${row.name_cn || row.name} (${row.slug})`)
      console.log(`    价格: £${row.price || '无'} → £${randomPrice}`)
      console.log(`    鲜花产品: ${hasProducts ? '已清空' : '无数据'}`)
      console.log()
    }

    console.log(`✅ 完成！已更新 ${rows.length} 个服务团队的价格并清空鲜花产品数据。`)
  } catch (err) {
    console.error('❌ 错误:', err.message)
  } finally {
    await pool.end()
  }
}

main()
