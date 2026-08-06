/**
 * 将 Nobu Catering（伦敦 Nobu Hotel Portman Square）插入酒水宴席(wine)模块
 * 数据来源: https://www.nobuhotels.com/london-portman/nobu-catering/
 * 用法: node scripts/insert-nobu-catering.cjs
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  const product = {
    product_id: 'nobu-catering',
    name: 'Nobu 定制宴会',
    name_en: 'Nobu Catering London',
    tagline: '让 Nobu 的招牌风味，成为你宴席上的高光时刻',
    description:
      'Nobu Hotel London Portman Square 将星级餐饮体验带到你的每一场活动。从坐席晚宴到鸡尾酒会的 canapés，从现场烹饪台到与主厨面对面的大师课，团队会为酒店活动、办公室、私人住宅定制专属菜单——甚至可以是你的游艇或私人飞机。\n\n' +
      '四大服务线覆盖所有宴席场景：Nobu at Home 主厨上门服务，餐具、器皿与酒水搭配全程打理；Nobu Social 为婚礼、生日派对与花园晚会提供招牌鸡尾酒与全英上门宴会；Nobu Corporate 直送办公室与会场，适配发布会与商务宴请；Nobu Ultra 则将定制菜单送上私人飞机与游艇。\n\n' +
      '从温网等顶级体育赛事到 Frieze London 艺术展，Nobu Catering 已是伦敦高端季节性活动的御用餐饮伙伴。',
    image:
      'https://www.nobuhotels.com/london-portman/content/uploads/2024/09/Nobu_Hotel_London_Portman_Square_Nobu_Terrace_Food_Cocktails_Platter_2.jpg',
    images: JSON.stringify([
      'https://www.nobuhotels.com/london-portman/content/uploads/2024/09/Nobu_Hotel_London_Portman_Square_Nobu_Terrace_Food_Cocktails_Platter_2.jpg',
      'https://www.nobuhotels.com/london-portman/content/uploads/2024/08/Woods_Nobu_credit_Lisa_Tse_6-scaled.jpg',
      'https://www.nobuhotels.com/london-portman/content/uploads/2025/01/MAXL7267_MQGm5XKr-1-scaled.jpg',
      'https://www.nobuhotels.com/london-portman/content/uploads/2024/07/nobuathome-scaled.jpg',
      'https://www.nobuhotels.com/london-portman/content/uploads/2024/08/Nobu-1-MattChungPhoto-lo-res.jpg',
      'https://www.nobuhotels.com/london-portman/content/uploads/2024/07/Nobucorporate.jpg',
    ]),
    highlights: JSON.stringify([
      '米其林星级名厨招牌料理',
      '坐席晚宴 / 鸡尾酒会 canapés',
      '现场烹饪台与主厨大师课',
      '招牌 Nobu 特调鸡尾酒',
      '住宅·办公室·游艇·私人飞机全覆盖',
      '温网、Frieze London 御用餐饮',
    ]),
    source_url: 'https://www.nobuhotels.com/london-portman/nobu-catering/',
    price: 0,
    unit: '——',
    capacity: '定制规模',
    highlight: '米其林名厨',
    sort_order: 50,
  }

  // 确保富字段存在（脚本可独立于服务启动运行）
  const richColumns = [
    { name: 'tagline', sql: "ADD COLUMN tagline VARCHAR(300) DEFAULT '' COMMENT '副标题/宣传语'" },
    { name: 'images', sql: "ADD COLUMN images JSON COMMENT '图片URL列表'" },
    { name: 'highlights', sql: "ADD COLUMN highlights JSON COMMENT '特色亮点列表'" },
    { name: 'source_url', sql: "ADD COLUMN source_url VARCHAR(500) DEFAULT '' COMMENT '数据来源URL'" },
  ]
  for (const col of richColumns) {
    const [cols] = await pool.execute(`SHOW COLUMNS FROM \`products_wine\` LIKE '${col.name}'`)
    if (cols.length === 0) {
      await pool.execute(`ALTER TABLE \`products_wine\` ${col.sql}`)
    }
  }

  const [exist] = await pool.execute(
    'SELECT id FROM `products_wine` WHERE product_id = ?',
    [product.product_id]
  )
  if (exist.length > 0) {
    // 已存在则更新全部字段
    await pool.execute(
      'UPDATE `products_wine` SET name=?, name_en=?, tagline=?, description=?, image=?, images=?, highlights=?, source_url=?, price=?, unit=?, capacity=?, highlight=?, sort_order=? WHERE product_id=?',
      [product.name, product.name_en, product.tagline, product.description, product.image, product.images, product.highlights, product.source_url, product.price, product.unit, product.capacity, product.highlight, product.sort_order, product.product_id]
    )
    console.log('✓ Nobu Catering 已存在，已更新')
  } else {
    await pool.execute(
      'INSERT INTO `products_wine` (product_id, name, name_en, tagline, description, image, images, highlights, source_url, price, unit, capacity, highlight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product.product_id, product.name, product.name_en, product.tagline, product.description, product.image, product.images, product.highlights, product.source_url, product.price, product.unit, product.capacity, product.highlight, product.sort_order]
    )
    console.log('✓ Nobu Catering 已插入 products_wine')
  }

  const [rows] = await pool.execute('SELECT product_id, name, price, unit, highlight FROM `products_wine` ORDER BY sort_order ASC')
  console.log('当前酒水宴席商品列表:')
  rows.forEach(r => console.log(`  - [${r.product_id}] ${r.name} | ${r.price}${r.unit} | ${r.highlight}`))

  await pool.end()
}

main().catch(err => {
  console.error('执行失败:', err)
  process.exit(1)
})
