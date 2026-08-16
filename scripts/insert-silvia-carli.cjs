/**
 * Silvia Carli Events 图片下载 + 数据插入
 * 来源: https://www.silviacarlievents.com/
 */
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const BASE_DIR = path.join(__dirname, '../uploads/crawled/silvia-carli-events')

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://www.silviacarlievents.com/',
      },
      timeout: 30000,
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const ws = fs.createWriteStream(dest)
      res.pipe(ws)
      ws.on('finish', () => { ws.close(); resolve() })
      ws.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout for ${url}`)) })
  })
}

async function main() {
  const pool = mysql.createPool({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile' })

  const [existing] = await pool.execute('SELECT id FROM crawled_wedding_teams WHERE slug = ?', ['silvia-carli-events'])
  if (existing.length > 0) {
    console.log('silvia-carli-events 已存在，跳过')
    await pool.end()
    return
  }

  // 创建目录
  for (const sub of ['cover', 'headshot', 'portfolio']) {
    fs.mkdirSync(path.join(BASE_DIR, sub), { recursive: true })
  }

  // === 图片 URL ===
  const coverUrl = 'https://www.silviacarlievents.com/wp-content/uploads/2025/11/cut5-scaled.jpg'
  const headshotUrl = 'https://www.silviacarlievents.com/wp-content/uploads/2022/12/silvia-carli-weddingplanner.jpg'
  const portfolioUrls = [
    'https://www.silviacarlievents.com/wp-content/uploads/2024/12/Edoardo-Giorio-Photography-1383-scaled.jpeg',
    'https://www.silviacarlievents.com/wp-content/uploads/2024/12/Edoardo-Giorio-Photography-1122.jpeg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/01/GG_40.jpeg',
    'https://www.silviacarlievents.com/wp-content/uploads/2024/12/20230910_DOSMASENLAMESA_FRANCESCAMATTEO_TURIN-46.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2024/12/FedericaManuel6086.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2024/12/20230910_DOSMASENLAMESA_FRANCESCAMATTEO_TURIN-480.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2022/12/wedding-sposi.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/02/taglio-foto-corso-bridal.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/02/20230910_DOSMASENLAMESA_FRANCESCAMATTEO_TURIN-483.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2022/12/Wedding-sposo.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/02/fede-e-manuel.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/11/0472LMB01622-scaled.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/11/carlotta_alessandro_wed_0969.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/11/AD_17.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2022/12/ALICEeLUCA.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2022/12/ELENA-ENRICO.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2022/12/kiss-wedding.jpg',
    'https://www.silviacarlievents.com/wp-content/uploads/2025/09/Edoardo-Giorio-Photography-813-scaled.jpeg',
  ]

  let ok = 0, fail = 0

  // 下载封面
  try {
    await download(coverUrl, path.join(BASE_DIR, 'cover', 'cover.jpg'))
    console.log('✅ cover/cover.jpg')
    ok++
  } catch (e) { console.error('❌ cover:', e.message); fail++ }

  // 下载头像
  try {
    await download(headshotUrl, path.join(BASE_DIR, 'headshot', 'headshot.jpg'))
    console.log('✅ headshot/headshot.jpg')
    ok++
  } catch (e) { console.error('❌ headshot:', e.message); fail++ }

  // 下载作品集
  for (let i = 0; i < portfolioUrls.length; i++) {
    const url = portfolioUrls[i]
    const name = `${String(i + 1).padStart(2, '0')}.jpg`
    try {
      await download(url, path.join(BASE_DIR, 'portfolio', name))
      console.log(`✅ portfolio/${name}`)
      ok++
    } catch (e) { console.error(`❌ portfolio/${name}:`, e.message); fail++ }
  }

  console.log(`\n下载完成: ${ok} 成功, ${fail} 失败`)

  // === 数据 ===
  const slug = 'silvia-carli-events'
  const name = 'Silvia Carli Events'
  const name_cn = '西尔维娅·卡利婚礼策划'
  const source_url = 'https://www.silviacarlievents.com/'
  const country = 'Italy'
  const country_cn = '意大利'
  const city = 'Turin'
  const city_cn = '都灵'
  const tagline = '意大利目的地婚礼策划师 · 都灵与托斯卡纳的优雅庆典'
  const description = `Silvia Carli Events 是一家位于意大利都灵的婚礼策划公司，由 Silvia Carli 创立。Silvia 拥有超过 25 年的传播与活动行业经验，精通法语和英语，专注于为新人打造意大利目的地婚礼。

她的职业生涯始于 90 年代初的美国广告公司，后转入促销广告行业负责客户管理和活动组织。在经历了戏剧配音、科技公司营销等多个领域后，她将 25 年的积累倾注于婚礼策划事业，致力于为客户提供无可挑剔的完美服务。

