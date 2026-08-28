const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['ljubljana-old-town','卢布尔雅那老城','Ljubljana Old Town','斯洛文尼亚','Slovenia','卢布尔雅那','Ljubljana','阿尔卑斯山下的绿色首都','🏘️ 绿色首都 | 龙桥 | 斯洛文尼亚地标',
   '卢布尔雅那老城是斯洛文尼亚首都的历史中心，以龙桥和三重桥闻名。老城的巴洛克建筑和河畔咖啡馆构成了温馨的城市景观。\n\n拍摄建议：从龙桥拍摄老城全景是最经典的角度。日落时分的金色光线照射在河面上格外壮观。从城堡山拍摄整个老城的全景也很壮观。',
   'Ljubljana Old Town is the historic center of Slovenia\'s capital, famous for the Dragon Bridge and Triple Bridge. Baroque architecture and riverside cafes create a warm cityscape.',
   [{icon:'🏘️',title:'绿色首都',desc:'斯洛文尼亚首都历史中心'},{icon:'🐉',title:'龙桥',desc:'以龙桥和三重桥闻名'},{icon:'📸',title:'最佳拍摄',desc:'龙桥拍摄老城全景'}],
   ['老城','龙桥','卢布尔雅那','斯洛文尼亚']],
  ['bled-lake','布莱德湖','Lake Bled','斯洛文尼亚','Slovenia','上卡尼奥拉','Upper Carniola','阿尔卑斯山下的童话湖泊','🏞️ 童话湖泊 | 湖心岛 | 斯洛文尼亚地标',
   '布莱德湖是斯洛文尼亚最著名的自然景观，湖心的小岛和岛上的教堂构成了全世界最浪漫的风景之一。湖泊被阿尔卑斯山环绕，是斯洛文尼亚最受欢迎的旅游目的地。\n\n拍摄建议：从湖边拍摄湖心岛全景是最经典的角度。日落时分的金色光线照射在湖面上格外壮观。从山上拍摄湖泊全景也很壮观。',
   'Lake Bled is Slovenia\'s most famous natural attraction, with a small island and church in the center creating one of the world\'s most romantic landscapes. Surrounded by the Alps.',
   [{icon:'🏞️',title:'童话湖泊',desc:'斯洛文尼亚最著名自然景观'},{icon:'🏝️',title:'湖心岛',desc:'湖心小岛和教堂全世界最浪漫'},{icon:'📸',title:'最佳拍摄',desc:'湖边拍摄湖心岛全景'}],
   ['湖泊','岛屿','布莱德','斯洛文尼亚']],
  ['postojna-cave','波斯托伊纳溶洞','Postojna Cave','斯洛文尼亚','Slovenia','内卡尼奥拉','Inner Carniola','欧洲最大的溶洞之一','🕳️ 溶洞 | 欧洲最大 | 斯洛文尼亚自然',
   '波斯托伊纳溶洞是欧洲最大的溶洞之一，全长超过24公里。溶洞内的巨大厅堂和钟乳石令人叹为观止。溶洞内还有独特的洞螈，是斯洛文尼亚的特有物种。\n\n拍摄建议：从溶洞内部拍摄巨大厅堂全景是最经典的角度。钟乳石的灯光照射效果格外壮观。从溶洞入口拍摄内部也很壮观。',
   'Postojna Cave is one of Europe\'s largest caves, stretching over 24 kilometers. The vast chambers and stalactites are breathtaking. Home to the unique olm, Slovenia\'s endemic species.',
   [{icon:'🕳️',title:'溶洞',desc:'欧洲最大的溶洞之一'},{icon:'🦎',title:'洞螈',desc:'斯洛文尼亚特有物种'},{icon:'📸',title:'最佳拍摄',desc:'溶洞内部拍摄巨大厅堂全景'}],
   ['溶洞','自然','波斯托伊纳','斯洛文尼亚']],
  ['piran-old-town','皮兰老城','Piran Old Town','斯洛文尼亚','Slovenia','沿海','Coastal','亚得里亚海的红色宝石','🏘️ 红色小镇 | 亚得里亚海 | 斯洛文尼亚海岸',
   '皮兰是斯洛文尼亚最美丽的沿海小镇，以红色的房屋和圣乔治教堂闻名。小镇坐落在亚得里亚海畔，是斯洛文尼亚唯一的出海口。\n\n拍摄建议：从海边拍摄红色房屋全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从教堂钟楼拍摄小镇全景也很壮观。',
   'Piran is Slovenia\'s most beautiful coastal town, famous for red houses and St. George Church. Situated on the Adriatic Sea, it\'s Slovenia\'s only access to the sea.',
   [{icon:'🏘️',title:'红色小镇',desc:'斯洛文尼亚最美丽沿海小镇'},{icon:'🌊',title:'亚得里亚海',desc:'斯洛文尼亚唯一的出海口'},{icon:'📸',title:'最佳拍摄',desc:'海边拍摄红色房屋全景'}],
   ['小镇','海岸','皮兰','斯洛文尼亚']],
  ['triglav-national','特里格拉夫国家公园','Triglav National Park','斯洛文尼亚','Slovenia','朱利安阿尔卑斯','Julian Alps','斯洛文尼亚唯一的国家公园','🏔️ 国家公园 | 朱利安阿尔卑斯 | 斯洛文尼亚自然',
   '特里格拉夫国家公园是斯洛文尼亚唯一的国家公园，以特里格拉夫峰（2864米）为核心。公园的冰川湖泊、瀑布和山峰是徒步和攀岩的天堂。\n\n拍摄建议：从特里格拉夫湖拍摄山峰全景是最经典的角度。日落时分的金色光线照射在山峰上格外壮观。从高处拍摄公园全景也很壮观。',
   'Triglav National Park is Slovenia\'s only national park, centered on Mount Triglav (2,864m). Glacial lakes, waterfalls, and peaks are a paradise for hiking and climbing.',
   [{icon:'🏔️',title:'国家公园',desc:'斯洛文尼亚唯一的国家公园'},{icon:'⛰️',title:'2864米',desc:'以特里格拉夫峰为核心'},{icon:'📸',title:'最佳拍摄',desc:'特里格拉夫湖拍摄山峰全景'}],
   ['国家公园','阿尔卑斯','朱利安','斯洛文尼亚']],
  ['maribor-old-town','马里博尔老城','Maribor Old Town','斯洛文尼亚','Slovenia','施蒂利亚','Styria','斯洛文尼亚第二大城市的历史中心','🏘️ 葡萄酒之城 | 德拉瓦河 | 斯洛文尼亚文化',
   '马里博尔老城是斯洛文尼亚第二大城市的历史中心，以葡萄酒文化和莱纳塔楼闻名。老城坐落在德拉瓦河畔，是斯洛文尼亚最重要的文化中心之一。\n\n拍摄建议：从德拉瓦河畔拍摄老城全景是最经典的角度。日落时分的金色光线照射在河面上格外壮观。从葡萄园拍摄老城与河流的组合全景也很壮观。',
   'Maribor Old Town is the historic center of Slovenia\'s second city, famous for wine culture and the Lenart Tower. Situated on the Drava River, a key cultural center.',
   [{icon:'🏘️',title:'葡萄酒之城',desc:'斯洛文尼亚第二大城市历史中心'},{icon:'🍷',title:'葡萄酒文化',desc:'以葡萄酒文化和莱纳塔楼闻名'},{icon:'📸',title:'最佳拍摄',desc:'德拉瓦河畔拍摄老城全景'}],
   ['老城','葡萄酒','马里博尔','斯洛文尼亚']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 404
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
  console.log(`\n共插入 ${items.length} 个斯洛文尼亚景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
