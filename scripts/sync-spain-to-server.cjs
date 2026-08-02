/**
 * 同步 Spain 场地数据到服务器数据库
 */
const mysql = require('mysql2/promise')

function toJSON(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'string') return val
  return JSON.stringify(val)
}

async function main() {
  const localPool = mysql.createPool({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile' })
  const [rows] = await localPool.execute("SELECT * FROM crawled_venues WHERE country = 'Spain' ORDER BY sort_order")
  console.log('本地Spain数据:', rows.length, '条')
  await localPool.end()

  const serverPool = mysql.createPool({ host: '47.99.138.250', port: 13306, user: 'root', password: 'caoqiangiot@123', database: 'verra_voile' })

  let inserted = 0, updated = 0
  for (const row of rows) {
    const params = [
      row.slug, row.name, row.name_cn, row.country, row.country_cn,
      row.source_url, row.tagline, row.description,
      toJSON(row.features), toJSON(row.venue_types), toJSON(row.towns),
      toJSON(row.images), toJSON(row.budget_ranges), toJSON(row.guest_capacities),
      toJSON(row.faq), row.cover_image, row.rating, row.review_count,
      row.location, row.sort_order
    ]

    const [existing] = await serverPool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [row.slug])
    if (existing.length > 0) {
      await serverPool.execute(
        'UPDATE crawled_venues SET name=?, name_cn=?, country=?, country_cn=?, source_url=?, tagline=?, description=?, features=?, venue_types=?, towns=?, images=?, budget_ranges=?, guest_capacities=?, faq=?, cover_image=?, rating=?, review_count=?, location=?, sort_order=? WHERE slug=?',
        [...params.slice(1), row.slug]
      )
      updated++
    } else {
      await serverPool.execute(
        'INSERT INTO crawled_venues (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, faq, cover_image, rating, review_count, location, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        params
      )
      inserted++
    }
  }

  console.log('服务器同步完成: 新增', inserted, '条, 更新', updated, '条')
  const [cnt] = await serverPool.execute("SELECT COUNT(*) as cnt FROM crawled_venues WHERE country = 'Spain'")
  console.log('服务器Spain总数:', cnt[0].cnt)
  await serverPool.end()
  console.log('✅ 完成!')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
