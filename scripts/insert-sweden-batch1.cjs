const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['stockholm-gamla-stan','斯德哥尔摩老城','Stockholm Gamla Stan','瑞典','Sweden','斯德哥尔摩','Stockholm','中世纪色彩的鹅卵石街道','🏘️ 中世纪老城 | 鹅卵石街道 | 彩色建筑',
   '斯德哥尔摩老城是欧洲保存最完好的中世纪城区之一，狭窄的鹅卵石街道两旁排列着色彩斑斓的13世纪建筑。老城位于一座小岛上，步行即可穿越整个区域。诺贝尔博物馆和大教堂都坐落于此。\n\n拍摄建议：从狭窄的巷道拍摄彩色建筑与鹅卵石街道的全景是最经典的角度。日落时分的金色光线照射在建筑上格外温馨。清晨游客稀少时拍摄效果最佳。',
   'Stockholm Gamla Stan is one of Europe\'s best-preserved medieval districts, with narrow cobblestone streets lined with colorful 13th-century buildings.',
   [{icon:'🏘️',title:'中世纪老城',desc:'欧洲保存最完好中世纪区'},{icon:'🏛️',title:'诺贝尔博物馆',desc:'诺贝尔奖颁发地所在'},{icon:'📸',title:'最佳拍摄',desc:'巷道拍摄彩色建筑全景'}],
   ['老城','中世纪','斯德哥尔摩','瑞典']],
  ['stockholm-city-hall','斯德哥尔摩市政厅','Stockholm City Hall','瑞典','Sweden','斯德哥尔摩','Stockholm','诺贝尔晚宴的举办地','🏛️ 红砖建筑 | 诺贝尔晚宴 | 城市地标',
   '斯德哥尔摩市政厅是瑞典最著名的建筑之一，高106米的塔楼顶端装饰着三顶金冠。每年诺贝尔晚宴都在市政厅的蓝厅举行。红砖外观与梅拉伦湖的水景形成了完美的画面。\n\n拍摄建议：从梅拉伦湖畔拍摄市政厅红砖建筑与塔楼的全景是最经典的角度。日落时分的金色光线照射在红砖上格外壮观。从塔顶拍摄城市全景也很值得。',
   'Stockholm City Hall is Sweden\'s most famous building, with a 106-meter tower topped by three crowns. The Nobel banquet is held here annually in the Blue Hall.',
   [{icon:'🏛️',title:'红砖建筑',desc:'瑞典最著名建筑之一'},{icon:'🏆',title:'诺贝尔晚宴',desc:'每年诺贝尔奖晚宴举办地'},{icon:'📸',title:'最佳拍摄',desc:'湖畔拍摄红砖建筑全景'}],
   ['市政厅','红砖','诺贝尔','斯德哥尔摩']],
  ['vasa-museum','瓦萨沉船博物馆','Vasa Museum','瑞典','Sweden','斯德哥尔摩','Stockholm','世界上唯一保存完好的17世纪战舰','🚢 17世纪战舰 | 沉船博物馆 | 世界唯一',
   '瓦萨博物馆是世界上唯一保存完好的17世纪战舰博物馆。瓦萨号于1628年首航时沉没，333年后被打捞出水，船上98%的原始结构完好无损。博物馆展示了这艘壮观的战舰及其数千件文物。\n\n拍摄建议：从博物馆内部拍摄战舰的完整侧面全景是最经典的角度。战舰上的精美木雕装饰是很好的细节元素。从不同角度拍摄战舰的宏伟规模也很壮观。',
   'The Vasa Museum is the world\'s only preserved 17th-century warship museum. The Vasa sank in 1628 and was salvaged 333 years later with 98% of its original structure intact.',
   [{icon:'🚢',title:'17世纪战舰',desc:'世界唯一保存完好战舰'},{icon:'🏛️',title:'沉船博物馆',desc:'333年后打捞出水'},{icon:'📸',title:'最佳拍摄',desc:'博物馆内拍摄战舰全景'}],
   ['博物馆','战舰','斯德哥尔摩','瑞典']],
  ['abisko-aurora','阿比斯库极光','Abisko Northern Lights','瑞典','Sweden','北博滕','Norrbotten','全世界最佳极光观测地','🌌 极光 | 最佳观测地 | 北极圈',
   '阿比斯库是全世界观赏北极光的最佳地点之一，位于北极圈内的瑞典拉普兰地区。这里的"蓝洞"现象创造了独特的晴朗天空，使极光观测概率高达80%。冬季的极夜期间，绿色和紫色的极光在天空中舞动。\n\n拍摄建议：从阿比斯库国家公园的暗处拍摄极光与雪山的组合全景是最经典的角度。需要三脚架进行长曝光。极光最活跃的时段通常在深夜11点至凌晨2点。',
   'Abisko is one of the world\'s best places for viewing the Northern Lights, located in Swedish Lapland within the Arctic Circle. The "Blue Hole" phenomenon creates unique clear skies.',
   [{icon:'🌌',title:'极光',desc:'绿色紫色极光舞动天空'},{icon:'🏔️',title:'最佳观测地',desc:'极光观测概率高达80%'},{icon:'📸',title:'最佳拍摄',desc:'长曝光极光雪山全景'}],
   ['极光','北极圈','拉普兰','瑞典']],
  ['ice-hotel-jukkasjarvi','冰酒店','Ice Hotel Jukkasjarvi','瑞典','Sweden','北博滕','Norrbotten','每年重建的冰之宫殿','🧊 冰酒店 | 每年重建 | 冰之宫殿',
   '冰酒店是全世界第一座用冰雪建造的酒店，每年冬季在托尔讷河畔重建。酒店内的每个房间都由不同的艺术家设计，温度保持在零下5-8度。春季酒店融化回归河流，每年都是全新的设计。\n\n拍摄建议：从酒店内部拍摄冰雕房间的全景是最经典的角度。冰雕床和墙壁上的精美冰雕是很好的细节元素。冬季的极夜期间拍摄冰酒店的蓝色光芒也很梦幻。',
   'The Ice Hotel is the world\'s first hotel made of snow and ice, rebuilt every winter on the banks of the Torne River. Each room is designed by different artists.',
   [{icon:'🧊',title:'冰酒店',desc:'全世界第一座冰雪酒店'},{icon:'🎨',title:'每年重建',desc:'每个房间艺术家设计'},{icon:'📸',title:'最佳拍摄',desc:'酒店内部拍摄冰雕全景'}],
   ['冰酒店','冰雪','北博滕','瑞典']],
  ['gotland-visby','维斯比中世纪小镇','Visby Gotland','瑞典','Sweden','哥特兰','Gotland','波罗的海的中世纪宝石','🏘️ 中世纪小镇 | 城墙环绕 | 世界遗产',
   '维斯比是波罗的海哥特兰岛上的中世纪小镇，被完整的13世纪城墙环绕。小镇内保存着超过200座中世纪建筑，包括11座教堂遗迹。鹅卵石街道和玫瑰花丛构成了全世界最浪漫的中世纪画面。1995年被列为世界遗产。\n\n拍摄建议：从城墙外拍摄维斯比全景是最经典的角度。城墙内的教堂塔楼和红色屋顶是很好的背景元素。夏季的玫瑰花丛映衬下的鹅卵石街道也很迷人。',
   'Visby is a medieval town on the island of Gotland in the Baltic Sea, surrounded by complete 13th-century walls. Over 200 medieval buildings are preserved within.',
   [{icon:'🏘️',title:'中世纪小镇',desc:'波罗的海哥特兰岛小镇'},{icon:'🏆',title:'世界遗产',desc:'1995年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'城墙外拍摄维斯比全景'}],
   ['中世纪','世界遗产','哥特兰','瑞典']],
  ['kiruna','基律纳','Kiruna','瑞典','Sweden','北博滕','Norrbotten','北极圈内的矿业小镇','🏘️ 北极小镇 | 矿业城市 | 极光观测',
   '基律纳是瑞典最北端的城市，位于北极圈内，以世界上最大的地下铁矿而闻名。城市正在经历前所未有的搬迁，整个市中心将被移动到新的位置。冬季的极光和夏季的午夜太阳是这里最壮观的自然现象。\n\n拍摄建议：从城市外围拍摄基律纳与远处雪山的全景是最经典的角度。冬季极光映照在小镇上的画面最为壮观。夏季的午夜太阳也很迷人。',
   'Kiruna is Sweden\'s northernmost city, located within the Arctic Circle, famous for the world\'s largest underground iron mine. The entire city center is being relocated.',
   [{icon:'🏘️',title:'北极小镇',desc:'瑞典最北端城市'},{icon:'⛏️',title:'矿业城市',desc:'世界最大地下铁矿'},{icon:'📸',title:'最佳拍摄',desc:'城市外围拍摄雪山全景'}],
   ['北极','矿业','基律纳','瑞典']],
  ['lapland-sami','拉普兰萨米村','Lapland Sami Village','瑞典','Sweden','北博滕','Norrbotten','驯鹿牧民的北极家园','🦌 萨米文化 | 驯鹿牧民 | 北极家园',
   '拉普兰萨米村是瑞典原住民萨米人的传统居住地。萨米人以驯鹿牧民闻名，他们的圆锥形帐篷（kåta）和传统服饰是北极文化的象征。游客可以体验萨米人的传统文化，包括驯鹿雪橇和传统美食。\n\n拍摄建议：从萨米村拍摄驯鹿群与传统帐篷的全景是最经典的角度。萨米人的传统服饰和手工艺品是很好的细节元素。冬季的雪景为村庄增添了北极氛围。',
   'The Lapland Sami Village is the traditional homeland of Sweden\'s indigenous Sami people. Famous for reindeer herding, their cone-shaped tents and traditional clothing are symbols of Arctic culture.',
   [{icon:'🦌',title:'萨米文化',desc:'瑞典原住民萨米人传统'},{icon:'🏕️',title:'驯鹿牧民',desc:'北极文化象征驯鹿雪橇'},{icon:'📸',title:'最佳拍摄',desc:'萨米村拍摄驯鹿帐篷全景'}],
   ['萨米','驯鹿','拉普兰','瑞典']],
  ['drottningholm-palace','王后岛宫','Drottningholm Palace','瑞典','Sweden','斯德哥尔摩','Stockholm','瑞典王室的凡尔赛宫','🏛️ 王室宫殿 | 世界遗产 | 巴洛克花园',
   '王后岛宫是瑞典王室的官方居所，被称为"瑞典的凡尔赛宫"。宫殿建于17世纪，拥有精美的巴洛克花园和中国亭。1991年被列为世界遗产。宫殿前的梅拉伦湖水景为建筑增添了优雅的背景。\n\n拍摄建议：从宫殿前的巴洛克花园拍摄宫殿与花园的全景是最经典的角度。宫殿后的中国亭是很好的细节元素。日落时分的金色光线照射在宫殿上格外壮观。',
   'Drottningholm Palace is the official residence of the Swedish royal family, known as "Sweden\'s Versailles." Built in the 17th century with beautiful Baroque gardens and a Chinese Pavilion.',
   [{icon:'🏛️',title:'王室宫殿',desc:'瑞典王室官方居所'},{icon:'🏆',title:'世界遗产',desc:'1991年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'花园拍摄宫殿花园全景'}],
   ['宫殿','世界遗产','斯德哥尔摩','瑞典']],
  ['uppsala-cathedral','乌普萨拉大教堂','Uppsala Cathedral','瑞典','Sweden','乌普萨拉','Uppsala','斯堪的纳维亚最大的教堂','⛪ 118米双塔 | 北欧最大 | 哥特建筑',
   '乌普萨拉大教堂是斯堪的纳维亚最大的教堂，双塔高118米，是瑞典最壮观的哥特式建筑。教堂内安放着瑞典国王古斯塔夫·瓦萨的陵墓。教堂位于乌普萨拉市中心，从城市任何角度都能看到其宏伟的身影。\n\n拍摄建议：从教堂前的广场拍摄双塔全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从远处拍摄教堂与城市天际线的组合全景也很壮观。',
   'Uppsala Cathedral is Scandinavia\'s largest church, with twin towers reaching 118 meters. It houses the tomb of King Gustav Vasa and is Sweden\'s most spectacular Gothic building.',
   [{icon:'⛪',title:'118米双塔',desc:'斯堪的纳维亚最大教堂'},{icon:'👑',title:'国王陵墓',desc:'古斯塔夫·瓦萨陵墓'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄双塔全景'}],
   ['教堂','哥特','乌普萨拉','瑞典']],
  ['gothenburg-archipelago','哥德堡群岛','Gothenburg Archipelago','瑞典','Sweden','西约塔兰','Västra Götaland','西海岸的群岛天堂','🏝️ 群岛 | 西海岸 | 渡轮天堂',
   '哥德堡群岛是瑞典西海岸的群岛天堂，由超过30个岛屿组成。每个岛屿都有独特的魅力，从渔村到自然保护区，从岩石海岸到白色沙滩。乘坐渡轮穿梭于各岛之间是体验群岛的最佳方式。\n\n拍摄建议：从渡轮上拍摄群岛与海岸的全景是最经典的角度。每个岛屿的渔村和岩石海岸是很好的细节元素。夏季的金色光线照射在群岛上格外壮观。',
   'The Gothenburg Archipelago is a paradise of over 30 islands on Sweden\'s west coast. Each island has unique charm, from fishing villages to nature reserves.',
   [{icon:'🏝️',title:'群岛',desc:'瑞典西海岸群岛天堂'},{icon:'⛴️',title:'渡轮',desc:'乘渡轮穿梭各岛体验'},{icon:'📸',title:'最佳拍摄',desc:'渡轮上拍摄群岛海岸全景'}],
   ['群岛','西海岸','哥德堡','瑞典']],
  ['malmo-turning-torso','马尔默旋转大厦','Malmö Turning Torso','瑞典','Sweden','斯科讷','Skåne','全世界最独特的摩天大楼','🏢 旋转90度 | 世界最独特 | 现代建筑',
   '马尔默旋转大厦是全世界最独特的摩天大楼之一，整座建筑旋转了90度。大厦高190米，是瑞典最高的建筑。由西班牙建筑师圣地亚哥·卡拉特拉瓦设计，于2005年完工。大厦位于厄勒海峡畔，与丹麦的哥本哈根隔海相望。\n\n拍摄建议：从厄勒海峡畔拍摄旋转大厦的完整侧面全景是最经典的角度。日落时分的金色光线照射在玻璃幕墙上格外壮观。从远处拍摄大厦与海岸的组合全景也很壮观。',
   'The Turning Torso is one of the world\'s most unique skyscrapers, twisted 90 degrees. At 190 meters, it\'s Sweden\'s tallest building, designed by Santiago Calatrava.',
   [{icon:'🏢',title:'旋转90度',desc:'全世界最独特摩天大楼'},{icon:'🏗️',title:'190米',desc:'瑞典最高建筑'},{icon:'📸',title:'最佳拍摄',desc:'海岸拍摄旋转大厦全景'}],
   ['建筑','现代','马尔默','瑞典']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 290
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
  console.log(`\n共插入 ${items.length} 个瑞典景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
