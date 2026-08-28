const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['luxembourg-old-town','卢森堡老城','Luxembourg Old Town','卢森堡','Luxembourg','卢森堡','Luxembourg','欧洲最小的世界遗产首都','🏘️ 世界遗产 | 峡谷首都 | 卢森堡地标',
   '卢森堡老城被联合国教科文组织列为世界遗产，坐落在深邃的峡谷之上。老城的堡垒和桥梁构成了欧洲最独特的城市景观之一。\n\n拍摄建议：从峡谷底部拍摄老城与桥梁的全景是最经典的角度。日落时分的金色光线照射在峡谷上格外壮观。从阿道夫桥拍摄老城天际线也很壮观。',
   'Luxembourg Old Town is a UNESCO World Heritage Site, perched above deep gorges. The fortifications and bridges create one of Europe\'s most unique cityscapes.',
   [{icon:'🏘️',title:'世界遗产',desc:'欧洲最小的世界遗产首都'},{icon:'🌉',title:'峡谷首都',desc:'坐落在深邃峡谷之上'},{icon:'📸',title:'最佳拍摄',desc:'峡谷底部拍摄老城桥梁全景'}],
   ['老城','世界遗产','卢森堡','卢森堡']],
  ['grand-ducal-palace','大公宫','Grand Ducal Palace','卢森堡','Luxembourg','卢森堡','Luxembourg','卢森堡大公的官方居所','🏰 大公宫 | 文艺复兴 | 卢森堡地标',
   '大公宫是卢森堡大公的官方居所，建于16世纪。宫殿的文艺复兴风格立面是卢森堡最美丽的建筑之一。每年的国庆日，大公在这里向民众致辞。\n\n拍摄建议：从宫殿前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在宫殿上格外壮观。从老城拍摄宫殿与城市天际线的组合全景也很壮观。',
   'The Grand Ducal Palace is the official residence of the Grand Duke of Luxembourg, built in the 16th century. The Renaissance facade is one of Luxembourg\'s most beautiful buildings.',
   [{icon:'🏰',title:'大公宫',desc:'卢森堡大公的官方居所'},{icon:'🏛️',title:'文艺复兴',desc:'16世纪文艺复兴风格建筑'},{icon:'📸',title:'最佳拍摄',desc:'宫殿前方拍摄完整建筑全景'}],
   ['宫殿','大公','卢森堡','卢森堡']],
  ['vianden-castle','菲安登城堡','Vianden Castle','卢森堡','Luxembourg','菲安登','Vianden','卢森堡最大的中世纪城堡','🏰 中世纪城堡 | 卢森堡最大 | 菲安登地标',
   '菲安登城堡是卢森堡最大的中世纪城堡，坐落在乌尔河上方的山丘上。城堡始建于11世纪，是卢森堡最受欢迎的旅游景点之一。\n\n拍摄建议：从乌尔河畔拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡拍摄菲安登小镇全景也很壮观。',
   'Vianden Castle is Luxembourg\'s largest medieval castle, perched on a hill above the Our River. Built in the 11th century, it\'s Luxembourg\'s most popular tourist attraction.',
   [{icon:'🏰',title:'中世纪城堡',desc:'卢森堡最大的中世纪城堡'},{icon:'🏛️',title:'11世纪',desc:'始建于11世纪'},{icon:'📸',title:'最佳拍摄',desc:'乌尔河畔拍摄城堡全景'}],
   ['城堡','中世纪','菲安登','卢森堡']],
  ['mullerthal-trail','穆勒塔尔小径','Mullerthal Trail','卢森堡','Luxembourg','东部','Eastern','卢森堡的奇石森林','🌲 奇石森林 | 徒步天堂 | 卢森堡自然',
   '穆勒塔尔小径是卢森堡最美丽的自然步道，以奇特的岩石 formations 和茂密的森林闻名。小径穿过峡谷和石桥，是徒步爱好者的天堂。\n\n拍摄建议：从奇石间拍摄森林全景是最经典的角度。日落时分的金色光线穿过树叶格外壮观。从峡谷拍摄小径全景也很壮观。',
   'The Mullerthal Trail is Luxembourg\'s most beautiful nature path, famous for bizarre rock formations and dense forests. The trail passes through gorges and stone bridges.',
   [{icon:'🌲',title:'奇石森林',desc:'卢森堡最美丽的自然步道'},{icon:'🥾',title:'徒步天堂',desc:'小径穿过峡谷和石桥'},{icon:'📸',title:'最佳拍摄',desc:'奇石间拍摄森林全景'}],
   ['森林','徒步','穆勒塔尔','卢森堡']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 410
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
  console.log(`\n共插入 ${items.length} 个卢森堡景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
