require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  const countryMap = {
    '英国': 'uk',
    '法国': 'france',
    '西班牙': 'spain',
    '希腊': 'greece',
    '葡萄牙': 'portugal',
    '意大利': 'italy',
    '测试英国': 'test_uk'
  }

  for (const [countryCn, suffix] of Object.entries(countryMap)) {
    const vt = `cv_${suffix}`
    const dt = `cd_${suffix}`

    // 创建表（同结构）
    await pool.execute(`CREATE TABLE IF NOT EXISTS \`${vt}\` LIKE crawled_venues`)
    await pool.execute(`CREATE TABLE IF NOT EXISTS \`${dt}\` LIKE crawled_destinations`)

    // 迁移 crawled_venues
    const [venues] = await pool.execute('SELECT * FROM crawled_venues WHERE country_cn = ?', [countryCn])
    if (venues.length > 0) {
      const [cnt] = await pool.execute(`SELECT COUNT(*) as c FROM \`${vt}\``)
      if (cnt[0].c === 0) {
        for (const v of venues) {
          await pool.execute(
            `INSERT INTO \`${vt}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,rating,review_count,location,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [v.slug,v.name,v.name_cn,v.country,v.country_cn,v.source_url,v.tagline,v.tagline_cn,v.description,v.description_cn,v.features,v.venue_types,v.towns,v.images,v.budget_ranges,v.guest_capacities,v.faq,v.cover_image,v.rating,v.review_count,v.location,v.sort_order]
          )
        }
      }
      console.log(`✅ ${vt}: ${venues.length} 条 (${countryCn})`)
    } else {
      console.log(`⏭️ ${vt}: 无数据 (${countryCn})`)
    }

    // 迁移 crawled_destinations
    const [dests] = await pool.execute('SELECT * FROM crawled_destinations WHERE country_cn = ?', [countryCn])
    if (dests.length > 0) {
      const [cnt] = await pool.execute(`SELECT COUNT(*) as c FROM \`${dt}\``)
      if (cnt[0].c === 0) {
        for (const d of dests) {
          await pool.execute(
            `INSERT INTO \`${dt}\` (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [d.slug,d.name,d.name_cn,d.country,d.country_cn,d.source_url,d.tagline,d.tagline_cn,d.description,d.description_cn,d.features,d.venue_types,d.towns,d.images,d.budget_ranges,d.guest_capacities,d.faq,d.cover_image,d.sort_order]
          )
        }
      }
      console.log(`✅ ${dt}: ${dests.length} 条 (${countryCn})`)
    } else {
      console.log(`⏭️ ${dt}: 无数据 (${countryCn})`)
    }
  }

  // 验证
  const [t1] = await pool.execute("SHOW TABLES LIKE 'cv\\_%'")
  console.log('\ncv_ 表:', t1.map(t => Object.values(t)[0]).join(', '))
  const [t2] = await pool.execute("SHOW TABLES LIKE 'cd\\_%'")
  console.log('cd_ 表:', t2.map(t => Object.values(t)[0]).join(', '))

  // 验证各表数据量
  for (const suffix of Object.values(countryMap)) {
    const [r1] = await pool.execute(`SELECT COUNT(*) as c FROM \`cv_${suffix}\``)
    const [r2] = await pool.execute(`SELECT COUNT(*) as c FROM \`cd_${suffix}\``)
    console.log(`  ${suffix}: cv=${r1[0].c}, cd=${r2[0].c}`)
  }

  await pool.end()
  console.log('\n🎉 分表迁移完成')
}

main().catch(e => console.error(e.message))
