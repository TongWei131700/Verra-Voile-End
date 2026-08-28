const mysql = require('mysql2/promise')
require('dotenv').config()

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const updates = [
    ['eiffel-tower', 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200&fit=crop'],
    ['louvre-museum', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&fit=crop'],
    ['provence-lavender', 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1200&fit=crop'],
    ['mont-saint-michel', 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=1200&fit=crop'],
    ['venice', 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200&fit=crop'],
    ['florence-cathedral', 'https://images.unsplash.com/photo-1543429258-f4e4837a0e3e?w=1200&fit=crop'],
    ['amalfi-coast', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1200&fit=crop'],
    ['tuscany-countryside', 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&fit=crop'],
  ]

  for (const [slug, url] of updates) {
    const [result] = await pool.execute(
      'UPDATE crawled_travel_attractions SET cover_image = ? WHERE slug = ?',
      [url, slug]
    )
    console.log(`${slug}: ${result.affectedChanges || result.changedRows || result.affectedRows} rows`)
  }

  const [rows] = await pool.execute('SELECT slug, LEFT(cover_image, 70) as img FROM crawled_travel_attractions ORDER BY sort_order')
  console.log(`\n共 ${rows.length} 条记录:`)
  rows.forEach(r => console.log(`  ${r.slug} → ${r.img}`))

  await pool.end()
}

run().catch(e => { console.error(e.message); process.exit(1) })
