const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['belem-tower','贝伦塔','Belém Tower','葡萄牙','Portugal','里斯本','Lisbon','大航海时代的石质哨兵','🏰 曼努埃尔式 | 大航海地标 | 世界遗产',
   '贝伦塔建于16世纪，是葡萄牙大航海时代的标志性建筑。这座矗立在塔霍河畔的曼努埃尔式石塔曾是航海者的灯塔和军事要塞。精美的石雕绳索、十字架和海洋生物装饰诉说着葡萄牙航海帝国的辉煌历史。2007年被评为世界七大奇迹之一。\n\n拍摄建议：从河对岸拍摄贝伦塔与4月25日大桥的组合全景是最经典的角度。日落时分的金色光线照射在石塔上格外迷人。退潮时可以从更近的角度拍摄塔基细节。',
   'Belém Tower was built in the 16th century as an iconic symbol of Portugal\'s Age of Discovery. This Manueline stone tower on the Tagus River served as a lighthouse and military fortress.',
   [{icon:'🏰',title:'大航海地标',desc:'曼努埃尔式石塔'},{icon:'🌊',title:'塔霍河畔',desc:'河上石塔的壮丽身影'},{icon:'📸',title:'最佳拍摄',desc:'河对岸塔与大桥全景'}],
   ['塔楼','大航海','世界遗产','里斯本']],
  ['jeronimos-monastery','热罗尼莫斯修道院','Jerónimos Monastery','葡萄牙','Portugal','里斯本','Lisbon','大航海时代的信仰丰碑','⛪ 曼努埃尔式巅峰 | 世界遗产 | 航海遗产',
   '热罗尼莫斯修道院是葡萄牙最宏伟的建筑，建于16世纪，纪念达伽马发现印度航线的伟大壮举。曼努埃尔式建筑的巅峰之作——精美的石雕绳索、航海仪器和海洋生物装饰覆盖了整座建筑。教堂内部的肋状拱顶如同石雕森林，令人叹为观止。\n\n拍摄建议：从修道院正面拍摄曼努埃尔式石雕细节的全景是最经典的角度。教堂内部的拱顶和石柱是绝佳的建筑摄影题材。清晨的光线最适合拍摄建筑外立面。',
   'Jerónimos Monastery is Portugal\'s most magnificent building, built in the 16th century to commemorate Vasco da Gama\'s discovery of the sea route to India. The pinnacle of Manueline architecture.',
   [{icon:'⛪',title:'曼努埃尔巅峰',desc:'最精美的石雕建筑'},{icon:'🏆',title:'世界遗产',desc:'大航海时代信仰丰碑'},{icon:'📸',title:'最佳拍摄',desc:'正面石雕细节全景'}],
   ['修道院','世界遗产','曼努埃尔','大航海']],
  ['alfama-district','阿尔法玛区','Alfama District','葡萄牙','Portugal','里斯本','Lisbon','里斯本最古老的迷宫街区','🏘️ 摩尔人遗产 | 法多音乐 | 彩色窄巷',
   '阿尔法玛是里斯本最古老的街区，保留了摩尔人时期的迷宫般巷道格局。彩色的瓷砖房屋、狭窄的石板巷道和忽隐忽现的观景台构成了里斯本最迷人的画面。法多音乐从街角的小酒馆中飘出，为这片老城区增添了独特的忧伤韵味。\n\n拍摄建议：从圣乔治城堡或圣卢西亚观景台俯拍阿尔法玛红色屋顶和塔霍河的全景是最经典的角度。窄巷中的彩色瓷砖房屋和晾衣绳是最上镜的人文题材。日落时分的金色光线笼罩整个街区。',
   'Alfama is Lisbon\'s oldest neighborhood, preserving the Moorish-era labyrinth of narrow lanes. Colorful tiled houses, cobblestone alleys, and hidden viewpoints create Lisbon\'s most charming scenes.',
   [{icon:'🏘️',title:'最古老街区',desc:'摩尔人迷宫巷道'},{icon:'🎵',title:'法多音乐',desc:'街角酒馆的忧伤旋律'},{icon:'📸',title:'最佳拍摄',desc:'城堡俯拍红色屋顶全景'}],
   ['街区','法多','摩尔人','里斯本']],
  ['sao-jorge-castle','圣乔治城堡','São Jorge Castle','葡萄牙','Portugal','里斯本','Lisbon','俯瞰里斯本的山巅要塞','🏰 摩尔人城堡 | 全景观景台 | 千年要塞',
   '圣乔治城堡矗立在里斯本最高的山丘上，是俯瞰整座城市的最佳地点。这座摩尔人城堡有着超过两千年的历史，城墙和塔楼保存完好。从城堡的观景台可以360度俯瞰里斯本的红色屋顶、塔霍河和远处的4月25日大桥。\n\n拍摄建议：从城堡观景台拍摄里斯本全景是最经典的角度。日落时分的金色光线笼罩整个城市最为壮观。城堡城墙上的炮台和花园也是很好的取景元素。',
   'São Jorge Castle stands on Lisbon\'s highest hill, the best vantage point for panoramic city views. This Moorish fortress has over 2,000 years of history with well-preserved walls and towers.',
   [{icon:'🏰',title:'摩尔人城堡',desc:'两千年历史要塞'},{icon:'🌅',title:'全景观景',desc:'360度俯瞰里斯本'},{icon:'📸',title:'最佳拍摄',desc:'观景台城市全景日落'}],
   ['城堡','摩尔人','全景','里斯本']],
  ['porto-dom-luis','路易一世桥','Dom Luís I Bridge','葡萄牙','Portugal','波尔图','Porto','杜罗河上的钢铁彩虹','🌉 双层铁桥 | 波尔图地标 | 世界遗产',
   '路易一世桥是波尔图最具标志性的地标，这座双层钢铁拱桥横跨杜罗河，连接波尔图和加亚新城。由居斯塔夫·埃菲尔的学生设计，上层通行地铁，下层通行汽车和行人。从桥上层的人行道可以拍摄到波尔图河岸最壮观的全景。\n\n拍摄建议：从桥上层拍摄波尔图河岸全景是最经典的角度。日落时分从加亚新城一侧拍摄大桥与波尔图河岸的组合全景最为壮观。夜晚大桥的灯光照明也很迷人。',
   'The Dom Luís I Bridge is Porto\'s most iconic landmark, a double-deck steel arch bridge spanning the Douro River. Designed by a student of Gustave Eiffel, the upper deck carries the metro.',
   [{icon:'🌉',title:'双层铁桥',desc:'埃菲尔学生设计杰作'},{icon:'🏆',title:'世界遗产',desc:'波尔图最具标志性地标'},{icon:'📸',title:'最佳拍摄',desc:'桥上层波尔图全景'}],
   ['桥梁','波尔图','钢铁','世界遗产']],
  ['porto-rabelo','波尔图酒窖','Porto Wine Cellars','葡萄牙','Portugal','波尔图','Porto','波特酒的百年醇化之地','🍷 波特酒窖 | 杜罗河畔 | 百年传统',
   '波尔图酒窖位于杜罗河南岸的加亚新城，是波特酒生产和陈酿的中心。数百个橡木桶排列在阴凉的酒窖中，波特酒在这里安静地醇化数年。从酒窖的露台可以俯瞰杜罗河和波尔图老城的天际线。\n\n拍摄建议：从酒窖露台拍摄杜罗河和波尔图老城的全景是最经典的角度。酒窖内部的橡木桶排列也是很好的拍摄题材。日落时分从酒窖拍摄对岸的金色光线格外迷人。',
   'Porto wine cellars are located in Vila Nova de Gaia on the south bank of the Douro, the heart of port wine production and aging. Hundreds of oak barrels rest in cool cellars.',
   [{icon:'🍷',title:'波特酒窖',desc:'百年波特酒醇化中心'},{icon:'🏭',title:'橡木桶阵',desc:'数百个橡木桶排列'},{icon:'📸',title:'最佳拍摄',desc:'酒窖露台杜罗河全景'}],
   ['酒窖','波特酒','波尔图','杜罗河']],
  ['sintra-pena-palace','佩纳宫','Pena Palace, Sintra','葡萄牙','Portugal','辛特拉','Sintra','欧洲最浪漫的彩色宫殿','🏰 彩色宫殿 | 童话建筑 | 世界遗产',
   '佩纳宫是欧洲最浪漫的宫殿之一，这座色彩斑斓的新浪漫主义建筑矗立在辛特拉山巅，如同从童话中走出的城堡。红色、黄色、蓝色和紫色的外墙在阳光下交相辉映，摩尔式拱门和哥特式尖塔增添了异域风情。周围的花园中隐藏着神秘的洞穴和瀑布。\n\n拍摄建议：从宫殿前的花园拍摄彩色宫殿全景是最经典的角度。清晨的薄雾笼罩山间时，宫殿如同漂浮在云端。从辛特拉镇步行上山沿途有多个绝佳拍摄点。',
   'Pena Palace is one of Europe\'s most romantic palaces, a colorful Neo-Romantic building atop the Sintra mountains like a castle from a fairy tale. Red, yellow, blue, and purple facades shimmer in sunlight.',
   [{icon:'🏰',title:'童话宫殿',desc:'欧洲最浪漫彩色建筑'},{icon:'🌈',title:'缤纷色彩',desc:'红黄蓝紫交相辉映'},{icon:'📸',title:'最佳拍摄',desc:'花园拍摄彩色全景'}],
   ['宫殿','童话','彩色','世界遗产']],
  ['sintra-moorish-castle','摩尔人城堡','Moorish Castle, Sintra','葡萄牙','Portugal','辛特拉','Sintra','山巅的摩尔人军事遗迹','🏰 8世纪要塞 | 城墙蜿蜒 | 辛特拉全景',
   '辛特拉摩尔人城堡建于8世纪，是伊比利亚半岛保存最完好的摩尔人军事建筑。城墙沿着山脊蜿蜒如同长城，从城墙上可以俯瞰辛特拉镇和远处的大西洋。城堡内部的花园和遗迹增添了神秘的中世纪氛围。\n\n拍摄建议：从城墙最高处拍摄辛特拉镇和大西洋的全景是最壮观的角度。城墙蜿蜒的画面从远处拍摄也很壮观。清晨的薄雾笼罩山谷时如同仙境。',
   'The Moorish Castle of Sintra was built in the 8th century, the best-preserved Moorish military architecture on the Iberian Peninsula. Walls wind along the ridge with views of Sintra and the Atlantic.',
   [{icon:'🏰',title:'8世纪要塞',desc:'伊比利亚最完好摩尔遗迹'},{icon:'🌊',title:'大西洋远景',desc:'城墙俯瞰镇与海洋'},{icon:'📸',title:'最佳拍摄',desc:'城墙最高处全景'}],
   ['城堡','摩尔人','山巅','辛特拉']],
  ['quinta-da-regaleira','雷加莱拉庄园','Quinta da Regaleira','葡萄牙','Portugal','辛特拉','Sintra','神秘启蒙之井的地下迷宫','🏰 启蒙之井 | 地下迷宫 | 神秘花园',
   '雷加莱拉庄园是辛特拉最神秘的景点，这座哥特式庄园的花园中隐藏着启蒙之井——一条27米深的螺旋地下通道，通向花园深处的地下迷宫。整个庄园充满了共济会和圣殿骑士的神秘符号，地下隧道、瀑布和秘密花园构成了一个充满隐喻的精神世界。\n\n拍摄建议：从启蒙之井顶部俯拍螺旋阶梯是最经典的角度。进入地下隧道拍摄光影效果也很独特。庄园的哥特式建筑和花园中的雕塑也值得拍摄。',
   'Quinta da Regaleira is Sintra\'s most mysterious attraction, with the Initiation Well — a 27-meter deep spiral underground passage leading to underground mazes. The estate is filled with Masonic and Templar symbols.',
   [{icon:'🏰',title:'启蒙之井',desc:'27米深螺旋地下通道'},{icon:'🔮',title:'神秘符号',desc:'共济会与圣殿骑士隐喻'},{icon:'📸',title:'最佳拍摄',desc:'井顶俯拍螺旋阶梯'}],
   ['庄园','神秘','地下','辛特拉']],
  ['cabo-da-roca','罗卡角','Cabo da Roca','葡萄牙','Portugal','辛特拉','Sintra','欧洲大陆的最西端','🌍 欧洲最西端 | 大西洋悬崖 | 天涯海角',
   '罗卡角是欧洲大陆的最西端，海拔140米的悬崖直插入大西洋。葡萄牙诗人卡蒙斯的名句"陆止于此，海始于斯"被刻在纪念碑上。从悬崖边缘望去，无边无际的大西洋在脚下展开，灯塔矗立在狂风之中，是真正的"天涯海角"。\n\n拍摄建议：从悬崖边缘拍摄大西洋和灯塔的全景是最经典的角度。日落时分太阳沉入大西洋的画面最为壮观。风大的时候海浪拍打悬崖的浪花也很震撼。记得带防风外套。',
   'Cabo da Roca is the westernmost point of mainland Europe, with 140-meter cliffs plunging into the Atlantic. Poet Camões\' famous line "Where the land ends and the sea begins" is inscribed on the monument.',
   [{icon:'🌍',title:'欧洲最西',desc:'大陆最西端悬崖'},{icon:'🌊',title:'大西洋悬崖',desc:'140米悬崖直入海洋'},{icon:'📸',title:'最佳拍摄',desc:'悬崖边缘大西洋全景'}],
   ['海角','悬崖','大西洋','地标']],
  ['obidos-village','奥比都斯','Óbidos Village','葡萄牙','Portugal','中部','Central','中世纪城墙内的白色小镇','🏘️ 城墙小镇 | 樱桃酒 | 中世纪活城',
   '奥比都斯是一座完整保留中世纪城墙的白色小镇，城墙可以步行环绕一圈。镇内的白色房屋装饰着蓝色和黄色的瓷砖，狭窄的巷道两旁是鲜花和手工艺品店。这里也是著名的樱桃酒（Ginjinha）的发源地，用巧克力杯盛装的甜酒是独特的味觉体验。\n\n拍摄建议：从城墙上拍摄白色小镇和远处田野的全景是最经典的角度。巷道中的鲜花和彩色瓷砖房屋是最上镜的人文题材。春季的鲜花盛开时最为迷人。',
   'Óbidos is a white village completely preserved within medieval walls that can be walked around. Houses decorated with blue and yellow tiles line narrow lanes with flowers and craft shops.',
   [{icon:'🏘️',title:'城墙小镇',desc:'完整中世纪城墙环绕'},{icon:'🍒',title:'樱桃酒',desc:'巧克力杯装Ginjinha'},{icon:'📸',title:'最佳拍摄',desc:'城墙俯拍白色全景'}],
   ['小镇','中世纪','城墙','白色']],
  ['nazare-waves','纳扎雷巨浪','Nazaré Big Waves','葡萄牙','Portugal','中部','Central','世界最大冲浪浪','🌊 30米巨浪 | 冲浪圣地 | 大西洋力量',
   '纳扎雷以拥有世界上最大的冲浪浪而闻名，冬季的巨浪可以高达30米。海底峡谷的特殊地形将大西洋的涌浪放大成令人震撼的巨浪。每年冬天，全世界最勇敢的冲浪者聚集在这里挑战极限。从山顶的观景台可以俯瞰整个海滩和巨浪。\n\n拍摄建议：从山顶观景台拍摄巨浪和冲浪者的全景是最经典的角度。冬季风暴期间浪最大最壮观。使用长焦镜头可以从远处捕捉冲浪者在巨浪上的画面。',
   'Nazaré is famous for having the world\'s largest surfing waves, with winter swells reaching up to 30 meters. The underwater canyon amplifies Atlantic swells into breathtaking waves.',
   [{icon:'🌊',title:'30米巨浪',desc:'世界最大冲浪浪'},{icon:'🏄',title:'冲浪圣地',desc:'全球最勇敢者聚集'},{icon:'📸',title:'最佳拍摄',desc:'山顶观景台巨浪全景'}],
   ['巨浪','冲浪','大西洋','自然']],
  ['batalha-monastery','巴塔利亚修道院','Batalha Monastery','葡萄牙','Portugal','中部','Central','哥特式建筑的巅峰之作','⛪ 哥特式巅峰 | 曼努埃尔式 | 世界遗产',
   '巴塔利亚修道院建于14世纪，纪念葡萄牙在阿勒祖巴洛特战役中的胜利。这座哥特式建筑的杰作拥有精美的石雕、壮丽的回廊和未完成的礼拜堂。曼努埃尔式的拱门和石柱展现了葡萄牙建筑的最高水平。1983年被列为世界遗产。\n\n拍摄建议：从修道院正面拍摄哥特式拱门和石雕细节的全景是最经典的角度。未完成礼拜堂的露天空间光影效果独特。回廊的石柱和拱门也是绝佳的建筑摄影题材。',
   'Batalha Monastery was built in the 14th century to commemorate Portugal\'s victory at the Battle of Aljubarrota. This Gothic masterpiece features exquisite stonework and magnificent cloisters.',
   [{icon:'⛪',title:'哥特巅峰',desc:'14世纪哥特式杰作'},{icon:'🏆',title:'世界遗产',desc:'葡萄牙建筑最高水平'},{icon:'📸',title:'最佳拍摄',desc:'正面哥特式拱门全景'}],
   ['修道院','哥特式','世界遗产','曼努埃尔']],
  ['alcobaca-monastery','阿尔科巴萨修道院','Alcobaça Monastery','葡萄牙','Portugal','中部','Central','葡萄牙最大的哥特式教堂','⛪ 最大哥特教堂 | 爱情悲剧 | 世界遗产',
   '阿尔科巴萨修道院拥有葡萄牙最大的哥特式教堂，建于12世纪。教堂内安放着佩德罗一世和伊内斯·德·卡斯特罗的陵墓——葡萄牙最著名的爱情悲剧。两座精美的石雕陵墓面对面安放，诉说着这段生死不渝的爱情故事。\n\n拍摄建议：从教堂正面拍摄哥特式立面的全景是最经典的角度。教堂内部的佩德罗和伊内斯陵墓是最感人的拍摄题材。教堂后部的回廊和厨房也值得探访。',
   'Alcobaça Monastery houses Portugal\'s largest Gothic church, built in the 12th century. Inside are the tombs of Pedro I and Inês de Castro — Portugal\'s most famous love tragedy.',
   [{icon:'⛪',title:'最大哥特',desc:'葡萄牙最大哥特教堂'},{icon:'💔',title:'爱情悲剧',desc:'佩德罗与伊内斯陵墓'},{icon:'📸',title:'最佳拍摄',desc:'教堂正面哥特式全景'}],
   ['修道院','哥特式','爱情','世界遗产']],
  ['tomar-templars','托马尔骑士团城堡','Tomar Knights Templar Castle','葡萄牙','Portugal','中部','Central','圣殿骑士团的葡萄牙总部','🏰 圣殿骑士 | 八角礼拜堂 | 世界遗产',
   '托马尔的基督修道院是圣殿骑士团在葡萄牙的总部，建于12世纪。标志性的八角形礼拜堂模仿耶路撒冷圣墓教堂建造，内部装饰着精美的中世纪壁画。修道院的窗户上雕刻着著名的"蔓藤窗"——曼努埃尔式最精美的石雕作品。\n\n拍摄建议：从修道院外部拍摄蔓藤窗的特写是最经典的取景元素。八角礼拜堂内部的壁画和石柱也很上镜。从城堡高处俯瞰托马尔镇的全景也很壮观。',
   'The Convent of Christ in Tomar was the headquarters of the Knights Templar in Portugal, built in the 12th century. The iconic octagonal chapel was modeled after the Church of the Holy Sepulchre.',
   [{icon:'🏰',title:'圣殿骑士',desc:'骑士团葡萄牙总部'},{icon:'🪟',title:'蔓藤窗',desc:'曼努埃尔式最精美石雕'},{icon:'📸',title:'最佳拍摄',desc:'蔓藤窗特写全景'}],
   ['城堡','骑士团','圣殿','世界遗产']],
  ['evora-chapel-bones','埃武拉人骨教堂','Évora Bone Chapel','葡萄牙','Portugal','阿连特茹','Alentejo','用骷髅装饰的死亡沉思','💀 人骨礼拜堂 | 死亡提醒 | 巴洛克奇观',
   '埃武拉人骨教堂是葡萄牙最独特的景点，整座礼拜堂的墙壁和柱子都用5000多具骷髅的骨骼装饰。16世纪的方济各会修士用墓地的遗骨创作了这件震撼人心的巴洛克艺术品。入口处的铭文写着"我们这些骨头在此等待着你们的骨头"。\n\n拍摄建议：从礼拜堂内部拍摄骨骼装饰的墙壁和柱子是最经典的取景角度。教堂内部的烛光增添了神秘的氛围。外部的人骨柱廊也很壮观。注意保持尊重的态度。',
   'The Bone Chapel in Évora is Portugal\'s most unique attraction, with walls and pillars decorated with bones from over 5,000 skeletons. 16th-century Franciscan monks created this breathtaking Baroque artwork.',
   [{icon:'💀',title:'人骨礼拜堂',desc:'5000具骷髅装饰'},{icon:'⛪',title:'巴洛克奇观',desc:'修士创作的震撼艺术'},{icon:'📸',title:'最佳拍摄',desc:'内部骨骼墙壁全景'}],
   ['教堂','人骨','巴洛克','埃武拉']],
  ['algarve-benagil','贝纳吉尔洞','Benagil Cave','葡萄牙','Portugal','阿尔加维','Algarve','大西洋上的天然穹顶','🏖️ 海蚀洞 | 天然穹顶 | 翡翠水光',
   '贝纳吉尔洞是阿尔加维最壮观的自然奇观，一个被海水侵蚀出的巨大海蚀洞，顶部有一个圆形天窗，阳光从天窗射入照亮了翡翠色的海水。只能乘船或皮划艇到达。洞内的金色沙滩和碧蓝海水构成了如同世外桃源般的画面。\n\n拍摄建议：乘船或皮划艇进入洞穴拍摄天窗和翡翠水光是最经典的体验。从洞口外部拍摄洞穴入口与海岸线的组合全景也很壮观。正午阳光直射时洞内水色最为鲜艳。',
   'Benagil Cave is the Algarve\'s most spectacular natural wonder, a massive sea cave with a circular skylight where sunlight illuminates emerald waters. Accessible only by boat or kayak.',
   [{icon:'🏖️',title:'海蚀穹顶',desc:'天然天窗照亮翡翠水'},{icon:'🛶',title:'皮划艇',desc:'唯一到达方式'},{icon:'📸',title:'最佳拍摄',desc:'洞内天窗翡翠水光'}],
   ['海蚀洞','天窗','阿尔加维','自然']],
  ['madeira-funchal','丰沙尔','Funchal, Madeira','葡萄牙','Portugal','马德拉','Madeira','大西洋上的花园之岛','🏝️ 火山海港 | 热带花园 | 葡萄酒之乡',
   '丰沙尔是马德拉群岛的首府，一座建在火山斜坡上的彩色海港城市。热带花园、葡萄酒庄园和壮丽的火山地形构成了这座大西洋岛屿独特的魅力。从山顶可以俯瞰整个半月形的海港和碧蓝的大西洋。马德拉葡萄酒和香蕉是当地的特产。\n\n拍摄建议：从山顶观景台拍摄半月形海港全景是最经典的角度。热带花园中的奇异花卉和棕榈树是很好的前景元素。日落时分的海港灯光倒映在海面上格外迷人。',
   'Funchal is the capital of the Madeira archipelago, a colorful harbor city built on volcanic slopes. Tropical gardens, wine estates, and dramatic volcanic terrain create this Atlantic island\'s unique charm.',
   [{icon:'🏝️',title:'火山海港',desc:'建在火山斜坡上的城市'},{icon:'🍷',title:'葡萄酒乡',desc:'马德拉葡萄酒故乡'},{icon:'📸',title:'最佳拍摄',desc:'山顶俯瞰半月形海港'}],
   ['海岛','火山','海港','花园']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 219
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
  console.log(`\n共插入 ${items.length} 个葡萄牙景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
