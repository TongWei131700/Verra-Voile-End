const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['london-eye','伦敦眼','London Eye','英国','United Kingdom','伦敦','London','泰晤士河畔的巨型观景轮','🎡 观景轮 | 千禧地标 | 伦敦地标',
   '伦敦眼是为千禧年建造的巨型观景轮，高135米，是欧洲最高的观景轮。每个座舱可容纳25人，旋转一圈约30分钟，可以360度俯瞰整个伦敦。\n\n拍摄建议：从泰晤士河南岸拍摄伦敦眼全景是最经典的角度。日落时分的金色光线照射在轮上格外壮观。从威斯敏斯特桥拍摄伦敦眼与大本钟的组合全景也很壮观。',
   'The London Eye is a giant observation wheel built for the Millennium, standing 135 meters tall. Each capsule holds 25 people with a 30-minute rotation offering 360-degree London views.',
   [{icon:'🎡',title:'观景轮',desc:'欧洲最高的观景轮'},{icon:'🏙️',title:'千禧地标',desc:'为千禧年建造高135米'},{icon:'📸',title:'最佳拍摄',desc:'泰晤士河南岸拍摄全景'}],
   ['观景轮','千禧','伦敦','英国']],
  ['trafalgar-square','特拉法加广场','Trafalgar Square','英国','United Kingdom','伦敦','London','伦敦最热闹的城市广场','🏛️ 城市广场 | 纳尔逊柱 | 伦敦地标',
   '特拉法加广场是伦敦最热闹的城市广场，中央的纳尔逊柱高51米，纪念在特拉法加海战中获胜的纳尔逊将军。广场四周的国家美术馆和喷泉构成了伦敦最具代表性的画面。\n\n拍摄建议：从纳尔逊柱底部拍摄广场全景是最经典的角度。日落时分的金色光线照射在喷泉上格外壮观。从国家美术馆台阶拍摄广场也很壮观。',
   'Trafalgar Square is London\'s busiest urban square, with Nelson\'s Column standing 51 meters tall at the center, commemorating Admiral Nelson\'s victory at the Battle of Trafalgar.',
   [{icon:'🏛️',title:'城市广场',desc:'伦敦最热闹的城市广场'},{icon:'🏆',title:'纳尔逊柱',desc:'高51米纪念纳尔逊将军'},{icon:'📸',title:'最佳拍摄',desc:'纳尔逊柱底部拍摄广场全景'}],
   ['广场','纳尔逊','伦敦','英国']],
  ['piccadilly-circus','皮卡迪利广场','Piccadilly Circus','英国','United Kingdom','伦敦','London','伦敦的霓虹灯心脏','💡 霓虹广场 | 城市心脏 | 伦敦地标',
   '皮卡迪利广场是伦敦最具活力的广场，以巨大的LED广告牌和爱神喷泉闻名。广场周围的剧院、商店和餐厅构成了伦敦最繁华的城市画面。\n\n拍摄建议：从广场角落拍摄霓虹灯广告牌全景是最经典的角度。日落时分的金色光线照射在霓虹灯上格外壮观。从高处拍摄广场全景也很壮观。',
   'Piccadilly Circus is London\'s most vibrant square, famous for giant LED billboards and the Eros Fountain. The surrounding theaters, shops, and restaurants create London\'s busiest urban scene.',
   [{icon:'💡',title:'霓虹广场',desc:'伦敦最具活力的广场'},{icon:'🎭',title:'城市心脏',desc:'巨大的LED广告牌和爱神喷泉'},{icon:'📸',title:'最佳拍摄',desc:'广场角落拍摄霓虹灯广告牌全景'}],
   ['霓虹','广场','伦敦','英国']],
  ['notting-hill','诺丁山','Notting Hill','英国','United Kingdom','伦敦','London','彩色房屋的浪漫街区','🏘️ 彩色房屋 | 浪漫街区 | 伦敦地标',
   '诺丁山是伦敦最浪漫的街区，以波特贝罗路的彩色房屋和古董市场闻名。每年的诺丁山嘉年华是欧洲最大的街头嘉年华。电影《诺丁山》让这个街区闻名全世界。\n\n拍摄建议：从兰开斯特路拍摄彩色房屋全景是最经典的角度。日落时分的金色光线照射在彩色房屋上格外温馨。从波特贝罗路拍摄市场街景也很壮观。',
   'Notting Hill is London\'s most romantic neighborhood, famous for Portobello Road\'s colorful houses and antique market. The annual Notting Hill Carnival is Europe\'s largest street festival.',
   [{icon:'🏘️',title:'彩色房屋',desc:'伦敦最浪漫的街区'},{icon:'🎪',title:'嘉年华',desc:'欧洲最大的街头嘉年华'},{icon:'📸',title:'最佳拍摄',desc:'兰开斯特路拍摄彩色房屋全景'}],
   ['彩色','浪漫','伦敦','英国']],
  ['regents-park','摄政公园','Regent\'s Park','英国','United Kingdom','伦敦','London','伦敦最美丽的皇家公园','🌹 皇家公园 | 玫瑰花园 | 伦敦地标',
   '摄政公园是伦敦最美丽的皇家公园之一，以玛丽皇后玫瑰花园闻名。公园内还有伦敦动物园和摄政运河。花园的玫瑰在夏季盛开，是伦敦最浪漫的场景之一。\n\n拍摄建议：从玫瑰花园拍摄花卉全景是最经典的角度。日落时分的金色光线照射在玫瑰上格外壮观。从公园高处拍摄伦敦天际线也很壮观。',
   'Regent\'s Park is one of London\'s most beautiful Royal Parks, famous for the Queen Mary\'s Rose Garden. The park also houses London Zoo and Regent\'s Canal.',
   [{icon:'🌹',title:'皇家公园',desc:'伦敦最美丽的皇家公园'},{icon:'🌺',title:'玫瑰花园',desc:'玛丽皇后玫瑰花园闻名'},{icon:'📸',title:'最佳拍摄',desc:'玫瑰花园拍摄花卉全景'}],
   ['公园','玫瑰','伦敦','英国']],
  ['richmond-park','里士满公园','Richmond Park','英国','United Kingdom','伦敦','London','野生鹿群的皇家猎鹿苑','🦌 皇家猎苑 | 野生鹿群 | 伦敦地标',
   '里士满公园是伦敦最大的皇家公园，以超过600头野生鹿群闻名。公园自17世纪以来一直是皇家猎鹿苑，保持着原始的自然风貌。秋季的红叶和鹿群是伦敦最壮观的自然画面。\n\n拍摄建议：从公园内拍摄鹿群与森林的全景是最经典的角度。日落时分的金色光线照射在鹿群上格外壮观。从山顶拍摄伦敦天际线也很壮观。',
   'Richmond Park is London\'s largest Royal Park, famous for over 600 wild deer. The park has been a royal deer hunting ground since the 17th century, maintaining its pristine natural landscape.',
   [{icon:'🦌',title:'皇家猎苑',desc:'伦敦最大的皇家公园'},{icon:'🌳',title:'野生鹿群',desc:'超过600头野生鹿群'},{icon:'📸',title:'最佳拍摄',desc:'公园内拍摄鹿群森林全景'}],
   ['公园','鹿群','伦敦','英国']],
  ['greenwich-observatory','格林威治天文台','Royal Observatory Greenwich','英国','United Kingdom','伦敦','London','本初子午线的起点','🔭 天文台 | 本初子午线 | 伦敦地标',
   '格林威治天文台是本初子午线的起点，也是格林威治标准时间的定义地。天文台坐落在格林威治公园的山丘上，可以俯瞰泰晤士河和伦敦天际线。\n\n拍摄建议：从本初子午线拍摄天文台全景是最经典的角度。日落时分的金色光线照射在天文台上格外壮观。从山丘拍摄泰晤士河和伦敦天际线也很壮观。',
   'The Royal Observatory Greenwich is the starting point of the Prime Meridian and the definition of Greenwich Mean Time. Perched on a hill in Greenwich Park with views of the Thames and London skyline.',
   [{icon:'🔭',title:'天文台',desc:'本初子午线的起点'},{icon:'🌍',title:'格林威治时间',desc:'格林威治标准时间的定义地'},{icon:'📸',title:'最佳拍摄',desc:'本初子午线拍摄天文台全景'}],
   ['天文台','本初子午线','伦敦','英国']],
  ['kensington-palace','肯辛顿宫','Kensington Palace','英国','United Kingdom','伦敦','London','戴安娜王妃的故居','🏰 皇家宫殿 | 戴安娜故居 | 伦敦地标',
   '肯辛顿宫是戴安娜王妃的故居，自17世纪以来一直是英国皇室的居所。宫殿的花园是伦敦最美丽的花园之一，阳光花园是纪念戴安娜王妃的场所。\n\n拍摄建议：从宫殿前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在宫殿上格外壮观。从花园拍摄宫殿与花卉的组合全景也很壮观。',
   'Kensington Palace was the former home of Princess Diana and has been a royal residence since the 17th century. The palace gardens are among London\'s most beautiful.',
   [{icon:'🏰',title:'皇家宫殿',desc:'戴安娜王妃的故居'},{icon:'🌺',title:'花园',desc:'伦敦最美丽的花园之一'},{icon:'📸',title:'最佳拍摄',desc:'宫殿前方拍摄完整建筑全景'}],
   ['宫殿','戴安娜','伦敦','英国']],
  ['windsor-castle','温莎城堡','Windsor Castle','英国','United Kingdom','伯克郡','Berkshire','全世界最大的有人居住城堡','🏰 皇家城堡 | 世界最大 | 英国地标',
   '温莎城堡是全世界最大的有人居住的城堡，占地超过5公顷。城堡始建于11世纪，是英国女王最喜爱的周末居所。卫兵换岗仪式是城堡最受欢迎的活动。\n\n拍摄建议：从长步道拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从温莎大桥拍摄城堡与泰晤士河的组合全景也很壮观。',
   'Windsor Castle is the world\'s largest occupied castle, covering over 5 hectares. Built in the 11th century, it\'s the Queen\'s favorite weekend residence.',
   [{icon:'🏰',title:'皇家城堡',desc:'全世界最大的有人居住城堡'},{icon:'🏛️',title:'11世纪',desc:'始建于11世纪占地5公顷'},{icon:'📸',title:'最佳拍摄',desc:'长步道拍摄城堡全景'}],
   ['城堡','皇家','温莎','英国']],
  ['canterbury-cathedral','坎特伯雷大教堂','Canterbury Cathedral','英国','United Kingdom','肯特','Kent','英国基督教的母堂','⛪ 母堂 | 世界遗产 | 坎特伯雷地标',
   '坎特伯雷大教堂是英国基督教的母堂，也是全世界圣公会的精神中心。教堂始建于597年，是英国最古老的基督教建筑之一。1988年被列为世界遗产。\n\n拍摄建议：从教堂前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从教堂内部拍摄彩色玻璃窗也很壮观。',
   'Canterbury Cathedral is the Mother Church of the Anglican Communion and the spiritual center of the worldwide Anglican Church. Built in 597 AD, one of England\'s oldest Christian buildings.',
   [{icon:'⛪',title:'母堂',desc:'英国基督教的母堂'},{icon:'🏆',title:'世界遗产',desc:'1988年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'教堂前方拍摄完整建筑全景'}],
   ['教堂','世界遗产','坎特伯雷','英国']],
  ['york-minster','约克大教堂','York Minster','英国','United Kingdom','约克郡','Yorkshire','北欧最大的哥特式教堂','⛪ 哥特大教堂 | 北欧最大 | 约克地标',
   '约克大教堂是北欧最大的哥特式教堂之一，也是英国最大的中世纪教堂。教堂的彩色玻璃窗全世界最大，其中"约克之窗"建于14世纪。\n\n拍摄建议：从教堂前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在哥特式尖塔上格外壮观。从城墙拍摄教堂与城市天际线的组合全景也很壮观。',
   'York Minster is one of Northern Europe\'s largest Gothic cathedrals and England\'s largest medieval church. Houses the world\'s largest expanse of stained glass.',
   [{icon:'⛪',title:'哥特大教堂',desc:'北欧最大的哥特式教堂'},{icon:'🎨',title:'彩色玻璃',desc:'全世界最大的中世纪彩色玻璃'},{icon:'📸',title:'最佳拍摄',desc:'教堂前方拍摄完整建筑全景'}],
   ['教堂','哥特','约克','英国']],
  ['white-cliffs-dover','多佛白崖','White Cliffs of Dover','英国','United Kingdom','肯特','Kent','英国的白色象征','🏖️ 白色悬崖 | 英吉利海峡 | 英国地标',
   '多佛白崖是英国最著名的自然景观之一，白色的石灰岩悬崖面对英吉利海峡，是乘船抵达英国时最先看到的景象。悬崖高110米，在阳光照射下闪闪发光。\n\n拍摄建议：从悬崖顶部拍摄海峡全景是最经典的角度。日落时分的金色光线照射在白色悬崖上格外壮观。从海面拍摄悬崖全景也很壮观。',
   'The White Cliffs of Dover are one of Britain\'s most famous natural landmarks, white limestone cliffs facing the English Channel. Standing 110 meters high, they gleam in sunlight.',
   [{icon:'🏖️',title:'白色悬崖',desc:'英国最著名的自然景观'},{icon:'🌊',title:'英吉利海峡',desc:'白色石灰岩面对英吉利海峡'},{icon:'📸',title:'最佳拍摄',desc:'悬崖顶部拍摄海峡全景'}],
   ['悬崖','海岸','多佛','英国']],
  ['brighton-pavilion','布莱顿皇家行宫','Royal Pavilion Brighton','英国','United Kingdom','东萨塞克斯','East Sussex','异域风情的海滨皇宫','🏰 异域皇宫 | 印度风格 | 布莱顿地标',
   '布莱顿皇家行宫是英国最奇特的建筑之一，外观呈印度-伊斯兰风格，内部装饰极尽奢华。行宫由乔治四世建于18世纪，是摄政时期建筑的杰作。\n\n拍摄建议：从行宫前方拍摄完整建筑全景是最经典的角度。日落时分的金色光线照射在圆顶上格外壮观。从布莱顿海滩拍摄行宫与海洋的组合全景也很壮观。',
   'The Royal Pavilion Brighton is one of Britain\'s most unusual buildings, with Indian-Islamic exterior and lavish interiors. Built by George IV in the 18th century.',
   [{icon:'🏰',title:'异域皇宫',desc:'英国最奇特的建筑'},{icon:'🕌',title:'印度风格',desc:'印度-伊斯兰风格外观'},{icon:'📸',title:'最佳拍摄',desc:'行宫前方拍摄完整建筑全景'}],
   ['宫殿','异域','布莱顿','英国']],
  ['st-ives-cornwall','圣艾夫斯','St Ives Cornwall','英国','United Kingdom','康沃尔','Cornwall','康沃尔的艺术家海滨小镇','🏖️ 海滨小镇 | 艺术家聚集 | 康沃尔地标',
   '圣艾夫斯是康沃尔最美丽的海滨小镇，以艺术家社区和泰特美术馆闻名。小镇的海滩和港湾是康沃尔最迷人的画面。泰特美术馆是英国最重要的现代艺术分馆。\n\n拍摄建议：从港湾拍摄彩色房屋全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从海滩拍摄小镇天际线也很壮观。',
   'St Ives is Cornwall\'s most beautiful seaside town, famous for its artist community and Tate Gallery. The beaches and harbor are Cornwall\'s most charming scenes.',
   [{icon:'🏖️',title:'海滨小镇',desc:'康沃尔最美丽的海滨小镇'},{icon:'🎨',title:'艺术家',desc:'以艺术家社区和泰特美术馆闻名'},{icon:'📸',title:'最佳拍摄',desc:'港湾拍摄彩色房屋全景'}],
   ['海滨','艺术家','康沃尔','英国']],
  ['durham-cathedral','达勒姆大教堂','Durham Cathedral','英国','United Kingdom','达勒姆','Durham','诺曼式建筑的巅峰之作','⛪ 诺曼教堂 | 世界遗产 | 达勒姆地标',
   '达勒姆大教堂是诺曼式建筑的巅峰之作，建于1093年。教堂与旁边的达勒姆城堡一起被列为世界遗产。教堂的尖拱和肋状穹顶开创了哥特式建筑的先河。\n\n拍摄建议：从威尔河对岸拍摄大教堂与城堡的组合全景是最经典的角度。日落时分的金色光线照射在教堂上格外壮观。从教堂内部拍摄穹顶也很壮观。',
   'Durham Cathedral is the pinnacle of Norman architecture, built in 1093. Together with Durham Castle, it\'s a UNESCO World Heritage Site. Its pointed arches pioneered Gothic architecture.',
   [{icon:'⛪',title:'诺曼教堂',desc:'诺曼式建筑的巅峰之作'},{icon:'🏆',title:'世界遗产',desc:'与达勒姆城堡一起列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'威尔河对岸拍摄大教堂城堡全景'}],
   ['教堂','诺曼','达勒姆','英国']],
  ['isle-of-skye','天空岛','Isle of Skye','英国','United Kingdom','苏格兰','Scotland','全世界最壮丽的岛屿之一','🏝️ 壮丽岛屿 | 苏格兰明珠 | 苏格兰地标',
   '天空岛是苏格兰最壮丽的岛屿，以崎岖的山脉、瀑布和海岸线闻名。老人峰和仙女谷是岛上最著名的景点。岛上的自然风光是全世界摄影师的梦想目的地。\n\n拍摄建议：从仙女谷拍摄山脉全景是最经典的角度。日落时分的金色光线照射在山脉上格外壮观。从老人峰拍摄岛屿天际线也很壮观。',
   'The Isle of Skye is Scotland\'s most spectacular island, famous for rugged mountains, waterfalls, and coastline. The Old Man of Storr and Fairy Glen are the island\'s most famous attractions.',
   [{icon:'🏝️',title:'壮丽岛屿',desc:'苏格兰最壮丽的岛屿'},{icon:'🏔️',title:'山脉',desc:'崎岖的山脉瀑布和海岸线'},{icon:'📸',title:'最佳拍摄',desc:'仙女谷拍摄山脉全景'}],
   ['岛屿','山脉','苏格兰','英国']],
  ['eilean-donan-castle','艾琳多南城堡','Eilean Donan Castle','英国','United Kingdom','苏格兰','Scotland','苏格兰上镜率最高的城堡','🏰 湖中城堡 | 苏格兰最上镜 | 苏格兰地标',
   '艾琳多南城堡坐落在三个湖泊交汇的岛屿上，是苏格兰上镜率最高的城堡。城堡始建于13世纪，经过多次修复。城堡的倒影在水面上形成了完美的画面。\n\n拍摄建议：从湖岸拍摄城堡与倒影的全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从远处拍摄城堡与山脉的组合全景也很壮观。',
   'Eilean Donan Castle sits on an island where three lochs meet, Scotland\'s most photographed castle. Built in the 13th century, its reflection creates a perfect image on the water.',
   [{icon:'🏰',title:'湖中城堡',desc:'苏格兰上镜率最高的城堡'},{icon:'🏛️',title:'13世纪',desc:'始建于13世纪多次修复'},{icon:'📸',title:'最佳拍摄',desc:'湖岸拍摄城堡倒影全景'}],
   ['城堡','湖中','苏格兰','英国']],
  ['snowdonia-wales','斯诺登尼亚','Snowdonia National Park','英国','United Kingdom','威尔士','Wales','威尔士最高的山峰','🏔️ 国家公园 | 威尔士最高峰 | 威尔士地标',
   '斯诺登尼亚国家公园以斯诺登山（1085米）为核心，是威尔士最壮丽的自然景观。公园的冰川湖泊、瀑布和山脉是徒步的天堂。斯诺登山铁路是英国唯一的齿轮火车。\n\n拍摄建议：从斯诺登山顶拍摄威尔士全景是最经典的角度。日落时分的金色光线照射在山脉上格外壮观。从湖泊拍摄山脉倒影全景也很壮观。',
   'Snowdonia National Park centers on Mount Snowdon (1,085m), Wales\' most spectacular natural landscape. Glacial lakes, waterfalls, and mountains are a hiker\'s paradise.',
   [{icon:'🏔️',title:'国家公园',desc:'以斯诺登山为核心的壮丽景观'},{icon:'⛰️',title:'1085米',desc:'威尔士最高峰'},{icon:'📸',title:'最佳拍摄',desc:'斯诺登山顶拍摄威尔士全景'}],
   ['山脉','国家公园','威尔士','英国']],
  ['glenfinnan-viaduct','格伦芬南高架桥','Glenfinnan Viaduct','英国','United Kingdom','苏格兰','Scotland','哈利波特电影中的标志性铁路桥','🚂 铁路桥 | 哈利波特 | 苏格兰地标',
   '格伦芬南高架桥是苏格兰最著名的铁路桥，因作为哈利波特电影中霍格沃茨特快列车的取景地而闻名全世界。高架桥跨越芬南河谷，21个拱门构成了壮观的画面。\n\n拍摄建议：从河谷对面拍摄高架桥全景是最经典的角度。日落时分的金色光线照射在桥拱上格外壮观。从蒸汽火车上拍摄河谷全景也很壮观。',
   'The Glenfinnan Viaduct is Scotland\'s most famous railway bridge, world-famous as the Hogwarts Express scene in Harry Potter films. The 21 arches span the Finnan Valley.',
   [{icon:'🚂',title:'铁路桥',desc:'苏格兰最著名的铁路桥'},{icon:'🎬',title:'哈利波特',desc:'霍格沃茨特快列车取景地'},{icon:'📸',title:'最佳拍摄',desc:'河谷对面拍摄高架桥全景'}],
   ['铁路桥','哈利波特','苏格兰','英国']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 436
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
  console.log(`\n共插入 ${items.length} 个英国补充景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
