/**
 * 本地翻译脚本 - 将所有英文/外文数据翻译为中文
 * 使用内置字典翻译，不调用外部API
 */

const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verra_voile',
})

// ===== 场地名称翻译字典 =====
const NAME_DICT = {
  // France
  'Domaine Santa Maria': '圣玛丽亚庄园',
  'Château La Tour Vaucros': '沃克罗塔堡',
  'Château Comtesse Lafond': '拉丰伯爵夫人堡',
  'Château Saint Laurent': '圣洛朗堡',
  'Château de Vergieres': '韦尔日耶堡',
  'Château de Serre de Parc': '塞尔德帕克堡',
  'samantha bottelier events': '萨曼莎·博特利耶活动策划',
  'Couvent Notre Dame des Prés': '田野圣母修道院',
  'Château le Fresne': '弗雷纳堡',
  'Les Domaines de Patras': '帕特拉庄园',
  'Château de Seguin': '塞吉尼堡',
  'Château le Chéreau': '谢罗堡',
  'Chateau de La Bourlie': '拉布尔利堡',
  'Le Petit Roulet': '小鲁莱庄园',
  'Château de la Jarthe': '雅尔特堡',
  'La Faiseuse De Reves': '织梦庄园',
  'Château Pimo': '皮莫堡',
  'Domaine de Beauregard': '博勒加尔德庄园',
  'Château des Briottières': '布里奥蒂耶尔堡',
  'Domaine de la Chartrognière': '沙尔特罗尼耶尔庄园',
  'Le Mas de la Rose': '玫瑰农庄',
  'Rocabella': '洛卡贝拉',
  'Château de Tresserve': '特雷塞尔沃堡',
  'Château de La Colaissière': '拉科莱西耶尔堡',
  'Mas de la Massane': '马萨讷农庄',
  'La Grange de Javon': '雅翁谷仓',
  'Château Héloïse': '埃洛伊斯堡',
  'Alliance Rêvée': '梦幻联盟',
  "Les Jardins d'Arlias by la Villa Alexandra": '阿利亚斯花园·亚历山德拉别墅',
  'Domaine Terra Rosa': '玫瑰大地庄园',
  'Château de Saint-Martin du Tertre': '圣马丁山丘堡',
  'La Dîme de Giverny': '吉维尼十分之一税所',
  'Château de la Pascalette': '帕斯卡莱特堡',
  'Phyllis Kent Events & Weddings': '菲利斯·肯特婚礼策划',
  'Château de Chantilly': '尚蒂伊城堡',
  'Domaine du Manet': '马内庄园',
  'Le Château de Goulaine': '古莱纳城堡',
  'Château de Villandry': '维朗德里城堡',
  'Château de Chambord': '香波城堡',
  'Abbaye de Talloires': '塔卢瓦爾修道院',
  'Château de La Faye': '拉费堡',
  'Château Sentout': '桑图堡',
  'Domaine Le Grand Belly': '大贝利庄园',
  "Domaine d'Aveny": '阿维尼庄园',
  'Château de Thorens': '托朗堡',
  'Domaine La Plume': '羽笔庄园',
  'Kiss Me in Paris Wedding Planner': '巴黎之吻婚礼策划',
  'Dream Paris Wedding': '巴黎之梦婚礼',
  'Agence Elysée Mariage': '爱丽舍婚礼策划',
  'Wedding Planner France': '法国婚礼策划师',
  'Mon Beau Jour': '我美好的一天',
  'Atout Coeur Evénements': '全心全意活动',
  'Agence La Vie Devant Soi': '美好生活策划机构',
  'L\'Atelier de Camille': '卡米耶工作坊',
  'Château de Villemolin': '维尔莫兰堡',
  'Domaine de Keravalo': '凯拉瓦洛庄园',
  'Manoir de Kerouan': '凯鲁昂庄园',
  'Domaine de la Pinsonnière': '潘索尼耶尔庄园',
  'Le Domaine de Kerlut': '凯尔吕庄园',
  'Domaine du Moulin de Saint-Martin': '圣马丁磨坊庄园',

  // Greece
  'Alsos Nimfon': '宁芙森林',
  'Villa Bordeaux Santorini': '圣托里尼波尔多别墅',
  'Rocabella Santorini Hotel & Spa': '圣托里尼洛卡贝拉水疗酒店',
  'Love Cave': '爱情洞穴',
  'Ktima Orizontes': '地平线庄园',
  'Agaze Bistro Restaurant': '阿加泽小酒馆餐厅',
  'Golf Prive Manor House': '高尔夫私人庄园',
  'Thermes Luxury Villas': '温泉豪华别墅',
  'takimi': '塔基米',

  // Italy
  'Borgo San Rocco Resort': '圣罗克度假村庄',
  'Il Castello di San Ruffino': '圣鲁菲诺城堡',
  'Villa PoggiAlto': '波吉阿尔托别墅',
  'Villa Bartolomea Weddings': '巴托洛梅亚别墅婚礼',
  'La Dolce Wedding Italy': '甜蜜婚礼意大利',
  'Masseria Caselli - Casa Comunale': '卡塞利农庄 - 市政厅',
  'Carradori Ricevimenti': '卡拉多里宴会',
  'Simone Rigamonti': '西蒙·里加蒙蒂',
  'Romance in Italy': '浪漫意大利',
  'Relais La Tenuta Del Gallo': '公鸡庄园度假酒店',
  'Sequerciani': '塞奎尔恰尼',
  'Le Reve': '梦境',
  'Petix Fotografi': '佩蒂克斯摄影',
  'FF Event Design di Federica Filanti': 'FF活动设计',
  'Namaste Indian Catering': '合十礼印度餐饮',
  'Tenuta Voscenza - Casa comunale': '沃申扎庄园 - 市政厅',
  'Officine Visuali Photography': '视觉工坊摄影',
  'SulainisArt Photography & Videography': '苏莱尼斯艺术摄影摄像',
  'Fuego di Gianni Cardì': '詹尼·卡尔迪之火',
  'The Wedding Issue': '婚礼专题',
  'Weweddings': '我们的婚礼',
  'Borgo Bucciano': '布恰诺村庄',
  'I Fiori di Lu': '璐的花卉',
  'Your Destination Wedding in Italy': '你的意大利目的地婚礼',
  'Villa Daniela Grossi': '达妮埃拉·格罗西别墅',
  'Hotel Villa Condulmer': '孔杜尔梅别墅酒店',
  'Relais La Corte Dei Papi': '教皇宫廷度假酒店',
  'FedeFloralDesign': '信仰花艺设计',
  'Altreluci fotografia': '另类光影摄影',
  'Villa Diamante': '钻石别墅',
  'Le Fonti a San Giorgio': '圣乔治泉源',
  'Magic Fire': '魔幻烟火',
  'Villa Giulia - Ristorante Al Terrazzo': '朱莉娅别墅·露台餐厅',
  'Cristalli di Sale': '盐之结晶',
  'Villa Dianella': '迪亚内拉别墅',
  'Giulia Make up Artist & Hair Stylist': '朱莉娅化妆造型师',
  'Villa favorita hotel & events': '钟爱别墅酒店与活动',
  'Borgo Antichi Orti Assisi': '阿西西古园村庄',
  'Villa Le Due Torrette': '双塔别墅',
  'Borgo di Pietrafitta Relais': '皮耶特拉菲塔村庄度假酒店',
  'Fioreria Il Nido Verde': '绿巢花坊',
  'Le 7 Fonti': '七泉庄园',
  'ProfessionalWeddingDJ': '专业婚礼DJ',
  'Macs Drago': '马克斯·德拉戈',
  'Hamalia': '哈马利亚',
  'Il Trappetello': '小橄榄油坊',
  'Terzo di danciano': '丹恰诺第三庄园',
  'Borgo di Castelvecchio': '卡斯泰尔韦基奥村庄',
  'Villa Ormaneto': '奥尔马内托别墅',
  'Miky Events': '米奇活动',
  'Lusenti Photography': '卢森蒂摄影',
  'Golden Bravos': '金色布拉沃斯',
  'Alexandra Kukushkina Photography': '库库什金娜摄影',
  'I Davi Agency': '达维事务所',
  'Villa Brunelli': '布鲁内利别墅',
  'Donatella Mannino Wedding Planner': '多纳泰拉·曼尼诺婚礼策划',
  'GM Events': 'GM活动',
  'luca tibberio': '卢卡·蒂贝里奥',
  'Oak Wedding Music Experience': '橡树婚礼音乐体验',
  'Gjineshmakeup': '吉内什化妆',
  'Castore': '卡斯托雷',
  'Ricca Wedding Stories': '里卡婚礼故事',
  'Italy Bride and Groom Weddings': '意大利新郎新娘婚礼',
  'Castello di Sorgnano': '索尔尼亚诺城堡',
  'Kolbe Hotel Rome': '罗马科尔贝酒店',
  'Villa Relais Il Termine Elba': '埃尔巴岛终点别墅度假酒店',
  'Obbiettivamente iFotografi': '客观摄影',
  'Hotel Corallo': '珊瑚酒店',
  'Barbara Vissani': '芭芭拉·维萨尼',
  'Inesse Handmade Photography': '伊内丝手工摄影',
  'Le Cirque Firenze': '佛罗伦萨马戏团',
  'Tour de Force': '力作',
  'Wine Resort Colsereno': '科尔塞雷诺葡萄酒度假酒店',
  'Wedding DJ Italy': '婚礼DJ意大利',
  'The Hoxton Florence': '佛罗伦萨霍克斯顿酒店',
  'Grand Palladium Sicilia Resort & Spa': '西西里大钯金度假村',
  'Tenuta La Madonnina di Barni': '巴尔尼小圣母庄园',
  'Frac - Wedding Photo e Cinema': 'Frac婚礼摄影与电影',
  'Borgo del Carato': '卡拉托村庄',
  'Confinio Events': '边界活动',
  'Martucci Films': '马图奇影业',
  "Torre d'Ansovigi La Molinella": '安索维吉塔·莫利内拉',
  'Byblos Art Hotel': '比布洛斯艺术酒店',
  'Villa Scorzi': '斯科尔齐别墅',
  'Capo Santa Croce': '圣十字角',
  'Villa Demetra Resort': '德梅特拉别墅度假村',
  'Enissa Maska Make-up Bridal': '恩妮萨·马斯卡新娘化妆',
  'Florence & Flowers': '佛罗伦萨与鲜花',
  'Guadalupe Tuscany Resort': '瓜达卢佩托斯卡纳度假村',
  'Baia dei Faraglioni': '礁石湾',
  "That's Amore": '这就是爱',
  'Progetto White Wedding': '白色婚礼项目',
  'Eventure Microweddings': '微型婚礼活动',
  'I Fiori di Nadia': '纳迪娅的花',
  'Daisy Weddings & Events': '黛西婚礼与活动',
  "That's Amore Weddings Italy": '这就是爱意大利婚礼',
  'Borgo Petroro': '佩特罗罗村庄',
  'Wed in Rome': '罗马婚礼',
  'Giulia Bardini Tuscany Weddings & Events': '朱莉娅·巴尔迪尼托斯卡纳婚礼',
  'The Sense': '感觉',
  'Il Sorriso Ricevimenti': '微笑宴会',
  'Villa Castello Durini': '杜里尼城堡别墅',
  'Betto Dj': '贝托DJ',
  'Villa Rocca 1914': '罗卡别墅1914',
  'Villa Valente': '瓦伦特别墅',
  'Pieve del Castello': '城堡教区',
  'Exclusive Italy Weddings': '尊享意大利婚礼',
  'Villa Pagnana': '帕尼亚纳别墅',
  'Plannet - FVG': '规划网络',
  'Castello di Meleto': '梅莱托城堡',
  'Autoservizi Maiellaro Vitangelo': '马耶拉罗汽车服务',
  'Diego Giusti Fotografo': '迭戈·朱斯蒂摄影师',
  'Villa Castelletti': '小城堡别墅',
  'Tenuta Cherici Mascagni': '凯里奇·马斯卡尼庄园',
  'Castello del Trebbio': '特雷比奥城堡',
  'Al Chiar di Luna': '月光下',
  'The Couplers': '缘分配对',
  'Castello di Rosciano': '罗夏诺城堡',
  'Laura Cabras Music Entertainment': '劳拉·卡布拉斯音乐娱乐',
  'Italea': '意大利海洋',
  'Borgo San Rocco': '圣罗克村庄',
  'Villa San Lorenzo': '圣洛伦佐别墅',
  'Masseria Santa Lucia': '圣卢恰农庄',
  'Il Giardino degli Aranci': '橙园',
  'Villa La Massa': '拉马萨别墅',
  'Castello di Brolio': '布罗利奥城堡',
  'Villa la Pietraia': '拉皮耶特拉亚别墅',
  'Tenuta di Artimino': '阿尔蒂米诺庄园',
  'Villa Cora': '科拉别墅',
  'Il Pellicano': '鹈鹕酒店',
  'La Posta Vecchia': '老邮局',
  'Mezzatorre Hotel & Thermal Spa': '半塔酒店温泉',
  'Villa Tasca': '塔斯卡别墅',
  'Castello di Sammezzano': '萨梅扎诺城堡',
  'Villa Mangiacane': '曼吉亚卡内别墅',
  'Castello di Gabbiano': '鸽堡',
  'Relais Il Termine': '终点度假酒店',
  'Villa Aurelia': '奥雷利亚别墅',
  'Il Borro': '伊尔博罗',
  'La Foce': '拉福切',
  'Castiglion del Bosco': '卡斯蒂廖内森林',
  'Fattoria dei Barbi': '巴尔比农场',
  'Villa Bordoni': '博尔多尼别墅',
  'Tenuta di Spannocchia': '斯潘诺基亚庄园',
  'Borgo Santo Pietro': '圣彼得罗村庄',
  'Castello di Velona': '韦洛纳城堡',
  'La Marsiliana': '马尔西利亚纳',
  'Adler Spa Resort Thermae': '阿德勒温泉度假村',
  'Castello di Casole': '卡索莱城堡',

  // Spain
  'Hotel Alfonso XIII': '阿方索十三世酒店',
  'Ses Cases de Sa Font Seca': '萨丰塞卡庄园',
  'Los Lavaderos de Rojas': '罗哈斯洗衣坊',
  'Secrets Bahia Real Resort & Spa': '巴伊亚皇家秘密度假村',
  'Nixe Palace': '尼克塞宫',
  'St Giles House': '圣贾尔斯庄园',
  'Hotel IPV Palace & Spa ****': 'IPV宫殿温泉酒店',
  "Racó del Pastor": '牧羊人之角',
  'Hotel Ametlla Mar - BodasRV': '阿梅特亚海洋酒店',
  'Los Pilares de Ronda': '龙达柱廊',
  'Hotel Marqués de Riscal': '里斯卡尔侯爵酒店',
  'Finca Las Llamas': '拉马斯庄园',
  'Masía El Saler': '萨莱尔庄园',
  'Hacienda del Cardenal': '主教庄园',
  'Palacio de las Almenas': '箭塔宫',
  'Cortijo Las Nuevas': '拉斯努埃瓦斯农庄',
  'Hotel Doña Blanca': '布兰卡夫人酒店',
  'Villa Padierna Palace Hotel': '帕迪尔纳宫殿别墅酒店',
  'El Lodge': '山间小屋',
  'La Bobadilla, A Royal Hideaway Hotel': '拉博瓦迪利亚皇家隐匿酒店',
  'Finca Villa María': '玛丽亚别墅庄园',
  'Hotel Villa Padierna': '帕迪尔纳别墅酒店',
  'Palacio de Solecio': '索莱西奥宫',
  'La Finca de Segovia': '塞戈维亚庄园',
  'Hotel Palacio de Santa Marta': '圣玛尔塔宫酒店',
  'Castillo de Monda': '蒙达城堡',
  'Hotel Las Casas de la Judería': '犹太区之家酒店',
  'Hacienda San José': '圣何塞庄园',
  'Palacio de los Navas': '纳瓦斯宫',
  'Cortijo Moraira': '莫莱拉农庄',
  'Hotel Monasterio de San Miguel': '圣米格尔修道院酒店',
  'Villa San Miguel': '圣米格尔别墅',
  'El Palace Hotel Barcelona': '巴塞罗那宫殿酒店',
  'Hotel Arts Barcelona': '巴塞罗那艺术酒店',
  'W Barcelona': '巴塞罗那W酒店',
  'Hotel Casa Fuster': '福斯特之家酒店',
  'Majestic Hotel & Spa Barcelona': '巴塞罗那宏伟温泉酒店',
  'Hotel El Palace Barcelona': '巴塞罗那宫殿酒店',
  'ME Barcelona': '巴塞罗那ME酒店',
  'Hotel Ohla Barcelona': '巴塞罗那欧拉酒店',
  'Gran Hotel Torre Catalunya': '加泰罗尼亚塔大酒店',
  'Hilton Diagonal Mar Barcelona': '巴塞罗那对角线海洋希尔顿',
  'Hotel Sercotel Rosellon': '罗塞隆塞尔科特尔酒店',
  'Hotel 1898': '1898酒店',
  'Hotel Omm Barcelona': '巴塞罗那Omm酒店',
  'Gran Hotel Central': '中央大酒店',
  'Hotel Palace GL': '宫殿大酒店',
  'Hotel Ritz Madrid': '马德里丽兹酒店',
  'Hotel Villa Magna': '马格纳别墅酒店',
  'Hotel Único Madrid': '马德里独特酒店',
  'Hotel Orfila': '奥尔菲拉酒店',
  'Hotel Santo Mauro Madrid': '马德里圣莫罗酒店',
  'Hyatt Regency Madrid': '马德里凯悦酒店',
  'Hotel Wellington Madrid': '马德里威灵顿酒店',
  'Hotel Fenix': '凤凰酒店',
  'Hotel Riu Plaza España': '西班牙Riu广场酒店',
  'Gran Meliá Palacio de los Duques': '公爵宫大美利亚酒店',
  'VP Plaza España Design': '西班牙广场VP设计酒店',
  'Hotel Gran Meliá Colón': '哥伦布大美利亚酒店',
  'Hotel Westin Palace Madrid': '马德里威斯汀宫殿酒店',
  'Hotel Madrid Marriott Auditorio': '马德里万豪会议酒店',
  'Hotel Barceló Imagine': '巴塞罗那想象酒店',
  'Hotel Beatriz Toledo': '托莱多贝阿特丽斯酒店',
  'Parador de Toledo': '托莱多国宾馆',
  'Hotel Eurostars Palacio de Buenavista': '布埃纳维斯塔宫欧洲之星酒店',

  // United Kingdom
  // (only 1 record)

  // Portugal (already translated but check)
}

