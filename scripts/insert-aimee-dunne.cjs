/**
 * 插入 Aimee Dunne 婚礼团队数据 + 下载图片到本地
 * 来源: https://aimeedunne.com/
 */
const https = require('https')
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const BASE_DIR = path.join(__dirname, '../uploads/crawled/aimee-dunne')

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://aimeedunne.com/',
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

  // 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_wedding_teams WHERE slug = ?', ['aimee-dunne'])
  if (existing.length > 0) {
    console.log('aimee-dunne 已存在，跳过插入')
    await pool.end()
    return
  }

  // 创建目录
  fs.mkdirSync(path.join(BASE_DIR, 'cover'), { recursive: true })
  fs.mkdirSync(path.join(BASE_DIR, 'headshot'), { recursive: true })
  fs.mkdirSync(path.join(BASE_DIR, 'portfolio'), { recursive: true })

  // === 图片 URL ===
  const coverUrl = 'https://aimeedunne.com/wp-content/uploads/2020/12/aimee-homepage-banner.jpg'
  const headshotUrl = 'https://aimeedunne.com/wp-content/uploads/2021/05/aimee-dunne-coworth-park-wedding-roberta-facchini-photography-7.jpg'
  const portfolioUrls = [
    'https://aimeedunne.com/wp-content/uploads/2020/11/JENSHEN-003.jpg',
    'https://aimeedunne.com/wp-content/uploads/2026/05/coworth-park-wedding-photographer-roberta-facchini-photography-287-scaled.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/Dorchester7.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/D3X_7308.jpg',
    'https://aimeedunne.com/wp-content/uploads/2026/05/coworth-park-wedding-photographer-roberta-facchini-photography-267-scaled.jpg',
    'https://aimeedunne.com/wp-content/uploads/2026/05/coworth-park-wedding-photographer-roberta-facchini-photography-455-scaled.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/dinner4.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/coworth-park-wedding-photographer-roberta-facchini-photography-775.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/JENSHEN-017.jpg',
    'https://aimeedunne.com/wp-content/uploads/2026/05/DSC_5087-scaled.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/coworth-park-wedding-photographer-roberta-facchini-photography-426.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/dinnersetting2.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/IMG_7928.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/coupledinner.jpg',
    'https://aimeedunne.com/wp-content/uploads/2020/11/Dorchester2.jpg',
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
    const ext = path.extname(url).split('?')[0] || '.jpg'
    const name = `${String(i + 1).padStart(2, '0')}${ext}`
    try {
      await download(url, path.join(BASE_DIR, 'portfolio', name))
      console.log(`✅ portfolio/${name}`)
      ok++
    } catch (e) { console.error(`❌ portfolio/${name}:`, e.message); fail++ }
  }

  console.log(`\n下载完成: ${ok} 成功, ${fail} 失败`)

  // === 数据 ===
  const slug = 'aimee-dunne'
  const name = 'Aimee Dunne'
  const name_cn = '艾米·邓恩'
  const source_url = 'https://aimeedunne.com/'
  const country = 'United Kingdom'
  const country_cn = '英国'
  const city = 'London'
  const city_cn = '伦敦'
  const tagline = '伦敦奢华婚礼与活动策划 · 十年高端策划经验'
  const description = `Aimee Dunne 于2010年创立了同名奢华婚礼与活动策划公司，十余年来已成为伦敦最受信赖的高端婚礼策划师之一。公司总部位于伦敦，服务覆盖英国全境、欧洲及全球目的地婚礼。

我们的目标是创造令人难忘的婚礼和庆典，帮助客户以最好的方式庆祝生命中特别的时刻。我们相信，这些特别时刻应该被珍惜和庆祝，而策划的过程本身就应该是一段充满愉悦的旅程。

我们策划的庆典不仅美丽，更是高度个人化的——它们是我们客户独特品味和重要细节的真实呈现。从婚礼场地的选择到每一个设计细节，从供应商团队的管理到当天流程的精确协调，每一个环节都以完美无瑕的标准执行。

Aimee 本人在伦敦金融城拥有多年投资管理经验，这培养了她对细节的天然敏锐度、出色的时间管理能力和在高压环境下从容应对的素质。她定期受邀为媒体提供专业评论，并作为演讲嘉宾出席奢华行业活动。策划作品曾被 BBC、CNN、Harper's Bazaar、Good Housekeeping、Cosmopolitan Bride 等高端媒体报道。`

  const founded_year = 2010
  const website = 'https://aimeedunne.com/'
  const cover_image = '/uploads/crawled/aimee-dunne/cover/cover.jpg'
  const headshot = '/uploads/crawled/aimee-dunne/headshot/headshot.jpg'
  const price = 12000

  const team_members = [
    {
      name: 'Aimee Dunne',
      name_cn: '艾米·邓恩',
      role: 'Founder / Wedding & Event Planner',
      role_cn: '创始人 / 婚礼与活动设计师',
      image: '',
      description: 'Aimee has been planning weddings and events for over a decade. She also has numerous years of experience in Investment Management in the City of London and internationally, following a BSc Degree in Business Administration from Bath University. A passion for celebrating led her to set up Aimee Dunne Ltd in 2010. She is regularly called upon for media comment and attends luxury industry events as a speaker.',
      description_cn: 'Aimee 拥有十余年婚礼和活动策划经验，同时在伦敦金融城和国际投资管理部门工作多年，毕业于巴斯大学工商管理专业。对庆祝的热忱促使她于2010年创立了 Aimee Dunne 有限公司。她经常受邀为媒体提供专业评论，并作为演讲嘉宾出席奢华行业活动。'
    }
  ]

  const services = [
    {
      title: 'Luxury Wedding Planning',
      title_cn: '奢华婚礼策划',
      items: [
        { label: 'Bespoke Wedding Design', label_cn: '定制婚礼设计', desc: 'Fully personalized wedding design from venue selection to the smallest decorative details, creating celebrations that are uniquely yours', desc_cn: '从场地选择到最小的装饰细节，完全个性化的婚礼设计，打造属于您的独特庆典' },
        { label: 'Venue Sourcing', label_cn: '场地甄选', desc: 'Access to prestigious UK venues including Coworth Park, Chewton Glen, The Dorchester, plus European and international destination venues', desc_cn: '独享英国顶级场地资源包括 Coworth Park、Chewton Glen、The Dorchester，以及欧洲和全球目的地场地' },
        { label: 'Supplier Management', label_cn: '供应商管理', desc: 'Curated team of the finest suppliers and vendors, meticulously coordinated for a flawless wedding experience', desc_cn: '精心筛选的优质供应商团队，精确协调确保婚礼体验完美无瑕' },
        { label: 'Marquee Weddings', label_cn: '帐篷婚礼', desc: 'Extensive experience in planning marquee weddings at private properties and all manner of structures', desc_cn: '在私人庄园和各种结构场地策划帐篷婚礼的丰富经验' },
        { label: 'On-the-Day Coordination', label_cn: '当日统筹', desc: 'Every single element meticulously coordinated for a flawless wedding experience, from timing and flow to design details', desc_cn: '从时间流程到设计细节，每一个环节都精确协调，确保婚礼体验完美无瑕' },
      ]
    },
    {
      title: 'Luxury Event Planning',
      title_cn: '奢华活动策划',
      items: [
        { label: 'Engagement Parties', label_cn: '订婚派对', desc: 'Beautiful and memorable engagement celebrations tailored to your style', desc_cn: '根据您的风格定制美丽难忘的订婚庆典' },
        { label: 'Milestone Celebrations', label_cn: '里程碑庆典', desc: 'Significant birthday celebrations, anniversary parties, and other special occasions planned to perfection', desc_cn: '重要的生日庆典、周年纪念派对和其他特殊场合的完美策划' },
        { label: 'Destination Events', label_cn: '目的地活动', desc: 'Luxury events planned across the globe, from intimate gatherings to large overseas celebrations', desc_cn: '在全球策划奢华活动，从私人聚会到大型海外庆典' },
      ]
    },
    {
      title: 'Hospitality Consultancy',
      title_cn: '酒店业咨询',
      items: [
        { label: 'Venue Experience Review', label_cn: '场地体验评审', desc: 'Targeted reviews based on customer experience for hotels and wedding venues to elevate service standards', desc_cn: '基于客户体验的定向评审，帮助酒店和婚礼场地提升服务标准' },
        { label: 'New Hotel & Renovation', label_cn: '新酒店与翻新咨询', desc: 'Specialist consultancy for new hotel openings and renovation projects to ensure exceptional guest experience', desc_cn: '为新酒店开业和翻新项目提供专业咨询，确保卓越的宾客体验' },
      ]
    }
  ]

  const images = portfolioUrls.map((_, i) => {
    const ext = path.extname(portfolioUrls[i]).split('?')[0] || '.jpg'
    return `/uploads/crawled/aimee-dunne/portfolio/${String(i + 1).padStart(2, '0')}${ext}`
  })

  const specialties = ['奢华婚礼策划', '伦敦及英国全境', '目的地婚礼', '帐篷婚礼', '高端活动策划', '酒店业咨询']

  const testimonials = [
    {
      author: 'Donna',
      role: 'St Tropez 40th Celebration',
      content: 'What a special and unforgettable party. Years on people will still talk about it and all I can say is WOW WOW WOW! Aimee, thank you so much.',
      content_cn: '多么特别和难忘的派对。多年后人们仍然会谈论它，我只能说 WOW WOW WOW！Aimee，太感谢你了。'
    },
    {
      author: 'Amy & Karl',
      role: 'London Wedding',
      content: 'Aimee you are a spectacular wedding genius, and a patient and classy lady to boot. From the bottom of our hearts, thank you.',
      content_cn: 'Aimee，你是一位出色的婚礼天才，更是一位耐心而优雅的女士。发自内心地感谢你。'
    },
    {
      author: 'Lisa & Toby',
      role: 'Berkshire Wedding',
      content: "We don't really know where to start with the praise and thanks for you Aimee. You have given us the wedding of our dreams, thank you for everything.",
      content_cn: '我们真的不知道从哪里开始表达对你的赞美和感谢。你给了我们梦想中的婚礼，谢谢你的一切。'
    },
    {
      author: 'Sinead',
      role: 'Kent Surprise Party',
      content: "Aimee is amazing; I wish I could have her permanently in my life!",
      content_cn: 'Aimee 太棒了；我真希望她能永远留在我的生活中！'
    }
  ]

  // 插入数据
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
      cover_image, headshot, website, price, 3
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
