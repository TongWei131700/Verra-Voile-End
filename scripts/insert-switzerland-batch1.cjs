const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['matterhorn','马特洪峰','Matterhorn','瑞士','Switzerland','瓦莱','Valais','阿尔卑斯最具辨识度的三角峰','🏔️ 4478米三角峰 | 阿尔卑斯之王 | 倒影湖',
   '马特洪峰是阿尔卑斯山脉最具标志性的山峰，海拔4478米，以其完美的金字塔造型闻名于世。从采尔马特远眺，这座矗立在瑞士与意大利边境的三角峰在里弗尔湖中形成完美的倒影，构成了全世界最经典的阿尔卑斯画面。\n\n拍摄建议：从里弗尔湖拍摄马特洪峰倒影是最经典的角度，清晨日出前后光线最佳。戈尔纳格拉特观景台可以360度欣赏马特洪峰及周围群峰。日落时分山尖被染成金色的"阿尔卑斯之光"是最震撼的时刻。',
   'The Matterhorn is the most iconic peak of the Alps at 4,478 meters, famous for its perfect pyramid shape. Viewed from Zermatt, it creates a perfect reflection in Riffelsee.',
   [{icon:'🏔️',title:'阿尔卑斯之王',desc:'4478米完美金字塔造型'},{icon:'🪞',title:'倒影湖',desc:'里弗尔湖完美倒影'},{icon:'📸',title:'最佳拍摄',desc:'里弗尔湖日出倒影'}],
   ['山峰','阿尔卑斯','地标','倒影']],
  ['jungfraujoch','少女峰','Jungfraujoch','瑞士','Switzerland','伯尔尼','Bern','欧洲之巅的冰雪世界','🏔️ 3454米 | 欧洲最高火车站 | 阿莱奇冰川',
   '少女峰是伯尔尼阿尔卑斯最壮观的山峰，海拔4158米。少女峰火车站海拔3454米，是欧洲最高的火车站。从山顶可以俯瞰长达23公里的阿莱奇冰川——阿尔卑斯最长的冰川，以及一望无际的冰雪世界。2001年被列为联合国教科文组织世界遗产。\n\n拍摄建议：从斯芬克斯观景台拍摄阿莱奇冰川全景是最壮观的角度。冰宫内的冰雕也是独特的拍摄题材。天气晴朗时可以远眺至法国 Vosges 山脉和德国黑森林。',
   'The Jungfrau is the most spectacular peak of the Bernese Alps at 4,158 meters. The Jungfraujoch station at 3,454m is Europe\'s highest railway station, overlooking the 23km Aletsch Glacier.',
   [{icon:'🏔️',title:'欧洲之巅',desc:'欧洲最高火车站3454米'},{icon:'🧊',title:'阿莱奇冰川',desc:'阿尔卑斯最长冰川23公里'},{icon:'📸',title:'最佳拍摄',desc:'斯芬克斯观景台冰川全景'}],
   ['山峰','冰川','世界遗产','冰雪']],
  ['lake-geneva','日内瓦湖','Lake Geneva','瑞士','Switzerland','日内瓦','Geneva','西欧最大的高山湖泊','🌊 西欧最大湖泊 | 拉沃梯田 | 天鹅与喷泉',
   '日内瓦湖是西欧最大的高山湖泊，面积582平方公里，碧蓝的湖水被法国和瑞士环绕。湖边的拉沃梯田葡萄园是世界遗产，日内瓦大喷泉高达140米，是城市的标志。湖畔的蒙特勒、洛桑和日内瓦等城市各具魅力。\n\n拍摄建议：从拉沃梯田拍摄日内瓦湖与远处雪山的全景是最经典的角度。日内瓦大喷泉在阳光下的水雾彩虹非常迷人。傍晚的湖面金色倒影也很壮观。',
   'Lake Geneva is Western Europe\'s largest Alpine lake at 582 square kilometers, surrounded by France and Switzerland. The Lavaux terraced vineyards along its shores are a World Heritage site.',
   [{icon:'🌊',title:'西欧最大',desc:'582平方公里高山湖泊'},{icon:'🍇',title:'拉沃梯田',desc:'世界遗产葡萄园'},{icon:'📸',title:'最佳拍摄',desc:'拉沃梯田湖与雪山全景'}],
   ['湖泊','日内瓦','拉沃','雪山']],
  ['lucerne-chapel-bridge','卡佩尔桥','Chapel Bridge, Lucerne','瑞士','Switzerland','卢塞恩','Lucerne','欧洲最古老的木桥','🌉 14世纪木桥 | 水塔倒影 | 卢塞恩地标',
   '卡佩尔桥建于1333年，是欧洲最古老的木桥，横跨卢塞恩的罗伊斯河。桥旁的八角形水塔是卢塞恩最具辨识度的地标。桥内的17世纪三角形绘画描绘了卢塞恩的历史传说。桥畔的花坛随季节变换色彩，春夏时节鲜花盛开时最为迷人。\n\n拍摄建议：从桥的对岸拍摄木桥与水塔的倒影组合是最经典的角度。清晨或傍晚的柔和光线最适合拍摄。桥内三角形绘画也值得近距离拍摄。',
   'The Chapel Bridge was built in 1333, the oldest covered wooden bridge in Europe, spanning the Reuss River in Lucerne. The octagonal Water Tower beside it is the city\'s most recognizable landmark.',
   [{icon:'🌉',title:'欧洲最古老',desc:'1333年木桥'},{icon:'🗼',title:'水塔地标',desc:'卢塞恩最具辨识度'},{icon:'📸',title:'最佳拍摄',desc:'对岸拍摄桥与水塔倒影'}],
   ['桥梁','地标','卢塞恩','木桥']],
  ['lake-lucerne','卢塞恩湖','Lake Lucerne','瑞士','Switzerland','卢塞恩','Lucerne','四森林州湖的翡翠明珠','🌊 翡翠色湖水 | 雪山环绕 | 游船天堂',
   '卢塞恩湖（四森林州湖）是瑞士最美丽的湖泊之一，翡翠色的湖水被皮拉图斯山、瑞吉山和雪山环绕。湖岸线曲折多变，每一个弯道都展现不同的山水画卷。乘坐游船在湖上漫游，远处的雪山和湖畔的小镇如同世外桃源。\n\n拍摄建议：从游船上拍摄湖畔小镇与雪山的全景是最经典的角度。清晨的薄雾笼罩湖面时如同仙境。从皮拉图斯山或瑞吉山俯拍湖泊全景也很壮观。',
   'Lake Lucerne is one of Switzerland\'s most beautiful lakes, with emerald waters surrounded by Mount Pilatus, Mount Rigi, and snow-capped peaks. The winding shoreline reveals different landscape paintings at every turn.',
   [{icon:'🌊',title:'翡翠明珠',desc:'翡翠色湖水雪山环绕'},{icon:'🚢',title:'游船天堂',desc:'湖光山色如画'},{icon:'📸',title:'最佳拍摄',desc:'游船拍摄小镇雪山全景'}],
   ['湖泊','雪山','卢塞恩','翡翠']],
  ['zurich-old-town','苏黎世老城','Zurich Old Town','瑞士','Switzerland','苏黎世','Zurich','利马特河畔的中世纪明珠','🏘️ 利马特河两岸 | 双塔教堂 | 精致小巷',
   '苏黎世老城坐落在利马特河两岸，保留了完好的中世纪城市格局。圣彼得教堂拥有欧洲最大的钟面，格罗斯大教堂的双塔是城市天际线的标志。鹅卵石小巷两旁是精品店、咖啡馆和画廊，融合了历史韵味与现代时尚。\n\n拍摄建议：从市政厅桥拍摄格罗斯大教堂双塔和利马特河的经典全景是最受欢迎的角度。傍晚的金色光线映照在河面上格外迷人。沿河两岸漫步可以发现许多精致的取景点。',
   'Zurich\'s Old Town sits on both banks of the Limmat River, preserving a complete medieval city layout. St. Peter\'s Church has Europe\'s largest clock face, and the Grossmünster\'s twin towers define the skyline.',
   [{icon:'🏘️',title:'中世纪明珠',desc:'利马特河两岸老城'},{icon:'⛪',title:'双塔教堂',desc:'格罗斯大教堂天际线'},{icon:'📸',title:'最佳拍摄',desc:'市政厅桥拍摄双塔全景'}],
   ['老城','河流','苏黎世','中世纪']],
  ['lake-zurich','苏黎世湖','Lake Zurich','瑞士','Switzerland','苏黎世','Zurich','城市与阿尔卑斯的湖光纽带','🌊 城市湖畔 | 阿尔卑斯远景 | 帆船码头',
   '苏黎世湖从城市中心延伸40公里至阿尔卑斯山麓，是瑞士最优雅的城市湖泊。湖畔的步道、帆船码头和公园是市民和游客最爱的休闲场所。从湖面望去，远处的阿尔卑斯山在晴朗的日子里清晰可见。\n\n拍摄建议：从湖畔步道拍摄城市天际线与阿尔卑斯远景的组合全景是最经典的角度。日落时分的金色光线映照在湖面上格外迷人。帆船码头的彩色船桅也是很好的前景元素。',
   'Lake Zurich extends 40km from the city center to the Alpine foothills, Switzerland\'s most elegant urban lake. The lakeside promenade, sailing marinas, and parks are favorite leisure spots.',
   [{icon:'🌊',title:'城市湖泊',desc:'40公里延伸阿尔卑斯'},{icon:'⛵',title:'帆船码头',desc:'湖畔休闲天堂'},{icon:'📸',title:'最佳拍摄',desc:'湖畔步道城市天际线'}],
   ['湖泊','城市','苏黎世','阿尔卑斯']],
  ['interlaken','因特拉肯','Interlaken','瑞士','Switzerland','伯尔尼','Bern','两湖之间的冒险之都','🏔️ 少女峰脚下 | 两湖之间 | 冒险运动天堂',
   '因特拉肯意为"两湖之间"，坐落在图恩湖和布里恩茨湖之间，正对少女峰。这座小镇是通往阿尔卑斯各大山峰的门户，也是滑翔伞、漂流等户外冒险运动的天堂。从镇中心的Höheweg大道可以无遮挡地欣赏少女峰的壮丽全景。\n\n拍摄建议：从Höheweg大道拍摄少女峰全景是最经典的角度。乘坐滑翔伞从空中拍摄因特拉肯和两湖的全景是最震撼的体验。清晨的柔和光线最适合拍摄雪山。',
   'Interlaken means "between lakes," situated between Lake Thun and Lake Brienz, facing the Jungfrau. The town is a gateway to the Alps and a paradise for paragliding, rafting, and outdoor adventures.',
   [{icon:'🏔️',title:'少女峰脚下',desc:'正对阿尔卑斯壮丽全景'},{icon:'🪂',title:'冒险之都',desc:'滑翔伞漂流天堂'},{icon:'📸',title:'最佳拍摄',desc:'Höheweg大道少女峰全景'}],
   ['小镇','两湖','冒险','少女峰']],
  ['grindelwald','格林德尔瓦尔德','Grindelwald','瑞士','Switzerland','伯尔尼','Bern','艾格峰北壁下的童话小镇','🏔️ 艾格峰脚下 | 冰川峡谷 | 滑雪天堂',
   '格林德尔瓦尔德是伯尔尼阿尔卑斯最美丽的小镇之一，坐落在艾格峰壮观的北壁之下。夏季的翠绿牧场和冬季的银白雪景都令人叹为观止。First悬崖步道和冰川峡谷是这里最吸引人的景点。\n\n拍摄建议：从First山顶拍摄格林德尔瓦尔德山谷和艾格峰的全景是最壮观的角度。冰川峡谷内的冰洞和瀑布也很上镜。冬季雪后的童话般的村庄是最经典的画面。',
   'Grindelwald is one of the most beautiful villages in the Bernese Alps, beneath the spectacular Eiger North Face. Summer green meadows and winter silver landscapes are both breathtaking.',
   [{icon:'🏔️',title:'艾格峰下',desc:'壮观北壁脚下小镇'},{icon:'🧊',title:'冰川峡谷',desc:'First悬崖步道冰洞'},{icon:'📸',title:'最佳拍摄',desc:'First山顶山谷全景'}],
   ['小镇','雪山','冰川','童话']],
  ['lauterbrunnen','劳特布龙嫩','Lauterbrunnen','瑞士','Switzerland','伯尔尼','Bern','瀑布之谷的仙境','🌊 72条瀑布 | 瀑布之谷 | 托尔金灵感地',
   '劳特布龙嫩意为"众多泉水"，山谷中有72条瀑布从悬崖上倾泻而下，是瑞士最壮观的山谷之一。施陶巴赫瀑布高达297米，从村庄上方的悬崖直泻而下。这个瀑布之谷据说也是托尔金创作《指环王》中瑞文戴尔的灵感来源。\n\n拍摄建议：从村庄拍摄施陶巴赫瀑布的全景是最经典的角度。乘坐缆车到Mürren或Wengen可以俯瞰整个山谷。清晨的薄雾中瀑布若隐若现如同仙境。',
   'Lauterbrunnen means "many springs," with 72 waterfalls cascading from cliffs in one of Switzerland\'s most spectacular valleys. Staubbach Falls drops 297 meters from the cliff above the village.',
   [{icon:'🌊',title:'72条瀑布',desc:'众多泉水山谷'},{icon:'📖',title:'托尔金灵感',desc:'瑞文戴尔原型'},{icon:'📸',title:'最佳拍摄',desc:'村庄拍摄施陶巴赫瀑布'}],
   ['山谷','瀑布','仙境','伯尔尼']],
  ['bern-old-town','伯尔尼老城','Bern Old Town','瑞士','Switzerland','伯尔尼','Bern','世界遗产的中世纪首都','🏘️ 世界遗产 | 钟楼 | 拱廊购物街',
   '伯尔尼老城是瑞士保存最完好的中世纪城市中心，被联合国教科文组织列为世界遗产。标志性的钟楼（Zytglogge）建于13世纪，是欧洲最古老的天文钟之一。6公里长的拱廊购物街是欧洲最长的有顶步道，阿勒河环绕着老城三面。\n\n拍摄建议：从钟楼拍摄老城街道的经典全景是最受欢迎的角度。从玫瑰花园（Rosengarten）俯瞰老城屋顶和钟楼是最上镜的全景角度。阿勒河的U形弯道环绕老城的画面也很壮观。',
   'Bern Old Town is Switzerland\'s best-preserved medieval city center, a UNESCO World Heritage site. The iconic Zytglogge clock tower dates from the 13th century, one of Europe\'s oldest astronomical clocks.',
   [{icon:'🏘️',title:'世界遗产',desc:'最完好中世纪城市中心'},{icon:'🕐',title:'天文钟塔',desc:'13世纪钟楼'},{icon:'📸',title:'最佳拍摄',desc:'玫瑰花园俯瞰老城全景'}],
   ['老城','世界遗产','首都','中世纪']],
  ['geneva-jet-deau','日内瓦大喷泉','Jet d\'Eau, Geneva','瑞士','Switzerland','日内瓦','Geneva','140米高的水上奇观','⛲ 140米水柱 | 日内瓦地标 | 日内瓦湖畔',
   '日内瓦大喷泉是城市最具标志性的地标，一股强劲的水柱从日内瓦湖中直冲140米高空。这座建于1891年的喷泉最初是一个安全阀，如今已成为日内瓦的象征。在阳光和风的配合下，水雾中经常出现彩虹。\n\n拍摄建议：从湖边步道拍摄喷泉与远处雪山的组合全景是最经典的角度。日落时分的金色光线照射在水雾上形成彩虹最为迷人。从游船上可以近距离感受喷泉的壮观。',
   'The Jet d\'Eau is Geneva\'s most iconic landmark, a powerful water jet shooting 140 meters straight up from Lake Geneva. Built in 1891 as a safety valve, it has become the symbol of the city.',
   [{icon:'⛲',title:'140米水柱',desc:'日内瓦湖中直冲天际'},{icon:'🌈',title:'水雾彩虹',desc:'阳光下的自然彩虹'},{icon:'📸',title:'最佳拍摄',desc:'湖边步道喷泉与雪山'}],
   ['喷泉','地标','日内瓦','水柱']],
  ['chateau-chillon','西庸城堡','Château de Chillon','瑞士','Switzerland','沃州','Vaud','日内瓦湖畔的水上城堡','🏰 湖上城堡 | 中世纪要塞 | 拜伦诗歌',
   '西庸城堡矗立在日内瓦湖畔的一块岩石上，是瑞士最著名的城堡之一。这座中世纪水上城堡拥有1000多年的历史，内部保存着完整的骑士厅、地牢和壁画。英国诗人拜伦的《西庸的囚徒》使这座城堡闻名于世。\n\n拍摄建议：从湖对岸或湖畔步道拍摄城堡与日内瓦湖的全景是最经典的角度。城堡内部的地牢和骑士厅也值得拍摄。日落时分城堡在金色夕阳中如同童话。',
   'Château de Chillon stands on a rock by Lake Geneva, one of Switzerland\'s most famous castles. This medieval water fortress has over 1,000 years of history with preserved knight\'s halls and dungeons.',
   [{icon:'🏰',title:'水上城堡',desc:'日内瓦湖畔岩石之上'},{icon:'📜',title:'拜伦诗歌',desc:'西庸的囚徒闻名于世'},{icon:'📸',title:'最佳拍摄',desc:'湖对岸城堡全景'}],
   ['城堡','中世纪','日内瓦湖','水上']],
  ['montreux-promenade','蒙特勒湖畔','Montreux Promenade','瑞士','Switzerland','沃州','Vaud','日内瓦湖畔的音乐之城','🎵 湖畔步道 | 皇后乐队 | 爵士音乐节',
   '蒙特勒是日内瓦湖畔最优雅的小镇，以每年一度的爵士音乐节闻名于世。湖畔步道两旁种满了棕榈树和鲜花，弗雷迪·默丘里的雕像矗立在湖边。远处是法国阿尔卑斯山的壮丽全景，湖面上的帆船和天鹅构成了一幅宁静的画面。\n\n拍摄建议：从湖畔步道拍摄蒙特勒天际线与法国阿尔卑斯山的组合全景是最经典的角度。弗雷迪·默丘里雕像是很受欢迎的人文取景元素。日落时分的湖面金色倒影格外迷人。',
   'Montreux is the most elegant town on Lake Geneva, world-famous for its annual Jazz Festival. The lakeside promenade lined with palm trees and flowers, with Freddie Mercury\'s statue by the lake.',
   [{icon:'🎵',title:'爵士之城',desc:'世界著名爵士音乐节'},{icon:'🎤',title:'皇后乐队',desc:'弗雷迪·默丘里雕像'},{icon:'📸',title:'最佳拍摄',desc:'湖畔步道阿尔卑斯全景'}],
   ['湖畔','音乐','蒙特勒','优雅']],
  ['zermatt-village','采尔马特小镇','Zermatt Village','瑞士','Switzerland','瓦莱','Valais','马特洪峰脚下的无车小镇','🏘️ 无车小镇 | 马特洪峰 | 滑雪天堂',
   '采尔马特是一座禁止机动车通行的环保小镇，所有交通依靠电动车和马车。小镇海拔1620米，正对马特洪峰，是全世界最著名的滑雪和登山胜地之一。传统的瓦莱木屋与现代豪华酒店并存，营造出独特的度假氛围。\n\n拍摄建议：从小镇街道拍摄马特洪峰的经典全景是最受欢迎的角度。清晨和傍晚游客稀少时拍摄效果最佳。从戈尔纳格拉特火车沿线拍摄小镇与马特洪峰的组合画面也很壮观。',
   'Zermatt is a car-free eco-village where all transport is by electric vehicle or horse carriage. At 1,620m altitude, facing the Matterhorn, it\'s one of the world\'s most famous skiing and mountaineering destinations.',
   [{icon:'🏘️',title:'无车小镇',desc:'环保电动车马车出行'},{icon:'🏔️',title:'马特洪峰',desc:'正对阿尔卑斯标志性山峰'},{icon:'📸',title:'最佳拍摄',desc:'街道拍摄马特洪峰全景'}],
   ['小镇','无车','马特洪峰','滑雪']],
  ['st-moritz','圣莫里茨','St. Moritz','瑞士','Switzerland','格劳宾登','Graubünden','阿尔卑斯的奢华度假胜地','🏔️ 贵族度假 | 冰川快车 | 阳光之城',
   '圣莫里茨是世界上最著名的阿尔卑斯度假胜地，海拔1856米，以每年322天的日照被称为"阳光之城"。这座奢华小镇拥有顶级酒店、精品店和赌场，也是冰川快车的起点和终点。圣莫里茨湖在冬季结冰时会举办马球赛和板球赛。\n\n拍摄建议：从圣莫里茨湖畔拍摄小镇和雪山的全景是最经典的角度。冰川快车的红色列车穿越雪原的画面非常上镜。冬季雪后的奢华街道和灯光也很迷人。',
   'St. Moritz is the world\'s most famous Alpine resort at 1,856m, known as the "Sunshine City" with 322 sunny days per year. This luxury town is the start and end of the Glacier Express.',
   [{icon:'🏔️',title:'贵族度假',desc:'世界最著名阿尔卑斯胜地'},{icon:'🚂',title:'冰川快车',desc:'红色列车穿越雪原'},{icon:'📸',title:'最佳拍摄',desc:'湖畔小镇雪山全景'}],
   ['度假','奢华','阳光','阿尔卑斯']],
  ['davos','达沃斯','Davos','瑞士','Switzerland','格劳宾登','Graubünden','欧洲最高的高原城市','🏔️ 1560米高原 | 世界经济论坛 | 滑雪胜地',
   '达沃斯海拔1560米，是欧洲最高的高原城市，以每年举办的世界经济论坛闻名于世。这座小镇坐落在群山之间，拥有欧洲最大的滑雪区域之一。夏季的高原草甸和冬季的银白雪道都令人向往。\n\n拍摄建议：从山顶拍摄达沃斯山谷的全景是最壮观的角度。世界经济论坛期间的城市氛围也很独特。冬季雪后的高原小镇和滑雪道的画面最为经典。',
   'Davos at 1,560m is Europe\'s highest alpine town, world-famous for the annual World Economic Forum. The town sits among mountains with one of Europe\'s largest ski areas.',
   [{icon:'🏔️',title:'欧洲最高',desc:'1560米高原城市'},{icon:'💼',title:'世界经济论坛',desc:'达沃斯论坛举办地'},{icon:'📸',title:'最佳拍摄',desc:'山顶俯瞰山谷全景'}],
   ['高原','论坛','滑雪','达沃斯']],
  ['engadin-valley','恩加丁谷','Engadin Valley','瑞士','Switzerland','格劳宾登','Graubünden','阳光充沛的高原谷地','🏔️ 高原谷地 | 恩加丁建筑 | 冰川湖泊',
   '恩加丁谷是格劳宾登州最壮丽的山谷之一，因河从谷地中蜿蜒流过，两岸是传统的恩加丁式石砌房屋，厚墙小窗适应高海拔气候。锡尔瓦普拉纳湖和锡尔施湖如同翡翠镶嵌在山谷中。这里的阳光充足，空气干燥清新，是理想的度假胜地。\n\n拍摄建议：从谷地高处拍摄恩加丁传统房屋和因河的组合全景是最经典的角度。翡翠色的冰川湖泊是很好的前景元素。秋季金色草甸时的山谷最为壮观。',
   'The Engadin Valley is one of Graubünden\'s most spectacular valleys, with the Inn River winding through traditional Engadin stone houses with thick walls and small windows adapted to the high-altitude climate.',
   [{icon:'🏔️',title:'高原谷地',desc:'格劳宾登最壮丽山谷'},{icon:'🏠',title:'恩加丁建筑',desc:'传统石砌厚墙小窗'},{icon:'📸',title:'最佳拍摄',desc:'谷地高处房屋河流全景'}],
   ['山谷','高原','湖泊','格劳宾登']],
  ['titlis','铁力士山','Mount Titlis','瑞士','Switzerland','上瓦尔登','Obwalden','旋转缆车的冰川之巅','🏔️ 3238米 | 旋转缆车 | 冰川飞渡',
   '铁力士山海拔3238米，以世界首座旋转缆车闻名。从英格登出发，三段缆车将游客送至冰川之巅。旋转缆车在最后一程中360度旋转，让每位乘客都能欣赏到壮丽的阿尔卑斯全景。冰川飞渡吊桥悬空跨越冰川裂缝，惊险刺激。\n\n拍摄建议：从旋转缆车内拍摄阿尔卑斯全景是最独特的体验。冰川飞渡吊桥上的俯拍画面非常震撼。冬季雪后的铁力士山如同白色仙境。',
   'Mount Titlis at 3,238m is famous for the world\'s first rotating cable car. From Engelberg, three cable car stages take visitors to the glacier summit with 360-degree rotating views.',
   [{icon:'🏔️',title:'旋转缆车',desc:'世界首座360度旋转'},{icon:'🧊',title:'冰川飞渡',desc:'悬空跨越冰川裂缝'},{icon:'📸',title:'最佳拍摄',desc:'缆车内阿尔卑斯全景'}],
   ['山峰','缆车','冰川','旋转']],
  ['pilatus','皮拉图斯山','Mount Pilatus','瑞士','Switzerland','上瓦尔登','Obwalden','卢塞恩湖畔的龙之山','🏔️ 2132米 | 世界最陡齿轨 | 龙之传说',
   '皮拉图斯山海拔2132米，矗立在卢塞恩湖畔，被称为"龙之山"。世界最陡峭的齿轨铁路从阿尔纳赫登至山顶，最大坡度达48%。从山顶可以360度俯瞰卢塞恩湖、阿尔卑斯群峰和远处的黑森林。传说中的龙穴为这座山增添了神秘色彩。\n\n拍摄建议：从山顶拍摄卢塞恩湖和阿尔卑斯群峰的全景是最壮观的角度。齿轨铁路穿越山林的画面非常上镜。日落时分的金色光线照射在湖面上格外迷人。',
   'Mount Pilatus at 2,132m rises above Lake Lucerne, known as the "Dragon Mountain." The world\'s steepest cogwheel railway climbs to the summit with a maximum gradient of 48%.',
   [{icon:'🏔️',title:'龙之山',desc:'卢塞恩湖畔2132米'},{icon:'🚂',title:'最陡齿轨',desc:'最大坡度48%世界纪录'},{icon:'📸',title:'最佳拍摄',desc:'山顶卢塞恩湖全景'}],
   ['山峰','齿轨','卢塞恩','龙']],
  ['rhine-falls','莱茵瀑布','Rhine Falls','瑞士','Switzerland','沙夫豪森','Schaffhausen','欧洲最大的瀑布','🌊 23米高 | 150米宽 | 欧洲最大瀑布',
   '莱茵瀑布是欧洲最大的瀑布，宽150米，高23米，每秒流量高达600立方米。汹涌的莱茵河水从巨大的岩石上倾泻而下，水雾弥漫，声势震天。游客可以乘船靠近瀑布中央的岩石，从最近的距离感受瀑布的力量。周围的观景平台提供多个角度的壮丽全景。\n\n拍摄建议：从南侧观景台拍摄瀑布全景是最经典的角度。乘船靠近中央岩石可以从水面角度拍摄瀑布的壮观。水雾中的彩虹在阳光充足时经常出现。建议携带防水设备。',
   'The Rhine Falls is Europe\'s largest waterfall, 150m wide and 23m high, with a flow rate of up to 600 cubic meters per second. Mighty Rhine waters cascade over massive rocks creating thundering spray.',
   [{icon:'🌊',title:'欧洲最大',desc:'宽150米高23米巨型瀑布'},{icon:'🚢',title:'近距离体验',desc:'乘船靠近中央岩石'},{icon:'📸',title:'最佳拍摄',desc:'南侧观景台瀑布全景'}],
   ['瀑布','欧洲最大','莱茵河','自然']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 197
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
  console.log(`\n共插入 ${items.length} 个瑞士景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