// ===== 通用术语翻译 =====
const TERM_DICT = {
  // 婚礼相关
  'wedding': '婚礼', 'Wedding': '婚礼', 'bride': '新娘', 'groom': '新郎',
  'ceremony': '仪式', 'reception': '宴会', 'venue': '场地', 'venues': '场地',
  'planner': '策划师', 'planning': '策划', 'photography': '摄影',
  'photographer': '摄影师', 'florist': '花艺师', 'floral': '花卉',
  'catering': '餐饮', 'decoration': '装饰', 'music': '音乐', 'DJ': 'DJ',
  'makeup': '化妆', 'hair': '发型', 'stylist': '造型师',
  // 场地类型
  'castle': '城堡', 'château': '城堡', 'villa': '别墅', 'manor': '庄园',
  'estate': '庄园', 'resort': '度假村', 'hotel': '酒店', 'palace': '宫殿',
  'garden': '花园', 'vineyard': '葡萄园', 'farm': '农场', 'barn': '谷仓',
  'church': '教堂', 'chapel': '小教堂', 'abbey': '修道院',
  'masseria': '农庄', 'borgo': '村庄', 'tenuta': '庄园', 'relais': '度假酒店',
  'domaine': '庄园', 'mas': '农庄', 'cortijo': '农庄', 'hacienda': '庄园',
  'finca': '庄园', 'palacio': '宫殿', 'parador': '国宾馆',
  // 描述常用词
  'beautiful': '美丽', 'stunning': '惊艳', 'elegant': '优雅', 'romantic': '浪漫',
  'luxury': '豪华', 'luxurious': '豪华的', 'exclusive': '专属', 'unique': '独特',
  'perfect': '完美', 'ideal': '理想', 'spectacular': '壮观', 'magnificent': '宏伟',
  'charming': '迷人', 'picturesque': '如画', 'breathtaking': '令人叹为观止',
  'landscape': '风景', 'countryside': '乡村', 'garden': '花园', 'terrace': '露台',
  'pool': '泳池', 'spa': '水疗', 'suite': '套房', 'room': '房间',
  'guest': '宾客', 'guests': '宾客', 'capacity': '容量',
  'outdoor': '户外', 'indoor': '室内', 'panoramic': '全景',
  'Mediterranean': '地中海', 'sea': '海', 'ocean': '海洋', 'mountain': '山',
  'lake': '湖', 'river': '河', 'forest': '森林', 'vineyards': '葡萄园',
  'sunset': '日落', 'sunrise': '日出', 'view': '景观', 'views': '景观',
  'historic': '历史', 'traditional': '传统', 'modern': '现代', 'classic': '经典',
  'intimate': '私密', 'private': '私人', 'grand': '盛大', 'majestic': '庄严',
  'event': '活动', 'events': '活动', 'celebration': '庆典', 'party': '派对',
  'food': '美食', 'dinner': '晚宴', 'dining': '餐饮', 'cuisine': '料理',
  'wine': '葡萄酒', 'champagne': '香槟',
  'Please inquire': '请咨询',
}

