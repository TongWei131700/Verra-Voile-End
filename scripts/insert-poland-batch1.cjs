const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['wawel-castle','瓦维尔城堡','Wawel Castle','波兰','Poland','克拉科夫','Krakow','波兰王室的千年城堡','🏰 千年城堡 | 波兰王室 | 克拉科夫地标',
   '瓦维尔城堡是波兰最重要的历史建筑，自11世纪起一直是波兰王室的居所。城堡融合了哥特式、文艺复兴和巴洛克风格，俯瞰着维斯瓦河。城堡内的挂毯和皇家珍宝是波兰文化的瑰宝。\n\n拍摄建议：从维斯瓦河畔拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡庭院拍摄建筑细节也很值得。',
   'Wawel Castle is Poland\'s most important historical building, serving as the royal residence since the 11th century. The castle combines Gothic, Renaissance, and Baroque styles.',
   [{icon:'🏰',title:'千年城堡',desc:'波兰最重要历史建筑'},{icon:'👑',title:'波兰王室',desc:'11世纪起王室居所'},{icon:'📸',title:'最佳拍摄',desc:'河畔拍摄城堡全景'}],
   ['城堡','王室','克拉科夫','波兰']],
  ['krakow-old-town','克拉科夫老城','Krakow Old Town','波兰','Poland','克拉科夫','Krakow','欧洲最美丽的中世纪老城之一','🏘️ 中世纪老城 | 世界遗产 | 欧洲最美',
   '克拉科夫老城是欧洲保存最完好的中世纪城区之一，被联合国教科文组织列为世界遗产。老城广场是欧洲最大的中世纪广场，四周环绕着历史建筑和圣玛丽教堂。\n\n拍摄建议：从老城广场拍摄圣玛丽教堂全景是最经典的角度。日落时分的金色光线照射在中世纪建筑上格外壮观。从广场拍摄纺织会馆也很值得。',
   'Krakow Old Town is one of Europe\'s best-preserved medieval districts, a UNESCO World Heritage Site. The Main Square is Europe\'s largest medieval square.',
   [{icon:'🏘️',title:'中世纪老城',desc:'欧洲保存最完好中世纪区'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄圣玛丽教堂全景'}],
   ['老城','世界遗产','克拉科夫','波兰']],
  ['auschwitz-memorial','奥斯维辛集中营','Auschwitz Memorial','波兰','Poland','小波兰','Lesser Poland','人类历史上最黑暗的见证','🏛️ 集中营 | 世界遗产 | 历史见证',
   '奥斯维辛集中营是二战期间纳粹德国最大的集中营和灭绝营，超过110万人在这里遇害。现在作为纪念馆和博物馆，提醒世人永远不要忘记这段历史。1979年被列为世界遗产。\n\n拍摄建议：从集中营入口拍摄"劳动带来自由"的铁门是最具象征意义的角度。纪念馆内的展品和照片是重要的历史记录。参观时应保持尊重和肃穆。',
   'Auschwitz was the largest Nazi concentration and extermination camp during WWII, where over 1.1 million people perished. Now a memorial and museum.',
   [{icon:'🏛️',title:'集中营',desc:'二战最大集中营灭绝营'},{icon:'🏆',title:'世界遗产',desc:'1979年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'入口铁门最具象征意义'}],
   ['历史','世界遗产','奥斯维辛','波兰']],
  ['wieliczka-salt-mine','维利奇卡盐矿','Wieliczka Salt Mine','波兰','Poland','小波兰','Lesser Poland','地下300米的盐之宫殿','⛏️ 盐矿 | 地下宫殿 | 世界遗产',
   '维利奇卡盐矿是全世界最古老的盐矿之一，运营了700多年。地下300米处的圣金加教堂完全用盐雕刻而成，包括盐雕的吊灯和地板。1978年被列为世界遗产。\n\n拍摄建议：从圣金加教堂内部拍摄盐雕全景是最经典的角度。盐雕吊灯和祭坛是很好的细节元素。地下湖的盐结晶画面也很梦幻。',
   'Wieliczka Salt Mine is one of the world\'s oldest salt mines, operating for over 700 years. The St. Kinga Chapel at 300 meters deep is entirely carved from salt.',
   [{icon:'⛏️',title:'盐矿',desc:'全世界最古老盐矿之一'},{icon:'⛪',title:'盐雕教堂',desc:'地下300米完全盐雕教堂'},{icon:'📸',title:'最佳拍摄',desc:'教堂内部拍摄盐雕全景'}],
   ['盐矿','世界遗产','维利奇卡','波兰']],
  ['warsaw-old-town','华沙老城','Warsaw Old Town','波兰','Poland','华沙','Warsaw','二战后重生的中世纪老城','🏘️ 战后重生 | 中世纪老城 | 世界遗产',
   '华沙老城是二战后完全重建的中世纪城区，展现了波兰人民不屈的精神。1944年华沙起义中85%的建筑被摧毁，战后波兰人按照战前照片一砖一瓦地重建了整个老城。1980年被列为世界遗产。\n\n拍摄建议：从老城广场拍摄美人鱼雕像全景是最经典的角度。日落时分的金色光线照射在彩色房屋上格外温馨。从维斯瓦河畔拍摄老城天际线也很壮观。',
   'Warsaw Old Town is a completely reconstructed medieval district after WWII, showing the indomitable spirit of the Polish people. 85% was destroyed in 1944.',
   [{icon:'🏘️',title:'战后重生',desc:'二战后完全重建中世纪区'},{icon:'🏆',title:'世界遗产',desc:'1980年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄美人鱼雕像全景'}],
   ['老城','世界遗产','华沙','波兰']],
  ['wroclaw-market-square','弗罗茨瓦夫广场','Wroclaw Market Square','波兰','Poland','下西里西亚','Lower Silesia','欧洲最大的中世纪广场之一','🏛️ 中世纪广场 | 彩色房屋 | 欧洲最大',
   '弗罗茨瓦夫广场是欧洲最大的中世纪广场之一，四周环绕着色彩斑斓的商人行会和哥特式市政厅。广场上的喷泉和雕塑是巴洛克艺术的杰作。广场现在是弗罗茨瓦夫最热闹的中心。\n\n拍摄建议：从广场中央拍摄市政厅全景是最经典的角度。日落时分的金色光线照射在彩色房屋上格外壮观。从市政厅塔楼拍摄广场全景也很值得。',
   'Wroclaw Market Square is one of Europe\'s largest medieval squares, surrounded by colorful merchant houses and the Gothic Town Hall.',
   [{icon:'🏛️',title:'中世纪广场',desc:'欧洲最大中世纪广场之一'},{icon:'🏘️',title:'彩色房屋',desc:'色彩斑斓商人行会建筑'},{icon:'📸',title:'最佳拍摄',desc:'广场中央拍摄市政厅全景'}],
   ['广场','中世纪','弗罗茨瓦夫','波兰']],
  ['wroclaw-dwarfs','弗罗茨瓦夫小矮人','Wroclaw Dwarfs','波兰','Poland','下西里西亚','Lower Silesia','全城寻找300个小矮人','🗿 300个小矮人 | 城市寻宝 | 弗罗茨瓦夫特色',
   '弗罗茨瓦夫小矮人是全城300多个青铜小矮人雕塑的总称，分布在城市的各个角落。每个小矮人都有自己的名字和故事，寻找它们成为了游客最有趣的城市探险。\n\n拍摄建议：从街头拍摄小矮人雕塑的全景是最经典的角度。小矮人与城市建筑的对比是很好的创意元素。收集不同小矮人的照片也是很有趣的拍摄题材。',
   'Wroclaw Dwarfs are over 300 bronze dwarf sculptures scattered throughout the city. Each has its own name and story, making city exploration fun.',
   [{icon:'🗿',title:'300个小矮人',desc:'全城300多个青铜雕塑'},{icon:'🏙️',title:'城市寻宝',desc:'寻找小矮人城市探险'},{icon:'📸',title:'最佳拍摄',desc:'街头拍摄小矮人雕塑全景'}],
   ['雕塑','城市','弗罗茨瓦夫','波兰']],
  ['gdańsk-old-town','格但斯克老城','Gdansk Old Town','波兰','Poland','波美拉尼亚','Pomerania','波罗的海的琥珀之城','🏘️ 琥珀之城 | 汉萨同盟 | 波罗的海明珠',
   '格但斯克老城是波兰最美丽的海港城市，被称为"琥珀之城"。老城的哥特式和文艺复兴建筑沿着莫特瓦河排列，二战后完全重建。长街上的海神喷泉是城市的标志。\n\n拍摄建议：从莫特瓦河畔拍摄老城建筑全景是最经典的角度。日落时分的金色光线照射在河面上格外壮观。从起重机拍摄港口全景也很值得。',
   'Gdansk Old Town is Poland\'s most beautiful port city, known as the "Amber City." The Gothic and Renaissance buildings line the Motlawa River.',
   [{icon:'🏘️',title:'琥珀之城',desc:'波兰最美丽海港城市'},{icon:'🏛️',title:'汉萨同盟',desc:'哥特式文艺复兴建筑'},{icon:'📸',title:'最佳拍摄',desc:'河畔拍摄老城建筑全景'}],
   ['老城','琥珀','格但斯克','波兰']],
  ['malbork-castle','马尔堡城堡','Malbork Castle','波兰','Poland','波美拉尼亚','Pomerania','全世界最大的砖砌城堡','🏰 世界最大砖砌城堡 | 条顿骑士团 | 世界遗产',
   '马尔堡城堡是全世界最大的砖砌城堡，由条顿骑士团建于13世纪。城堡占地21公顷，是联合国教科文组织世界遗产。城堡的红砖哥特式建筑群令人叹为观止。\n\n拍摄建议：从城堡外拍摄完整的红砖建筑群全景是最经典的角度。日落时分的金色光线照射在红砖上格外壮观。从城堡内部拍摄庭院和塔楼也很壮观。',
   'Malbork Castle is the world\'s largest brick castle, built by the Teutonic Knights in the 13th century. Covering 21 hectares, it\'s a UNESCO World Heritage Site.',
   [{icon:'🏰',title:'世界最大',desc:'全世界最大砖砌城堡'},{icon:'⚔️',title:'条顿骑士团',desc:'13世纪条顿骑士团建造'},{icon:'📸',title:'最佳拍摄',desc:'城堡外拍摄红砖建筑群全景'}],
   ['城堡','世界遗产','马尔堡','波兰']],
  ['zakopane-tatras','扎科帕内塔特拉山','Zakopane Tatras','波兰','Poland','小波兰','Lesser Poland','波兰的冬季首都','🏔️ 塔特拉山 | 冬季首都 | 波兰阿尔卑斯',
   '扎科帕内是波兰最著名的山地度假胜地，位于塔特拉山脚下，被称为"波兰的冬季首都"。小镇的木制教堂和山地民俗文化与壮丽的山景形成了完美的组合。\n\n拍摄建议：从山脚拍摄塔特拉山全景是最经典的角度。日落时分的金色光线照射在雪山上格外壮观。从山顶拍摄扎科帕内小镇全景也很值得。',
   'Zakopane is Poland\'s most famous mountain resort, at the foot of the Tatra Mountains, known as Poland\'s "Winter Capital."',
   [{icon:'🏔️',title:'塔特拉山',desc:'波兰最著名山地度假地'},{icon:'⛷️',title:'冬季首都',desc:'波兰的冬季首都'},{icon:'📸',title:'最佳拍摄',desc:'山脚拍摄塔特拉山全景'}],
   ['山地','冬季','扎科帕内','波兰']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 332
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
  console.log(`\n共插入 ${items.length} 个波兰景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
