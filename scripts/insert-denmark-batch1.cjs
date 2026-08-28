const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['nyhavn','新港','Nyhavn','丹麦','Denmark','哥本哈根','Copenhagen','彩色房屋运河的童话港口','🏘️ 彩色房屋 | 运河港口 | 哥本哈根地标',
   '新港是哥本哈根最标志性的景观，一排色彩斑斓的17世纪房屋沿着运河排列。安徒生曾在这里的多个房屋中居住。运河中的古老木船和两岸的餐厅构成了全世界最温馨的港口画面。\n\n拍摄建议：从运河上的桥梁拍摄彩色房屋全景是最经典的角度。日落时分的金色光线照射在房屋上格外温馨。乘坐游船从水面角度拍摄也很壮观。',
   'Nyhavn is Copenhagen\'s most iconic sight, with colorful 17th-century houses lining the canal. Hans Christian Andersen lived in several houses here.',
   [{icon:'🏘️',title:'彩色房屋',desc:'17世纪运河彩色房屋'},{icon:'📖',title:'安徒生故居',desc:'安徒生曾在此居住'},{icon:'📸',title:'最佳拍摄',desc:'桥梁拍摄彩色房屋全景'}],
   ['运河','彩色','哥本哈根','丹麦']],
  ['little-mermaid','小美人鱼像','Little Mermaid','丹麦','Denmark','哥本哈根','Copenhagen','安徒生童话的永恒象征','🗿 铜像 | 安徒生童话 | 哥本哈根象征',
   '小美人鱼像是哥本哈根最著名的地标，基于安徒生童话《海的女儿》创作。这座高1.25米的铜像自1913年起就坐在港口的岩石上，是全世界被拍照最多的雕塑之一。\n\n拍摄建议：从港口拍摄小美人鱼铜像的全景是最经典的角度。日落时分的金色光线照射在铜像上格外温馨。从远处拍摄铜像与港口的组合全景也很壮观。',
   'The Little Mermaid is Copenhagen\'s most famous landmark, based on Hans Christian Andersen\'s fairy tale. The 1.25m bronze statue has sat on the harbor rock since 1913.',
   [{icon:'🗿',title:'铜像',desc:'哥本哈根最著名地标'},{icon:'📖',title:'安徒生童话',desc:'海的女儿童话象征'},{icon:'📸',title:'最佳拍摄',desc:'港口拍摄铜像全景'}],
   ['铜像','童话','哥本哈根','丹麦']],
  ['rosenborg-castle','罗森堡城堡','Rosenborg Castle','丹麦','Denmark','哥本哈根','Copenhagen','丹麦王室的文艺复兴宫殿','🏰 文艺复兴 | 王室宫殿 | 哥本哈根地标',
   '罗森堡城堡是哥本哈根最美丽的文艺复兴建筑，由克里斯蒂安四世建于17世纪。城堡内保存着丹麦王室的珍宝和皇冠。周围的美丽花园是市民和游客最爱的休闲场所。\n\n拍摄建议：从花园拍摄城堡的文艺复兴全景是最经典的角度。日落时分的金色光线照射在红砖建筑上格外壮观。从花园拍摄城堡与花卉的组合全景也很迷人。',
   'Rosenborg Castle is Copenhagen\'s most beautiful Renaissance building, built by Christian IV in the 17th century. Houses the Danish Crown Jewels.',
   [{icon:'🏰',title:'文艺复兴',desc:'哥本哈根最美文艺复兴建筑'},{icon:'👑',title:'王室珍宝',desc:'保存丹麦王室珍宝皇冠'},{icon:'📸',title:'最佳拍摄',desc:'花园拍摄城堡全景'}],
   ['城堡','文艺复兴','哥本哈根','丹麦']],
  ['tivoli-gardens','趣伏里乐园','Tivoli Gardens','丹麦','Denmark','哥本哈根','Copenhagen','全世界最古老的游乐园','🎡 1843年 | 世界最古老 | 童话乐园',
   '趣伏里乐园是全世界第二古老的游乐园，建于1843年。乐园的东方风格建筑和夜间灯光构成了全世界最梦幻的童话画面。安徒生和迪士尼都从这里获得灵感。\n\n拍摄建议：从乐园入口拍摄东方风格建筑的全景是最经典的角度。夜间的灯光秀将乐园变成梦幻世界。从摩天轮上拍摄哥本哈根全景也很值得。',
   'Tivoli Gardens is the world\'s second oldest amusement park, built in 1843. The Oriental-style buildings and night lights create the most dreamlike fairy tale scene.',
   [{icon:'🎡',title:'1843年',desc:'全世界第二古老游乐园'},{icon:'✨',title:'童话乐园',desc:'安徒生迪士尼灵感来源'},{icon:'📸',title:'最佳拍摄',desc:'入口拍摄东方建筑全景'}],
   ['游乐园','童话','哥本哈根','丹麦']],
  ['kronborg-castle','克伦堡城堡','Kronborg Castle','丹麦','Denmark','赫尔辛格','Helsingør','哈姆雷特的艾尔西诺城堡','🏰 哈姆雷特 | 世界遗产 | 丹麦地标',
   '克伦堡城堡是莎士比亚名剧《哈姆雷特》中艾尔西诺城堡的原型，被联合国教科文组织列为世界遗产。城堡位于厄勒海峡畔，控制着丹麦与瑞典之间的航道。城堡的文艺复兴建筑风格令人印象深刻。\n\n拍摄建议：从厄勒海峡畔拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡顶部拍摄海峡全景也很值得。',
   'Kronborg Castle is the setting for Shakespeare\'s Hamlet, a UNESCO World Heritage Site. Located on the Øresund Strait, controlling the passage between Denmark and Sweden.',
   [{icon:'🏰',title:'哈姆雷特',desc:'莎士比亚名剧城堡原型'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'海峡畔拍摄城堡全景'}],
   ['城堡','世界遗产','哈姆雷特','丹麦']],
  ['roskilde-cathedral','罗斯基勒大教堂','Roskilde Cathedral','丹麦','Denmark','西兰','Zealand','丹麦王室的千年安息地','⛪ 红砖哥特 | 王室陵墓 | 世界遗产',
   '罗斯基勒大教堂是丹麦最重要的教堂，自15世纪以来一直是丹麦王室的安息地。教堂的红砖哥特式建筑和双塔是丹麦最古老的砖石建筑之一。1995年被列为世界遗产。\n\n拍摄建议：从教堂前的广场拍摄双塔全景是最经典的角度。日落时分的金色光线照射在红砖建筑上格外壮观。从远处拍摄教堂与城市天际线的组合全景也很壮观。',
   'Roskilde Cathedral has been the burial site of Danish monarchs since the 15th century. The red brick Gothic twin towers are among Denmark\'s oldest brick structures.',
   [{icon:'⛪',title:'红砖哥特',desc:'丹麦最古老砖石建筑之一'},{icon:'👑',title:'王室陵墓',desc:'丹麦王室千年安息地'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄双塔全景'}],
   ['教堂','世界遗产','王室','丹麦']],
  ['aalborg-waterfront','奥尔堡海滨','Aalborg Waterfront','丹麦','Denmark','北日德兰','North Jutland','丹麦最长的海滨长廊','🏖️ 海滨长廊 | 丹麦最长 | 北日德兰',
   '奥尔堡海滨是丹麦最长的海滨长廊之一，沿着利姆海峡延伸。海滨的现代建筑与传统的港口设施形成了独特的对比。夏季的海滨是市民和游客最爱的休闲场所。\n\n拍摄建议：从海滨拍摄现代建筑与港口的全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从海滨拍摄城市天际线也很壮观。',
   'Aalborg Waterfront is one of Denmark\'s longest waterfront promenades, extending along the Limfjord. Modern architecture contrasts with traditional port facilities.',
   [{icon:'🏖️',title:'海滨长廊',desc:'丹麦最长海滨长廊之一'},{icon:'🏢',title:'现代建筑',desc:'现代建筑与传统港口'},{icon:'📸',title:'最佳拍摄',desc:'海滨拍摄现代建筑港口全景'}],
   ['海滨','现代','奥尔堡','丹麦']],
  ['arhus-old-town','奥胡斯老城','Aarhus Old Town','丹麦','Denmark','中日德兰','Central Jutland','丹麦最古老的城区','🏘️ 中世纪老城 | 丹麦最古老 | 步行街',
   '奥胡斯老城是丹麦最古老的城区，建于8世纪的维京时代。老城区的步行街两旁排列着色彩斑斓的半木结构房屋和现代咖啡馆。奥胡斯大教堂和老城博物馆是这里最吸引人的景点。\n\n拍摄建议：从步行街拍摄彩色房屋全景是最经典的角度。日落时分的金色光线照射在半木结构房屋上格外温馨。从大教堂拍摄城市全景也很值得。',
   'Aarhus Old Town is Denmark\'s oldest district, dating back to the 8th century Viking Age. The pedestrian streets are lined with colorful half-timbered houses.',
   [{icon:'🏘️',title:'中世纪老城',desc:'丹麦最古老城区'},{icon:'🏛️',title:'半木结构',desc:'色彩斑斓半木结构房屋'},{icon:'📸',title:'最佳拍摄',desc:'步行街拍摄彩色房屋全景'}],
   ['老城','中世纪','奥胡斯','丹麦']],
  ['bornholm-round-church','博恩霍尔姆圆教堂','Bornholm Round Church','丹麦','Denmark','博恩霍尔姆','Bornholm','北欧独特的圆形教堂','⛪ 圆形教堂 | 北欧独特 | 中世纪建筑',
   '博恩霍尔姆圆教堂是北欧最独特的中世纪建筑之一，建于12世纪。圆形的教堂主体和圆锥形的屋顶在全欧洲都找不到第二个类似的建筑。教堂内部的壁画保存完好，展现了中世纪的艺术风格。\n\n拍摄建议：从教堂外拍摄圆形建筑的全景是最经典的角度。日落时分的金色光线照射在圆形教堂上格外壮观。从教堂内部拍摄圆形穹顶也很震撼。',
   'The Bornholm Round Church is one of Northern Europe\'s most unique medieval buildings, built in the 12th century. The circular body and conical roof are unique in Europe.',
   [{icon:'⛪',title:'圆形教堂',desc:'北欧最独特中世纪建筑'},{icon:'🏛️',title:'12世纪',desc:'全欧洲找不到第二个类似'},{icon:'📸',title:'最佳拍摄',desc:'教堂外拍摄圆形建筑全景'}],
   ['教堂','圆形','博恩霍尔姆','丹麦']],
  ['skagen-beach','斯卡恩海滩','Skagen Beach','丹麦','Denmark','北日德兰','North Jutland','两海交汇的金色沙滩','🏖️ 两海交汇 | 金色沙滩 | 丹麦最北',
   '斯卡恩海滩是丹麦最独特的自然景观之一，这里是北海和波罗的海的交汇处。两股不同颜色的海水在沙滩尖端相遇，形成了全世界最壮观的海景。沙滩上的金色沙丘和灯塔也是绝佳的拍摄对象。\n\n拍摄建议：从沙滩拍摄两海交汇的全景是最经典的角度。日落时分的金色光线照射在沙丘上格外壮观。从灯塔拍摄海景全景也很值得。',
   'Skagen Beach is one of Denmark\'s most unique natural sights, where the North Sea and Baltic Sea meet. Two different colored waters converge at the sand spit.',
   [{icon:'🏖️',title:'两海交汇',desc:'北海与波罗的海交汇'},{icon:'🏔️',title:'金色沙滩',desc:'金色沙丘与灯塔'},{icon:'📸',title:'最佳拍摄',desc:'沙滩拍摄两海交汇全景'}],
   ['海滩','两海','斯卡恩','丹麦']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 312
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
  console.log(`\n共插入 ${items.length} 个丹麦景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
