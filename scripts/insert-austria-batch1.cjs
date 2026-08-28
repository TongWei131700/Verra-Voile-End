const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['vienna-schonbrunn','美泉宫','Schönbrunn Palace','奥地利','Austria','维也纳','Vienna','哈布斯堡帝国的夏宫','🏰 巴洛克宫殿 | 1441个房间 | 世界遗产',
   '美泉宫是哈布斯堡帝国最宏伟的夏宫，拥有1441个房间的巴洛克式宫殿和壮丽的花园。宫殿内部的洛可可装饰金碧辉煌，后山的Gloriette观景台可以俯瞰整个宫殿和维也纳。2001年被列为世界遗产。\n\n拍摄建议：从Gloriette观景台俯拍宫殿和花园的全景是最经典的角度。宫殿正面的巴洛克立面也很壮观。花园中的迷宫花园和海神喷泉是绝佳的取景元素。',
   'Schönbrunn Palace is the Habsburg Empire\'s most magnificent summer residence, with 1,441 rooms of Baroque splendor and stunning gardens. The Gloriette viewpoint overlooks the entire palace.',
   [{icon:'🏰',title:'哈布斯堡夏宫',desc:'1441个房间巴洛克宫殿'},{icon:'🏆',title:'世界遗产',desc:'巴洛克宫殿与花园'},{icon:'📸',title:'最佳拍摄',desc:'Gloriette俯拍宫殿全景'}],
   ['宫殿','巴洛克','世界遗产','维也纳']],
  ['vienna-belvedere','美景宫','Belvedere Palace','奥地利','Austria','维也纳','Vienna','克林姆特《吻》的永久居所','🏰 巴洛克宫殿 | 克林姆特《吻》 | 上宫下宫',
   '美景宫由两座巴洛克宫殿组成，上宫和下宫之间的法式花园是维也纳最美的城市绿地。上宫收藏着克林姆特的名画《吻》和席勒的表现主义杰作，是全世界最重要的艺术收藏之一。\n\n拍摄建议：从下宫花园拍摄上宫正面的巴洛克立面是最经典的角度。花园中的喷泉和雕塑是很好的前景元素。宫殿内部的克林姆特《吻》原作也值得近距离欣赏。',
   'The Belvedere consists of two Baroque palaces with a French garden between them. The Upper Belvedere houses Klimt\'s "The Kiss" and Schiele\'s Expressionist masterpieces.',
   [{icon:'🏰',title:'双宫殿',desc:'上宫下宫法式花园'},{icon:'🎨',title:'克林姆特',desc:'《吻》的永久居所'},{icon:'📸',title:'最佳拍摄',desc:'花园拍摄上宫立面'}],
   ['宫殿','艺术','巴洛克','维也纳']],
  ['st-stephens-cathedral','圣斯蒂芬大教堂','St. Stephen\'s Cathedral','奥地利','Austria','维也纳','Vienna','维也纳天际线的哥特之魂','⛪ 哥特式地标 | 彩色屋顶 | 维也纳心脏',
   '圣斯蒂芬大教堂是维也纳的标志性建筑，这座哥特式大教堂的彩色琉璃瓦屋顶和南塔是城市天际线最醒目的元素。教堂始建于12世纪，融合了罗马式和哥特式风格。登上343级台阶到南塔顶可以360度俯瞰维也纳全城。\n\n拍摄建议：从教堂前的广场拍摄正面全景是最经典的角度。彩色琉璃瓦屋顶从远处拍摄最为壮观。登上南塔俯拍维也纳全城是最佳的城市全景体验。',
   'St. Stephen\'s Cathedral is Vienna\'s iconic landmark, with its colorful tiled roof and south tower defining the city skyline. Built from the 12th century, blending Romanesque and Gothic styles.',
   [{icon:'⛪',title:'哥特之魂',desc:'维也纳最标志性建筑'},{icon:'🎨',title:'彩色屋顶',desc:'琉璃瓦屋顶城市地标'},{icon:'📸',title:'最佳拍摄',desc:'广场正面全景角度'}],
   ['教堂','哥特式','地标','维也纳']],
  ['vienna-state-opera','维也纳国家歌剧院','Vienna State Opera','奥地利','Austria','维也纳','Vienna','世界歌剧的最高殿堂','🎵 世界歌剧中心 | 新年音乐会 | 金色大厅',
   '维也纳国家歌剧院是全世界最重要的歌剧院，每年举办的维也纳新年音乐会是全球古典音乐界的盛事。这座新文艺复兴建筑内部金碧辉煌，大理石阶梯和水晶吊灯营造出无与伦比的艺术氛围。即使不观看演出，参观内部也值得。\n\n拍摄建议：从歌剧院对面的街道拍摄建筑正面全景是最经典的角度。建筑内部的金色阶梯和大厅也很壮观。新年音乐会期间的装饰灯光格外迷人。',
   'The Vienna State Opera is the world\'s most important opera house, hosting the annual Vienna New Year\'s Concert, a highlight of the global classical music calendar.',
   [{icon:'🎵',title:'歌剧殿堂',desc:'全世界最重要歌剧院'},{icon:'🎶',title:'新年音乐会',desc:'全球古典音乐盛事'},{icon:'📸',title:'最佳拍摄',desc:'对面街道建筑正面全景'}],
   ['歌剧院','音乐','维也纳','古典']],
  ['hofburg-palace','霍夫堡宫','Hofburg Palace','奥地利','Austria','维也纳','Vienna','哈布斯堡帝国的冬宫','🏰 帝国冬宫 | 茜茜公主博物馆 | 西班牙骑术学校',
   '霍夫堡宫是哈布斯堡帝国600多年的冬宫，如今是奥地利总统府。宫殿群包含茜茜公主博物馆、皇家银器馆和西班牙骑术学校。宏伟的广场和巴洛克大门诉说着帝国的辉煌历史。\n\n拍摄建议：从英雄广场拍摄霍夫堡宫正面全景是最经典的角度。宫殿内部的皇家套房和银器馆也值得参观。瑞士门和帝国图书馆是绝佳的建筑摄影题材。',
   'Hofburg Palace was the Habsburg Empire\'s winter palace for over 600 years, now the Austrian Presidential Office. The complex includes the Sisi Museum, Imperial Silver Collection, and Spanish Riding School.',
   [{icon:'🏰',title:'帝国冬宫',desc:'哈布斯堡600年冬宫'},{icon:'👑',title:'茜茜公主',desc:'博物馆与皇家收藏'},{icon:'📸',title:'最佳拍摄',desc:'英雄广场正面全景'}],
   ['宫殿','帝国','维也纳','哈布斯堡']],
  ['prater-ferris-wheel','普拉特摩天轮','Prater Ferris Wheel','奥地利','Austria','维也纳','Vienna','百年历史的维也纳地标','🎡 1897年摩天轮 | 游乐园地标 | 维也纳全景',
   '普拉特摩天轮建于1897年，是世界上最古老的摩天轮之一，也是维也纳最具标志性的游乐设施。从65米高空可以俯瞰多瑙河和维也纳全城。普拉特公园内还有数百种游乐设施和传统的小酒馆。\n\n拍摄建议：从公园内拍摄摩天轮与维也纳天际线的组合全景是最经典的角度。夜晚摩天轮的灯光照明格外迷人。从摩天轮顶部拍摄维也纳全景也很壮观。',
   'The Prater Ferris Wheel was built in 1897, one of the world\'s oldest ferris wheels and Vienna\'s most iconic amusement ride. From 65 meters high, you can overlook the Danube and the entire city.',
   [{icon:'🎡',title:'百年摩天轮',desc:'1897年世界最古老之一'},{icon:'🌃',title:'维也纳全景',desc:'65米高空俯瞰全城'},{icon:'📸',title:'最佳拍摄',desc:'公园内摩天轮天际线'}],
   ['摩天轮','游乐园','维也纳','地标']],
  ['salzburg-fortress','萨尔茨堡要塞','Salzburg Fortress','奥地利','Austria','萨尔茨堡','Salzburg','阿尔卑斯山上的千年要塞','🏰 欧洲最大城堡 | 1077年 | 萨尔茨堡全景',
   '霍恩萨尔茨堡要塞是欧洲最大、保存最完好的中世纪城堡之一，建于1077年，矗立在萨尔茨堡上方的山上。从要塞可以360度俯瞰萨尔茨堡老城、萨尔察赫河和远处的阿尔卑斯山脉。千年以来从未被攻破。\n\n拍摄建议：从要塞城墙拍摄萨尔茨堡老城和阿尔卑斯山的全景是最经典的角度。从老城方向拍摄要塞矗立在山上的画面也很壮观。日落时分的金色光线笼罩整个城市。',
   'Hohensalzburg Fortress is one of Europe\'s largest and best-preserved medieval castles, built in 1077 atop the mountain above Salzburg. Never breached in its thousand-year history.',
   [{icon:'🏰',title:'欧洲最大',desc:'保存最完好中世纪城堡'},{icon:'🏔️',title:'阿尔卑斯',desc:'360度俯瞰老城与山脉'},{icon:'📸',title:'最佳拍摄',desc:'城墙拍摄老城山脉全景'}],
   ['城堡','要塞','萨尔茨堡','中世纪']],
  ['salzburg-mirabell','米拉贝尔花园','Mirabell Garden','奥地利','Austria','萨尔茨堡','Salzburg','《音乐之声》的浪漫花园','🌹 巴洛克花园 | 音乐之声 | 萨尔茨堡地标',
   '米拉贝尔花园是萨尔茨堡最美丽的巴洛克花园，也是电影《音乐之声》中"Do-Re-Mi"场景的拍摄地。精心修剪的花坛、大理石雕像和喷泉构成了完美的对称格局。花园正对萨尔茨堡要塞，是城市最浪漫的地方。\n\n拍摄建议：从花园中央的喷泉拍摄对称花坛和远处要塞的全景是最经典的角度。花园中的飞马雕塑和大理石大厅也很上镜。春季鲜花盛开时最为迷人。',
   'Mirabell Garden is Salzburg\'s most beautiful Baroque garden, famous as the filming location of the "Do-Re-Mi" scene in "The Sound of Music." Manicured flower beds and marble statues create perfect symmetry.',
   [{icon:'🌹',title:'巴洛克花园',desc:'最美丽的巴洛克花园'},{icon:'🎵',title:'音乐之声',desc:'Do-Re-Mi拍摄地'},{icon:'📸',title:'最佳拍摄',desc:'喷泉拍摄对称花坛要塞'}],
   ['花园','巴洛克','音乐之声','萨尔茨堡']],
  ['melody-hill','音乐之声山','Sound of Music Hill','奥地利','Austria','萨尔茨堡','Salzburg','音乐之声的经典取景地','🎵 音乐之声 | 阿尔卑斯草甸 | 萨尔茨堡郊外',
   '音乐之声山是电影《音乐之声》中玛丽亚和孩子们在阿尔卑斯山丘上歌唱"Music is living inside of you"的经典取景地。翠绿的草甸延伸到远处的雪山脚下，构成了奥地利最经典的田园画面。\n\n拍摄建议：从草甸高处拍摄远处阿尔卑斯雪山的全景是最经典的角度。春季的野花和夏季的绿草最为迷人。清晨的薄雾笼罩山谷时如同仙境。',
   'Sound of Music Hill is the classic filming location where Maria and the children sing "Music is living inside of you" on the Alpine meadow. Green meadows stretching to the snow-capped mountains.',
   [{icon:'🎵',title:'音乐之声',desc:'经典歌唱场景取景地'},{icon:'🏔️',title:'阿尔卑斯',desc:'翠绿草甸延伸至雪山'},{icon:'📸',title:'最佳拍摄',desc:'草甸高处雪山全景'}],
   ['音乐之声','阿尔卑斯','草甸','萨尔茨堡']],
  ['innsbruck-golden-roof','黄金屋顶','Golden Roof, Innsbruck','奥地利','Austria','因斯布鲁克','Innsbruck','中世纪皇城的金色标志','🏰 2657片金箔瓦 | 马克西米利安一世 | 老城中心',
   '黄金屋顶是因斯布鲁克最具标志性的建筑，由马克西米利安一世于15世纪建造，屋顶覆盖着2657片镀金铜瓦。这座华丽的阳台曾是皇帝观赏广场庆典的御座。周围的老城被彩色房屋和阿尔卑斯山环绕。\n\n拍摄建议：从广场对面拍摄黄金屋顶和周围彩色房屋的全景是最经典的角度。屋顶的金色瓦片在阳光下闪闪发光。周围的老城巷道和阿尔卑斯山背景也很值得拍摄。',
   'The Golden Roof is Innsbruck\'s most iconic building, built by Emperor Maximilian I in the 15th century with 2,657 gilded copper tiles. The ornate balcony was the emperor\'s viewing box for square celebrations.',
   [{icon:'🏰',title:'金色标志',desc:'2657片镀金铜瓦屋顶'},{icon:'👑',title:'皇帝阳台',desc:'马克西米利安一世建造'},{icon:'📸',title:'最佳拍摄',desc:'广场对面金色屋顶全景'}],
   ['屋顶','黄金','因斯布鲁克','中世纪']],
  ['grossglockner','大格洛克纳山','Grossglockner','奥地利','Austria','克恩顿','Carinthia','奥地利最高峰的冰川奇观','🏔️ 3798米 | 奥地利最高峰 | 冰川公路',
   '大格洛克纳山是奥地利最高峰，海拔3798米。通往山顶的大格洛克纳高山公路是欧洲最壮观的山路之一，沿途经过冰川、瀑布和高山牧场。山顶的帕斯特泽冰川是东阿尔卑斯最大的冰川。\n\n拍摄建议：从高山公路的观景点拍摄大格洛克纳峰和冰川的全景是最经典的角度。日出和日落时分的金色光线照射在雪峰上最为壮观。沿途的瀑布和高山湖泊也很上镜。',
   'Grossglockner is Austria\'s highest peak at 3,798 meters. The Grossglockner High Alpine Road is one of Europe\'s most spectacular mountain routes, passing glaciers, waterfalls, and Alpine meadows.',
   [{icon:'🏔️',title:'奥地利最高',desc:'3798米最高峰'},{icon:'🛣️',title:'冰川公路',desc:'欧洲最壮观山路'},{icon:'📸',title:'最佳拍摄',desc:'公路观景点雪峰冰川'}],
   ['山峰','最高峰','冰川','公路']],
  ['wachau-valley','瓦豪河谷','Wachau Valley','奥地利','Austria','下奥地利','Lower Austria','多瑙河畔的葡萄酒天堂','🍇 多瑙河谷 | 梯田葡萄园 | 世界遗产',
   '瓦豪河谷是多瑙河最美丽的一段，从梅尔克到克雷姆斯的30公里河谷布满了梯田葡萄园、中世纪城堡和葡萄酒小镇。2000年被列为世界遗产。乘坐多瑙河游船穿越河谷是最佳的体验方式。\n\n拍摄建议：从葡萄园梯田拍摄多瑙河和小镇的全景是最经典的角度。秋季葡萄收获时的金黄色调最为迷人。乘坐游船从水面角度拍摄两岸也很壮观。',
   'The Wachau Valley is the most beautiful stretch of the Danube, with 30km of terraced vineyards, medieval castles, and wine villages from Melk to Krems. A UNESCO World Heritage site since 2000.',
   [{icon:'🍇',title:'葡萄酒谷',desc:'多瑙河最美30公里'},{icon:'🏆',title:'世界遗产',desc:'梯田葡萄园与城堡'},{icon:'📸',title:'最佳拍摄',desc:'葡萄园拍摄多瑙河全景'}],
   ['河谷','葡萄酒','多瑙河','世界遗产']],
  ['melk-abbey','梅尔克修道院','Melk Abbey','奥地利','Austria','下奥地利','Lower Austria','多瑙河畔的巴洛克明珠','⛪ 巴洛克修道院 | 多瑙河悬崖 | 世界遗产',
   '梅尔克修道院矗立在多瑙河畔70米高的岩石上，是奥地利最壮观的巴洛克建筑之一。这座本笃会修道院建于11世纪，内部的图书馆和大理石厅金碧辉煌。从修道院的花园可以俯瞰多瑙河和瓦豪河谷的壮丽全景。\n\n拍摄建议：从多瑙河对岸拍摄修道院矗立在岩石上的全景是最经典的角度。修道院内部的图书馆和大理石厅也值得拍摄。日落时分修道院在金色光线中格外壮观。',
   'Melk Abbey stands on a 70-meter rock above the Danube, one of Austria\'s most spectacular Baroque buildings. This Benedictine monastery dates from the 11th century with magnificent library and marble halls.',
   [{icon:'⛪',title:'巴洛克明珠',desc:'多瑙河畔最壮观建筑'},{icon:'📚',title:'皇家图书馆',desc:'金碧辉煌的内部装饰'},{icon:'📸',title:'最佳拍摄',desc:'河对岸修道院岩石全景'}],
   ['修道院','巴洛克','多瑙河','世界遗产']],
  ['grammair-neusiedl','新锡德尔湖','Neusiedler See','奥地利','Austria','布尔根兰','Burgenland','中欧最大的草原湖','🌊 草原湖 | 芦苇荡 | 世界遗产',
   '新锡德尔湖是中欧最大的草原湖，也是奥地利最浅的湖泊。广阔的芦苇荡是欧洲最重要的鸟类栖息地之一，被列为世界遗产。湖边的葡萄酒小镇和风力磨坊是布尔根兰州的标志景观。\n\n拍摄建议：从湖边拍摄芦苇荡和日落的全景是最经典的角度。湖边的风力磨坊是很好的前景元素。秋季候鸟迁徙时的鸟群画面非常壮观。',
   'Neusiedler See is Central Europe\'s largest steppe lake and Austria\'s shallowest. The vast reed beds are one of Europe\'s most important bird habitats, a UNESCO World Heritage site.',
   [{icon:'🌊',title:'草原湖',desc:'中欧最大草原湖'},{icon:'🐦',title:'鸟类天堂',desc:'欧洲最重要鸟类栖息地'},{icon:'📸',title:'最佳拍摄',desc:'湖边芦苇荡日落全景'}],
   ['湖泊','草原','世界遗产','布尔根兰']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 252
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
  console.log(`\n共插入 ${items.length} 个奥地利景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
