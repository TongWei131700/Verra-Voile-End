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
      slug: 'montepulciano', name: '蒙特普尔恰诺', name_en: 'Montepulciano',
      country: '意大利', country_en: 'Italy', location: '托斯卡纳', location_en: 'Tuscany',
      cover_image: '/uploads/crawled/travel-attractions/montepulciano.jpg',
      tagline: '托斯卡纳山丘上的文艺复兴明珠',
      description: '蒙特普尔恰诺是一座坐落于托斯卡纳南部山巅的中世纪山城，海拔605米，俯瞰着瓦尔迪基亚纳谷地。这座小城以文艺复兴时期的建筑、世界闻名的贵族酒窖和壮美的田园风光吸引着无数旅人。漫步在蜿蜒的石板街道上，两侧是砂岩砌成的古老宫殿和教堂，每一处转角都藏着惊喜。\n\n拍摄建议：清晨时分在主广场Piazza Grande取景，光线柔和且游客稀少。向城外延伸至葡萄园梯田，可捕捉到托斯卡纳标志性的丝柏树与起伏山丘的经典画面。傍晚时分从城墙高处远眺，落日余晖洒满整个谷地，是最佳的黄金时刻。',
      description_en: 'Montepulciano is a medieval hill town perched at 605 meters in southern Tuscany, overlooking the Val di Chiana valley. Famous for its Renaissance architecture, noble wine cellars, and stunning pastoral landscapes.',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '海拔高度', desc: '605米山巅古城' },
        { icon: '🍷', title: '贵族酒窖', desc: 'Vino Nobile产地' },
        { icon: '📸', title: '最佳拍摄', desc: '清晨广场或傍晚城墙' },
      ]),
      price: 0, sort_order: 87,
      tags: JSON.stringify(['山城', '文艺复兴', '葡萄酒', '田园风光']),
    },
    {
      slug: 'pienza', name: '皮恩扎', name_en: 'Pienza',
      country: '意大利', country_en: 'Italy', location: '托斯卡纳', location_en: 'Tuscany',
      cover_image: '/uploads/crawled/travel-attractions/pienza.jpg',
      tagline: '理想城市的文艺复兴典范',
      description: '皮恩扎是教皇庇护二世于1459年下令重建的"理想城市"，被联合国教科文组织列为世界遗产。这座小巧精致的山城完美体现了文艺复兴时期的人文主义城市规划理念，每一条街道、每一座建筑都经过精心设计。站在城外的观景台，瓦尔多尔恰谷地的金色麦浪和丝柏树尽收眼底。\n\n拍摄建议：从城外观景台拍摄城市轮廓线与瓦尔多尔恰谷地的全景是最经典的机位。城内主教堂和庇护二世宫殿的正立面也值得细拍。日落时分，城墙上的光线温暖而柔和，适合人像和风景创作。',
      description_en: 'Pienza is a UNESCO World Heritage "ideal city" rebuilt by Pope Pius II in 1459, perfectly embodying Renaissance humanist urban planning. Its compact size belies the grandeur of its cathedral and papal palace.',
      highlights: JSON.stringify([
        { icon: '🏆', title: '世界遗产', desc: '理想城市典范' },
        { icon: '🌾', title: '瓦尔多尔恰', desc: '金色谷地全景' },
        { icon: '📸', title: '最佳拍摄', desc: '城外观景台全景' },
      ]),
      price: 0, sort_order: 88,
      tags: JSON.stringify(['世界遗产', '文艺复兴', '山城', '田园风光']),
    },
    {
      slug: 'volterra', name: '沃尔泰拉', name_en: 'Volterra',
      country: '意大利', country_en: 'Italy', location: '托斯卡纳', location_en: 'Tuscany',
      cover_image: '/uploads/crawled/travel-attractions/volterra.jpg',
      tagline: '伊特鲁里亚千年古城与雪花石膏之都',
      description: '沃尔泰拉是托斯卡纳最古老的伊特鲁里亚城市之一，拥有超过两千年的历史。这座山城以雪花石膏雕刻工艺闻名于世，城中遍布中世纪塔楼和罗马式建筑。城墙环绕的老城保持着原始的中世纪风貌，游客稀少，氛围宁静而 authentic。远处的梯田和山谷构成了典型的托斯卡纳田园画卷。\n\n拍摄建议：从Piazza dei Priori广场出发，拍摄中世纪宫殿和远处的山丘全景。城外的伊特鲁里亚拱门是经典取景地。傍晚时分，雪花石膏般的大理石建筑在夕阳下泛着暖光，整个城市笼罩在金色氛围中。',
      description_en: 'Volterra is one of Tuscany\'s oldest Etruscan cities with over 2,000 years of history, renowned for its alabaster craftsmanship and well-preserved medieval towers.',
      highlights: JSON.stringify([
        { icon: '🏺', title: '伊特鲁里亚', desc: '两千年古城历史' },
        { icon: '💎', title: '雪花石膏', desc: '传统雕刻工艺之都' },
        { icon: '📸', title: '最佳拍摄', desc: '中世纪广场与城外拱门' },
      ]),
      price: 0, sort_order: 89,
      tags: JSON.stringify(['古城', '伊特鲁里亚', '手工艺', '中世纪']),
    },
    {
      slug: 'milan-duomo', name: '米兰大教堂', name_en: 'Milan Cathedral',
      country: '意大利', country_en: 'Italy', location: '米兰', location_en: 'Milan',
      cover_image: '/uploads/crawled/travel-attractions/milan-duomo.jpg',
      tagline: '哥特式建筑的巅峰之作',
      description: '米兰大教堂是意大利最大的哥特式教堂，也是世界上最大的哥特式建筑之一。建造历时近六个世纪，从1386年延续到1965年。教堂外立面分布着3400尊雕塑、135座尖塔和92座滴水嘴兽，每一处细节都精雕细琢。登上教堂天台，可以近距离欣赏这些精美的石雕，同时俯瞰整个米兰城区和远处的阿尔卑斯山脉。\n\n拍摄建议：从天台拍摄是最不可错过的体验，可以近距离拍摄哥特式尖塔群和雕塑的细节。清晨或傍晚的光线最适合表现白色大理石的纹理。从教堂前方的广场正面取景，可以拍到完整的教堂正立面全景。',
      description_en: 'Milan Cathedral is the largest Gothic church in Italy and one of the largest in the world, taking nearly six centuries to complete. Its facade features 3,400 statues, 135 spires, and 92 gargoyles.',
      highlights: JSON.stringify([
        { icon: '⛪', title: '建筑规模', desc: '世界最大哥特式教堂之一' },
        { icon: '🗿', title: '石雕艺术', desc: '3400尊雕塑' },
        { icon: '📸', title: '最佳拍摄', desc: '天台近距离尖塔群' },
      ]),
      price: 0, sort_order: 90,
      tags: JSON.stringify(['教堂', '哥特式', '城市地标', '建筑艺术']),
    },
    {
      slug: 'galleria-vittorio', name: '埃马努埃莱长廊', name_en: 'Galleria Vittorio Emanuele II',
      country: '意大利', country_en: 'Italy', location: '米兰', location_en: 'Milan',
      cover_image: '/uploads/crawled/travel-attractions/galleria-vittorio.jpg',
      tagline: '世界上最古老的购物中心',
      description: '埃马努埃莱二世长廊建于1867年，是世界上最古老的购物中心之一，也是米兰优雅的代名词。这座十字形的玻璃拱顶长廊连接着米兰大教堂广场和斯卡拉歌剧院，内部装饰着精美的马赛克地板、铸铁结构和壁画。长廊中央的公牛马赛克是必拍之地——传说踩上公牛转一圈会带来好运。\n\n拍摄建议：从长廊入口处拍摄对称的拱顶透视构图是经典机位。抬头仰拍玻璃穹顶和铁艺结构，展现19世纪工业建筑的精美工艺。夜晚灯光亮起时，长廊内金光闪烁，氛围更加迷人。',
      description_en: 'Galleria Vittorio Emanuele II, built in 1867, is one of the world\'s oldest shopping malls and a symbol of Milan\'s elegance. This cruciform glass-vaulted arcade connects the Duomo to La Scala.',
      highlights: JSON.stringify([
        { icon: '🏗️', title: '建筑年代', desc: '1867年玻璃拱顶' },
        { icon: '🐂', title: '公牛马赛克', desc: '踩上转圈带来好运' },
        { icon: '📸', title: '最佳拍摄', desc: '对称拱顶透视构图' },
      ]),
      price: 0, sort_order: 91,
      tags: JSON.stringify(['建筑艺术', '购物', '城市地标', '历史']),
    },
    {
      slug: 'verona-arena', name: '维罗纳竞技场', name_en: 'Verona Arena',
      country: '意大利', country_en: 'Italy', location: '维罗纳', location_en: 'Verona',
      cover_image: '/uploads/crawled/travel-attractions/verona-arena.jpg',
      tagline: '保存最完好的古罗马圆形竞技场',
      description: '维罗纳竞技场建于公元1世纪，是世界上保存最完好的古罗马圆形剧场之一，甚至比罗马斗兽场保存得更好。这座椭圆形竞技场可容纳3万名观众，至今仍用于举办歌剧演出和音乐会。每年夏天的维罗纳歌剧节是世界上最古老的露天歌剧盛会，在星空下聆听歌剧是独一无二的体验。\n\n拍摄建议：从布拉广场(Piazza Bra)拍摄竞技场的全景是最佳角度。进入内部可以拍摄古老的石阶和舞台遗迹。夏季歌剧节期间，烛光与星空交织，是绝佳的拍摄时机。竞技场外墙的粉色大理石在夕阳下格外迷人。',
      description_en: 'Verona Arena, built in the 1st century AD, is one of the best-preserved Roman amphitheatres in the world, still hosting opera performances and concerts in its 30,000-seat capacity.',
      highlights: JSON.stringify([
        { icon: '🏟️', title: '建造年代', desc: '公元1世纪古罗马' },
        { icon: '🎵', title: '歌剧节', desc: '世界最古老露天歌剧' },
        { icon: '📸', title: '最佳拍摄', desc: '布拉广场全景角度' },
      ]),
      price: 0, sort_order: 92,
      tags: JSON.stringify(['古迹', '世界遗产', '歌剧', '城市地标']),
    },
    {
      slug: 'juliet-balcony', name: '朱丽叶阳台', name_en: "Juliet's Balcony",
      country: '意大利', country_en: 'Italy', location: '维罗纳', location_en: 'Verona',
      cover_image: '/uploads/crawled/travel-attractions/juliet-balcony.jpg',
      tagline: '莎士比亚笔下最浪漫的爱情圣地',
      description: '朱丽叶阳台位于维罗纳市中心的一座13世纪中世纪建筑上，因莎士比亚的《罗密欧与朱丽叶》而闻名于世。虽然故事是虚构的，但这座阳台已成为全球恋人朝圣的爱情地标。阳台下方的墙壁被来自世界各地的游客贴满了爱情便签和锁，形成了一面独特的爱情墙。庭院中朱丽叶的铜像也是必拍之处。\n\n拍摄建议：从庭院仰拍阳台是最经典的构图，注意捕捉墙面上的爱情便签作为前景。进入阳台内部可以从高处拍摄庭院全景。清晨游客较少时拍摄效果最佳。附近的香草广场(Piazza delle Erbe)也是很好的补充取景地。',
      description_en: "Juliet's Balcony is located on a 13th-century medieval building in central Verona, famous worldwide as the setting of Shakespeare's Romeo and Juliet. The love notes covering the walls below create a unique wall of devotion.",
      highlights: JSON.stringify([
        { icon: '❤️', title: '爱情地标', desc: '罗密欧与朱丽叶' },
        { icon: '📝', title: '爱情墙', desc: '全球恋人便签' },
        { icon: '📸', title: '最佳拍摄', desc: '清晨庭院仰拍阳台' },
      ]),
      price: 0, sort_order: 93,
      tags: JSON.stringify(['浪漫', '文学', '城市地标', '爱情']),
    },
    {
      slug: 'cinque-terre', name: '五渔村', name_en: 'Cinque Terre',
      country: '意大利', country_en: 'Italy', location: '利古里亚', location_en: 'Liguria',
      cover_image: '/uploads/crawled/travel-attractions/cinque-terre.jpg',
      tagline: '悬崖上的五彩童话世界',
      description: '五渔村由蒙特罗索、韦尔纳扎、科尔尼利亚、马纳罗拉和里奥马焦雷五个悬崖渔村组成，是利古里亚海岸最壮观的风景线。五座色彩斑斓的小镇沿着陡峭的悬崖错落排列，蓝色的地中海、翠绿的葡萄园梯田和暖色调的房屋构成了世界上最上镜的海岸线之一。连接各村的徒步步道穿越于葡萄园和橄榄林之间，是意大利最受欢迎的远足路线。\n\n拍摄建议：从韦尔纳扎港口回望彩色房屋是最经典的明信片角度。马纳罗拉的观景台可以拍摄到五个村庄中最壮观的全景。日落时分，暖色房屋在夕阳映照下更加鲜艳。乘船从海上拍摄五村全景也是绝佳选择。',
      description_en: 'Cinque Terre comprises five colorful cliff-side fishing villages along the Ligurian coast. The pastel-colored houses cascading down steep cliffs above the azure Mediterranean create one of the world\'s most photogenic coastlines.',
      highlights: JSON.stringify([
        { icon: '🏘️', title: '五座渔村', desc: '悬崖上的彩色世界' },
        { icon: '🥾', title: '徒步步道', desc: '连接五村经典路线' },
        { icon: '📸', title: '最佳拍摄', desc: '韦尔纳扎港口或马纳罗拉观景台' },
      ]),
      price: 0, sort_order: 94,
      tags: JSON.stringify(['海岛', '世界遗产', '彩色小镇', '徒步']),
    },
    {
      slug: 'portofino', name: '波托菲诺', name_en: 'Portofino',
      country: '意大利', country_en: 'Italy', location: '利古里亚', location_en: 'Liguria',
      cover_image: '/uploads/crawled/travel-attractions/portofino.jpg',
      tagline: '利古里亚海岸的奢华小港',
      description: '波托菲诺是利古里亚海岸最迷人的小渔村，以其精致的海港、色彩缤纷的建筑和世界级的奢华氛围闻名。小巧的半月形港湾停满了游艇，四周环绕着暖色调的中世纪建筑和棕榈树。这个仅有数百居民的小镇曾是众多名流贵族的度假胜地，如今仍是意大利最顶级的旅游目的地之一。\n\n拍摄建议：从海港对面的Castello Brown拍摄经典的全景角度，可以捕捉到半月形港湾和彩色建筑的完美画面。沿海岸步道前往灯塔，沿途有多个绝佳拍摄点。清晨的宁静港湾和傍晚的金色光线都是最佳创作时机。',
      description_en: 'Portofino is the most charming small fishing village on the Ligurian coast, famous for its picturesque harbor, colorful buildings, and world-class luxury atmosphere. The crescent-shaped bay lined with pastel-colored medieval houses is iconic.',
      highlights: JSON.stringify([
        { icon: '⛵', title: '奢华海港', desc: '名流度假胜地' },
        { icon: '🏰', title: 'Brown城堡', desc: '最佳全景拍摄点' },
        { icon: '📸', title: '最佳拍摄', desc: '海港对面经典角度' },
      ]),
      price: 0, sort_order: 95,
      tags: JSON.stringify(['海港', '彩色小镇', '奢华', '地中海']),
    },
    {
      slug: 'ravello-villa', name: '拉韦洛别墅', name_en: 'Villa Rufolo, Ravello',
      country: '意大利', country_en: 'Italy', location: '阿马尔菲', location_en: 'Amalfi',
      cover_image: '/uploads/crawled/travel-attractions/ravello-villa.jpg',
      tagline: '悬崖花园中的阿马尔菲最美视角',
      description: '拉韦洛是阿马尔菲海岸上海拔最高的小镇，以其壮观的花园别墅和绝美的海岸全景闻名。鲁福洛别墅的花园悬挑于350米高的悬崖之上，俯瞰着整个阿马尔菲海岸线，被誉为"世界上最美的花园"之一。瓦格纳曾在此获得创作灵感，每年夏天的拉韦洛音乐节延续着这份艺术传统。\n\n拍摄建议：从鲁福洛别墅花园的露台拍摄是最经典的机位，可以将花园、悬崖和蔚蓝大海收入同一画面。辛波内别墅的花园同样值得探访，其悬挑露台更为惊险。上午的光线最适合拍摄海岸全景，空气通透，色彩饱和。',
      description_en: 'Ravello sits high above the Amalfi Coast, famous for its spectacular garden villions. Villa Rufolo\'s gardens perch on a 350-meter cliff overlooking the entire coastline, inspiring Wagner and hosting the annual Ravello Music Festival.',
      highlights: JSON.stringify([
        { icon: '🌺', title: '悬崖花园', desc: '350米高空俯瞰海岸' },
        { icon: '🎵', title: '音乐节', desc: '瓦格纳灵感之地' },
        { icon: '📸', title: '最佳拍摄', desc: '鲁福洛别墅花园露台' },
      ]),
      price: 0, sort_order: 96,
      tags: JSON.stringify(['花园', '海岸', '音乐', '悬崖']),
    },
    {
      slug: 'amalfi-town', name: '阿马尔菲镇', name_en: 'Amalfi Town',
      country: '意大利', country_en: 'Italy', location: '阿马尔菲', location_en: 'Amalfi',
      cover_image: '/uploads/crawled/travel-attractions/amalfi-town.jpg',
      tagline: '阿马尔菲海岸的心脏与历史之源',
      description: '阿马尔菲镇是阿马尔菲海岸的名字来源，曾是中世纪强大的海上共和国首都。小镇坐落在陡峭的悬崖脚下，白色的建筑层叠而上，中央的阿马尔菲大教堂以其壮观的阿拉伯-诺曼式正立面和62级台阶成为地标。蜿蜒的小巷通向隐藏的花园和手工作坊，空气中弥漫着柠檬的清香。\n\n拍摄建议：从海上或沿海公路拍摄小镇全景是最壮观的视角。大教堂的阶梯和正立面是镇内最佳取景地。沿Valle delle Ferriere溪谷徒步可以拍摄到瀑布和柠檬园的田园风光。傍晚时分，小镇的灯光倒映在海面上，格外迷人。',
      description_en: 'Amalfi Town, the namesake of the famous coastline, was once the capital of a powerful medieval maritime republic. White buildings cascade up steep cliffs beneath the iconic Arab-Norman cathedral with its 62-step staircase.',
      highlights: JSON.stringify([
        { icon: '⚓', title: '海上共和国', desc: '中世纪航海强权' },
        { icon: '⛪', title: '大教堂', desc: '阿拉伯-诺曼式建筑' },
        { icon: '📸', title: '最佳拍摄', desc: '海上或沿海公路全景' },
      ]),
      price: 0, sort_order: 97,
      tags: JSON.stringify(['海岸', '历史', '小镇', '地中海']),
    },
    {
      slug: 'sorrento', name: '索伦托', name_en: 'Sorrento',
      country: '意大利', country_en: 'Italy', location: '坎帕尼亚', location_en: 'Campania',
      cover_image: '/uploads/crawled/travel-attractions/sorrento.jpg',
      tagline: '那不勒斯湾畔的柠檬香海岸',
      description: '索伦托坐落在那不勒斯湾南端的悬崖之上，是意大利南部最迷人的度假胜地之一。这座小城以柠檬园、利口酒作坊和壮美的海景闻名于世。从索伦托可以远眺维苏威火山和那不勒斯全景，向西则是卡普岛和波西塔诺的轮廓。老城区的教堂、手工艺品店和柠檬树荫下的咖啡馆构成了迷人的南意风情。\n\n拍摄建议：从Tasso广场附近的悬崖花园拍摄那不勒斯湾和维苏威火山的全景。沿海岸步道可以找到多个俯瞰碧蓝海水的拍摄角度。清晨的渔港和日落时分的海岸线都是绝佳的创作时机。别忘了以柠檬树为前景，这是索伦托最具标志性的元素。',
      description_en: 'Sorrento perches on cliffs above the Bay of Naples, one of southern Italy\'s most enchanting resort towns. Famous for its lemon groves, limoncello, and panoramic views of Vesuvius and the Bay of Naples.',
      highlights: JSON.stringify([
        { icon: '🍋', title: '柠檬之都', desc: 'Limoncello原产地' },
        { icon: '🌋', title: '维苏威全景', desc: '远眺火山与海湾' },
        { icon: '📸', title: '最佳拍摄', desc: '悬崖花园俯瞰海湾' },
      ]),
      price: 0, sort_order: 98,
      tags: JSON.stringify(['海岸', '柠檬', '度假', '悬崖']),
    },
    {
      slug: 'capri-blue-grotto', name: '卡普岛蓝洞', name_en: 'Blue Grotto, Capri',
      country: '意大利', country_en: 'Italy', location: '坎帕尼亚', location_en: 'Campania',
      cover_image: '/uploads/crawled/travel-attractions/capri-blue-grotto.jpg',
      tagline: '地中海的蓝色奇迹',
      description: '卡普岛蓝洞是意大利最神奇的自然景观之一。海水通过水下洞穴涌入洞内，阳光透过水面折射出令人难以置信的电光蓝色光芒。洞内长约54米，宽约15米，游客需要乘坐小船通过低矮的入口才能进入。当天气条件完美时，洞内的蓝色光芒如梦如幻，水面闪烁着银色的气泡光芒。\n\n拍摄建议：进入蓝洞需要乘坐小船，拍摄时注意保护相机免受海水溅射。最佳拍摄时间是正午前后，阳光直射时蓝色最为鲜艳。洞外的卡普岛同样精彩——法拉廖尼岩石、奥古斯都花园和安纳卡普里小镇都是绝佳的取景地。',
      description_en: 'The Blue Grotto of Capri is one of Italy\'s most magical natural wonders. Seawater enters through an underwater cave, and sunlight refracts through the water creating an incredible electric blue glow inside the 54-meter-long cavern.',
      highlights: JSON.stringify([
        { icon: '💎', title: '电光蓝', desc: '阳光折射的奇迹' },
        { icon: '🚣', title: '小船入洞', desc: '低矮入口的独特体验' },
        { icon: '📸', title: '最佳拍摄', desc: '正午蓝色最鲜艳' },
      ]),
      price: 0, sort_order: 99,
      tags: JSON.stringify(['海岛', '自然奇观', '蓝洞', '地中海']),
    },
    {
      slug: 'pompei-ruins', name: '庞贝遗址', name_en: 'Pompeii Ruins',
      country: '意大利', country_en: 'Italy', location: '坎帕尼亚', location_en: 'Campania',
      cover_image: '/uploads/crawled/travel-attractions/pompei-ruins.jpg',
      tagline: '被火山灰凝固的古罗马时光',
      description: '庞贝是公元79年维苏威火山喷发中被掩埋的古罗马城市，经过数百年的发掘，成为世界上最重要的考古遗址之一。漫步在保存完好的石板街道上，可以看到古罗马的广场、神庙、浴场、剧场和民居，甚至连面包店的烤炉和墙上的壁画都清晰可见。石膏模型忠实记录了火山喷发那一刻人们的姿态，令人震撼。\n\n拍摄建议：从入口处的维苏威火山方向拍摄遗址全景是经典机位。广场(Foro)周围的柱廊和神庙废墟是最集中的取景区域。细节拍摄同样重要——地面马赛克、墙壁壁画和石膏人像都值得特写。建议预留至少半天时间，遗址面积很大。',
      description_en: 'Pompeii is the ancient Roman city buried by the eruption of Mount Vesuvius in AD 79. After centuries of excavation, it has become one of the world\'s most important archaeological sites, with preserved streets, forums, temples, and frescoes.',
      highlights: JSON.stringify([
        { icon: '🌋', title: '火山掩埋', desc: '公元79年维苏威喷发' },
        { icon: '🏛️', title: '考古遗址', desc: '世界最重要古罗马遗迹' },
        { icon: '📸', title: '最佳拍摄', desc: '广场柱廊与火山全景' },
      ]),
      price: 0, sort_order: 100,
      tags: JSON.stringify(['古迹', '世界遗产', '考古', '历史']),
    },
    {
      slug: 'taormina', name: '陶尔米纳', name_en: 'Taormina',
      country: '意大利', country_en: 'Italy', location: '西西里', location_en: 'Sicily',
      cover_image: '/uploads/crawled/travel-attractions/taormina.jpg',
      tagline: '西西里悬崖上的希腊剧场与爱奥尼亚明珠',
      description: '陶尔米纳是西西里岛东部最迷人的山城，坐落在陶罗山的悬崖之上，俯瞰着爱奥尼亚海和远处的埃特纳火山。这座古希腊-罗马小镇以其保存完好的古希腊剧场、精美的中世纪广场和壮美的海景闻名。翁贝托一世大道被称为"意大利最美步行街"，两旁是精品店、咖啡馆和巴洛克式教堂。\n\n拍摄建议：古希腊剧场是必拍之地，以埃特纳火山为背景的构图举世闻名。从公共花园(Villa Comunale)拍摄海岸全景同样壮观。四月是访问的最佳时节，气候宜人且鲜花盛开。日落时分从城墙高处拍摄，可以将火山、大海和古城尽收一帧。',
      description_en: 'Taormina is Sicily\'s most enchanting hill town, perched on the cliffs of Mount Tauro overlooking the Ionian Sea and Mount Etna. Famous for its well-preserved Greek theatre, medieval piazzas, and the "most beautiful pedestrian street in Italy."',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '希腊剧场', desc: '以埃特纳火山为背景' },
        { icon: '🌸', title: '最美步行街', desc: '翁贝托一世大道' },
        { icon: '📸', title: '最佳拍摄', desc: '剧场内以火山为背景' },
      ]),
      price: 0, sort_order: 101,
      tags: JSON.stringify(['古迹', '海岸', '山城', '希腊']),
    },
    {
      slug: 'palermo', name: '巴勒莫', name_en: 'Palermo',
      country: '意大利', country_en: 'Italy', location: '西西里', location_en: 'Sicily',
      cover_image: '/uploads/crawled/travel-attractions/palermo.jpg',
      tagline: '西西里的阿拉伯-诺曼文化之都',
      description: '巴勒莫是西西里岛的首府，一座融合了阿拉伯、诺曼、拜占庭和巴洛克多种文化风格的千年古城。帕拉提那礼拜堂的金色拜占庭马赛克、诺曼王宫的阿拉伯穹顶和巴勒莫大教堂的多风格融合都是独一无二的建筑杰作。街头市场Ballarò和Vucciria保持着中世纪以来的热闹氛围，是体验西西里市井生活的最佳去处。\n\n拍摄建议：帕拉提那礼拜堂的马赛克是城内最震撼的视觉奇观，金色背景在烛光下闪烁。诺曼王宫和阿拉伯-诺曼风格的建筑群值得系统拍摄。街头市场是人文摄影的天堂，色彩丰富的水果摊和鱼市充满生活气息。四首歌广场的巴洛克喷泉也是经典取景地。',
      description_en: 'Palermo, the capital of Sicily, is a millennium-old city blending Arab, Norman, Byzantine, and Baroque cultural styles. The Palatine Chapel\'s golden Byzantine mosaics and the Norman Palace\'s Arab domes are unique architectural masterpieces.',
      highlights: JSON.stringify([
        { icon: '🕌', title: '文化融合', desc: '阿拉伯-诺曼风格' },
        { icon: '✨', title: '金色马赛克', desc: '帕拉提那礼拜堂' },
        { icon: '📸', title: '最佳拍摄', desc: '礼拜堂马赛克与街头市场' },
      ]),
      price: 0, sort_order: 102,
      tags: JSON.stringify(['古城', '世界遗产', '阿拉伯', '市井文化']),
    },
    {
      slug: 'agrigento-temples', name: '阿格里真托神殿', name_en: 'Valley of the Temples, Agrigento',
      country: '意大利', country_en: 'Italy', location: '西西里', location_en: 'Sicily',
      cover_image: '/uploads/crawled/travel-attractions/agrigento-temples.jpg',
      tagline: '地中海最壮观的希腊神庙群',
      description: '阿格里真托神殿谷是西西里岛最重要的考古遗址，也是地中海地区保存最完好的古希腊神庙群之一，被联合国教科文组织列为世界遗产。这里矗立着七座多立克式神庙，其中最著名的协和神殿是世界上保存最完好的古希腊神庙之一，建于公元前5世纪。傍晚时分，夕阳将神殿的石灰岩柱染成金色，背景是远处的地中海蓝天，场面蔚为壮观。\n\n拍摄建议：日落时分是拍摄的黄金时刻，神殿在夕阳映照下呈现温暖的金色调。协和神殿的正面和侧面都是经典构图角度。夜间的神殿同样值得拍摄，灯光照明下的神殿别有一番庄严氛围。建议从远处的橄榄树林方向拍摄全景。',
      description_en: 'The Valley of the Temples in Agrigento is Sicily\'s most important archaeological site and one of the best-preserved Greek temple complexes in the Mediterranean, a UNESCO World Heritage site with seven Doric temples dating from the 5th century BC.',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '希腊神庙', desc: '七座多立克式神殿' },
        { icon: '🏆', title: '世界遗产', desc: '地中海最壮观遗址' },
        { icon: '📸', title: '最佳拍摄', desc: '日落金色映照神殿' },
      ]),
      price: 0, sort_order: 103,
      tags: JSON.stringify(['古迹', '世界遗产', '希腊', '神殿']),
    },
    {
      slug: 'syracuse-ortigia', name: '锡拉库萨', name_en: 'Syracuse (Ortigia)',
      country: '意大利', country_en: 'Italy', location: '西西里', location_en: 'Sicily',
      cover_image: '/uploads/crawled/travel-attractions/syracuse-ortigia.jpg',
      tagline: '奥提伽岛上的古希腊与巴洛克交融之城',
      description: '锡拉库萨是西西里岛东南部的历史名城，其核心奥提伽岛是一座被碧蓝海水分隔的迷你岛屿城市。这里曾是古希腊世界最强大的城邦之一，阿基米德的故乡。岛上融合了古希腊遗迹、中世纪巷道和巴洛克式教堂，大教堂广场上的锡拉库萨大教堂直接在古希腊神庙的基础上改建而成，是建筑史上的奇迹。 Fonte Aretusa喷泉旁的纸莎草丛为这座地中海小城增添了一抹异域风情。\n\n拍摄建议：大教堂广场是最核心的取景地，巴洛克正立面与古希腊柱廊的融合令人叹为观止。沿海岸步道拍摄奥提伽岛的轮廓和海水倒影。傍晚时分，广场上的暖色灯光和海上日落都是绝佳创作时机。',
      description_en: 'Syracuse, whose core Ortigia island is a miniature city surrounded by azure seas, was once one of the most powerful Greek city-states. The baroque cathedral built directly upon an ancient Greek temple is an architectural marvel.',
      highlights: JSON.stringify([
        { icon: '🏛️', title: '希腊城邦', desc: '阿基米德故乡' },
        { icon: '⛪', title: '神殿教堂', desc: '巴洛克建于希腊神庙之上' },
        { icon: '📸', title: '最佳拍摄', desc: '大教堂广场与海岸步道' },
      ]),
      price: 0, sort_order: 104,
      tags: JSON.stringify(['古城', '世界遗产', '希腊', '巴洛克']),
    },
    {
      slug: 'dolomites', name: '多洛米蒂山', name_en: 'Dolomites',
      country: '意大利', country_en: 'Italy', location: '特伦蒂诺', location_en: 'Trentino',
      cover_image: '/uploads/crawled/travel-attractions/dolomites.jpg',
      tagline: '阿尔卑斯最壮美的白色岩峰群',
      description: '多洛米蒂山脉是意大利东北部最壮观的山岳景观，被联合国教科文组织列为世界自然遗产。白色的白云岩峰顶在日出日落时分会呈现出梦幻的粉红色和金色光芒，被称为"Enrosadira"现象。标志性的三峰山、塞切达山和马尔莫拉达山构成了令人窒息的天际线。山间的高山草甸、清澈的湖泊和精致的山间小屋是户外爱好者的天堂。\n\n拍摄建议：日出和日落时分的"Enrosadira"现象是必拍奇观，岩峰从白色变为粉红金色的过程令人震撼。布莱耶斯湖是拍摄倒影的经典地点。盖斯勒阿尔姆的高山草甸配合塞切达山背景是最明信片式的构图。夏季徒步季节和冬季滑雪季节各有精彩。',
      description_en: 'The Dolomites in northeastern Italy are the most spectacular mountain landscape in the Alps, a UNESCO World Heritage site. The white dolomite peaks glow pink and gold at sunrise and sunset in the famous "Enrosadira" phenomenon.',
      highlights: JSON.stringify([
        { icon: '🏔️', title: '白色岩峰', desc: '白云岩天际线' },
        { icon: '🌅', title: 'Enrosadira', desc: '日落粉金色奇观' },
        { icon: '📸', title: '最佳拍摄', desc: '布莱耶斯湖或盖斯勒阿尔姆' },
      ]),
      price: 0, sort_order: 105,
      tags: JSON.stringify(['山岳', '世界遗产', '阿尔卑斯', '徒步']),
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

  console.log(`\n共插入 ${attractions.length} 个意大利景点`)
  await pool.end()
}

run().catch(e => { console.error(e.message); process.exit(1) })
