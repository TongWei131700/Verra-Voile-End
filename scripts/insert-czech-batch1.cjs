const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['prague-charles-bridge','查理大桥','Charles Bridge','捷克','Czech','布拉格','Prague','伏尔塔瓦河上的哥特式石桥','🏛️ 1357年 | 哥特式石桥 | 布拉格地标',
   '查理大桥是布拉格最著名的地标，建于1357年，横跨伏尔塔瓦河。桥上两侧排列着30尊巴洛克风格的圣徒雕像，两端各有一座哥特式塔楼。清晨和黄昏的大桥是最浪漫的时刻。\n\n拍摄建议：从桥上拍摄布拉格城堡与伏尔塔瓦河的全景是最经典的角度。清晨游客稀少时拍摄效果最佳。日落时分的金色光线照射在桥塔上格外壮观。',
   'Charles Bridge is Prague\'s most famous landmark, built in 1357 across the Vltava River. Lined with 30 Baroque statues of saints on both sides.',
   [{icon:'🏛️',title:'1357年',desc:'布拉格最著名哥特式石桥'},{icon:'🗿',title:'30尊雕像',desc:'桥两侧巴洛克圣徒雕像'},{icon:'📸',title:'最佳拍摄',desc:'桥上拍摄城堡伏尔塔瓦河全景'}],
   ['桥梁','哥特','布拉格','捷克']],
  ['prague-castle','布拉格城堡','Prague Castle','捷克','Czech','布拉格','Prague','全世界最大的古城堡','🏰 世界最大古城堡 | 9世纪 | 世界遗产',
   '布拉格城堡是全世界最大的古城堡群，始建于9世纪，占地7万平方米。城堡内包含圣维特大教堂、黄金巷和旧皇宫等建筑。从城堡露台可以俯瞰整个布拉格老城的全景。\n\n拍摄建议：从城堡露台拍摄布拉格老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从远处拍摄城堡与城市天际线的组合全景也很壮观。',
   'Prague Castle is the largest ancient castle complex in the world, dating from the 9th century, covering 70,000 square meters. Houses St. Vitus Cathedral and Golden Lane.',
   [{icon:'🏰',title:'世界最大',desc:'全世界最大古城堡群'},{icon:'🏛️',title:'9世纪',desc:'始建于9世纪城堡群'},{icon:'📸',title:'最佳拍摄',desc:'露台拍摄布拉格老城全景'}],
   ['城堡','世界遗产','布拉格','捷克']],
  ['old-town-square','老城广场','Old Town Square','捷克','Czech','布拉格','Prague','布拉格的心脏广场','🏛️ 老城心脏 | 泰恩教堂 | 天文钟',
   '老城广场是布拉格最热闹的中心，建于12世纪。广场四周环绕着巴洛克和哥特式建筑，包括著名的泰恩教堂和老市政厅。广场上的天文钟每整点都会表演使徒游行。\n\n拍摄建议：从广场中央拍摄泰恩教堂与天文钟的全景是最经典的角度。日落时分的金色光线照射在巴洛克建筑上格外壮观。从老市政厅塔楼拍摄广场全景也很值得。',
   'Old Town Square is Prague\'s busiest center, dating from the 12th century. Surrounded by Baroque and Gothic buildings including the famous Tyn Church.',
   [{icon:'🏛️',title:'老城心脏',desc:'布拉格最热闹中心广场'},{icon:'⛪',title:'泰恩教堂',desc:'广场著名哥特式教堂'},{icon:'📸',title:'最佳拍摄',desc:'广场中央拍摄教堂钟楼全景'}],
   ['广场','老城','布拉格','捷克']],
  ['astronomical-clock','天文钟','Astronomical Clock','捷克','Czech','布拉格','Prague','600年历史的机械奇迹','⏰ 600年历史 | 机械奇迹 | 布拉格地标',
   '布拉格天文钟是全世界最著名的天文钟之一，建于1410年，是全世界第三古老的天文钟。每整点钟上的12尊使徒雕像会依次出现，吸引了无数游客驻足观看。天文钟所在的旧市政厅塔楼是布拉格最上镜的建筑之一。\n\n拍摄建议：从广场拍摄天文钟与旧市政厅的全景是最经典的角度。整点时刻拍摄使徒游行的画面也很壮观。从塔楼拍摄老城广场全景也很值得。',
   'The Prague Astronomical Clock is one of the world\'s most famous, built in 1410, the third oldest astronomical clock in the world.',
   [{icon:'⏰',title:'600年历史',desc:'全世界第三古老天文钟'},{icon:'🎭',title:'使徒游行',desc:'每整点使徒雕像依次出现'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄天文钟钟楼全景'}],
   ['天文钟','机械','布拉格','捷克']],
  ['st-vitus-cathedral','圣维特大教堂','St. Vitus Cathedral','捷克','Czech','布拉格','Prague','布拉格城堡的哥特式皇冠','⛪ 哥特式大教堂 | 600年建造 | 布拉格地标',
   '圣维特大教堂是布拉格最重要的教堂，始建于1344年，历时600年才完工。教堂的哥特式尖塔是布拉格天际线最醒目的元素。教堂内的穆夏彩色玻璃窗和圣瓦茨拉夫礼拜堂是艺术珍品。\n\n拍摄建议：从城堡区拍摄教堂尖塔全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从教堂内部拍摄穆夏彩色玻璃窗也很震撼。',
   'St. Vitus Cathedral is Prague\'s most important church, construction began in 1344 and took 600 years to complete. The Gothic spires are Prague\'s most prominent skyline elements.',
   [{icon:'⛪',title:'哥特式大教堂',desc:'布拉格最重要教堂'},{icon:'🏗️',title:'600年建造',desc:'历时600年才完工'},{icon:'📸',title:'最佳拍摄',desc:'城堡区拍摄教堂尖塔全景'}],
   ['教堂','哥特','布拉格','捷克']],
  ['john-lennon-wall','列侬墙','John Lennon Wall','捷克','Czech','布拉格','Prague','和平与爱的涂鸦之墙','🎨 涂鸦墙 | 和平象征 | 布拉格地标',
   '列侬墙是布拉格最具艺术气息的景点之一，自1980年代起就布满了约翰·列侬的画像和和平主题的涂鸦。这面墙曾是捷克年轻人表达反政府情绪的出口，现在成为了和平与爱的象征。\n\n拍摄建议：从墙前拍摄涂鸦全景是最经典的角度。墙上的列侬画像和和平标语是很好的细节元素。不同季节的涂鸦风格各不相同，每次来访都有新发现。',
   'The John Lennon Wall is one of Prague\'s most artistic attractions, covered with John Lennon portraits and peace-themed graffiti since the 1980s.',
   [{icon:'🎨',title:'涂鸦墙',desc:'布拉格最具艺术气息景点'},{icon:'☮️',title:'和平象征',desc:'和平与爱的涂鸦象征'},{icon:'📸',title:'最佳拍摄',desc:'墙前拍摄涂鸦全景'}],
   ['涂鸦','和平','布拉格','捷克']],
  ['cesky-krumlov','克鲁姆洛夫','Cesky Krumlov','捷克','Czech','南波希米亚','South Bohemia','伏尔塔瓦河环抱的中世纪小镇','🏘️ 世界遗产 | 中世纪小镇 | 彩色房屋',
   '克鲁姆洛夫是捷克最美丽的小镇之一，被伏尔塔瓦河呈S形环抱。小镇的中世纪建筑群和彩色房屋如同童话世界。1992年被列为世界遗产。小镇的城堡是捷克第二大城堡。\n\n拍摄建议：从城堡塔楼拍摄小镇全景是最经典的角度。日落时分的金色光线照射在彩色屋顶上格外壮观。从河对岸拍摄小镇与河流的组合全景也很迷人。',
   'Cesky Krumlov is one of Czech\'s most beautiful towns, embraced by the Vltava River in an S-shape. The medieval buildings and colorful houses are like a fairy tale.',
   [{icon:'🏘️',title:'世界遗产',desc:'捷克最美丽中世纪小镇'},{icon:'🏰',title:'第二大城堡',desc:'捷克第二大城堡'},{icon:'📸',title:'最佳拍摄',desc:'城堡塔楼拍摄小镇全景'}],
   ['小镇','世界遗产','克鲁姆洛夫','捷克']],
  ['kutna-hora-bones','人骨教堂','Bone Church Kutna Hora','捷克','Czech','中波希米亚','Central Bohemia','四万具骸骨装饰的教堂','💀 人骨教堂 | 4万具骸骨 | 捷克奇景',
   '人骨教堂是捷克最独特的景点之一，教堂内部用约4万具人骨装饰。这些骸骨被精心排列成吊灯、金字塔和其他装饰图案。教堂建于15世纪，目的是纪念在黑死病中死去的亡灵。\n\n拍摄建议：从教堂内部拍摄人骨装饰的全景是最经典的角度。人骨吊灯和家族纹章是很好的细节元素。教堂的阴森氛围需要适当的光线设置才能拍摄出最佳效果。',
   'The Bone Church is one of Czech\'s most unique attractions, decorated with approximately 40,000 human bones arranged in chandeliers and pyramids.',
   [{icon:'💀',title:'人骨教堂',desc:'捷克最独特景点之一'},{icon:'🦴',title:'4万具骸骨',desc:'约4万具人骨装饰教堂'},{icon:'📸',title:'最佳拍摄',desc:'教堂内部拍摄人骨装饰全景'}],
   ['教堂','人骨','库特纳霍拉','捷克']],
  ['karlovy-vary','卡罗维发利','Karlovy Vary','捷克','Czech','西波希米亚','West Bohemia','捷克最著名的温泉小镇','♨️ 温泉小镇 | 13个热泉 | 捷克疗养胜地',
   '卡罗维发利是捷克最著名的温泉小镇，拥有13个主要热泉和300多个小泉。小镇的温泉长廊和巴洛克建筑构成了优雅的疗养环境。小镇因温泉吸引了包括贝多芬和歌德在内的众多名人。\n\n拍摄建议：从温泉长廊拍摄小镇与河流的全景是最经典的角度。日落时分的金色光线照射在巴洛克建筑上格外壮观。从高处拍摄小镇全景也很值得。',
   'Karlovy Vary is Czech\'s most famous spa town, with 13 main hot springs and over 300 smaller ones. The spa colonnade and Baroque buildings create an elegant healing environment.',
   [{icon:'♨️',title:'温泉小镇',desc:'捷克最著名温泉小镇'},{icon:'🏛️',title:'温泉长廊',desc:'13个主要热泉温泉长廊'},{icon:'📸',title:'最佳拍摄',desc:'长廊拍摄小镇河流全景'}],
   ['温泉','疗养','卡罗维发利','捷克']],
  ['telc-square','泰尔奇广场','Telc Square','捷克','Czech','维索基纳','Vysocina','文艺复兴彩色房屋的完美广场','🏘️ 文艺复兴广场 | 彩色房屋 | 世界遗产',
   '泰尔奇广场是捷克最美丽的广场之一，被联合国教科文组织列为世界遗产。广场四周环绕着文艺复兴和巴洛克风格的彩色房屋，每栋房屋都有独特的山墙设计。广场中央的圣母柱是巴洛克艺术的杰作。\n\n拍摄建议：从广场一角拍摄彩色房屋全景是最经典的角度。日落时分的金色光线照射在彩色房屋上格外温馨。从教堂塔楼拍摄广场全景也很值得。',
   'Telc Square is one of Czech\'s most beautiful squares, a UNESCO World Heritage Site. Surrounded by Renaissance and Baroque colorful houses with unique gable designs.',
   [{icon:'🏘️',title:'文艺复兴广场',desc:'捷克最美丽广场之一'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'广场一角拍摄彩色房屋全景'}],
   ['广场','世界遗产','泰尔奇','捷克']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 322
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
  console.log(`\n共插入 ${items.length} 个捷克景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
