/**
 * 插入 La Fête 婚礼团队数据
 * 来源: https://la-fete.com/about/
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  // 检查是否已存在
  const [existing] = await pool.execute(
    'SELECT id FROM crawled_wedding_teams WHERE slug = ?',
    ['la-fete']
  )
  if (existing.length > 0) {
    console.log('la-fete 已存在，跳过插入')
    await pool.end()
    return
  }

  const slug = 'la-fete'
  const name = 'La Fête'
  const name_cn = '拉费特'
  const source_url = 'https://la-fete.com/about/'
  const country = 'United Kingdom'
  const country_cn = '英国'
  const city = 'London'
  const city_cn = '伦敦'
  const tagline = '英国奢华婚礼与活动策划 · 精通法意西四国语言'
  // description 字段直接存中文（与 sposiamovi 一致，前端无 description_cn 回退）
  const description = `Charlotte Ricard-Quesada 于2016年创立了 La Fête，迅速成为伦敦最受追捧的婚礼设计师和活动策划师之一。如今，La Fête 已发展成为一支屡获殊荣的专业团队。

我们的婚礼和活动策划师为英国及全球挑剔的客户打造卓越的庆典体验。我们服务于超高净值客户和最负盛名的企业——那些期望获得低调、创意创新和无可挑剔的个性化服务的客户。

您的选择是无限的。可以是在宏伟的路易十四城堡举办婚礼，也可以是由米其林星级厨师准备的伦敦私密商务晚宴。从宫殿般的壮丽到梦幻般的魔力，您的活动将是一场深刻个人化且独一无二的庆典。`

  const founded_year = 2016
  const website = 'https://la-fete.com/'
  const cover_image = 'https://la-fete.com/wp-content/uploads/2025/05/La-Fete-Who-We-Are.jpg'
  const headshot = 'https://la-fete.com/wp-content/uploads/2025/05/The-La-Fete-Team.png'
  const price = 0 // 未公开价格，需咨询

  // 团队成员
  const team_members = [
    {
      name: 'Charlotte Ricard-Quesada',
      name_cn: '夏洛特·里卡尔-克萨达',
      role: 'Founder / Wedding & Events Designer',
      role_cn: '创始人 / 婚礼与活动设计师',
      image: '',
      description: 'After a decade in luxury fashion working for Dior and Tom Ford, Charlotte founded La Fête in 2016. Her French-British heritage, Swiss upbringing, and multicultural perspective — she married a Spanish husband in France — give her unique insight into the cultural nuances and finest luxury venues across France, Spain, and Italy. She is fluent in four languages: French, English, Spanish, and Italian.',
      description_cn: '在奢侈品时尚界工作十年，曾效力于 Dior 和 Tom Ford，Charlotte 于2016年创立 La Fête。她的法英双重血统、瑞士成长经历和多元文化视角——她在法国嫁给了西班牙丈夫——使她对法国、西班牙和意大利的文化差异及顶级奢华场地有着独特的洞察力。她精通法语、英语、西班牙语和意大利语四种语言。'
    }
  ]

  // 服务项目
  const services = [
    {
      title: 'Weddings',
      title_cn: '婚礼策划',
      items: [
        { label: 'French Weddings', label_cn: '法国婚礼', desc: 'Elegant celebrations at magnificent châteaux and vineyards across France', desc_cn: '在法国宏伟的城堡和葡萄园举办优雅庆典' },
        { label: 'Italian Weddings', label_cn: '意大利婚礼', desc: 'Romantic celebrations on the Amalfi Coast, Lake Como, or Tuscan villas', desc_cn: '阿马尔菲海岸、科莫湖畔或托斯卡纳别墅的浪漫庆典' },
        { label: 'Spanish Weddings', label_cn: '西班牙婚礼', desc: 'Sun-drenched beach weddings and historic estate celebrations in Spain', desc_cn: '西班牙阳光海滩婚礼和历史庄园庆典' },
        { label: 'Indian Weddings', label_cn: '印度婚礼', desc: 'Grand multi-day celebrations with traditional ceremonies and modern luxury', desc_cn: '盛大的多日庆典，融合传统仪式与现代奢华' },
        { label: 'Jewish Weddings', label_cn: '犹太婚礼', desc: 'Meaningful celebrations honoring traditions with impeccable attention to detail', desc_cn: '尊重传统的有意义庆典，注重每一个细节' },
        { label: 'Luxury Weddings', label_cn: '奢华婚礼', desc: 'Bespoke ultra-luxury weddings at the most exclusive venues worldwide', desc_cn: '在全球最专属场地打造定制超奢华婚礼' }
      ]
    },
    {
      title: 'Corporate & Social Events',
      title_cn: '企业与社交活动',
      items: [
        { label: 'Engagement Parties', label_cn: '订婚派对', desc: 'Intimate and grand engagement celebrations tailored to your style', desc_cn: '根据您的风格定制亲密或盛大的订婚庆典' },
        { label: 'Awards Ceremonies', label_cn: '颁奖典礼', desc: 'Sophisticated awards galas with flawless production and staging', desc_cn: '精致的颁奖晚会，完美制作与舞台呈现' },
        { label: 'Networking Events', label_cn: '社交活动', desc: 'Professional networking gatherings that foster meaningful connections', desc_cn: '促进有意义联系的专业社交聚会' },
        { label: 'Private Parties', label_cn: '私人派对', desc: 'Milestone birthdays, anniversaries, and exclusive private celebrations', desc_cn: '里程碑生日、周年纪念和专属私人庆典' }
      ]
    }
  ]

  // 作品集图片
  const images = [
    'https://la-fete.com/wp-content/uploads/2025/05/French-Wedding-Couple-and-Groomsmen-1.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Indian-Wedding-Hampton-Court-Palace.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Luxury-Italian-Wedding-at-la-Foce-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/La-Fete-Jewish-Party-Events-Organiser.jpeg',
    'https://la-fete.com/wp-content/uploads/2025/05/Luxurious-Weddings-Planned-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Luxury-Spanish-Beach-Wedding-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Hackett-London-Corporate-Event-with-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Engaged-Couple-at-their-Party-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Awards-Ceremony-Planned-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/RSVP-Networking-Meetup-Planned-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/60th-Anniversary-Party-Organised-by-La-Fete.jpg'
  ]

  // 特色标签
  const specialties = ['超高端婚礼策划', '英法意西四国覆盖', '四语精通', '获奖策划团队', '企业活动策划']

  // 客户评价
  const testimonials = [
    {
      author: 'Michelle Russell',
      role: 'Events Director, British GQ',
      content: 'Working with La Fête took a weight off my shoulders. They are incredibly organised, creative and thoughtful.',
      content_cn: '与 La Fête 合作让我如释重负。他们极其有条理、富有创意且体贴入微。'
    },
    {
      author: 'Nicholas Sferrazza',
      role: 'Manager, Global Partnerships, Accor Hotels',
      content: 'Charlotte and Emily are dedicated, hardworking, responsive and trustworthy. They deliver exceptional results every time.',
      content_cn: 'Charlotte 和 Emily 专注、勤奋、响应迅速且值得信赖。他们每次都能交付卓越成果。'
    },
    {
      author: 'Beverly Collins',
      role: 'Ancestry.com',
      content: 'Resourceful, responsive and patient; three words that immediately come to mind when I think of La Fête.',
      content_cn: '足智多谋、响应迅速、耐心——想到 La Fête 时立刻浮现的三个词。'
    },
    {
      author: 'Parry Cockwell',
      role: 'Chairman, Destination Weddings and Honeymoons Abroad',
      content: 'A truly creative thinker, Charlotte is efficient and effective in her approach to all things.',
      content_cn: 'Charlotte 是一位真正的创意思想者，处理一切事务都高效而有力。'
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
      cover_image, headshot, website, price, 2
    ]
  )

  console.log(`✅ ${name} (${slug}) 插入成功！`)
  console.log(`   团队成员: ${team_members.length} 人`)
  console.log(`   服务类别: ${services.length} 个`)
  console.log(`   作品图片: ${images.length} 张`)
  console.log(`   客户评价: ${testimonials.length} 条`)
  console.log(`   特色标签: ${specialties.join(', ')}`)

  await pool.end()
}

main().catch(e => {
  console.error('❌ 插入失败:', e.message)
  process.exit(1)
})
