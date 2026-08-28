const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['helsinki-cathedral','赫尔辛基大教堂','Helsinki Cathedral','芬兰','Finland','赫尔辛基','Helsinki','赫尔辛基参议院广场的白色地标','⛪ 白色大教堂 | 新古典主义 | 赫尔辛基地标',
   '赫尔辛基大教堂是芬兰最标志性的建筑，白色的圆顶矗立在参议院广场上方。教堂的新古典主义风格由建筑师恩格尔设计，是赫尔辛基天际线最醒目的元素。\n\n拍摄建议：从参议院广场拍摄教堂全景是最经典的角度。日落时分的金色光线照射在白色圆顶上格外壮观。从远处拍摄教堂与城市天际线的组合全景也很壮观。',
   'Helsinki Cathedral is Finland\'s most iconic building, with white domes rising above Senate Square. The Neoclassical style was designed by architect Engel.',
   [{icon:'⛪',title:'白色大教堂',desc:'芬兰最标志性建筑'},{icon:'🏛️',title:'新古典主义',desc:'恩格尔设计新古典主义风格'},{icon:'📸',title:'最佳拍摄',desc:'参议院广场拍摄教堂全景'}],
   ['教堂','新古典','赫尔辛基','芬兰']],
  ['suomenlinna-fortress','芬兰堡','Suomenlinna Fortress','芬兰','Finland','赫尔辛基','Helsinki','波罗的海的海上堡垒','🏰 海上堡垒 | 世界遗产 | 波罗的海明珠',
   '芬兰堡是赫尔辛基附近的海上堡垒，被联合国教科文组织列为世界遗产。堡垒由瑞典人建于18世纪，是芬兰最受欢迎的旅游景点之一。乘坐渡轮从市中心出发即可到达。\n\n拍摄建议：从堡垒上拍摄赫尔辛基天际线全景是最经典的角度。日落时分的金色光线照射在堡垒上格外壮观。从海上拍摄堡垒全景也很壮观。',
   'Suomenlinna is a sea fortress near Helsinki, a UNESCO World Heritage Site. Built by the Swedes in the 18th century.',
   [{icon:'🏰',title:'海上堡垒',desc:'赫尔辛基附近海上堡垒'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'堡垒上拍摄赫尔辛基天际线全景'}],
   ['堡垒','世界遗产','赫尔辛基','芬兰']],
  ['rock-church','岩石教堂','Rock Church Temppeliaukio','芬兰','Finland','赫尔辛基','Helsinki','从岩石中凿出的独特教堂','⛪ 岩石教堂 | 独特建筑 | 赫尔辛基地标',
   '岩石教堂是赫尔辛基最独特的教堂，直接从天然岩石中凿出。教堂的圆形穹顶由铜制成，自然光线从穹顶倾泻而入。教堂的音响效果极佳，是举办音乐会的理想场所。\n\n拍摄建议：从教堂内部拍摄岩石与穹顶的全景是最经典的角度。日落时分的金色光线照射在岩石上格外壮观。从教堂入口拍摄内部全景也很震撼。',
   'The Rock Church is Helsinki\'s most unique church, carved directly from natural rock. The circular copper dome allows natural light to pour in.',
   [{icon:'⛪',title:'岩石教堂',desc:'赫尔辛基最独特教堂'},{icon:'🏛️',title:'独特建筑',desc:'直接从天然岩石中凿出'},{icon:'📸',title:'最佳拍摄',desc:'教堂内部拍摄岩石穹顶全景'}],
   ['教堂','岩石','赫尔辛基','芬兰']],
  ['lapland-aurora','拉普兰极光','Lapland Northern Lights','芬兰','Finland','拉普兰','Lapland','北极圈内的极光奇观','🌌 极光 | 北极圈 | 芬兰拉普兰',
   '拉普兰是芬兰观赏北极光的最佳地点，位于北极圈内。每年9月至3月的极夜期间，绿色和紫色的极光在天空中舞动。拉普兰的荒野和湖泊为极光提供了完美的背景。\n\n拍摄建议：从拉普兰的荒野中拍摄极光与雪山的组合全景是最经典的角度。需要三脚架进行长曝光。极光最活跃的时段通常在深夜11点至凌晨2点。',
   'Lapland is Finland\'s best place for viewing the Northern Lights, located within the Arctic Circle. From September to March, green and purple auroras dance across the sky.',
   [{icon:'🌌',title:'极光',desc:'绿色紫色极光舞动天空'},{icon:'🏔️',title:'北极圈',desc:'芬兰拉普兰北极圈内'},{icon:'📸',title:'最佳拍摄',desc:'荒野拍摄极光雪山全景'}],
   ['极光','北极圈','拉普兰','芬兰']],
  ['santa-claus-village','圣诞老人村','Santa Claus Village','芬兰','Finland','拉普兰','Lapland','圣诞老人的官方故乡','🎅 圣诞老人 | 北极圈 | 拉普兰地标',
   '圣诞老人村是圣诞老人的官方故乡，位于罗瓦涅米北极圈上。村内有圣诞老人的办公室、邮局和各种圣诞主题的活动。跨越北极圈线是每位游客必做的体验。\n\n拍摄建议：从圣诞老人办公室拍摄圣诞老人全景是最经典的角度。日落时分的金色光线照射在雪地上格外壮观。从北极圈线拍摄村庄全景也很值得。',
   'Santa Claus Village is the official hometown of Santa Claus, located on the Arctic Circle in Rovaniemi. Houses Santa\'s office, post office, and Christmas activities.',
   [{icon:'🎅',title:'圣诞老人',desc:'圣诞老人的官方故乡'},{icon:'🏔️',title:'北极圈',desc:'位于罗瓦涅米北极圈上'},{icon:'📸',title:'最佳拍摄',desc:'圣诞老人办公室拍摄全景'}],
   ['圣诞老人','北极圈','罗瓦涅米','芬兰']],
  ['tampere-lakes','坦佩雷湖区','Tampere Lakes','芬兰','Finland','皮尔坎马','Pirkanmaa','千湖之国的湖区精华','🏞️ 千湖之国 | 湖区精华 | 芬兰自然',
   '坦佩雷湖区是芬兰千湖之国的精华所在，两个大湖之间的小镇被森林和瀑布环绕。坦佩雷是芬兰的工业城市，现在以科技和创意产业闻名。湖区的自然风光是芬兰人最爱的度假胜地。\n\n拍摄建议：从湖边拍摄森林与湖泊的全景是最经典的角度。日落时分的金色光线照射在湖面上格外壮观。从高处拍摄湖区全景也很值得。',
   'Tampere Lakes are the essence of Finland\'s "Land of a Thousand Lakes," with two large lakes flanking the town surrounded by forests and waterfalls.',
   [{icon:'🏞️',title:'千湖之国',desc:'芬兰千湖之国精华所在'},{icon:'🌲',title:'湖区精华',desc:'两个大湖之间小镇森林'},{icon:'📸',title:'最佳拍摄',desc:'湖边拍摄森林湖泊全景'}],
   ['湖泊','森林','坦佩雷','芬兰']],
  ['turku-castle','图尔库城堡','Turku Castle','芬兰','Finland','西南芬兰','Southwest Finland','芬兰最古老的中世纪城堡','🏰 中世纪城堡 | 芬兰最古老 | 图尔库地标',
   '图尔库城堡是芬兰最古老的中世纪城堡，始建于13世纪。城堡见证了芬兰数百年的历史，现在是图尔库最受欢迎的博物馆。城堡的地下室和塔楼是探索中世纪历史的好去处。\n\n拍摄建议：从城堡外拍摄完整的建筑群全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡内部拍摄庭院和塔楼也很壮观。',
   'Turku Castle is Finland\'s oldest medieval castle, dating from the 13th century. The castle witnessed hundreds of years of Finnish history.',
   [{icon:'🏰',title:'中世纪城堡',desc:'芬兰最古老中世纪城堡'},{icon:'🏛️',title:'13世纪',desc:'始建于13世纪城堡'},{icon:'📸',title:'最佳拍摄',desc:'城堡外拍摄建筑群全景'}],
   ['城堡','中世纪','图尔库','芬兰']],
  ['porvoo-old-town','波尔沃老城','Porvoo Old Town','芬兰','Finland','乌西马','Uusimaa','芬兰最美丽的中世纪小镇','🏘️ 中世纪小镇 | 彩色仓库 | 芬兰最美',
   '波尔沃老城是芬兰最美丽的中世纪小镇，以河畔的彩色仓库闻名。小镇的中世纪街道和木制建筑保存完好，是芬兰最浪漫的旅游目的地之一。\n\n拍摄建议：从河畔拍摄彩色仓库全景是最经典的角度。日落时分的金色光线照射在彩色房屋上格外温馨。从老城区拍摄小镇全景也很值得。',
   'Porvoo Old Town is Finland\'s most beautiful medieval town, famous for its colorful riverside warehouses. The medieval streets and wooden buildings are well-preserved.',
   [{icon:'🏘️',title:'中世纪小镇',desc:'芬兰最美丽中世纪小镇'},{icon:'🏛️',title:'彩色仓库',desc:'河畔彩色仓库闻名'},{icon:'📸',title:'最佳拍摄',desc:'河畔拍摄彩色仓库全景'}],
   ['小镇','中世纪','波尔沃','芬兰']],
  ['savonlinna-olavinlinna','萨翁林纳城堡','Savonlinna Olavinlinna','芬兰','Finland','萨沃','Savo','湖中岛屿上的中世纪城堡','🏰 湖中城堡 | 中世纪堡垒 | 萨翁林纳地标',
   '萨翁林纳城堡建于湖中岛屿上，是芬兰最独特的中世纪城堡之一。城堡现在是著名的歌剧节举办地，每年夏天吸引着全世界的音乐爱好者。\n\n拍摄建议：从湖岸拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从湖面拍摄城堡全景也很壮观。',
   'Savonlinna Castle is built on a lake island, one of Finland\'s most unique medieval castles. Now hosts the famous Opera Festival every summer.',
   [{icon:'🏰',title:'湖中城堡',desc:'芬兰最独特中世纪城堡之一'},{icon:'🎵',title:'歌剧节',desc:'著名歌剧节举办地'},{icon:'📸',title:'最佳拍摄',desc:'湖岸拍摄城堡全景'}],
   ['城堡','湖中','萨翁林纳','芬兰']],
  ['rovaniemi-glass-bridge','罗瓦涅米玻璃桥','Rovaniemi Glass Bridge','芬兰','Finland','拉普兰','Lapland','北极圈内的现代建筑奇观','🌉 玻璃桥 | 北极圈 | 拉普兰地标',
   '罗瓦涅米玻璃桥是拉普兰最新的现代建筑奇观，横跨在北极圈内的河流上。玻璃桥的设计让游客可以俯瞰下方的河流和森林。冬季的极光和夏季的午夜太阳为桥梁提供了壮丽的背景。\n\n拍摄建议：从桥梁上拍摄河流与森林的全景是最经典的角度。日落时分的金色光线照射在玻璃上格外壮观。从远处拍摄桥梁全景也很值得。',
   'Rovaniemi Glass Bridge is Lapland\'s newest modern architectural wonder, spanning a river within the Arctic Circle.',
   [{icon:'🌉',title:'玻璃桥',desc:'拉普兰最新现代建筑奇观'},{icon:'🏔️',title:'北极圈',desc:'横跨北极圈内河流'},{icon:'📸',title:'最佳拍摄',desc:'桥梁上拍摄河流森林全景'}],
   ['桥梁','现代','罗瓦涅米','芬兰']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 362
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
  console.log(`\n共插入 ${items.length} 个芬兰景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
