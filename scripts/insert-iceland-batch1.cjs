const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['hallgrimskirkja','哈尔格林姆斯教堂','Hallgrimskirkja','冰岛','Iceland','雷克雅未克','Reykjavik','雷克雅未克天际线的守护者','⛪ 74米教堂 | 火箭造型 | 城市地标',
   '哈尔格林姆斯教堂是冰岛最大的教堂，高74米，造型如同一枚即将升空的火箭。教堂位于雷克雅未克市中心的小山丘上，是城市天际线最标志性的元素。登上塔顶可以360度俯瞰整个城市和远处的雪山。\n\n拍摄建议：从教堂前的广场拍摄教堂与城市天际线的组合全景是最经典的角度。日落时分教堂在金色光线中格外壮观。从塔顶拍摄城市全景也很值得。',
   'Hallgrimskirkja is Iceland\'s largest church at 74 meters tall, shaped like a rocket ready for launch. Located on a hill in downtown Reykjavik, it offers 360-degree views from the tower.',
   [{icon:'⛪',title:'74米教堂',desc:'冰岛最大教堂建筑'},{icon:'🚀',title:'火箭造型',desc:'独特的现代建筑风格'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄教堂城市全景'}],
   ['教堂','雷克雅未克','地标','冰岛']],
  ['blue-lagoon','蓝湖温泉','Blue Lagoon','冰岛','Iceland','雷克雅未克','Reykjavik','冰火之国的蓝色温泉','♨️ 地热温泉 | 蓝色湖水 | 冰岛名片',
   '蓝湖温泉是冰岛最著名的地热温泉，乳蓝色的热水来自地下2000米的熔岩层。温泉水温保持在37-40度，富含硅土和矿物质，对皮肤有极好的疗养效果。周围的黑色熔岩地貌与蓝色湖水形成了全世界最梦幻的温泉景观。\n\n拍摄建议：从温泉中拍摄乳蓝色湖水与黑色熔岩的对比全景是最经典的角度。清晨或傍晚游客较少时拍摄效果最佳。冬季的蒸汽和极光为温泉增添了神秘感。',
   'The Blue Lagoon is Iceland\'s most famous geothermal spa, with milky blue water from 2,000 meters below. The water stays at 37-40°C, rich in silica and minerals for skin care.',
   [{icon:'♨️',title:'地热温泉',desc:'乳蓝色温泉水疗养'},{icon:'🌋',title:'熔岩地貌',desc:'黑色熔岩蓝色湖水'},{icon:'📸',title:'最佳拍摄',desc:'温泉中拍摄蓝色全景'}],
   ['温泉','地热','蓝湖','冰岛']],
  ['gullfoss','黄金瀑布','Gullfoss','冰岛','Iceland','黄金圈','Golden Circle','冰岛最壮观的双层瀑布','🌊 双层瀑布 | 32米落差 | 黄金圈地标',
   '黄金瀑布是冰岛最壮观的瀑布，也是黄金圈三大景点之一。瀑布分为两层，总落差32米，巨大的水量从峡谷中倾泻而下，溅起的水雾在阳光下经常形成彩虹。冬季的瀑布被冰柱环绕，如同进入了水晶宫殿。\n\n拍摄建议：从瀑布上方的观景台拍摄两层瀑布全景是最经典的角度。晴天水雾中的彩虹是最美的瞬间。冬季的冰柱环绕瀑布画面也很壮观。',
   'Gullfoss is Iceland\'s most spectacular waterfall and one of the Golden Circle\'s three main attractions. The two-tiered waterfall drops 32 meters with massive water volume.',
   [{icon:'🌊',title:'双层瀑布',desc:'32米落差壮观瀑布'},{icon:'🌈',title:'水雾彩虹',desc:'阳光下水雾形成彩虹'},{icon:'📸',title:'最佳拍摄',desc:'观景台拍摄瀑布全景'}],
   ['瀑布','黄金圈','冰岛','冬季']],
  ['reynisfjara','雷尼斯黑沙滩','Reynisfjara Black Sand Beach','冰岛','Iceland','南部','South Coast','玄武柱与黑沙滩的交响','🏖️ 黑色沙滩 | 玄武柱 | 冰岛奇景',
   '雷尼斯黑沙滩是全世界最独特的海滩之一，黑色的火山沙与巨大的玄武岩石柱形成了超现实的景观。海滩上的玄武柱如同管风琴的管道，整齐排列。远处的雷尼斯岩（Reynisdrangar）是三座矗立在海中的玄武岩柱，传说是被石化的巨魔。\n\n拍摄建议：从海滩上拍摄玄武柱与黑色海浪的对比全景是最经典的角度。远处的雷尼斯岩是很好的背景元素。冬季的巨浪拍打玄武柱的画面最为壮观。',
   'Reynisfjara is one of the world\'s most unique beaches, with black volcanic sand and massive basalt columns creating a surreal landscape. The basalt columns stand like organ pipes.',
   [{icon:'🏖️',title:'黑色沙滩',desc:'火山沙与玄武岩柱'},{icon:'🪨',title:'玄武柱',desc:'如同管风琴的管道'},{icon:'📸',title:'最佳拍摄',desc:'海滩拍摄玄武柱海浪'}],
   ['黑沙滩','玄武柱','冰岛','海滩']],
  ['jokulsarlon','杰古沙龙冰河湖','Jokulsarlon Glacier Lagoon','冰岛','Iceland','东南部','Southeast','漂浮冰块的蓝色湖泊','🧊 冰河湖 | 漂浮冰块 | 冰岛明珠',
   '杰古沙龙冰河湖是冰岛最梦幻的自然景观，巨大的蓝色冰块从冰川断裂后漂浮在湖面上，如同进入了一个水晶世界。冰块呈现出各种蓝色色调，从浅蓝到深蓝，每一块都是独一无二的自然雕塑。\n\n拍摄建议：从湖岸拍摄漂浮冰块与冰川的全景是最经典的角度。日落时分的金色光线照射在蓝色冰块上格外壮观。附近的钻石沙滩上被海浪冲上来的冰块也是绝佳的拍摄对象。',
   'Jokulsarlon Glacier Lagoon is Iceland\'s most dreamlike natural wonder, with massive blue icebergs floating on the water after breaking off from the glacier.',
   [{icon:'🧊',title:'冰河湖',desc:'巨大蓝色冰块漂浮'},{icon:'💎',title:'钻石沙滩',desc:'海浪冲上黑色沙滩冰块'},{icon:'📸',title:'最佳拍摄',desc:'湖岸拍摄冰块冰川全景'}],
   ['冰川','冰块','冰岛','湖泊']],
  ['thingvellir','辛格韦德利','Thingvellir','冰岛','Iceland','黄金圈','Golden Circle','两大板块裂缝中的国家公园','🏔️ 板块裂缝 | 世界遗产 | 黄金圈',
   '辛格韦德利是冰岛唯一的世界遗产，也是黄金圈三大景点之一。这里是北美板块和欧亚板块的分界线，两大板块每年以2厘米的速度分离。冰岛最早的议会于公元930年在这里成立。\n\n拍摄建议：从裂缝边缘拍摄两侧悬崖和清澈水面的全景是最经典的角度。可以清晰看到两大板块分离的痕迹。秋季的金色树叶映衬在蓝色水面上格外壮观。',
   'Thingvellir is Iceland\'s only UNESCO World Heritage Site and one of the Golden Circle\'s three main attractions. It sits on the boundary between the North American and Eurasian tectonic plates.',
   [{icon:'🏔️',title:'板块裂缝',desc:'北美与欧亚板块分界'},{icon:'🏆',title:'世界遗产',desc:'冰岛唯一世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'裂缝边缘拍摄悬崖水面'}],
   ['板块','世界遗产','黄金圈','冰岛']],
  ['geysir','间歇泉','Geysir','冰岛','Iceland','黄金圈','Golden Circle','每隔几分钟喷发的地热奇观','♨️ 间歇泉 | 地热喷发 | 黄金圈',
   '间歇泉是黄金圈三大景点之一，这里的Strokkur间歇泉每隔5-10分钟就会喷发一次，水柱高达30米。周围的地热区弥漫着蒸汽和硫磺味，彩色的热泉池如同外星景观。这里是全世界"间歇泉"一词的来源。\n\n拍摄建议：等待间歇泉喷发的瞬间拍摄水柱全景是最经典的体验。需要快速快门捕捉水柱的细节。周围彩色热泉池的蒸汽画面也很梦幻。',
   'Geysir is one of the Golden Circle\'s three main attractions, where Strokkur geyser erupts every 5-10 minutes, shooting water up to 30 meters high.',
   [{icon:'♨️',title:'间歇泉',desc:'5-10分钟喷发一次'},{icon:'💨',title:'地热区',desc:'蒸汽硫磺彩色热泉'},{icon:'📸',title:'最佳拍摄',desc:'捕捉喷发瞬间水柱'}],
   ['间歇泉','地热','黄金圈','冰岛']],
  ['seljalandsfoss','塞里雅兰瀑布','Seljalandsfoss','冰岛','Iceland','南部','South Coast','可以走到瀑布背后的瀑布','🌊 60米瀑布 | 可穿行 | 彩虹瀑布',
   '塞里雅兰瀑布是冰岛最独特的瀑布，高60米，游客可以沿着小路走到瀑布背后，从内部欣赏水流倾泻而下的壮观画面。瀑布前的水潭在阳光下经常形成彩虹，因此被称为"彩虹瀑布"。\n\n拍摄建议：从瀑布前方拍摄水流与彩虹的全景是最经典的角度。走到瀑布背后拍摄水帘洞般的画面也很震撼。日落时分的金色光线照射在水雾上格外梦幻。',
   'Seljalandsfoss is Iceland\'s most unique waterfall at 60 meters tall, where visitors can walk behind the waterfall and admire the water curtain from inside.',
   [{icon:'🌊',title:'60米瀑布',desc:'冰岛最独特瀑布'},{icon:'🌈',title:'彩虹瀑布',desc:'水潭阳光形成彩虹'},{icon:'📸',title:'最佳拍摄',desc:'瀑布前方拍摄水流彩虹'}],
   ['瀑布','彩虹','冰岛','南部']],
  ['skogafoss','斯科加瀑布','Skogafoss','冰岛','Iceland','南部','South Coast','冰岛最完美的矩形瀑布','🌊 60米瀑布 | 矩形水帘 | 冰岛经典',
   '斯科加瀑布是冰岛最经典的瀑布之一，高60米、宽25米，水流如同一面完美的矩形水帘从悬崖上倾泻而下。瀑布两侧是绿色的山谷，远处的冰川为瀑布提供了壮丽的背景。瀑布下方经常形成双彩虹。\n\n拍摄建议：从瀑布下方拍摄矩形水帘全景是最经典的角度。爬上瀑布旁边的阶梯从顶部拍摄也很壮观。晴天的双彩虹是最美的瞬间。',
   'Skogafoss is one of Iceland\'s most classic waterfalls, 60 meters tall and 25 meters wide, with water falling like a perfect rectangular curtain from the cliff.',
   [{icon:'🌊',title:'60米瀑布',desc:'完美矩形水帘瀑布'},{icon:'🌈',title:'双彩虹',desc:'瀑布下方经常双彩虹'},{icon:'📸',title:'最佳拍摄',desc:'下方拍摄矩形水帘全景'}],
   ['瀑布','冰岛','南部','经典']],
  ['vik-i-mydal','维克小镇','Vik i Myrdal','冰岛','Iceland','南部','South Coast','黑沙滩旁的温馨小镇','🏘️ 黑沙滩 | 红色屋顶 | 南部小镇',
   '维克小镇是冰岛南部最迷人的小镇，坐落在著名的雷尼斯黑沙滩旁。小镇的红色屋顶房屋与黑色的沙滩和远处的玄武岩柱形成了鲜明的对比。小镇虽小，却是探索南部海岸的绝佳基地。\n\n拍摄建议：从小镇高处拍摄红色屋顶与黑色沙滩的对比全景是最经典的角度。远处的雷尼斯岩是很好的背景元素。冬季的雪景为小镇增添了温馨感。',
   'Vik is Iceland\'s most charming southern town, situated next to the famous Reynisfjara Black Sand Beach. The red-roofed houses contrast with the black sand and basalt columns.',
   [{icon:'🏘️',title:'黑沙滩',desc:'红色屋顶黑色沙滩'},{icon:'🏔️',title:'南部基地',desc:'探索南部海岸绝佳基地'},{icon:'📸',title:'最佳拍摄',desc:'高处拍摄红顶黑沙滩'}],
   ['小镇','黑沙滩','冰岛','南部']],
  ['akureyri','阿库雷里','Akureyri','冰岛','Iceland','北部','North','冰岛北部的首都','🏘️ 北部首都 | 心形红绿灯 | 北极光',
   '阿库雷里是冰岛第二大城市，被称为"北部首都"。小镇最著名的特色是市中心的心形红绿灯，是全冰岛最可爱的地标。冬季这里是观赏北极光的绝佳地点，夏季则可以体验午夜太阳。\n\n拍摄建议：从港口拍摄小镇与远处雪山的全景是最经典的角度。心形红绿灯是必拍的可爱地标。冬季极光映照在小镇上的画面也很壮观。',
   'Akureyri is Iceland\'s second largest city, known as the "Capital of the North." Famous for its heart-shaped traffic lights, it\'s a great base for Northern Lights viewing.',
   [{icon:'🏘️',title:'北部首都',desc:'冰岛第二大城市'},{icon:'❤️',title:'心形红绿灯',desc:'全冰岛最可爱地标'},{icon:'📸',title:'最佳拍摄',desc:'港口拍摄小镇雪山全景'}],
   ['小镇','北部','北极光','冰岛']],
  ['snæfellsjokull','斯奈山冰川','Snaefellsjokull','冰岛','Iceland','西部','West','儒勒·凡尔纳的地心入口','🏔️ 冰川火山 | 地心游记 | 斯奈山半岛',
   '斯奈山冰川是冰岛最著名的火山之一，海拔1446米，儒勒·凡尔纳的经典小说《地心游记》中，主角就是从这里进入地心的。冰川覆盖着火山口，夏季的融水形成多条瀑布。周围的斯奈山半岛被称为"冰岛缩影"。\n\n拍摄建议：从远处拍摄冰川火山的全景是最经典的角度。夏季的冰川融水瀑布是很好的前景元素。日落时分的金色光线照射在冰川上格外壮观。',
   'Snaefellsjokull is Iceland\'s most famous volcano at 1,446 meters. In Jules Verne\'s "Journey to the Center of the Earth," the protagonists enter the earth from here.',
   [{icon:'🏔️',title:'冰川火山',desc:'1446米冰川覆盖火山'},{icon:'📖',title:'地心游记',desc:'儒勒·凡尔纳经典小说'},{icon:'📸',title:'最佳拍摄',desc:'远处拍摄冰川火山全景'}],
   ['冰川','火山','斯奈山','冰岛']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 278
  for (const [slug,name,nameEn,country,countryEn,loc,locEn,tagline,hlStr,desc,descEn,hlArr,tags] of items) {
    if (['hallgrimskirkja','blue-lagoon','gullfoss','reynisfjara','jokulsarlon','skogafoss'].includes(slug)) { console.log(`⊘ ${name} (${slug}) 已存在，跳过`); so++; continue }
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
  console.log(`\n共插入 ${items.length} 个冰岛景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
