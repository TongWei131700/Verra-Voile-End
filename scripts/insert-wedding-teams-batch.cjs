/**
 * 插入3家欧洲婚礼策划公司数据
 * 1. Weddings Italy (P&J Events) - 意大利
 * 2. Aegean Dream Weddings - 希腊圣托里尼
 * 3. Happy Events - 希腊雅典
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

  // ===== 1. Weddings Italy =====
  const weddingsItaly = {
    slug: 'weddings-italy',
    name: 'Weddings Italy',
    name_cn: '意大利婚礼策划',
    source_url: 'https://www.weddingsitaly.com/',
    country: 'Italy',
    country_cn: '意大利',
    city: 'San Marino',
    city_cn: '圣马力诺',
    tagline: 'From Dream to "I Do" Flawlessly — Luxury Destination Wedding Planner in Italy Since 1987',
    description: `Weddings Italy（P&J Events）是意大利最顶级的奢华目的地婚礼策划公司之一，由 Paolo Nassi 于1987年在东京创立，至今已有近40年历史。公司总部位于圣马力诺，在意大利全境拥有超过15,000个精选场地资源。

作为意大利婚礼策划行业的先驱，Weddings Italy 曾与意大利政府合作制定了外国人在意大利合法结婚的标准流程，并成为首家与佛罗伦萨市政厅（Palazzo Vecchio）合作办理合法外国婚礼的策划公司。

至今已成功策划超过14,000场婚礼和10,000场奢华活动，服务过众多好莱坞明星、国际名流和皇室成员，包括演员 Josh Lucas、Radiohead 主唱 Thom Yorke、电影导演 Lana Wachowski 等。公司被意大利维基百科收录为意大利婚礼行业的先驱企业。

团队由来自9个国家的策划师、建筑师、物流专家、花艺设计师、灯光设计师和法律专家组成，融合意大利的创意美学、日本和德国的严谨组织、英美的高效执行以及中东的热情好客。`,
    story: `1987年，Paolo Nassi 在东京创立了 Regency 公司，成为最早将意大利目的地婚礼推向全球的行业先驱之一。1989年，公司与意大利政府合作建立了外国人在意大利结婚的标准程序。

1995年，Regency San Marino Srl 成立，业务扩展至全球。到此时公司已策划约1,200场婚礼。2001年，Paolo 遇到了 Jinane Kafrouny，P&J 品牌作为 Regency 传承中的创意标识正式诞生。

2012年，公司获得了意大利六座奢华别墅和两座城堡的独家管理权。如今，Weddings Italy 已成长为拥有14,000+场婚礼经验的行业巨头，服务涵盖意大利全境及法国、中东等精选国际目的地。`,
    founded_year: 1987,
    team_members: [
      { name: 'Paolo Nassi', name_cn: '保罗·纳希', role: 'Founder & Creative Director', role_cn: '创始人 / 创意总监', description: 'Weddings Italy 创始人，近40年意大利婚礼策划经验，被华尔街日报、Vogue、NBC等媒体专访报道。', image: 'https://www.weddingsitaly.com/founder/paolo.jpg' },
      { name: 'Jinane Kafrouny', name_cn: '吉南·卡夫鲁尼', role: 'Co-Creative Director', role_cn: '联合创意总监', description: 'P&J 联合创意总监，与 Paolo 共同打造了无数名流婚礼的创意设计方案。', image: 'https://www.weddingsitaly.com/wedding-planners-italy/jinane.jpg' },
      { name: 'Sara', name_cn: '萨拉', role: 'Wedding Planner', role_cn: '婚礼策划师', description: '资深婚礼策划师，负责意大利全境婚礼的全程策划与执行。', image: 'https://www.weddingsitaly.com/wedding-planners-italy/staff/images/Sara000.jpg' },
      { name: 'Claudia', name_cn: '克劳迪娅', role: 'Wedding Planner', role_cn: '婚礼策划师', description: '专业婚礼策划师，擅长意大利别墅和城堡婚礼的策划执行。', image: 'https://www.weddingsitaly.com/wedding-planners-italy/claudia.jpg' },
      { name: 'Federica', name_cn: '费德里卡', role: 'Wedding Planner', role_cn: '婚礼策划师', description: '专业婚礼策划师，负责目的地婚礼的供应商协调与现场管理。', image: 'https://www.weddingsitaly.com/wedding-planners-italy/federica.jpg' },
      { name: 'Adele', name_cn: '阿黛尔', role: 'Wedding Planner', role_cn: '婚礼策划师', description: '专业婚礼策划师，擅长阿马尔菲海岸和西西里目的地婚礼。', image: 'https://www.weddingsitaly.com/wedding-planners-italy/adele.jpg' }
    ],
    services: [
      { name: 'Full Wedding Planning & Coordination', name_cn: '全程婚礼策划与协调', category: 'wedding', description: '从概念到执行的完整策划框架，供应商管理、预算架构、设计对齐、宾客体验、婚礼当天监督' },
      { name: 'Destination Wedding Planning', name_cn: '目的地婚礼策划', category: 'wedding', description: '场地物流、供应商选择、预算优先级、制作时间表、应急预案、隐私管理' },
      { name: 'Creative Direction & Design', name_cn: '创意指导与设计', category: 'wedding', description: '花艺、灯光、租赁、音乐、场景设计的整体协调' },
      { name: 'Venue Selection & Certification', name_cn: '场地筛选与认证', category: 'wedding', description: '意大利全境15,000+精选场地资源，独家城堡和别墅管理权' },
      { name: 'Ceremony Planning', name_cn: '仪式策划', category: 'wedding', description: '合法民事、天主教、新教、犹太教、东正教仪式策划' },
      { name: 'Guest Hospitality & Concierge', name_cn: '宾客接待与礼宾', category: 'wedding', description: '住宿、接送、交通、本地体验安排' },
      { name: 'Budget Architecture & Procurement', name_cn: '预算架构与采购', category: 'wedding', description: '战略预算管理、供应商谈判、付款计划' },
      { name: 'Legal, Permits & Risk Management', name_cn: '法律、许可与风险管理', category: 'wedding', description: '许可证、法规、本地合规、应急规划' },
      { name: 'Photography & Videography', name_cn: '摄影与摄像', category: 'wedding', description: '专业婚礼摄影和摄像服务' },
      { name: 'Floral Design', name_cn: '花艺设计', category: 'wedding', description: '定制花艺方案设计与执行' },
      { name: 'Green & Sustainable Weddings', name_cn: '绿色可持续婚礼', category: 'wedding', description: '环保婚礼策划，本地供应链和可持续制作' },
      { name: 'Multi-Day Wedding Week', name_cn: '多日婚礼周', category: 'wedding', description: '将单一仪式升级为3-5天的综合性婚礼体验' }
    ],
    service_areas: [
      { name: 'Tuscany', name_cn: '托斯卡纳', detail: '意大利最经典的婚礼目的地，田园风光与古堡庄园' },
      { name: 'Lake Como', name_cn: '科莫湖', detail: '意大利湖区奢华别墅婚礼' },
      { name: 'Amalfi Coast', name_cn: '阿马尔菲海岸', detail: '悬崖海景婚礼，地中海最美海岸线' },
      { name: 'Rome', name_cn: '罗马', detail: '永恒之城的浪漫婚礼' },
      { name: 'Venice', name_cn: '威尼斯', detail: '水城贡多拉婚礼' },
      { name: 'Florence', name_cn: '佛罗伦萨', detail: '文艺复兴之城的优雅婚礼' },
      { name: 'Sicily', name_cn: '西西里', detail: '地中海风情岛屿婚礼' },
      { name: 'Puglia', name_cn: '普利亚', detail: '意大利南部田园婚礼' },
      { name: 'Italian Riviera', name_cn: '意大利里维埃拉', detail: '利古里亚海岸婚礼' },
      { name: 'France', name_cn: '法国', detail: '法国精选目的地婚礼' }
    ],
    values_list: [
      { name: 'Discretion & Privacy', name_cn: '低调与隐私', description: '为高端客户提供绝对的保密性和隐私保护' },
      { name: 'Experience over Trends', name_cn: '经验胜于潮流', description: '近40年真实制作经验，不追逐短暂潮流' },
      { name: 'Operational Mastery', name_cn: '运营精通', description: '在问题发生之前就预见并解决' },
      { name: 'Cultural Intelligence', name_cn: '文化智慧', description: '多元文化、跨信仰婚礼的专业处理能力' },
      { name: 'Sustainable Elegance', name_cn: '可持续优雅', description: '通过本地供应链和智能制作实现环保奢华' },
      { name: 'Responsible Luxury', name_cn: '负责任奢华', description: '可持续发展、遗产保护、负责任采购' }
    ],
    testimonials: [
      { couple: 'Josh Lucas & Brianna Ruffalo', text: 'Actor & ABC7 Meteorologist — P&J designed our Italian wedding with absolute perfection and discretion.', text_cn: '好莱坞演员与ABC7气象主播 — P&J以绝对的完美和低调设计了我们的意大利婚礼。' },
      { couple: 'Thom Yorke & Dajana Roncione', text: 'Radiohead frontman & Italian actress — The team understood our vision perfectly and created something truly magical.', text_cn: 'Radiohead主唱与意大利女演员 — 团队完美理解了我们的愿景，创造了真正魔幻的体验。' },
      { couple: 'Priyanka & Jordan', text: 'From the very first call we felt understood. Every detail was curated with love and precision.', text_cn: '从第一次通话起就感到被理解。每一个细节都带着爱和精准来策划。' }
    ],
    faq: [
      { q: '2027年在意大利办婚礼大概需要多少预算？', a: '中等水平：每人600-1,000欧元；中高水平：每人1,300-2,000欧元；高端/顶级：每人2,500欧元起。' },
      { q: '外国人可以在意大利合法结婚吗？', a: '是的，可以通过民事或宗教仪式合法结婚。许多新人也选择象征性仪式。我们曾与意大利政府合作制定了相关标准流程。' },
      { q: '意大利最好的婚礼地点有哪些？', a: '托斯卡纳、科莫湖、阿马尔菲海岸、西西里、普利亚、威尼斯、罗马都是顶级选择。' },
      { q: '应该提前多久开始策划？', a: '建议提前12-18个月。我们也可以在3个月内完成紧急策划，但场地和供应商选择可能受限。' },
      { q: '可以远程策划婚礼吗？', a: '完全可以。通过视频通话、共享文档和邮件更新，我们可以实现全流程远程策划。' },
      { q: '你们能处理多大规模的婚礼？', a: '从私密的小型婚礼到数百人的大型奢华婚礼，我们都有丰富经验。14,000+场婚礼的经验覆盖各种规模。' },
      { q: '你们如何处理紧急情况？', a: '35年以上经验、10,000+场活动的积累，让我们能够低调、精准、冷静地处理任何突发状况。' }
    ],
    partners: [
      { name: 'Wall Street Journal', role: '媒体报道', contact: '', website: 'wsj.com' },
      { name: 'Vogue', role: '媒体报道', contact: '', website: 'vogue.com' },
      { name: 'NBC E! Online', role: '媒体报道', contact: '', website: 'eonline.com' },
      { name: 'Brides', role: '媒体报道', contact: '', website: 'brides.com' },
      { name: 'Gucci', role: '品牌客户', contact: '', website: 'gucci.com' }
    ],
    images: [
      'https://www.weddingsitaly.com/new2022/images/0010d.webp',
      'https://www.weddingsitaly.com/new2022/images/pandj.webp',
      'https://www.weddingsitaly.com/new2022/images/pandj1.webp',
      'https://www.weddingsitaly.com/founder/paolo.jpg',
      'https://www.weddingsitaly.com/founder/wsj-paolo-nassi.jpg',
      'https://www.weddingsitaly.com/founder/VOGUE-paolo-nassi.jpg',
      'https://www.weddingsitaly.com/founder/p&J.jpg',
      'https://www.weddingsitaly.com/images/Coordination001.webp',
      'https://www.weddingsitaly.com/images/Coordination002.webp',
      'https://www.weddingsitaly.com/images/Coordination003.webp',
      'https://www.weddingsitaly.com/images/Coordination004.webp',
      'https://www.weddingsitaly.com/new2022/images/image_form.jpg',
      'https://www.weddingsitaly.com/new2022/images/FAQ_HOME2025.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/Home-testimonials1.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/Home-testimonials3.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/Home-testimonials4.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/Home-testimonials5.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/Home-testimonials6.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/thumb1.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/thumb2.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/thumb3.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/thumb4.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/thumb5.webp',
      'https://www.weddingsitaly.com/wedding-testimonials/images/thumb6.webp',
      'https://www.weddingsitaly.com/immagini/crop_4993_790.jpg',
      'https://www.weddingsitaly.com/immagini/crop_4994_3102.jpg',
      'https://www.weddingsitaly.com/immagini/crop_4995_652.jpg',
      'https://www.weddingsitaly.com/immagini/crop_4996_264.jpg',
      'https://www.weddingsitaly.com/immagini/crop_4997_1153.jpg',
      'https://www.weddingsitaly.com/immagini/crop_4998_728.jpg'
    ],
    cover_image: 'https://www.weddingsitaly.com/new2022/images/0010d.webp',
    website: 'https://www.weddingsitaly.com/',
    sort_order: 2
  }

  // ===== 2. Aegean Dream Weddings =====
  const aegeanDream = {
    slug: 'aegean-dream-weddings',
    name: 'Aegean Dream Weddings',
    name_cn: '爱琴海之梦婚礼',
    source_url: 'https://aegeandreamweddings.com/',
    country: 'Greece',
    country_cn: '希腊',
    city: 'Santorini',
    city_cn: '圣托里尼',
    tagline: 'Expert Wedding Planning for Destination Weddings in Santorini & the Greek Islands',
    description: `Aegean Dream Weddings 是一家位于希腊圣托里尼的精品婚礼策划公司，拥有超过10年的目的地婚礼策划经验。公司在英国合法注册，同时在希腊正式获得经营许可，是圣托里尼和希腊群岛最受信赖的婚礼策划机构之一。

公司专注于圣托里尼、纳克索斯、伊奥斯、斯基亚索斯、斯科派洛斯和哈尔基季基等希腊岛屿的目的地婚礼，提供从民事婚礼到东正教婚礼的全方位服务。无论是浪漫的小型私奔婚礼、奢华的微型婚礼还是盛大的庆典，团队都能以专业、透明和热情为每对新人打造独一无二的希腊岛屿婚礼体验。

Aegean Dream Weddings 以其透明的定价、无隐藏费用的商业理念和个性化的服务而闻名，受到全球客户的高度评价，并被 Chic & Stylish Weddings 等知名婚礼媒体推荐。`,
    story: `Aegean Dream Weddings 由 Eleni 创立，她是一位对婚礼策划充满热情的专业策划师。在超过10年的行业经验中，Eleni 和她的团队已经成功策划了数百场希腊岛屿婚礼。

公司的名字"Aegean Dream"源自对爱琴海的热爱——那片蔚蓝的海水、白色的教堂和壮丽的日落，是世界上最浪漫的婚礼背景。Eleni 相信每对新人的爱情故事都是独特的，因此每场婚礼都应该是量身定制的，而非千篇一律的套餐。

作为英国合法注册公司，Aegean Dream Weddings 为国际客户提供法律保障和专业的合同服务。团队与希腊所有市政厅、大使馆和领事馆保持良好关系，确保每场婚礼的法律程序顺利进行。`,
    founded_year: 2014,
    team_members: [
      { name: 'Eleni', name_cn: '埃莱妮', role: 'Founder & Lead Wedding Planner', role_cn: '创始人 / 首席婚礼策划师', description: 'Aegean Dream Weddings 创始人，超过10年希腊岛屿婚礼策划经验，被客户一致评价为专业、温暖、细致。', image: '' }
    ],
    services: [
      { name: 'Full Wedding Planning (A-to-Z)', name_cn: '全程婚礼策划（A到Z）', category: 'wedding', description: '无限邮件和Skype沟通，场地、花艺、摄影、摄像、化妆、音乐等全程协助' },
      { name: 'Wedding Design & Styling', name_cn: '婚礼设计与造型', category: 'wedding', description: '色彩方案、花艺、中心装饰、帐篷、灯光和家具租赁，打造独特美学' },
      { name: 'Venues Research & Bookings', name_cn: '场地搜索与预订', category: 'wedding', description: '精选希腊岛屿最佳婚礼场地，从悬崖教堂到海滩别墅' },
      { name: 'Budget Management', name_cn: '预算管理', category: 'wedding', description: '透明的预算管理和费用追踪' },
      { name: 'Wedding Supervision (On-the-day)', name_cn: '婚礼当日监督', category: 'wedding', description: '婚礼当天的现场协调与管理' },
      { name: 'Legal Documentation Assistance', name_cn: '法律文件协助', category: 'wedding', description: '民事、宗教和象征性仪式的法律文件指导' },
      { name: 'Vendors Recommendations & Bookings', name_cn: '供应商推荐与预订', category: 'wedding', description: '经过验证的优质供应商推荐' },
      { name: 'Accommodation Assistance', name_cn: '住宿协助', category: 'wedding', description: '酒店、私人别墅、工作室推荐，可协商团体优惠' },
      { name: 'Marriage Proposals Planning', name_cn: '求婚策划', category: 'event', description: '圣托里尼和纳克索斯的浪漫求婚策划' },
      { name: 'Vow Renewals & Anniversaries', name_cn: '誓言更新与纪念日', category: 'event', description: '誓言更新和纪念日庆祝活动' },
      { name: 'Beach Weddings', name_cn: '海滩婚礼', category: 'wedding', description: '希腊岛屿海滩婚礼专业策划' },
      { name: 'Elopement Packages', name_cn: '私奔婚礼套餐', category: 'wedding', description: '私密小型婚礼套餐，适合追求简约的新人' }
    ],
    service_areas: [
      { name: 'Santorini', name_cn: '圣托里尼', detail: '最受欢迎的希腊婚礼目的地，以火山口日落和白色教堂闻名' },
      { name: 'Naxos', name_cn: '纳克索斯', detail: '浪漫日落和沙滩婚礼' },
      { name: 'Ios', name_cn: '伊奥斯', detail: '美丽的海滩和充满活力的氛围' },
      { name: 'Skiathos', name_cn: '斯基亚索斯', detail: '松林和魔幻海滩' },
      { name: 'Skopelos', name_cn: '斯科派洛斯', detail: '希腊最绿岛屿，Mamma Mia 电影拍摄地' },
      { name: 'Halkidiki', name_cn: '哈尔基季基', detail: '迷人的海滩、隐蔽的海湾和松林' }
    ],
    values_list: [
      { name: 'Passion', name_cn: '热情', description: '你的特殊日子远不止是我们的业务，更是我们的热情所在' },
      { name: 'Trust & Professionalism', name_cn: '信任与专业', description: '我们的理念始终基于信任和专业精神' },
      { name: 'Transparent Pricing', name_cn: '透明定价', description: '无隐藏费用、商业竞争力的透明价格' },
      { name: 'Customer-centric', name_cn: '客户至上', description: '客户的需求和偏好是最高优先级' },
      { name: 'Personalization', name_cn: '个性化', description: '为每对新人提供新鲜独特的创意，量身定制' },
      { name: 'Full Support', name_cn: '全程支持', description: '从第一天起陪伴在身边，直到你回到家中' }
    ],
    testimonials: [
      { couple: 'Yulia & Greg', text: 'You gave us our fairytale Eleni! "Best wedding ever" / "most romantic wedding ever" keeps growing!! We wish we could do it all over again!', text_cn: '你给了我们童话般的婚礼！"最好的婚礼"/"最浪漫的婚礼"好评不断！我们希望能重来一次！' },
      { couple: 'Brittany & Cory', text: 'Absolutely amazing!!!! The day was absolutely amazing! It was perfect! Everything was perfect, from the venue, to the cake and flowers and dinner!', text_cn: '绝对令人惊叹！那一天太完美了！从场地到蛋糕、鲜花和晚餐，一切都完美无缺！' },
      { couple: 'Neto Trevinio', text: 'They were absolutely FANTASTIC! 3 months planning, everyday emails... I 1000% recommend them to organize your event at Santorini. Super ultra-professionals!', text_cn: '他们太棒了！3个月的策划，每天的邮件...我1000%推荐他们在圣托里尼组织你的活动。超级专业！' },
      { couple: 'Steve & Michelle', text: 'When I first approached the idea of proposing in Greece... Aegean Dream Weddings was the one that stuck out the most. Eleni seemed like she genuinely wanted to help.', text_cn: '当我第一次考虑在希腊求婚时...Aegean Dream Weddings 是最突出的选择。Eleni 让人感觉她真心想帮忙。' },
      { couple: 'Ben & Bridget', text: 'I can\'t thank Eleni and her team enough for providing us with a perfect wedding day experience.', text_cn: '我无法充分感谢 Eleni 和她的团队为我们提供了完美的婚礼体验。' }
    ],
    faq: [
      { q: '希腊的婚礼合法吗？', a: '是的，民事和宗教婚礼在希腊都具有完全的法律效力，对所有国籍开放。' },
      { q: '应该提前多久预订？', a: '越早越好，热门目的地（如圣托里尼）的场地通常需要提前一年预订。' },
      { q: '可以远程选择婚礼细节吗？', a: '完全可以。通过无限邮件和定期Skype通话，我们可以远程完成所有策划工作。' },
      { q: '多久内能收到回复？', a: '我们承诺在48小时内回复所有咨询。' },
      { q: '婚礼套餐的价格是多少？', a: '套餐根据地点和服务内容不同，我们为每对新人提供定制报价。标准套餐适合10人以内（新人+8位宾客），场地费不含在内。' },
      { q: '可以最后时刻预订吗？', a: '可以，如果有几周的时间，我们可以安排最后时刻的婚礼，但特定场地的可用性无法保证。' },
      { q: '能帮我们安排住宿吗？', a: '是的，我们协助安排酒店、私人别墅等住宿，并可协商团体优惠价格。' }
    ],
    partners: [
      { name: 'Chic & Stylish Weddings', role: '媒体合作', contact: '', website: 'chicandstylishweddings.com' }
    ],
    images: [
      'https://aegeandreamweddings.com/wp-content/uploads/2020/03/wedding-in-santorini.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/elopement_santorini_santa-irini_INS-3.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/A-M-101.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/W_WJS-69.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2020/03/Ben-Bridget.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/10/WEDDING-IN-SANTORINI-SLIDER-HOME-PAGE-7.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/10/WeddingSantorini.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/Wedding-in-Santorini-Elopement-89.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/10/WEDDING-IN-GREECE-IOS-SLIDER-HOME-PAGE-2.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/10/BeachWeddingsDesaturated.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/10/MarriageProposalsDesaturated.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/10/WeddingVenuesDesaturated.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/Wedding-In-Chalkidiki-Rachelle-Christian-00002.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2022/01/MARIA-Stefanos-11.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/tailor-made-weddings.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/Elopement-in-Santorini-aegean-dream-weddings-3.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/1-Wedding-in-Santorini-001a.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/12/getting-married-in-santorini.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/12/Getting-Married-in-Ios.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/12/Getting-Married-in-Skiathos-1.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/12/Getting-Married-in-Skopelos.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/12/Naxos.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2018/12/Getting-Married-in-Halkidiki.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/Santorini-Elopement-Michelle-Mike-00023.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/11/Micro-Wedding-In-Skopelos-Whitney-Jeffrey00007.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2024/11/lindsay-justin_santorini-elopement-1.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2020/02/JAX-CLINT14-1900.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2019/12/beach-wedding-in-Naxos-island-Greece-1-scaled-e1577362177929.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2019/03/Wedding-in-Santorini-Megan-Mike-13.jpg',
      'https://aegeandreamweddings.com/wp-content/uploads/2025/12/Wedding-In-Santorini-Brianna-Tyree-00014.jpg'
    ],
    cover_image: 'https://aegeandreamweddings.com/wp-content/uploads/2020/03/wedding-in-santorini.jpg',
    website: 'https://aegeandreamweddings.com/',
    sort_order: 3
  }

  // ===== 3. Happy Events =====
  const happyEvents = {
    slug: 'happy-events',
    name: 'Happy Events',
    name_cn: '快乐事件婚礼策划',
    source_url: 'https://happyevents.gr/',
    country: 'Greece',
    country_cn: '希腊',
    city: 'Athens',
    city_cn: '雅典',
    tagline: 'We Go Beyond Your Happy Events — Bringing Life to Your Most Beautiful Emotions',
    description: `Happy Events 是一家总部位于希腊雅典的全方位奢华婚礼与活动策划公司，由 Sophia Vamvounis 创立并领导，拥有超过15年的行业经验。

公司专注于为追求品质的国际客户打造独一无二的希腊目的地婚礼和高端活动。Happy Events 的设计风格永恒、时尚、精致，相信每场婚礼都应该像童话故事一样，让新人成为故事的主角。

作为希腊婚礼策划行业的标杆，Happy Events 已被 Wedding Chicks、Chic & Stylish Weddings、Hello Magazine、OK Magazine 等9家国际知名媒体刊登报道，并设计了众多名人婚礼。

公司拥有一支充满激情的专业团队，在希腊全境和各岛屿拥有广泛的优质供应商网络，能够提供从策划到执行的一站式服务，并以对精致美学的不懈追求和对完美的执着为每对新人创造难忘的体验。`,
    story: `Happy Events 由 Sophia Vamvounis 创立。Sophia 学习传播学和管理学，曾在全球顶级广告集团工作，后深造装饰设计和公共关系。

出于对美的信仰和爱的魔力的信念，Sophia 将 Happy Events 打造成了希腊婚礼策划的代名词。15年来，她带领创意团队在雅典开设了两家门店，并在塞浦路斯开设了加盟店。

Sophia 天性浪漫梦幻，热爱与丈夫在希腊岛屿上航行，享受与两个女儿的时光。她的人生格言是"Happiness is real only when shared"（分享时幸福才是真实的）。她最爱的花是牡丹、白色兰花和飞燕草，她相信简约之美。

如今，Happy Events 已成为一个动态企业集团的一部分，拥有自己的制作设备和技能，如音视频覆盖，因此能提供最具竞争力的价格。`,
    founded_year: 2009,
    team_members: [
      { name: 'Sophia Vamvounis', name_cn: '索菲亚·瓦姆沃尼斯', role: 'Founder & Creative Director / Head Wedding Planner', role_cn: '创始人 / 创意总监 / 首席婚礼策划师', description: 'Happy Events 创始人，15年+婚礼策划经验。曾在全球顶级广告集团工作，深造装饰设计和公共关系。被 Hello Magazine、OK Magazine 等媒体报道。', image: 'https://happyevents.gr/wp-content/uploads/2023/11/Sofia-home.jpg' }
    ],
    services: [
      { name: 'Full-Service Planning and Design', name_cn: '全程策划与设计', category: 'wedding', description: '为追求完美结果的新人量身定制，涵盖预算分析、创意概念、供应商谈判预订、所有婚礼任务监督和整体设计' },
      { name: 'Partial Planning and Design', name_cn: '部分策划与设计', category: 'wedding', description: '适合已完成部分安排但需要专业人士完善的新人，包含婚礼当日协调及设计/装饰协助' },
      { name: 'Wedding Day Coordination', name_cn: '婚礼当日协调', category: 'wedding', description: '婚礼当天的全程管理与协调服务' },
      { name: 'Destination Wedding Planning', name_cn: '目的地婚礼策划', category: 'wedding', description: '希腊全境及各岛屿的目的地婚礼策划' },
      { name: 'Wedding Design & Styling', name_cn: '婚礼设计与造型', category: 'wedding', description: '独特的婚礼视觉设计和风格定制' },
      { name: 'Vendor Recommendations & Bookings', name_cn: '供应商推荐与预订', category: 'wedding', description: '基于信任关系的希腊最佳供应商网络' },
      { name: 'Budget Management', name_cn: '预算管理', category: 'wedding', description: '根据预算定制服务方案' },
      { name: 'Wedding Proposals', name_cn: '求婚策划', category: 'event', description: '游艇、直升机、豪车等希腊特色惊喜求婚' },
      { name: 'Events & Baptism Planning', name_cn: '活动与洗礼策划', category: 'event', description: '生日派对、企业活动、洗礼仪式等策划' },
      { name: 'Corporate Events', name_cn: '企业活动', category: 'event', description: '企业活动和晚宴策划执行' }
    ],
    service_areas: [
      { name: 'Athens', name_cn: '雅典', detail: '希腊首都，城市婚礼和豪华酒店婚礼' },
      { name: 'Santorini', name_cn: '圣托里尼', detail: '爱琴海最美日落婚礼' },
      { name: 'Crete', name_cn: '克里特', detail: '希腊最大岛屿婚礼' },
      { name: 'Mykonos', name_cn: '米科诺斯', detail: '时尚岛屿婚礼' },
      { name: 'Peloponnese', name_cn: '伯罗奔尼撒', detail: 'Costa Navarino 等奢华度假村婚礼' },
      { name: 'Monemvasia', name_cn: '莫奈姆瓦夏', detail: '中世纪城堡婚礼' },
      { name: 'Paros & Symi', name_cn: '帕罗斯和锡米', detail: '小众岛屿婚礼' },
      { name: 'Porto Heli', name_cn: '波尔图海利', detail: '高端海滨婚礼' },
      { name: 'Spetses', name_cn: '斯佩察伊', detail: '传统贵族岛屿婚礼' }
    ],
    values_list: [
      { name: 'Timeless Elegance', name_cn: '永恒优雅', description: '发展永恒、时尚、精致的风格' },
      { name: 'Personalization', name_cn: '个性化', description: '每个设计都像新人本身一样独特' },
      { name: 'Passion', name_cn: '热情', description: '出于对所做事情的纯粹热情而创建公司' },
      { name: 'Aesthetic Excellence', name_cn: '美学卓越', description: '对精致美学和完美细节的不懈追求' },
      { name: 'Trust & Integrity', name_cn: '信任与正直', description: '与供应商建立基于信任和承诺的关系' },
      { name: 'Greek Inspiration', name_cn: '希腊灵感', description: '以希腊自然元素作为创作灵感源泉' }
    ],
    testimonials: [
      { couple: 'Elina & Angelos', text: 'I feel incredibly lucky to have found Sofia as my wedding planner. Sofia is not your typical planner, she will most probably become your friend since she truly cares about creating a perfect day for you.', text_cn: '我感到非常幸运能找到 Sofia 作为我的婚礼策划师。她不是一般的策划师，她很可能会成为你的朋友，因为她真的关心为你创造完美的一天。' },
      { couple: 'Katherine & Harris', text: 'I called her from New York in order to plan our wedding. Sophie has been incredibly helpful, very informative and gave me lots of options. She immediately understood my style.', text_cn: '我从纽约打电话给她来策划我们的婚礼。Sophie 非常乐于助人，信息丰富，给了我很多选择。她立即理解了我的风格。' },
      { couple: 'Antonia & Nikos', text: 'Thank you so much Sofia for everything! You did a great job. It was a magical wedding for us and we are so happy. You captured our vision exactly.', text_cn: '非常感谢你的一切，Sofia！你做得太棒了。对我们来说这是一场魔幻的婚礼，我们非常开心。你完美地捕捉了我们的愿景。' },
      { couple: 'Vicky & Spyros', text: 'Sophie is simply a really lovely person. Working with her allowed us to truly enjoy the planning process of our wedding in Greece, although we were in Luxemburg.', text_cn: 'Sophie 是一个非常可爱的人。与她合作让我们真正享受了在希腊策划婚礼的过程，尽管我们在卢森堡。' },
      { couple: 'Tonia & Makis', text: 'We had the most incredible day and it\'s all down to you. You did a stunning job and exceeded all of our expectations.', text_cn: '我们度过了最不可思议的一天，这都归功于你。你做得令人惊叹，超出了我们所有的期望。' }
    ],
    faq: [
      { q: '婚礼策划师费用贵吗？', a: 'Happy Events 根据您的预算定制服务，提供多种套餐。我们是预算意识强的公司，帮助您最大化利用每一分钱。甚至仅提供婚礼当日管理服务也可以选择。' },
      { q: '希腊最好的婚礼季节是什么时候？', a: '夏季适合海滩/海边婚礼；春季/秋季适合城堡婚礼（莫奈姆瓦夏、雷西姆农、马尼）；冬季适合独特的景观婚礼，特别是圣诞时节。希腊四季都适合办婚礼。' },
      { q: '如何沟通？', a: '我们在工作时间可通过Skype、电话或邮件联系。每次沟通都会详细记录并跟进。' },
      { q: '为什么需要婚礼策划师？', a: '专业婚礼策划师能消除压力，让所有人开心，确保你享受整个过程。你需要一双在婚礼当天为你把关的眼睛和耳朵。' },
      { q: '场地有协调员，为什么还需要策划师？', a: '场地协调员只关注接待环节。专业策划师全程陪伴：预算管理、设计指导、详细时间表、供应商沟通、宾客交通等。' },
      { q: '已有大部分供应商，你们能帮忙吗？', a: '当然可以。我们协调、管理和监督所有已预订的供应商，专注于细节，设计婚礼当天时间表，监督每个环节。' }
    ],
    partners: [
      { name: 'Wedding Chicks', role: '媒体报道', contact: '', website: 'weddingchicks.com' },
      { name: 'Chic & Stylish Weddings', role: '媒体报道', contact: '', website: 'chicandstylishweddings.com' },
      { name: 'Hello Magazine', role: '媒体报道', contact: '', website: 'hellomagazine.com' },
      { name: 'OK Magazine', role: '媒体报道', contact: '', website: 'okmagazine.com' },
      { name: 'Greek City Times', role: '媒体报道', contact: '', website: 'greekcitytimes.com' },
      { name: 'Love4Weddings', role: '媒体报道', contact: '', website: 'love4weddings.gr' },
      { name: 'Amber & Muse', role: '媒体报道', contact: '', website: 'amberandmuse.com' },
      { name: 'Wedding Sparrow', role: '媒体报道', contact: '', website: 'weddingsparrow.com' },
      { name: 'Gossip Magazine', role: '媒体报道', contact: '', website: '' }
    ],
    images: [
      'https://happyevents.gr/wp-content/uploads/2022/12/New5.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/New1.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/06/2.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/Your-wedding-greece-new1.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/06/4.jpg',
      'https://happyevents.gr/wp-content/uploads/2023/01/New-Slide-5-e1675869548599.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/home-weddings.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/home-events-1.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/what-we-do-new2.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/why-us-home.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/why-us-nside.jpg',
      'https://happyevents.gr/wp-content/uploads/2023/11/Sofia-home.jpg',
      'https://happyevents.gr/wp-content/uploads/2020/03/myway_photo.jpg',
      'https://happyevents.gr/wp-content/uploads/2020/03/Wedding_Details2-1.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/Your-wedding-greece-new2.jpg',
      'https://happyevents.gr/wp-content/uploads/2020/03/slide_services_1.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/Proposal-new.jpg',
      'https://happyevents.gr/wp-content/uploads/2022/12/Christening.jpg',
      'https://happyevents.gr/wp-content/uploads/2020/03/Happy-Events-LOGO_new.png',
      'https://happyevents.gr/wp-content/uploads/2020/07/castlewedding-1024x682.jpg',
      'https://happyevents.gr/wp-content/uploads/2025/02/LesAnagnou_wed_ha21092024_379-scaled-e1739972132823-843x1024.jpg'
    ],
    cover_image: 'https://happyevents.gr/wp-content/uploads/2022/12/New5.jpg',
    website: 'https://happyevents.gr/',
    sort_order: 4
  }

  // ===== 插入数据 =====
  const companies = [weddingsItaly, aegeanDream, happyEvents]

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
        JSON.stringify(data.team_members), JSON.stringify(data.services), JSON.stringify(data.service_areas),
        JSON.stringify(data.values_list), JSON.stringify(data.testimonials), JSON.stringify(data.faq),
        JSON.stringify(data.partners), JSON.stringify(data.images),
        data.cover_image, data.website, data.sort_order
      ]
    )
    console.log(`✓ ${data.name_cn} (${data.slug}) 已插入`)
  }

  // 验证
  const [all] = await pool.execute('SELECT id, slug, name, name_cn, country_cn, city_cn, founded_year, JSON_LENGTH(team_members) AS members, JSON_LENGTH(services) AS services, JSON_LENGTH(images) AS images FROM crawled_wedding_teams ORDER BY sort_order')
  console.log('\n===== 所有婚礼团队 =====')
  console.table(all)

  await pool.end()
}

run().catch(err => { console.error(err); process.exit(1) })
