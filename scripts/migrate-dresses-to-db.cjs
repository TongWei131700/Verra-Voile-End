/**
 * 迁移脚本：将 wonaDressProducts.ts 中的静态礼服数据导入 crawled_dresses 数据库表
 * 运行方式：node scripts/migrate-dresses-to-db.cjs
 */
require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

const TS_FILE = path.resolve(__dirname, '../../Verra-Voile/src/data/wonaDressProducts.ts')

async function main() {
  const content = fs.readFileSync(TS_FILE, 'utf-8')

  // 提取每个商品块：以 slug: 'xxx' 为标识
  const products = []
  // 按 { slug: 分割
  const blocks = content.split(/\{\s*\n\s*slug:\s*'/)
  blocks.shift() // 去掉第一个（数组声明部分）

  for (const block of blocks) {
    try {
      const slug = block.match(/^([^']+)'/)[1]
      const name = block.match(/name:\s*'([^']+)'/)?.[1] || ''
      const nameEn = block.match(/nameEn:\s*'([^']+)'/)?.[1] || ''
      const category = block.match(/category:\s*'([^']+)'/)?.[1] || ''
      const categoryCn = block.match(/categoryCn:\s*'([^']+)'/)?.[1] || ''
      const tagline = block.match(/tagline:\s*'([^']+)'/)?.[1] || ''

      // desc 可能包含转义引号，用更安全的方式提取
      const descMatch = block.match(/desc:\s*'((?:[^'\\]|\\.)*)'/s)
      const desc = descMatch ? descMatch[1].replace(/\\'/g, "'") : ''

      // highlights 数组
      const hlMatch = block.match(/highlights:\s*\[([\s\S]*?)\]/)
      let highlights = []
      if (hlMatch) {
        highlights = [...hlMatch[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"))
      }

      // cover
      const cover = block.match(/cover:\s*'([^']+)'/)?.[1] || ''

      // images 数组
      const imgMatch = block.match(/images:\s*\[([\s\S]*?)\]/)
      let images = []
      if (imgMatch) {
        images = [...imgMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1])
      }

      // video - 可能是字符串或 undefined
      const videoMatch = block.match(/video:\s*(?:'([^']+)'|undefined)/)
      const video = videoMatch && videoMatch[1] ? videoMatch[1] : ''

      // price
      const price = parseInt(block.match(/price:\s*(\d+)/)?.[1] || '0') || null

      // source
      const sourceName = block.match(/source:\s*\{\s*name:\s*'([^']+)'/)?.[1] || ''
      const sourceUrl = block.match(/url:\s*'([^']+)'/)?.[1] || ''

      products.push({
        slug, name, name_en: nameEn, category, category_cn: categoryCn,
        tagline, description: desc, highlights, cover_image: cover,
        images, video_url: video, source_name: sourceName,
        source_url: sourceUrl, price,
      })
    } catch (e) {
      console.error('解析失败:', e.message, block.substring(0, 80))
    }
  }

  console.log(`解析到 ${products.length} 个礼服商品`)

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 确保表存在
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS crawled_dresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL,
      name VARCHAR(200) NOT NULL,
      name_en VARCHAR(200) DEFAULT '',
      category VARCHAR(100) DEFAULT '',
      category_cn VARCHAR(100) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '',
      description TEXT,
      highlights JSON,
      cover_image VARCHAR(500) DEFAULT '',
      images JSON,
      video_url VARCHAR(500) DEFAULT '',
      source_name VARCHAR(200) DEFAULT '',
      source_url VARCHAR(500) DEFAULT '',
      price INT DEFAULT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取礼服商品表'
  `)

  let inserted = 0
  let updated = 0

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const [result] = await conn.execute(
      `INSERT INTO crawled_dresses
        (slug, name, name_en, category, category_cn, tagline, description, highlights, cover_image, images, video_url, source_name, source_url, price, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name=VALUES(name), name_en=VALUES(name_en), category=VALUES(category), category_cn=VALUES(category_cn),
        tagline=VALUES(tagline), description=VALUES(description), highlights=VALUES(highlights),
        cover_image=VALUES(cover_image), images=VALUES(images), video_url=VALUES(video_url),
        source_name=VALUES(source_name), source_url=VALUES(source_url), price=VALUES(price)`,
      [
        p.slug, p.name, p.name_en, p.category, p.category_cn, p.tagline,
        p.description, JSON.stringify(p.highlights), p.cover_image,
        JSON.stringify(p.images), p.video_url, p.source_name, p.source_url,
        p.price, i,
      ]
    )
    if (result.affectedRows === 1) inserted++
    else if (result.affectedRows === 2) updated++
  }

  console.log(`✓ 完成：新增 ${inserted} 条，更新 ${updated} 条`)

  // 验证
  const [countRows] = await conn.execute('SELECT COUNT(*) as total FROM crawled_dresses')
  console.log(`✓ 数据库当前共 ${countRows[0].total} 条礼服商品`)

  await conn.end()
}

main().catch(err => { console.error(err); process.exit(1) })
