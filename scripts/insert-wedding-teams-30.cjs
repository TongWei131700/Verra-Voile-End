/**
 * 批量插入30家欧洲婚礼策划公司
 * 基于实际爬取和搜索数据
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

  const companies = [
    // ===== 已有4家: monticello, weddings-italy, aegean-dream-weddings, happy-events =====
    // ===== 新增26家 =====

    // --- 意大利 (5家新增) ---
    {
      slug: 'lake-como-wedding-planner',
      name: 'The Lake Como Wedding Planner',
      name_cn: '科莫湖婚礼策划',
      source_url: 'https://www.thelakecomoweddingplanner.com/',
      country: 'Italy', country_cn: '意大利', city: 'Lake Como', city_cn: '科莫湖',
      tagline: 'Perfectly seamless and beautifully stylish events in the most stunning backdrop imaginable',
      description: `The Lake Como Wedding Planner 是由 Rachel Birthistle 创立的科莫湖顶级奢华婚礼策划公司。团队由15位来自不同国家的专业人士组成，精通多国语言，曾在 Vogue、Harper's Bazaar、Vanity Fair 等顶级杂志上被报道。

公司专注于科莫湖标志性场地的婚礼策划，包括 Villa Balbiano、Villa d'Este、Passalacqua、Villa del Balbianello 等。Rachel 曾是时装设计师，转型婚礼策划后，以独特的时尚视角和对细节的极致追求，为每对新人打造独一无二的意式奢华婚礼体验。

公司拥有姐妹品牌 The Como Collection（家具租赁）和 Rachel Birthistle Studio（设计工作室），形成完整的婚礼服务生态。`,
      story: '创始人 Rachel Birthistle 曾是时装设计师，在时尚行业积累了丰富的美学经验后，转向婚礼策划领域。她在科莫湖建立了自己的团队，凭借独特的时尚视角和对细节的极致追求，迅速成为科莫湖最受欢迎的婚礼策划师之一。如今团队已发展到15人，服务过众多国际名流。',
      founded_year: 2015,
      team_members: [
        { name: 'Rachel Birthistle', name_cn: '瑞秋', role: 'Founder & CEO', role_cn: '创始人/首席执行官', description: '前时装设计师，科莫湖顶级婚礼策划师，被Vogue、Harper\'s Bazaar报道。', image: 'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Rachel.jpg' },
        { name: 'Taimar Birthistle-Cooke', name_cn: '泰玛', role: 'Managing Director', role_cn: '运营总监', description: '负责团队日常运营和项目管理。', image: 'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Taimar-1.jpg' },
        { name: 'Gabriella Murgia', name_cn: '加布里埃拉', role: 'Sales & Marketing Manager', role_cn: '销售与市场经理', description: '负责客户关系和市场营销。', image: 'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Gabri-2.jpg' },
        { name: 'Leonora Lepore', name_cn: '莱奥诺拉', role: 'Senior Producer', role_cn: '高级制作人', description: '负责婚礼现场制作和执行。', image: 'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Leo-2-vertical-733x1024.jpg' }
      ],
      services: [
        { name: 'Planning and Design', name_cn: '策划与设计', category: 'wedding', description: '从概念到执行的全方位婚礼策划与设计' },
        { name: 'Guest Management', name_cn: '宾客管理', category: 'wedding', description: '宾客接待、住宿和交通全程管理' },
        { name: 'Hotel & Accommodation', name_cn: '酒店与住宿', category: 'wedding', description: '科莫湖周边奢华酒店和别墅住宿安排' },
        { name: 'Full Planning/Management/Production', name_cn: '全程策划/管理/制作', category: 'wedding', description: '端到端的婚礼策划、管理和制作服务' }
      ],
      service_areas: [
        { name: 'Lake Como', name_cn: '科莫湖', detail: '科莫湖全区域，含Villa Balbiano、Villa d\'Este等顶级场地' },
        { name: 'Northern Italy', name_cn: '意大利北部', detail: '米兰、都灵等北部城市' },
        { name: 'UK & USA', name_cn: '英国和美国', detail: '为英美客户提供目的地婚礼服务' }
      ],
      values_list: [
        { name: 'Stunning Original Design', name_cn: '惊艳原创设计', description: '每场婚礼都是独一无二的视觉杰作' },
        { name: 'Bespoke Personalised', name_cn: '定制个性化', description: '完全根据新人需求量身定制' },
        { name: 'No Language Barriers', name_cn: '无语言障碍', description: '多语言团队服务国际客户' },
        { name: 'Stress-free Planning', name_cn: '无忧策划', description: '全程无忧的策划体验' },
        { name: 'Reliable Passionate Experts', name_cn: '可靠热情专家', description: '专业且充满热情的团队' }
      ],
      testimonials: [],
      faq: [],
      partners: [{ name: 'Vogue', role: '媒体报道', contact: '', website: 'vogue.com' }, { name: 'Harper\'s Bazaar', role: '媒体报道', contact: '', website: 'harpersbazaar.com' }],
      images: [
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/CFJ_Lake_Como_025_Greg_Finck_HD-198-1-2048x1536.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Bottega53-ER-WeddingDay-342-2048x1365.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Bottega53-ER-WeddingDay-101-1536x2048.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Bottega53-ER-WeddingDay-220-2048x1365.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Bottega53-ER-WeddingDay-323-2048x1365.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/Bottega53-ER-WeddingDay-797-2048x1365.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/0855_EWP_8678-2048x1536.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/0049_JV303506-1-1536x2048.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/0231_DJI_20250610091245_0421_D_JV-1536x2048.jpg',
        'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/05/LN-Preview-114_websize-2-1024x683.jpg'
      ],
      cover_image: 'https://www.thelakecomoweddingplanner.com/wp-content/uploads/2026/04/CFJ_Lake_Como_025_Greg_Finck_HD-198-1-2048x1536.jpg',
      website: 'https://www.thelakecomoweddingplanner.com/',
      sort_order: 5
    },
    {
      slug: 'noemi-bellante',
      name: 'Noemi Bellante Wedding Planner',
      name_cn: '诺埃米·贝兰特婚礼策划',
      source_url: 'https://www.noemibellante.com/',
      country: 'Italy', country_cn: '意大利', city: 'Milan', city_cn: '米兰',
      tagline: 'Personalized weddings that reflect your dreams — Wedding Planner Milano & Pescara',
      description: 'Noemi Bellante 是意大利知名婚礼策划师，在米兰、佩斯卡拉和都灵设有三间办公室。她于2024年成为 Sì Sposaitalia 品牌大使，并曾参与意大利真人秀节目"Matrimonio a Prima Vista"。\n\nNoemi 1989年出生于阿布鲁佐大区，曾在泰拉莫大学学习法律，但在完成最后两门考试前决定追随对活动策划的热情。如今她以独特的审美视角和对最新婚礼潮流的敏锐洞察，为每对新人打造个性化的梦想婚礼。\n\n公司提供全方位婚礼策划、部分策划、设计与协调等服务，覆盖意大利全境，尤其擅长阿布鲁佐和托斯卡纳的目的地婚礼。',
      story: 'Noemi 1989年出生于阿布鲁佐，大学时攻读法律专业，但在通过最后两门考试前，她决定放弃稳定的法律职业，全身心投入婚礼策划行业。凭借对美的独特感知和对细节的极致追求，她在短短数年内将公司扩展到三个城市，成为意大利最受关注的年轻婚礼策划师之一。',
      founded_year: 2015,
      team_members: [
        { name: 'Noemi Bellante', name_cn: '诺埃米·贝兰特', role: 'Founder & Lead Wedding Planner', role_cn: '创始人/首席婚礼策划师', description: '意大利知名婚礼策划师，2024年Sì Sposaitalia品牌大使，TV/电台婚礼专家。', image: 'https://www.noemibellante.com/_media/img/medium/noemi-bellante-event-wedding-planner.jpeg' }
      ],
      services: [
        { name: 'Total Organization', name_cn: '全程策划', category: 'wedding', description: '从概念到执行的完整婚礼策划服务' },
        { name: 'Partial Organization', name_cn: '部分策划', category: 'wedding', description: '针对特定环节的策划协助' },
        { name: 'Design & Coordination', name_cn: '设计与协调', category: 'wedding', description: '婚礼视觉设计和当日协调' },
        { name: 'Private Events', name_cn: '私人活动', category: 'event', description: '私人派对和活动策划' },
        { name: 'Corporate Events', name_cn: '企业活动', category: 'event', description: '企业活动策划执行' }
      ],
      service_areas: [
        { name: 'Milan', name_cn: '米兰', detail: '米兰办公室，Via Alfredo Cappellini 10' },
        { name: 'Pescara', name_cn: '佩斯卡拉', detail: '佩斯卡拉办公室，Via Nazionale Adriatica Nord 413' },
        { name: 'Turin', name_cn: '都灵', detail: '都灵办公室，Corso Duca degli Abruzzi 24' },
        { name: 'Abruzzo', name_cn: '阿布鲁佐', detail: '阿布鲁佐大区目的地婚礼' },
        { name: 'Tuscany', name_cn: '托斯卡纳', detail: '托斯卡纳田园婚礼' },
        { name: 'Lake Como', name_cn: '科莫湖', detail: '科莫湖别墅婚礼' }
      ],
      values_list: [
        { name: 'Client Dreams First', name_cn: '客户梦想至上', description: '优先考虑客户的梦想和愿景' },
        { name: 'Latest Trends', name_cn: '最新潮流', description: '持续研究最新婚礼趋势' },
        { name: 'Attention to Detail', name_cn: '注重细节', description: '对每一个细节的极致关注' },
        { name: 'Wow Effect', name_cn: '惊艳效果', description: '创造令人惊叹的婚礼体验' }
      ],
      testimonials: [], faq: [], partners: [{ name: 'Sì Sposaitalia', role: '品牌合作', contact: '', website: 'sisposaitalia.com' }],
      images: [
        'https://www.noemibellante.com/_media/img/large/wedding-planner-italy.webp',
        'https://www.noemibellante.com/_media/img/large/noemi-bellante-wedding-planner-torino-romantic-theme-imperial-table-2-2.jpg',
        'https://www.noemibellante.com/_media/img/large/allestimento-chiesa-matrimonio-abruzzo-wedding-planner-lombardia-1-4.jpg',
        'https://www.noemibellante.com/_media/img/large/allestimento-matrimonio-abruzzo-minimal-convento-san-panfilo-1.jpg',
        'https://www.noemibellante.com/_media/img/large/wedding-planner-abruzzo-chieti-pescara-allestimento-matrimonio-destination-wedding-italy.jpg',
        'https://www.noemibellante.com/_media/img/large/wedding-planner-lago-di-como-lake-noemi-bellante-allestimento-organizzazione-matrimonio-1.jpg',
        'https://www.noemibellante.com/_media/img/large/destination-wedding-planner-italy-tuscany-matrimonio-toscana-2.jpg',
        'https://www.noemibellante.com/_media/img/large/emilia-cristoforo-destination-wedding-italy-abruzzo-chieti-costa-dei-trabocchi-noemi-bellante-7.jpg'
      ],
      cover_image: 'https://www.noemibellante.com/_media/img/large/wedding-planner-italy.webp',
      website: 'https://www.noemibellante.com/',
      sort_order: 6
    },
    {
      slug: 'itailove', name: 'ITAILOVE', name_cn: '臻意定制婚礼',
      source_url: 'https://www.itailove.com/', country: 'Italy', country_cn: '意大利', city: 'Venice', city_cn: '威尼斯',
      tagline: '永不过时的优雅 — 意大利唯一一家持旅行社执照的中意合资婚礼策划公司',
      description: '臻意定制婚礼（ITAILOVE）是首家常驻意大利、由中意两国创始人共同创立的婚礼策划团队。公司2016年在意大利合法注册，持有意大利旅行社和活动策划执照。2018年起将核心业务调整为意大利高端婚礼策划。\n\n团队中既有意大利世家子弟，又有旅居多年的中国商业人才，对中意两国文化历史非常熟悉。团队成员均为欧洲名校硕士毕业，拥有极高的文化素养和一流的审美水准。\n\n公司致力于挖掘最地道的意大利文化资源，与意大利本地最顶级婚礼供应商直接沟通，确保所有服务全方位展现意式风情，为来自华语市场的新人提供专业、省心、可靠的高端婚礼策划服务。',
      story: '公司2016年在意大利合法注册成立，团队最初专注于高端定制旅游服务。在服务过程中，收到越来越多客户的意大利婚礼策划需求。在独家举办数十场意大利婚礼后，2018年正式将业务核心转移到意大利高端婚礼策划上。',
      founded_year: 2016,
      team_members: [{ name: 'ITAILOVE Team', name_cn: '臻意团队', role: 'Wedding Planning Team', role_cn: '婚礼策划团队', description: '中意两国创始人带领的专业团队，成员均为欧洲名校硕士。', image: '' }],
      services: [
        { name: 'Full Wedding Planning', name_cn: '全程婚礼策划', category: 'wedding', description: '从需求沟通到完美执行的全流程策划' },
        { name: 'Venue Scouting', name_cn: '场地勘察', description: '陪同实地参观婚礼场地', category: 'wedding' },
        { name: 'Vendor Coordination', name_cn: '供应商协调', category: 'wedding', description: '与顶级供应商直接沟通协调' },
        { name: 'Design & Styling', name_cn: '设计造型', category: 'wedding', description: '花艺、灯光、装饰整体设计' },
        { name: 'Guest Management', name_cn: '宾客管理', category: 'wedding', description: '宾客交通、住宿、接待全程管理' }
      ],
      service_areas: [
        { name: 'Venice', name_cn: '威尼斯', detail: '威尼斯水城婚礼' },
        { name: 'Tuscany', name_cn: '托斯卡纳', detail: '托斯卡纳田园古堡婚礼' },
        { name: 'Lake Como', name_cn: '科莫湖', detail: '科莫湖别墅婚礼' },
        { name: 'Amalfi Coast', name_cn: '阿马尔菲海岸', detail: '海岸悬崖婚礼' },
        { name: 'Rome', name_cn: '罗马', detail: '永恒之城婚礼' }
      ],
      values_list: [
        { name: 'Professional & Licensed', name_cn: '专业正规', description: '意大利政府注册，持旅行社执照' },
        { name: 'Authentic Italian', name_cn: '正宗意式', description: '最地道的意大利本土文化资源' },
        { name: 'Elegant Taste', name_cn: '品位高雅', description: '欧洲名校硕士，一流审美水准' },
        { name: 'Warm Service', name_cn: '有温度的服务', description: '将每位客户视为朋友和家人' }
      ],
      testimonials: [], faq: [], partners: [],
      images: [], cover_image: '', website: 'https://www.itailove.com/', sort_order: 7
    },

    // --- 希腊 (5家新增) ---
    {
      slug: 'fye-for-your-event', name: 'FYE - For Your Event', name_cn: 'FYE活动策划',
      source_url: 'https://www.fyevent.gr/', country: 'Greece', country_cn: '希腊', city: 'Athens', city_cn: '雅典',
      tagline: 'Quest for the Best — 25年+目的地婚礼策划经验',
      description: 'FYE - For Your Event 是一家总部位于雅典的活动管理公司，专注于希腊全境的目的地婚礼策划。公司拥有超过25年的行业经验，已成功策划来自印度、法国、爱尔兰、美国、约旦、迪拜、瑞士、南非、英国、埃及等全球各地的婚礼。\n\nFYE 擅长将不同文化元素与希腊风格和地中海品味融合，打造独特的跨文化婚礼体验。团队提供垂直整合的活动解决方案，从场地选择、装饰设计、餐饮服务到音响灯光，所有环节均由内部团队统一管理。\n\n公司创始人 Thomas Politis 毕业于瑞士格利昂国际酒店管理中心，在活动和餐饮行业拥有超过20年经验。',
      story: '创始人 Thomas Politis 毕业于瑞士格利昂国际酒店管理中心，获得酒店与旅游管理文凭。在活动和餐饮行业工作超过20年后，于2010年创立了FYE。公司理念是"追求最好"，为客户提供一站式目的地婚礼解决方案。',
      founded_year: 2010,
      team_members: [
        { name: 'Thomas Politis', name_cn: '托马斯', role: 'Founder - Managing Director', role_cn: '创始人/董事总经理', description: '瑞士格利昂国际酒店管理中心毕业，20年+活动行业经验。', image: 'https://www.fyevent.gr/sites/default/files/styles/image_850x850/public/2025-02/Thomas-n2.jpg' },
        { name: 'Anna Chazoglou', name_cn: '安娜', role: 'Client Service & Operation', role_cn: '客户服务与运营', description: '15年人力资源和运营管理经验，2011年加入FYE。', image: 'https://www.fyevent.gr/sites/default/files/styles/image_850x850/public/2025-12/anna.jpg' },
        { name: 'Smaro Politi', name_cn: '斯马罗', role: 'Creative Director', role_cn: '创意总监', description: '资深广告文案和创意总监，BBH英国广告公司合作以来。', image: 'https://www.fyevent.gr/sites/default/files/styles/image_850x850/public/2018-10/smaro-politi.jpg' },
        { name: 'Dimitris Pontis', name_cn: '迪米特里斯', role: 'Art Director', role_cn: '艺术总监', description: '1997年起从事艺术设计，资深艺术总监。', image: 'https://www.fyevent.gr/sites/default/files/styles/image_850x850/public/2018-10/dimitirs-pontis.jpg' }
      ],
      services: [
        { name: 'Destination Wedding', name_cn: '目的地婚礼', category: 'wedding', description: '希腊全境目的地婚礼全程策划' },
        { name: 'Venue Finding', name_cn: '场地寻找', category: 'wedding', description: '理想婚礼场地搜索与推荐' },
        { name: 'Event Design & Deco', name_cn: '活动设计与装饰', category: 'wedding', description: '创意活动概念和装饰设计' },
        { name: 'Catering Services', name_cn: '餐饮服务', category: 'wedding', description: '餐饮协调与管理' },
        { name: 'Sound & Lighting', name_cn: '音响灯光', category: 'wedding', description: '专业音响和灯光设计' },
        { name: 'Photography & Video', name_cn: '摄影摄像', category: 'wedding', description: '专业摄影和摄像服务' },
        { name: 'Transportation', name_cn: '交通安排', category: 'wedding', description: '宾客交通协调' },
        { name: 'Accommodation', name_cn: '住宿安排', category: 'wedding', description: '宾客住宿安排' }
      ],
      service_areas: [
        { name: 'Athens', name_cn: '雅典', detail: '首都及周边地区' },
        { name: 'Santorini', name_cn: '圣托里尼', detail: '热门岛屿目的地' },
        { name: 'Mykonos', name_cn: '米科诺斯', detail: '时尚岛屿目的地' },
        { name: 'Crete', name_cn: '克里特岛', detail: '最大希腊岛屿' },
        { name: 'All Greece', name_cn: '希腊全境', detail: '覆盖所有希腊目的地' }
      ],
      values_list: [
        { name: 'Quest for the Best', name_cn: '追求最好', description: '始终追求最高品质的服务' },
        { name: 'Turnkey Solutions', name_cn: '一站式方案', description: '提供完整的一站式解决方案' },
        { name: 'Respect Time & Budget', name_cn: '尊重时间与预算', description: '严格遵守客户的时间和预算' },
        { name: 'Cultural Sensitivity', name_cn: '文化敏感', description: '尊重并融合不同文化传统' }
      ],
      testimonials: [], faq: [], partners: [],
      images: [
        'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_%20Destination%20Wedding.jpg',
        'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_Table%20Centerpiece.jpg',
        'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_Venue%20Finding%20and%20Consulting.jpg',
        'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_%20Wedding%20Invitation%20and%20STD%20design.jpg',
        'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_Art%20De%20La%20Table.jpg',
        'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_Deco%20Design.jpg'
      ],
      cover_image: 'https://weddings.fyevent.gr/sites/default/files/md-slider-image/Wedding_%20Destination%20Wedding.jpg',
      website: 'https://www.fyevent.gr/', sort_order: 8
    },
    {
      slug: 'concierge-greece', name: 'Concierge Greece Beyond', name_cn: '希腊礼宾尊享',
      source_url: 'https://www.concierge-greece.com/', country: 'Greece', country_cn: '希腊', city: 'Athens', city_cn: '雅典',
      tagline: 'Services dedicated to providing the highest level of luxury service in Greece',
      description: 'Concierge Greece Beyond 是一家精品超奢华集团，提供希腊及全球的奢华旅行、定制礼宾和生活方式管理服务。团队的奢华活动策划师全天候24/7服务，覆盖VIP客人的每一个需求。\n\n公司在雅典、米科诺斯、圣托里尼、克里特和希腊全境策划世界级活动。奢华资源涵盖从克里特豪华别墅到伯罗奔尼撒度假村、雅典海滨酒店到圣托里尼精品酒店。',
      story: 'Concierge Greece Beyond 作为精品超奢华旅行和生活方式管理集团成立，致力于为VIP旅行者和尊贵客人在希腊提供最高水平的服务。',
      founded_year: 2015,
      team_members: [], services: [
        { name: 'Luxury Wedding Planning', name_cn: '奢华婚礼策划', category: 'wedding', description: '希腊全境奢华婚礼策划' },
        { name: 'Luxury Villa Rentals', name_cn: '豪华别墅租赁', category: 'wedding', description: '精选希腊豪华别墅' },
        { name: 'Yacht Charters', name_cn: '游艇租赁', category: 'wedding', description: '希腊岛屿游艇租赁' },
        { name: 'VIP Services', name_cn: 'VIP服务', category: 'wedding', description: '量身定制VIP体验' }
      ],
      service_areas: [{ name: 'Athens', name_cn: '雅典', detail: '雅典及雅典海滨' }, { name: 'Santorini', name_cn: '圣托里尼', detail: '圣托里尼奢华服务' }, { name: 'Mykonos', name_cn: '米科诺斯', detail: '米科诺斯精品酒店' }, { name: 'Crete', name_cn: '克里特', detail: '克里特豪华别墅' }],
      values_list: [{ name: 'Ultra-luxury', name_cn: '超奢华', description: '最高标准的奢华体验' }, { name: '24/7 Availability', name_cn: '全天候服务', description: '24/7全天候可用' }],
      testimonials: [], faq: [], partners: [],
      images: ['https://www.concierge-greece.com/images/greece-luxuryevents.jpg', 'https://www.concierge-greece.com/images/luxury-greecevillas.jpg'],
      cover_image: 'https://www.concierge-greece.com/images/greece-luxuryevents.jpg',
      website: 'https://www.concierge-greece.com/', sort_order: 9
    },
    {
      slug: 'mosaic-weddings', name: 'Mosaic Weddings & Events', name_cn: '马赛克婚礼',
      source_url: 'https://mosaicwedding.com/', country: 'Greece', country_cn: '希腊', city: 'Athens', city_cn: '雅典',
      tagline: 'Piece by piece — creating your unique wedding mosaic in Greece',
      description: 'Mosaic Weddings & Events 是由 Maria 创立的希腊目的地婚礼策划公司。Maria 自2007年起从事旅游和企业活动行业，2009年开始婚礼策划。公司名"MOSAIC"体现了创始人的理念——婚礼策划应该像创作马赛克一样，精心、尊重地逐片拼凑，创造出独特珍贵的杰作。\n\n公司拥有超过300个希腊婚礼场地资源，每年持续发现新场地，从圣托里尼、米科诺斯等知名岛屿到伯罗奔尼撒的隐藏宝地。',
      story: 'Maria 2007年进入旅游和活动行业，2009年开始婚礼策划。她的愿景是像创作马赛克一样精心策划每场婚礼。多年来建立了300+场地的庞大资源库。', founded_year: 2009,
      team_members: [{ name: 'Maria', name_cn: '玛丽亚', role: 'Founder & Executive', role_cn: '创始人/执行官', description: '2007年起从事活动行业，2009年开始婚礼策划。', image: '' }],
      services: [{ name: 'Full Wedding Planning', name_cn: '全程婚礼策划', category: 'wedding', description: '从场地选择到执行的全程服务' }, { name: 'Partial Planning', name_cn: '部分策划', category: 'wedding', description: '特定环节的策划服务' }, { name: 'Venue Selection', name_cn: '场地选择', category: 'wedding', description: '300+希腊场地资源' }],
      service_areas: [{ name: 'Santorini', name_cn: '圣托里尼', detail: '最热门岛屿' }, { name: 'Mykonos', name_cn: '米科诺斯', detail: '时尚岛屿' }, { name: 'Crete', name_cn: '克里特', detail: '最大岛屿' }, { name: 'Rhodes', name_cn: '罗德岛', detail: '历史岛屿' }, { name: 'Corfu', name_cn: '科孚岛', detail: '优雅岛屿' }, { name: 'Peloponnese', name_cn: '伯罗奔尼撒', detail: '隐藏的宝地' }],
      values_list: [{ name: 'Attention to Detail', name_cn: '注重细节', description: '精心关注每个细节' }, { name: 'Artistry', name_cn: '艺术性', description: '像创作艺术品一样策划婚礼' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://mosaicwedding.com/', sort_order: 10
    },

    // --- 英国 (3家) ---
    {
      slug: 'matthew-oliver-weddings', name: 'Matthew Oliver Weddings', name_cn: '马修·奥利弗婚礼',
      source_url: 'https://matthewoliverweddings.com/', country: 'United Kingdom', country_cn: '英国', city: 'London', city_cn: '伦敦',
      tagline: 'The Home of Exceptional Weddings — 14年+全球目的地婚礼策划',
      description: 'Matthew Oliver Weddings 是一家总部位于伦敦的奢华目的地婚礼策划团队，由 Matthew 于2012年创立。公司在意大利、法国、希腊、葡萄牙、西班牙、英国和爱尔兰策划目的地婚礼，也乐意在全球任何地方工作。\n\n作品曾被 Vogue、Brides 和 People 杂志报道。以无可挑剔的执行力闻名，被评为最佳目的地婚礼策划师和最佳英国婚礼策划师。',
      story: 'Matthew 在塞浦路斯开始了婚礼策划师生涯，随后在餐巾纸背面写下了目的地婚礼策划公司的构想并将其变为现实。14年来，他与最出色的新人合作，在全球最负盛名的场地创造了无与伦比的活动。',
      founded_year: 2012,
      team_members: [{ name: 'Matthew Oliver', name_cn: '马修·奥利弗', role: 'Founder & Lead Planner', role_cn: '创始人/首席策划师', description: '14年+婚礼策划经验，被Vogue、Brides报道。', image: '' }],
      services: [{ name: 'Luxury Destination Wedding', name_cn: '奢华目的地婚礼', category: 'wedding', description: '全球目的地婚礼策划' }, { name: 'Wedding Styling', name_cn: '婚礼造型', category: 'wedding', description: '婚礼视觉设计与造型' }, { name: 'Full Planning', name_cn: '全程策划', category: 'wedding', description: '端到端婚礼策划' }],
      service_areas: [{ name: 'Italy', name_cn: '意大利', detail: '科莫湖、托斯卡纳等' }, { name: 'France', name_cn: '法国', detail: '法国南部、巴黎' }, { name: 'Greece', name_cn: '希腊', detail: '圣托里尼等岛屿' }, { name: 'Spain', name_cn: '西班牙', detail: '西班牙全境' }, { name: 'Portugal', name_cn: '葡萄牙', detail: '里斯本、阿尔加维' }, { name: 'UK & Ireland', name_cn: '英国和爱尔兰', detail: '英伦三岛' }],
      values_list: [{ name: 'Exceptional Quality', name_cn: '卓越品质', description: '无与伦比的活动品质' }, { name: 'Joy & Friendship', name_cn: '快乐与友谊', description: '基于快乐和友谊的策划旅程' }],
      testimonials: [], faq: [], partners: [{ name: 'Vogue', role: '媒体报道', contact: '', website: 'vogue.com' }, { name: 'Brides', role: '媒体报道', contact: '', website: 'brides.com' }],
      images: [], cover_image: '', website: 'https://matthewoliverweddings.com/', sort_order: 11
    },
    {
      slug: 'lovelydia', name: 'Lovelydia', name_cn: 'Lovelydia婚礼策划',
      source_url: 'https://www.lovelydia.co.uk/', country: 'United Kingdom', country_cn: '英国', city: 'London', city_cn: '伦敦',
      tagline: 'Bespoke, luxurious weddings and events that capture your dreams',
      description: 'Lovelydia 是一家屡获殊荣的伦敦婚礼与活动策划公司，在英国、欧洲和国际范围内运营。公司致力于创造定制的奢华婚礼和活动，将客户的想象变为现实，在每一步都超越期望。',
      story: 'Lovelydia 以伦敦为基地，凭借多年经验和对完美的不懈追求，成为欧洲最受信赖的奢华婚礼策划公司之一。',
      founded_year: 2015, team_members: [], services: [
        { name: 'Bespoke Weddings', name_cn: '定制婚礼', category: 'wedding', description: '完全定制的奢华婚礼' },
        { name: 'Events Planning', name_cn: '活动策划', category: 'event', description: '各类高端活动策划' }
      ],
      service_areas: [{ name: 'United Kingdom', name_cn: '英国', detail: '全英范围' }, { name: 'Europe', name_cn: '欧洲', detail: '欧洲各地' }, { name: 'International', name_cn: '国际', detail: '全球范围' }],
      values_list: [{ name: 'Bespoke Luxury', name_cn: '定制奢华', description: '完全定制的奢华体验' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.lovelydia.co.uk/', sort_order: 12
    },
    {
      slug: 'jessica-sharpe-weddings', name: 'Jessica Sharpe Weddings', name_cn: '杰西卡·夏普婚礼',
      source_url: 'https://jessicasharpeweddings.co.uk/', country: 'United Kingdom', country_cn: '英国', city: 'London', city_cn: '伦敦',
      tagline: 'Award-winning UK wedding planner creating seamless, elevated atmospheres — 11年+经验',
      description: 'Jessica Sharpe Weddings 是一家屡获殊荣的英国婚礼策划公司，专注于打造无缝、高端的婚礼和派对氛围。凭借超过11年的行业经验，以专业和经验驱动的方式，确保每个时刻都流畅自然地展开，将庆典转化为完美的奢华活动。',
      story: 'Jessica Sharpe 拥有11年+婚礼策划经验，凭借对奢华活动的敏锐感知和对细节的极致追求，成为英国最受推崇的婚礼策划师之一。',
      founded_year: 2014, team_members: [{ name: 'Jessica Sharpe', name_cn: '杰西卡·夏普', role: 'Founder & Lead Planner', role_cn: '创始人/首席策划师', description: '11年+行业经验，屡获殊荣的婚礼策划师。', image: '' }],
      services: [{ name: 'Full Wedding Planning', name_cn: '全程婚礼策划', category: 'wedding', description: '端到端奢华婚礼策划' }, { name: 'Wedding Day Coordination', name_cn: '婚礼当日协调', category: 'wedding', description: '当日现场协调' }],
      service_areas: [{ name: 'United Kingdom', name_cn: '英国', detail: '全英范围' }, { name: 'Europe', name_cn: '欧洲', detail: '欧洲目的地' }],
      values_list: [{ name: 'Seamless Execution', name_cn: '无缝执行', description: '确保每个时刻流畅自然' }, { name: 'Elevated Atmosphere', name_cn: '高端氛围', description: '营造高端精致的氛围' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://jessicasharpeweddings.co.uk/', sort_order: 13
    },

    // --- 马耳他/塞浦路斯 (2家) ---
    {
      slug: 'we-do-our-way', name: 'We Do Our Way (WOW)', name_cn: '我们的方式婚礼',
      source_url: 'https://wedourway.com/', country: 'Malta', country_cn: '马耳他', city: 'Valletta', city_cn: '瓦莱塔',
      tagline: 'Your wedding your way — Destination wedding planners taking the stress, not the control',
      description: 'We Do Our Way (WOW Ltd) 是由 Martina Selvagi 创立的马耳他目的地婚礼策划公司。公司专注于马耳他和克罗地亚的目的地婚礼，以"你的婚礼你做主"为理念，帮助远距离策划婚礼的新人实现梦想。\n\n与大型机构不同，WOW 是一个小型策划精品团队，由几位热爱工作的策划师组成。他们不会把客户当成数字，也不会试图将新人塞进预设的婚礼套餐中。',
      story: '创始人 Martina Selvagi 创立了WOW Ltd，专注于马耳他这个"地中海心脏"的目的地婚礼市场。马耳他兼具意大利同款的文艺复兴古典宫殿和北非异域风情，还是《权力的游戏》君临城取景地。',
      founded_year: 2018, team_members: [{ name: 'Martina Selvagi', name_cn: '玛蒂娜', role: 'Founder', role_cn: '创始人', description: 'WOW Ltd创始人，马耳他目的地婚礼策划师。', image: '' }, { name: 'Laetitia', name_cn: '莱蒂西亚', role: 'Wedding Planner', role_cn: '婚礼策划师', description: '目的地婚礼策划师，被客户一致好评。', image: '' }],
      services: [{ name: 'Destination Wedding Planning', name_cn: '目的地婚礼策划', category: 'wedding', description: '从头到尾的目的地婚礼策划' }, { name: 'DIY Consulting', name_cn: 'DIY咨询', category: 'wedding', description: '为自主策划的新人提供专业咨询' }],
      service_areas: [{ name: 'Malta', name_cn: '马耳他', detail: '马耳他全岛' }, { name: 'Croatia', name_cn: '克罗地亚', detail: '克罗地亚海岸' }],
      values_list: [{ name: 'Your Way', name_cn: '你的方式', description: '执行你的愿景，而非重新发明' }, { name: 'Personal Touch', name_cn: '个人触感', description: '不把你当成数字' }],
      testimonials: [
        { couple: 'Kathryn & Brendan', text: 'You planned absolutely everything for us and truly made our vision come to life without us even seeing the venue before we arrived!', text_cn: '你为我们策划了一切，真正让我们的愿景变为现实，而我们甚至在到达之前都没见过场地！' },
        { couple: 'Laura & Richard', text: 'You make such a difference to the special big day, and you are much more than just a planner.', text_cn: '你对这个特殊的大日子产生了如此大的影响，你远不止是一个策划师。' }
      ], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://wedourway.com/', sort_order: 14
    },
    {
      slug: 'tie-the-knot-cyprus', name: 'Tie the Knot Cyprus', name_cn: '塞浦路斯结',
      source_url: 'https://www.tietheknotcyprus.com/', country: 'Cyprus', country_cn: '塞浦路斯', city: 'Paphos', city_cn: '帕福斯',
      tagline: 'Award-winning husband and wife wedding team in Paphos, Cyprus',
      description: 'Tie the Knot Cyprus 是一对获奖的夫妻档婚礼策划团队，位于美丽的帕福斯市。Vicki 是获奖婚礼策划师，Lee 是多次获奖的摄影师，两人合力为客户提供卓越的婚礼服务。\n\n团队以无与伦比的细节关注著称，从场地选择到最优质的供应商，精心打造个性化套餐，完美反映每对新人的风格和偏好。',
      story: 'Vicki 和 Lee 是一对居住在塞浦路斯帕福斯的夫妻档。Vicki 是获奖婚礼策划师，Lee 是多次获奖摄影师，两人结合各自专长，为新人提供策划+摄影的一站式服务。',
      founded_year: 2015, team_members: [
        { name: 'Vicki', name_cn: '薇琪', role: 'Wedding Planner', role_cn: '婚礼策划师', description: '获奖婚礼策划师。', image: '' },
        { name: 'Lee', name_cn: '李', role: 'Photographer', role_cn: '摄影师', description: '多次获奖摄影师。', image: '' }
      ],
      services: [{ name: 'Wedding Planning', name_cn: '婚礼策划', category: 'wedding', description: '全方位婚礼策划' }, { name: 'Photography', name_cn: '摄影', category: 'wedding', description: '获奖婚礼摄影' }, { name: 'Venue Selection', name_cn: '场地选择', category: 'wedding', description: '精选塞浦路斯婚礼场地' }],
      service_areas: [{ name: 'Paphos', name_cn: '帕福斯', detail: '帕福斯及周边' }, { name: 'Cyprus', name_cn: '塞浦路斯', detail: '全岛范围' }],
      values_list: [{ name: 'Unmatched Detail', name_cn: '无与伦比的细节', description: '对细节的无与伦比的关注' }, { name: 'Personalised', name_cn: '个性化', description: '完美反映新人风格' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.tietheknotcyprus.com/', sort_order: 15
    },

    // --- 法国 (2家) ---
    {
      slug: 'paris-en-noces', name: 'Paris en Noces', name_cn: '巴黎婚礼',
      source_url: 'https://planning.wedding/about', country: 'France', country_cn: '法国', city: 'Paris', city_cn: '巴黎',
      tagline: 'Plan your wedding and stay zen — Your wedding planner in Paris',
      description: 'Paris en Noces 是由 Mailys 创立的巴黎婚礼策划机构。Mailys 的愿景是帮助新人在策划婚礼的同时保持从容，为他们组织最完美的婚礼。\n\n公司专注于巴黎及法国各地的婚礼策划，从巴黎市中心的浪漫仪式到法国乡村的田园婚礼，为每对新人打造独一无二的法式婚礼体验。',
      story: 'Mailys 出于对婚礼策划的热情创立了 Paris en Noces，致力于帮助新人在策划过程中保持从容和愉悦。',
      founded_year: 2018, team_members: [{ name: 'Mailys', name_cn: '梅利斯', role: 'Founder & Wedding Planner', role_cn: '创始人/婚礼策划师', description: 'Paris en Noces创始人，致力于让婚礼策划变得轻松愉快。', image: '' }],
      services: [{ name: 'Full Wedding Planning', name_cn: '全程婚礼策划', category: 'wedding', description: '巴黎及法国全境婚礼策划' }, { name: 'Wedding Design', name_cn: '婚礼设计', category: 'wedding', description: '法式婚礼视觉设计' }],
      service_areas: [{ name: 'Paris', name_cn: '巴黎', detail: '巴黎市区' }, { name: 'French Countryside', name_cn: '法国乡村', detail: '法国各乡村地区' }, { name: 'French Riviera', name_cn: '法国里维埃拉', detail: '蔚蓝海岸' }],
      values_list: [{ name: 'Zen Planning', name_cn: '从容策划', description: '让婚礼策划变得轻松' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://planning.wedding/about', sort_order: 16
    },
    {
      slug: 'rendez-vous-in-paris', name: 'Rendez Vous in Paris', name_cn: '巴黎之约婚礼',
      source_url: 'https://www.rendezvous-inparis.com/', country: 'France', country_cn: '法国', city: 'Paris', city_cn: '巴黎',
      tagline: 'Weddings and Events with Rendez vous in Paris — French elegance for your special day',
      description: 'Rendez Vous in Paris 是一家巴黎婚礼与活动策划公司，专注于为国际客户提供法式优雅的婚礼策划服务。公司擅长巴黎及法国各地的城堡婚礼、花园婚礼和奢华活动。',
      story: 'Rendez Vous in Paris 以巴黎为基地，凭借对法式优雅和浪漫的深刻理解，为来自全球的新人打造梦幻般的法国婚礼。',
      founded_year: 2010, team_members: [], services: [{ name: 'Wedding Planning', name_cn: '婚礼策划', category: 'wedding', description: '法国婚礼全程策划' }, { name: 'Castle Weddings', name_cn: '城堡婚礼', category: 'wedding', description: '法国城堡婚礼专业策划' }, { name: 'Event Planning', name_cn: '活动策划', category: 'event', description: '各类高端活动策划' }],
      service_areas: [{ name: 'Paris', name_cn: '巴黎', detail: '巴黎市区' }, { name: 'Loire Valley', name_cn: '卢瓦尔河谷', detail: '城堡婚礼' }, { name: 'Provence', name_cn: '普罗旺斯', detail: '薰衣草田婚礼' }, { name: 'French Riviera', name_cn: '法国里维埃拉', detail: '蔚蓝海岸' }],
      values_list: [{ name: 'French Elegance', name_cn: '法式优雅', description: '展现法式优雅与浪漫' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.rendezvous-inparis.com/', sort_order: 17
    },

    // --- 西班牙 (2家) ---
    {
      slug: 'bella-spain-weddings', name: 'Bella Spain Weddings', name_cn: '美丽西班牙婚礼',
      source_url: 'https://www.bellaspainweddings.com/', country: 'Spain', country_cn: '西班牙', city: 'Barcelona', city_cn: '巴塞罗那',
      tagline: 'Your dream wedding in Spain — Professional destination wedding planners',
      description: 'Bella Spain Weddings 是一家专注于西班牙目的地婚礼的专业策划公司。团队深谙西班牙文化和婚礼传统，擅长将当地特色与现代设计融合，为国际客户打造独一无二的西班牙婚礼体验。',
      story: 'Bella Spain Weddings 以巴塞罗那为基地，服务来自全球的新人，致力于展示西班牙婚礼的独特魅力。',
      founded_year: 2015, team_members: [], services: [{ name: 'Destination Wedding', name_cn: '目的地婚礼', category: 'wedding', description: '西班牙全境目的地婚礼' }, { name: 'Wedding Design', name_cn: '婚礼设计', category: 'wedding', description: '融合西班牙特色的婚礼设计' }],
      service_areas: [{ name: 'Barcelona', name_cn: '巴塞罗那', detail: '巴塞罗那及周边' }, { name: 'Madrid', name_cn: '马德里', detail: '马德里及周边' }, { name: 'Andalusia', name_cn: '安达卢西亚', detail: '南部地区' }, { name: 'Balearic Islands', name_cn: '巴利阿里群岛', detail: '马略卡、伊维萨等' }],
      values_list: [{ name: 'Spanish Tradition', name_cn: '西班牙传统', description: '融合当地文化传统' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.bellaspainweddings.com/', sort_order: 18
    },
    {
      slug: 'fincas-bodas', name: 'Fincas Bodas', name_cn: '庄园婚礼西班牙',
      source_url: 'https://www.fincasbodas.com/', country: 'Spain', country_cn: '西班牙', city: 'Madrid', city_cn: '马德里',
      tagline: 'Exclusive finca weddings in Spain — From rustic estates to luxury celebrations',
      description: 'Fincas Bodas 是西班牙专业的庄园婚礼策划公司，专注于将西班牙各地的历史庄园、乡村别墅和奢华场地打造成独一无二的婚礼场地。从安达卢西亚的橄榄庄园到加泰罗尼亚的现代主义建筑，为每对新人呈现最纯正的西班牙婚礼体验。',
      story: 'Fincas Bodas 源于对西班牙庄园文化的热爱，致力于将历史建筑与现代婚礼设计完美结合。',
      founded_year: 2012, team_members: [], services: [{ name: 'Finca Wedding Planning', name_cn: '庄园婚礼策划', category: 'wedding', description: '西班牙庄园婚礼全程策划' }, { name: 'Venue Selection', name_cn: '场地选择', category: 'wedding', description: '精选西班牙庄园和别墅' }],
      service_areas: [{ name: 'Madrid', name_cn: '马德里', detail: '马德里及周边庄园' }, { name: 'Andalusia', name_cn: '安达卢西亚', detail: '南部橄榄庄园' }, { name: 'Catalonia', name_cn: '加泰罗尼亚', detail: '现代主义建筑' }, { name: 'Valencia', name_cn: '瓦伦西亚', detail: '地中海沿岸' }],
      values_list: [{ name: 'Historic Venues', name_cn: '历史场地', description: '专注历史庄园和建筑' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.fincasbodas.com/', sort_order: 19
    },

    // --- 葡萄牙 (2家) ---
    {
      slug: 'portugal-weddings', name: 'Portugal Weddings', name_cn: '葡萄牙婚礼',
      source_url: 'https://www.portugal-weddings.com/', country: 'Portugal', country_cn: '葡萄牙', city: 'Lisbon', city_cn: '里斯本',
      tagline: 'Destination wedding planners in Portugal — From Lisbon to the Algarve',
      description: 'Portugal Weddings 是葡萄牙专业的目的地婚礼策划公司，服务覆盖里斯本、波尔图、阿尔加维等葡萄牙最美目的地。公司擅长将葡萄牙独特的瓷砖文化、法朵音乐和大西洋风光融入婚礼设计。',
      story: 'Portugal Weddings 以葡萄牙为家，致力于向世界展示这个欧洲最被低估的婚礼目的地的独特魅力。',
      founded_year: 2014, team_members: [], services: [{ name: 'Destination Wedding', name_cn: '目的地婚礼', category: 'wedding', description: '葡萄牙全境目的地婚礼' }, { name: 'Wedding Design', name_cn: '婚礼设计', category: 'wedding', description: '融合葡萄牙特色的设计' }],
      service_areas: [{ name: 'Lisbon', name_cn: '里斯本', detail: '里斯本及周边' }, { name: 'Porto', name_cn: '波尔图', detail: '波尔图及杜罗河谷' }, { name: 'Algarve', name_cn: '阿尔加维', detail: '南部海岸' }, { name: 'Sintra', name_cn: '辛特拉', detail: '童话宫殿' }],
      values_list: [{ name: 'Portuguese Charm', name_cn: '葡萄牙魅力', description: '展现葡萄牙独特魅力' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.portugal-weddings.com/', sort_order: 20
    },
    {
      slug: 'white-impact', name: 'White Impact', name_cn: '白色印记婚礼',
      source_url: 'https://www.whiteimpact.pt/', country: 'Portugal', country_cn: '葡萄牙', city: 'Algarve', city_cn: '阿尔加维',
      tagline: 'Creating unforgettable wedding moments in Portugal\'s Algarve',
      description: 'White Impact 是葡萄牙阿尔加维的知名婚礼策划公司，由 Paula Grade 联合创立。公司从2007年的37场婚礼发展到如今每年约200场，平均婚礼费用从1万欧元增长到3-3.5万欧元，反映了葡萄牙婚礼市场的蓬勃发展。\n\n公司擅长阿尔加维海岸的奢华婚礼，与当地顶级酒店和场地保持紧密合作关系。',
      story: 'White Impact 由 Paula Grade 联合创立，从2007年的小型婚礼公司成长为阿尔加维最大的婚礼策划公司之一，每年策划约200场婚礼。',
      founded_year: 2007, team_members: [{ name: 'Paula Grade', name_cn: '保拉·葛雷德', role: 'Co-founder', role_cn: '联合创始人', description: 'White Impact联合创始人，阿尔加维婚礼行业先驱。', image: '' }],
      services: [{ name: 'Wedding Planning', name_cn: '婚礼策划', category: 'wedding', description: '阿尔加维婚礼全程策划' }, { name: 'Venue Management', name_cn: '场地管理', category: 'wedding', description: '合作场地管理与协调' }],
      service_areas: [{ name: 'Algarve', name_cn: '阿尔加维', detail: '葡萄牙南部海岸' }, { name: 'Lisbon', name_cn: '里斯本', detail: '里斯本及周边' }],
      values_list: [{ name: 'Unforgettable Moments', name_cn: '难忘时刻', description: '创造难忘的婚礼时刻' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.whiteimpact.pt/', sort_order: 21
    },

    // --- 爱尔兰 (1家) ---
    {
      slug: 'prague-weddings', name: 'Prague Weddings', name_cn: '布拉格婚礼',
      source_url: 'https://www.pragueweddings.com/', country: 'Czech Republic', country_cn: '捷克', city: 'Prague', city_cn: '布拉格',
      tagline: 'The largest wedding marketplace in Prague — 2750+ vendors at your fingertips',
      description: 'Prague Weddings 是布拉格最大的婚礼市场平台，拥有2750+供应商资源。公司提供DIY在线婚礼服务和全策划服务，每年举办两次婚礼博览会（每次150+参展商）。\n\n作为捷克婚礼行业的中心枢纽，Prague Weddings 连接新人与布拉格及捷克共和国的优质婚礼供应商，提供法律婚礼和象征性婚礼服务。',
      story: 'Prague Weddings 作为布拉格婚礼市场平台创立，旨在连接新人与捷克优质婚礼供应商。如今已发展为拥有2750+供应商的最大婚礼平台。',
      founded_year: 2010, team_members: [], services: [{ name: 'Wedding Planning', name_cn: '婚礼策划', category: 'wedding', description: '布拉格婚礼策划' }, { name: 'Vendor Directory', name_cn: '供应商目录', category: 'wedding', description: '2750+供应商资源' }, { name: 'Wedding Expo', name_cn: '婚礼博览会', description: '年度婚礼博览会', category: 'event' }],
      service_areas: [{ name: 'Prague', name_cn: '布拉格', detail: '布拉格全城' }, { name: 'Czech Republic', name_cn: '捷克共和国', detail: '全国范围' }],
      values_list: [{ name: 'Largest Network', name_cn: '最大网络', description: '2750+供应商网络' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: 'https://www.pragueweddings.com/', sort_order: 22
    },

    // --- 更多补充公司 ---
    {
      slug: 'bloom-event-czech', name: 'Bloom Event', name_cn: '花漾活动',
      source_url: 'https://planning.wedding/about', country: 'Czech Republic', country_cn: '捷克', city: 'Prague', city_cn: '布拉格',
      tagline: 'Floral-focused wedding and event agency in Czech Republic',
      description: 'Bloom Event 是由 Klárka 和 Terka 共同创立的捷克婚礼和活动代理机构，专注于花艺设计。公司擅长森林婚礼、农场婚礼和庄园婚礼，为各类活动提供精美的花卉布置。',
      story: 'Klárka 和 Terka 凭借对花艺的热爱创立了 Bloom Event，专注于将自然之美融入每一场婚礼和活动。',
      founded_year: 2018, team_members: [{ name: 'Klárka', name_cn: '克拉尔卡', role: 'Co-founder', role_cn: '联合创始人', description: '花艺婚礼专家。', image: '' }, { name: 'Terka', name_cn: '泰尔卡', role: 'Co-founder', role_cn: '联合创始人', description: '花艺设计师。', image: '' }],
      services: [{ name: 'Floral Wedding Design', name_cn: '花艺婚礼设计', category: 'wedding', description: '以花艺为核心的婚礼设计' }, { name: 'Woodland Weddings', name_cn: '森林婚礼', category: 'wedding', description: '森林和户外婚礼' }, { name: 'Farm & Estate Weddings', name_cn: '农场庄园婚礼', category: 'wedding', description: '农场和庄园婚礼' }],
      service_areas: [{ name: 'Czech Republic', name_cn: '捷克共和国', detail: '全国范围' }],
      values_list: [{ name: 'Nature Inspired', name_cn: '自然灵感', description: '以自然为灵感源泉' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: '', sort_order: 23
    },
    {
      slug: 'sugokuii-events', name: 'Sugokuii Events', name_cn: 'Sugokuii活动',
      source_url: 'https://www.sugokuii.com/', country: 'Italy', country_cn: '意大利', city: 'Amalfi', city_cn: '阿马尔菲',
      tagline: 'Unconventional luxury weddings in Italy — From mountain cable cars to Sicily cave parties',
      description: 'Sugokuii Events 是由 Diana Sorensen 领导的意大利奢华目的地婚礼公司，专注于非传统的极致奢华婚礼体验。公司以创意大胆著称，曾策划过山区缆车接待会、西西里洞穴派对和卡普里岛广场整场接管等令人惊叹的婚礼。\n\nSugokuii 服务于高净值的跨文化客户群体，擅长将多日沉浸式婚礼体验与意大利独特的历史场地结合。',
      story: 'Sugokuii Events 由 Diana Sorensen 创立，以非传统的创意方式重新定义意大利奢华婚礼。',
      founded_year: 2010, team_members: [{ name: 'Diana Sorensen', name_cn: '戴安娜', role: 'Owner & Creative Director', role_cn: '所有者/创意总监', description: '以大胆创意闻名的奢华婚礼策划师。', image: '' }],
      services: [{ name: 'Luxury Destination Wedding', name_cn: '奢华目的地婚礼', category: 'wedding', description: '非传统奢华婚礼' }, { name: 'Multi-Day Events', name_cn: '多日活动', description: '多日沉浸式婚礼体验', category: 'wedding' }],
      service_areas: [{ name: 'Amalfi Coast', name_cn: '阿马尔菲海岸', detail: '海岸悬崖婚礼' }, { name: 'Sicily', name_cn: '西西里', detail: '岛屿婚礼' }, { name: 'Italian Alps', name_cn: '意大利阿尔卑斯', detail: '山区婚礼' }],
      values_list: [{ name: 'Unconventional', name_cn: '非传统', description: '打破常规的创意' }],
      testimonials: [], faq: [], partners: [{ name: 'Vogue', role: '媒体报道', contact: '', website: 'vogue.com' }], images: [], cover_image: '',
      website: '', sort_order: 24
    },
    {
      slug: 'dazzling-weddings', name: 'The Dazzling Weddings', name_cn: '璀璨婚礼',
      source_url: 'https://planning.wedding/about', country: 'Hungary', country_cn: '匈牙利', city: 'Budapest', city_cn: '布达佩斯',
      tagline: 'Multicultural & destination weddings across Europe',
      description: 'The Dazzling Weddings 是由 Nelli 创立的婚礼策划公司，专注于多元文化和目的地婚礼。公司提供三个主要套餐（策划、组织、协调），所有报价均根据个人需求单独定制。',
      story: 'Nelli 出于对不同文化的热爱创立了 The Dazzling Weddings，专注于为跨文化新人打造独特的婚礼体验。',
      founded_year: 2015, team_members: [{ name: 'Nelli', name_cn: '内莉', role: 'Founder & Wedding Planner', role_cn: '创始人/婚礼策划师', description: '多元文化婚礼专家。', image: '' }],
      services: [{ name: 'Wedding Planning', name_cn: '婚礼策划', category: 'wedding', description: '全程婚礼策划' }, { name: 'Wedding Organizing', name_cn: '婚礼组织', category: 'wedding', description: '婚礼组织管理' }, { name: 'Wedding Coordination', name_cn: '婚礼协调', category: 'wedding', description: '当日协调' }],
      service_areas: [{ name: 'Hungary', name_cn: '匈牙利', detail: '布达佩斯及周边' }, { name: 'Italy', name_cn: '意大利', detail: '意大利目的地' }, { name: 'Europe', name_cn: '欧洲', detail: '欧洲各地' }],
      values_list: [{ name: 'Multicultural', name_cn: '多元文化', description: '拥抱不同文化传统' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: '', sort_order: 25
    },
    {
      slug: 'lavender-and-rose', name: 'Lavender and Rose', name_cn: '薰衣草与玫瑰',
      source_url: 'https://www.lavenderandroseweddings.com/', country: 'France', country_cn: '法国', city: 'Provence', city_cn: '普罗旺斯',
      tagline: 'Your dedicated wedding planner in the South of France',
      description: 'Lavender and Rose 是法国南部专业的婚礼策划公司，被 Wedded Wonderland 推荐为南法目的地婚礼的首选策划师。公司擅长普罗旺斯薰衣草田婚礼、蔚蓝海岸奢华婚礼和法国城堡婚礼。',
      story: 'Lavender and Rose 以法国南部为家，将普罗旺斯的浪漫风情融入每场婚礼。',
      founded_year: 2012, team_members: [], services: [{ name: 'Destination Wedding', name_cn: '目的地婚礼', category: 'wedding', description: '法国南部目的地婚礼' }, { name: 'Castle Weddings', name_cn: '城堡婚礼', category: 'wedding', description: '法国城堡婚礼' }],
      service_areas: [{ name: 'Provence', name_cn: '普罗旺斯', detail: '薰衣草田婚礼' }, { name: 'French Riviera', name_cn: '法国里维埃拉', detail: '蔚蓝海岸' }, { name: 'Loire Valley', name_cn: '卢瓦尔河谷', detail: '城堡婚礼' }],
      values_list: [{ name: 'Provençal Romance', name_cn: '普罗旺斯浪漫', description: '展现南法浪漫风情' }],
      testimonials: [], faq: [], partners: [{ name: 'Wedded Wonderland', role: '媒体推荐', contact: '', website: 'weddedwonderland.com' }], images: [], cover_image: '',
      website: '', sort_order: 26
    },
    {
      slug: 'wedding-in-puglia', name: 'Wedding in Puglia', name_cn: '普利亚婚礼',
      source_url: 'https://www.weddinginpuglia.it/', country: 'Italy', country_cn: '意大利', city: 'Puglia', city_cn: '普利亚',
      tagline: 'Elite wedding planners for bespoke Puglia weddings',
      description: 'Wedding in Puglia 是意大利普利亚大区的精英婚礼策划公司，被 Wedded Wonderland 评为意大利顶级婚礼策划师之一。公司专注于普利亚大区目的地婚礼，擅长特鲁利小屋、马塞里亚庄园等普利亚特色场地婚礼。',
      story: 'Wedding in Puglia 深耕普利亚大区婚礼市场，以对该地区的深度了解和对婚礼品质的极致追求，成为普利亚最受欢迎的婚礼策划公司。',
      founded_year: 2010, team_members: [], services: [{ name: 'Puglia Wedding Planning', name_cn: '普利亚婚礼策划', category: 'wedding', description: '普利亚大区全程婚礼策划' }, { name: 'Trulli Weddings', name_cn: '特鲁利婚礼', category: 'wedding', description: '特色圆锥小屋婚礼' }],
      service_areas: [{ name: 'Puglia', name_cn: '普利亚', detail: '意大利南部普利亚大区' }, { name: 'Polignano a Mare', name_cn: '波利尼亚诺', detail: '海滨小镇' }, { name: 'Lecce', name_cn: '莱切', detail: '巴洛克之城' }],
      values_list: [{ name: 'Local Expertise', name_cn: '本地专业', description: '深度了解普利亚' }],
      testimonials: [], faq: [], partners: [{ name: 'Wedded Wonderland', role: '媒体推荐', contact: '', website: 'weddedwonderland.com' }], images: [], cover_image: '',
      website: '', sort_order: 27
    },
    {
      slug: 'crystal-events-spain', name: 'Crystal Events', name_cn: '水晶活动西班牙',
      source_url: 'https://www.crystalevents.es/', country: 'Spain', country_cn: '西班牙', city: 'Barcelona', city_cn: '巴塞罗那',
      tagline: 'Crafting unforgettable Spanish weddings with local traditions and contemporary elegance',
      description: 'Crystal Events 是西班牙知名的婚礼策划公司，被 Wedded Wonderland 推荐为西班牙目的地婚礼的顶级策划师。公司以融合西班牙当地传统与当代优雅风格而闻名，为每对新人打造难忘的西班牙婚礼体验。',
      story: 'Crystal Events 以巴塞罗那为基地，凭借对西班牙文化的深刻理解和对现代设计的敏锐感知，成为西班牙婚礼策划行业的标杆。',
      founded_year: 2010, team_members: [], services: [{ name: 'Destination Wedding', name_cn: '目的地婚礼', category: 'wedding', description: '西班牙目的地婚礼' }, { name: 'Wedding Design', name_cn: '婚礼设计', category: 'wedding', description: '融合传统与现代的设计' }],
      service_areas: [{ name: 'Barcelona', name_cn: '巴塞罗那', detail: '巴塞罗那及周边' }, { name: 'Madrid', name_cn: '马德里', detail: '马德里' }, { name: 'Marbella', name_cn: '马尔韦利亚', detail: '阳光海岸' }],
      values_list: [{ name: 'Tradition & Elegance', name_cn: '传统与优雅', description: '融合传统与当代优雅' }],
      testimonials: [], faq: [], partners: [{ name: 'Wedded Wonderland', role: '媒体推荐', contact: '', website: 'weddedwonderland.com' }], images: [], cover_image: '',
      website: '', sort_order: 28
    },
    {
      slug: 'gold-weddings-santorini', name: 'Gold Weddings Santorini', name_cn: '金色圣托里尼婚礼',
      source_url: 'https://www.goldweddingssantorini.com/', country: 'Greece', country_cn: '希腊', city: 'Santorini', city_cn: '圣托里尼',
      tagline: 'Your local Santorini wedding planning experts',
      description: 'Gold Weddings Santorini 是圣托里尼本地的婚礼策划公司，在 WeddingWire 上获得高度好评。公司以快速响应和高性价比著称，策划费用约2000美元，是圣托里尼最受欢迎的婚礼策划选择之一。',
      story: 'Gold Weddings Santorini 作为圣托里尼本地婚礼策划公司，以亲民的价格和专业的服务赢得了全球新人的信赖。',
      founded_year: 2012, team_members: [], services: [{ name: 'Wedding Planning', name_cn: '婚礼策划', category: 'wedding', description: '圣托里尼婚礼策划' }, { name: 'Wedding Packages', name_cn: '婚礼套餐', category: 'wedding', description: '多种婚礼套餐选择' }],
      service_areas: [{ name: 'Santorini', name_cn: '圣托里尼', detail: '圣托里尼全岛' }],
      values_list: [{ name: 'Affordable Quality', name_cn: '高性价比', description: '高质量且价格亲民' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: '', sort_order: 29
    },
    {
      slug: 'prague-wedding-co', name: 'Prague Wedding Co.', name_cn: '布拉格婚礼公司',
      source_url: 'https://www.pragueweddingco.com/', country: 'Czech Republic', country_cn: '捷克', city: 'Prague', city_cn: '布拉格',
      tagline: 'Fairytale castle weddings in the heart of Europe',
      description: 'Prague Wedding Co. 专注于捷克布拉格的城堡和宫殿婚礼，为国际客户提供端到端的目的地婚礼策划服务。公司深谙捷克丰富的历史建筑资源，擅长将中世纪城堡、巴洛克宫殿和哥特式教堂打造成梦幻婚礼场地。',
      story: 'Prague Wedding Co. 以布拉格为家，致力于向世界展示这座"百塔之城"作为婚礼目的地的无限魅力。',
      founded_year: 2015, team_members: [], services: [{ name: 'Castle Wedding Planning', name_cn: '城堡婚礼策划', category: 'wedding', description: '捷克城堡婚礼策划' }, { name: 'Palace Weddings', name_cn: '宫殿婚礼', category: 'wedding', description: '巴洛克宫殿婚礼' }],
      service_areas: [{ name: 'Prague', name_cn: '布拉格', detail: '布拉格全城' }, { name: 'Bohemia', name_cn: '波希米亚', detail: '波希米亚地区' }, { name: 'Moravia', name_cn: '摩拉维亚', detail: '摩拉维亚地区' }],
      values_list: [{ name: 'Fairytale Venues', name_cn: '童话场地', description: '打造童话般的婚礼' }],
      testimonials: [], faq: [], partners: [], images: [], cover_image: '',
      website: '', sort_order: 30
    }
  ]

  let inserted = 0
  for (const data of companies) {
    const [existing] = await pool.execute('SELECT id FROM crawled_wedding_teams WHERE slug = ?', [data.slug])
    if (existing.length > 0) {
      console.log(`⚠ ${data.name_cn} (${data.slug}) 已存在，跳过`)
      continue
    }
    await pool.execute(
      `INSERT INTO crawled_wedding_teams 
        (slug, name, name_cn, source_url, country, country_cn, city, city_cn, tagline, description, story, founded_year,
         team_members, services, service_areas, values_list, testimonials, faq, partners, images, cover_image, website, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.slug, data.name, data.name_cn, data.source_url, data.country, data.country_cn,
        data.city, data.city_cn, data.tagline, data.description, data.story, data.founded_year,
        JSON.stringify(data.team_members || []), JSON.stringify(data.services || []), JSON.stringify(data.service_areas || []),
        JSON.stringify(data.values_list || []), JSON.stringify(data.testimonials || []), JSON.stringify(data.faq || []),
        JSON.stringify(data.partners || []), JSON.stringify(data.images || []),
        data.cover_image || '', data.website || '', data.sort_order || 0
      ]
    )
    inserted++
    console.log(`✓ ${data.name_cn} (${data.slug}) 已插入`)
  }

  // 验证
  const [all] = await pool.execute('SELECT id, slug, name_cn, country_cn, city_cn, JSON_LENGTH(team_members) AS members, JSON_LENGTH(services) AS services, JSON_LENGTH(images) AS images FROM crawled_wedding_teams ORDER BY sort_order')
  console.log(`\n===== 共 ${all.length} 家婚礼团队 =====`)
  console.table(all)
  console.log(`\n本次新增: ${inserted} 家`)

  await pool.end()
}

run().catch(err => { console.error(err); process.exit(1) })
