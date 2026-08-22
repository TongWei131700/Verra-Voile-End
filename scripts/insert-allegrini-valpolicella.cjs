/**
 * 将 2025 Valpolicella Allegrini 插入酒水宴席(wine)模块
 * 数据来源: https://www.bbr.com/products-20258404183-2025-valpolicella-allegrini-veneto-italy
 * 用法: node scripts/insert-allegrini-valpolicella.cjs
 */
const mysql = require('mysql2/promise')
require('dotenv').config()

const product = {
  product_id: 'allegrini-valpolicella-2025',
  name: '2025 瓦坡里切拉 爱乐尼酒庄',
  name_en: '2025 Valpolicella, Allegrini, Veneto, Italy',
  tagline: '威尼托标杆名庄，红樱桃与玫瑰的迷人芬芳',
  description:
    'Allegrini 是瓦坡里切拉产区公认的标杆酒庄，这款由科维纳（70%）和罗蒂内拉（30%）混酿的瓦坡里切拉魅力十足。' +
    '鼻端洋溢着红樱桃与玫瑰的优美芳香，入口则是满满的红莓果味。' +
    '柔软丰腴的口感被活泼的酸度所-refresh，带来清新而精致的收尾。\n\n' +
    '【酒评家点评】\n' +
    'Aldo Fiordelli（92/100）：层次丰富的轻酒体，展现自信的黑胡椒粒与红樱桃、李子香气，辅以柑橘皮的提亮。' +
    '张力十足，爽脆均衡的 palate，现在即可饮用。—— JamesSuckling.com\n\n' +
    'Julie Sheppard（90/100）：这款科维纳与罗蒂内拉的混酿物超所值。' +
    '精致的芳香：玫瑰、鸢尾花与草莓、樱桃。新鲜果味的 palate 丰腴多汁，' +
    '樱桃、覆盆子与草莓交织，伴随着令人垂涎的活泼酸度。适饮期 2026-2029。—— Decanter.com',
  image: '/uploads/crawled/wine/allegrini-valpolicella.jpg',
  images: JSON.stringify(['/uploads/crawled/wine/allegrini-valpolicella.jpg']),
  highlights: JSON.stringify([
    '意大利威尼托瓦坡里切拉',
    '科维纳 70% + 罗蒂内拉 30%',
    'James Suckling 92 分',
    'Decanter 90 分',
    '轻酒体 · 干型 · 即饮型',
    'Berry Bros. & Rudd 精选',
  ]),
  source_url: 'https://www.bbr.com/products-20258404183-2025-valpolicella-allegrini-veneto-italy',
  price: 15,
  unit: '£',
  capacity: '75cl',
  highlight: '意大利威尼托',
  sort_order: 1,
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 检查是否已存在
  const [exist] = await pool.execute(
    'SELECT id FROM `products_wine` WHERE product_id = ?',
    [product.product_id]
  )

  if (exist.length > 0) {
    await pool.execute(
      'UPDATE `products_wine` SET name=?, name_en=?, tagline=?, description=?, image=?, images=?, highlights=?, source_url=?, price=?, unit=?, capacity=?, highlight=?, sort_order=? WHERE product_id=?',
      [product.name, product.name_en, product.tagline, product.description, product.image, product.images, product.highlights, product.source_url, product.price, product.unit, product.capacity, product.highlight, product.sort_order, product.product_id]
    )
    console.log('✓ Allegrini Valpolicella 已存在，已更新')
  } else {
    await pool.execute(
      'INSERT INTO `products_wine` (product_id, name, name_en, tagline, description, image, images, highlights, source_url, price, unit, capacity, highlight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [product.product_id, product.name, product.name_en, product.tagline, product.description, product.image, product.images, product.highlights, product.source_url, product.price, product.unit, product.capacity, product.highlight, product.sort_order]
    )
    console.log('✓ Allegrini Valpolicella 已插入 products_wine')
  }

  // 验证
  const [rows] = await pool.execute('SELECT product_id, name, name_en, price, unit, highlight FROM `products_wine` ORDER BY sort_order ASC')
  console.log('\n当前酒水宴席商品列表:')
  rows.forEach(r => console.log(`  - [${r.product_id}] ${r.name} | ${r.price}${r.unit} | ${r.highlight}`))

  await pool.end()
  console.log('\n✅ 完成!')
}

main().catch(err => {
  console.error('执行失败:', err)
  process.exit(1)
})
