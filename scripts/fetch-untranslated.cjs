/**
 * 获取未翻译的葡萄牙场地数据
 */
const mysql = require('mysql2/promise')

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 13306,
  user: 'root',
  password: 'caoqiangiot@123',
  database: 'verra_voile',
}

;(async () => {
  const pool = await mysql.createPool(DB_CONFIG)
  const [venues] = await pool.execute(
    'SELECT id, slug, name, tagline, description, features, venue_types, towns FROM crawled_destinations WHERE country=? ORDER BY sort_order',
    ['Portugal']
  )
  
  const unTranslated = venues.filter(v => !/[\u4e00-\u9fa5]/.test(v.description || ''))
  
  console.log(JSON.stringify({
    total: venues.length,
    translated: venues.length - unTranslated.length,
    unTranslated: unTranslated.length,
    venues: unTranslated.map(v => ({
      id: v.id,
      slug: v.slug,
      name: v.name,
      tagline: v.tagline,
      description: v.description,
    }))
  }, null, 2))
  
  await pool.end()
})()
