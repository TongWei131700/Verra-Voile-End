const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['bratislava-old-town','布拉迪斯拉发老城','Bratislava Old Town','斯洛伐克','Slovakia','布拉迪斯拉发','Bratislava','多瑙河畔的中世纪老城','🏘️ 中世纪老城 | 多瑙河 | 斯洛伐克地标',
   '布拉迪斯拉发老城是斯洛伐克首都的历史中心，坐落在多瑙河畔。老城的巴洛克建筑、中世纪街道和迈克尔门构成了独特的城市景观。\n\n拍摄建议：从迈克尔门拍摄老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从多瑙河畔拍摄老城天际线也很壮观。',
   'Bratislava Old Town is the historic center of Slovakia\'s capital, situated on the Danube. Baroque architecture, medieval streets, and Michael\'s Gate create a unique cityscape.',
   [{icon:'🏘️',title:'中世纪老城',desc:'斯洛伐克首都历史中心'},{icon:'🌊',title:'多瑙河',desc:'坐落在多瑙河畔'},{icon:'📸',title:'最佳拍摄',desc:'迈克尔门拍摄老城全景'}],
   ['老城','多瑙河','布拉迪斯拉发','斯洛伐克']],
  ['bratislava-castle','布拉迪斯拉发城堡','Bratislava Castle','斯洛伐克','Slovakia','布拉迪斯拉发','Bratislava','多瑙河畔的中世纪皇家城堡','🏰 皇家城堡 | 中世纪 | 斯洛伐克地标',
   '布拉迪斯拉发城堡矗立在多瑙河上方的山丘上，是斯洛伐克最标志性的建筑。城堡始建于10世纪，经历了多次重建。从城堡可以俯瞰整个布拉迪斯拉发和多瑙河。\n\n拍摄建议：从多瑙河畔拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡拍摄布拉迪斯拉发全景也很壮观。',
   'Bratislava Castle stands on a hill above the Danube, Slovakia\'s most iconic building. Built in the 10th century with panoramic views of the city and river.',
   [{icon:'🏰',title:'皇家城堡',desc:'斯洛伐克最标志性建筑'},{icon:'🏛️',title:'10世纪',desc:'始建于10世纪多次重建'},{icon:'📸',title:'最佳拍摄',desc:'多瑙河畔拍摄城堡全景'}],
   ['城堡','皇家','布拉迪斯拉发','斯洛伐克']],
  ['high-tatras','高塔特拉山','High Tatras','斯洛伐克','Slovakia','北部','Northern','喀尔巴阡山脉的最高峰','🏔️ 高山 | 喀尔巴阡 | 斯洛伐克自然',
   '高塔特拉山是喀尔巴阡山脉的最高峰，也是斯洛伐克最壮观的自然景观。山脉的冰川湖泊、瀑布和山峰是徒步和滑雪的天堂。\n\n拍摄建议：从山间湖泊拍摄山峰倒影全景是最经典的角度。日落时分的金色光线照射在山峰上格外壮观。从高处拍摄山脉全景也很壮观。',
   'The High Tatras are the highest peak of the Carpathian Mountains and Slovakia\'s most spectacular natural landscape. Glacial lakes, waterfalls, and peaks are a paradise for hiking and skiing.',
   [{icon:'🏔️',title:'高山',desc:'喀尔巴阡山脉最高峰'},{icon:'🏞️',title:'冰川湖泊',desc:'冰川湖泊瀑布徒步天堂'},{icon:'📸',title:'最佳拍摄',desc:'山间湖泊拍摄山峰倒影全景'}],
   ['山脉','冰川','北部','斯洛伐克']],
  ['kosice-cathedral','科希策大教堂','Košice Cathedral','斯洛伐克','Slovakia','科希策','Košice','斯洛伐克最大的哥特式教堂','⛪ 哥特教堂 | 斯洛伐克最大 | 科希策地标',
   '科希策大教堂（圣伊丽莎白大教堂）是斯洛伐克最大的哥特式教堂，也是全世界最西端的哥特式大教堂。教堂始建于14世纪，精美的彩色玻璃窗和尖塔令人叹为观止。\n\n拍摄建议：从教堂前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在尖塔上格外壮观。从教堂内部拍摄彩色玻璃窗也很壮观。',
   'Košice Cathedral (St. Elizabeth Cathedral) is Slovakia\'s largest Gothic cathedral and the westernmost Gothic cathedral in the world. Built in the 14th century with exquisite stained glass.',
   [{icon:'⛪',title:'哥特教堂',desc:'斯洛伐克最大的哥特式教堂'},{icon:'🏛️',title:'14世纪',desc:'全世界最西端哥特式大教堂'},{icon:'📸',title:'最佳拍摄',desc:'教堂前方拍摄完整建筑全景'}],
   ['教堂','哥特','科希策','斯洛伐克']],
  ['spissky-hrad','斯皮什城堡','Spiš Castle','斯洛伐克','Slovakia','东部','Eastern','中欧最大的中世纪城堡群','🏰 中世纪城堡 | 世界遗产 | 中欧最大',
   '斯皮什城堡是中欧最大的中世纪城堡群之一，占地超过4公顷。城堡建于12世纪，1993年被列为世界遗产。城堡矗立在山丘上，从远处就能感受到它的壮观。\n\n拍摄建议：从山脚拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡内部拍摄庭院和塔楼也很壮观。',
   'Spiš Castle is one of Central Europe\'s largest medieval castle complexes, covering over 4 hectares. Built in the 12th century, UNESCO World Heritage since 1993.',
   [{icon:'🏰',title:'中世纪城堡',desc:'中欧最大的中世纪城堡群'},{icon:'🏆',title:'世界遗产',desc:'1993年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'山脚拍摄城堡全景'}],
   ['城堡','世界遗产','东部','斯洛伐克']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 399
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
  console.log(`\n共插入 ${items.length} 个斯洛伐克景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
