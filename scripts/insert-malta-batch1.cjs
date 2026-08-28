const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['valletta-old-town','瓦莱塔老城','Valletta Old Town','马耳他','Malta','瓦莱塔','Valletta','地中海的骑士之城','🏘️ 骑士之城 | 世界遗产 | 马耳他地标',
   '瓦莱塔老城是马耳他的首都，被联合国教科文组织列为世界遗产。老城由圣约翰骑士团建于16世纪，以堡垒和巴洛克建筑闻名。\n\n拍摄建议：从大港拍摄老城全景是最经典的角度。日落时分的金色光线照射在石灰岩建筑上格外壮观。从_upper_barrakka花园拍摄港口全景也很壮观。',
   'Valletta Old Town is Malta\'s capital, a UNESCO World Heritage Site. Built by the Knights of St. John in the 16th century, famous for fortifications and Baroque architecture.',
   [{icon:'🏘️',title:'骑士之城',desc:'马耳他首都世界遗产'},{icon:'🏰',title:'16世纪',desc:'圣约翰骑士团建于16世纪'},{icon:'📸',title:'最佳拍摄',desc:'大港拍摄老城全景'}],
   ['老城','骑士','瓦莱塔','马耳他']],
  ['st-johns-co-cathedral','圣约翰大教堂','St John\'s Co-Cathedral','马耳他','Malta','瓦莱塔','Valletta','巴洛克艺术的巅峰之作','⛪ 巴洛克教堂 | 骑士团 | 马耳他地标',
   '圣约翰大教堂是马耳他最壮观的教堂，内部装饰着卡拉瓦乔的名画《圣杰罗姆》。教堂的巴洛克风格装饰和骑士团的墓碑令人叹为观止。\n\n拍摄建议：从教堂前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在教堂上格外壮观。从教堂内部拍摄巴洛克装饰也很壮观。',
   'St John\'s Co-Cathedral is Malta\'s most spectacular church, housing Caravaggio\'s masterpiece "St. Jerome." The Baroque decorations and Knights\' tombs are breathtaking.',
   [{icon:'⛪',title:'巴洛克教堂',desc:'马耳他最壮观的教堂'},{icon:'🎨',title:'卡拉瓦乔',desc:'内部装饰着卡拉瓦乔名画'},{icon:'📸',title:'最佳拍摄',desc:'教堂前方拍摄完整建筑全景'}],
   ['教堂','巴洛克','瓦莱塔','马耳他']],
  ['blue-grotto-malta','蓝洞','Blue Grotto Malta','马耳他','Malta','南部','Southern','地中海的蓝色奇观','🌊 蓝洞 | 地中海 | 马耳他自然',
   '马耳他蓝洞是地中海最壮观的海蚀洞穴之一，以碧蓝的海水和奇特的岩石构造闻名。阳光照射下，洞穴内的海水呈现出各种蓝色色调。\n\n拍摄建议：从船上拍摄蓝洞内部全景是最经典的角度。日落时分的金色光线照射在蓝色海水上格外壮观。从海岸拍摄蓝洞入口也很壮观。',
   'Malta\'s Blue Grotto is one of the Mediterranean\'s most spectacular sea caves, famous for azure waters and unique rock formations. Sunlight creates various blue hues in the cave.',
   [{icon:'🌊',title:'蓝洞',desc:'地中海最壮观的海蚀洞穴'},{icon:'💎',title:'碧蓝海水',desc:'阳光照射呈现各种蓝色'},{icon:'📸',title:'最佳拍摄',desc:'船上拍摄蓝洞内部全景'}],
   ['蓝洞','地中海','南部','马耳他']],
  ['mdina-silent-city','姆迪纳静城','Mdina Silent City','马耳他','Malta','中部','Central','马耳他的中世纪寂静之城','🏘️ 静城 | 中世纪 | 马耳他地标',
   '姆迪纳被称为"静城"，是马耳他的旧都。这座中世纪城市被完整的城墙环绕，城内的狭窄街道和诺曼底建筑保存完好。\n\n拍摄建议：从城墙外拍摄姆迪纳全景是最经典的角度。日落时分的金色光线照射在石灰岩城墙上格外壮观。从城墙顶部拍摄马耳他全景也很壮观。',
   'Mdina, known as the "Silent City," is Malta\'s former capital. This medieval city is surrounded by complete walls, with narrow streets and Norman architecture well-preserved.',
   [{icon:'🏘️',title:'静城',desc:'马耳他的旧都'},{icon:'🏰',title:'中世纪',desc:'完整城墙环绕中世纪城市'},{icon:'📸',title:'最佳拍摄',desc:'城墙外拍摄姆迪纳全景'}],
   ['静城','中世纪','姆迪纳','马耳他']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 414
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
  console.log(`\n共插入 ${items.length} 个马耳他景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
