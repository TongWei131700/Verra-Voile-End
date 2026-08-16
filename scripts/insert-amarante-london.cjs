/**
 * 插入 Amaranté London 花店数据到 crawled_florists 表
 * 数据来源：amarantelondon.com 爬取
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

  // 1. 确保表存在
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_florists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL,
      name VARCHAR(200) NOT NULL,
      name_cn VARCHAR(200) DEFAULT '',
      source_url VARCHAR(500) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '',
      city VARCHAR(100) DEFAULT '',
      city_cn VARCHAR(100) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '',
      description TEXT,
      founded_year INT DEFAULT NULL,
      team_members JSON,
      services JSON,
      specialties JSON,
      design_process JSON,
      pricing_comparison JSON,
      wedding_venues JSON,
      wedding_stories JSON,
      fresh_flower_products JSON,
      infinity_rose_products JSON,
      testimonials JSON,
      faq JSON,
      portfolio_images JSON,
      cover_image VARCHAR(500) DEFAULT '',
      headshot VARCHAR(500) DEFAULT '',
      website VARCHAR(500) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      email VARCHAR(200) DEFAULT '',
      address VARCHAR(500) DEFAULT '',
      rating JSON,
      media_features JSON,
      price INT DEFAULT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ 表 crawled_florists 已就绪')

  // 2. 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_florists WHERE slug = ?', ['amarante-london'])
  if (existing.length > 0) {
    console.log('⚠ Amarante London 已存在，先删除旧数据...')
    await pool.execute('DELETE FROM crawled_florists WHERE slug = ?', ['amarante-london'])
  }

  // 3. 插入数据
  await pool.execute(
    `INSERT INTO crawled_florists
     (slug, name, name_cn, source_url, country, country_cn, city, city_cn,
      tagline, description, founded_year,
      team_members, services, specialties, design_process, pricing_comparison,
      wedding_venues, wedding_stories, fresh_flower_products, infinity_rose_products,
      testimonials, faq, portfolio_images,
      cover_image, headshot, website, phone, email, address,
      rating, media_features, price, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      'amarante-london',
      'Amaranté London',
      '阿玛兰特伦敦',
      'https://www.amarantelondon.com/',
      'United Kingdom',
      '英国',
      'London',
      '伦敦',
      '伦敦奢华婚礼花艺设计工作室，为顶级品牌与新人打造非凡花艺体验',
      `Amaranté London 是一家位于伦敦的奢华花艺设计与制作工作室，以可持续理念和精湛工艺闻名。从定制花束到大型花艺装置，团队将每一场婚礼打造成杰作。曾与 Chanel、Ferrari、Rolex 等顶级品牌合作，荣获 Marie Claire「最具可持续婚礼花艺师」大奖。创始人 Kay Seehra 拥有多年全球奢华活动制作经验，将品牌活动的精准标准带入婚礼花艺领域。`,
      null, // founded_year
      JSON.stringify([
        {
          name: 'Kay Seehra', name_cn: '凯·西赫拉',
          role: 'Founder & Creative Director', role_cn: '创始人兼创意总监',
          description: 'Kay 在全球奢华活动领域深耕多年，曾为 Formula E、Chanel、Rolex、Porsche 等品牌制作完美体验。在目睹朋友们筹备婚礼时的种种困难后，她将奢华活动的严谨标准与透明模式引入婚礼策划领域。',
          image: 'https://www.amarantelondon.com/cdn/shop/files/Kay-Seehra-Amarante-Founder_1.jpg?v=1767187617&width=1024',
        },
      ]),
      JSON.stringify([
        {
          title: 'Wedding Flowers', title_cn: '婚礼花艺',
          items: [
            { label: 'Bridal Bouquets', label_cn: '新娘手捧花', desc: '根据新人风格定制的手捧花设计' },
            { label: 'Ceremony Florals', label_cn: '仪式花艺', desc: '花拱、通道花艺、仪式区装饰' },
            { label: 'Reception Table Arrangements', label_cn: '婚宴桌花', desc: '从精致中央花艺到连续桌面花带' },
            { label: 'Venue Styling', label_cn: '场地布置', desc: '整体空间花艺与绿植装饰' },
            { label: 'Floral Installations', label_cn: '花艺装置', desc: '大型沉浸式花艺艺术装置' },
            { label: 'Boutonnieres & Corsages', label_cn: '胸花与腕花', desc: '为伴郎团和家庭成员定制' },
          ],
        },
        {
          title: 'Wedding Planning & Production', title_cn: '婚礼策划与制作',
          items: [
            { label: 'Master Floral Artistry', label_cn: '花艺大师', desc: '从沉浸式植物拱门到精致桌面布置' },
            { label: 'Set Design & Custom Stationery', label_cn: '场景设计与定制请柬', desc: '建筑装置、定制背景、沉浸式空间体验' },
            { label: 'Architectural Lighting & Sound', label_cn: '建筑灯光与音响', desc: '定制灯光景观，营造氛围与情绪过渡' },
            { label: 'Seamless Event Management', label_cn: '无缝活动管理', desc: '精确把控每个技术细节与流程过渡' },
          ],
        },
      ]),
      JSON.stringify(['奢华婚礼花艺', '可持续花艺', '全流程婚礼策划', '定制花艺装置', '当日配送', 'Marie Claire 大奖得主']),
      JSON.stringify([
        { step: 1, title: 'We Listen to Your Vision', title_cn: '倾听您的愿景', desc: '一切从对话开始。您分享您的故事、灵感与最在意的事，我们开始理解您独特的美学与风格。' },
        { step: 2, title: 'Your Vision, Perfected', title_cn: '完美呈现您的愿景', desc: '设计师将您的想法转化为情绪板和草图，展示每个花艺元素和造型细节如何在您的场地中呈现。' },
        { step: 3, title: 'We Refine Every Detail', title_cn: '精炼每个细节', desc: '反复调整直到一切恰到好处。从花艺色彩到装饰造型，每个细节都为您量身定制。' },
        { step: 4, title: 'We Deliver a Seamless Day', title_cn: '呈现完美的一天', desc: '当天，团队管理每个环节，从花艺装置到现场协调。您只需到场，感受魔法，享受每一刻。' },
      ]),
      JSON.stringify([
        { service: '策划费', traditional: '通常 15-20%', amarante: '0%（已包含）' },
        { service: '供应商佣金', traditional: '隐藏 10-20% 加价', amarante: '无。直接来自源头。' },
        { service: '设计能力', traditional: '外包（额外费用）', amarante: '内部创意团队' },
        { service: '制作', traditional: '第三方租赁', amarante: '自有库存' },
      ]),
      JSON.stringify([
        { name: 'The Waldorf Hilton', name_cn: '伦敦华尔道夫希尔顿', image: 'https://www.amarantelondon.com/cdn/shop/files/waldorf-hilton-wedding-venue.jpg?v=1758877224' },
        { name: 'Kew Gardens', name_cn: '邱园（皇家植物园）', image: 'https://www.amarantelondon.com/cdn/shop/files/Kew_Gardens_Wedding_Venue.jpg?v=1759123506' },
        { name: 'Syon Park', name_cn: '锡安公园', image: 'https://www.amarantelondon.com/cdn/shop/files/Soon_Park_Wedding_Venue.jpg?v=1759123421' },
        { name: 'One Marylebone', name_cn: '马里波恩一号', image: 'https://www.amarantelondon.com/cdn/shop/files/One-Marylebone-Wedding-Venue.jpg?v=1758880951' },
        { name: 'Hampton Court Castle', name_cn: '汉普顿宫城堡', image: 'https://www.amarantelondon.com/cdn/shop/files/Hampton_Court_Castle_Wedding_Venue.jpg?v=1759122792' },
      ]),
      JSON.stringify([
        { venue: 'The Waldorf Hilton', venue_cn: '华尔道夫希尔顿', tagline: 'BENEATH A BREATHTAKING FLORAL ARCH', tagline_cn: '令人屏息的花拱之下', image: 'https://www.amarantelondon.com/cdn/shop/files/waldorf_hilton_hotel_wedding_venue_1.jpg?v=1759133024&width=2000' },
        { venue: 'Kew Gardens', venue_cn: '邱园', tagline: 'A SPRINGTIME BLOOM OF TRADITION', tagline_cn: '春日传统的绽放', image: 'https://www.amarantelondon.com/cdn/shop/files/Dishani_wedding.webp?v=1759238910&width=1169' },
        { venue: 'One Marylebone', venue_cn: '马里波恩一号', tagline: 'THEIR FIRST STEPS TOWARD FOREVER', tagline_cn: '走向永恒的第一步', image: 'https://www.amarantelondon.com/cdn/shop/files/One-Marylebone-Wedding-Venue.jpg?v=1758880951&width=1530' },
        { venue: 'Hampton Court Castle', venue_cn: '汉普顿宫城堡', tagline: 'LOVE SEALED IN A FAIRYTALE SETTING', tagline_cn: '童话场景中的爱情封印', image: 'https://www.amarantelondon.com/cdn/shop/files/hampton_court_castle_wedding_venue_main.jpg?v=1759239315&width=2000' },
      ]),
      JSON.stringify([
        { slug: 'soleil', name: 'Soleil', name_cn: '日光', price: 105, price_from: true, category: '鲜花花束' },
        { slug: 'riviera', name: 'Riviera', name_cn: '里维埃拉', price: 125, price_from: true, category: '鲜花花束' },
        { slug: 'electra', name: 'Electra', name_cn: '艾蕾克特拉', price: 95, price_from: true, category: '鲜花花束' },
        { slug: 'sienna', name: 'Sienna', name_cn: '锡耶纳', price: 90, price_from: true, category: '鲜花花束' },
        { slug: 'eden', name: 'Eden', name_cn: '伊甸', price: 90, price_from: true, category: '鲜花花束' },
        { slug: 'beloved', name: 'Beloved', name_cn: '挚爱', price: 115, price_from: true, category: '鲜花花束' },
        { slug: 'rosa', name: 'Rosa', name_cn: '罗莎', price: 130, price_from: true, category: '鲜花花束' },
        { slug: 'selene', name: 'Selene', name_cn: '塞勒涅', price: 95, price_from: true, category: '鲜花花束' },
        { slug: 'aurora', name: 'Aurora', name_cn: '极光', price: 90, price_from: true, category: '鲜花花束' },
        { slug: 'hera', name: 'Hera', name_cn: '赫拉', price: 90, price_from: true, category: '鲜花花束' },
        { slug: 'velvet-initial', name: 'Velvet with Initial', name_cn: '丝绒字母玫瑰', price: 225, price_from: true, category: '鲜花花束' },
        { slug: 'velvet-rose', name: 'Velvet Rose', name_cn: '丝绒玫瑰', price: 90, price_from: true, category: '鲜花花束' },
        { slug: 'celeste', name: 'Celeste Pink Lily', name_cn: '天蓝粉百合', price: 65, price_from: true, category: '鲜花花束' },
        { slug: 'florist-choice', name: 'Florist Choice', name_cn: '花艺师精选', price: 55, price_from: true, category: '鲜花花束' },
        { slug: 'bespoke', name: 'Bespoke Arrangements', name_cn: '定制花艺', price: 0, price_from: false, category: '定制' },
      ]),
      JSON.stringify([
        { slug: 'ir-single', name: 'Single Infinity Rose', name_cn: '单支永生玫瑰', price: 45 },
        { slug: 'ir-small-black-square', name: 'Small Black Square', name_cn: '小号黑色方盒', price: 75 },
        { slug: 'ir-small-white-square', name: 'Small White Square', name_cn: '小号白色方盒', price: 75 },
        { slug: 'ir-medium-black-round', name: 'Medium Black Round', name_cn: '中号黑色圆盒', price: 150 },
        { slug: 'ir-medium-white-round', name: 'Medium White Round', name_cn: '中号白色圆盒', price: 125 },
        { slug: 'ir-large-black-round', name: 'Large Black Round', name_cn: '大号黑色圆盒', price: 225 },
        { slug: 'ir-large-pink-round', name: 'Large Pink Round', name_cn: '大号粉色圆盒', price: 225 },
        { slug: 'ir-xl-black-square', name: 'Extra Large Black Square', name_cn: '特大黑色方盒', price: 325 },
        { slug: 'ir-deluxe-80-100', name: '80-100 Roses Deluxe Square', name_cn: '80-100支豪华方盒', price: 625 },
        { slug: 'ir-super-deluxe-85-100', name: '85-100 Roses Super Deluxe Round', name_cn: '85-100支超级豪华圆盒', price: 825 },
        { slug: 'ir-ultimate-140', name: '140 Roses Ultimate Deluxe', name_cn: '140支至臻豪华盒', price: 1295 },
      ]),
      JSON.stringify([
        { couple: 'Dishani', text: 'Hiring Amarante for our two day wedding event - one of the best decisions we have made. They seamlessly created illustrations of every aspect we had discussed.', text_cn: '为两天的婚礼聘请 Amarante 是我们做过的最好决定之一。他们无缝地为每个方面创建了插图，让我们能真正看到最终效果。' },
        { couple: 'Maryam', text: 'We used Amarante extensively throughout our wedding. Every detail was perfect and nothing was overlooked. I could not recommend this supplier more!', text_cn: '我们在婚礼中大量使用了 Amarante 的服务。每个细节都完美无缺，强烈推荐！' },
        { couple: 'Cait', text: 'I cannot thank the team at Amarante enough for all of their help and amazing creative design. All of our wedding guests commented on how amazing they looked.', text_cn: '非常感谢 Amarante 团队的帮助和出色的创意设计。所有婚礼宾客都称赞花艺有多美。' },
        { couple: 'Tracy', text: 'I was nervous about ordering flowers online, but I shouldn\'t have been. The bridal dried flower arrangement came boxed up beautifully and I instantly fell in love.', text_cn: '我本来很紧张要在网上订购婚礼花束，但完全不必担心。新娘干花作品包装精美地送达，我立刻爱上了。' },
      ]),
      JSON.stringify([
        { q: 'What makes Amarante\'s flowers luxury?', q_cn: '什么让 Amarante 的花属于奢华级别？', a: 'Every bouquet is hand-tied to order in our London studio from carefully sourced seasonal flowers.', a_cn: '每个花束都在伦敦工作室按订单手工扎制，使用精心采购的当季鲜花。' },
        { q: 'How long will my flowers last?', q_cn: '鲜花能保持多久？', a: 'With fresh water and a cool spot, expect around 5–7 days.', a_cn: '在清水和凉爽位置，预计可保持约5-7天。' },
        { q: 'Do you offer same-day delivery in London?', q_cn: '伦敦提供当日送达吗？', a: 'Yes. Order by 1pm for same-day hand-delivery across London.', a_cn: '是的。下午1点前下单，每周七天伦敦全区手工送达。' },
        { q: 'What makes Amarante different from traditional wedding planners?', q_cn: '与传统婚礼策划师有什么不同？', a: 'We execute the design ourselves — transparent pricing without hidden commissions.', a_cn: '我们自行执行设计——透明定价，没有隐藏佣金。' },
        { q: 'Can you work with our chosen venue?', q_cn: '能在我们选择的场地工作吗？', a: 'Absolutely. We hold preferred relationships with prestigious London wedding venues.', a_cn: '当然。我们与伦敦知名婚礼场地保持优先合作。' },
      ]),
      JSON.stringify([
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_92.jpg?v=1760355125',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_87.jpg?v=1760355191',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_98.jpg?v=1760355081',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_88.jpg?v=1760356610',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_93.jpg?v=1760355142',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_99.jpg?v=1760355263',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_46.jpg?v=1759853567',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_45.jpg?v=1759853656',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_28.jpg?v=1759853745',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_38.jpg?v=1759853906',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_81.jpg?v=1759855588',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_12.jpg?v=1759854782',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_6.jpg?v=1759855656',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_3.jpg?v=1759855743',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_1.jpg?v=1759856524',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_61.jpg?v=1759857323',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_72.jpg?v=1759857688',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_53.jpg?v=1760007435',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_83.jpg?v=1760008095',
        'https://www.amarantelondon.com/cdn/shop/files/Weddings_Lookbook_86_1f9f01cd-1234-4838-9782-ed54fb29fea4.jpg?v=1760009782',
      ]),
      'https://www.amarantelondon.com/cdn/shop/files/TBA-Taste-Festival-Regents-Park-London-Flowers-by-Amarante-Event-Florist-Bespoke_c856d5a5-a099-4b8f-8cee-e280c4467609.webp?v=1756979898&width=2000',
      'https://www.amarantelondon.com/cdn/shop/files/Kay-Seehra-Amarante-Founder_1.jpg?v=1767187617&width=1024',
      'https://www.amarantelondon.com/',
      '0204 525 6518',
      'support@amarantelondon.com',
      '1 Hutchins Close, London E15 2JE',
      JSON.stringify({ score: 4.7, count: 992, source: 'Google Reviews' }),
      JSON.stringify(['Vogue', 'Elle', "Harper's Bazaar", 'Marie Claire', 'Forbes', 'Junebug Weddings']),
      null, // price - 花店无固定起步价
      1,    // sort_order
    ]
  )

  console.log('✓ Amarante London 数据插入成功')

  // 4. 验证
  const [rows] = await pool.execute('SELECT slug, name, name_cn, city, city_cn FROM crawled_florists')
  console.log(`当前花店列表（${rows.length} 家）:`)
  rows.forEach(r => console.log(`  - ${r.slug} | ${r.name} | ${r.name_cn} | ${r.city}, ${r.city_cn}`))

  await pool.end()
  console.log('✓ 完成')
}

run().catch(err => { console.error('插入失败:', err); process.exit(1) })
