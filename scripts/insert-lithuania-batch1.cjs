const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['vilnius-old-town','维尔纽斯老城','Vilnius Old Town','立陶宛','Lithuania','维尔纽斯','Vilnius','巴洛克风格的世界遗产老城','🏘️ 巴洛克老城 | 世界遗产 | 立陶宛明珠',
   '维尔纽斯老城是欧洲最大的巴洛克风格老城之一，被联合国教科文组织列为世界遗产。老城的40多座教堂和蜿蜒的街道构成了独特的城市景观。\n\n拍摄建议：从格迪米纳斯塔拍摄老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从大教堂广场拍摄维尔纽斯天际线也很壮观。',
   'Vilnius Old Town is one of Europe\'s largest Baroque old towns, a UNESCO World Heritage Site. Over 40 churches and winding streets create a unique cityscape.',
   [{icon:'🏘️',title:'巴洛克老城',desc:'欧洲最大的巴洛克风格老城'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'格迪米纳斯塔拍摄老城全景'}],
   ['老城','巴洛克','维尔纽斯','立陶宛']],
  ['gediminas-tower','格迪米纳斯塔','Gediminas Tower','立陶宛','Lithuania','维尔纽斯','Vilnius','维尔纽斯天际线的标志','🏰 格迪米纳斯塔 | 14世纪 | 维尔纽斯地标',
   '格迪米纳斯塔是维尔纽斯最标志性的建筑，建于14世纪。塔楼矗立在山丘上，是维尔纽斯天际线最醒目的元素。从塔顶可以俯瞰整个老城。\n\n拍摄建议：从山脚拍摄塔楼全景是最经典的角度。日落时分的金色光线照射在塔楼上格外壮观。从塔顶拍摄维尔纽斯全景也很壮观。',
   'Gediminas Tower is Vilnius\'s most iconic building, dating from the 14th century. Standing on a hill, it\'s the most prominent element of the Vilnius skyline.',
   [{icon:'🏰',title:'格迪米纳斯塔',desc:'维尔纽斯最标志性建筑'},{icon:'🏛️',title:'14世纪',desc:'建于14世纪维尔纽斯地标'},{icon:'📸',title:'最佳拍摄',desc:'山脚拍摄塔楼全景'}],
   ['塔楼','地标','维尔纽斯','立陶宛']],
  ['trakai-castle','特拉凯城堡','Trakai Castle','立陶宛','Lithuania','特拉凯','Trakai','湖中岛屿上的中世纪城堡','🏰 湖中城堡 | 中世纪 | 立陶宛地标',
   '特拉凯城堡是立陶宛最壮观的中世纪城堡，坐落在加尔瓦湖的岛屿上。城堡始建于14世纪，是立陶宛大公国的政治中心。红色的砖石建筑与蓝色的湖水构成了立陶宛最经典的画面。\n\n拍摄建议：从湖岸拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从湖面拍摄城堡全景也很壮观。',
   'Trakai Castle is Lithuania\'s most spectacular medieval castle, situated on an island in Lake Galvė. Built in the 14th century as the political center of the Grand Duchy.',
   [{icon:'🏰',title:'湖中城堡',desc:'立陶宛最壮观中世纪城堡'},{icon:'🏛️',title:'14世纪',desc:'立陶宛大公国政治中心'},{icon:'📸',title:'最佳拍摄',desc:'湖岸拍摄城堡全景'}],
   ['城堡','湖中','特拉凯','立陶宛']],
  ['hill-of-crosses','十字架山','Hill of Crosses','立陶宛','Lithuania','希奥利艾','Šiauliai','全世界最独特的朝圣地','✝️ 十字架山 | 朝圣地 | 立陶宛地标',
   '十字架山是立陶宛最独特的景点，山上密密麻麻地插满了超过10万个十字架。这座山是立陶宛人抵抗外来统治的象征，2000年被教皇若望·保禄二世祝圣。\n\n拍摄建议：从山脚拍摄十字架山全景是最经典的角度。日落时分的金色光线照射在十字架上格外壮观。从远处拍摄十字架山的全貌也很壮观。',
   'The Hill of Crosses is Lithuania\'s most unique site, covered with over 100,000 crosses. A symbol of Lithuanian resistance, blessed by Pope John Paul II in 2000.',
   [{icon:'✝️',title:'十字架山',desc:'全世界最独特的朝圣地'},{icon:'🏆',title:'10万十字架',desc:'超过10万个十字架密布山上'},{icon:'📸',title:'最佳拍摄',desc:'山脚拍摄十字架山全景'}],
   ['十字架','朝圣','希奥利艾','立陶宛']],
  ['kaunas-old-town','考纳斯老城','Kaunas Old Town','立陶宛','Lithuania','考纳斯','Kaunas','立陶宛第二大城市的历史中心','🏘️ 历史中心 | 哥特建筑 | 立陶宛文化',
   '考纳斯老城是立陶宛第二大城市的历史中心，以哥特式建筑和文艺复兴风格的房屋闻名。老城的市政厅广场和维陶塔斯大教堂是立陶宛最重要的文化遗产。\n\n拍摄建议：从市政厅广场拍摄老城全景是最经典的角度。日落时分的金色光线照射在哥特式建筑上格外壮观。从涅曼河畔拍摄老城天际线也很壮观。',
   'Kaunas Old Town is the historic center of Lithuania\'s second city, famous for Gothic architecture and Renaissance-style houses. The Town Hall Square and Vytautas Church are key cultural heritage.',
   [{icon:'🏘️',title:'历史中心',desc:'立陶宛第二大城市历史中心'},{icon:'🏛️',title:'哥特建筑',desc:'哥特式建筑文艺复兴风格'},{icon:'📸',title:'最佳拍摄',desc:'市政厅广场拍摄老城全景'}],
   ['老城','哥特','考纳斯','立陶宛']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 394
  for (const [slug,name,nameEn,country,countryEn,loc,locEn,tagline,hlStr,desc,descEn,hlArr,tags] of items) {
    const cover = `/uploads/crawled/travel-attractions/${slug}.jpg`
    const highlights = JSON.stringify(hlArr)
    const tagsJson = JSON.stringify(tags)
    await pool.execute(
      `INSERT INTO crawled_travel_attractions
       (slug,name,name_en,country,country_en,location,location_en,cover_image,tagline,description,description_en,highlights,price,sort_order,tags)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [slug,name,nameEn,country,countryEn,loc,locEn,cover,tagline,desc,descEn,highlights,0,so,tagsJson]
    )
    console.log(`✓ ${name} (${slug})`)
    so++
  }
  console.log(`\n共插入 ${items.length} 个立陶宛景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
