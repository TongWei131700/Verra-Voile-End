// Amaranté London 花卉商品数据 —— 来源：amarantelondon.com 爬取
// 仅保留：花店介绍、婚礼服务、花卉产品、婚礼作品集

module.exports = {
  // ===== 花店介绍 =====
  slug: 'amarante-london',
  name: '阿玛兰特伦敦',
  nameEn: 'Amaranté London',
  tagline: '伦敦奢华婚礼花艺设计工作室，为顶级品牌与新人打造非凡花艺体验',
  desc: 'Amaranté London 是一家位于伦敦的奢华花艺设计与制作工作室，以可持续理念和精湛工艺闻名。从定制花束到大型花艺装置，团队将每一场婚礼打造成杰作。曾与 Chanel、Ferrari、Rolex 等顶级品牌合作，荣获 Marie Claire「最具可持续婚礼花艺师」大奖。创始人 Kay Seehra 拥有多年全球奢华活动制作经验，将品牌活动的精准标准带入婚礼花艺领域。',
  foundedYear: null,
  website: 'https://www.amarantelondon.com/',
  cover: 'https://www.amarantelondon.com/cdn/shop/files/TBA-Taste-Festival-Regents-Park-London-Flowers-by-Amarante-Event-Florist-Bespoke_c856d5a5-a099-4b8f-8cee-e280c4467609.webp?v=1756979898&width=2000',
  headshot: 'https://www.amarantelondon.com/cdn/shop/files/Kay-Seehra-Amarante-Founder_1.jpg?v=1767187617&width=1024',
  country: 'United Kingdom',
  countryCn: '英国',
  city: 'London',
  cityCn: '伦敦',
  address: '1 Hutchins Close, London E15 2JE',
  phone: '0204 525 6518',
  email: 'support@amarantelondon.com',
  rating: { score: 4.7, count: 992, source: 'Google Reviews' },
  mediaFeatures: ['Vogue', 'Elle', "Harper's Bazaar", 'Marie Claire', 'Forbes', 'Junebug Weddings'],

  // ===== 创始人 =====
  teamMembers: [
    {
      name: 'Kay Seehra',
      nameCn: '凯·西赫拉',
      role: 'Founder & Creative Director',
      roleCn: '创始人兼创意总监',
      description: 'Kay 在全球奢华活动领域深耕多年，曾为 Formula E、Chanel、Rolex、Porsche 等品牌制作完美体验。在目睹朋友们筹备婚礼时的种种困难后，她将奢华活动的严谨标准与透明模式引入婚礼策划领域。',
      image: 'https://www.amarantelondon.com/cdn/shop/files/Kay-Seehra-Amarante-Founder_1.jpg?v=1767187617&width=1024',
    },
  ],

  // ===== 婚礼服务 =====
  services: [
    {
      title: 'Wedding Flowers',
      titleCn: '婚礼花艺',
      items: [
        { label: 'Bridal Bouquets', labelCn: '新娘手捧花', desc: '根据新人风格定制的手捧花设计' },
        { label: 'Ceremony Florals', labelCn: '仪式花艺', desc: '花拱、通道花艺、仪式区装饰' },
        { label: 'Reception Table Arrangements', labelCn: '婚宴桌花', desc: '从精致中央花艺到连续桌面花带' },
        { label: 'Venue Styling', labelCn: '场地布置', desc: '整体空间花艺与绿植装饰' },
        { label: 'Floral Installations', labelCn: '花艺装置', desc: '大型沉浸式花艺艺术装置' },
        { label: 'Boutonnieres & Corsages', labelCn: '胸花与腕花', desc: '为伴郎团和家庭成员定制' },
      ],
    },
    {
      title: 'Wedding Planning & Production',
      titleCn: '婚礼策划与制作',
      items: [
        { label: 'Master Floral Artistry', labelCn: '花艺大师', desc: '从沉浸式植物拱门到精致桌面布置' },
        { label: 'Set Design & Custom Stationery', labelCn: '场景设计与定制请柬', desc: '建筑装置、定制背景、沉浸式空间体验' },
        { label: 'Architectural Lighting & Sound', labelCn: '建筑灯光与音响', desc: '定制灯光景观，营造氛围与情绪过渡' },
        { label: 'Seamless Event Management', labelCn: '无缝活动管理', desc: '精确把控每个技术细节与流程过渡' },
      ],
    },
  ],

  // ===== 特色标签 =====
  specialties: [
    '奢华婚礼花艺',
    '可持续花艺',
    '全流程婚礼策划',
    '定制花艺装置',
    '当日配送',
    'Marie Claire 大奖得主',
  ],

  // ===== 婚礼设计流程 =====
  designProcess: [
    { step: 1, title: 'We Listen to Your Vision', titleCn: '倾听您的愿景', desc: '一切从对话开始。您分享您的故事、灵感与最在意的事，我们开始理解您独特的美学与风格。' },
    { step: 2, title: 'Your Vision, Perfected', titleCn: '完美呈现您的愿景', desc: '设计师将您的想法转化为情绪板和草图，展示每个花艺元素和造型细节如何在您的场地中呈现。' },
    { step: 3, title: 'We Refine Every Detail', titleCn: '精炼每个细节', desc: '反复调整直到一切恰到好处。从花艺色彩到装饰造型，每个细节都为您量身定制。' },
    { step: 4, title: 'We Deliver a Seamless Day', titleCn: '呈现完美的一天', desc: '当天，团队管理每个环节，从花艺装置到现场协调。您只需到场，感受魔法，享受每一刻。' },
  ],

  // ===== 价格透明对比 =====
  pricingComparison: [
    { service: '策划费', serviceCn: '策划费', traditional: '通常 15-20%', amarante: '0%（已包含）' },
    { service: '供应商佣金', serviceCn: '供应商佣金', traditional: '隐藏 10-20% 加价', amarante: '无。直接来自源头。' },
    { service: '设计能力', serviceCn: '设计能力', traditional: '外包（额外费用）', amarante: '内部创意团队' },
    { service: '制作', serviceCn: '制作', traditional: '第三方租赁', amarante: '自有库存' },
  ],

  // ===== 合作婚礼场地 =====
  weddingVenues: [
    { name: 'The Waldorf Hilton', nameCn: '伦敦华尔道夫希尔顿', image: 'https://www.amarantelondon.com/cdn/shop/files/waldorf-hilton-wedding-venue.jpg?v=1758877224' },
    { name: 'Kew Gardens', nameCn: '邱园（皇家植物园）', image: 'https://www.amarantelondon.com/cdn/shop/files/Kew_Gardens_Wedding_Venue.jpg?v=1759123506' },
    { name: 'Syon Park', nameCn: '锡安公园', image: 'https://www.amarantelondon.com/cdn/shop/files/Soon_Park_Wedding_Venue.jpg?v=1759123421' },
    { name: 'One Marylebone', nameCn: '马里波恩一号', image: 'https://www.amarantelondon.com/cdn/shop/files/One-Marylebone-Wedding-Venue.jpg?v=1758880951' },
    { name: 'Hampton Court Castle', nameCn: '汉普顿宫城堡', image: 'https://www.amarantelondon.com/cdn/shop/files/Hampton_Court_Castle_Wedding_Venue.jpg?v=1759122792' },
  ],

  // ===== 婚礼故事案例 =====
  weddingStories: [
    { venue: 'The Waldorf Hilton', venueCn: '华尔道夫希尔顿', tagline: 'BENEATH A BREATHTAKING FLORAL ARCH', taglineCn: '令人屏息的花拱之下', image: 'https://www.amarantelondon.com/cdn/shop/files/waldorf_hilton_hotel_wedding_venue_1.jpg?v=1759133024&width=2000' },
    { venue: 'Kew Gardens', venueCn: '邱园', tagline: 'A SPRINGTIME BLOOM OF TRADITION', taglineCn: '春日传统的绽放', image: 'https://www.amarantelondon.com/cdn/shop/files/Dishani_wedding.webp?v=1759238910&width=1169' },
    { venue: 'One Marylebone', venueCn: '马里波恩一号', tagline: 'THEIR FIRST STEPS TOWARD FOREVER', taglineCn: '走向永恒的第一步', image: 'https://www.amarantelondon.com/cdn/shop/files/One-Marylebone-Wedding-Venue.jpg?v=1758880951&width=1530' },
    { venue: 'Hampton Court Castle', venueCn: '汉普顿宫城堡', tagline: 'LOVE SEALED IN A FAIRYTALE SETTING', taglineCn: '童话场景中的爱情封印', image: 'https://www.amarantelondon.com/cdn/shop/files/hampton_court_castle_wedding_venue_main.jpg?v=1759239315&width=2000' },
  ],

  // ===== 鲜花产品 =====
  freshFlowerProducts: [
    { slug: 'soleil', name: 'Soleil', nameCn: '日光', price: 105, priceFrom: true, category: '鲜花花束' },
    { slug: 'riviera', name: 'Riviera', nameCn: '里维埃拉', price: 125, priceFrom: true, category: '鲜花花束' },
    { slug: 'electra', name: 'Electra', nameCn: '艾蕾克特拉', price: 95, priceFrom: true, category: '鲜花花束' },
    { slug: 'sienna', name: 'Sienna', nameCn: '锡耶纳', price: 90, priceFrom: true, category: '鲜花花束' },
    { slug: 'eden', name: 'Eden', nameCn: '伊甸', price: 90, priceFrom: true, category: '鲜花花束' },
    { slug: 'beloved', name: 'Beloved', nameCn: '挚爱', price: 115, priceFrom: true, category: '鲜花花束' },
    { slug: 'rosa', name: 'Rosa', nameCn: '罗莎', price: 130, priceFrom: true, category: '鲜花花束' },
    { slug: 'selene', name: 'Selene', nameCn: '塞勒涅', price: 95, priceFrom: true, category: '鲜花花束' },
    { slug: 'aurora', name: 'Aurora', nameCn: '极光', price: 90, priceFrom: true, category: '鲜花花束' },
    { slug: 'hera', name: 'Hera', nameCn: '赫拉', price: 90, priceFrom: true, category: '鲜花花束' },
    { slug: 'velvet-initial', name: 'Velvet with Initial', nameCn: '丝绒字母玫瑰', price: 225, priceFrom: true, category: '鲜花花束' },
    { slug: 'velvet-rose', name: 'Velvet Rose', nameCn: '丝绒玫瑰', price: 90, priceFrom: true, category: '鲜花花束' },
    { slug: 'celeste', name: 'Celeste Pink Lily', nameCn: '天蓝粉百合', price: 65, priceFrom: true, category: '鲜花花束' },
    { slug: 'florist-choice', name: 'Florist Choice', nameCn: '花艺师精选', price: 55, priceFrom: true, category: '鲜花花束' },
    { slug: 'bespoke', name: 'Bespoke Arrangements', nameCn: '定制花艺', price: 0, priceFrom: false, category: '定制' },
  ],

  // ===== 永生玫瑰产品 =====
  infinityRoseProducts: [
    { slug: 'ir-single', name: 'Single Infinity Rose', nameCn: '单支永生玫瑰', price: 45, sizes: ['Red', 'White', 'Light Pink'] },
    { slug: 'ir-small-black-square', name: 'Small Black Square', nameCn: '小号黑色方盒', price: 75 },
    { slug: 'ir-small-white-square', name: 'Small White Square', nameCn: '小号白色方盒', price: 75 },
    { slug: 'ir-medium-black-round', name: 'Medium Black Round', nameCn: '中号黑色圆盒', price: 150 },
    { slug: 'ir-medium-white-round', name: 'Medium White Round', nameCn: '中号白色圆盒', price: 125 },
    { slug: 'ir-large-black-round', name: 'Large Black Round', nameCn: '大号黑色圆盒', price: 225 },
    { slug: 'ir-large-pink-round', name: 'Large Pink Round', nameCn: '大号粉色圆盒', price: 225 },
    { slug: 'ir-xl-black-square', name: 'Extra Large Black Square', nameCn: '特大黑色方盒', price: 325 },
    { slug: 'ir-deluxe-80-100', name: '80-100 Roses Deluxe Square', nameCn: '80-100支豪华方盒', price: 625 },
    { slug: 'ir-super-deluxe-85-100', name: '85-100 Roses Super Deluxe Round', nameCn: '85-100支超级豪华圆盒', price: 825 },
    { slug: 'ir-ultimate-140', name: '140 Roses Ultimate Deluxe', nameCn: '140支至臻豪华盒', price: 1295 },
  ],

  // ===== 评价 =====
  testimonials: [
    {
      couple: 'Dishani',
      text: 'Hiring Amarante for our two day wedding event - one of the best decisions we have made. We met with the team with a very specific vision of what we wanted, they seamlessly created illustrations of every aspect we had discussed in a way that we were able to truly visualise the look.',
      textCn: '为两天的婚礼聘请 Amarante 是我们做过的最好决定之一。我们与团队分享了非常具体的愿景，他们无缝地为每个方面创建了插图，让我们能真正看到最终效果。',
    },
    {
      couple: 'Maryam',
      text: 'We used Amarante extensively throughout our wedding. Every detail was perfect and nothing was overlooked. I was able to relax throughout the entire process knowing that everything was taken care of by the team. I could not recommend this supplier more!',
      textCn: '我们在婚礼中大量使用了 Amarante 的服务。每个细节都完美无缺，没有任何遗漏。整个过程我都能安心放松，强烈推荐！',
    },
    {
      couple: 'Cait',
      text: 'I cannot thank the team at Amarante enough for all of their help and amazing creative design. All of our wedding guests commented on how amazing they looked and our videographer noted how unique they looked.',
      textCn: '非常感谢 Amarante 团队的帮助和出色的创意设计。所有婚礼宾客都称赞花艺有多美，摄影师也注意到它们有多独特。',
    },
    {
      couple: 'Tracy',
      text: 'I was nervous about ordering flowers for my wedding bouquet online, but I shouldn\'t have been. The bridal dried flower arrangement came boxed up beautifully and I instantly fell in love.',
      textCn: '我本来很紧张要在网上订购婚礼花束，但完全不必担心。新娘干花作品包装精美地送达，我立刻爱上了。',
    },
  ],

  // ===== 常见问题 =====
  faq: [
    { q: 'What makes Amarante\'s flowers luxury?', qCn: '什么让 Amarante 的花属于奢华级别？', a: 'Every bouquet is hand-tied to order in our London studio from carefully sourced seasonal flowers, by the same team behind our work for leading luxury brands.', aCn: '每个花束都在伦敦工作室按订单手工扎制，使用精心采购的当季鲜花，由为顶级奢华品牌服务的同一团队制作。' },
    { q: 'How long will my flowers last?', qCn: '鲜花能保持多久？', a: 'With fresh water and a cool spot out of direct sun, expect around 5–7 days. Every stem is conditioned in our studio before it\'s sent.', aCn: '在清水和避免阳光直射的凉爽位置，预计可保持约5-7天。每枝花在送出前都经过专业处理。' },
    { q: 'Do you offer same-day delivery in London?', qCn: '伦敦提供当日送达吗？', a: 'Yes. Order by 1pm for same-day hand-delivery across London, seven days a week.', aCn: '是的。下午1点前下单，每周七天伦敦全区手工送达。' },
    { q: 'What makes Amarante different from traditional wedding planners?', qCn: '与传统婚礼策划师有什么不同？', a: 'Most wedding planners coordinate external vendors with markups. As a production house, we execute the design ourselves — transparent pricing without hidden commissions.', aCn: '大多数策划师协调外部供应商并加价。作为制作工作室，我们自行执行设计——透明定价，没有隐藏佣金。' },
    { q: 'Can you work with our chosen venue?', qCn: '能在我们选择的场地工作吗？', a: 'Absolutely. We hold preferred relationships with prestigious London wedding venues and are equally at home collaborating with any location.', aCn: '当然。我们与伦敦知名婚礼场地保持优先合作，也乐于在任何您心仪的场地合作。' },
  ],

  // ===== 婚礼作品集图片（20张） =====
  portfolioImages: [
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
  ],
}