// venue_types 清洗 - 去掉 WeddingWire UI 噪音
const UI_NOISE = new Set([
  'Planning tools', 'Organize with ease', 'View all', 'Checklist', 'Guests',
  'Seating chart', 'Budget', 'Wedding Vendors', 'Wedding website',
  'Personalize your wedding', 'Engine', 'Date Finder', 'Cost Guide',
  'Color generator', 'Hashtag generator', 'Venues', 'Find your wedding venue',
  'Wedding Vendor Preferences', 'Create your wedding website',
  'All Featured Listings', 'Contact', 'Message', 'About', 'Reviews',
  'Awards', 'Promotions', 'Blog', 'FAQ', 'Portfolio', 'Team',
  'Services', 'Pricing', 'Availability', 'Packages',
])

// 真正的场地类型翻译
const VENUE_TYPE_DICT = {
  'Barns & Farms': '农场与谷仓', 'Country Club': '乡村俱乐部',
  'Estate/Land': '庄园/土地', 'Garden': '花园', 'Hotel': '酒店',
  'Mansion': '庄园', 'Museum': '博物馆', 'Park': '公园',
  'Restaurant': '餐厅', 'Vineyard': '葡萄园', 'Winery': '酒庄',
  'Beach': '海滩', 'Mountain': '山地', 'Resort': '度假村',
  'Palace': '宫殿', 'Castle': '城堡', 'Church': '教堂',
  'Chapel': '小教堂', 'Historic Building': '历史建筑',
  'Indoor': '室内', 'Outdoor': '户外', 'Luxury': '豪华',
  'Wedding Venue': '婚礼场地', 'Wedding Planner': '婚礼策划',
  'Photographer': '摄影师', 'Florist': '花艺师',
  'Caterer': '餐饮服务商', 'DJ/Music': 'DJ/音乐',
  'Makeup Artist': '化妆师', 'Transportation': '交通服务',
}

