/**
 * 将团队成员描述翻译为中文
 */
const mysql = require('mysql2/promise')

const translations = {
  'sposiamovi': [
    {
      name: 'Silvia Galli',
      description_cn: 'SposiamoVi 的创意核心与战略大脑。近20年意大利目的地婚礼行业经验。主导策划流程，带领团队将每对新人的愿景化为超越期待的现实。'
    },
    {
      name: 'Valentina Di Tinto',
      description_cn: '专精意大利南部，包括阿马尔菲海岸、卡普里岛和普利亚大区。以发掘小众独特场地和打造最纯正的意大利体验而闻名。'
    },
    {
      name: 'Sandra Celoni',
      description_cn: '驻扎佛罗伦萨附近基安蒂地区。自1993年从事旅游业，1999年起涉足活动行业。曾任医学会议项目经理，后转入婚礼行业，带来丰富的组织管理经验。'
    },
    {
      name: 'Silvia Piazzini',
      description_cn: '十年从业经验。从知名酒店的活动经理起步。土生土长的意大利人，对意大利的历史、文化、美学与时尚充满热忱。'
    },
    {
      name: 'Marta Buson',
      description_cn: '对视觉叙事充满热情。天生细致严谨、条理分明。全身心投入每一对新人的婚礼愿景，确保每个细节完美呈现。'
    },
    {
      name: 'Anna Grimaldi',
      description_cn: '深耕阿马尔菲海岸。来自坎帕尼亚大区，曾赴法国和英国学习旅游管理。在五星级酒店积累了扎实的策划功底。'
    },
    {
      name: 'Gemma Borelli',
      description_cn: '佛罗伦萨出生长大。心理学背景，后转入婚礼行业。精力充沛、执行力强、善于应变。'
    },
    {
      name: 'Giulia Melani',
      description_cn: '为新人及其亲友打造个性化的意大利婚礼体验。统筹交通、住宿及宾客后勤安排，确保每位宾客享受无忧体验。'
    },
    {
      name: 'Martina Forzoni',
      description_cn: '居住在托斯卡纳乡间锡耶纳附近。超过10年旅游与酒店业经验，曾任豪华度假村活动经理。'
    },
    {
      name: 'Altynai',
      description_cn: '来自哈萨克斯坦，现居佛罗伦萨。艺术、室内设计与建筑学背景，将结构感与创造力完美融合。'
    },
    {
      name: 'Ada Pinheiro',
      description_cn: '原巴西律师，2023年加入 SposiamoVi。专注于比例和谐与风格统一，为婚礼打造视觉品牌形象。'
    },
    {
      name: 'Martina Casprini',
      description_cn: '婚礼宾客管理负责人。拥有 Progeas 大学及欧洲设计学院的活动组织专业背景。'
    },
    {
      name: 'Elisa Rossi',
      description_cn: '驻扎佛罗伦萨。外语专业背景，曾担任豪华酒店前台接待。专攻婚礼策划与设计。'
    },
    {
      name: 'Camilla Pratesi',
      description_cn: '来自佛罗伦萨。语言调解学位，旅游学硕士。负责后台运营协调，协助策划师推进各项工作。'
    }
  ]
}

async function run() {
  const pool = mysql.createPool({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile'
  })

  for (const [slug, members] of Object.entries(translations)) {
    const [rows] = await pool.execute('SELECT team_members FROM crawled_wedding_teams WHERE slug = ?', [slug])
    if (!rows.length) { console.log(`⚠ ${slug} 不存在`); continue }

    const teamMembers = typeof rows[0].team_members === 'string' ? JSON.parse(rows[0].team_members) : rows[0].team_members

    for (const t of members) {
      const member = teamMembers.find(m => m.name === t.name)
      if (member) {
        member.description_cn = t.description_cn
        console.log(`✓ ${t.name} → 已翻译`)
      } else {
        console.log(`⚠ ${t.name} 未找到`)
      }
    }

    await pool.execute('UPDATE crawled_wedding_teams SET team_members = ? WHERE slug = ?', [JSON.stringify(teamMembers), slug])
    console.log(`\n✓ ${slug} 团队成员描述已更新为中文`)
  }

  await pool.end()
}

run().catch(err => { console.error(err); process.exit(1) })
