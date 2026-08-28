const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['stonehenge','巨石阵','Stonehenge','英国','United Kingdom','威尔特郡','Wiltshire','五千年前的神秘巨石遗迹','🪨 巨石阵 | 世界遗产 | 英国地标',
   '巨石阵是全世界最神秘的史前遗迹之一，建于约5000年前。巨大的石块排列成环形，至今人们仍不清楚其建造目的。1986年被列为世界遗产。\n\n拍摄建议：从围栏外拍摄巨石阵全景是最经典的角度。日落时分的金色光线照射在巨石上格外壮观。从远处拍摄巨石阵与平原的组合全景也很壮观。',
   'Stonehenge is one of the world\'s most mysterious prehistoric monuments, built about 5,000 years ago. The massive stones arranged in a circle remain unexplained. UNESCO World Heritage since 1986.',
   [{icon:'🪨',title:'巨石阵',desc:'全世界最神秘的史前遗迹'},{icon:'🏆',title:'世界遗产',desc:'1986年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'围栏外拍摄巨石阵全景'}],
   ['巨石阵','世界遗产','威尔特郡','英国']],
  ['tower-of-london','伦敦塔','Tower of London','英国','United Kingdom','伦敦','London','千年皇家堡垒与王冠所在地','🏰 皇家堡垒 | 世界遗产 | 伦敦地标',
   '伦敦塔建于11世纪，是英国最重要的中世纪建筑之一。塔内保存着英国王冠珠宝，也是历史上著名的监狱和行刑场。1988年被列为世界遗产。\n\n拍摄建议：从泰晤士河畔拍摄伦敦塔全景是最经典的角度。日落时分的金色光线照射在塔楼上格外壮观。从塔桥拍摄伦敦塔与城市天际线的组合全景也很壮观。',
   'The Tower of London, built in the 11th century, is one of Britain\'s most important medieval buildings. Houses the Crown Jewels and served as a famous prison. UNESCO World Heritage since 1988.',
   [{icon:'🏰',title:'皇家堡垒',desc:'英国最重要的中世纪建筑'},{icon:'💎',title:'王冠珠宝',desc:'保存着英国王冠珠宝'},{icon:'📸',title:'最佳拍摄',desc:'泰晤士河畔拍摄伦敦塔全景'}],
   ['城堡','皇家','伦敦','英国']],
  ['buckingham-palace','白金汉宫','Buckingham Palace','英国','United Kingdom','伦敦','London','英国君主的官方居所','🏰 皇宫 | 英国君主 | 伦敦地标',
   '白金汉宫是英国君主在伦敦的官方居所，自1837年以来一直是英国君主的住所。宫殿的阳台是皇家重大庆典的标志性场景。卫兵换岗仪式是伦敦最受欢迎的旅游活动。\n\n拍摄建议：从维多利亚纪念碑拍摄宫殿全景是最经典的角度。日落时分的金色光线照射在宫殿上格外壮观。从圣詹姆斯公园拍摄宫殿与花园的组合全景也很壮观。',
   'Buckingham Palace is the London residence of the British monarch, serving as the royal home since 1837. The balcony is iconic for royal celebrations. The Changing of the Guard is London\'s most popular tourist activity.',
   [{icon:'🏰',title:'皇宫',desc:'英国君主的官方居所'},{icon:'🎺',title:'卫兵换岗',desc:'伦敦最受欢迎的旅游活动'},{icon:'📸',title:'最佳拍摄',desc:'维多利亚纪念碑拍摄宫殿全景'}],
   ['宫殿','皇家','伦敦','英国']],
  ['big-ben','大本钟','Big Ben','英国','United Kingdom','伦敦','London','全世界最著名的钟楼','🕐 钟楼 | 哥特复兴 | 伦敦地标',
   '大本钟是全世界最著名的钟楼，正式名称为伊丽莎白塔。钟楼高96米，建于1859年，是伦敦天际线最具辨识度的元素。钟声通过BBC向全世界广播。\n\n拍摄建议：从泰晤士河畔拍摄钟楼全景是最经典的角度。日落时分的金色光线照射在钟面上格外壮观。从威斯敏斯特桥拍摄钟楼与议会大厦的组合全景也很壮观。',
   'Big Ben is the world\'s most famous clock tower, officially named Elizabeth Tower. Standing 96 meters tall, built in 1859, it\'s the most recognizable element of the London skyline.',
   [{icon:'🕐',title:'钟楼',desc:'全世界最著名的钟楼'},{icon:'🏛️',title:'哥特复兴',desc:'建于1859年高96米'},{icon:'📸',title:'最佳拍摄',desc:'泰晤士河畔拍摄钟楼全景'}],
   ['钟楼','哥特','伦敦','英国']],
  ['westminster-abbey','威斯敏斯特教堂','Westminster Abbey','英国','United Kingdom','伦敦','London','英国皇室的加冕教堂','⛪ 加冕教堂 | 哥特建筑 | 伦敦地标',
   '威斯敏斯特教堂自1066年以来一直是英国君主加冕的场所。教堂内安葬着众多英国历史上的伟人，包括牛顿、达尔文和狄更斯。教堂的哥特式建筑令人叹为观止。\n\n拍摄建议：从教堂前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从议会广场拍摄教堂与大本钟的组合全景也很壮观。',
   'Westminster Abbey has been the coronation church for British monarchs since 1066. Many great figures in British history are buried here, including Newton, Darwin, and Dickens.',
   [{icon:'⛪',title:'加冕教堂',desc:'自1066年以来英国君主加冕场所'},{icon:'🏛️',title:'哥特建筑',desc:'令人叹为观止的哥特式建筑'},{icon:'📸',title:'最佳拍摄',desc:'教堂前方拍摄完整建筑全景'}],
   ['教堂','加冕','伦敦','英国']],
  ['st-pauls-cathedral','圣保罗大教堂','St Paul\'s Cathedral','英国','United Kingdom','伦敦','London','伦敦天际线的圆顶地标','⛪ 圆顶大教堂 | 巴洛克 | 伦敦地标',
   '圣保罗大教堂是伦敦天际线最具辨识度的建筑之一，由克里斯托弗·雷恩爵士设计，建于17世纪。教堂的圆顶高111米，在二战闪电战中幸存下来，成为伦敦坚韧不拔的象征。\n\n拍摄建议：从千禧桥拍摄教堂全景是最经典的角度。日落时分的金色光线照射在圆顶上格外壮观。从泰晤士河对岸拍摄教堂与城市天际线的组合全景也很壮观。',
   'St Paul\'s Cathedral is one of London\'s most recognizable buildings, designed by Sir Christopher Wren in the 17th century. The dome stands 111 meters and survived the Blitz, becoming a symbol of resilience.',
   [{icon:'⛪',title:'圆顶大教堂',desc:'伦敦天际线最具辨识度的建筑'},{icon:'🏛️',title:'巴洛克',desc:'克里斯托弗·雷恩设计建于17世纪'},{icon:'📸',title:'最佳拍摄',desc:'千禧桥拍摄教堂全景'}],
   ['教堂','巴洛克','伦敦','英国']],
  ['tower-bridge','塔桥','Tower Bridge','英国','United Kingdom','伦敦','London','泰晤士河上的维多利亚式开启桥','🌉 开启桥 | 维多利亚 | 伦敦地标',
   '塔桥是泰晤士河上最著名的桥梁，建于1894年。桥的两座哥特式塔楼高65米，中间的连接桥可以打开让大型船只通过。桥内的玻璃人行道提供了独特的观景视角。\n\n拍摄建议：从泰晤士河南岸拍摄塔桥全景是最经典的角度。日落时分的金色光线照射在桥塔上格外壮观。从桥内玻璃人行道拍摄泰晤士河也很壮观。',
   'Tower Bridge is the most famous bridge on the Thames, built in 1894. The two Gothic towers stand 65 meters tall, with a bascule that opens for large ships. The glass walkway offers unique viewing perspectives.',
   [{icon:'🌉',title:'开启桥',desc:'泰晤士河上最著名的桥梁'},{icon:'🏛️',title:'维多利亚',desc:'建于1894年哥特式塔楼'},{icon:'📸',title:'最佳拍摄',desc:'泰晤士河南岸拍摄塔桥全景'}],
   ['桥梁','维多利亚','伦敦','英国']],
  ['british-museum','大英博物馆','British Museum','英国','United Kingdom','伦敦','London','全世界最伟大的博物馆之一','🏛️ 博物馆 | 世界文明 | 伦敦地标',
   '大英博物馆是全世界最伟大的博物馆之一，收藏了超过800万件来自世界各地的文物。博物馆的希腊复兴风格大门和圆形阅览室是建筑杰作。\n\n拍摄建议：从博物馆前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在柱廊上格外壮观。从博物馆内部拍摄圆形阅览室也很壮观。',
   'The British Museum is one of the world\'s greatest museums, housing over 8 million artifacts from around the globe. The Greek Revival facade and circular Reading Room are architectural masterpieces.',
   [{icon:'🏛️',title:'博物馆',desc:'全世界最伟大的博物馆之一'},{icon:'🏺',title:'世界文明',desc:'收藏超过800万件文物'},{icon:'📸',title:'最佳拍摄',desc:'博物馆前方拍摄完整建筑全景'}],
   ['博物馆','文明','伦敦','英国']],
  ['bath-roman-baths','巴斯罗马浴场','Bath Roman Baths','英国','United Kingdom','萨默塞特','Somerset','两千年前的罗马温泉浴场','🏛️ 罗马浴场 | 世界遗产 | 巴斯地标',
   '巴斯罗马浴场是全世界保存最完好的罗马浴场之一，建于约2000年前。浴场的温水至今仍在流淌，是巴斯最重要的旅游景点。巴斯整座城市被列为世界遗产。\n\n拍摄建议：从浴场庭院拍摄完整建筑群全景是最经典的角度。日落时分的金色光线照射在巴斯石上格外壮观。从浴场内部拍摄温泉池也很壮观。',
   'The Bath Roman Baths are among the best-preserved Roman baths in the world, built about 2,000 years ago. The warm water still flows today. The entire city of Bath is a UNESCO World Heritage Site.',
   [{icon:'🏛️',title:'罗马浴场',desc:'全世界保存最完好的罗马浴场'},{icon:'♨️',title:'温泉',desc:'2000年前温水至今仍在流淌'},{icon:'📸',title:'最佳拍摄',desc:'浴场庭院拍摄建筑群全景'}],
   ['浴场','罗马','巴斯','英国']],
  ['oxford-university','牛津大学','Oxford University','英国','United Kingdom','牛津','Oxford','全世界最古老的英语大学','🎓 大学城 | 800年历史 | 牛津地标',
   '牛津大学是英语世界最古老的大学，有800多年的历史。大学的学院建筑散布在整个城市中心，形成了"城市中的大学"。基督教堂学院和博德利图书馆是最著名的建筑。\n\n拍摄建议：从基督教堂学院的庭院拍摄建筑全景是最经典的角度。日落时分的金色光线照射在学院建筑上格外壮观。从高处拍摄牛津天际线也很壮观。',
   'Oxford University is the oldest university in the English-speaking world, with over 800 years of history. The college buildings are scattered throughout the city center, forming a "city within a university."',
   [{icon:'🎓',title:'大学城',desc:'英语世界最古老的大学'},{icon:'🏛️',title:'800年',desc:'800多年历史的学院建筑'},{icon:'📸',title:'最佳拍摄',desc:'基督教堂学院庭院拍摄全景'}],
   ['大学','学院','牛津','英国']],
  ['cambridge-colleges','剑桥大学学院','Cambridge Colleges','英国','United Kingdom','剑桥','Cambridge','剑河上的学院与撑篙','🎓 大学城 | 剑河撑篙 | 剑桥地标',
   '剑桥大学以其美丽的学院建筑和剑河撑篙闻名。国王学院的礼拜堂是剑桥最标志性的建筑，其哥特式尖塔高耸入云。康桥是徐志摩笔下最著名的景点。\n\n拍摄建议：从剑河上拍摄学院建筑倒影全景是最经典的角度。日落时分的金色光线照射在学院上格外壮观。从国王学院礼拜堂内部拍摄也很壮观。',
   'Cambridge University is famous for its beautiful college buildings and punting on the River Cam. King\'s College Chapel is Cambridge\'s most iconic building with its Gothic spire.',
   [{icon:'🎓',title:'大学城',desc:'以美丽学院建筑和剑河撑篙闻名'},{icon:'⛪',title:'国王学院',desc:'剑桥最标志性的哥特式建筑'},{icon:'📸',title:'最佳拍摄',desc:'剑河上拍摄学院建筑倒影全景'}],
   ['大学','学院','剑桥','英国']],
  ['cotswolds-village','科茨沃尔德村庄','Cotswolds Village','英国','United Kingdom','格洛斯特','Gloucestershire','英格兰最美丽的蜂蜜色村庄','🏘️ 蜂蜜色村庄 | 英式田园 | 英国地标',
   '科茨沃尔德是英格兰最美丽的乡村地区，以蜂蜜色的石灰岩村庄闻名。拜伯里、卡斯尔顿和斯托昂沃尔德是最受欢迎的村庄。起伏的绿色丘陵和石墙构成了英格兰最经典的田园风光。\n\n拍摄建议：从村庄高处拍摄蜂蜜色房屋全景是最经典的角度。日落时分的金色光线照射在石屋上格外温馨。从田野拍摄村庄与丘陵的组合全景也很壮观。',
   'The Cotswolds is England\'s most beautiful countryside area, famous for honey-colored limestone villages. Bibury, Castle Combe, and Stow-on-the-Wold are the most popular villages.',
   [{icon:'🏘️',title:'蜂蜜色村庄',desc:'英格兰最美丽的乡村地区'},{icon:'🌿',title:'英式田园',desc:'起伏绿色丘陵和石墙'},{icon:'📸',title:'最佳拍摄',desc:'村庄高处拍摄蜂蜜色房屋全景'}],
   ['村庄','田园','科茨沃尔德','英国']],
  ['edinburgh-castle','爱丁堡城堡','Edinburgh Castle','英国','United Kingdom','苏格兰','Scotland','苏格兰天际线的皇家城堡','🏰 皇家城堡 | 死火山岩 | 苏格兰地标',
   '爱丁堡城堡坐落在死火山岩上，是苏格兰最标志性的建筑。城堡俯瞰整个爱丁堡，每年举办全世界最大的军事纹身表演。城堡内的王冠珠宝和命运之石是苏格兰的国宝。\n\n拍摄建议：从卡尔顿山拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从王子街花园拍摄城堡与城市天际线的组合全景也很壮观。',
   'Edinburgh Castle sits on an extinct volcanic rock, Scotland\'s most iconic building. Overlooking the entire city, it hosts the world\'s largest military tattoo. The Crown Jewels and Stone of Destiny are Scotland\'s treasures.',
   [{icon:'🏰',title:'皇家城堡',desc:'苏格兰最标志性的建筑'},{icon:'🌋',title:'死火山岩',desc:'坐落在死火山岩上'},{icon:'📸',title:'最佳拍摄',desc:'卡尔顿山拍摄城堡全景'}],
   ['城堡','皇家','爱丁堡','英国']],
  ['highlands-scotland','苏格兰高地','Scottish Highlands','英国','United Kingdom','苏格兰','Scotland','欧洲最壮丽的荒野风光','🏔️ 荒野 | 峡谷湖泊 | 苏格兰自然',
   '苏格兰高地是欧洲最壮丽的荒野地区，以峡谷、湖泊和山脉闻名。格伦科峡谷是本·尼维斯山和尼斯湖的所在地。高地的荒凉美景是全世界徒步爱好者的梦想目的地。\n\n拍摄建议：从格伦科峡谷拍摄山脉全景是最经典的角度。日落时分的金色光线照射在峡谷上格外壮观。从湖边拍摄高地天际线也很壮观。',
   'The Scottish Highlands are Europe\'s most spectacular wilderness, famous for glens, lochs, and mountains. Glen Coe, Ben Nevis, and Loch Ness are iconic destinations for hikers worldwide.',
   [{icon:'🏔️',title:'荒野',desc:'欧洲最壮丽的荒野地区'},{icon:'🏞️',title:'峡谷湖泊',desc:'格伦科峡谷本尼维斯山尼斯湖'},{icon:'📸',title:'最佳拍摄',desc:'格伦科峡谷拍摄山脉全景'}],
   ['高地','荒野','苏格兰','英国']],
  ['lake-district','湖区','Lake District','英国','United Kingdom','坎布里亚','Cumbria','英格兰最大的国家公园','🏞️ 国家公园 | 湖泊山峰 | 英国自然',
   '湖区是英格兰最大的国家公园，以壮丽的湖泊和山峰闻名。温德米尔湖是英格兰最大的湖泊，斯科菲峰是英格兰最高的山峰。湖区是华兹华斯和毕翠克丝·波特的故乡。\n\n拍摄建议：从温德米尔湖畔拍摄山峰倒影全景是最经典的角度。日落时分的金色光线照射在湖面上格外壮观。从斯科菲峰拍摄湖区全景也很壮观。',
   'The Lake District is England\'s largest national park, famous for stunning lakes and mountains. Windermere is England\'s largest lake, and Scafell Pike is the highest peak.',
   [{icon:'🏞️',title:'国家公园',desc:'英格兰最大的国家公园'},{icon:'🏔️',title:'湖泊山峰',desc:'温德米尔湖英格兰最大湖泊'},{icon:'📸',title:'最佳拍摄',desc:'温德米尔湖畔拍摄山峰倒影全景'}],
   ['湖区','国家公园','坎布里亚','英国']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 421
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
  console.log(`\n共插入 ${items.length} 个英国景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
