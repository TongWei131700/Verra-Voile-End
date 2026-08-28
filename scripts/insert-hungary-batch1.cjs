const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['budapest-parliament','布达佩斯国会大厦','Budapest Parliament','匈牙利','Hungary','布达佩斯','Budapest','多瑙河畔的哥特式皇冠','🏛️ 哥特式复兴 | 多瑙河畔 | 布达佩斯地标',
   '布达佩斯国会大厦是欧洲最壮观的议会建筑之一，高96米，拥有691个房间。哥特式复兴风格的外观在多瑙河畔的灯光下格外壮观。大厦内保存着匈牙利圣冠和圣史蒂芬王冠。\n\n拍摄建议：从多瑙河对岸拍摄国会大厦全景是最经典的角度。夜晚的灯光秀将建筑变成金色宫殿。从链子桥拍摄国会大厦与渔人堡的组合全景也很壮观。',
   'Budapest Parliament is one of Europe\'s most spectacular parliamentary buildings at 96 meters tall with 691 rooms. The Gothic Revival facade is stunning along the Danube.',
   [{icon:'🏛️',title:'哥特式复兴',desc:'欧洲最壮观议会建筑之一'},{icon:'👑',title:'圣冠',desc:'保存匈牙利圣冠圣史蒂芬王冠'},{icon:'📸',title:'最佳拍摄',desc:'多瑙河对岸拍摄国会大厦全景'}],
   ['国会大厦','哥特','布达佩斯','匈牙利']],
  ['fishermans-bastion','渔人堡','Fisherman\'s Bastion','匈牙利','Hungary','布达佩斯','Budapest','多瑙河畔的童话露台','🏰 童话露台 | 7座尖塔 | 布达佩斯地标',
   '渔人堡是布达佩斯最浪漫的地标，新罗马式风格的7座尖塔代表着匈牙利的7个部落。城堡的露台是俯瞰多瑙河和国会大厦的最佳观景点。日出和日落时分的景色最为壮观。\n\n拍摄建议：从露台拍摄多瑙河与国会大厦的全景是最经典的角度。日落时分的金色光线照射在河面上格外壮观。从城堡尖塔拍摄城市全景也很值得。',
   'Fisherman\'s Bastion is Budapest\'s most romantic landmark, with 7 Neo-Romanesque towers representing Hungary\'s 7 tribes. The terrace offers the best views of the Danube.',
   [{icon:'🏰',title:'童话露台',desc:'布达佩斯最浪漫地标'},{icon:'🏗️',title:'7座尖塔',desc:'新罗马式风格7座尖塔'},{icon:'📸',title:'最佳拍摄',desc:'露台拍摄多瑙河国会大厦全景'}],
   ['城堡','露台','布达佩斯','匈牙利']],
  ['matthias-church','马加什教堂','Matthias Church','匈牙利','Hungary','布达佩斯','Budapest','彩色屋顶的哥特式教堂','⛪ 彩色屋顶 | 哥特式教堂 | 布达佩斯地标',
   '马加什教堂是布达佩斯最美丽的教堂之一，彩色马赛克屋顶是其最标志性的特征。教堂建于14世纪，曾是多位匈牙利国王的加冕地点。教堂内部的彩色玻璃和壁画令人叹为观止。\n\n拍摄建议：从渔人堡拍摄马加什教堂彩色屋顶全景是最经典的角度。日落时分的金色光线照射在彩色屋顶上格外壮观。从教堂内部拍摄彩色玻璃也很震撼。',
   'Matthias Church is one of Budapest\'s most beautiful churches, with colorful mosaic roofs as its most iconic feature. Built in the 14th century.',
   [{icon:'⛪',title:'彩色屋顶',desc:'布达佩斯最美丽教堂之一'},{icon:'👑',title:'加冕教堂',desc:'多位匈牙利国王加冕地'},{icon:'📸',title:'最佳拍摄',desc:'渔人堡拍摄教堂彩色屋顶全景'}],
   ['教堂','哥特','布达佩斯','匈牙利']],
  ['chain-bridge','链子桥','Chain Bridge','匈牙利','Hungary','布达佩斯','Budapest','连接布达与佩斯的百年铁桥','🌉 百年铁桥 | 布达佩斯象征 | 多瑙河地标',
   '链子桥是布达佩斯最著名的桥梁，建于1849年，是连接布达和佩斯的第一座永久性桥梁。桥头的狮子雕像和塔楼是布达佩斯的标志。夜晚的灯光将桥梁变成多瑙河上的金色项链。\n\n拍摄建议：从桥上拍摄国会大厦与渔人堡的全景是最经典的角度。日落时分的金色光线照射在桥梁上格外壮观。从多瑙河畔拍摄桥梁与建筑的组合全景也很壮观。',
   'The Chain Bridge is Budapest\'s most famous bridge, built in 1849, the first permanent bridge connecting Buda and Pest. The lion statues and towers are iconic.',
   [{icon:'🌉',title:'百年铁桥',desc:'布达佩斯最著名桥梁'},{icon:'🦁',title:'狮子雕像',desc:'桥头狮子雕像布达佩斯标志'},{icon:'📸',title:'最佳拍摄',desc:'桥上拍摄国会大厦渔人堡全景'}],
   ['桥梁','布达佩斯','多瑙河','匈牙利']],
  ['buda-castle','布达城堡','Buda Castle','匈牙利','Hungary','布达佩斯','Budapest','布达佩斯的历史王宫','🏰 历史王宫 | 世界遗产 | 布达佩斯地标',
   '布达城堡是布达佩斯的历史王宫，位于城堡山上，俯瞰着多瑙河和佩斯城区。城堡始建于13世纪，经历了多次重建，融合了巴洛克、哥特式和文艺复兴风格。1987年被列为世界遗产。\n\n拍摄建议：从多瑙河畔拍摄城堡全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡露台拍摄多瑙河与佩斯全景也很值得。',
   'Buda Castle is Budapest\'s historical royal palace, on Castle Hill overlooking the Danube and Pest. Built in the 13th century, a UNESCO World Heritage Site since 1987.',
   [{icon:'🏰',title:'历史王宫',desc:'布达佩斯历史王宫'},{icon:'🏆',title:'世界遗产',desc:'1987年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'多瑙河畔拍摄城堡全景'}],
   ['城堡','世界遗产','布达佩斯','匈牙利']],
  ['thermal-baths','塞切尼温泉','Szechenyi Thermal Baths','匈牙利','Hungary','布达佩斯','Budapest','欧洲最大的药用温泉','♨️ 药用温泉 | 欧洲最大 | 布达佩斯名片',
   '塞切尼温泉是欧洲最大的药用温泉综合体，建于1913年。温泉的黄色新巴洛克建筑和多瑙河畔的露天浴池是布达佩斯的标志。温泉水温保持在38度，富含矿物质，对关节和肌肉有极好的疗养效果。\n\n拍摄建议：从露天浴池拍摄黄色建筑的全景是最经典的角度。日落时分的金色光线照射在温泉水面上格外温馨。从浴池内部拍摄蒸汽画面也很梦幻。',
   'Szechenyi Thermal Baths is Europe\'s largest medicinal bath complex, built in 1913. The yellow Neo-Baroque buildings and outdoor pools are Budapest\'s icon.',
   [{icon:'♨️',title:'药用温泉',desc:'欧洲最大药用温泉综合体'},{icon:'🏛️',title:'新巴洛克',desc:'黄色新巴洛克建筑露天浴池'},{icon:'📸',title:'最佳拍摄',desc:'露天浴池拍摄黄色建筑全景'}],
   ['温泉','药用','布达佩斯','匈牙利']],
  ['lake-balaton','巴拉顿湖','Lake Balaton','匈牙利','Hungary','中部','Central','匈牙利的海洋','🏖️ 中欧最大湖 | 匈牙利海洋 | 度假胜地',
   '巴拉顿湖是中欧最大的湖泊，被称为"匈牙利的海洋"。湖面面积592平方公里，湖水清澈，是匈牙利人最爱的度假胜地。湖北岸的蒂豪尼半岛以薰衣草田和修道院闻名。\n\n拍摄建议：从湖岸拍摄蒂豪尼半岛全景是最经典的角度。日落时分的金色光线照射在湖面上格外壮观。从修道院拍摄湖景全景也很值得。',
   'Lake Balaton is Central Europe\'s largest lake, known as "Hungary\'s Sea." Covering 592 square kilometers with crystal-clear water.',
   [{icon:'🏖️',title:'中欧最大湖',desc:'匈牙利最大的湖泊'},{icon:'🌊',title:'匈牙利海洋',desc:'被称为匈牙利的海洋'},{icon:'📸',title:'最佳拍摄',desc:'湖岸拍摄蒂豪尼半岛全景'}],
   ['湖泊','度假','巴拉顿','匈牙利']],
  ['tokaj-wine','托卡伊酒庄','Tokaj Wine Region','匈牙利','Hungary','东北部','Northeast','世界最古老的葡萄酒产区','🍷 葡萄酒产区 | 世界遗产 | 贵腐甜酒',
   '托卡伊是全世界最古老的葡萄酒产区之一，以贵腐甜酒闻名于世。产区的葡萄园和酒窖被联合国教科文组织列为世界遗产。托卡伊的阿苏甜酒被称为"酒中之王"。\n\n拍摄建议：从葡萄园拍摄产区全景是最经典的角度。日落时分的金色光线照射在葡萄园上格外壮观。从酒窖内部拍摄橡木桶也很值得。',
   'Tokaj is one of the world\'s oldest wine regions, famous for its noble rot sweet wines. The vineyards and cellars are a UNESCO World Heritage Site.',
   [{icon:'🍷',title:'葡萄酒产区',desc:'全世界最古老葡萄酒产区之一'},{icon:'🏆',title:'世界遗产',desc:'葡萄园酒窖世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'葡萄园拍摄产区全景'}],
   ['葡萄酒','世界遗产','托卡伊','匈牙利']],
  ['eger-castle','埃格尔城堡','Eger Castle','匈牙利','Hungary','北部','North','匈牙利红酒的故乡','🏰 城堡 | 红酒故乡 | 匈牙利地标',
   '埃格尔城堡是匈牙利最著名的历史建筑之一，1552年成功抵御了奥斯曼帝国的进攻。城堡所在的埃格尔是匈牙利红酒的故乡，以公牛血红酒闻名。城堡的巴洛克式建筑和历史博物馆是主要景点。\n\n拍摄建议：从城堡外拍摄完整的建筑群全景是最经典的角度。日落时分的金色光线照射在城堡上格外壮观。从城堡顶部拍摄城市全景也很值得。',
   'Eger Castle is one of Hungary\'s most famous historical buildings, successfully defending against the Ottoman Empire in 1552. Eger is Hungary\'s wine capital.',
   [{icon:'🏰',title:'城堡',desc:'匈牙利最著名历史建筑之一'},{icon:'🍷',title:'红酒故乡',desc:'匈牙利红酒故乡公牛血红酒'},{icon:'📸',title:'最佳拍摄',desc:'城堡外拍摄建筑群全景'}],
   ['城堡','红酒','埃格尔','匈牙利']],
  ['pannonhalma-abbey','潘农哈尔马修道院','Pannonhalma Abbey','匈牙利','Hungary','西部','West','千年修道院的世界遗产','⛪ 千年修道院 | 世界遗产 | 匈牙利地标',
   '潘农哈尔马修道院是匈牙利最古老的修道院之一，建于公元996年。修道院的图书馆、教堂和回廊展现了千年来的建筑艺术精华。1996年被列为世界遗产。\n\n拍摄建议：从修道院前拍摄完整的建筑群全景是最经典的角度。日落时分的金色光线照射在修道院上格外壮观。从图书馆内部拍摄千年藏书也很震撼。',
   'Pannonhalma Abbey is one of Hungary\'s oldest monasteries, built in 996 AD. The library, church, and cloister showcase a thousand years of architectural art.',
   [{icon:'⛪',title:'千年修道院',desc:'匈牙利最古老修道院之一'},{icon:'🏆',title:'世界遗产',desc:'1996年列为世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'修道院前拍摄建筑群全景'}],
   ['修道院','世界遗产','潘农哈尔马','匈牙利']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 342
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
  console.log(`\n共插入 ${items.length} 个匈牙利景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
