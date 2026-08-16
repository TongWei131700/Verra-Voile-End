/**
 * 插入 SposiamoVi 婚礼策划公司数据到 crawled_wedding_teams 表
 * 数据来源：https://sposiamovi.it/ 爬取
 */
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile'
  })

  const data = {
    slug: 'sposiamovi',
    name: 'SposiamoVi',
    name_cn: '斯波夏莫薇',
    source_url: 'https://sposiamovi.it/',
    country: 'Italy',
    country_cn: '意大利',
    city: 'Florence',
    city_cn: '佛罗伦萨',
    tagline: '意大利奢华目的地婚礼策划 · Vogue 推荐顶级策划团队',
    description: `SposiamoVi is the premier luxury destination wedding planner in Italy, where your love story meets the soul of Italy. Founded by Silvia Galli, the team creates exclusive destination weddings in the most beautiful Italian locations — Lake Como, Amalfi Coast, Tuscany, Venice, Rome, Sicily, Portofino and Puglia — crafting one-of-a-kind wedding experiences.

Recommended by Vogue magazine, SposiamoVi is renowned for its exceptional design aesthetics, meticulous attention to detail, and deep understanding of the Italian luxury lifestyle. Every wedding is an original creation, from visual concept to final execution, transforming the couple's vision into a reality that exceeds expectations.

The team of 14 experienced wedding planners covers all of Italy's most coveted destinations. They are not only experts in every aspect of wedding planning, but also deeply knowledgeable about Italy's cultural treasures and hidden gems, delivering the most authentic and unforgettable Italian wedding experience.`,
    story: `SposiamoVi was born from founder Silvia Galli's deep love for Italian aesthetics and hospitality. As a seasoned wedding planner with nearly 20 years of experience in the Italian destination wedding industry, Silvia understood that every couple deserves a truly personal wedding — not a cookie-cutter template.

She brought together a team of passionate wedding planners from across Italy, building this elite team that covers the entire country. From intimate ceremonies on Lake Como to grand celebrations on the Amalfi Coast, from the pastoral romance of Tuscan estates to the classical luxury of Venetian palaces, SposiamoVi always insists on original design inspired by the couple's love story.

Since 2006, SposiamoVi has orchestrated over 600 weddings for non-Italian couples, with staff fluent in Italian, English, and German. They specialize in Civil, Symbolic, Catholic, Jewish, Hindu, Protestant, and Interfaith weddings.

Today, SposiamoVi has become an internationally recognized top Italian wedding planning brand, recommended by Vogue and other authoritative publications, serving distinguished clients from around the world.`,
    founded_year: 2006,
    team_members: [
      {
        name: 'Silvia Galli', name_cn: '西尔维娅·加利',
        role: 'Founder & Senior Wedding Planner', role_cn: '创始人 / 资深婚礼策划师',
        description: 'Creative and strategic mind behind SposiamoVi. Nearly 20 years of experience in the Italian destination wedding industry. Leads planning processes, team training, and quality standards. Works with limited clients each season for a hands-on approach.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Silvia-Galli.png',
      },
      {
        name: 'Valentina Di Tinco', name_cn: '瓦伦蒂娜·迪·廷科',
        role: 'Senior Wedding Planner — Southern Italy', role_cn: '资深婚礼策划师 · 意大利南部',
        description: 'Specializes in Southern Italy including Amalfi Coast, Capri, and Puglia. Renowned for off-the-beaten-path venues, unique experiences, and the finest restaurants.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Valentina-di-Tinco-768x1152.jpg',
      },
      {
        name: 'Sandra Celoni', name_cn: '桑德拉·切洛尼',
        role: 'Senior Wedding Planner', role_cn: '资深婚礼策划师',
        description: 'Based near Florence, Chianti area. In tourism since 1993, events since 1999. Former Project Manager for medical congresses. Joined the wedding industry in 2012.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Sandra-768x1152.jpg',
      },
      {
        name: 'Silvia Piazzini', name_cn: '西尔维娅·皮亚齐尼',
        role: 'Senior Wedding Planner', role_cn: '资深婚礼策划师',
        description: 'A decade of experience. Started as event manager at a renowned hotel. Native Italian with deep passion for Italy\'s history, culture, beauty, fashion, and cuisine.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Silvia-Piazzini-768x1152.jpg',
      },
      {
        name: 'Marta Buson', name_cn: '玛尔塔·布松',
        role: 'Senior Wedding Planner — Venice', role_cn: '资深婚礼策划师 · 威尼斯',
        description: 'Passion for visual storytelling. Naturally precise, organized, and detail-oriented. Devotes herself completely to each couple\'s vision.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Marta-Buson-768x866.jpg',
      },
      {
        name: 'Anna Grimaldi', name_cn: '安娜·格里马尔迪',
        role: 'Senior Wedding Planner — Amalfi Coast', role_cn: '资深婚礼策划师 · 阿马尔菲海岸',
        description: 'Works on the Amalfi Coast. Originally from Campania. Studied Tourism Management, spent time in France and England. Sharp planning skills from 5-star luxury hotel experience.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Anna-Grimaldi-768x1153.jpg',
      },
      {
        name: 'Gemma Borelli', name_cn: '杰玛·博雷利',
        role: 'Wedding Planner', role_cn: '婚礼策划师',
        description: 'Born and raised in Florence. Background in psychotherapy, transitioned to weddings. Energetic, hands-on, and resourceful.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Gemma-Borelli-768x1152.jpg',
      },
      {
        name: 'Giulia Melani', name_cn: '朱莉娅·梅拉尼',
        role: 'Head of Guest Experience & Services', role_cn: '宾客体验与服务总监',
        description: 'Curates bespoke Italian wedding experiences for couples and their loved ones. Manages transportation, bookings, and guest logistics.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Giulia-Melani-768x768.jpeg',
      },
      {
        name: 'Martina Forzoni', name_cn: '玛蒂娜·福尔佐尼',
        role: 'Wedding Planner', role_cn: '婚礼策划师',
        description: 'Lives in Tuscan countryside near Siena. Over 10 years in tourism and hospitality, former Events Manager at luxury resort.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Martina-Forzoni-768x1152.jpg',
      },
      {
        name: 'Altynay Nurlybek', name_cn: '阿尔蒂奈',
        role: 'Graphic Designer & Stylist', role_cn: '平面设计师与造型师',
        description: 'Originally from Kazakhstan, based in Florence. Background in art, interior design, and architecture. Combines structure and creativity.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Alty-768x1152.jpg',
      },
      {
        name: 'Ada Pinheiro', name_cn: '阿达·皮涅鲁',
        role: 'Graphic Designer & Stylist', role_cn: '平面设计师与造型师',
        description: 'Former lawyer from Brazil. Joined SposiamoVi in 2023. Focuses on harmony of proportion and stylistic coherence. Creates visual brands for weddings.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Ada-768x1152.jpg',
      },
      {
        name: 'Martina Casprini', name_cn: '玛蒂娜·卡斯普里尼',
        role: 'Guest Management', role_cn: '宾客管理',
        description: 'Wedding Guest Manager. Background in event organization from Progeas University and IED.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Martina-Casprini-768x1152.jpg',
      },
      {
        name: 'Elisa Rossi', name_cn: '艾丽莎·罗西',
        role: 'Guest Management', role_cn: '宾客管理',
        description: 'Based in Florence. Background in foreign languages, experience as receptionist in luxury hotels. Specialized in wedding planning and design.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Elisa-768x1152.jpg',
      },
      {
        name: 'Camilla Pratesi', name_cn: '卡米拉·普拉泰西',
        role: 'Team & Planning Assistant', role_cn: '团队与策划助理',
        description: 'From Florence. Degree in Linguistic Mediation, master\'s in Tourism. Manages back-office operations and supports wedding planners.',
        image: 'https://sposiamovi.it/wp-content/uploads/2025/11/Camilla-Pratesi-768x1152.jpg',
      },
    ],
    services: [
      {
        title: 'Full Service & Planning', title_cn: '全程策划服务',
        items: [
          { label: 'Initial Consultation', label_cn: '初次咨询', desc: 'Open and transparent conversation to understand your vision, style preferences, and budget' },
          { label: 'Budgeting & Timeline', label_cn: '预算与时间规划', desc: 'Comprehensive budget analysis and wedding筹备 timeline creation' },
          { label: 'Vendor Selection & Management', label_cn: '供应商管理', desc: 'Careful selection and coordination of photographers, florists, caterers, and all vendors' },
          { label: 'Venue Research & Shortlist', label_cn: '场地筛选', desc: 'Research and recommend the best Italian venues matching your requirements' },
          { label: 'Bespoke Moodboards & Design', label_cn: '灵感板与设计', desc: 'Custom moodboards, venue selection, sophisticated florals and design concepts' },
          { label: 'On-Site Coordination', label_cn: '现场统筹', desc: 'Full on-site coordination on the wedding day, from bridal dressing to final farewell' },
          { label: 'Final Checks & Coordination', label_cn: '最终协调', desc: 'Room checks, gift collection, belongings return, and flawless execution' },
        ],
      },
      {
        title: 'Design & Styling', title_cn: '设计与造型',
        items: [
          { label: 'Concept Development', label_cn: '概念开发', desc: 'Extract wedding design concept from the couple\'s love story' },
          { label: 'Custom Moodboards', label_cn: '定制灵感板', desc: 'Create visual moodboards to unify the wedding aesthetic direction' },
          { label: 'Floral Design & Décor', label_cn: '花艺设计与装饰', desc: 'Complete floral design and decor for ceremony and reception spaces' },
          { label: 'Styling & Aesthetic Coherence', label_cn: '整体造型与美学统一', desc: 'Ensure every visual element harmonizes with the design concept' },
        ],
      },
      {
        title: 'Guest Care', title_cn: '宾客关怀',
        items: [
          { label: 'Luxury Accommodation Booking', label_cn: '奢华住宿预订', desc: 'Coordinate hotel and unique accommodation for all guests' },
          { label: 'Airport Transfers', label_cn: '机场接送', desc: 'Arrange seamless transportation from airport to wedding venues' },
          { label: 'Curated Local Experiences', label_cn: '定制本地体验', desc: 'Create memorable experiences for guests including welcome dinners and excursions' },
          { label: 'Personalized Guest Websites', label_cn: '定制宾客网站', desc: 'Build personalized websites with all wedding information for guests' },
          { label: 'Concierge Assistance', label_cn: '礼宾服务', desc: 'Dedicated concierge service for every guest throughout their stay' },
        ],
      },
      {
        title: 'Consulting Service', title_cn: '咨询服务',
        items: [
          { label: 'Expert Guidance', label_cn: '专业指导', desc: 'Professional advice and direction for self-planning couples' },
          { label: 'Vendor Recommendations', label_cn: '供应商推荐', desc: 'Curated list of verified, high-quality Italian wedding vendors' },
          { label: 'Location Scouting', label_cn: '场地考察', desc: 'On-site location scouting and detailed venue assessments' },
          { label: 'Travel Planning Assistance', label_cn: '旅行规划协助', desc: 'Help with travel logistics, best seasons, and regional recommendations' },
        ],
      },
    ],
    service_areas: [
      { name: 'Tuscany', name_cn: '托斯卡纳', url: 'https://sposiamovi.it/destination-weddings-italy/tuscany-weddings/' },
      { name: 'Amalfi Coast', name_cn: '阿马尔菲海岸', url: 'https://sposiamovi.it/destination-weddings-italy/amalfi-coast-weddings/' },
      { name: 'Lake Como', name_cn: '科莫湖', url: 'https://sposiamovi.it/destination-weddings-italy/lake-como-weddings/' },
      { name: 'Portofino', name_cn: '波托菲诺', url: 'https://sposiamovi.it/destination-weddings-italy/portofino-weddings/' },
      { name: 'Venice', name_cn: '威尼斯', url: 'https://sposiamovi.it/destination-weddings-italy/venice-weddings/' },
      { name: 'Rome', name_cn: '罗马', url: 'https://sposiamovi.it/destination-weddings-italy/rome-wedding/' },
      { name: 'Sicily', name_cn: '西西里', url: 'https://sposiamovi.it/destination-weddings-italy/sicily-weddings/' },
      { name: 'Puglia', name_cn: '普利亚', url: 'https://sposiamovi.it/destination-weddings-italy/puglia-weddings/' },
    ],
    specialties: ['奢华目的地婚礼', '全意大利覆盖', 'Vogue 推荐', '原创设计', '宾客管理'],
    testimonials: [
      { couple: 'Sara & Adam', title: 'An Experience Beyond Expectations', text: 'A 4-day celebration for 100 people at Lake Como. Silvia was extremely organized and every detail was perfect.', text_cn: '在科莫湖举办了为期4天的100人庆典。Silvia 极其有条理，每一个细节都完美无缺。' },
      { couple: 'Lixian & Yousef', title: 'Every Detail, Perfectly Curated', text: 'A 3-day celebration where all events were executed to perfection. The team\'s attention to detail was remarkable.', text_cn: '为期3天的庆典，所有活动都完美执行。团队对细节的关注令人赞叹。' },
      { couple: 'Diana & Russell', title: 'Elegance, Vision, and Absolute Care', text: 'Valentina was wonderful. Fantastic style and absolute care throughout the entire planning process.', text_cn: 'Valentina 非常棒。整个策划过程中展现出出色的风格和无微不至的关怀。' },
      { couple: 'Ashley & Luigi', title: 'Where Dreams Become Reality', text: 'Our Positano destination wedding with a lemon theme was absolutely magical. SposiamoVi made our dreams come true.', text_cn: '我们在波西塔诺的柠檬主题目的地婚礼简直如梦如幻。SposiamoVi 让我们的梦想成真。' },
      { couple: 'Anna & John', title: 'A Seamless Journey from Start to Finish', text: 'Planning from California, everything surpassed our expectations. The team made the entire process seamless.', text_cn: '从加州远程策划，一切都超越了我们的期望。团队让整个过程无缝衔接。' },
      { couple: 'Maria & Matus', title: 'Pure Excellence in Every Choice', text: 'Even during COVID, the team never lost their positive attitude. Pure excellence in every choice they made.', text_cn: '即使在新冠期间，团队也从未失去积极态度。每一个选择都体现了卓越品质。' },
      { couple: 'Vrissi & Jordan', title: 'An Extraordinary Wedding, Effortlessly', text: 'Planning was easy, vendors were amazing, and the wedding truly felt like a fairytale come to life.', text_cn: '策划过程很轻松，供应商们都很棒，婚礼真的像童话故事变成了现实。' },
      { couple: 'Vanessa & John', title: 'More Than a Wedding', text: 'A perfect wedding day in Capri with 10 months of stress-free planning. It was more than just a wedding.', text_cn: '在卡普里的完美婚礼日，10个月无压力的策划。这不仅仅是一场婚礼。' },
    ],
    faq: [
      { q: 'What services does SposiamoVi offer?', q_cn: 'SposiamoVi 提供哪些服务？', a: 'Full-service destination wedding planning, bespoke event design, comprehensive guest care, and consulting services. We cover every aspect from initial consultation to wedding day execution.', a_cn: '全程目的地婚礼策划、定制活动设计、全方位宾客关怀和咨询服务。我们覆盖从初次咨询到婚礼当天执行的所有环节。' },
      { q: 'What are the best wedding destinations in Italy?', q_cn: '意大利最好的婚礼目的地有哪些？', a: 'Lake Como villas, Tuscan estates, Amalfi Coast cliffs, Puglia\'s masserie, Venice palaces, Portofino\'s charm, Rome\'s elegance, and Sicily\'s warmth are our top recommendations.', a_cn: '科莫湖别墅、托斯卡纳庄园、阿马尔菲海岸悬崖、普利亚的农庄、威尼斯宫殿、波托菲诺的魅力、罗马的优雅和西西里的温暖是我们最推荐的。' },
      { q: 'Can you handle legal requirements for destination weddings?', q_cn: '你们能处理目的地婚礼的法律要求吗？', a: 'Yes, we guide couples through Civil and Religious ceremonies. We also arrange Symbolic weddings, handling all bureaucracy, document translations, and legal requirements.', a_cn: '是的，我们指导新人完成民事和宗教仪式。我们也安排象征性婚礼，处理所有文书工作、文件翻译和法律要求。' },
      { q: 'Why should I hire a local Italian wedding planner?', q_cn: '为什么要聘请意大利本地婚礼策划师？', a: 'Local planners have access to exclusive vendors and hidden gem venues, better negotiation power, fluency in local language, and flawless logistics management that international planners cannot match.', a_cn: '本地策划师可以接触到独家供应商和隐秘场地，拥有更强的谈判能力、流利的本地语言和无懈可击的后勤管理，这些是国际策划师无法比拟的。' },
      { q: 'How do you manage guest logistics?', q_cn: '你们如何管理宾客后勤？', a: 'Our dedicated Guest Care team handles luxury accommodation booking, airport transfers, curated local experiences, personalized guest websites, and concierge assistance throughout their stay.', a_cn: '我们专门的宾客关怀团队负责奢华住宿预订、机场接送、定制本地体验、个性化宾客网站以及住宿期间的礼宾服务。' },
      { q: 'How far in advance should we start planning?', q_cn: '我们应该提前多久开始策划？', a: 'We recommend 12-18 months for top-tier venues and vendors. However, we are experienced with shorter timelines for elopements and intimate weddings.', a_cn: '我们建议顶级场地和供应商提前12-18个月。但是，我们在私奔婚礼和亲密婚礼的较短时间表方面也有丰富经验。' },
      { q: 'Do you offer elopement packages?', q_cn: '你们提供私奔婚礼套餐吗？', a: 'Yes, we specialize in high-end intimate weddings and elopements with the same luxury level and attention to detail as our larger celebrations.', a_cn: '是的，我们专注于高端亲密婚礼和私奔婚礼，与大型庆典保持同样的奢华水平和细节关注。' },
      { q: 'What makes SposiamoVi different from other planners?', q_cn: 'SposiamoVi 与其他策划师有什么不同？', a: 'Since 2006, we have orchestrated over 600 weddings. Our team of 14 covers all of Italy, is trilingual, and offers original design inspired by each couple\'s unique love story. We are recommended by Vogue.', a_cn: '自2006年以来，我们已经策划了600多场婚礼。我们14人的团队覆盖全意大利，精通三种语言，提供以每对新人独特爱情故事为灵感的原创设计。我们被 Vogue 推荐。' },
    ],
    partners: [
      { name: 'Vogue', role: '媒体报道' },
      { name: 'Wedding Wire', role: '合作平台' },
    ],
    images: [
      // Hero 轮播（前3张）
      'https://sposiamovi.it/wp-content/uploads/2025/12/AA_Wedding_1252-2.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/08/WhatsApp-Image-2026-01-08-at-15.15.06-2.jpeg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/ca-27-scaled.jpg',
      // 作品集
      'https://sposiamovi.it/wp-content/uploads/2025/12/B-C-wedding-131.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/37-alessia-scott-wedding-varna-studios-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/10094513871.jpg_m1.jpg_exif1.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/9789035476.jpg_m1.jpg_exif1.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/BEST_0092.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/I-and-M-56.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/AlessiaTedHighlights-0021-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/wedding-preview-36-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/242A6004.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/001-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/R-and-Y-Rehearsal-208.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/0027_0073_Wedding_01_00473-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/1T2A9243.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/courtney-massimiliano-wedding-palazzo-pisani-moretta-venice-1473.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/lily-barrett-welcome-cocktail-remer-venice-57-1.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/0073_DB_07401-1.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/La-Dichosa-Daria-Thierry-Preview-Portofino-66.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/TusnimDom-170.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/183_Wedd_02_00448-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/0051Brunch_01-00088-1.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/Wed_01_02533-scaled.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/RN-766-1.jpg',
      'https://sposiamovi.it/wp-content/uploads/2025/12/cbeccc46-aaf0-48f2-b8d0-4506a426fbfd.jpg',
    ],
    cover_image: 'https://sposiamovi.it/wp-content/uploads/2025/12/AA_Wedding_1252-2.jpg',
    headshot: 'https://sposiamovi.it/wp-content/uploads/2025/11/Silvia-Galli.png',
    website: 'https://sposiamovi.it/',
    price: 5000,
    sort_order: 1,
  }

  try {
    // 检查是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM crawled_wedding_teams WHERE slug = ?',
      [data.slug]
    )

    if (existing.length > 0) {
      // 更新
      await pool.execute(
        `UPDATE crawled_wedding_teams SET
          name = ?, name_cn = ?, source_url = ?, country = ?, country_cn = ?,
          city = ?, city_cn = ?, tagline = ?, description = ?, story = ?,
          founded_year = ?, team_members = ?, services = ?, service_areas = ?,
          specialties = ?, testimonials = ?, faq = ?, partners = ?,
          images = ?, cover_image = ?, headshot = ?, website = ?,
          price = ?, sort_order = ?
        WHERE slug = ?`,
        [
          data.name, data.name_cn, data.source_url, data.country, data.country_cn,
          data.city, data.city_cn, data.tagline, data.description, data.story,
          data.founded_year, JSON.stringify(data.team_members), JSON.stringify(data.services), JSON.stringify(data.service_areas),
          JSON.stringify(data.specialties), JSON.stringify(data.testimonials), JSON.stringify(data.faq), JSON.stringify(data.partners),
          JSON.stringify(data.images), data.cover_image, data.headshot, data.website,
          data.price, data.sort_order,
          data.slug,
        ]
      )
      console.log('✓ 已更新 sposiamovi 数据')
    } else {
      // 插入
      await pool.execute(
        `INSERT INTO crawled_wedding_teams
          (slug, name, name_cn, source_url, country, country_cn, city, city_cn,
           tagline, description, story, founded_year,
           team_members, services, service_areas, specialties,
           testimonials, faq, partners, images,
           cover_image, headshot, website, price, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.slug, data.name, data.name_cn, data.source_url, data.country, data.country_cn,
          data.city, data.city_cn, data.tagline, data.description, data.story, data.founded_year,
          JSON.stringify(data.team_members), JSON.stringify(data.services), JSON.stringify(data.service_areas),
          JSON.stringify(data.specialties),
          JSON.stringify(data.testimonials), JSON.stringify(data.faq), JSON.stringify(data.partners),
          JSON.stringify(data.images),
          data.cover_image, data.headshot, data.website, data.price, data.sort_order,
        ]
      )
      console.log('✓ 已插入 sposiamovi 数据')
    }

    // 验证
    const [rows] = await pool.execute('SELECT slug, name, name_cn, country_cn, city_cn, founded_year, price, LENGTH(description) as desc_len, JSON_LENGTH(team_members) as team_count, JSON_LENGTH(images) as img_count FROM crawled_wedding_teams WHERE slug = ?', [data.slug])
    console.log('\n验证数据:', JSON.stringify(rows[0], null, 2))
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

main()
