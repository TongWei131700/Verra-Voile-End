const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['neuschwanstein-castle','新天鹅城堡','Neuschwanstein Castle','德国','Germany','巴伐利亚','Bavaria','童话般的巴伐利亚山间城堡','🏰 童话城堡 | 路德维希二世的梦境 | 阿尔卑斯山湖畔',
   '新天鹅城堡是德国最受欢迎的旅游景点，也是浪漫主义建筑的巅峰之作。这座由巴伐利亚国王路德维希二世下令建造的"童话城堡"，坐落在巴伐利亚阿尔卑斯山的翠绿山巅，俯瞰着如镜的阿尔普湖。城堡内部融合了拜占庭、哥特和摩尔式风格，每一间大厅都如同童话场景。\n\n拍摄建议：从玛丽安桥拍摄城堡与山谷的经典全景是必到之处。秋季红叶环绕时最为壮观，冬季白雪覆盖时如同童话场景。清晨的薄雾笼罩山谷时，城堡如同漂浮在云端。',
   'Neuschwanstein Castle is Germany\'s most visited landmark, a pinnacle of Romantic architecture. Built by King Ludwig II as a "fairy-tale castle" in the Bavarian Alps, overlooking the mirror-like Alpsee lake.',
   [{icon:'🏰',title:'童话城堡',desc:'路德维希二世的梦境'},{icon:'🍂',title:'四季皆美',desc:'秋叶冬雪各有精彩'},{icon:'📸',title:'最佳拍摄',desc:'玛丽安桥经典全景'}],
   ['城堡','童话','阿尔卑斯','世界遗产']],
  ['brandenburg-gate','勃兰登堡门','Brandenburg Gate','德国','Germany','柏林','Berlin','柏林统一的象征','🏛️ 新古典主义地标 | 冷战分裂见证 | 统一象征',
   '勃兰登堡门是柏林最具标志性的地标，也是德国统一的象征。这座建于1791年的新古典主义凯旋门以雅典卫城的入口为蓝本，顶部矗立着胜利女神驾驶四马战车的铜像。冷战时期，这座门矗立在柏林墙前，成为东西方分裂的象征。1989年柏林墙倒塌后，它重新成为德国统一的标志。\n\n拍摄建议：从六月十七日大街方向拍摄勃兰登堡门的正面全景是最经典的角度。夜间灯光照明下的勃兰登堡门格外庄严。附近的国会大厦和巴黎广场也是很好的补充取景地。',
   'The Brandenburg Gate is Berlin\'s most iconic landmark and symbol of German reunification. Built in 1791, this Neoclassical triumphal arch was inspired by the Acropolis entrance, topped with the Quadriga chariot.',
   [{icon:'🏛️',title:'新古典主义',desc:'1791年普鲁士杰作'},{icon:'🕊️',title:'统一象征',desc:'从分裂到统一的地标'},{icon:'📸',title:'最佳拍摄',desc:'六月十七日大街正面'}],
   ['城市地标','历史','柏林','新古典主义']],
  ['berlin-wall-memorial','柏林墙纪念馆','Berlin Wall Memorial','德国','Germany','柏林','Berlin','冷战历史的永恒记忆','🧱 冷战遗迹 | 分裂与统一的见证 | 历史教育',
   '柏林墙纪念馆位于伯诺尔大街，是纪念柏林墙和德国分裂历史最重要的场所。这里保留着原柏林墙的一段完整遗迹，包括外墙、死亡地带和瞭望塔。纪念馆的露天展览通过照片、文件和多媒体展示了柏林墙的历史。地面上的铁条标记着墙的走向，提醒着人们这座城市曾经的伤痕。\n\n拍摄建议：保留的柏林墙段落和瞭望塔是最核心的取景对象。地面上的铁条标记和十字架纪念也是重要的拍摄内容。建议结合附近的东边画廊(East Side Gallery)一同拍摄。',
   'The Berlin Wall Memorial on Bernauer Straße is the most important site for commemorating the Berlin Wall and German division. It preserves a complete section of the wall including the death strip and watchtower.',
   [{icon:'🧱',title:'冷战遗迹',desc:'完整柏林墙段落'},{icon:'📚',title:'历史教育',desc:'多媒体展览与纪念'},{icon:'📸',title:'最佳拍摄',desc:'保留墙段与瞭望塔'}],
   ['历史','冷战','柏林','纪念馆']],
  ['museum-island','博物馆岛','Museum Island','德国','Germany','柏林','Berlin','施普雷岛上的文化宝库','🏛️ 五座世界级博物馆 | 世界遗产 | 普鲁士文化',
   '博物馆岛是施普雷河上的一座小岛，集中了五座世界级博物馆，被联合国教科文组织列为世界遗产。佩加蒙博物馆的巴比伦伊什塔尔门和佩加蒙祭坛、新博物馆的纳芙蒂蒂胸像、老博物馆的希腊罗马收藏都是人类文明的瑰宝。詹姆斯·西蒙画廊的现代建筑为这座历史岛屿增添了当代元素。\n\n拍摄建议：从施普雷河上或桥上拍摄五座博物馆建筑群的全景是最经典的角度。佩加蒙博物馆内部的古代建筑原件（如伊什塔尔门）是独特的室内拍摄题材。',
   'Museum Island is a UNESCO World Heritage site on the Spree River, housing five world-class museums. The Pergamon Museum\'s Ishtar Gate and the Neues Museum\'s Nefertiti Bust are treasures of human civilization.',
   [{icon:'🏛️',title:'五座博物馆',desc:'世界级文化宝库'},{icon:'🏆',title:'世界遗产',desc:'普鲁士文化巅峰'},{icon:'📸',title:'最佳拍摄',desc:'施普雷河全景角度'}],
   ['博物馆','世界遗产','柏林','文化']],
  ['reichstag-building','国会大厦','Reichstag Building','德国','Germany','柏林','Berlin','德国民主的殿堂','🏛️ 玻璃穹顶设计 | 德国议会所在地 | 历史与现代融合',
   '德国国会大厦是联邦议院的所在地，也是柏林最重要的历史建筑之一。始建于1894年，二战后一度废弃，1990年代由诺曼·福斯特爵士主持修复，在建筑顶部增建了标志性的玻璃穹顶。这座穹顶不仅是建筑杰作，更象征着德国民主的透明与开放。从穹顶内部的螺旋坡道可以360度俯瞰柏林全城。\n\n拍摄建议：玻璃穹顶内部是最具辨识度的拍摄对象，螺旋坡道和镜面反射构成独特的视觉效果。傍晚至夜间，穹顶的灯光照明和柏林夜景是最佳拍摄时机。建筑外立面的"Wrapped"历史痕迹也值得拍摄。',
   'The Reichstag Building houses the German parliament and is one of Berlin\'s most important historic buildings. Originally built in 1894, it was renovated by Sir Norman Foster with an iconic glass dome symbolizing transparency and democracy.',
   [{icon:'🏛️',title:'民主殿堂',desc:'联邦议院所在地'},{icon:'🔮',title:'玻璃穹顶',desc:'福斯特设计的杰作'},{icon:'📸',title:'最佳拍摄',desc:'穹顶内部螺旋坡道'}],
   ['建筑','历史','柏林','民主']],
  ['sanssouci-palace','无忧宫','Sanssouci Palace','德国','Germany','波茨坦','Potsdam','普鲁士的凡尔赛','🏰 洛可可式杰作 | 腓特烈大帝的夏宫 | 梯田葡萄园',
   '无忧宫是普鲁士国王腓特烈大帝的夏宫，被誉为"普鲁士的凡尔赛"。这座精致的洛可可式宫殿只有单层，以柔和的黄色外墙和金色装饰闻名。宫殿建在六级梯田葡萄园之上，体现了腓特烈大帝对葡萄酒和哲学的热爱。宫殿公园占地约500英亩，散布着中国茶亭、新宫和罗马浴场等建筑。\n\n拍摄建议：从梯田葡萄园方向拍摄宫殿正面的经典全景是最受欢迎的角度。宫殿公园内的中国茶亭和新宫也值得探访。春季花开和秋季金色落叶时最为美丽。',
   'Sanssouci Palace, Frederick the Great\'s summer residence, is known as the "Prussian Versailles." This exquisite Rococo palace sits atop six terraced vineyards, embodying the king\'s love of wine and philosophy.',
   [{icon:'🏰',title:'洛可可杰作',desc:'普鲁士凡尔赛'},{icon:'🍇',title:'梯田葡萄园',desc:'六级梯田上的宫殿'},{icon:'📸',title:'最佳拍摄',desc:'梯田方向正面全景'}],
   ['宫殿','洛可可','世界遗产','花园']],
  ['cologne-cathedral','科隆大教堂','Cologne Cathedral','德国','Germany','科隆','Cologne','哥特式建筑的终极杰作','⛪ 双塔157米 | 建造耗时632年 | 世界遗产',
   '科隆大教堂是哥特式建筑的巅峰之作，双塔高达157米，曾是世界上最高的建筑。建造始于1248年，直到1880年才最终完工，历时632年。教堂内供奉着东方三博士的圣骸箱，是基督教最重要的朝圣地之一。二战中教堂严重受损但屹立不倒，成为科隆重生的象征。\n\n拍摄建议：从火车站广场拍摄大教堂正面全景是最经典的角度，可以将双塔和中央尖顶收入画面。从莱茵河对岸拍摄可以包含河流元素。登塔533级台阶可以俯瞰科隆全城和莱茵河。',
   'Cologne Cathedral is the pinnacle of Gothic architecture, its twin towers reaching 157 meters. Construction began in 1248 and took 632 years to complete. It houses the Shrine of the Three Kings, one of Christianity\'s most important pilgrimage sites.',
   [{icon:'⛪',title:'157米双塔',desc:'哥特式建筑巅峰'},{icon:'⏰',title:'632年工期',desc:'1248年至1880年'},{icon:'📸',title:'最佳拍摄',desc:'火车站广场正面全景'}],
   ['教堂','世界遗产','哥特式','城市地标']],
  ['munich-marienplatz','玛利亚广场','Marienplatz','德国','Germany','慕尼黑','Munich','慕尼黑的心脏与灵魂','🏛️ 新市政厅钟琴 | 哥特式建筑群 | 圣诞市场中心',
   '玛利亚广场是慕尼黑的中心广场，也是这座城市最热闹的地方。广场中央的玛利亚柱建于1638年，四周被宏伟的新市政厅和旧市政厅环绕。新市政厅的钟琴表演每天定时上演，自动人偶在钟声中演绎着1558年的骑士比武场景。广场还是慕尼黑圣诞市场的传统举办地，每年冬天的圣诞集市是欧洲最著名的之一。\n\n拍摄建议：从广场角落仰拍新市政厅的哥特式立面和钟琴是最经典的角度。每天定时上演的钟琴表演值得等待拍摄。圣诞市场期间的灯光和装饰让广场格外迷人。',
   'Marienplatz is Munich\'s central square and the city\'s liveliest spot. The centerpiece is the Mariensäule from 1638, surrounded by the magnificent Neo-Gothic New Town Hall with its famous Glockenspiel.',
   [{icon:'🏛️',title:'城市心脏',desc:'慕尼黑最热闹广场'},{icon:'🎄',title:'圣诞市场',desc:'欧洲最著名圣诞集市'},{icon:'📸',title:'最佳拍摄',desc:'新市政厅哥特式立面'}],
   ['广场','城市地标','慕尼黑','历史']],
  ['nymphenburg-palace','宁芬堡宫','Nymphenburg Palace','德国','Germany','慕尼黑','Munich','巴伐利亚王子的夏宫','🏰 巴洛克宫殿群 | 宽阔花园与运河 | 马车博物馆',
   '宁芬堡宫是巴伐利亚选帝侯和国王的夏宫，也是欧洲最宏伟的巴洛克宫殿之一。宫殿主楼长600米，是欧洲最长的宫殿立面。宽阔的花园中有一条壮观的中轴运河，两侧分布着精美的亭阁和喷泉。宫殿内的画廊陈列着路德维希一世收藏的36位宫廷美人的画像，马车博物馆展示着巴伐利亚王室的华丽座驾。\n\n拍摄建议：从花园中轴运河方向拍摄宫殿立面的全景是最经典的角度，可以展现600米长立面的壮观规模。花园中的天鹅和喷泉也是很好的前景元素。',
   'Nymphenburg Palace, the summer residence of Bavarian\'s electors and kings, is one of Europe\'s grandest Baroque palaces. The main building stretches 600 meters—the longest palace facade in Europe.',
   [{icon:'🏰',title:'巴洛克杰作',desc:'欧洲最长宫殿立面'},{icon:'🦢',title:'花园运河',desc:'壮观中轴运河与喷泉'},{icon:'📸',title:'最佳拍摄',desc:'运河方向宫殿全景'}],
   ['宫殿','巴洛克','花园','慕尼黑']],
  ['bamberg-old-town','班贝格老城','Bamberg Old Town','德国','Germany','巴伐利亚','Bavaria','七丘之上的中世纪明珠','🏰 世界遗产老城 | 独特烟熏啤酒 | 小威尼斯水巷',
   '班贝格老城是德国保存最完好的中世纪城市之一，被联合国教科文组织列为世界遗产。这座城市建在七座山丘之上，老城区完整保留了中世纪的街道格局。最独特的景观是"小威尼斯"——一排半木结构房屋沿着雷格尼茨河而建，水中倒影如画。班贝格还以独特的烟熏啤酒(Rauchbier)闻名于世。\n\n拍摄建议："小威尼斯"河景是班贝格最经典的取景地，水中倒影和半木结构房屋构成完美画面。老市政厅建在河中的小岛上，从桥上拍摄最为壮观。秋季和冬季的晨雾为老城增添神秘氛围。',
   'Bamberg\'s Old Town is one of Germany\'s best-preserved medieval cities, a UNESCO World Heritage site built on seven hills. Its most unique feature is "Little Venice"—half-timbered houses along the Regnitz River.',
   [{icon:'🏘️',title:'中世纪明珠',desc:'保存最完好的老城之一'},{icon:'🍺',title:'烟熏啤酒',desc:'世界独特的Rauchbier'},{icon:'📸',title:'最佳拍摄',desc:'小威尼斯河景经典角度'}],
   ['古城','世界遗产','中世纪','啤酒']],
  ['rothenburg-ob-tauber','罗滕堡','Rothenburg ob der Tauber','德国','Germany','巴伐利亚','Bavaria','德国浪漫之路的皇冠明珠','🏰 完整中世纪城墙 | 圣诞之都 | 半木结构房屋',
   '罗滕堡是德国浪漫之路上最耀眼的明珠，也是欧洲保存最完好的中世纪小镇之一。完整的城墙和城门环绕着老城，城内遍布色彩斑斓的半木结构房屋、鹅卵石巷道和隐秘的小广场。罗滕堡被称为"圣诞之都"，全年都有圣诞市场氛围。市政厅塔楼可以攀登，从高处俯瞰红色屋顶和陶伯河谷的壮美全景。\n\n拍摄建议：从城墙步道拍摄老城红色屋顶和教堂尖塔的全景是最经典的角度。Plönlein（小广场）的半木结构房屋和鹅卵石路是最上镜的角落。圣诞市场期间和雪后的罗滕堡如同童话世界。',
   'Rothenburg is the crown jewel of Germany\'s Romantic Road and one of Europe\'s best-preserved medieval towns. Complete walls and gates encircle the old town, filled with colorful half-timbered houses and cobblestone lanes.',
   [{icon:'🏰',title:'完整城墙',desc:'中世纪防御工事完好'},{icon:'🎄',title:'圣诞之都',desc:'全年圣诞市场氛围'},{icon:'📸',title:'最佳拍摄',desc:'Plönlein小广场最上镜'}],
   ['古城','中世纪','浪漫之路','童话']],
  ['heidelberg-castle','海德堡城堡','Heidelberg Castle','德国','Germany','海德堡','Heidelberg','内卡河畔的浪漫废墟','🏰 红砂岩宫殿废墟 | 德国浪漫主义象征 | 世界最大酒桶',
   '海德堡城堡矗立在内卡河畔的山坡上，是德国浪漫主义最具代表性的象征。这座红砂岩宫殿经历了多次战争和雷击，如今以废墟形态展现着独特的美感。城堡内拥有世界上最大的葡萄酒桶(Grosses Fass)，容量达22万升。从城堡露台可以俯瞰海德堡老城、内卡河和老桥的经典全景。\n\n拍摄建议：从内卡河对岸的哲学家小径拍摄城堡与老桥的组合全景是最经典的构图。日落时分，红砂岩城堡在夕阳映照下呈现深红色调。城堡废墟的细节和酒桶也值得拍摄。',
   'Heidelberg Castle stands on a hillside above the Neckar River, the most iconic symbol of German Romanticism. This red sandstone palace, now in romantic ruins, houses the world\'s largest wine barrel.',
   [{icon:'🏰',title:'浪漫废墟',desc:'红砂岩宫殿遗址'},{icon:'🍷',title:'世界最大酒桶',desc:'22万升容量'},{icon:'📸',title:'最佳拍摄',desc:'哲学家小径经典全景'}],
   ['城堡','浪漫','废墟','海德堡']],
  ['old-bridge-heidelberg','海德堡老桥','Old Bridge, Heidelberg','德国','Germany','海德堡','Heidelberg','内卡河上的古典石桥','🌉 18世纪石桥 | 哲学家小径起点 | 城堡最佳前景',
   '海德堡老桥(卡尔·特奥多尔桥)建于1788年，是内卡河上最优雅的古典石桥。九拱桥身以红砂岩建造，桥头的门楼和桥上的铜猴雕像都是标志性的景观。老桥是拍摄海德堡城堡的最佳前景，从桥上看去，城堡、老城和国王宝座山构成了一幅完美的画面。\n\n拍摄建议：从老桥上拍摄城堡方向的全景是最经典的构图。从河对岸的哲学家小径拍摄老桥与城堡的组合画面同样壮观。清晨和傍晚的光线最适合拍摄红砂岩的质感。',
   'The Old Bridge (Karl-Theodor-Brücke) of Heidelberg, built in 1788, is the most elegant classical stone bridge on the Neckar River. Its nine red sandstone arches and gatehouse are iconic landmarks.',
   [{icon:'🌉',title:'古典石桥',desc:'1788年九拱红砂岩'},{icon:'🐒',title:'铜猴雕像',desc:'桥上的标志性雕塑'},{icon:'📸',title:'最佳拍摄',desc:'桥上拍摄城堡方向全景'}],
   ['桥梁','古典','海德堡','浪漫']],
  ['black-forest-triberg','黑森林特里贝格','Black Forest Triberg','德国','Germany','巴登','Baden','黑森林的心脏地带','🌲 德国最高瀑布 | 咕咕钟故乡 | 童话森林',
   '特里贝格是黑森林地区最受欢迎的小镇，以德国最高的瀑布和咕咕钟的故乡闻名。特里贝格瀑布由七级瀑布组成，总落差163米，沿着山间步道可以逐级而上。这座小镇还是世界著名的咕咕钟产地，镇上的钟楼每天表演传统木偶报时。周围的原始森林如同格林童话中的场景，茂密的松树和幽深的山谷令人陶醉。\n\n拍摄建议：沿瀑布步道逐级拍摄七级瀑布是最经典的取景方式。秋季红叶和冬季雪景为瀑布增添不同层次的色彩。镇上的咕咕钟钟楼和传统黑森林农舍也是很好的拍摄题材。',
   'Triberg is the most popular town in the Black Forest, famous for Germany\'s highest waterfall and as the birthplace of the cuckoo clock. The seven-tier waterfall drops 163 meters through the forest.',
   [{icon:'🌲',title:'黑森林心脏',desc:'德国最著名森林小镇'},{icon:'💧',title:'七级瀑布',desc:'德国最高瀑布163米'},{icon:'📸',title:'最佳拍摄',desc:'瀑布步道逐级取景'}],
   ['自然','瀑布','黑森林','童话']],
  ['ulm-minster','乌尔姆大教堂','Ulm Minster','德国','Germany','乌尔姆','Ulm','世界最高教堂塔楼','⛪ 161米世界之最 | 哥特式巅峰 | 768级台阶',
   '乌尔姆大教堂拥有世界上最高的教堂塔楼，高达161米。这座哥特式杰作始建于1377年，历经近五个世纪才最终完工。768级台阶的螺旋楼梯通往塔顶，沿途可以俯瞰乌尔姆全城和多瑙河。教堂内部的木雕唱诗班席位和彩色玻璃窗都是中世纪艺术的精品。\n\n拍摄建议：从多瑙河对岸拍摄大教堂塔楼的全景是最经典的角度，可以将河流和老城收入画面。登塔后从高处俯瞰全城和多瑙河全景同样壮观。晴朗天气时可以远眺至阿尔卑斯山脉。',
   'Ulm Minster has the world\'s tallest church tower at 161 meters. This Gothic masterpiece, begun in 1377, took nearly five centuries to complete. The 768-step spiral staircase leads to panoramic views of the city and Danube.',
   [{icon:'⛪',title:'世界之最',desc:'161米最高教堂塔楼'},{icon:'🪜',title:'768级台阶',desc:'螺旋楼梯登顶俯瞰全城'},{icon:'📸',title:'最佳拍摄',desc:'多瑙河对岸经典全景'}],
   ['教堂','哥特式','城市地标','建筑']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 142
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
