const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['dubrovnik-old-town','杜布罗夫尼克老城','Dubrovnik Old Town','克罗地亚','Croatia','南部','Dalmatia','亚得里亚海的明珠','🏘️ 世界遗产 | 中世纪老城 | 亚得里亚海明珠',
   '杜布罗夫尼克老城是克罗地亚最美丽的城市，被完整的13世纪城墙环绕。老城的巴洛克建筑、大理石街道和喷泉构成了全世界最完美的中世纪画面。1979年被列为世界遗产。\n\n拍摄建议：从城墙外拍摄老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从城墙顶部拍摄老城与海洋的组合全景也很壮观。',
   'Dubrovnik Old Town is Croatia\'s most beautiful city, surrounded by complete 13th-century walls. The Baroque buildings and marble streets create a perfect medieval scene.',
   [{icon:'🏘️',title:'世界遗产',desc:'克罗地亚最美丽中世纪城市'},{icon:'🏆',title:'世界遗产',desc:'1979年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'城墙外拍摄老城全景'}],
   ['老城','世界遗产','杜布罗夫尼克','克罗地亚']],
  ['dubrovnik-walls','杜布罗夫尼克城墙','Dubrovnik Walls','克罗地亚','Croatia','南部','Dalmatia','环绕老城的千年防御工事','🏰 1940米城墙 | 世界遗产 | 中世纪防御',
   '杜布罗夫尼克城墙全长1940米，是欧洲保存最完好的中世纪防御工事之一。沿着城墙行走可以360度俯瞰老城和亚得里亚海的壮丽景色。城墙上的堡垒和塔楼是拍摄全景的最佳位置。\n\n拍摄建议：从城墙上拍摄老城与海洋的全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从城墙顶部拍摄城墙延伸的画面也很壮观。',
   'Dubrovnik Walls stretch 1,940 meters, one of Europe\'s best-preserved medieval fortifications. Walking along offers 360-degree views of the old town and Adriatic Sea.',
   [{icon:'🏰',title:'1940米城墙',desc:'欧洲保存最完好中世纪防御'},{icon:'🌊',title:'亚得里亚海',desc:'360度俯瞰老城和海洋'},{icon:'📸',title:'最佳拍摄',desc:'城墙上拍摄老城海洋全景'}],
   ['城墙','世界遗产','杜布罗夫尼克','克罗地亚']],
  ['split-diocletian-palace','戴克里先宫','Diocletian Palace','克罗地亚','Croatia','斯普利特','Split','罗马皇帝的退休宫殿','🏛️ 罗马宫殿 | 4世纪 | 世界遗产',
   '戴克里先宫是罗马皇帝戴克里先建于4世纪的退休宫殿，占地超过3万平方米。宫殿现在是斯普利特老城的核心，保存着完好的柱廊、神庙和地下室。1979年被列为世界遗产。\n\n拍摄建议：从宫殿前的广场拍摄柱廊全景是最经典的角度。日落时分的金色光线照射在古建筑上格外壮观。从地下室拍摄宫殿内部也很震撼。',
   'Diocletian Palace was built by Roman Emperor Diocletian in the 4th century as his retirement residence, covering over 30,000 square meters.',
   [{icon:'🏛️',title:'罗马宫殿',desc:'罗马皇帝4世纪退休宫殿'},{icon:'🏆',title:'世界遗产',desc:'1979年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄柱廊全景'}],
   ['宫殿','罗马','斯普利特','克罗地亚']],
  ['plitvice-lakes','普利特维采湖群','Plitvice Lakes','克罗地亚','Croatia','中部','Central','十六个碧蓝湖泊的瀑布链','🌊 16个湖泊 | 瀑布链 | 世界遗产',
   '普利特维采湖群是克罗地亚最壮观的自然景观，由16个碧蓝湖泊通过瀑布链相连。湖水呈现出各种蓝色和绿色色调，周围的森林为湖泊提供了壮丽的背景。1979年被列为世界遗产。\n\n拍摄建议：从木栈道上拍摄湖泊与瀑布的全景是最经典的角度。秋季的金色树叶映衬在蓝色湖面上格外壮观。从高处拍摄湖泊链的全貌也很壮观。',
   'Plitvice Lakes is Croatia\'s most spectacular natural wonder, with 16 blue lakes connected by waterfalls. The water shows various blue and green hues.',
   [{icon:'🌊',title:'16个湖泊',desc:'克罗地亚最壮观自然景观'},{icon:'🏆',title:'世界遗产',desc:'1979年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'木栈道拍摄湖泊瀑布全景'}],
   ['湖泊','瀑布','世界遗产','克罗地亚']],
  ['zagreb-cathedral','萨格勒布大教堂','Zagreb Cathedral','克罗地亚','Croatia','萨格勒布','Zagreb','克罗地亚最高的宗教建筑','⛪ 108米双塔 | 克罗地亚最高 | 哥特建筑',
   '萨格勒布大教堂是克罗地亚最高的宗教建筑，双塔高108米，是萨格勒布天际线最醒目的元素。教堂的哥特式建筑和彩色玻璃窗令人印象深刻。教堂前的广场是市民集会的场所。\n\n拍摄建议：从教堂前的广场拍摄双塔全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从远处拍摄教堂与城市天际线的组合全景也很壮观。',
   'Zagreb Cathedral is Croatia\'s tallest religious building, with twin towers reaching 108 meters. The Gothic architecture and stained glass windows are impressive.',
   [{icon:'⛪',title:'108米双塔',desc:'克罗地亚最高宗教建筑'},{icon:'🏛️',title:'哥特建筑',desc:'令人印象深刻的哥特式建筑'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄双塔全景'}],
   ['教堂','哥特','萨格勒布','克罗地亚']],
  ['hvar-island','赫瓦尔岛','Hvar Island','克罗地亚','Croatia','达尔马提亚','Dalmatia','亚得里亚海的薰衣草之岛','🏝️ 薰衣草 | 亚得里亚海 | 度假天堂',
   '赫瓦尔岛是亚得里亚海最美丽的岛屿之一，以薰衣草田、葡萄园和清澈的海水闻名。岛上的赫瓦尔镇是克罗地亚最时尚的度假胜地。岛上的海滩和海湾是游泳和日光浴的天堂。\n\n拍摄建议：从岛上高处拍摄薰衣草田与海洋的全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从海滩拍摄岛屿天际线也很迷人。',
   'Hvar Island is one of the Adriatic\'s most beautiful islands, famous for lavender fields, vineyards, and crystal-clear waters.',
   [{icon:'🏝️',title:'薰衣草',desc:'亚得里亚海最美丽岛屿之一'},{icon:'🌊',title:'度假天堂',desc:'克罗地亚最时尚度假胜地'},{icon:'📸',title:'最佳拍摄',desc:'高处拍摄薰衣草田海洋全景'}],
   ['岛屿','薰衣草','赫瓦尔','克罗地亚']],
  ['korcula-old-town','科尔丘拉老城','Korcula Old Town','克罗地亚','Croatia','达尔马提亚','Dalmatia','小杜布罗夫尼克的鱼骨街道','🏘️ 鱼骨街道 | 小杜布罗夫尼克 | 中世纪小镇',
   '科尔丘拉老城被称为"小杜布罗夫尼克"，以独特的鱼骨状街道布局闻名。主街两侧的鱼骨状小巷确保了海风的流通和阳光的照射。老城的哥特式建筑和威尼斯风格令人印象深刻。\n\n拍摄建议：从城墙外拍摄老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从高处拍摄鱼骨状街道的布局也很壮观。',
   'Korcula Old Town is known as "Little Dubrovnik," famous for its unique herringbone street layout. The main street\'s side alleys ensure sea breeze circulation.',
   [{icon:'🏘️',title:'鱼骨街道',desc:'小杜布罗夫尼克鱼骨街道'},{icon:'🏛️',title:'哥特建筑',desc:'哥特式建筑威尼斯风格'},{icon:'📸',title:'最佳拍摄',desc:'城墙外拍摄老城全景'}],
   ['老城','中世纪','科尔丘拉','克罗地亚']],
  ['zadar-sea-organ','扎达尔海风琴','Zadar Sea Organ','克罗地亚','Croatia','扎达尔','Zadar','海浪演奏的音乐装置','🎵 海风琴 | 海浪音乐 | 扎达尔地标',
   '扎达尔海风琴是全世界最独特的音乐装置，利用海浪的力量通过地下管道演奏音乐。装置建于2005年，成为了扎达尔最受欢迎的景点。旁边的"向太阳致敬"装置也是绝佳的拍摄对象。\n\n拍摄建议：从海风琴旁拍摄亚得里亚海全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从海风琴拍摄城市天际线的组合全景也很壮观。',
   'Zadar Sea Organ is the world\'s most unique musical instrument, using sea waves to play music through underground pipes. Built in 2005.',
   [{icon:'🎵',title:'海风琴',desc:'全世界最独特音乐装置'},{icon:'🌊',title:'海浪音乐',desc:'利用海浪力量演奏音乐'},{icon:'📸',title:'最佳拍摄',desc:'海风琴旁拍摄亚得里亚海全景'}],
   ['海风琴','音乐','扎达尔','克罗地亚']],
  ['rovnik-amphitheatre','罗维尼竞技场','Rovinj Amphitheatre','克罗地亚','Croatia','伊斯特拉','Istria','保存完好的罗马竞技场','🏛️ 罗马竞技场 | 保存完好 | 克罗地亚地标',
   '罗维尼竞技场是克罗地亚保存最完好的罗马竞技场，建于公元1世纪。竞技场可容纳超过2万名观众，是全世界第六大罗马竞技场。现在仍然用于举办音乐会和电影节的露天放映。\n\n拍摄建议：从竞技场外拍摄完整的建筑全景是最经典的角度。日落时分的金色光线照射在古建筑上格外壮观。从竞技场内部拍摄观众席也很震撼。',
   'The Rovinj Amphitheatre is Croatia\'s best-preserved Roman amphitheater, built in the 1st century AD. Could hold over 20,000 spectators.',
   [{icon:'🏛️',title:'罗马竞技场',desc:'克罗地亚保存最完好罗马竞技场'},{icon:'🏟️',title:'2万观众',desc:'全世界第六大罗马竞技场'},{icon:'📸',title:'最佳拍摄',desc:'竞技场外拍摄完整建筑全景'}],
   ['竞技场','罗马','罗维尼','克罗地亚']],
  ['motovun-hilltown','莫托文山城','Motovun Hill Town','克罗地亚','Croatia','伊斯特拉','Istria','伊斯特拉山顶的中世纪宝石','🏘️ 山顶小镇 | 中世纪宝石 | 伊斯特拉地标',
   '莫托文是伊斯特拉半岛最美丽的山顶小镇，矗立在277米高的山丘上。小镇的中世纪建筑和城墙保存完好，从山脚可以拍摄到小镇矗立在山巅的壮观画面。小镇以松露和葡萄酒闻名。\n\n拍摄建议：从山脚拍摄小镇矗立在山巅的全景是最经典的角度。日落时分的金色光线照射在小镇上格外壮观。从山顶拍摄伊斯特拉半岛全景也很值得。',
   'Motovun is Istria\'s most beautiful hilltop town, perched on a 277-meter hill. The medieval buildings and walls are well-preserved.',
   [{icon:'🏘️',title:'山顶小镇',desc:'伊斯特拉最美丽山顶小镇'},{icon:'🏰',title:'中世纪宝石',desc:'中世纪建筑和城墙保存完好'},{icon:'📸',title:'最佳拍摄',desc:'山脚拍摄小镇山巅全景'}],
   ['小镇','山顶','莫托文','克罗地亚']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 352
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
  console.log(`\n共插入 ${items.length} 个克罗地亚景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
