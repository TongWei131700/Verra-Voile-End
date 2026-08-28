const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['grand-place-brussels','布鲁塞尔大广场','Grand Place Brussels','比利时','Belgium','布鲁塞尔','Brussels','欧洲最华丽的中世纪广场','🏛️ 世界遗产 | 中世纪广场 | 布鲁塞尔心脏',
   '布鲁塞尔大广场是欧洲最华丽的中世纪广场之一，被联合国教科文组织列为世界遗产。广场四周环绕着哥特式的市政厅和行会建筑，每两年一次的鲜花地毯节让广场变成一片花海。\n\n拍摄建议：从广场中央拍摄市政厅和行会建筑的全景是最经典的角度。夜晚的灯光秀将建筑立面变成动态画布。清晨游客稀少时拍摄效果最佳。',
   'The Grand Place in Brussels is one of Europe\'s most magnificent medieval squares, a UNESCO World Heritage Site. Surrounded by Gothic guildhalls and the Town Hall.',
   [{icon:'🏛️',title:'世界遗产',desc:'欧洲最华丽中世纪广场'},{icon:'🌸',title:'鲜花地毯',desc:'每两年一次鲜花地毯节'},{icon:'📸',title:'最佳拍摄',desc:'广场中央拍摄建筑全景'}],
   ['广场','世界遗产','布鲁塞尔','比利时']],
  ['atomium','原子球塔','Atomium','比利时','Belgium','布鲁塞尔','Brussels','1650亿倍的原子结构','🏗️ 原子结构 | 1650亿倍 | 布鲁塞尔地标',
   '原子球塔是布鲁塞尔最具标志性的建筑，造型是一个铁原子晶体结构被放大1650亿倍。建筑高102米，由9个巨大的金属球体组成。1958年世博会时为纪念原子能时代而建。\n\n拍摄建议：从广场拍摄原子球塔的完整侧面全景是最经典的角度。日落时分的金色光线照射在金属球体上格外壮观。从球体内部拍摄布鲁塞尔全景也很值得。',
   'The Atomium is Brussels\' most iconic building, shaped like an iron crystal structure magnified 165 billion times. It stands 102 meters tall with 9 giant metal spheres.',
   [{icon:'🏗️',title:'原子结构',desc:'铁原子晶体放大1650亿倍'},{icon:'🏛️',title:'102米',desc:'9个巨大金属球体组成'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄原子球塔全景'}],
   ['建筑','原子','布鲁塞尔','比利时']],
  ['manneken-pis','小于廉','Manneken Pis','比利时','Belgium','布鲁塞尔','Brussels','布鲁塞尔最著名的撒尿小孩','🗿 撒尿小孩 | 布鲁塞尔象征 | 世界著名',
   '小于廉是布鲁塞尔最著名的地标，一个正在撒尿的小男孩铜像。这座高55厘米的铜像建于1619年，是布鲁塞尔最受欢迎的拍照对象。铜像拥有超过1000套服装，是世界上拥有最多服装的雕像。\n\n拍摄建议：从正面拍摄小于廉铜像的全景是最经典的角度。铜像周围的热闹街道是很好的背景元素。不同节日的服装变换也是很好的拍摄题材。',
   'Manneken Pis is Brussels\' most famous landmark, a 55cm bronze statue of a little boy urinating. Built in 1619, it has over 1,000 costumes.',
   [{icon:'🗿',title:'撒尿小孩',desc:'布鲁塞尔最著名地标'},{icon:'👕',title:'1000套服装',desc:'世界最多服装的雕像'},{icon:'📸',title:'最佳拍摄',desc:'正面拍摄铜像全景'}],
   ['铜像','布鲁塞尔','象征','比利时']],
  ['bruges-canals','布鲁日运河','Bruges Canals','比利时','Belgium','布鲁日','Bruges','北方威尼斯的水上童话','🏘️ 运河 | 中世纪建筑 | 北方威尼斯',
   '布鲁日运河是比利时最浪漫的景观之一，被称为"北方威尼斯"。运河两岸排列着中世纪的行会建筑和教堂塔楼，乘坐游船穿行其中如同穿越回中世纪。运河上的石桥是拍摄全景的最佳位置。\n\n拍摄建议：从运河上的石桥拍摄两岸中世纪建筑的全景是最经典的角度。乘坐游船从水面角度拍摄也很壮观。秋季的金色树叶映衬在运河上格外迷人。',
   'The Bruges canals are one of Belgium\'s most romantic sights, known as the "Venice of the North." Medieval guildhalls and church towers line both banks.',
   [{icon:'🏘️',title:'运河',desc:'比利时最浪漫景观之一'},{icon:'🏛️',title:'中世纪建筑',desc:'行会建筑教堂塔楼'},{icon:'📸',title:'最佳拍摄',desc:'石桥拍摄两岸建筑全景'}],
   ['运河','中世纪','布鲁日','比利时']],
  ['bruges-belfry','布鲁日钟楼','Bruges Belfry','比利时','Belgium','布鲁日','Bruges','83米高的中世纪钟楼','🏛️ 83米钟楼 | 366级阶梯 | 中世纪地标',
   '布鲁日钟楼是比利时最著名的中世纪钟楼之一，高83米，共有366级阶梯。登上钟楼顶部可以360度俯瞰布鲁日全城和运河。钟楼上装有47个钟的钟琴，每15分钟演奏一次。\n\n拍摄建议：从广场拍摄钟楼的完整侧面全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从钟楼顶部拍摄城市全景也很值得。',
   'The Bruges Belfry is one of Belgium\'s most famous medieval bell towers at 83 meters tall with 366 steps. The top offers 360-degree views of the city and canals.',
   [{icon:'🏛️',title:'83米钟楼',desc:'比利时最著名中世纪钟楼'},{icon:'🎵',title:'47个钟',desc:'每15分钟演奏一次'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄钟楼全景'}],
   ['钟楼','中世纪','布鲁日','比利时']],
  ['ghent-graslei','根特谷物街','Ghent Graslei','比利时','Belgium','根特','Ghent','中世纪行会建筑的完美画面','🏘️ 行会建筑 | 中世纪码头 | 根特地标',
   '根特谷物街是比利时最上镜的街道之一，中世纪行会建筑沿着利斯河排列。这些建于12-17世纪的建筑曾是谷物贸易的中心，现在成为了根特最受欢迎的拍照地点。河对港的景色同样迷人。\n\n拍摄建议：从河对岸拍摄行会建筑的全景是最经典的角度。日落时分的金色光线照射在建筑上格外壮观。乘坐游船从水面角度拍摄也很壮观。',
   'Ghent Graslei is one of Belgium\'s most photogenic streets, with medieval guildhalls lining the Leie River. Built between the 12th-17th centuries, they were the center of grain trade.',
   [{icon:'🏘️',title:'行会建筑',desc:'比利时最上镜街道之一'},{icon:'🏛️',title:'中世纪码头',desc:'12-17世纪谷物贸易中心'},{icon:'📸',title:'最佳拍摄',desc:'河对岸拍摄建筑全景'}],
   ['行会','中世纪','根特','比利时']],
  ['antwerp-cathedral','安特卫普大教堂','Antwerp Cathedral','比利时','Belgium','安特卫普','Antwerp','哥特式建筑的巅峰之作','⛪ 123米哥特 | 鲁本斯画作 | 世界遗产',
   '安特卫普大教堂是比利时最大的哥特式教堂，高123米的尖塔是城市天际线的标志。教堂内收藏着鲁本斯的4幅杰作，包括《上十字架》和《下十字架》。1999年被列为世界遗产。\n\n拍摄建议：从教堂前的广场拍摄双塔全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从远处拍摄教堂与城市天际线的组合全景也很壮观。',
   'Antwerp Cathedral is Belgium\'s largest Gothic church, with a 123-meter spire as the city\'s skyline icon. Houses 4 masterpieces by Rubens.',
   [{icon:'⛪',title:'123米哥特',desc:'比利时最大哥特式教堂'},{icon:'🎨',title:'鲁本斯画作',desc:'教堂内收藏4幅鲁本斯杰作'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄双塔全景'}],
   ['教堂','哥特','安特卫普','比利时']],
  ['waterloo-lion-mound','滑铁卢雄狮丘','Waterloo Lion Mound','比利时','Belgium','瓦隆','Wallonia','拿破仑战败的纪念地标','🦁 雄狮丘 | 拿破仑战败 | 历史地标',
   '滑铁卢雄狮丘是纪念1815年滑铁卢战役的地标，高41米的土丘顶端矗立着28吨重的铁狮。游客可以攀登226级阶梯到达顶部，俯瞰整个战场。这里是拿破仑最终战败的地方，改变了欧洲历史的走向。\n\n拍摄建议：从雄狮丘底部拍摄铁狮与战场的全景是最经典的角度。登上顶部拍摄整个战场的全貌也很壮观。日落时分的金色光线照射在铁狮上格外壮观。',
   'The Waterloo Lion Mound commemorates the 1815 Battle of Waterloo, a 41-meter hill topped with a 28-ton iron lion. Visitors can climb 226 steps to the top.',
   [{icon:'🦁',title:'雄狮丘',desc:'纪念滑铁卢战役地标'},{icon:'🏔️',title:'41米高',desc:'28吨铁狮矗立顶端'},{icon:'📸',title:'最佳拍摄',desc:'底部拍摄铁狮战场全景'}],
   ['历史','战役','滑铁卢','比利时']],
  ['dinant-citadel','迪南城堡','Dinant Citadel','比利时','Belgium','那慕尔','Namur','悬崖上的中世纪堡垒','🏰 悬崖城堡 | 默兹河 | 中世纪堡垒',
   '迪南城堡是比利时最壮观的中世纪堡垒之一，矗立在默兹河上方100米高的悬崖上。城堡俯瞰着迪南小镇和默兹河的全景。乘坐缆车可以直达城堡顶部，沿途可以欣赏默兹河谷的壮丽景色。\n\n拍摄建议：从默兹河畔拍摄城堡与悬崖的全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡顶部拍摄默兹河谷全景也很值得。',
   'The Dinant Citadel is one of Belgium\'s most spectacular medieval fortresses, perched on a 100-meter cliff above the Meuse River. Overlooks the town of Dinant.',
   [{icon:'🏰',title:'悬崖城堡',desc:'比利时最壮观中世纪堡垒'},{icon:'🏔️',title:'100米悬崖',desc:'矗立在默兹河上方悬崖'},{icon:'📸',title:'最佳拍摄',desc:'河畔拍摄城堡悬崖全景'}],
   ['城堡','悬崖','迪南','比利时']],
  ['spa-town','斯帕温泉小镇','Spa Town','比利时','Belgium','列日','Liège','欧洲温泉疗养的发源地','♨️ 温泉小镇 | 欧洲发源地 | 疗养胜地',
   '斯帕是欧洲最著名的温泉小镇之一，也是"spa"一词的来源。小镇的温泉历史可以追溯到罗马时代，现在的温泉浴场延续了千年的疗养传统。周围的阿登森林为小镇提供了清新的自然环境。\n\n拍摄建议：从温泉浴场前拍摄小镇与森林的全景是最经典的角度。日落时分的金色光线照射在小镇上格外温馨。秋季的金色树叶映衬下的温泉小镇也很迷人。',
   'Spa is one of Europe\'s most famous thermal towns and the origin of the word "spa." The thermal history dates back to Roman times.',
   [{icon:'♨️',title:'温泉小镇',desc:'欧洲最著名温泉小镇之一'},{icon:'🏛️',title:'欧洲发源地',desc:'spa一词的来源地'},{icon:'📸',title:'最佳拍摄',desc:'浴场前拍摄小镇森林全景'}],
   ['温泉','疗养','斯帕','比利时']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 302
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
  console.log(`\n共插入 ${items.length} 个比利时景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
