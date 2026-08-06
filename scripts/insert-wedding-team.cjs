/**
 * 创建 crawled_wedding_teams 表并插入 Monticello 数据
 */
const mysql = require('mysql2/promise')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 1. 创建表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_wedding_teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL COMMENT 'URL标识',
      name VARCHAR(200) NOT NULL COMMENT '公司英文名',
      name_cn VARCHAR(200) DEFAULT '' COMMENT '公司中文名',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      country VARCHAR(100) DEFAULT '' COMMENT '所在国家英文',
      country_cn VARCHAR(100) DEFAULT '' COMMENT '所在国家中文',
      city VARCHAR(100) DEFAULT '' COMMENT '所在城市英文',
      city_cn VARCHAR(100) DEFAULT '' COMMENT '所在城市中文',
      tagline VARCHAR(500) DEFAULT '' COMMENT '宣传语/标语',
      description TEXT COMMENT '公司介绍/描述',
      story TEXT COMMENT '品牌故事',
      founded_year INT DEFAULT NULL COMMENT '成立年份',
      team_members JSON COMMENT '团队成员列表',
      services JSON COMMENT '提供的服务列表',
      service_areas JSON COMMENT '服务地区',
      values_list JSON COMMENT '核心价值观',
      testimonials JSON COMMENT '客户评价',
      faq JSON COMMENT '常见问题',
      partners JSON COMMENT '合作伙伴',
      images JSON COMMENT '图片URL列表',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      website VARCHAR(500) DEFAULT '' COMMENT '官网地址',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_country (country_cn)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取婚礼团队公司表'
  `)
  console.log('✓ 表 crawled_wedding_teams 已就绪')

  // 2. 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_wedding_teams WHERE slug = ?', ['monticello'])
  if (existing.length > 0) {
    console.log('⚠ Monticello 数据已存在，跳过插入')
  } else {
    // 3. 插入 Monticello 数据
    const data = {
      slug: 'monticello',
      name: 'Monticello Events',
      name_cn: '蒙蒂切洛婚礼策划',
      source_url: 'https://monticello.ro/',
      country: 'Romania',
      country_cn: '罗马尼亚',
      city: 'Bucharest',
      city_cn: '布加勒斯特',
      tagline: 'Our vision is to be the best at what we do, offering memorable and authentic events that reflect the personality of each couple.',
      description: `Monticello Events 是一家总部位于罗马尼亚布加勒斯特的婚礼策划公司，拥有超过14年的婚礼与活动行业经验。由 Izabela Gontaru 创立，公司专注于罗马尼亚国内及国际目的地的婚礼组织。

目的地婚礼（Destination Weddings）是 Monticello 的核心业务，与意大利和希腊的合作方保持紧密协作。每一场活动都不只是一次庆典——它是一个独特的故事，是每对新人生命中值得铭记的特殊时刻，团队以专业、热情和创造力精心打造。

Monticello 的愿景是成为业内最优秀的婚礼策划团队，提供令人难忘的、真实的活动体验，真实反映每对新人的个性，创造永恒的美好回忆。团队致力于将每一个梦想变为现实，将传统与创新结合，为每一场婚礼增添额外的魔力，无论规模大小或地点在哪。`,
      story: `Monticello Events 于2011年创立，怀揣着对婚礼行业的热情与求知欲。最初，团队与一家餐饮公司合作，负责活动装饰，在每一次活动中学习行业的关键要素。

2013年，客户 Ana & Cesar 邀请团队担任全权婚礼策划师，Monticello 由此正式转型。当时罗马尼亚的婚礼策划行业尚处于起步阶段，经过数年的市场培育，如今客户已充分认识到专业婚礼策划的价值。

