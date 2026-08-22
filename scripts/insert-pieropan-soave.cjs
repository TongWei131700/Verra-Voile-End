/**
 * 将 2023 Soave Classico La Rocca Pieropan 插入酒水宴席(wine)模块
 * 数据来源: https://www.bbr.com/products-20238036438-2023-soave-classico-la-rocca-pieropan-veneto-italy
 * 用法: node scripts/insert-pieropan-soave.cjs
 */
const mysql = require('mysql2/promise')
require('dotenv').config()

const product = {
  product_id: 'pieropan-soave-classico-la-rocca-2023',
  name: '2023 索阿维经典 拉罗卡单一园 皮耶罗潘酒庄',
  name_en: '2023 Soave Classico La Rocca, Pieropan, Veneto, Italy',
  tagline: '意大利干白教父级名庄，媲美勃艮第顶级干白的索阿维旗舰之作',
  description:
    'La Rocca 是皮耶罗潘酒庄的旗舰之作，酿酒葡萄来自罗切塔山（Monte Rocchetta）山坡上的单一园，' +
    '土壤为白垩质粘土，海拔 200-300 米。葡萄以手工分两次采摘，去梗破皮后在 2500 升法国橡木桶中短时间浸皮，' +
    '发酵后进入大橡木桶进行 15 个月的酒泥陈酿，以增加复杂度和浓郁芳香。\n\n' +
    '酒液呈浅金色，散发着烤苹果、金梨、蜜瓜、桃子、杏及热带水果的层层香气，' +
    '伴随青柠的清爽锐度。入口锋利、丰腴而富有质感，橡木桶带来的黄油羊角面包般的收尾令人沉醉，' +
    '活泼的酸度预示著这款酒将拥有十年以上的陈年潜力。\n\n' +
    '【酒评家点评】\n' +
    'Kerin O\'Keefe（95/100）：完全采用有机种植的卡尔卡耐卡，' +
    '黄色核果、野生草本、金雀花与橡木香料的诱人香气。' +
    '在法国吨桶和 20-30% 的大斯洛文尼亚桶中发酵陈酿，' +
    '优雅而结构感十足的口感展现出成熟桃子、杏、柠檬糖和蜜糖杏仁，' +
    '收尾带有牛油糖和一丝香草。鲜活酸度保持完美平衡。\n' +
    'James Suckling（98/100）：烤面包与石头气息，伴随柠檬皮、橙子、木瓜和蕨类植物，' +
    '酒体适中，酸度鲜活，丝滑余韵中带有烤面包和白巧风味。品质很高。',
  image: '/uploads/crawled/wine/pieropan-soave-classico.jpg',
  images: JSON.stringify(['/uploads/crawled/wine/pieropan-soave-classico.jpg']),
  price: 35,
  unit: '£',
  capacity: '75cl',
  highlight: 'Kerin O\'Keefe 95分 / JS 98分',
  highlights: JSON.stringify([
    '100% 有机卡尔卡耐卡',
    '单一园 La Rocca',
    '橡木桶陈酿 15 个月',
    '陈年潜力 10 年+',
    'JS 98 分',
    'Kerin O\'Keefe 95 分',
  ]),
  source_url: 'https://www.bbr.com/products-20238036438-2023-soave-classico-la-rocca-pieropan-veneto-italy',
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  const keys = Object.keys(product)
  const vals = Object.values(product)
  const placeholders = keys.map(() => '?').join(', ')

  const sql = `INSERT INTO products_wine (${keys.join(', ')}) VALUES (${placeholders})`
  const [result] = await pool.execute(sql, vals)
  console.log('✓ 插入成功, insertId:', result.insertId)

  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM products_wine')
  console.log('products_wine 表现有:', rows[0].cnt, '条记录')

  await pool.end()
}

main().catch(err => { console.error(err); process.exit(1) })
