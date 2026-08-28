const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['tallinn-old-town','塔林老城','Tallinn Old Town','爱沙尼亚','Estonia','塔林','Tallinn','波罗的海最完整的中世纪老城','🏘️ 中世纪老城 | 世界遗产 | 波罗的海明珠',
   '塔林老城是波罗的海国家最完整的中世纪老城之一，被联合国教科文组织列为世界遗产。老城分为上城和下城，上城的大教堂和下城的商业区构成了独特的中世纪城市景观。\n\n拍摄建议：从市政厅广场拍摄老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从大教堂塔楼拍摄整个老城的全景也很壮观。',
   'Tallinn Old Town is one of the best-preserved medieval old towns in the Baltic states, a UNESCO World Heritage Site. Divided into Upper and Lower Town.',
   [{icon:'🏘️',title:'中世纪老城',desc:'波罗的海最完整中世纪老城'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'市政厅广场拍摄老城全景'}],
   ['老城','世界遗产','塔林','爱沙尼亚']],
  ['tallinn-cathedral','塔林大教堂','Tallinn Cathedral','爱沙尼亚','Estonia','塔林','Tallinn','塔林天际线的哥特式尖塔','⛪ 哥特大教堂 | 13世纪 | 塔林地标',
   '塔林大教堂（亚历山大·涅夫斯基大教堂）是塔林最醒目的宗教建筑，建于19世纪末。教堂的洋葱形圆顶和拜占庭风格与周围的哥特式建筑形成鲜明对比。\n\n拍摄建议：从教堂前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在圆顶上格外壮观。从远处拍摄教堂与城市天际线的组合全景也很壮观。',
   'Tallinn Cathedral (Alexander Nevsky Cathedral) is the most prominent religious building in Tallinn, built in the late 19th century with onion domes and Byzantine style.',
   [{icon:'⛪',title:'哥特大教堂',desc:'塔林最醒目的宗教建筑'},{icon:'🏛️',title:'拜占庭风格',desc:'洋葱形圆顶拜占庭风格'},{icon:'📸',title:'最佳拍摄',desc:'教堂前方拍摄完整建筑全景'}],
   ['教堂','拜占庭','塔林','爱沙尼亚']],
  ['saaremaa-island','萨列马岛','Saaremaa Island','爱沙尼亚','Estonia','萨列','Saare','爱沙尼亚最大的岛屿','🏝️ 最大岛屿 | 中世纪城堡 | 波罗的海',
   '萨列马岛是爱沙尼亚最大的岛屿，以中世纪城堡、温泉和独特的自然风光闻名。岛上的库雷萨雷城堡是波罗的海国家保存最完好的中世纪城堡之一。\n\n拍摄建议：从城堡外拍摄完整的建筑群全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从海岸拍摄岛屿天际线也很壮观。',
   'Saaremaa is Estonia\'s largest island, famous for medieval castles, hot springs, and unique natural beauty. Kuressaare Castle is one of the best-preserved medieval castles in the Baltic.',
   [{icon:'🏝️',title:'最大岛屿',desc:'爱沙尼亚最大的岛屿'},{icon:'🏰',title:'中世纪城堡',desc:'波罗的海保存最完好中世纪城堡'},{icon:'📸',title:'最佳拍摄',desc:'城堡外拍摄建筑群全景'}],
   ['岛屿','城堡','萨列马','爱沙尼亚']],
  ['lahemaa-park','拉赫马国家公园','Lahemaa National Park','爱沙尼亚','Estonia','北部','Northern','爱沙尼亚最大的国家公园','🌲 国家公园 | 森林海岸 | 爱沙尼亚自然',
   '拉赫马国家公园是爱沙尼亚最大的国家公园，覆盖超过7万公顷的森林、沼泽和海岸线。公园内的庄园建筑和传统的渔村是了解爱沙尼亚文化的好去处。\n\n拍摄建议：从森林中拍摄沼泽与湖泊的全景是最经典的角度。日落时分的金色光线照射在森林上格外壮观。从海岸拍摄国家公园的海景也很壮观。',
   'Lahemaa National Park is Estonia\'s largest national park, covering over 70,000 hectares of forest, bogs, and coastline. Manor houses and fishing villages showcase Estonian culture.',
   [{icon:'🌲',title:'国家公园',desc:'爱沙尼亚最大的国家公园'},{icon:'🏞️',title:'森林海岸',desc:'森林沼泽海岸线覆盖7万公顷'},{icon:'📸',title:'最佳拍摄',desc:'森林中拍摄沼泽湖泊全景'}],
   ['国家公园','森林','北部','爱沙尼亚']],
  ['tartu-old-town','塔尔图老城','Tartu Old Town','爱沙尼亚','Estonia','塔尔图','Tartu','爱沙尼亚的学术之都','🏘️ 学术之城 | 大学城 | 爱沙尼亚文化',
   '塔尔图是爱沙尼亚的学术之都，拥有全国最古老的大学（建于1632年）。老城的巴洛克建筑和学术氛围使其成为爱沙尼亚最有文化气息的城市。\n\n拍摄建议：从大学主楼拍摄老城全景是最经典的角度。日落时分的金色光线照射在巴洛克建筑上格外壮观。从河边拍摄老城天际线也很壮观。',
   'Tartu is Estonia\'s academic capital, home to the country\'s oldest university (founded 1632). The Baroque architecture and scholarly atmosphere make it Estonia\'s most cultural city.',
   [{icon:'🏘️',title:'学术之城',desc:'爱沙尼亚的学术之都'},{icon:'🎓',title:'大学城',desc:'全国最古老大学建于1632年'},{icon:'📸',title:'最佳拍摄',desc:'大学主楼拍摄老城全景'}],
   ['老城','大学城','塔尔图','爱沙尼亚']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 384
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
  console.log(`\n共插入 ${items.length} 个爱沙尼亚景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
