const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['preikestolen','布道石','Preikestolen','挪威','Norway','罗加兰','Rogaland','604米悬崖上的天然讲台','🏔️ 604米悬崖 | 方形平台 | 挪威地标',
   '布道石是挪威最著名的自然景观，一块25x25米的天然方形平台悬在吕瑟峡湾604米上方。从斯塔万格出发徒步约4小时可到达。站在悬崖边缘俯瞰深蓝色的峡湾，是全世界最震撼的自然体验之一。\n\n拍摄建议：从平台边缘俯拍峡湾全景是最经典的角度。需要无人机或特殊设备才能从下方拍摄完整画面。日落时分的金色光线照射在峡湾水面上格外壮观。',
   'Preikestolen is Norway\'s most iconic natural landmark, a 25x25m natural platform hanging 604 meters above the Lysefjord. The 4-hour hike from Stavanger leads to one of the world\'s most breathtaking views.',
   [{icon:'🏔️',title:'604米悬崖',desc:'天然方形平台悬于峡湾'},{icon:'🥾',title:'经典徒步',desc:'4小时到达世界奇观'},{icon:'📸',title:'最佳拍摄',desc:'平台边缘俯拍峡湾全景'}],
   ['悬崖','峡湾','徒步','挪威']],
  ['kjeragbolten','奇迹石','Kjeragbolten','挪威','Norway','罗加兰','Rogaland','嵌在悬崖间的巨石奇观','🏔️ 嵌在悬崖间 | 1000米高空 | 勇气之石',
   '奇迹石是一块被卡在两座悬崖之间的巨石，悬在吕瑟峡湾1000米高空。站在巨石上拍照是全世界最刺激的体验之一。从Øygarden出发徒步约5-7小时可到达。巨石直径约5米，重约5吨。\n\n拍摄建议：站在巨石上拍摄峡湾全景是最经典的角度。需要克服恐惧才能站稳拍照。从远处拍摄巨石嵌在悬崖间的画面也很壮观。',
   'Kjeragbolten is a boulder wedged between two cliffs, hanging 1,000 meters above the Lysefjord. Standing on this rock is one of the world\'s most thrilling experiences.',
   [{icon:'🏔️',title:'千m高空',desc:'嵌在悬崖间的巨石'},{icon:'🪨',title:'勇气之石',desc:'5吨巨石卡在悬崖间'},{icon:'📸',title:'最佳拍摄',desc:'站在巨石上拍峡湾'}],
   ['巨石','峡湾','极限','挪威']],
  ['oslo-opera-house','奥斯陆歌剧院','Oslo Opera House','挪威','Norway','奥斯陆','Oslo','峡湾畔的白色大理石地标','🏛️ 大理石斜坡 | 可步行屋顶 | 峡湾建筑',
   '奥斯陆歌剧院是挪威最具标志性的现代建筑，白色大理石斜坡如同从峡湾中升起的冰川。游客可以步行走上屋顶，360度俯瞰奥斯陆峡湾和城市天际线。内部的金箔墙壁和橡木装饰同样令人印象深刻。\n\n拍摄建议：从峡湾水面拍摄歌剧院斜坡与城市天际线的组合全景是最经典的角度。日落时分大理石在金色光线中格外迷人。走上屋顶拍摄城市全景也很值得。',
   'Oslo Opera House is Norway\'s most iconic modern building, with white marble slopes rising like a glacier from the fjord. Visitors can walk on the roof for 360-degree views.',
   [{icon:'🏛️',title:'现代地标',desc:'白色大理石斜坡建筑'},{icon:'🚶',title:'可步行屋顶',desc:'走上屋顶360度全景'},{icon:'📸',title:'最佳拍摄',desc:'水面拍摄建筑城市全景'}],
   ['建筑','现代','奥斯陆','峡湾']],
  ['oslo-vigeland','维格兰雕塑公园','Vigeland Sculpture Park','挪威','Norway','奥斯陆','Oslo','人体雕塑的永恒画廊','🗿 212座雕塑 | 人生轮回 | 世界最大雕塑公园',
   '维格兰雕塑公园拥有212座青铜和花岗岩人体雕塑，展现了人类从出生到死亡的完整生命轮回。古斯塔夫·维格兰用40年完成了这些作品。标志性的"愤怒男孩"和"生命之柱"是公园的灵魂。\n\n拍摄建议：从生命之柱拍摄喷泉到博物馆的中轴线全景是最经典的角度。"愤怒男孩"和"生命之柱"是最核心的取景元素。夏季的绿草和喷泉为雕塑增添了生机。',
   'Vigeland Sculpture Park features 212 bronze and granite sculptures depicting the complete cycle of human life. Gustav Vigeland spent 40 years creating these works.',
   [{icon:'🗿',title:'212座雕塑',desc:'人体雕塑展现生命轮回'},{icon:'🏛️',title:'生命之柱',desc:'公园最核心雕塑作品'},{icon:'📸',title:'最佳拍摄',desc:'中轴线喷泉全景角度'}],
   ['雕塑','公园','奥斯陆','艺术']],
  ['bergen-bryggen','卑尔根布吕根','Bergen Bryggen','挪威','Norway','霍达兰','Hordaland','汉萨同盟的彩色码头','🏘️ 彩色木屋 | 世界遗产 | 汉萨码头',
   '布吕根是卑尔根最标志性的景观，一排色彩斑斓的汉萨同盟时代木屋沿着码头排列。这些建于14世纪的建筑是卑尔根作为汉萨同盟贸易站的见证。2001年被列为世界遗产。背后的弗洛伊恩山为码头提供了壮丽的背景。\n\n拍摄建议：从码头拍摄彩色木屋排列的全景是最经典的角度。乘坐游船从水面角度拍摄也很壮观。清晨游客稀少时拍摄效果最佳。',
   'Bryggen is Bergen\'s most iconic sight, with colorful Hanseatic wooden houses lining the waterfront. Built in the 14th century, they testify to Bergen\'s role as a Hanseatic trading post.',
   [{icon:'🏘️',title:'彩色木屋',desc:'汉萨同盟时代码头建筑'},{icon:'🏆',title:'世界遗产',desc:'14世纪贸易站见证'},{icon:'📸',title:'最佳拍摄',desc:'码头拍摄彩色木屋全景'}],
   ['码头','世界遗产','汉萨','卑尔根']],
  ['flom-railway','弗洛姆铁路','Flåm Railway','挪威','Norway','松恩','Sogn','世界最美铁路之旅','🚂 悬崖铁路 | 瀑布峡谷 | 世界最美',
   '弗洛姆铁路是全世界最壮观的铁路之一，从高山上的米达尔下降到峡湾边的弗洛姆，全程20公里穿越壮丽的峡谷、瀑布和高山牧场。沿途经过20条隧道和多座桥梁，最大坡度达5.5%。\n\n拍摄建议：从车厢内拍摄峡谷和瀑布的全景是最经典的体验。在Kjosfossen瀑布处火车会停车让游客拍摄。秋季金黄色树叶映衬下的峡谷最为壮观。',
   'The Flåm Railway is one of the world\'s most spectacular train journeys, descending 20km from Myrdal to Flåm through dramatic gorges, waterfalls, and mountain farms.',
   [{icon:'🚂',title:'悬崖铁路',desc:'全世界最壮观铁路之一'},{icon:'🌊',title:'瀑布峡谷',desc:'穿越峡谷瀑布高山'},{icon:'📸',title:'最佳拍摄',desc:'车厢内拍摄峡谷瀑布'}],
   ['铁路','峡谷','瀑布','松恩']],
  ['nazaré-fjord','纳柔依峡湾','Nærøyfjord','挪威','Norway','松恩','Sogn','峡湾之王的世界遗产','🏔️ 世界最窄峡湾 | 250米宽 | 世界遗产',
   '纳柔依峡湾是全世界最窄的峡湾，最窄处仅250米，两侧悬崖高达1000米。乘坐游船穿行其中，千米高的瀑布从悬崖上直泻而下，如同驶入另一个世界。2005年被列为世界遗产。\n\n拍摄建议：从游船上拍摄两侧千米悬崖和瀑布的全景是最震撼的角度。清晨的薄雾笼罩峡湾时如同仙境。秋季的金色光线照射在悬崖上格外壮观。',
   'Nærøyfjord is the world\'s narrowest fjord, only 250 meters wide at its tightest point, with cliffs rising 1,000 meters on both sides. Cruise ships pass through thousand-meter waterfalls.',
   [{icon:'🏔️',title:'世界最窄',desc:'250米宽千米高悬崖'},{icon:'🏆',title:'世界遗产',desc:'最壮观峡湾景观'},{icon:'📸',title:'最佳拍摄',desc:'游船拍摄悬崖瀑布全景'}],
   ['峡湾','世界遗产','瀑布','松恩']],
  ['sognefjord','松恩峡湾','Sognefjord','挪威','Norway','松恩','Sogn','挪威最长最深的峡湾','🏔️ 204公里 | 1308米深 | 峡湾之王',
   '松恩峡湾是挪威最长、世界第二长的峡湾，全长204公里，最深处达1308米。从峡湾口一直延伸到内陆的雪山脚下，沿途经过无数分支峡湾、瀑布和悬崖小镇。\n\n拍摄建议：从峡湾水面拍摄两侧悬崖和雪山的全景是最经典的角度。从高处俯瞰峡湾蜿蜒的全貌也很壮观。乘坐游船在峡湾中漫游是最佳体验方式。',
   'Sognefjord is Norway\'s longest and the world\'s second longest fjord, stretching 204km with a maximum depth of 1,308 meters. It extends from the coast deep into the mountains.',
   [{icon:'🏔️',title:'峡湾之王',desc:'204公里最长峡湾'},{icon:'🌊',title:'1308米深',desc:'世界第二长峡湾'},{icon:'📸',title:'最佳拍摄',desc:'水面拍摄悬崖雪山全景'}],
   ['峡湾','挪威','最长','雪山']],
  ['hardangerfjord','哈当厄尔峡湾','Hardangerfjord','挪威','Norway','霍达兰','Hordaland','春季花海中的峡湾','🏔️ 179公里 | 春季花海 | 果园峡湾',
   '哈当厄尔峡湾是挪威第二长峡湾，全长179公里。春季峡湾两岸的果园和花园被百万株果树的花海覆盖，粉色和白色的花朵与深蓝色峡湾构成了全世界最浪漫的春日画面。\n\n拍摄建议：从峡湾水面拍摄花海和悬崖的全景是最经典的角度。5月中旬果树花开时最为壮观。从高处俯瞰峡湾与花海的组合也很迷人。',
   'Hardangerfjord is Norway\'s second longest fjord at 179km. In spring, the shores are covered with millions of fruit trees in bloom, creating the world\'s most romantic spring scene.',
   [{icon:'🏔️',title:'179公里',desc:'挪威第二长峡湾'},{icon:'🌸',title:'春季花海',desc:'百万果树花开映峡湾'},{icon:'📸',title:'最佳拍摄',desc:'水面拍摄花海悬崖全景'}],
   ['峡湾','花海','春季','果园']],
  ['tromsø-aurora','特罗姆瑟极光','Tromsø Northern Lights','挪威','Norway','特罗姆斯','Troms','北极光下的北极之城','🌌 北极光 | 极夜 | 北极之门',
   '特罗姆瑟是观赏北极光的最佳城市之一，位于北纬69度的北极圈内。每年9月至3月的极夜期间，绿色和紫色的极光在天空中舞动，映照着雪山和峡湾。被称为"北极之门"的特罗姆瑟还拥有北极大教堂和极地博物馆。\n\n拍摄建议：从城市外围的暗处拍摄极光与雪山峡湾的组合是最经典的角度。需要三脚架进行长曝光。极光最活跃的时段通常在深夜11点至凌晨2点。',
   'Tromsø is one of the best cities for viewing the Northern Lights, located at 69°N within the Arctic Circle. From September to March, green and purple auroras dance across the sky.',
   [{icon:'🌌',title:'北极光',desc:'绿色紫色极光舞动天空'},{icon:'🏔️',title:'北极之门',desc:'北纬69度最佳观赏地'},{icon:'📸',title:'最佳拍摄',desc:'长曝光极光雪山峡湾'}],
   ['极光','北极','特罗姆瑟','冬季']],
  ['north-cape','北角','North Cape','挪威','Norway','芬马克','Finnmark','欧洲大陆最北端的悬崖','🏔️ 307米悬崖 | 欧洲最北 | 午夜太阳',
   '北角是欧洲大陆最北端，海拔307米的悬崖直插北冰洋。夏季的午夜太阳和冬季的极夜是这里最壮观的自然现象。站在悬崖边缘，脚下是710米深的北冰洋，头顶是永不落下的太阳或舞动的极光。\n\n拍摄建议：从悬崖边缘拍摄北冰洋全景是最经典的角度。午夜太阳在海平线上悬浮的画面最为壮观。冬季极光映照在悬崖上的画面也很震撼。',
   'North Cape is the northernmost point of mainland Europe, a 307-meter cliff plunging into the Arctic Ocean. The midnight sun and polar nights are the most spectacular natural phenomena here.',
   [{icon:'🏔️',title:'欧洲最北',desc:'307米悬崖直入北冰洋'},{icon:'☀️',title:'午夜太阳',desc:'夏季太阳永不落下'},{icon:'📸',title:'最佳拍摄',desc:'悬崖边缘北冰洋全景'}],
   ['北角','悬崖','午夜太阳','北极']],
  ['svalbard-glacier','斯瓦尔巴冰川','Svalbard Glacier','挪威','Norway','斯瓦尔巴','Svalbard','北极圈内的冰川世界','🧊 北极冰川 | 北极熊 | 极昼极夜',
   '斯瓦尔巴群岛位于北纬74-81度之间，是全世界最北的永久居住地之一。巨大的冰川覆盖着群岛的大部分地区，北极熊的数量甚至超过人类。乘坐游船穿越冰川峡湾，可以看到壮观的冰川断裂面和漂浮的冰山。\n\n拍摄建议：从游船上拍摄冰川断裂面的蓝色全景是最经典的角度。漂浮在峡湾中的冰山是很好的前景元素。极昼期间的柔和光线最适合拍摄冰川的蓝色质感。',
   'Svalbard archipelago lies between 74-81°N, one of the world\'s northernmost permanent settlements. Massive glaciers cover most of the islands, with more polar bears than people.',
   [{icon:'🧊',title:'北极冰川',desc:'北纬74-81度冰川世界'},{icon:'🐻',title:'北极熊',desc:'数量超过人类居民'},{icon:'📸',title:'最佳拍摄',desc:'游船拍摄冰川蓝色全景'}],
   ['冰川','北极','斯瓦尔巴','极昼']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 266
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
  console.log(`\n共插入 ${items.length} 个挪威景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
