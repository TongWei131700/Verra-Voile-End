const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['vaduz-castle','瓦杜兹城堡','Vaduz Castle','列支敦士登','Liechtenstein','瓦杜兹','Vaduz','列支敦士登亲王的官方居所','🏰 亲王城堡 | 山顶城堡 | 列支敦士登地标',
   '瓦杜兹城堡是列支敦士登亲王的官方居所，坐落在瓦杜兹上方的山丘上。城堡始建于12世纪，是列支敦士登最标志性的建筑。\n\n拍摄建议：从瓦杜兹镇拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡拍摄莱茵河谷全景也很壮观。',
   'Vaduz Castle is the official residence of the Prince of Liechtenstein, perched on a hill above Vaduz. Built in the 12th century, it\'s Liechtenstein\'s most iconic building.',
   [{icon:'🏰',title:'亲王城堡',desc:'列支敦士登亲王的官方居所'},{icon:'🏛️',title:'12世纪',desc:'始建于12世纪'},{icon:'📸',title:'最佳拍摄',desc:'瓦杜兹镇拍摄城堡全景'}],
   ['城堡','亲王','瓦杜兹','列支敦士登']],
  ['rhine-valley-liechtenstein','莱茵河谷','Rhine Valley Liechtenstein','列支敦士登','Liechtenstein','瓦杜兹','Vaduz','阿尔卑斯山下的莱茵河谷','🏞️ 莱茵河谷 | 阿尔卑斯 | 列支敦士登自然',
   '莱茵河谷是列支敦士登最壮观的自然景观，莱茵河从阿尔卑斯山间流过，形成了壮丽的河谷风光。河谷两侧的葡萄园和村庄是列支敦士登最美的风景。\n\n拍摄建议：从河谷高处拍摄莱茵河全景是最经典的角度。日落时分的金色光线照射在河谷上格外壮观。从葡萄园拍摄河谷全景也很壮观。',
   'The Rhine Valley is Liechtenstein\'s most spectacular natural landscape, with the Rhine flowing through the Alps. Vineyards and villages on both sides create beautiful scenery.',
   [{icon:'🏞️',title:'莱茵河谷',desc:'列支敦士登最壮观自然景观'},{icon:'🏔️',title:'阿尔卑斯',desc:'莱茵河从阿尔卑斯山间流过'},{icon:'📸',title:'最佳拍摄',desc:'河谷高处拍摄莱茵河全景'}],
   ['河谷','阿尔卑斯','莱茵','列支敦士登']],
  ['malbun-village','马尔本村','Malbun Village','列支敦士登','Liechtenstein','特里森贝格','Triesenberg','阿尔卑斯山间的滑雪胜地','🏔️ 滑雪胜地 | 阿尔卑斯 | 列支敦士登地标',
   '马尔本是列支敦士登唯一的滑雪胜地，坐落在阿尔卑斯山间。村庄的木屋和周围的雪山构成了列支敦士登最美丽的冬季风景。\n\n拍摄建议：从村庄拍摄雪山全景是最经典的角度。日落时分的金色光线照射在雪山上格外壮观。从滑雪道拍摄村庄全景也很壮观。',
   'Malbun is Liechtenstein\'s only ski resort, nestled in the Alps. The village\'s wooden houses and surrounding snowy peaks create Liechtenstein\'s most beautiful winter scenery.',
   [{icon:'🏔️',title:'滑雪胜地',desc:'列支敦士登唯一的滑雪胜地'},{icon:'🏠',title:'阿尔卑斯',desc:'村庄木屋和周围雪山'},{icon:'📸',title:'最佳拍摄',desc:'村庄拍摄雪山全景'}],
   ['滑雪','阿尔卑斯','马尔本','列支敦士登']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 418
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
  console.log(`\n共插入 ${items.length} 个列支敦士登景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
