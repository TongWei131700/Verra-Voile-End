const mysql = require('mysql2/promise')
require('dotenv').config()

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const attractions = [
    {
      slug: 'san-sebastian-beach', name: '圣塞巴斯蒂安海滩', name_en: 'San Sebastian Beach',
      country: '西班牙', country_en: 'Spain', location: '巴斯克', location_en: 'Basque Country',
      cover_image: '/uploads/crawled/travel-attractions/san-sebastian-beach.jpg',
      tagline: '欧洲最美贝壳海滩',
      description: '圣塞巴斯蒂安的贝壳湾(La Concha)被公认为欧洲最美的城市海滩，新月形的金色沙滩被两座山丘环抱，形成天然的避风港湾。这座巴斯克地区的美食之都同时也是世界级的海滨度假胜地，每平方米的米其林星级餐厅数量居全球之首。老城(Parte Vieja)的 pintxos 酒吧文化更是不可错过的体验。\n\n拍摄建议：从伊格尔多山或乌尔古尔山顶拍摄贝壳湾的全景是最经典的构图，可以将新月形沙滩和海湾收入画面。日落时分，金色光线洒满海面，是最佳的拍摄时机。',
      description_en: 'San Sebastian\'s La Concha Bay is widely regarded as Europe\'s most beautiful urban beach, a crescent of golden sand embraced by two hills. This Basque culinary capital boasts the highest density of Michelin-starred restaurants per square meter in the world.',
      highlights: JSON.stringify([
        { icon: '🏖️', title: '贝壳湾', desc: '欧洲最美城市海滩' },
        { icon: '🍽️', title: '美食之都', desc: '全球最高米其林密度' },
        { icon: '📸', title: '最佳拍摄', desc: '山顶俯瞰贝壳湾全景' },
      ]),
      price: 0, sort_order: 127,
      tags: JSON.stringify(['海滩', '美食', '度假', '巴斯克']),
    },
    {
      slug: 'bilbao-guggenheim', name: '毕尔巴鄂古根海姆', name_en: 'Guggenheim Bilbao',
      country: '西班牙', country_en: 'Spain', location: '巴斯克', location_en: 'Basque Country',
      cover_image: '/uploads/crawled/travel-attractions/bilbao-guggenheim.jpg',
      tagline: '钛金属幕墙解构主义杰作',
      description: '毕尔巴鄂古根海姆博物馆是弗兰克·盖里最具代表性的作品，也是解构主义建筑的里程碑。博物馆外覆盖着33000块钛金属板，在阳光下闪烁着流动的银色光芒。其不规则的曲线造型如同巨大的雕塑，与内维翁河的水面倒影交相辉映。博物馆前的巨型小狗花雕和蜘蛛妈妈是标志性的拍照点。\n\n拍摄建议：从河对岸拍摄博物馆的完整轮廓和钛金属反光是最经典的角度。清晨或傍晚的侧面光线最能展现钛金属板的质感。博物馆内部的中庭同样壮观，高达50米的空间被巨大的有机形态包围。',
      description_en: 'The Guggenheim Museum Bilbao, designed by Frank Gehry, is a milestone of deconstructivist architecture. Clad in 33,000 titanium panels that shimmer in sunlight, its sculptural curves interact with the Nervión River reflections.',
      highlights: JSON.stringify([
        { icon: '🏗️', title: '解构主义', desc: '盖里建筑里程碑' },
        { icon: '✨', title: '钛金属幕墙', desc: '33000块钛板闪烁' },
        { icon: '📸', title: '最佳拍摄', desc: '河对岸完整轮廓' },
      ]),
      price: 0, sort_order: 128,
      tags: JSON.stringify(['博物馆', '建筑艺术', '城市地标', '现代']),
    },
    {
      slug: 'segovia-aqueduct', name: '塞戈维亚水道桥', name_en: 'Segovia Aqueduct',
      country: '西班牙', country_en: 'Spain', location: '卡斯蒂利亚', location_en: 'Castile',
      cover_image: '/uploads/crawled/travel-attractions/segovia-aqueduct.jpg',
      tagline: '古罗马工程学的不朽丰碑',
      description: '塞戈维亚水道桥是罗马帝国时期建造的最壮观的高架引水桥之一，也是西班牙保存最完好的罗马遗迹。这座建于公元1世纪的水道桥高达28米，由167个拱门组成，全长813米，全部使用花岗岩砌成，没有使用任何灰浆。它曾为城市输水近两千年，至今仍矗立在市中心的主广场上。\n\n拍摄建议：从水道桥下方的广场仰拍可以展现其宏伟的规模和精密的石工技艺。沿水道桥步行至高处可以拍摄双重拱门和城市全景。日落时分，花岗岩在夕阳映照下呈现温暖的橙红色调。',
      description_en: 'The Segovia Aqueduct is one of the most spectacular Roman aqueducts ever built and the best-preserved Roman monument in Spain. Built in the 1st century AD, it stands 28 meters high with 167 arches spanning 813 meters, all in granite without mortar.',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '罗马工程', desc: '公元1世纪花岗岩拱桥' },
        { icon: '📏', title: '规模宏大', desc: '28米高167个拱门' },
        { icon: '📸', title: '最佳拍摄', desc: '广场仰拍或日落暖调' },
      ]),
      price: 0, sort_order: 129,
      tags: JSON.stringify(['古迹', '世界遗产', '罗马', '建筑']),
    },
    {
      slug: 'avila-walls', name: '阿维拉城墙', name_en: 'Walls of Ávila',
      country: '西班牙', country_en: 'Spain', location: '卡斯蒂利亚', location_en: 'Castile',
      cover_image: '/uploads/crawled/travel-attractions/avila-walls.jpg',
      tagline: '欧洲保存最完整的中世纪城墙',
      description: '阿维拉城墙是欧洲保存最完整的中世纪防御工事，全长2.5公里，拥有88座塔楼和9座城门。这座建于11世纪的城墙完全环绕着整座城市，游客可以登上城墙步行游览，从高处俯瞰城内的大教堂和城外的卡斯蒂利亚平原。夜晚灯光照射下的城墙格外壮观，金色的石墙在黑暗中勾勒出城市的轮廓。\n\n拍摄建议：从城外的四圣徒观景台拍摄城墙全景是最经典的角度，可以将完整的城墙和教堂尖塔收入画面。夜间灯光照明时的城墙轮廓同样值得拍摄。登上城墙步行可以拍摄到独特的视角。',
      description_en: 'The Walls of Ávila are the best-preserved medieval fortifications in Europe, stretching 2.5 kilometers with 88 towers and 9 gates. Built in the 11th century, they completely encircle the city and can be walked along their ramparts.',
      highlights: JSON.stringify([
        { icon: '🏰', title: '最完整城墙', desc: '欧洲中世纪防御之冠' },
        { icon: '🌙', title: '夜间灯光', desc: '金色轮廓照亮夜空' },
        { icon: '📸', title: '最佳拍摄', desc: '四圣徒观景台全景' },
      ]),
      price: 0, sort_order: 130,
      tags: JSON.stringify(['城墙', '世界遗产', '中世纪', '防御工事']),
    },
    {
      slug: 'salamanca-plaza', name: '萨拉曼卡广场', name_en: 'Plaza Mayor, Salamanca',
      country: '西班牙', country_en: 'Spain', location: '卡斯蒂利亚', location_en: 'Castile',
      cover_image: '/uploads/crawled/travel-attractions/salamanca-plaza.jpg',
      tagline: '西班牙巴洛克广场的巅峰之作',
      description: '萨拉曼卡马约尔广场被公认为西班牙最美的广场，也是巴洛克建筑艺术的杰作。这座建于18世纪的广场四周被精美的拱廊建筑环绕，每个拱门上方都装饰着西班牙历史名人的浮雕和雕像。广场中央的亭式建筑在夜间灯光下格外迷人。整座城市因使用当地特有的金色砂岩而被称为"黄金之城"。\n\n拍摄建议：傍晚至夜间拍摄效果最佳，广场的灯光照明将金色砂岩建筑映衬得格外华丽。从广场角落的拱门内拍摄对称构图可以展现广场的完整规模。萨拉曼卡大学和新大教堂也是不可错过的取景地。',
      description_en: 'The Plaza Mayor of Salamanca is considered Spain\'s most beautiful square and a masterpiece of Baroque architecture. Built in the 18th century, it is surrounded by arcaded buildings adorned with statues of Spanish historical figures.',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '西班牙最美', desc: '巴洛克广场之冠' },
        { icon: '✨', title: '黄金之城', desc: '金色砂岩建筑群' },
        { icon: '📸', title: '最佳拍摄', desc: '夜间灯光照明最华丽' },
      ]),
      price: 0, sort_order: 131,
      tags: JSON.stringify(['广场', '世界遗产', '巴洛克', '金色之城']),
    },
    {
      slug: 'granada-albaicin', name: '阿尔拜辛区', name_en: 'Albaicín, Granada',
      country: '西班牙', country_en: 'Spain', location: '格拉纳达', location_en: 'Granada',
      cover_image: '/uploads/crawled/travel-attractions/granada-albaicin.jpg',
      tagline: '格拉纳达的摩尔白色迷宫',
      description: '阿尔拜辛区是格拉纳达最古老的街区，被联合国教科文组织列为世界遗产。这片位于阿尔罕布拉宫对面山丘上的白色街区保留着中世纪摩尔人的城市布局——狭窄蜿蜒的巷道、白色粉刷的房屋、隐秘的花园和芬芳的橙树。从圣尼古拉斯观景台可以拍摄到阿尔罕布拉宫与内华达雪山的经典全景，这是格拉纳达最令人心动的画面。\n\n拍摄建议：圣尼古拉斯观景台是拍摄阿尔罕布拉宫全景的最佳位置，日落时分最为壮观。在阿尔拜辛的迷宫巷道中漫步，每一个转角都可能发现惊喜的视角。Carmen（摩尔式花园住宅）的围墙上也常有绝佳的取景框。',
      description_en: 'The Albaicín is Granada\'s oldest quarter, a UNESCO World Heritage site on the hill facing the Alhambra. This white-washed neighborhood preserves the medieval Moorish urban layout—narrow winding lanes, hidden gardens, and fragrant orange trees.',
      highlights: JSON.stringify([
        { icon: '🏘️', title: '摩尔街区', desc: '中世纪白色迷宫' },
        { icon: '🏆', title: '世界遗产', desc: '与阿尔罕布拉宫同列' },
        { icon: '📸', title: '最佳拍摄', desc: '圣尼古拉斯观景台日落' },
      ]),
      price: 0, sort_order: 132,
      tags: JSON.stringify(['古城', '世界遗产', '摩尔', '白色小镇']),
    },
    {
      slug: 'ronda-bridge', name: '龙达新桥', name_en: 'Puente Nuevo, Ronda',
      country: '西班牙', country_en: 'Spain', location: '安达卢西亚', location_en: 'Andalusia',
      cover_image: '/uploads/crawled/travel-attractions/ronda-bridge.jpg',
      tagline: '横跨百丈深渊的悬崖之桥',
      description: '龙达新桥是西班牙最壮观的桥梁建筑，横跨120米深的塔霍峡谷，将龙达城的新城和老城连接在一起。这座建于18世纪的石灰岩拱桥高98米，从峡谷底部仰望令人震撼。桥下的峡谷深不见底，两侧是白色的悬崖建筑。据说这座桥的设计师在建造过程中坠崖身亡，为这座桥增添了一丝传奇色彩。\n\n拍摄建议：从峡谷底部的步道拍摄新桥的仰视图最为壮观，可以将桥身和峡谷全貌收入画面。从桥两侧的观景台拍摄也是经典角度。日落时分，峡谷中的光线变化创造出戏剧性的明暗对比。',
      description_en: 'The Puente Nuevo of Ronda is Spain\'s most spectacular bridge, spanning a 120-meter-deep gorge to connect the old and new towns. Built in the 18th century, this 98-meter-tall limestone arch bridge is awe-inspiring when viewed from the canyon below.',
      highlights: JSON.stringify([
        { icon: '🌉', title: '悬崖之桥', desc: '横跨120米深峡谷' },
        { icon: '🏗️', title: '工程奇迹', desc: '98米高石灰岩拱桥' },
        { icon: '📸', title: '最佳拍摄', desc: '峡谷底部仰视最壮观' },
      ]),
      price: 0, sort_order: 133,
      tags: JSON.stringify(['桥梁', '悬崖', '建筑', '安达卢西亚']),
    },
    {
      slug: 'nerja-balcony', name: '内尔哈阳台', name_en: 'Balcón de Nerja',
      country: '西班牙', country_en: 'Spain', location: '安达卢西亚', location_en: 'Andalusia',
      cover_image: '/uploads/crawled/travel-attractions/nerja-balcony.jpg',
      tagline: '地中海悬崖上的绝美观景台',
      description: '内尔哈阳台是伸出地中海悬崖的观景平台，被誉为"欧洲阳台"。从这里可以360度俯瞰碧蓝的地中海和壮丽的海岸线。这座原本名为"炮台角"的观景台因一首歌曲而得名"欧洲阳台"，从此成为西班牙南部最受欢迎的海滨景点之一。附近的水晶洞穴同样值得一探。\n\n拍摄建议：从阳台拍摄地中海海岸线的全景是最经典的构图。沿海岸步道可以找到更多俯瞰悬崖和海水的拍摄角度。日落时分的海面金光粼粼，是最佳拍摄时机。附近的Burriana海滩也是拍摄海岸风光的好地方。',
      description_en: 'The Balcón de Nerja is a viewing platform extending over the Mediterranean cliff, known as the "Balcony of Europe." It offers 360-degree views of the azure Mediterranean and stunning coastline.',
      highlights: JSON.stringify([
        { icon: '🌊', title: '欧洲阳台', desc: '360度地中海全景' },
        { icon: '🎵', title: '歌曲命名', desc: '因一首歌闻名世界' },
        { icon: '📸', title: '最佳拍摄', desc: '阳台拍摄海岸线全景' },
      ]),
      price: 0, sort_order: 134,
      tags: JSON.stringify(['海岸', '观景台', '地中海', '悬崖']),
    },
    {
      slug: 'costa-brava', name: '布拉瓦海岸', name_en: 'Costa Brava',
      country: '西班牙', country_en: 'Spain', location: '加泰罗尼亚', location_en: 'Catalonia',
      cover_image: '/uploads/crawled/travel-attractions/costa-brava.jpg',
      tagline: '加泰罗尼亚的野性海岸线',
      description: '布拉瓦海岸意为"野性海岸"，是加泰罗尼亚东北部最壮丽的海岸线。从布拉内斯到法国边境，绵延200多公里的海岸线上分布着无数隐秘的小海湾、陡峭的悬崖和松林覆盖的岬角。清澈见底的碧蓝海水、隐蔽的沙滩和色彩斑斓的渔村构成了这条海岸线的独特魅力。达利曾在这里生活创作，为这片海岸增添了一份超现实的艺术气质。\n\n拍摄建议：沿海岸公路自驾，沿途有多个观景台可以拍摄悬崖与碧海的壮观画面。卡达克斯和卡莱斯德罗德里斯等小渔村是绝佳的人文取景地。清晨的平静海面和日落时分的金色悬崖各有精彩。',
      description_en: 'The Costa Brava, meaning "Wild Coast," is Catalonia\'s most spectacular coastline. Stretching 200km from Blanes to the French border, it features hidden coves, steep cliffs, and pine-covered headlands with crystal-clear turquoise waters.',
      highlights: JSON.stringify([
        { icon: '🏖️', title: '野性海岸', desc: '200公里壮丽海岸线' },
        { icon: '🎨', title: '达利之地', desc: '超现实主义艺术故乡' },
        { icon: '📸', title: '最佳拍摄', desc: '海岸公路观景台' },
      ]),
      price: 0, sort_order: 135,
      tags: JSON.stringify(['海岸', '海湾', '自然', '加泰罗尼亚']),
    },
    {
      slug: 'cadaques', name: '卡达克斯', name_en: 'Cadaqués',
      country: '西班牙', country_en: 'Spain', location: '加泰罗尼亚', location_en: 'Catalonia',
      cover_image: '/uploads/crawled/travel-attractions/cadaques.jpg',
      tagline: '达利的白色海湾秘境',
      description: '卡达克斯是加泰罗尼亚最迷人的白色渔村，隐藏在布拉瓦海岸的一个偏僻海湾中。达利曾在这里生活和工作超过40年，他的故居如今是达利博物馆。村庄的白色房屋沿着半月形海湾排列，蓝色的地中海和远处的加泰罗尼亚自然公园构成了宁静的背景。这里的宁静光线和独特氛围曾吸引过毕加索、杜尚等艺术大师。\n\n拍摄建议：从海湾对面拍摄白色渔村的经典全景是最受欢迎的角度。达利故居Portlligat湾的橄榄树和岩石也是独特的取景元素。清晨的宁静海湾和傍晚的金色光线都是最佳创作时机。',
      description_en: 'Cadaqués is Catalonia\'s most charming white fishing village, hidden in a remote bay along the Costa Brava. Dalí lived and worked here for over 40 years, and his former home is now the Dalí Museum. The white houses line a crescent bay with the blue Mediterranean.',
      highlights: JSON.stringify([
        { icon: '🎨', title: '达利故乡', desc: '超现实主义大师居所' },
        { icon: '🏘️', title: '白色渔村', desc: '隐秘海湾中的明珠' },
        { icon: '📸', title: '最佳拍摄', desc: '海湾对面白色渔村全景' },
      ]),
      price: 0, sort_order: 136,
      tags: JSON.stringify(['渔村', '白色小镇', '艺术', '海湾']),
    },
    {
      slug: 'montserrat-monastery', name: '蒙特塞拉特修道院', name_en: 'Montserrat Monastery',
      country: '西班牙', country_en: 'Spain', location: '加泰罗尼亚', location_en: 'Catalonia',
      cover_image: '/uploads/crawled/travel-attractions/montserrat-monastery.jpg',
      tagline: '锯齿山中的千年修道院',
      description: '蒙特塞拉特修道院坐落在海拔720米的锯齿形山岩之中，是加泰罗尼亚最重要的宗教圣地。这座建于1025年的本笃会修道院依偎在奇特的岩石山峰之间，如同镶嵌在大自然的雕塑之中。修道院供奉的黑面圣母像是加泰罗尼亚的守护神。从修道院出发，多条步道通往山顶，可以俯瞰整个加泰罗尼亚平原直至地中海。\n\n拍摄建议：从圣约翰步道拍摄修道院与锯齿山峰的组合是最经典的构图。乘坐齿轨列车到山顶可以拍摄到更壮观的全景。清晨的薄雾笼罩山谷时，修道院如同漂浮在云端。',
      description_en: 'Montserrat Monastery sits at 720 meters among the dramatic saw-toothed rock formations, Catalonia\'s most important religious sanctuary. Founded in 1025, this Benedictine monastery nestles among bizarre rock peaks like a gem set in nature\'s sculpture.',
      highlights: JSON.stringify([
        { icon: '⛪', title: '千年修道院', desc: '1025年本笃会圣地' },
        { icon: '🏔️', title: '锯齿山峰', desc: '奇特岩石雕塑群' },
        { icon: '📸', title: '最佳拍摄', desc: '圣约翰步道经典构图' },
      ]),
      price: 0, sort_order: 137,
      tags: JSON.stringify(['修道院', '山岳', '宗教', '自然奇观']),
    },
    {
      slug: 'palma-cathedral', name: '帕尔马大教堂', name_en: 'Palma Cathedral',
      country: '西班牙', country_en: 'Spain', location: '巴利阿里', location_en: 'Balearic Islands',
      cover_image: '/uploads/crawled/travel-attractions/palma-cathedral.jpg',
      tagline: '地中海之滨的哥特式巨作',
      description: '帕尔马大教堂矗立在地中海之滨的城墙之上，是世界上最高的哥特式教堂之一，也是马略卡岛最壮观的地标。教堂的玫瑰窗直径达13.8米，是欧洲最大的哥特式玫瑰窗之一。内部由安东尼·高迪参与改造，将现代主义元素融入哥特式空间。从海面上远眺，大教堂的轮廓线与地中海的蓝天构成经典的马略卡明信片画面。\n\n拍摄建议：从海面上或海滨大道拍摄大教堂与大海的经典全景是最受欢迎的角度。进入教堂内部，巨大的中殿空间和玫瑰窗的彩窗光影值得细拍。日落时分，教堂外立面在夕阳映照下呈现金色。',
      description_en: 'Palma Cathedral rises above the Mediterranean waterfront, one of the tallest Gothic churches in the world and Mallorca\'s most iconic landmark. Its rose window, 13.8 meters in diameter, is one of Europe\'s largest Gothic rose windows.',
      highlights: JSON.stringify([
        { icon: '⛪', title: '哥特巨作', desc: '世界最高哥特式教堂之一' },
        { icon: '🌹', title: '玫瑰窗', desc: '欧洲最大哥特式彩窗' },
        { icon: '📸', title: '最佳拍摄', desc: '海面远眺经典全景' },
      ]),
      price: 0, sort_order: 138,
      tags: JSON.stringify(['教堂', '哥特式', '海岛', '城市地标']),
    },
    {
      slug: 'cadiz-old-town', name: '加的斯老城', name_en: 'Cádiz Old Town',
      country: '西班牙', country_en: 'Spain', location: '安达卢西亚', location_en: 'Andalusia',
      cover_image: '/uploads/crawled/travel-attractions/cadiz-old-town.jpg',
      tagline: '大西洋畔三千年古城',
      description: '加的斯是西欧最古老的城市之一，拥有超过3000年的历史。老城坐落在一块伸入大西洋的狭长半岛上，三面被海水环绕。白色的巴洛克建筑、狭窄的巷道和开阔的海景广场构成了这座城市的独特风貌。塔维拉塔的暗箱相机将城市全景投射到白色屏幕上，是了解加的斯最有趣的方式。老城的海鲜市场和狂欢节文化同样闻名遐迩。\n\n拍摄建议：从塔维拉塔顶拍摄老城全景和海景是最壮观的视角。沿海步道可以拍摄到城市被大海环绕的独特地理特征。日落时分的大西洋海景和老城白色建筑在夕阳下的光影效果都很出色。',
      description_en: 'Cádiz is one of the oldest cities in Western Europe with over 3,000 years of history. The old town sits on a narrow peninsula jutting into the Atlantic, surrounded by sea on three sides with white Baroque buildings and ocean-view squares.',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '三千年古城', desc: '西欧最古老城市之一' },
        { icon: '🌊', title: '半岛之城', desc: '三面环海独特地貌' },
        { icon: '📸', title: '最佳拍摄', desc: '塔维拉塔顶全景' },
      ]),
      price: 0, sort_order: 139,
      tags: JSON.stringify(['古城', '海滨', '巴洛克', '大西洋']),
    },
    {
      slug: 'leon-cathedral', name: '莱昂大教堂', name_en: 'León Cathedral',
      country: '西班牙', country_en: 'Spain', location: '卡斯蒂利亚', location_en: 'Castile',
      cover_image: '/uploads/crawled/travel-attractions/leon-cathedral.jpg',
      tagline: '哥特式彩窗的光之圣殿',
      description: '莱昂大教堂被誉为西班牙最美的哥特式教堂，以其超过1800平方米的彩色玻璃窗闻名于世——这是世界上最大中世纪彩窗群之一。教堂内部在阳光照射下，彩色光影洒满整个中殿，营造出如梦如幻的氛围。与法国哥特式教堂的厚重感不同，莱昂大教堂以轻盈的结构和通透的光线著称，被称为"光之圣殿"。\n\n拍摄建议：教堂内部的彩窗光影是必拍画面，正午阳光直射时效果最为绚丽。从外部拍摄教堂正立面的双塔和精美雕塑也值得花时间。附近的波丁医院和圣马尔塞洛教堂也是不错的补充取景地。',
      description_en: 'León Cathedral is considered Spain\'s most beautiful Gothic church, famous for its 1,800+ square meters of stained glass—one of the largest medieval collections in the world. Sunlight through the windows fills the nave with dreamlike colored light.',
      highlights: JSON.stringify([
        { icon: '🌈', title: '彩窗之冠', desc: '1800平方米中世纪彩窗' },
        { icon: '💡', title: '光之圣殿', desc: '西班牙最美哥特式教堂' },
        { icon: '📸', title: '最佳拍摄', desc: '正午彩窗光影最绚丽' },
      ]),
      price: 0, sort_order: 140,
      tags: JSON.stringify(['教堂', '哥特式', '彩窗', '建筑艺术']),
    },
    {
      slug: 'menorca-coves', name: '梅诺卡海湾', name_en: 'Menorca Coves',
      country: '西班牙', country_en: 'Spain', location: '巴利阿里', location_en: 'Balearic Islands',
      cover_image: '/uploads/crawled/travel-attractions/menorca-coves.jpg',
      tagline: '地中海最纯净的隐秘海湾',
      description: '梅诺卡岛拥有地中海最纯净的海湾群，超过75个大小海湾散布在216公里的海岸线上。与马略卡的热闹不同，梅诺卡保持着原始的宁静——翡翠色的海水、白色的沙滩和松林覆盖的悬崖构成了天堂般的画面。整座岛屿被联合国教科文组织列为生物圈保护区，是地中海生态保护最完好的岛屿之一。\n\n拍摄建议： Cala Macarella 和 Cala Mitjana 是最上镜的海湾，翡翠色的海水和白色沙滩构成经典的地中海画面。清晨到达可以避开人群，拍摄到空旷的海湾全景。沿海岸步道徒步可以发现更多隐秘的小海湾。',
      description_en: 'Menorca has the Mediterranean\'s most pristine cove system, with 75+ coves along 216km of coastline. Unlike bustling Mallorca, Menorca maintains its primitive tranquility—emerald waters, white beaches, and pine-covered cliffs create paradise-like scenes.',
      highlights: JSON.stringify([
        { icon: '🏖️', title: '75个海湾', desc: '地中海最纯净海湾群' },
        { icon: '🌿', title: '生物圈保护区', desc: '地中海生态保护典范' },
        { icon: '📸', title: '最佳拍摄', desc: 'Cala Macarella翡翠海湾' },
      ]),
      price: 0, sort_order: 141,
      tags: JSON.stringify(['海湾', '海岛', '自然', '地中海']),
    },
  ]

  for (const a of attractions) {
    await pool.execute(
      `INSERT INTO crawled_travel_attractions
       (slug, name, name_en, country, country_en, location, location_en,
        cover_image, tagline, description, description_en, highlights, price, sort_order, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.slug, a.name, a.name_en, a.country, a.country_en, a.location, a.location_en,
        a.cover_image, a.tagline, a.description, a.description_en, a.highlights,
        a.price, a.sort_order, a.tags,
      ]
    )
    console.log(`✓ ${a.name} (${a.slug})`)
  }

  console.log(`\n共插入 ${attractions.length} 个西班牙景点`)
  await pool.end()
}

run().catch(e => { console.error(e.message); process.exit(1) })