Silvia 的工作覆盖都灵、皮埃蒙特和托斯卡纳地区，同时也愿意前往意大利任何地方。她的策划理念建立在四大原则之上：诚信与正直、量身定制的体验、追求卓越、以及信任。

无论是私密的小型婚礼、主题婚礼还是多日庆典，Silvia 都会全程陪伴，从愿景构思、预算优化、供应商甄选到婚礼当天的完整统筹，将你们的愿景转化为无缝而深情的体验。`

  const founded_year = 2015
  const website = 'https://www.silviacarlievents.com/'
  const cover_image = '/uploads/crawled/silvia-carli-events/cover/cover.jpg'
  const headshot = '/uploads/crawled/silvia-carli-events/headshot/headshot.jpg'
  const price = 8000

  const team_members = [
    {
      name: 'Silvia Carli',
      name_cn: '西尔维娅·卡利',
      role: 'Founder & Dream Event Creator',
      role_cn: '创始人 / 梦想婚礼创造者',
      image: '',
      description: 'Silvia is an incurable romantic with a rock soul. With over 25 years of experience in communication and events, she brings integrity, tailored service, and excellence to every wedding. Fluent in French and English, she specializes in destination weddings across Italy, with a deep knowledge of Turin, Piedmont, and Tuscany.',
      description_cn: 'Silvia 是一位无可救药的浪漫主义者，带有一点摇滚灵魂。凭借超过 25 年的传播与活动行业经验，她为每一场婚礼带来诚信、定制化的服务和卓越品质。精通法语和英语，专注于意大利目的地婚礼，对都灵、皮埃蒙特和托斯卡纳了如指掌。',
      link: 'https://www.silviacarlievents.com/about-me/',
    }
  ]

  const services = [
    {
      title: 'Wedding Planning Services',
      title_cn: '婚礼策划服务',
      items: [
        { label: 'Event Conception & Planning', label_cn: '婚礼构思与全程策划', desc: 'From the initial vision to the final detail, complete bespoke wedding planning tailored to your style and budget', desc_cn: '从最初构想到最终细节，完全定制的婚礼策划，贴合你们的风格与预算' },
        { label: 'Venue Research & Selection', label_cn: '场地甄选与推荐', desc: 'Church, town hall, or unique location sourcing — optimized to match your tastes and save your precious time', desc_cn: '教堂、市政厅或独特场地寻源——优化匹配你们的品味，节省宝贵时间' },
        { label: 'Catering & Wedding Cake', label_cn: '餐饮与婚礼蛋糕', desc: 'Curated catering and banqueting selections, including the perfect wedding cake to crown your celebration', desc_cn: '精选餐饮与宴会方案，包括为你们的庆典锦上添花的完美婚礼蛋糕' },
        { label: 'Floral Design & Setup', label_cn: '花艺设计与布置', desc: 'Stunning floral arrangements and scenic setups that transform your venue into a dreamscape', desc_cn: '令人惊叹的花艺布置与场景设计，将你们的场地变成梦幻空间' },
        { label: 'Photo & Video Coordination', label_cn: '摄影摄像统筹', desc: 'Professional photographer and videographer recommendations, with full day coordination for perfect coverage', desc_cn: '专业摄影师和摄像师推荐，全天统筹确保完美记录' },
        { label: 'Beauty & Entertainment', label_cn: '美妆与娱乐', desc: 'Hair, makeup, music, and entertainment sourcing for a complete and seamless celebration', desc_cn: '发型、化妆、音乐和娱乐资源对接，打造完整无缝的庆典' },
      ]
    },
    {
      title: 'Planning Process',
      title_cn: '策划流程',
      items: [
        { label: 'Vision & Consultation', label_cn: '愿景沟通与咨询', desc: 'Share your dreams and desires; Silvia stays by your side, suggesting and advising on choices and budget', desc_cn: '分享你们的梦想与期望，Silvia 全程陪伴，提供选择和预算建议' },
        { label: 'Budget Optimization', label_cn: '预算优化', desc: 'Determine the right budget, optimize expenses, and find ways to save without compromising quality', desc_cn: '确定合理预算，优化开支，在不牺牲品质的前提下寻找节省方案' },
        { label: 'Supplier Selection', label_cn: '供应商甄选', desc: 'Thorough research with a team of selected professionals, checking availability and requesting quotations', desc_cn: '与精选专业团队进行深入调研，确认可用性并获取报价' },
        { label: 'Wedding Day Management', label_cn: '婚礼当天管理', desc: 'First to arrive and last to leave — full coordination of logistics, setups, guests, and event conclusion', desc_cn: '第一个到达、最后一个离开——全面统筹后勤、布置、宾客接待和活动收尾' },
      ]
    },
    {
      title: 'Event Types',
      title_cn: '活动类型',
      items: [
        { label: 'Destination Weddings in Italy', label_cn: '意大利目的地婚礼', desc: 'Expert planning for international couples dreaming of an Italian wedding in Turin, Tuscany, or beyond', desc_cn: '为梦想在意大利举办婚礼的国际新人提供专业策划，覆盖都灵、托斯卡纳等地' },
        { label: 'Intimate & Micro Weddings', label_cn: '私密与微型婚礼', desc: 'Heartfelt, intentional, and deeply emotional celebrations for small guest lists', desc_cn: '为小型宾客名单打造真挚、用心且深情的庆典' },
        { label: 'Themed Weddings', label_cn: '主题婚礼', desc: 'Creative themed celebrations — from Harry Potter magic to music-inspired events and beyond', desc_cn: '创意主题庆典——从哈利波特魔法到音乐灵感主题等' },
        { label: 'Graphic Coordination', label_cn: '视觉协调设计', desc: 'Complete visual identity for your wedding, from invitations to table settings and luminous scenes', desc_cn: '完整的婚礼视觉识别系统，从请柬到餐桌布置和灯光场景' },
      ]
    }
  ]

  const images = portfolioUrls.map((_, i) => `/uploads/crawled/silvia-carli-events/portfolio/${String(i + 1).padStart(2, '0')}.jpg`)

  const specialties = ['意大利目的地婚礼', '都灵与托斯卡纳', '私密婚礼', '主题婚礼', '全程策划服务', '25年行业经验']

  const testimonials = [
    {
      author: 'Valentine & David',
      role: 'Torino Wedding',
      content: 'We were incredibly lucky to find Silvia. She is extremely attentive and truly understands her clients\' taste. She never counts the hours she spends working. Her advice is always spot on, and she is honest about the quality/price ratio. Always with a smile, Silvia is a truly dedicated professional you can completely trust — and who has now become a friend!',
      content_cn: '我们非常幸运能找到 Silvia。她极其细心，真正理解客户的品味。她从不计较工作花费的时间。她的建议总是恰到好处，对性价比的评价也很诚实。总是带着微笑，Silvia 是一位真正敬业的专业人士，你可以完全信任她——现在她已经成为了我们的朋友！'
    },
    {
      author: 'Carlotta & Alessandro',
      role: 'Harry Potter Themed Wedding',
      content: 'Silvia was exactly the person you want by your side on such an emotional day. She made our Harry Potter–themed wedding truly magical, down to the smallest detail. She was even the enchanting voice of the Sorting Hat! If our wedding became the unforgettable celebration it was, it\'s entirely thanks to Silvia and her team.',
      content_cn: 'Silvia 正是在这样一个充满情感的日子里你最希望陪伴在身边的人。她让我们的哈利波特主题婚礼变得真正魔幻，精确到每一个细节。她甚至是分院帽那迷人的声音！如果我们的婚礼成为了那场难忘的庆典，那完全归功于 Silvia 和她的团队。'
    },
    {
      author: 'Alexandra & Davide',
      role: 'Fashion-Forward Wedding',
      content: 'Silvia made me feel comfortable from the very beginning! For an entire year, she helped us plan our day and turn it into a dream. The vendors she recommended were also fantastic! Our wedding was absolutely wonderful, cared for down to the smallest detail.',
      content_cn: 'Silvia 从一开始就让我感到舒适！整整一年，她帮助我们规划这一天，将其变成一场梦。她推荐的供应商也非常出色！我们的婚礼绝对精彩，每一个细节都被精心照料。'
    },
    {
      author: 'Elena & Enrico',
      role: 'Turin Wedding',
      content: 'For us, Silvia was like the character from Pulp Fiction: Wolf. She simplified our lives excellently by always being available and punctual in her responses. She allowed us to experience something magical until the very end.',
      content_cn: '对我们来说，Silvia 就像低俗小说里的角色 Wolf。她出色地简化了我们的生活，总是随时待命、及时回复。她让我们从头到尾都体验到了魔幻般的感觉。'
    }
  ]

  // 插入数据库
  await pool.execute(
    `INSERT INTO crawled_wedding_teams
      (slug, name, name_cn, source_url, country, country_cn, city, city_cn,
       tagline, description, founded_year,
       team_members, services, images, specialties, testimonials,
       cover_image, headshot, website, price, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug, name, name_cn, source_url, country, country_cn, city, city_cn,
      tagline, description, founded_year,
      JSON.stringify(team_members), JSON.stringify(services), JSON.stringify(images),
      JSON.stringify(specialties), JSON.stringify(testimonials),
      cover_image, headshot, website, price, 5
    ]
  )

  console.log(`\n✅ ${name} (${slug}) 插入成功！`)
  console.log(`   团队成员: ${team_members.length} 人`)
  console.log(`   服务类别: ${services.length} 个`)
  console.log(`   作品图片: ${images.length} 张`)
  console.log(`   客户评价: ${testimonials.length} 条`)
  console.log(`   特色标签: ${specialties.join(', ')}`)
  console.log(`   起步价: €${price.toLocaleString()}`)

  await pool.end()
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