创始人 Izabela 同时是认证培训师，在 Atelierele Ilbah Academy 教授婚礼策划课程超过4年，培养新一代婚礼策划师。`,
      founded_year: 2011,
      team_members: JSON.stringify([
        {
          name: 'Izabela Gontaru',
          name_cn: '伊莎贝拉·贡塔鲁',
          role: 'Founder / Senior Wedding Planner / Creative Director',
          role_cn: '创始人 / 高级婚礼策划师 / 创意总监',
          description: 'Monticello Events 创始人，拥有14年+行业经验。认证培训师，在 Atelierele Ilbah Academy 教授专业婚礼策划课程超过4年。',
          image: ''
        },
        {
          name: 'Larisa',
          name_cn: '拉里莎',
          role: 'Team Member',
          role_cn: '团队成员',
          description: 'Monticello 核心团队成员，参与目的地婚礼及本地婚礼的策划执行。',
          image: ''
        },
        {
          name: 'Dana',
          name_cn: '达娜',
          role: 'Wedding Planner',
          role_cn: '婚礼策划师',
          description: 'Izabela 婚礼策划大师班（Wedding Planning Masterclass）毕业生，专业婚礼策划师。',
          image: ''
        },
        {
          name: 'Ionuț',
          name_cn: '约努茨',
          role: 'Wedding Planner',
          role_cn: '婚礼策划师',
          description: 'Izabela 婚礼策划大师班（Wedding Planning Masterclass）毕业生，专业婚礼策划师。',
          image: ''
        }
      ]),
      services: JSON.stringify([
        { name: 'Full Wedding Planning', name_cn: '全程婚礼策划', category: 'wedding', description: '从策划到执行的全流程婚礼服务' },
        { name: 'Personalized Wedding Planning', name_cn: '个性化婚礼策划', category: 'wedding', description: '根据新人个性定制的婚礼方案' },
        { name: 'On-the-Day Wedding Coordination', name_cn: '当日婚礼协调', category: 'wedding', description: '婚礼当天的现场协调与管理' },
        { name: 'Destination Weddings', name_cn: '目的地婚礼', category: 'wedding', description: '国际目的地婚礼全程策划' },
        { name: 'Wedding Planning Advisory Session', name_cn: '婚礼策划咨询', category: 'wedding', description: '专业婚礼策划咨询会议' },
        { name: 'Venue Scouting', name_cn: '场地考察', category: 'wedding', description: '婚礼场地搜索与考察服务' },
        { name: 'Baptism & Kids Parties', name_cn: '洗礼与儿童派对', category: 'event', description: '洗礼仪式及儿童派对策划' },
        { name: 'Product Launch Planning', name_cn: '产品发布策划', category: 'event', description: '品牌产品发布活动策划' },
        { name: 'Corporate & Private Events', name_cn: '企业与私人活动', category: 'event', description: '企业活动和私人聚会策划' },
        { name: 'Team Building Event Planning', name_cn: '团建活动策划', category: 'event', description: '企业团队建设活动策划' }
      ]),
      service_areas: JSON.stringify([
        { name: 'Romania', name_cn: '罗马尼亚', detail: '全国范围，布加勒斯特为基地' },
        { name: 'Italy', name_cn: '意大利', detail: '与意大利合作方紧密协作' },
        { name: 'Greece', name_cn: '希腊', detail: '与希腊合作方紧密协作' },
        { name: 'International', name_cn: '国际', detail: '支持全球海外客户，全程线上沟通策划' }
      ]),
      values_list: JSON.stringify([
        { name: 'Professionalism', name_cn: '专业', description: '每一个细节都以严谨和专业知识管理，确保无缝体验' },
        { name: 'Creativity', name_cn: '创意', description: '每对新人都是独特的，每场活动都应该是原创的' },
        { name: 'Passion', name_cn: '热情', description: '全身心投入每一个项目，对行业的热爱驱动每天的工作' },
        { name: 'Integrity', name_cn: '诚信', description: '与客户和合作伙伴保持诚实透明的关系' },
        { name: 'Collaboration', name_cn: '协作', description: '与客户和信赖的供应商紧密合作，量身定制每个细节' },
        { name: 'Teamwork', name_cn: '团队合作', description: '团队是成功的基石，专注热情的人才是每场活动的灵魂' }
      ]),
      testimonials: JSON.stringify([
        { couple: 'Deny & Marius', text: 'Mulțumim pentru nunta de vis la realizarea căreia ați luat parte și ați făcut-o posibilă! Vă recomandăm tuturor celor care se căsătoresc sau au diferite evenimente și își doresc profesionalism și relaxare!', text_cn: '感谢你们参与并实现了我们的梦幻婚礼！推荐给所有想要专业且轻松婚礼体验的新人！' },
        { couple: 'Iulia & Alex', text: 'Thank you, Monticello, for your professionalism and creativity! It was a pleasure working with you.', text_cn: '感谢 Monticello 的专业与创意！与你们合作非常愉快。' },
        { couple: 'Mihaela & Răzvan', text: 'Mulțumim mult pentru sprijin, ideile minunate și relaxarea pe care ne-ați transmis-o, atât înainte de eveniment, cât și în timpul nunții noastre minunate!', text_cn: '非常感谢你们的支持、绝妙的创意，以及在婚礼前后传递给我们的轻松感！' },
        { couple: 'Maria & David Brandstadter', text: 'Thank you for organising us a fairy-tale wedding!', text_cn: '感谢你们为我们组织了一场童话般的婚礼！' },
        { couple: 'Andreea & Dumitru', text: 'Mulțumim din suflet pentru că ați făcut ca cea mai importantă zi din viața noastră să fie de poveste! Totul a fost perfect până la cel mic detaliu! Sunteți super!', text_cn: '衷心感谢你们让我们人生最重要的一天如童话般完美！每个细节都无可挑剔！' }
      ]),
      faq: JSON.stringify([
        { q: '是否擅长目的地婚礼和国际客户？', a: '是的，我们专注于罗马尼亚及其他国际地点的目的地婚礼。大多数客户居住在国外，整个策划过程通过视频通话和数字沟通完全或部分在线管理。无论你在哪里，我们都可以从头到尾无缝策划和协调你的婚礼。' },
        { q: '应该提前多久预订婚礼策划师？', a: '预订婚礼策划师永远不会太早，但我们建议至少提前一年开始。我们曾在短短六个月内成功策划婚礼，但这有时意味着在供应商可用性方面做出妥协。为了拥有最佳选择的自由，提前至少一年预订是理想的。' },
        { q: '是否限制客户数量以保证质量？', a: '是的，我们承接有限数量的婚礼，确保每对新人都获得我们全部的关注和最高水平的服务。' },
        { q: '沟通频率和方式是什么？', a: '我们随时为你提供指导和支持。会议、邮件或咨询没有次数限制——我们根据需要进行沟通，确保高效且无压力的策划。我们通过面对面会议、在线通话、WhatsApp 和电子邮件与你沟通。' },
        { q: '婚礼当天会有多少团队成员到场？', a: '到场的婚礼策划师人数根据婚礼的复杂程度、宾客人数和整体工作量决定。每位团队成员都有专门的职责，从协调供应商和时间安排，到监督造型和宾客体验，确保一切顺利进行。' },
        { q: '是否与客户已预订的供应商合作？', a: '是的，我们与你现有的供应商合作，但始终会进行背景调查以确保质量和顺利协调。' },
        { q: '如何帮助控制预算？', a: '我们从一开始就审查整个预算，确定对你最重要的事项，并确保在整个过程中坚持初始计划。我们还提供共享的 Excel 表格，实时更新所有费用、已付定金和剩余余额。' }
      ]),
      partners: JSON.stringify([
        { name: 'Cantacuzino Castle', role: 'Events Manager', contact: 'Ramona Florea', website: 'cantacuzinocastle.ro' },
        { name: 'EN ROSE', role: 'Founder & Designer Florist', contact: 'Adina Filculescu', website: 'enrose.ro' },
        { name: 'Hadar Chalet', role: 'Co-founder', contact: 'Oana Toma', website: 'lahadar.ro' }
      ]),
      images: JSON.stringify([
        'https://monticello.ro/wp/wp-content/uploads/2024/08/15c6af_99cc216f26404b5ab9078b3c18744745mv2_d_2162_3242_s_2-uai-774x1032.webp',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/15c6af_b40f716c9b56435994c0d46d6ab1358dmv2_d_1320_1980_s_2-1-uai-774x1032.webp',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/AR-320-2-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/Nunta_Catalina_Ashraf00558-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/anasibogdan-386-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/anasibogdan-343-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/Nunta_Catalina_Ashraf00085-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/anasibogdan-365-scaled-uai-1032x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2024/08/anasibogdan-340-uai-1032x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2026/01/pexels-alejandro-henriquez-558322658-19102629-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2026/01/550park-luxury-wedding-films-C_vFTtFRePo-unsplash-scaled-uai-774x1032.jpg',
        'https://monticello.ro/wp/wp-content/uploads/2026/01/LilebbaPhotographyStyledBridalPhotoshoot245-scaled-uai-774x1032.jpg'
      ]),
      cover_image: 'https://monticello.ro/wp/wp-content/uploads/2024/08/15c6af_99cc216f26404b5ab9078b3c18744745mv2_d_2162_3242_s_2-uai-774x1032.webp',
      website: 'https://monticello.ro/',
      sort_order: 1
    }

    await pool.execute(
      `INSERT INTO crawled_wedding_teams 
        (slug, name, name_cn, source_url, country, country_cn, city, city_cn, tagline, description, story, founded_year,
         team_members, services, service_areas, values_list, testimonials, faq, partners, images, cover_image, website, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.slug, data.name, data.name_cn, data.source_url, data.country, data.country_cn,
        data.city, data.city_cn, data.tagline, data.description, data.story, data.founded_year,
        data.team_members, data.services, data.service_areas, data.values_list, data.testimonials,
        data.faq, data.partners, data.images, data.cover_image, data.website, data.sort_order
      ]
    )
    console.log('✓ Monticello 数据已插入')
  }

  // 4. 查询返回验证
  const [rows] = await pool.execute('SELECT * FROM crawled_wedding_teams WHERE slug = ?', ['monticello'])
  console.log('\n===== 查询结果 =====')
  console.log(JSON.stringify(rows[0], null, 2))

  await pool.end()
}

run().catch(err => { console.error(err); process.exit(1) })
