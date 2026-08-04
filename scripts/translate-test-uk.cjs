require('dotenv').config()
const mysql = require('mysql2/promise')

const translations = [
  {
    slug: 'test-uk-orchardleigh-estate',
    name_cn: '奥查德利庄园',
    tagline_cn: '萨默塞特郡的宁静乡村庄园婚礼场地，拥有迷人的湖泊与林地',
    description_cn: `Orchardleigh Estate 是一座位于萨默塞特郡门迪普山区的迷人乡村庄园，提供多种婚礼场地选择。

这座庄园拥有超过200年的历史，四周环绕着美丽的湖泊和古老的林地。庄园提供多个婚礼场地，包括：

• The Orangery（橘园）— 可容纳150位宾客的优雅婚礼场地，拥有落地窗，可俯瞰湖泊美景
• The Boathouse（船屋）— 位于湖畔的浪漫场地，可容纳24位宾客
• The Summerhouse（凉亭）— 俯瞰湖泊的宁静场地，可容纳24位宾客
• The Coach House（马车房）— 可容纳14位宾客的亲密场地
• The Tithe Barn（什一谷仓）— 历史悠久的谷仓，可容纳150位宾客

庄园内还有一座由乔治·韦斯顿设计的私人教堂，可容纳120位宾客。

Orchardleigh Estate 提供全方位的服务，包括婚礼策划、餐饮、摄影、花艺和音乐，确保您的婚礼完美无缺。`,
    features: ['专属使用','现场仪式','宾客住宿','宠物友好','无障碍设施','户外空间','仅场地租赁','舞池','停车场','民事仪式许可'],
    venue_types: [
      { name: 'Country House', name_cn: '乡村庄园' },
      { name: 'Barn', name_cn: '谷仓' },
      { name: 'Garden', name_cn: '花园' }
    ],
    towns: [
      { name: 'Somerset', name_cn: '萨默塞特郡' }
    ]
  },
  {
    slug: 'test-uk-brinsop-court',
    name_cn: '布林索普庄园',
    tagline_cn: '赫里福德郡的伊丽莎白时代庄园，提供浪漫的花园婚礼体验',
    description_cn: `Brinsop Court 是一座位于赫里福德郡的伊丽莎白时代庄园，拥有超过500年的历史。这座美丽的庄园提供独特的婚礼体验，让您和宾客仿佛穿越回都铎时代。

庄园提供多个婚礼场地：

• 庄园花园 — 可容纳150位宾客的户外婚礼场地，四周环绕着美丽的花园和草坪
• 庄园大厅 — 可容纳120位宾客的室内婚礼场地，拥有古老的木质横梁和壁炉

Brinsop Court 提供多种婚礼服务，包括：

• 婚礼策划
• 餐饮和酒水
• 摄影和摄像
• 花艺装饰
• 音乐和娱乐

庄园还提供住宿服务，可容纳最多20位宾客。`,
    features: ['专属使用','现场仪式','宾客住宿','宠物友好','无障碍设施','户外空间','仅场地租赁','舞池','停车场','民事仪式许可'],
    venue_types: [
      { name: 'Country House', name_cn: '乡村庄园' },
      { name: 'Garden', name_cn: '花园' }
    ],
    towns: [
      { name: 'Herefordshire', name_cn: '赫里福德郡' }
    ]
  },
  {
    slug: 'test-uk-st-giles-house',
    name_cn: '圣吉尔斯庄园',
    tagline_cn: '多塞特郡的帕拉第奥式庄园，提供优雅的乡村婚礼体验',
    description_cn: `St Giles House 是一座位于多塞特郡的帕拉第奥式庄园，拥有超过300年的历史。这座美丽的庄园提供多种婚礼场地选择，让您和宾客享受优雅的乡村婚礼体验。

庄园提供多个婚礼场地：

• The Great Hall（大厅）— 可容纳150位宾客的宏伟婚礼场地，拥有精美的天花板和吊灯
• The Chapel（教堂）— 可容纳120位宾客的浪漫婚礼场地，拥有彩色玻璃窗
• The Orangery（橘园）— 可容纳100位宾客的明亮婚礼场地，可俯瞰花园美景
• The Garden（花园）— 可容纳200位宾客的户外婚礼场地，四周环绕着美丽的花园和草坪

St Giles House 提供全方位的服务，包括婚礼策划、餐饮、摄影、花艺和音乐，确保您的婚礼完美无缺。`,
    features: ['专属使用','现场仪式','宾客住宿','宠物友好','无障碍设施','户外空间','仅场地租赁','舞池','停车场','民事仪式许可'],
    venue_types: [
      { name: 'Country House', name_cn: '乡村庄园' },
      { name: 'Garden', name_cn: '花园' }
    ],
    towns: [
      { name: 'Dorset', name_cn: '多塞特郡' }
    ]
  },
  {
    slug: 'test-uk-morden-hall',
    name_cn: '莫登庄园',
    tagline_cn: '萨里郡萨顿的专属婚礼场地',
    description_cn: `Morden Hall 是一座位于萨里郡萨顿的专属婚礼场地，提供独特的婚礼体验。这座美丽的庄园提供多种婚礼场地选择，让您和宾客享受优雅的婚礼体验。

庄园提供多个婚礼场地：

• The Main Hall（大厅）— 可容纳150位宾客的宏伟婚礼场地，拥有精美的装饰和吊灯
• The Garden（花园）— 可容纳100位宾客的户外婚礼场地，四周环绕着美丽的花园和草坪

Morden Hall 提供全方位的服务，包括婚礼策划、餐饮、摄影、花艺和音乐，确保您的婚礼完美无缺。`,
    features: ['专属使用','现场仪式','宾客住宿','宠物友好','无障碍设施','户外空间','仅场地租赁','舞池','停车场','民事仪式许可'],
    venue_types: [
      { name: 'Country House', name_cn: '乡村庄园' },
      { name: 'Garden', name_cn: '花园' }
    ],
    towns: [
      { name: 'Surrey', name_cn: '萨里郡' }
    ]
  }
]

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  for (const t of translations) {
    await pool.execute(
      `UPDATE cv_test_uk SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=? WHERE slug=?`,
      [t.name_cn, t.tagline_cn, t.description_cn, JSON.stringify(t.features), JSON.stringify(t.venue_types), JSON.stringify(t.towns), t.slug]
    )
    console.log('cv_test_uk done:', t.slug)

    await pool.execute(
      `UPDATE cd_test_uk SET name_cn=?, tagline_cn=?, description_cn=? WHERE slug=?`,
      [t.name_cn, t.tagline_cn, t.description_cn, t.slug]
    )
    console.log('cd_test_uk done:', t.slug)
  }

  await pool.end()
  console.log('All translations done!')
}

main().catch(e => { console.error(e.message); process.exit(1) })
