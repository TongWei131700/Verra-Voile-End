const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['cliff-moher','莫赫悬崖','Cliffs of Moher','爱尔兰','Ireland','克莱尔','Clare','欧洲最高的悬崖之一','🏖️ 214米悬崖 | 世界遗产 | 爱尔兰地标',
   '莫赫悬崖是爱尔兰最壮观的自然景观，悬崖高达214米，绵延8公里。悬崖面对着浩瀚的大西洋，是爱尔兰最受欢迎的旅游景点之一。2011年被列为世界地质遗产。\n\n拍摄建议：从悬崖边缘拍摄大西洋全景是最经典的角度。日落时分的金色光线照射在悬崖上格外壮观。从悬崖顶部拍摄延伸的海岸线也很壮观。',
   'The Cliffs of Moher are Ireland\'s most spectacular natural landscape, rising 214 meters and stretching 8 kilometers along the Atlantic.',
   [{icon:'🏖️',title:'214米悬崖',desc:'欧洲最高的悬崖之一'},{icon:'🏆',title:'世界遗产',desc:'2011年列为世界地质遗产'},{icon:'📸',title:'最佳拍摄',desc:'悬崖边缘拍摄大西洋全景'}],
   ['悬崖','大西洋','爱尔兰','世界遗产']],
  ['ring-of-kerry','凯里环','Ring of Kerry','爱尔兰','Ireland','凯里','Kerry','爱尔兰最壮观的环状公路','🛣️ 179公里 | 环状公路 | 爱尔兰最美',
   '凯里环是爱尔兰最著名的风景公路，全长179公里，环绕凯里郡的伊弗拉半岛。沿途经过湖泊、山脉、海滩和中世纪小镇，是爱尔兰最壮观的自驾路线。\n\n拍摄建议：从公路沿线的高处拍摄湖泊与山脉的全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从海边拍摄凯里环的海岸线也很壮观。',
   'The Ring of Kerry is Ireland\'s most famous scenic drive, 179 kilometers around the Iveragh Peninsula. Passes lakes, mountains, beaches, and medieval towns.',
   [{icon:'🛣️',title:'179公里',desc:'爱尔兰最著名的风景公路'},{icon:'🏔️',title:'自然景观',desc:'沿途湖泊山脉海滩小镇'},{icon:'📸',title:'最佳拍摄',desc:'高处拍摄湖泊山脉全景'}],
   ['公路','自驾','凯里','爱尔兰']],
  ['gallarus-oratory','加拉鲁斯礼拜堂','Gallarus Oratory','爱尔兰','Ireland','凯里','Kerry','爱尔兰最古老的石砌建筑','⛪ 石砌礼拜堂 | 8世纪 | 爱尔兰最古老',
   '加拉鲁斯礼拜堂是爱尔兰最古老的完整石砌建筑之一，建于8世纪。礼拜堂使用干石建造技术，没有使用任何灰浆，却屹立了超过1200年。建筑形状像一艘倒扣的船。\n\n拍摄建议：从礼拜堂前方拍摄完整的建筑全景是最经典的角度。日落时分的金色光线照射在石墙上格外壮观。从远处拍摄礼拜堂与海湾的组合全景也很壮观。',
   'Gallarus Oratory is one of Ireland\'s oldest complete stone buildings, dating from the 8th century. Built using dry-stone technique without mortar.',
   [{icon:'⛪',title:'石砌礼拜堂',desc:'爱尔兰最古老的完整石砌建筑'},{icon:'🏛️',title:'8世纪',desc:'干石建造技术屹立1200年'},{icon:'📸',title:'最佳拍摄',desc:'礼拜堂前方拍摄建筑全景'}],
   ['礼拜堂','石砌','凯里','爱尔兰']],
  ['killarney-lakes','基拉尼湖','Killarney Lakes','爱尔兰','Ireland','凯里','Kerry','爱尔兰最美丽的湖泊群','🏞️ 三湖 | 国家公园 | 爱尔兰最美',
   '基拉尼湖由三个湖泊组成，位于基拉尼国家公园内。湖泊被山脉和森林环绕，是爱尔兰最美丽的自然景观之一。湖上的罗斯城堡和修道院是著名的拍摄对象。\n\n拍摄建议：从湖边拍摄山脉与湖泊的全景是最经典的角度。日落时分的金色光线照射在湖面上格外壮观。从船上拍摄湖岸的城堡也很壮观。',
   'Killarney Lakes consists of three lakes within Killarney National Park. Surrounded by mountains and forests, Ireland\'s most beautiful natural landscape.',
   [{icon:'🏞️',title:'三湖',desc:'基拉尼国家公园内的三个湖泊'},{icon:'🏔️',title:'自然景观',desc:'山脉森林环绕的湖泊'},{icon:'📸',title:'最佳拍摄',desc:'湖边拍摄山脉湖泊全景'}],
   ['湖泊','国家公园','基拉尼','爱尔兰']],
  ['blarney-castle','布拉尼城堡','Blarney Castle','爱尔兰','Ireland','科克','Cork','吻布拉尼石获得口才','🏰 城堡 | 15世纪 | 布拉尼石',
   '布拉尼城堡建于15世纪，是爱尔兰最著名的城堡之一。城堡的布拉尼石是全世界最著名的石头，传说亲吻它可以获得"口才"。城堡周围的花园和公园也很美丽。\n\n拍摄建议：从城堡下方拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从花园拍摄城堡与绿地的组合全景也很壮观。',
   'Blarney Castle, built in the 15th century, is Ireland\'s most famous castle. The Blarney Stone is said to give the gift of eloquence to those who kiss it.',
   [{icon:'🏰',title:'城堡',desc:'爱尔兰最著名的城堡之一'},{icon:'🪨',title:'布拉尼石',desc:'亲吻获得口才的传说'},{icon:'📸',title:'最佳拍摄',desc:'城堡下方拍摄城堡全景'}],
   ['城堡','布拉尼石','科克','爱尔兰']],
  ['cobh','科夫小镇','Cobh Town','爱尔兰','Ireland','科克','Cork','泰坦尼克号最后的停靠港','🏘️ 海港小镇 | 泰坦尼克号 | 爱尔兰地标',
   '科夫是爱尔兰科克郡的海港小镇，是泰坦尼克号1912年最后一次停靠的地方。小镇的彩色房屋和港口是爱尔兰最温馨的画面之一。小镇还有著名的圣科尔曼大教堂。\n\n拍摄建议：从港口拍摄彩色房屋全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从高处拍摄小镇与港口的组合全景也很壮观。',
   'Cobh is a harbor town in County Cork, the last port of call for the Titanic in 1912. The colorful houses and harbor create Ireland\'s warmest scene.',
   [{icon:'🏘️',title:'海港小镇',desc:'爱尔兰科克郡海港小镇'},{icon:'🚢',title:'泰坦尼克号',desc:'泰坦尼克号最后停靠港'},{icon:'📸',title:'最佳拍摄',desc:'港口拍摄彩色房屋全景'}],
   ['小镇','港口','科克','爱尔兰']],
  ['dingle-peninsula','丁格尔半岛','Dingle Peninsula','爱尔兰','Ireland','凯里','Kerry','爱尔兰语区的野生海豚','🏖️ 半岛 | 爱尔兰语区 | 野生海豚',
   '丁格尔半岛是爱尔兰最西端的半岛，是爱尔兰语区之一。半岛以壮丽的海岸线、野生海豚Fungie和传统的爱尔兰音乐闻名。半岛上的山峰和海滩是徒步的天堂。\n\n拍摄建议：从半岛高处拍摄海岸线全景是最经典的角度。日落时分的金色光线照射在大西洋上格外壮观。从海滩拍摄半岛天际线也很壮观。',
   'Dingle Peninsula is Ireland\'s westernmost peninsula, an Irish-speaking area famous for dramatic coastline, wild dolphins, and traditional music.',
   [{icon:'🏖️',title:'半岛',desc:'爱尔兰最西端的半岛'},{icon:'🐬',title:'野生海豚',desc:'著名的野生海豚Fungie'},{icon:'📸',title:'最佳拍摄',desc:'高处拍摄海岸线全景'}],
   ['半岛','海岸线','凯里','爱尔兰']],
  ['connemara','康尼马拉','Connemara','爱尔兰','Ireland','戈尔韦','Galway','爱尔兰最荒野的地区','🏞️ 荒野 | 泥炭沼泽 | 爱尔兰最美',
   '康尼马拉是爱尔兰最荒野和美丽的地区，以泥炭沼泽、湖泊和山脉闻名。地区的盖尔语文化保存完好，是爱尔兰传统文化的精髓。康尼马拉国家公园是徒步和观鸟的天堂。\n\n拍摄建议：从沼泽地拍摄山脉与湖泊的全景是最经典的角度。日落时分的金色光线照射在沼泽上格外壮观。从国家公园拍摄荒野全景也很壮观。',
   'Connemara is Ireland\'s most wild and beautiful region, famous for peat bogs, lakes, and mountains. Gaelic culture is well-preserved here.',
   [{icon:'🏞️',title:'荒野',desc:'爱尔兰最荒野美丽的地区'},{icon:'🌿',title:'泥炭沼泽',desc:'以泥炭沼泽湖泊山脉闻名'},{icon:'📸',title:'最佳拍摄',desc:'沼泽地拍摄山脉湖泊全景'}],
   ['荒野','沼泽','戈尔韦','爱尔兰']],
  ['kylemore-abbey','凯尔莫修道院','Kylemore Abbey','爱尔兰','Ireland','戈尔韦','Galway','康尼马拉湖畔的修道院','⛪ 修道院 | 维多利亚花园 | 爱尔兰地标',
   '凯尔莫修道院建于19世纪，坐落在康尼马拉的湖畔。修道院的维多利亚围墙花园是爱尔兰最著名的花园之一。修道院现在是本笃会修道院，对游客开放参观。\n\n拍摄建议：从湖畔拍摄修道院全景是最经典的角度。日落时分的金色光线照射在修道院上格外壮观。从花园拍摄修道院与湖泊的组合全景也很壮观。',
   'Kylemore Abbey, built in the 19th century, sits on a lake in Connemara. The Victorian walled garden is one of Ireland\'s most famous gardens.',
   [{icon:'⛪',title:'修道院',desc:'坐落在康尼马拉湖畔'},{icon:'🌺',title:'维多利亚花园',desc:'爱尔兰最著名的花园之一'},{icon:'📸',title:'最佳拍摄',desc:'湖畔拍摄修道院全景'}],
   ['修道院','花园','戈尔韦','爱尔兰']],
  ['giants-causeway','巨人之路','Giant\'s Causeway','爱尔兰','Ireland','北爱尔兰','Northern Ireland','四万根玄武岩柱','🏖️ 玄武岩柱 | 世界遗产 | 北爱尔兰地标',
   '巨人之路由约4万根互锁的玄武岩柱组成，是北爱尔兰最壮观的自然景观。这些石柱是6000万年前火山活动的产物。1986年被列为世界遗产。\n\n拍摄建议：从石柱群中拍摄海岸线全景是最经典的角度。日落时分的金色光线照射在石柱上格外壮观。从高处拍摄石柱群的全貌也很壮观。',
   'The Giant\'s Causeway consists of about 40,000 interlocking basalt columns, Northern Ireland\'s most spectacular natural landscape. Formed by volcanic activity 60 million years ago.',
   [{icon:'🏖️',title:'玄武岩柱',desc:'约4万根互锁玄武岩柱'},{icon:'🏆',title:'世界遗产',desc:'1986年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'石柱群中拍摄海岸线全景'}],
   ['石柱','世界遗产','北爱尔兰','自然']],
  ['dark-hedges','黑暗树篱','Dark Hedges','爱尔兰','Ireland','北爱尔兰','Northern Ireland','权力的游戏取景地','🌳 山毛榉树篱 | 权力的游戏 | 北爱尔兰地标',
   '黑暗树篱是北爱尔兰最著名的景观之一，由两排山毛榉树组成的隧道。这条道路因作为《权力的游戏》中国王大道的取景地而闻名全世界。\n\n拍摄建议：从道路一端拍摄树篱隧道全景是最经典的角度。日落时分的金色光线穿过树枝格外壮观。从道路中间拍摄对称的树篱也很壮观。',
   'The Dark Hedges is Northern Ireland\'s most famous landscape, a tunnel of beech trees. Famous as the King\'s Road in Game of Thrones.',
   [{icon:'🌳',title:'山毛榉树篱',desc:'两排山毛榉树组成的隧道'},{icon:'🎬',title:'权力的游戏',desc:'国王大道的取景地'},{icon:'📸',title:'最佳拍摄',desc:'道路一端拍摄树篱隧道全景'}],
   ['树篱','权力的游戏','北爱尔兰','爱尔兰']],
  ['belfast-titanic','贝尔法斯特泰坦尼克区','Belfast Titanic Quarter','爱尔兰','Ireland','北爱尔兰','Northern Ireland','泰坦尼克号的诞生地','🚢 泰坦尼克区 | 海事博物馆 | 贝尔法斯特地标',
   '贝尔法斯特泰坦尼克区是泰坦尼克号建造的地方，现在是一个现代化的文化区。泰坦尼克号博物馆是全世界最受欢迎的博物馆之一，讲述了泰坦尼克号的完整故事。\n\n拍摄建议：从博物馆前拍摄泰坦尼克区全景是最经典的角度。日落时分的金色光线照射在博物馆上格外壮观。从港口拍摄博物馆与城市天际线的组合全景也很壮观。',
   'Belfast Titanic Quarter is where the Titanic was built, now a modern cultural district. The Titanic Museum is one of the world\'s most popular museums.',
   [{icon:'🚢',title:'泰坦尼克区',desc:'泰坦尼克号建造的地方'},{icon:'🏛️',title:'海事博物馆',desc:'全世界最受欢迎的博物馆之一'},{icon:'📸',title:'最佳拍摄',desc:'博物馆前拍摄泰坦尼克区全景'}],
   ['泰坦尼克','博物馆','贝尔法斯特','爱尔兰']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 372
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
  console.log(`\n共插入 ${items.length} 个爱尔兰景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