function translateName(name) {
  if (NAME_DICT[name]) return NAME_DICT[name]
  // 尝试模式匹配翻译
  let cn = name
  // 翻译常见前缀/后缀
  cn = cn.replace(/Hotel\s+/gi, '酒店 ')
  cn = cn.replace(/\s+Resort/gi, ' 度假村')
  cn = cn.replace(/\s+Spa/gi, ' 水疗')
  return cn
}

function translateTerms(text) {
  if (!text) return text
  let result = text
  // 按长度降序替换，避免短词覆盖
  const sorted = Object.entries(TERM_DICT).sort((a, b) => b[0].length - a[0].length)
  for (const [en, zh] of sorted) {
    const regex = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
    result = result.replace(regex, zh)
  }
  return result
}

function cleanVenueTypes(vtJson) {
  try {
    const arr = JSON.parse(vtJson)
    const seen = new Set()
    const cleaned = []
    for (const vt of arr) {
      if (UI_NOISE.has(vt.name)) continue
      if (seen.has(vt.name)) continue
      seen.add(vt.name)
      vt.name_cn = VENUE_TYPE_DICT[vt.name] || vt.name
      cleaned.push(vt)
    }
    if (cleaned.length === 0) cleaned.push({ name: '婚礼场地', name_en: 'Wedding Venue', name_cn: '婚礼场地' })
    return JSON.stringify(cleaned)
  } catch (e) {
    return vtJson
  }
}

