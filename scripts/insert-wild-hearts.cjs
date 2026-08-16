/**
 * Wild Hearts Elopements 图片下载 + 数据插入
 * 来源: https://wildheartselopements.com/
 */
const https = require('https')
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const BASE_DIR = path.join(__dirname, '../uploads/crawled/wild-hearts-elopements')

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : require('http')
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://wildheartselopements.com/',
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

  const [existing] = await pool.execute('SELECT id FROM crawled_wedding_teams WHERE slug = ?', ['wild-hearts-elopements'])
  if (existing.length > 0) {
    console.log('wild-hearts-elopements 已存在，跳过')
    await pool.end()
    return
  }

  // 创建目录
  for (const sub of ['cover', 'headshot', 'portfolio']) {
    fs.mkdirSync(path.join(BASE_DIR, sub), { recursive: true })
  }

  // === 图片 URL ===
  const coverUrl = 'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/2de1e6e2-b81a-4ac0-b486-08f0855d6386/Grady+%2B+Kailee+-200.jpg?format=1500w'
  const headshotUrl = 'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/7fb33f7a-84dd-4b3b-a88d-39ef413b0e88/P1027172.jpg'
  const portfolioUrls = [
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/ab1152e6-5cda-4008-96d1-a5986c2116c9/Lisa%26Will-862.jpg?format=1500w',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/34871601-3211-45fa-87a9-6ff6fe67013b/Jack%2BHannah-795.jpg?format=1500w',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/5c7df1bc-0d3a-4f98-9d72-362077225da2/untitled-166.jpg?format=1500w',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/1612187093309-J9HQG610GL28U4ZTWGVQ/WeddingsIsleofSkyeElopement.jpg?format=1500w',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/faf117d2-e6f9-41ae-8ee2-96dcbb88d8b6/untitled-352.jpg?format=1500w',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/b33fc6cd-2aa6-4915-aebb-da21a12b6486/Yanwei+%26+Jake_+Glencoe+elopement-206.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/07d421fc-ef12-4ceb-80e8-420ccead9aa9/IanAlexa%7E1471.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/8434418c-8b0a-49d4-a099-0956fb04aecc/Grady+%2B+Kailee+-244.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/8417cb46-0dcd-44e4-a799-c1a5cb1090bb/ciara-rowan-skye-32-Exposure.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/8271c1cc-b52f-492c-a21b-370f2a5aea5b/Rhi%2BJames%7E1003.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/f62be1ee-c118-40b0-b5cc-f2fd1f484180/Gina+and+Josh-978.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/f30c618f-5eef-40d1-8152-1257d2abaf71/M%26B+-831.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/d9d1b77a-3f1c-4cf1-a9f9-40fe81056dbb/Alec%2BGeorgia%7E390.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/e44bf113-2f7e-4ae1-82a3-474b0800b276/Kayla+%26+Carter+-+Glen+Coe-46.jpg',
    'https://images.squarespace-cdn.com/content/v1/5dc3397d8f374d228f5f51dc/9fb0fc9d-9019-4270-881c-daee4d4732e5/DSC09923.jpg',
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
  const slug = 'wild-hearts-elopements'
  const name = 'Wild Hearts Elopements'
  const name_cn = '狂野之心私密婚礼'
  const source_url = 'https://wildheartselopements.com/'
  const country = 'United Kingdom'
  const country_cn = '英国'
  const city = 'Aberdeen'
  const city_cn = '阿伯丁'
  const tagline = '苏格兰私密婚礼专家 · 高地城堡与湖泊的浪漫庆典'
  const description = `Wild Hearts Elopements 是一家专注于苏格兰私密婚礼的策划公司，总部位于苏格兰阿伯丁，拥有超过十年的苏格兰婚礼行业经验。我们擅长在苏格兰最壮丽的地点策划私密而难忘的私密婚礼。

创始人 Laura Gonzalez 于2017年在意大利威尼斯举办了自己的目的地婚礼，这次亲身经历让她深刻理解了筹备婚礼的每一个细节和挑战，也激发了她创立 Wild Hearts 的热情。她以其活泼的性格、对细节的极致关注和让每一对新人都感到幸福的能力而闻名。

我们的服务范围覆盖整个苏格兰——从爱丁堡的古老城堡到天空岛的梦幻海岸，从格伦科的壮丽山谷到艾琳多南城堡的标志性身影。每一场私密婚礼都是完全定制的，我们会根据你们的愿景打造独一无二的庆典。

我们提供全面的策划服务，包括场地推荐、供应商对接（摄影师、摄像师、化妆师等）、法律文件指导、苏格兰传统仪式建议、国际支付咨询以及婚礼当天的完整时间线规划。无论你们想要民事婚礼、宗教仪式、人文主义典礼还是同性婚礼，我们都能完美呈现。`

  const founded_year = 2018
  const website = 'https://wildheartselopements.com/'
  const cover_image = '/uploads/crawled/wild-hearts-elopements/cover/cover.jpg'
  const headshot = '/uploads/crawled/wild-hearts-elopements/headshot/headshot.jpg'
  const price = 5000

  const team_members = [
    {
      name: 'Laura Gonzalez',
      name_cn: '劳拉·冈萨雷斯',
      role: 'Founder & Wedding Planner',
      role_cn: '创始人 / 婚礼策划师',
      image: '',
      description: 'Laura is the founder of Wild Hearts Elopements, a wedding planner, eternal optimist, and hopeless romantic with a deep love for beautiful weddings. She had her own destination wedding in Venice, Italy in 2017, which inspired her to become a wedding planner. With over 10 years in the Scottish Wedding Industry, she is best known for her bubbly personality and wanting to make others happy.',
      description_cn: 'Laura 是 Wild Hearts Elopements 的创始人，一位婚礼策划师、永远的乐观主义者和无可救药的浪漫主义者。她于2017年在意大利威尼斯举办了自己的目的地婚礼，这次经历激发了她成为婚礼策划师的热情。凭借在苏格兰婚礼行业超过十年的经验，她以活泼的性格和让他人幸福的能力而闻名。',
      link: 'https://wildheartselopements.com/meet-laura/',
    }
  ]

  const services = [
    {
      title: 'Elopement Locations',
      title_cn: '私密婚礼地点',
      items: [
        { label: 'Edinburgh Elopements', label_cn: '爱丁堡私密婚礼', desc: 'Urban city backdrop with ruined abbey, Edinburgh Castle, hilltops, and the Royal Mile', desc_cn: '城市背景，包括废弃修道院、爱丁堡城堡、山丘和皇家英里大道' },
        { label: 'Eilean Donan Castle', label_cn: '艾琳多南城堡', desc: "One of Scotland's most iconic castles with courtyard ceremony, famous bridge arrival, and bagpipes", desc_cn: '苏格兰最具标志性的城堡之一，庭院仪式、著名的桥梁入场和风笛演奏' },
        { label: 'Isle of Skye', label_cn: '天空岛', desc: 'Beach, loch side, mountain, and ruined castle settings for the most whimsical elopements', desc_cn: '海滩、湖畔、山脉和废弃城堡，打造最梦幻的私密婚礼' },
        { label: 'Glencoe Elopements', label_cn: '格伦科私密婚礼', desc: 'James Bond Skyfall featured mountain backdrop with wild outdoor elopements', desc_cn: '007 大破天幕杀机取景地，壮丽的山景背景下的户外私密婚礼' },
        { label: 'Dunnottar Castle', label_cn: '邓诺特城堡', desc: 'Dramatic clifftop ruin with beach and ocean (currently paused for bookings)', desc_cn: '壮观的悬崖废墟，面朝大海和沙滩（目前暂停预约）' },
        { label: 'Bespoke Elopements', label_cn: '定制私密婚礼', desc: 'Anywhere in Scotland — Cairngorms, Isles of Harris, Islay, Arran, Highlands — fully customized', desc_cn: '苏格兰任何地点——凯恩戈姆山脉、哈里斯岛、艾莱岛、阿伦岛、高地——完全定制' },
      ]
    },
    {
      title: 'Planning Services',
      title_cn: '策划服务内容',
      items: [
        { label: 'Venue & Location Sourcing', label_cn: '场地与地点甄选', desc: 'Up to 4 venue/ceremony location suggestions with accommodation assistance', desc_cn: '最多 4 个场地/仪式地点推荐，含住宿协助' },
        { label: 'Supplier Recommendations', label_cn: '供应商推荐', desc: 'Up to 6 supplier recommendations including officiant, photographer, videographer, hair/makeup', desc_cn: '最多 6 个供应商推荐，包括司仪、摄影师、摄像师、化妆造型' },
        { label: 'Legal & Tradition Guidance', label_cn: '法律与传统指导', desc: 'Scottish marriage paperwork, legal requirements, civil/religious/humanist ceremony options', desc_cn: '苏格兰婚姻文件、法律要求、民事/宗教/人文主义仪式选项' },
        { label: 'Full Day Coordination', label_cn: '全天统筹', desc: 'Complete wedding day timeline, supplier contacts, final checks, and last-minute query handling', desc_cn: '完整的婚礼当天时间线、供应商联系、最终确认和临时问题处理' },
      ]
    },
    {
      title: 'Ceremony Types',
      title_cn: '仪式类型',
      items: [
        { label: 'Civil Marriages', label_cn: '民事婚礼', desc: 'Legal civil marriage ceremonies registered with the Scottish government', desc_cn: '在苏格兰政府注册的合法民事婚礼仪式' },
        { label: 'Humanist Ceremonies', label_cn: '人文主义仪式', desc: 'Personalized, non-religious ceremonies celebrating your unique love story', desc_cn: '个性化、非宗教仪式，庆祝你们独特的爱情故事' },
        { label: 'Same-Sex Marriages', label_cn: '同性婚礼', desc: 'Fully inclusive and celebratory ceremonies for all couples', desc_cn: '完全包容和庆祝的仪式，欢迎所有伴侣' },
        { label: 'Micro Weddings', label_cn: '微型婚礼', desc: 'Intimate celebrations with up to 25 guests in stunning Scottish locations', desc_cn: '在苏格兰壮丽地点举办最多 25 位宾客的亲密庆典' },
      ]
    }
  ]

  const images = portfolioUrls.map((_, i) => `/uploads/crawled/wild-hearts-elopements/portfolio/${String(i + 1).padStart(2, '0')}.jpg`)

  const specialties = ['苏格兰私密婚礼', '城堡婚礼', '高地户外婚礼', '国际客户服务', '苏格兰传统仪式', '全包策划服务']

  const testimonials = [
    {
      author: 'Kailee & Grady',
      role: 'Eilean Donan Castle',
      content: 'Working with Laura was an absolute delight! Attentive to our desires and adaptable to changes, she graciously accommodated every twist and turn in our vision. Her punctuality and meticulous organization were exemplary. With a guest list of nearly 25, Laura flawlessly orchestrated every aspect. She\'s not just a planner; she\'s a cherished friend who ensures your special day is nothing short of perfection.',
      content_cn: '与 Laura 合作是一种绝对的享受！她关注我们的需求，灵活应对变化，优雅地满足了我们愿景中的每一个转折。她的准时和细致的组织能力堪称典范。在将近 25 位宾客的名单下，Laura 完美地统筹了每一个环节。她不仅仅是一位策划师，更是一位珍视的朋友，确保你的特别日子完美无缺。'
    },
    {
      author: 'Jessi & Patrick',
      role: 'Eilean Donan Castle',
      content: 'Laura with Wild Heart Elopements made our lives SO much easier when planning our elopement ceremony at the Eilean Donan castle. We spent well over a year and a half communicating with Laura and she made sure our ceremony was exactly as we wanted it down to every detail. Being from the United States, the different time zones would have made it difficult for us to plan this ourselves but Laura communicated with all the vendors for us.',
      content_cn: 'Wild Heart Elopements 的 Laura 让我们在计划艾琳多南城堡的私密婚礼时轻松了太多。我们与 Laura 沟通了一年半多的时间，她确保我们的仪式完全按照我们的意愿，精确到每一个细节。来自美国，不同的时区本来会让我们自己计划变得困难，但 Laura 替我们与所有供应商沟通。'
    },
    {
      author: 'Savannah & Bill',
      role: 'Scottish Elopement',
      content: 'Laura is a magical Scottish fairy who reached into my mind and pulled together a dreamscape elopement for my husband and myself. In just a couple simple zoom calls she was able to diagnose what we needed to have a perfect day. Our wedding was planned in approximately six months and Laura was able to guide us through the arduous journey of wedding planning with ease.',
      content_cn: 'Laura 是一位神奇的苏格兰精灵，她深入我的内心，为我和丈夫打造了一场梦境般的私密婚礼。仅仅几次简单的视频通话，她就能诊断出我们需要什么才能拥有完美的一天。我们的婚礼在大约六个月内策划完成，Laura 轻松地引导我们走过了艰辛的婚礼策划之旅。'
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
      cover_image, headshot, website, price, 4
    ]
  )

  console.log(`\n✅ ${name} (${slug}) 插入成功！`)
  console.log(`   团队成员: ${team_members.length} 人`)
  console.log(`   服务类别: ${services.length} 个 (${team_members[0].name})`)
  console.log(`   作品图片: ${images.length} 张`)
  console.log(`   客户评价: ${testimonials.length} 条`)
  console.log(`   特色标签: ${specialties.join(', ')}`)
  console.log(`   起步价: £${price.toLocaleString()}`)

  await pool.end()
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
