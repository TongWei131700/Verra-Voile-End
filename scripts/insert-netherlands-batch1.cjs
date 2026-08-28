const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['anne-frank-house','安妮之家','Anne Frank House','荷兰','Netherlands','阿姆斯特丹','Amsterdam','二战历史的沉默见证','🏠 安妮日记原址 | 二战纪念馆 | 世界遗产',
   '安妮之家是安妮·弗兰克在二战期间躲避纳粹迫害的秘密藏身处，也是《安妮日记》的写作地。这座隐藏在运河旁普通建筑后方的"后屋"如今是世界最著名的二战纪念馆之一。馆内保留了当年的房间、家具和安妮的日记手稿。\n\n拍摄建议：从运河对岸拍摄安妮之家的外观是最经典的角度。馆内的房间和日记手稿也值得拍摄。周围的运河和房屋构成了典型的阿姆斯特丹画面。',
   'Anne Frank House is the secret annex where Anne Frank hid from the Nazis during WWII, and the birthplace of "The Diary of Anne Frank." Now one of the world\'s most famous WWII memorials.',
   [{icon:'🏠',title:'安妮日记',desc:'二战最著名的日记诞生地'},{icon:'📖',title:'沉默见证',desc:'隐藏在后屋的历史'},{icon:'📸',title:'最佳拍摄',desc:'运河对岸外观全景'}],
   ['博物馆','二战','历史','阿姆斯特丹']],
  ['rijksmuseum','国家博物馆','Rijksmuseum','荷兰','Netherlands','阿姆斯特丹','Amsterdam','荷兰黄金时代的艺术殿堂','🏛️ 伦勃朗与维米尔 | 荷兰最大博物馆 | 国家宝藏',
   '荷兰国家博物馆是荷兰最大的艺术博物馆，收藏了从13世纪至今的8000多件艺术品。伦勃朗的《夜巡》和维米尔的《倒牛奶的女仆》是镇馆之宝。建筑本身就是一件宏伟的哥特复兴式杰作，免费花园向公众开放。\n\n拍摄建议：从博物馆前的花园拍摄建筑正面全景是最经典的角度。建筑内部的宏伟楼梯和展厅也很壮观。夜晚灯光照射下的建筑外立面格外迷人。',
   'The Rijksmuseum is the Netherlands\' largest art museum, housing over 8,000 artworks from the 13th century to today. Rembrandt\'s "Night Watch" and Vermeer\'s "Milkmaid" are the masterpieces.',
   [{icon:'🏛️',title:'国家宝藏',desc:'荷兰最大艺术博物馆'},{icon:'🎨',title:'大师杰作',desc:'伦勃朗与维米尔真迹'},{icon:'📸',title:'最佳拍摄',desc:'花园拍摄建筑正面全景'}],
   ['博物馆','艺术','黄金时代','阿姆斯特丹']],
  ['van-gogh-museum','梵高博物馆','Van Gogh Museum','荷兰','Netherlands','阿姆斯特丹','Amsterdam','走进天才画家的内心世界','🎨 梵高最大收藏 | 向日葵与星夜 | 现代建筑',
   '梵高博物馆拥有世界上最大的梵高作品收藏，包括《向日葵》《杏花》和众多自画像。博物馆按时间顺序展示了梵高短暂而辉煌的艺术生涯。从早期的暗色调到后期的明亮色彩，每一幅画都是天才灵魂的窗口。\n\n拍摄建议：博物馆建筑外观是现代与古典的融合，从广场拍摄全景是最经典的角度。馆内不允许拍照，但建筑外部和周围博物馆广场很值得拍摄。',
   'The Van Gogh Museum houses the world\'s largest collection of Van Gogh works, including "Sunflowers," "Almond Blossoms," and numerous self-portraits. The museum chronicles his brilliant but short artistic career.',
   [{icon:'🎨',title:'最大收藏',desc:'世界最大梵高作品馆'},{icon:'🌻',title:'向日葵',desc:'最著名的艺术杰作'},{icon:'📸',title:'最佳拍摄',desc:'博物馆广场建筑全景'}],
   ['博物馆','梵高','艺术','阿姆斯特丹']],
  ['canal-ring','运河环带','Canal Ring','荷兰','Netherlands','阿姆斯特丹','Amsterdam','17世纪的水上城市杰作','🏘️ 世界遗产 | 运河房屋 | 黄金时代规划',
   '阿姆斯特丹运河环带是17世纪荷兰黄金时代城市规划的杰作，三条同心运河环绕着城市中心。运河两岸的17世纪山形墙房屋倒映在水中，构成了全世界最上镜的城市画面之一。2010年被列为世界遗产。\n\n拍摄建议：从运河桥上拍摄两岸房屋倒影是最经典的角度。乘坐运河游船可以从水面角度欣赏两岸建筑。日落时分的金色光线映照在运河上格外迷人。',
   'Amsterdam\'s Canal Ring is a 17th-century urban planning masterpiece with three concentric canals surrounding the city center. The 17th-century gabled houses along the canals are among the world\'s most photogenic urban scenes.',
   [{icon:'🏘️',title:'水上城市',desc:'17世纪黄金时代杰作'},{icon:'🏆',title:'世界遗产',desc:'同心运河环绕城市'},{icon:'📸',title:'最佳拍摄',desc:'运河桥拍摄房屋倒影'}],
   ['运河','世界遗产','黄金时代','阿姆斯特丹']],
  ['windmills-kinderdijk','金德代克风车','Kinderdijk Windmills','荷兰','Netherlands','南荷兰','South Holland','荷兰最壮观的风车群','🏭 19座风车 | 世界遗产 | 荷兰象征',
   '金德代克拥有荷兰最密集的风车群，19座建于18世纪的古老风车排列在运河两岸。这些风车至今仍在运转，是荷兰水利工程和农业传统的活化石。1997年被列为世界遗产。\n\n拍摄建议：从运河步道拍摄19座风车排列的全景是最经典的角度。骑自行车沿运河游览是最佳的体验方式。日落时分风车在金色天空中的剪影最为壮观。',
   'Kinderdijk has the most concentrated group of windmills in the Netherlands, with 19 18th-century windmills along the canals. Still operational, they are living fossils of Dutch water engineering.',
   [{icon:'🏭',title:'19座风车',desc:'荷兰最密集风车群'},{icon:'🏆',title:'世界遗产',desc:'18世纪水利工程活化石'},{icon:'📸',title:'最佳拍摄',desc:'运河步道风车排列全景'}],
   ['风车','世界遗产','荷兰象征','水利']],
  ['keukenhof-gardens','库肯霍夫花园','Keukenhof Gardens','荷兰','Netherlands','北荷兰','North Holland','世界最大的春季花园','🌷 700万株花卉 | 春季限定 | 世界花园',
   '库肯霍夫花园是世界上最大的花卉展览花园，每年春季仅开放约8周。700万株郁金香、风信子和水仙花将花园变成一幅色彩斑斓的油画。精心设计的主题花园和蜿蜒的小径让每一步都有新的惊喜。\n\n拍摄建议：从花园高处拍摄郁金香花田的全景是最经典的角度。花丛中的小径和拱门是很好的取景元素。清晨的柔和光线最适合拍摄花卉特写。',
   'Keukenhof is the world\'s largest flower exhibition garden, open only about 8 weeks each spring. Seven million tulips, hyacinths, and daffodils transform the garden into a colorful painting.',
   [{icon:'🌷',title:'世界花园',desc:'世界最大花卉展览园'},{icon:'🌸',title:'700万株',desc:'郁金香风信子水仙花'},{icon:'📸',title:'最佳拍摄',desc:'花园高处花田全景'}],
   ['花园','郁金香','春季','花卉']],
  ['tulip-fields','郁金香花田','Tulip Fields','荷兰','Netherlands','北荷兰','North Holland','荷兰最经典的色彩大地','🌷 彩色花田 | 春季奇观 | 荷兰名片',
   '荷兰的郁金香花田是全世界最壮观的春季景观之一，一望无际的彩色花田如同大地的调色板。红色、黄色、紫色和白色的花田整齐排列，在绿色田野和蓝色天空之间形成了超现实的色彩对比。\n\n拍摄建议：从高处或热气球俯拍彩色花田的全景是最震撼的角度。沿花田间的小路拍摄花田与风车的组合是最经典的构图。4月中旬至5月初是最佳花期。',
   'The Dutch tulip fields are one of the world\'s most spectacular spring landscapes, with endless colorful fields like nature\'s palette. Red, yellow, purple, and white rows create surreal color contrasts.',
   [{icon:'🌷',title:'色彩大地',desc:'一望无际彩色花田'},{icon:'🎨',title:'大地调色板',desc:'红黄紫白整齐排列'},{icon:'📸',title:'最佳拍摄',desc:'高处俯拍花田与风车'}],
   ['花田','郁金香','春季','荷兰']],
  ['leiden-old-town','莱顿老城','Leiden Old Town','荷兰','Netherlands','南荷兰','South Holland','伦勃朗的诞生之城','🏘️ 运河老城 | 大学城 | 伦勃朗故乡',
   '莱顿是一座保存完好的运河老城，也是伦勃朗的诞生地和荷兰最古老的大学城之一。运河两岸的17世纪建筑、古老的大学和博物馆构成了独特的文化氛围。莱顿的巷道和桥梁比阿姆斯特丹更加宁静和原汁原味。\n\n拍摄建议：从运河桥上拍摄两岸老建筑的全景是最经典的角度。大学建筑和博物馆也值得探访。清晨的运河倒影最为清晰。',
   'Leiden is a well-preserved canal city, Rembrandt\'s birthplace, and one of the Netherlands\' oldest university towns. The 17th-century buildings along the canals create a unique cultural atmosphere.',
   [{icon:'🏘️',title:'运河老城',desc:'保存完好的运河城市'},{icon:'🎓',title:'大学城',desc:'荷兰最古老大学之一'},{icon:'📸',title:'最佳拍摄',desc:'运河桥拍摄老建筑全景'}],
   ['老城','运河','大学','伦勃朗']],
  ['delft-market-square','代尔夫特广场','Delft Market Square','荷兰','Netherlands','南荷兰','South Holland','维米尔画笔下的完美小城','🏘️ 新教堂 | 维米尔故乡 | 蓝色陶瓷',
   '代尔夫特是荷兰最迷人的小城之一，维米尔的故乡。中央广场上的新教堂尖塔是城市的天际线标志，广场周围是色彩斑斓的荷兰传统建筑。代尔夫特蓝陶瓷是世界闻名的手工艺品。运河和石桥构成了典型的荷兰画面。\n\n拍摄建议：从广场拍摄新教堂尖塔和周围建筑的全景是最经典的角度。运河上的石桥和两岸房屋也是绝佳取景地。从运河水面拍摄教堂倒影也很壮观。',
   'Delft is one of the Netherlands\' most charming small cities, Vermeer\'s hometown. The New Church spire on the central market square is the city\'s skyline landmark.',
   [{icon:'🏘️',title:'完美小城',desc:'维米尔画笔下的城市'},{icon:'⛪',title:'新教堂',desc:'广场尖塔天际线标志'},{icon:'📸',title:'最佳拍摄',desc:'广场拍摄教堂建筑全景'}],
   ['小城','维米尔','广场','代尔夫特']],
  ['utrecht-canal','乌得勒支运河','Utrecht Canal','荷兰','Netherlands','乌得勒支','Utrecht','双层码头的水城风情','🏘️ 双层码头 | 运河教堂 | 荷兰第四城',
   '乌得勒支运河拥有独特的双层码头结构——运河两侧的石阶通向地下层的咖啡馆和餐厅，这是全世界独一无二的城市景观。标志性的圆顶教堂塔楼矗立在城市天际线中。运河游船可以穿过城市中心，体验不同于阿姆斯特丹的水城风情。\n\n拍摄建议：从运河水面拍摄双层码头的独特结构是最经典的角度。圆顶教堂塔楼是最好的城市地标。日落时分码头灯光倒映在运河上格外迷人。',
   'Utrecht\'s canals feature unique double-level wharves — stone steps on both sides lead to underground cafes and restaurants, a one-of-a-kind urban landscape worldwide.',
   [{icon:'🏘️',title:'双层码头',desc:'全世界独一无二的结构'},{icon:'⛪',title:'圆顶教堂',desc:'城市天际线标志'},{icon:'📸',title:'最佳拍摄',desc:'水面拍摄双层码头全景'}],
   ['运河','码头','水城','乌得勒支']],
  ['giethoorn','羊角村','Giethoorn','荷兰','Netherlands','上艾瑟尔','Overijssel','没有公路的威尼斯式水乡','🏘️ 无公路村庄 | 茅草屋顶 | 荷兰威尼斯',
   '羊角村是荷兰最梦幻的村庄，整个村庄没有公路，只有水道和自行车道。茅草屋顶的农舍散布在运河两岸，小桥连接着每一户人家。乘坐平底船在安静的运河上漫游，两岸的鲜花和绿色草坪构成了童话般的画面。\n\n拍摄建议：从运河上拍摄茅草屋顶房屋的全景是最经典的角度。乘坐平底船在运河上漫游是最佳体验方式。清晨的薄雾笼罩运河时如同仙境。',
   'Giethoorn is the Netherlands\' most dreamy village, with no roads — only waterways and bicycle paths. Thatched-roof farmhouses line the canals, connected by small bridges.',
   [{icon:'🏘️',title:'无公路村',desc:'只有水道和自行车道'},{icon:'🚣',title:'平底船',desc:'运河上漫游水乡'},{icon:'📸',title:'最佳拍摄',desc:'运河拍摄茅草屋全景'}],
   ['村庄','水乡','茅草屋','童话']],
  ['volendam','沃伦丹','Volendam','荷兰','Netherlands','北荷兰','North Holland','渔港旁的彩色木屋','🏘️ 渔村木屋 | 传统服饰 | 艾瑟尔湖畔',
   '沃伦丹是荷兰最著名的渔村，以彩色的木屋、传统服饰和新鲜的鲱鱼闻名。艾瑟尔湖畔的小港口停满了渔船，绿色和棕色的木屋倒映在水中。村民至今仍穿着传统的荷兰服饰，是体验荷兰民俗文化的最佳去处。\n\n拍摄建议：从港口拍摄彩色木屋和渔船的全景是最经典的角度。穿传统服饰的村民是很好的拍摄题材。日落时分的港口金色倒影格外迷人。',
   'Volendam is the Netherlands\' most famous fishing village, known for colorful wooden houses, traditional costumes, and fresh herring. The small harbor on the IJsselmeer is filled with fishing boats.',
   [{icon:'🏘️',title:'渔村木屋',desc:'艾瑟尔湖畔彩色建筑'},{icon:'👗',title:'传统服饰',desc:'至今穿着荷兰传统服装'},{icon:'📸',title:'最佳拍摄',desc:'港口拍摄彩色木屋渔船'}],
   ['渔村','木屋','传统','港口']],
  ['the-hague-beach','海牙海滩','Scheveningen Beach','荷兰','Netherlands','南荷兰','South Holland','北海之滨的皇家度假地','🏖️ 北海沙滩 | 码头栈桥 | 皇家海牙',
   '海牙的斯海弗宁恩海滩是荷兰最著名的海滨度假地，宽阔的北海沙滩和标志性的栈桥码头构成了壮观的画面。海滩上的彩色沙滩椅和风筝是荷兰夏日的经典景象。远处的海牙城市天际线为海滩增添了都市背景。\n\n拍摄建议：从栈桥码头拍摄海滩和城市天际线的全景是最经典的角度。海滩上的彩色沙滩椅和风筝是很好的前景元素。日落时分太阳沉入北海的画面最为壮观。',
   'Scheveningen Beach in The Hague is the Netherlands\' most famous coastal resort, with wide North Sea beaches and an iconic pier. Colorful beach chairs and kites are classic Dutch summer scenes.',
   [{icon:'🏖️',title:'北海沙滩',desc:'荷兰最著名海滨度假地'},{icon:'🌉',title:'栈桥码头',desc:'标志性海滨建筑'},{icon:'📸',title:'最佳拍摄',desc:'栈桥拍摄海滩城市全景'}],
   ['海滩','北海','度假','海牙']],
  ['rotterdam-markthal','鹿特丹拱形市场','Markthal Rotterdam','荷兰','Netherlands','鹿特丹','Rotterdam','马蹄形拱顶下的美食天堂','🏛️ 拱形市场 | 天顶壁画 | 现代建筑',
   '鹿特丹拱形市场是一座马蹄形的现代建筑奇迹，内部天顶覆盖着巨幅彩色壁画"丰收之角"。市场内汇集了来自世界各地的新鲜食材和美食摊位。建筑外部是光滑的拱形结构，内部则是色彩缤纷的美食天堂。\n\n拍摄建议：从市场内部仰拍天顶壁画是最震撼的角度。市场内的食材摊位和美食也是很好的拍摄题材。建筑外部的拱形结构从远处拍摄也很壮观。',
   'The Markthal Rotterdam is a horseshoe-shaped modern architectural marvel, with a massive colorful mural "Cornucopia" covering the ceiling inside. The market gathers food stalls from around the world.',
   [{icon:'🏛️',title:'拱形市场',desc:'马蹄形现代建筑奇迹'},{icon:'🎨',title:'天顶壁画',desc:'巨幅彩色丰收之角'},{icon:'📸',title:'最佳拍摄',desc:'内部仰拍天顶壁画'}],
   ['市场','现代建筑','美食','鹿特丹']],
  ['eindhoven-light','埃因霍温灯光节','Eindhoven Light Festival','荷兰','Netherlands','北布拉班特','North Brabant','科技之城的灯光艺术','💡 灯光艺术节 | 科技与艺术 | 城市灯光',
   '埃因霍温灯光节是荷兰最具创意的文化活动之一，将整座城市变成一个巨大的灯光艺术展。来自世界各地的艺术家使用最新的灯光技术创作出令人惊叹的装置艺术。作为飞利浦的故乡，灯光已经融入了这座科技之城的DNA。\n\n拍摄建议：使用三脚架进行长曝光拍摄灯光装置是最经典的角度。不同颜色的灯光交织在建筑上创造出超现实的画面。夜晚拍摄效果最佳，建议携带三脚架。',
   'The Eindhoven Light Festival is one of the Netherlands\' most creative cultural events, transforming the entire city into a giant light art exhibition. Artists from around the world create stunning installations.',
   [{icon:'💡',title:'灯光艺术',desc:'城市变成灯光艺术展'},{icon:'🔬',title:'科技之城',desc:'飞利浦故乡的灯光DNA'},{icon:'📸',title:'最佳拍摄',desc:'长曝光拍摄灯光装置'}],
   ['灯光','艺术节','科技','埃因霍温']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 237
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
  console.log(`\n共插入 ${items.length} 个荷兰景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