function translateTowns(townsJson) {
  try {
    const arr = JSON.parse(townsJson)
    for (const t of arr) {
      if (t.name && !t.name_cn) {
        t.name_cn = translateTerms(t.name)
      }
    }
    return JSON.stringify(arr)
  } catch (e) { return townsJson }
}

function translateGuestCapacities(gcJson) {
  try {
    const arr = JSON.parse(gcJson)
    return JSON.stringify(arr.map(g => {
      if (/please inquire/i.test(g)) return '请咨询'
      return translateTerms(g)
    }))
  } catch (e) { return gcJson }
}

function translateBudgetRanges(brJson) {
  try {
    const arr = JSON.parse(brJson)
    for (const b of arr) {
      if (b.label) b.label_cn = b.label === 'Please inquire' ? '请咨询' : translateTerms(b.label)
    }
    return JSON.stringify(arr)
  } catch (e) { return brJson }
}

function translateFeatures(featuresJson) {
  try {
    const arr = JSON.parse(featuresJson)
    return JSON.stringify(arr.map(f => translateTerms(f)))
  } catch (e) { return featuresJson }
}

async function main() {
  console.log('========================================')
  console.log('本地翻译（内置字典）')
  console.log('========================================')

  // 获取需要翻译的记录
  const [rows] = await pool.execute(
    "SELECT id, name, name_cn, tagline, description, features, venue_types, towns, guest_capacities, budget_ranges FROM crawled_destinations WHERE name_cn = name OR name_cn = '' OR name_cn IS NULL"
  )
  console.log(`需要翻译: ${rows.length} 条`)

  let count = 0
  for (const row of rows) {
    const nameCn = translateName(row.name)
    const taglineCn = translateTerms(row.tagline || '')
    const descCn = translateTerms(row.description || '')
    const featuresCn = translateFeatures(row.features || '[]')
    const venueTypesCn = cleanVenueTypes(row.venue_types || '[]')
    const townsCn = translateTowns(row.towns || '[]')
    const guestCn = translateGuestCapacities(row.guest_capacities || '[]')
    const budgetCn = translateBudgetRanges(row.budget_ranges || '[]')

    await pool.execute(
      `UPDATE crawled_destinations SET name_cn=?, tagline=?, description=?, features=?, venue_types=?, towns=?, guest_capacities=?, budget_ranges=? WHERE id=?`,
      [nameCn, taglineCn, descCn, featuresCn, venueTypesCn, townsCn, guestCn, budgetCn, row.id]
    )
    count++
    if (count % 20 === 0 || count <= 3) {
      console.log(`  [${count}/${rows.length}] ${row.name.substring(0,30)} → ${nameCn.substring(0,30)}`)
    }
  }

  console.log(`\n翻译完成: ${count} 条`)

  // 验证
  const [stats] = await pool.execute('SELECT country, country_cn, COUNT(*) as cnt FROM crawled_destinations GROUP BY country, country_cn ORDER BY cnt DESC')
  console.log('\n--- 数据统计 ---')
  stats.forEach(s => console.log(`  ${s.country_cn} (${s.country}): ${s.cnt} 条`))
  const [total] = await pool.execute('SELECT COUNT(*) as cnt FROM crawled_destinations')
  console.log(`  总计: ${total[0].cnt} 条`)

  // 抽样检查翻译结果
  console.log('\n--- 翻译抽样 ---')
  const [samples] = await pool.execute('SELECT name, name_cn, LEFT(tagline,60) as tagline_cn FROM crawled_destinations WHERE name_cn != name LIMIT 10')
  samples.forEach(s => console.log(`  ${s.name} → ${s.name_cn}\n    ${s.tagline_cn}`))

  await pool.end()
  console.log('\n完成！')
}

main().catch(err => { console.error('致命错误:', err); process.exit(1) })
