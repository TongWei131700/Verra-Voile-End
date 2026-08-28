const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['dresden-frauenkirche','德累斯顿圣母教堂','Dresden Frauenkirche','德国','Germany','德累斯顿','Dresden','巴洛克建筑的重生奇迹','⛪ 二战废墟重建 | 和平象征 | 巴洛克穹顶',
   '德累斯顿圣母教堂是巴洛克式新教教堂的杰作，其巨大的石质穹顶是阿尔卑斯山以北最大的。教堂在二战中被完全炸毁，废墟在冷战期间被保留作为战争纪念。两德统一后，教堂按照原始设计精确重建，成为和平与和解的象征。重建使用了大量原始石材，新旧石材的颜色差异清晰可见。\n\n拍摄建议：从宫廷教堂方向拍摄教堂穹顶和德累斯顿老城全景是最经典的角度。教堂内部的金白色调令人震撼。登穹顶可以俯瞰德累斯顿全城和易北河。',
   'The Dresden Frauenkirche is a Baroque Protestant church masterpiece with the largest stone dome north of the Alps. Completely destroyed in WWII, its ruins were preserved as a war memorial until reunification, when it was precisely reconstructed as a symbol of peace.',
   [{icon:'⛪',title:'巴洛克穹顶',desc:'阿尔卑斯山以北最大'},{icon:'🕊️',title:'和平象征',desc:'二战废墟精确重建'},{icon:'📸',title:'最佳拍摄',desc:'穹顶俯瞰全城与易北河'}],
   ['教堂','巴洛克','和平','重建']],
  ['dresden-zwinger','茨温格宫','Dresden Zwinger','德国','Germany','德累斯顿','Dresden','德国最华丽的巴洛克宫殿群','🏰 巴洛克花园宫殿 | 数学物理沙龙 | 瓷器收藏',
   '茨温格宫是德国最华丽的巴洛克世俗建筑群，由花园、亭阁和画廊组成一个精美的对称式宫殿群。宫殿内部设有老大师画廊，收藏着拉斐尔的《西斯廷圣母》等杰作。瓷器收藏馆展示了迈森瓷器的精美工艺。宫殿周围的巴洛克花园、喷泉和雕塑群构成了德累斯顿最优雅的城市空间。\n\n拍摄建议：从花园中轴线拍摄宫殿群的对称全景是最经典的角度。秋季花园中的金色落叶和喷泉构成完美画面。宫殿建筑上的雕塑和浮雕细节也值得细拍。',
   'The Dresden Zwinger is Germany\'s most splendid Baroque secular complex, a symmetrical ensemble of gardens, pavilions, and galleries. It houses the Old Masters Gallery with Raphael\'s "Sistine Madonna" and a porcelain collection.',
   [{icon:'🏰',title:'巴洛克杰作',desc:'德国最华丽宫殿群'},{icon:'🎨',title:'西斯廷圣母',desc:'老大师画廊珍藏'},{icon:'📸',title:'最佳拍摄',desc:'花园中轴线对称全景'}],
   ['宫殿','巴洛克','博物馆','花园']],
  ['hamburg-speicherstadt','汉堡仓库城','Hamburg Speicherstadt','德国','Germany','汉堡','Hamburg','世界最大的仓库城区群','🏗️ 红砖哥特式仓库群 | 世界遗产 | 运河交织',
   '汉堡仓库城是世界上最大的连续仓库城区群，被联合国教科文组织列为世界遗产。这片建于19世纪末的红砖哥特式建筑群沿着运河两岸延伸，尖塔、拱桥和吊桥连接着各个仓库。如今许多仓库已改造为博物馆、办公室和公寓，但建筑外观保持着原始的历史风貌。仓库城与附近的港口城共同构成了汉堡最具特色的城市景观。\n\n拍摄建议：从运河对岸拍摄红砖仓库群的倒影是最经典的角度。傍晚至夜间，仓库城的灯光照明和水面倒影格外迷人。附近的微缩景观世界(Wunderland)也是热门的参观目的地。',
   'Hamburg\'s Speicherstadt is the world\'s largest contiguous warehouse district, a UNESCO World Heritage site. This 19th-century red-brick Gothic complex stretches along canals, with spires, arches, and drawbridges connecting the warehouses.',
   [{icon:'🏗️',title:'世界最大',desc:'连续仓库城区群'},{icon:'🏆',title:'世界遗产',desc:'红砖哥特式建筑群'},{icon:'📸',title:'最佳拍摄',desc:'运河对岸红砖倒影'}],
   ['仓库城','世界遗产','红砖','汉堡']],
  ['rhine-valley','莱茵河谷','Rhine Valley','德国','Germany','莱茵兰','Rhineland','欧洲最浪漫的河谷风光','🏰 古堡密布的河谷 | 世界遗产 | 葡萄酒梯田',
   '莱茵河谷中段从宾根到科布伦茨的65公里河段是莱茵河最壮美的部分，被联合国教科文组织列为世界遗产。两岸密布着40多座古堡和宫殿、葡萄园梯田和迷人的小镇。游船从河面上可以欣赏到两岸连绵不断的城堡废墟和山顶要塞。这里是德国浪漫主义的发源地之一，无数诗人和画家在此获得灵感。\n\n拍摄建议：乘坐游船从河面上拍摄两岸古堡和悬崖是最经典的方式。从山顶的城堡俯瞰莱茵河S弯和葡萄园全景同样壮观。秋季葡萄园的金色色调最为迷人。',
   'The Middle Rhine Valley, 65km from Bingen to Koblenz, is the most spectacular stretch of the Rhine, a UNESCO World Heritage site. Over 40 castles and palaces line both banks, with vineyard terraces and charming villages.',
   [{icon:'🏰',title:'40座古堡',desc:'两岸密布的城堡群'},{icon:'🏆',title:'世界遗产',desc:'65公里壮美河段'},{icon:'📸',title:'最佳拍摄',desc:'游船上拍摄两岸古堡'}],
   ['河谷','世界遗产','古堡','葡萄酒']],
  ['lorelei-rock','罗蕾莱岩','Lorelei Rock','德国','Germany','莱茵兰','Rhineland','莱茵河畔的传说之岩','🪨 132米悬崖 | 海涅诗歌闻名 | 莱茵河最窄处',
   '罗蕾莱岩是莱茵河畔一座132米高的石灰岩悬崖，因海涅的同名诗歌而闻名于世。传说一位名叫罗蕾莱的美丽女妖坐在岩石上唱着动人的歌，引诱船夫偏离航向触礁沉没。这里是莱茵河最窄、水流最急的河段，也是莱茵河谷最壮观的景观之一。从岩顶可以俯瞰莱茵河S弯和两岸的葡萄园。\n\n拍摄建议：从河面上或对岸拍摄罗蕾莱岩和莱茵河S弯的组合全景是最经典的角度。岩顶的观景台可以拍摄到壮观的河谷全景。秋季葡萄园的金色与河水的碧蓝形成鲜明对比。',
   'The Lorelei Rock is a 132-meter limestone cliff on the Rhine, immortalized by Heinrich Heine\'s famous poem. Legend tells of a beautiful siren who lured boatmen to their doom. It marks the narrowest, fastest-flowing section of the Rhine.',
   [{icon:'🪨',title:'132米悬崖',desc:'莱茵河最壮观景观'},{icon:'📜',title:'海涅诗歌',desc:'罗蕾莱传说闻名世界'},{icon:'📸',title:'最佳拍摄',desc:'河面拍摄S弯全景'}],
   ['悬崖','传说','莱茵河','诗歌']],
  ['mosel-valley','摩泽尔河谷','Mosel Valley','德国','Germany','莱茵兰','Rhineland','德国最蜿蜒的葡萄酒之路','🍷 蛇形河道与葡萄园 | 雷司令白葡萄酒 | 童话小镇',
   '摩泽尔河谷是德国最迷人的葡萄酒产区，以蜿蜒曲折的河道和陡峭的葡萄园梯田闻名。从科布伦茨到特里尔的河段两岸分布着无数葡萄酒小镇，其中科赫姆和贝恩卡斯特尔最为著名。这里是世界顶级雷司令白葡萄酒的故乡，陡峭的板岩山坡为葡萄提供了最佳的日照和排水条件。\n\n拍摄建议：从山顶的城堡或观景台拍摄摩泽尔河S弯和两岸葡萄园是最经典的构图。科赫姆的小镇全景和贝恩卡斯特尔的半木结构房屋也很上镜。秋季葡萄园变色时最为壮观。',
   'The Mosel Valley is Germany\'s most enchanting wine region, famous for its winding river and steep vineyard terraces. From Koblenz to Trier, countless wine towns line the banks, with Cochem and Bernkastel being the most charming.',
   [{icon:'🍷',title:'雷司令故乡',desc:'世界顶级白葡萄酒产区'},{icon:'🏘️',title:'葡萄酒小镇',desc:'科赫姆与贝恩卡斯特尔'},{icon:'📸',title:'最佳拍摄',desc:'山顶拍摄S弯与梯田'}],
   ['河谷','葡萄酒','雷司令','田园']],
  ['wurzburg-residence','维尔茨堡宫','Wurzburg Residence','德国','Germany','巴伐利亚','Bavaria','南德最华丽的主教宫殿','🏰 巴洛克宫殿杰作 | 世界最大天顶壁画 | 世界遗产',
   '维尔茨堡宫是德国最华丽的巴洛克宫殿之一，被联合国教科文组织列为世界遗产。宫殿最精华的部分是皇帝厅和巨大的楼梯厅，天花板上覆盖着世界最大的天顶壁画，由威尼斯画家提埃坡罗创作。宫殿的花园同样是巴洛克园林艺术的杰作，对称的花坛和喷泉构成完美的几何图案。\n\n拍摄建议：楼梯厅的天顶壁画是最震撼的室内景观，仰拍可以展现壁画的完整规模。宫殿正面的对称构图和花园全景也很壮观。建议预留2小时参观，宫殿内部装饰极为丰富。',
   'The Wurzburg Residence is one of Germany\'s most splendid Baroque palaces, a UNESCO World Heritage site. Its highlight is the Imperial Hall and Grand Staircase, topped by the world\'s largest ceiling fresco by Venetian painter Tiepolo.',
   [{icon:'🏰',title:'巴洛克杰作',desc:'南德最华丽主教宫殿'},{icon:'🎨',title:'最大天顶壁画',desc:'提埃坡罗创作'},{icon:'📸',title:'最佳拍摄',desc:'楼梯厅天顶壁画仰拍'}],
   ['宫殿','世界遗产','巴洛克','壁画']],
  ['regensburg-old-town','雷根斯堡老城','Regensburg Old Town','德国','Germany','巴伐利亚','Bavaria','多瑙河畔的中世纪奇迹','🏰 保存最完好的中世纪老城 | 石桥奇迹 | 世界遗产',
   '雷根斯堡老城是德国保存最完好的中世纪城市之一，被联合国教科文组织列为世界遗产。老城完整保留了约1000座历史建筑，从中世纪塔楼到哥特式教堂，从罗马遗迹到巴洛克宫殿。最著名的地标是12世纪的石桥，被誉为中世纪世界八大奇迹之一。老城的香肠厨房(Wurstkuchl)被认为是世界上最古老的餐厅之一，自12世纪营业至今。\n\n拍摄建议：从多瑙河对岸拍摄石桥和老城天际线是最经典的角度。石桥和旁边的主教座堂构成完美的画面。漫步老城的小巷可以发现无数惊喜，每一座塔楼和每一栋房屋都有独特的故事。',
   'Regensburg\'s Old Town is one of Germany\'s best-preserved medieval cities, a UNESCO World Heritage site with 1,000+ historic buildings. The 12th-century Stone Bridge is considered one of the eight wonders of the medieval world.',
   [{icon:'🏘️',title:'千年老城',desc:'1000座历史建筑完好'},{icon:'🌉',title:'石桥奇迹',desc:'12世纪中世纪八大奇迹'},{icon:'📸',title:'最佳拍摄',desc:'多瑙河对岸石桥全景'}],
   ['古城','世界遗产','中世纪','多瑙河']],
  ['aachen-cathedral','亚琛大教堂','Aachen Cathedral','德国','Germany','亚琛','Aachen','查理曼大帝的帝国教堂','⛪ 德国最古老教堂 | 查理曼宝座 | 世界遗产之首',
   '亚琛大教堂是德国最古老的教堂，也是第一个被联合国教科文组织列为世界遗产的地点(1978年)。教堂由查理曼大帝于公元800年前后下令建造，其八角形穹顶是加洛林建筑的杰作。内部的查理曼宝座曾是神圣罗马帝国皇帝加冕的座位。教堂的宝库收藏着基督教最珍贵的圣物之一。\n\n拍摄建议：从教堂前的广场拍摄正面全景是最经典的角度。八角形穹顶的内部结构令人叹为观止。教堂的青铜大门和希腊柱等古代元素也值得细拍。',
   'Aachen Cathedral is Germany\'s oldest church and the first UNESCO World Heritage site (1978). Built by Charlemagne around 800 AD, its octagonal dome is a masterpiece of Carolingian architecture. The throne of Charlemagne was used for Holy Roman Emperor coronations.',
   [{icon:'⛪',title:'德国最古老',desc:'公元800年查理曼建造'},{icon:'👑',title:'查理曼宝座',desc:'神圣罗马帝国加冕地'},{icon:'📸',title:'最佳拍摄',desc:'广场正面与穹顶内部'}],
   ['教堂','世界遗产','查理曼','加洛林']],
  ['trier-porta-nigra','特里尔黑门','Trier Porta Nigra','德国','Germany','特里尔','Trier','德国最古老的城门','🏛️ 罗马时代城门 | 德国最古老建筑 | 世界遗产',
   '特里尔黑门是德国现存最古老的建筑，也是阿尔卑斯山以北保存最完好的罗马时代城门。建于公元170年，这座巨大的黑色砂岩城门重达数吨的石块之间没有使用任何灰浆，完全依靠铁夹固定。中世纪时被改建为教堂，反而因此得到了保护。特里尔整座城市都充满了罗马遗迹，被称为"北方的罗马"。\n\n拍摄建议：从城门广场正面拍摄黑门的完整立面是最经典的角度。巨大的石块和铁夹痕迹值得特写。附近的集市广场和主教座堂也是重要的取景地。',
   'The Porta Nigra of Trier is Germany\'s oldest building and the best-preserved Roman city gate north of the Alps. Built in 170 AD, this massive black sandstone gate was held together by iron clamps without any mortar.',
   [{icon:'🏛️',title:'最古老建筑',desc:'公元170年罗马城门'},{icon:'🏆',title:'世界遗产',desc:'阿尔卑斯山以北之最'},{icon:'📸',title:'最佳拍摄',desc:'正面完整立面取景'}],
   ['古迹','世界遗产','罗马','城门']],
  ['rugen-cliffs','吕根岛白崖','Rügen Cliffs','德国','Germany','梅克伦堡','Mecklenburg','波罗的海的白色悬崖奇观','🪨 白垩岩悬崖 | 卡斯帕 Friedrich名画 | 波罗的海',
   '吕根岛白崖是德国最壮观的自然景观之一，高耸的白色白垩岩悬崖矗立在波罗的海碧蓝的海水之上。卡斯帕·大卫·弗里德里希的名画《吕根岛的白崖》使这些悬崖闻名于世。悬崖被茂密的山毛榉林覆盖，这些古老的森林也是世界遗产的一部分。从悬崖顶部的观景台可以俯瞰波罗的海的壮阔全景。\n\n拍摄建议：从维多利亚观景台拍摄白崖与波罗的海的组合全景是最经典的角度。清晨的薄雾和海面上的日出光线最能展现白崖的纯净美感。悬崖下方的海滩也可以拍摄到仰视角度。',
   'The white chalk cliffs of Rügen are Germany\'s most spectacular natural scenery, towering white cliffs above the azure Baltic Sea. Made famous by Caspar David Friedrich\'s painting, they are covered by ancient beech forests, also a World Heritage site.',
   [{icon:'🪨',title:'白色悬崖',desc:'波罗的海白垩岩奇观'},{icon:'🎨',title:'名画灵感',desc:'弗里德里希经典之作'},{icon:'📸',title:'最佳拍摄',desc:'维多利亚观景台全景'}],
   ['悬崖','自然','波罗的海','世界遗产']],
  ['zugspitze','楚格峰','Zugspitze','德国','Germany','巴伐利亚','Bavaria','德国最高峰','🏔️ 2962米德国之巅 | 三条冰川 | 四国全景',
   '楚格峰海拔2962米，是德国的最高峰，位于巴伐利亚阿尔卑斯山脉中。山顶可以同时看到德国、奥地利、意大利和瑞士四个国家的领土。乘坐齿轮火车和缆车可以到达山顶，360度的全景令人震撼。山顶的三座冰川——北冰川、南冰川和霍伦特冰川——是冬季运动的天堂。\n\n拍摄建议：从山顶平台拍摄四国全景是最壮观的体验。天气晴朗时可以远眺200公里。冰川和周围的山峰构成完美的阿尔卑斯画面。日出和日落时分的光线最为壮观。',
   'Zugspitze at 2,962 meters is Germany\'s highest peak in the Bavarian Alps. From the summit, you can see four countries—Germany, Austria, Italy, and Switzerland. Three glaciers and 360-degree panoramic views await at the top.',
   [{icon:'🏔️',title:'德国之巅',desc:'2962米最高峰'},{icon:'🌍',title:'四国全景',desc:'德奥意瑞尽收眼底'},{icon:'📸',title:'最佳拍摄',desc:'山顶360度全景'}],
   ['山岳','阿尔卑斯','冰川','德国之巅']],
  ['konigssee','国王湖','Konigssee','德国','Germany','巴伐利亚','Bavaria','阿尔卑斯山的翡翠明珠','🏔️ 冰川湖泊 | 翡翠色湖水 | 圣巴多罗买教堂',
   '国王湖是德国最深、最清澈的冰川湖之一，翡翠色的湖水被陡峭的山壁环绕，宛如一面巨大的镜子镶嵌在阿尔卑斯山中。湖面上最著名的景观是圣巴多罗买教堂——一座矗立在湖边的红色穹顶小教堂，只能乘船到达。电动船在湖面上行驶时，船夫会吹响小号，回声在山壁间回荡，是国王湖最独特的体验。\n\n拍摄建议：乘船到圣巴多罗买教堂后，从湖边拍摄红色穹顶教堂与碧绿湖水的经典画面。继续乘船到湖的南端可以到达上湖(Obersee)，那里更加原始宁静。秋季湖畔的金色森林最为迷人。',
   'Konigssee is one of Germany\'s deepest and clearest glacial lakes, its emerald waters surrounded by steep cliffs like a giant mirror in the Alps. The iconic St. Bartholomä church with its red domes can only be reached by boat.',
   [{icon:'🏔️',title:'冰川湖泊',desc:'德国最深最清冰川湖'},{icon:'⛪',title:'水上教堂',desc:'圣巴多罗买红色穹顶'},{icon:'📸',title:'最佳拍摄',desc:'教堂与碧绿湖水经典画面'}],
   ['湖泊','冰川','阿尔卑斯','自然']],
  ['bamberg-cathedral','班贝格大教堂','Bamberg Cathedral','德国','Germany','巴伐利亚','Bavaria','四座尖塔下的千年主教座堂','⛪ 四座尖塔 | 班贝格骑士雕像 | 罗马式与哥特式融合',
   '班贝格大教堂是德国最重要的中世纪教堂之一，融合了罗马式和哥特式建筑风格。教堂的四座尖塔是班贝格天际线最醒目的标志。教堂内最著名的艺术品是"班贝格骑士"——欧洲中世纪最重要的骑马雕像之一，其身份至今仍是谜。教堂还保存着教皇克莱门特二世的陵墓，是唯一葬在阿尔卑斯山以北的教皇。\n\n拍摄建议：从新宫殿的露台拍摄教堂四座尖塔和老城屋顶的全景是最经典的角度。教堂内部的班贝格骑士雕像值得细拍。清晨和傍晚的光线最适合拍摄教堂外观。',
   'Bamberg Cathedral is one of Germany\'s most important medieval churches, blending Romanesque and Gothic styles. Its four towers dominate the skyline. The famous Bamberg Horseman is one of Europe\'s most important medieval equestrian statues.',
   [{icon:'⛪',title:'千年座堂',desc:'罗马式与哥特式融合'},{icon:'🐴',title:'班贝格骑士',desc:'中世纪最神秘骑马雕像'},{icon:'📸',title:'最佳拍摄',desc:'新宫殿露台四塔全景'}],
   ['教堂','中世纪','罗马式','哥特式']],
  ['linderhof-palace','林德霍夫宫','Linderhof Palace','德国','Germany','巴伐利亚','Bavaria','路德维希最钟爱的小宫殿','🏰 洛可可式珠宝盒 | 维纳斯洞穴 | 皇家花园',
   '林德霍夫宫是路德维希二世最钟爱的宫殿，也是他唯一活着看到完工的宫殿。这座精致的洛可可式宫殿被称为"珠宝盒"，虽然规模不大但每一处装饰都极尽奢华。宫殿花园中的人工维纳斯洞穴是世界上最大的人工岩洞之一，内部设有瀑布和金色小船。花园的对称式花坛、喷泉和阶梯式设计体现了法国宫廷园林的精髓。\n\n拍摄建议：从花园阶梯方向拍摄宫殿正面的全景是最经典的角度。维纳斯洞穴内部的金色装饰和灯光效果令人震撼。花园中的喷泉和雕塑也是很好的前景元素。',
   'Linderhof Palace was Ludwig II\'s favorite palace and the only one he lived to see completed. This exquisite Rococo "jewel box" features the world\'s largest artificial grotto with a waterfall and golden boat. The symmetrical gardens embody French court garden design.',
   [{icon:'🏰',title:'洛可可珠宝盒',desc:'路德维希最钟爱宫殿'},{icon:'🎵',title:'维纳斯洞穴',desc:'世界最大人工岩洞'},{icon:'📸',title:'最佳拍摄',desc:'花园阶梯方向宫殿正面'}],
   ['宫殿','洛可可','花园','巴伐利亚']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 157
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
  console.log(`\n共插入 ${items.length} 个德国景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
