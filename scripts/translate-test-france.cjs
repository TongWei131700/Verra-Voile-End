/**
 * 测试法国 57 条场地数据翻译脚本
 * 翻译 name_cn, tagline_cn, description_cn, features, venue_types, towns, location
 * 同步更新 cv_test_france 和 cd_test_france
 */
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: '127.0.0.1', port: 3306, user: 'root', password: '',
  database: 'verra_voile', waitForConnections: true, connectionLimit: 3,
})

// 法国地名中文映射
const TOWN_CN = {
  'Urval': '于尔瓦勒', 'Monteux': '蒙特', 'Le Pradet': '勒普拉代',
  'Castelnau-de-Lévis': '卡斯泰尔诺-德莱维', 'Mérélessart': '梅雷莱萨尔',
  'Solérieux': '索列里约', 'Champigné': '尚皮涅', 'Paris': '巴黎',
  'Tresserve': '特雷塞尔沃', 'Bouchemaine': '布什曼', 'France': '法国',
  'Cannes': '戛纳', 'Cadenet': '卡德奈', 'Saint-Martin': '圣马丁',
  'Giverny': '吉维尼', 'Nonac': '诺纳克', 'Chaumontel': '肖蒙泰尔',
  'Sisteron': '西斯特龙', 'Dampsmesnil': '当普梅尼勒', 'Épernay': '埃佩尔奈',
  'Buzet-sur-Tarn': '塔恩河畔比泽', 'Savasse': '萨瓦斯', 'Fillière': '菲利耶尔',
  'Saint-Martin-du-Tertre': '圣马丁迪泰尔特勒', 'Lignan-de-Bordeaux': '利尼昂德波尔多',
  'Draguignan': '德拉吉尼昂', 'Parigné-le-Pôlin': '帕里涅勒波兰',
  'Reillanne': '雷亚讷', 'Morières-lès-Avignon': '莫里耶尔莱萨维尼翁',
  'Les Vignères': '莱维涅尔', 'La Londe-les-Maures': '拉隆德莱莫尔',
  'Villefranque': '维尔弗朗克', 'Tabanac': '塔布纳克',
  'Talloires': '塔卢瓦尔', 'Montrieux-en-Sologne': '蒙特里厄索洛涅',
  'Saint-Martin-de-Crau': '圣马丹德克罗', 'Saint-Rémy-de-Provence': '圣雷米德普罗旺斯',
  'Teyssode': '泰索德', 'Orgon': '奥尔贡', 'Sault': '索',
  'Maureilhan': '莫雷扬', 'Le Foeil': '勒弗伊',
  'Saint-Sauveur-de-Landemont': '圣索沃尔德朗德蒙',
  'Beaulieu-sur-Loire': '卢瓦尔河畔博略', 'Sorgues': '索尔格',
  'Rochefort-du-Gard': '罗什福尔迪加尔', 'Saint-Thomas-en-Royans': '圣托马昂鲁瓦扬',
  'Coursac': '库尔萨克', 'La Penne': '拉佩讷',
}

// 场地类型中文映射
const VTYPE_CN = {
  'Château': '城堡', 'Estate': '庄园', 'Wedding Venue': '婚礼场地',
  'Mansion': '庄园', 'Garden': '花园', 'Hotel': '酒店',
}

const translations = [
  { slug: 'chateau-de-la-bourlie', name_cn: '拉布利城堡', tagline_cn: '佩里戈尔中心的山丘城堡', location_cn: '于尔瓦勒' },
  { slug: 'domaine-de-beauregard', name_cn: '博勒加德庄园', tagline_cn: '普罗旺斯中心的18世纪瑰宝', location_cn: '蒙特' },
  { slug: 'rocabella', name_cn: '罗卡贝拉', tagline_cn: '瓦尔省海景婚礼场地', location_cn: '勒普拉代' },
  { slug: 'domaine-terra-rosa', name_cn: '特拉罗萨庄园', tagline_cn: '橄榄园中的梦幻婚礼庄园', location_cn: '卡斯泰尔诺-德莱维' },
  { slug: 'chteau-hlose', name_cn: '埃洛伊兹城堡', tagline_cn: '索姆省浪漫城堡婚礼', location_cn: '梅雷莱萨尔' },
  { slug: 'les-domaines-de-patras', name_cn: '帕特拉庄园', tagline_cn: '薰衣草庄园优雅婚礼', location_cn: '索列里约' },
  { slug: 'chteau-des-briottires', name_cn: '布里奥蒂耶尔城堡', tagline_cn: '曼恩-卢瓦尔省四星城堡', location_cn: '尚皮涅' },
  { slug: 'fleurs-de-prestige', name_cn: '普雷斯蒂奇花艺', tagline_cn: '巴黎高定婚礼花艺设计', location_cn: '巴黎' },
  { slug: 'chteau-de-tresserve', name_cn: '特雷塞尔沃城堡', tagline_cn: '萨瓦省湖光山色城堡', location_cn: '特雷塞尔沃' },
  { slug: 'chteau-le-fresne', name_cn: '弗雷讷城堡', tagline_cn: '19世纪河畔历史城堡', location_cn: '布什曼' },
  { slug: 'alliance-rve', name_cn: '梦幻联盟婚礼策划', tagline_cn: '普罗旺斯定制婚礼策划', location_cn: '' },
  { slug: 'les-jardins-darlias-by-la-villa-alexandra', name_cn: '阿尔利亚花园', tagline_cn: '戛纳私密花园婚礼', location_cn: '戛纳' },
  { slug: 'domaine-du-grand-lauron', name_cn: '大洛伦庄园', tagline_cn: '普罗旺斯湖畔薰衣草庄园', location_cn: '卡德奈' },
  { slug: 'le-domaine-anse-marcel-beach', name_cn: '安斯马塞尔海滩庄园', tagline_cn: '圣马丁碧海婚礼庄园', location_cn: '圣马丁' },
  { slug: 'la-dme-de-giverny', name_cn: '吉维尼什一教堂', tagline_cn: '莫奈花园旁13世纪婚礼场', location_cn: '吉维尼' },
  { slug: 'chteau-de-la-faye', name_cn: '拉法耶城堡', tagline_cn: '野性优雅的13世纪城堡', location_cn: '诺纳克' },
  { slug: 'chteau-de-chaumontel', name_cn: '肖蒙泰尔城堡', tagline_cn: '巴黎近郊高端活动城堡', location_cn: '肖蒙泰尔' },
  { slug: 'dream-paris-wedding', name_cn: '巴黎之梦婚礼策划', tagline_cn: '巴黎目的地婚礼策划', location_cn: '' },
  { slug: 'le-mas-des-cinq-fontaines', name_cn: '五泉农庄', tagline_cn: '普罗旺斯五星庄园婚礼', location_cn: '西斯特龙' },
  { slug: 'domaine-daveny', name_cn: '达夫尼庄园', tagline_cn: '巴黎一小时绿意城堡', location_cn: '当普梅尼勒' },
  { slug: 'chteau-comtesse-lafond', name_cn: '拉丰伯爵夫人城堡', tagline_cn: '香槟区19世纪优雅城堡', location_cn: '埃佩尔奈' },
  { slug: 'chteau-de-laurentie', name_cn: '洛朗蒂城堡', tagline_cn: '翠绿伊甸园婚礼城堡', location_cn: '塔恩河畔比泽' },
  { slug: 'chteau-de-serre-de-parc', name_cn: '塞尔德帕克城堡', tagline_cn: '罗纳河谷18世纪古堡', location_cn: '萨瓦斯' },
  { slug: 'chteau-de-thorens', name_cn: '托朗城堡', tagline_cn: '阿尔卑斯山间浪漫古堡', location_cn: '菲利耶尔' },
  { slug: 'chteau-de-saint-martin-du-tertre', name_cn: '圣马丁山丘城堡', tagline_cn: '巴黎北郊历史城堡婚礼', location_cn: '圣马丁迪泰尔特勒' },
  { slug: 'chteau-de-seguin', name_cn: '塞甘城堡', tagline_cn: '波尔多葡萄园城堡婚礼', location_cn: '利尼昂德波尔多' },
  { slug: 'chteau-pimo', name_cn: '皮莫城堡', tagline_cn: '19世纪瓦尔省城堡婚礼', location_cn: '德拉吉尼昂' },
  { slug: 'chteau-des-perrais', name_cn: '佩雷城堡', tagline_cn: '17世纪绿色历史庄园', location_cn: '帕里涅勒波兰' },
  { slug: 'samantha-bottelier-events', name_cn: '萨曼莎婚礼策划', tagline_cn: '巴黎奢华婚礼策划', location_cn: '' },
  { slug: 'couvent-notre-dame-des-prs', name_cn: '圣母修道院', tagline_cn: '普罗旺斯12世纪修道院', location_cn: '雷亚讷' },
  { slug: 'chteau-saint-laurent', name_cn: '圣洛朗城堡', tagline_cn: '普罗旺斯葡萄园亲密婚礼', location_cn: '莫里耶尔莱萨维尼翁' },
  { slug: 'le-petit-roulet', name_cn: '小鲁莱庄园', tagline_cn: '17世纪普罗旺斯田园婚礼', location_cn: '莱维涅尔' },
  { slug: 'chteau-de-la-pascalette', name_cn: '帕斯卡莱特城堡', tagline_cn: '地中海畔葡萄园城堡', location_cn: '拉隆德莱莫尔' },
  { slug: 'domaine-santa-maria', name_cn: '圣玛丽亚庄园', tagline_cn: '巴斯克地区山顶庄园', location_cn: '维尔弗朗克' },
  { slug: 'chteau-sentout', name_cn: '桑图城堡', tagline_cn: '波尔多秘境葡萄园城堡', location_cn: '塔布纳克' },
  { slug: 'noces-du-monde', name_cn: '环球婚礼策划', tagline_cn: '波尔多定制婚礼策划', location_cn: '' },
  { slug: 'abbaye-de-talloires', name_cn: '塔卢瓦尔修道院', tagline_cn: '安纳西湖畔17世纪修道院', location_cn: '塔卢瓦尔' },
  { slug: 'chteau-le-chreau', name_cn: '谢罗城堡', tagline_cn: '索洛涅区高端城堡婚礼', location_cn: '蒙特里厄索洛涅' },
  { slug: 'chteau-de-vergieres', name_cn: '韦尔吉耶尔城堡', tagline_cn: '普罗旺斯25公顷自然城堡', location_cn: '圣马丹德克罗' },
  { slug: 'lmk-events', name_cn: 'LMK环球婚礼', tagline_cn: '定制 exceptional 婚礼', location_cn: '圣雷米德普罗旺斯' },
  { slug: 'chteau-de-scalibert', name_cn: '斯卡利贝尔城堡', tagline_cn: '塔恩乡间温馨城堡婚礼', location_cn: '泰索德' },
  { slug: 'le-mas-de-la-rose', name_cn: '玫瑰农庄', tagline_cn: '25公顷森林公园田园婚礼', location_cn: '奥尔贡' },
  { slug: 'la-grange-de-javon', name_cn: '雅翁谷仓', tagline_cn: '吕贝隆薰衣草田婚礼', location_cn: '索' },
  { slug: 'mas-de-la-massane', name_cn: '马萨纳农庄', tagline_cn: '阿尔皮勒山普罗旺斯农庄', location_cn: '圣雷米德普罗旺斯' },
  { slug: 'la-trsorire', name_cn: '拉特雷索里耶尔', tagline_cn: '埃罗省距海滩20分钟庄园', location_cn: '莫雷扬' },
  { slug: 'la-faiseuse-de-reves', name_cn: '造梦师蜜月旅行', tagline_cn: '巴黎高端定制蜜月旅行', location_cn: '巴黎' },
  { slug: 'chteau-de-la-no-sche', name_cn: '干诺埃城堡', tagline_cn: '布列塔尼浪漫 timeless 城堡', location_cn: '勒弗伊' },
  { slug: 'phyllis-kent-events-weddings', name_cn: '菲丽丝肯特婚礼策划', tagline_cn: '巴黎专业婚礼策划服务', location_cn: '' },
  { slug: 'white-house-cannes', name_cn: '戛纳白宫', tagline_cn: '戛纳美 belle 时代别墅', location_cn: '戛纳' },
  { slug: 'chteau-de-la-colaissire', name_cn: '拉科莱西耶尔城堡', tagline_cn: '安茹区尊贵城堡婚礼', location_cn: '圣索沃尔德朗德蒙' },
  { slug: 'chteau-de-courcelles-le-roy', name_cn: '库尔塞勒勒鲁瓦城堡', tagline_cn: '卢瓦尔河畔世外桃源城堡', location_cn: '卢瓦尔河畔博略' },
  { slug: 'chteau-la-tour-vaucros', name_cn: '沃克罗塔楼城堡', tagline_cn: '普罗旺斯梦幻塔楼城堡', location_cn: '索尔格' },
  { slug: 'domaine-le-grand-belly', name_cn: '大贝利庄园', tagline_cn: '13世纪薰衣草葡萄园庄园', location_cn: '罗什福尔迪加尔' },
  { slug: 'domaine-de-la-chartrognire', name_cn: '沙尔特罗尼耶尔庄园', tagline_cn: '德龙省宁静优雅庄园', location_cn: '圣托马昂鲁瓦扬' },
  { slug: 'chteau-de-la-jarthe', name_cn: '拉雅尔特城堡', tagline_cn: '140公顷橘园城堡婚礼', location_cn: '库尔萨克' },
  { slug: 'domaine-la-plume', name_cn: '拉普吕姆庄园', tagline_cn: '意大利风格别墅庄园婚礼', location_cn: '拉佩讷' },
  { slug: 'kiss-me-in-paris-wedding-planner', name_cn: '巴黎之吻婚礼策划', tagline_cn: '巴黎高端目的地婚礼策划', location_cn: '' },
]

// 场地特色中文翻译（精简每条≤25字）
const FEATURES_CN = {
  'chateau-de-la-bourlie': ['佩里戈尔中心山丘城堡', '14世纪历史城堡', '泳池景观宴会厅可容150人', '玫瑰小径与柠檬树花园', '私密空间多种婚礼选择'],
  'domaine-de-beauregard': ['普罗旺斯18世纪庄园', '阿维尼翁与卡尔庞特拉之间', '古典魅力与普罗旺斯生活艺术', '400平方米宴会大厅', '宁静优雅的高端婚礼'],
  'rocabella': ['瓦尔省海景婚礼场地', '多个独特婚礼空间', '海景露台与花园', '全方位婚礼服务'],
  'domaine-terra-rosa': ['7公顷橄榄园庄园', '5分钟图卢兹-阿尔比高速', '古老石砌建筑精心修复', '每个角落精致装饰', '芳香植物环绕的田园'],
  'chteau-hlose': ['索姆省优雅城堡', '优雅舒适与欢乐并存', '高端服务打造完美婚礼', '宏伟婚礼仪式空间', '量身定制无忧婚礼'],
  'les-domaines-de-patras': ['80公顷薰衣草橡树公园', '17世纪湖畔庭院鸡尾酒', '谷仓可容180人晚宴', '普罗旺斯顶级婚礼庄园'],
  'chteau-des-briottires': ['曼恩-卢瓦尔省家族城堡', '四星酒店级别环境', '50公顷公园英式花园', '百年老树花园漫步'],
  'fleurs-de-prestige': ['巴黎高定婚礼花艺', '量身定制花卉装饰', '华丽拱门浪漫花墙', '专业花艺团队匠心打造'],
  'chteau-de-tresserve': ['萨瓦湖光山色城堡', '布尔歇湖与山景全景', '高端精致装修', '双层接待空间'],
  'chteau-le-fresne': ['19世纪河畔城堡', '昂热近郊历史场地', '公园英式花园拍照胜地', '绿色花园中的浪漫晚宴'],
  'alliance-rve': ['定制婚礼策划专家', '普罗旺斯到蔚蓝海岸', '专业团队全程策划', '梦幻婚礼变现实'],
  'les-jardins-darlias-by-la-villa-alexandra': ['戛纳中心私密花园', 'lush优雅自然氛围', '仪式鸡尾酒星空晚宴', '专业团队细致服务'],
  'domaine-du-grand-lauron': ['11公顷普罗旺斯庄园', '湖畔内庭泳池多空间', '普罗旺斯田园风情', '薰衣草田中的浪漫'],
  'le-domaine-anse-marcel-beach': ['圣马丁碧海湾庄园', '热带风情与法式优雅', '私人海滩婚礼仪式', '法式克里奥尔融合美食'],
  'la-dme-de-giverny': ['莫奈故居旁吉维尼', '13世纪石砌谷仓', '20至120人灵活容量', '天井石板庭院户外'],
  'chteau-de-la-faye': ['13世纪野生优雅城堡', '昂古莱姆35分钟', '12公顷绿色世外桃源', '古典与现代和谐融合', '精心设计的多功能空间'],
  'chteau-de-chaumontel': ['巴黎近郊高端城堡', '尚蒂伊城堡附近', '六个不同氛围接待区', '2026年全部日期可订'],
  'dream-paris-wedding': ['2008年创立巴黎', '目的地婚礼专家', '策划与设计全流程', '打造完美无瑕婚礼'],
  'le-mas-des-cinq-fontaines': ['普罗旺斯五星庄园', '70个床位全包住宿', '3天连续私人包场', '芳香植物橄榄树喷泉公园'],
  'domaine-daveny': ['巴黎一小时城堡', '百年古树绿色港湾', '法式正式花园拍照', '18世纪高端装饰'],
  'chteau-comtesse-lafond': ['香槟区19世纪城堡', '埃佩尔奈优雅场地', '蝴蝶般梦幻仪式感', '简约高雅的氛围'],
  'chteau-de-laurentie': ['翠绿伊甸园城堡', '仪式婚礼拍照宴会全空间', '多种室内外配置', '全天婚礼旅程体验'],
  'chteau-de-serre-de-parc': ['罗纳河谷18世纪城堡', '15公顷野花环绕', '法式花园漫步', '2026年春季重新开放'],
  'chteau-de-thorens': ['阿尔卑斯山间城堡', '日内瓦与安纳西之间', '可容400人主庭院', '数百年历史见证'],
  'chteau-de-saint-martin-du-tertre': ['巴黎北30分钟城堡', '可容220人高端场地', '历史古迹建筑', '大小婚礼皆宜'],
  'chteau-de-seguin': ['波尔多170公顷葡萄园', '300平方米接待大厅', '可容300人鸡尾酒', '葡萄园中的难忘婚礼'],
  'chteau-pimo': ['19世纪瓦尔省城堡', '精致私密的花园城堡', '美食家与美学爱好者', '19世纪古典优雅'],
  'chteau-des-perrais': ['17世纪历史庄园', '500平方米灵活空间', '绿色草坪户外婚礼', 'L形大厅含舞台'],
  'samantha-bottelier-events': ['巴黎波尔多全法服务', '奢华精致婚礼策划', '国际客户定制婚礼', '优雅高品味的婚礼'],
  'couvent-notre-dame-des-prs': ['普罗旺斯12世纪修道院', '3.5公顷百年公园', '回廊礼拜厅5间卧室', '140平方米古 chapel'],
  'chteau-saint-laurent': ['普罗旺斯50公顷庄园', '30公顷有机葡萄园', '250平方米露台景观', '可容150人城堡庭院'],
  'le-petit-roulet': ['17世纪普罗旺斯庄园', '120平方米空调谷仓', '700平方米百年梧桐庭院', '田园浪漫婚礼'],
  'chteau-de-la-pascalette': ['19世纪普罗旺斯城堡', '葡萄园与地中海之间', '石砌建筑阳光景观', '宁静和平的葡萄酒庄园'],
  'domaine-santa-maria': ['巴斯克地区山顶庄园', '三侧环绕绿色景观', '大教堂式接待大厅', '室内外灵活空间'],
  'chteau-sentout': ['波尔多秘密花园城堡', '15公顷葡萄园庄园', '可容100人空调大厅', '宏伟礼拜堂私人仪式'],
  'noces-du-monde': ['波尔多婚礼策划', '优雅真诚真实', '2006年创立300+婚礼', '艺术旅行与策划热情'],
  'abbaye-de-talloires': ['安纳西湖17世纪修道院', '世界最美海湾之一', '水上露台仪式', '大雨天宏伟画廊备选'],
  'chteau-le-chreau': ['索洛涅区高端城堡', '15公里距尚博尔', '三日或两日周末婚礼', '工作日晚间冬季更优惠'],
  'chteau-de-vergieres': ['普罗旺斯25公顷庄园', '40至180人接待能力', '前马厩改造宴会厅', '古老谷仓木框石墙'],
  'lmk-events': ['定制独特婚礼', '全程策划协调', '私密婚礼专家', '无忧全程服务'],
  'chteau-de-scalibert': ['塔恩乡间优雅城堡', '大家庭般温暖接待', '林荫大道独特氛围', '用心讲述爱情故事'],
  'le-mas-de-la-rose': ['25公顷森林公园', '17世纪改建羊圈', '泳池松荫露台', '薰衣草花香流水鸟鸣'],
  'la-grange-de-javon': ['吕贝隆中心40公顷', '蒙旺图尔山脚下', '薰衣草田与森林环绕', '戈尔德20分钟'],
  'mas-de-la-massane': ['阿尔皮勒山普罗旺斯农庄', '2公顷绿色公园', ' artisanal 蜂蜜农场', '精心修复的农舍'],
  'la-trsorire': ['埃罗省20分钟距海滩', '可容250人5公顷庄园', '温室庭院游牧帐篷', '专业团队全方位服务'],
  'la-faiseuse-de-reves': ['巴黎高端蜜月策划', '个性化旅行方案', '理解每对新人的风格', '精致独特的行程设计'],
  'chteau-de-la-no-sche': ['布列塔尼浪漫城堡', '永恒的经典氛围', '法式生活艺术'],
  'phyllis-kent-events-weddings': ['巴黎专业婚礼策划', '从策划到执行全程', '让您无忧享受婚礼'],
  'white-house-cannes': ['戛纳美 belle 时代别墅', '私人安全绿色公园', '180度莱兰群岛全景', '多种空间选择'],
  'chteau-de-la-colaissire': ['安茹区尊贵城堡', '500平方米主庭院', '骑士厅独特船底结构', '历史地板与壁画'],
  'chteau-de-courcelles-le-roy': ['卢瓦尔河畔世外桃源', '远离喧嚣私密空间', '多个室内空间花园', '三座侧厅灵活配置'],
  'chteau-la-tour-vaucros': ['普罗旺斯梦幻城堡', '乡村美景婚礼场地', '两间特色接待厅', '精致优雅的装饰'],
  'domaine-le-grand-belly': ['13世纪历史庄园', '薰衣草葡萄园橄榄树', '现代舒适设施', '可容300人室内外'],
  'domaine-de-la-chartrognire': ['德龙省3公顷庄园', '法式花园朝南露台', '历史遗迹精心翻新', '宁静与优雅并存'],
  'chteau-de-la-jarthe': ['140公顷橘园城堡', '可容300人40人住宿', '600平方米阿基坦最大橘园', '永恒优雅的体验'],
  'domaine-la-plume': ['9公顷公园庄园', '意大利风格别墅', '前侯爵狩猎小屋', '家庭式温暖氛围'],
  'kiss-me-in-paris-wedding-planner': ['巴黎目的地婚礼专家', '高端定制体验', '本地资源创意无限', '全程一对一指导'],
}

// 描述中文翻译（按段落组织）
const DESC_CN = {
  'chateau-de-la-bourlie': `在佩里戈尔地区的心脏地带，发现一座迷人的山丘城堡，四周被草地和树林环绕。

建于14世纪的于尔瓦勒城堡，为您提供一个独特的婚礼场地，将历史魅力与现代舒适完美融合。

空间与容量
城堡拥有多个接待空间，包括可俯瞰泳池的宴会厅，可容纳150位宾客享用晚宴。

玫瑰小径的芬芳和柠檬树的清香，为您的婚礼增添无尽的愉悦。

城堡的宽敞与私密，为每一位来宾创造难忘的回忆。`,

  'domaine-de-beauregard': `普罗旺斯心脏地带的18世纪瑰宝。

博勒加德庄园建于18世纪，坐落在蒙特镇，位于阿维尼翁和卡尔庞特拉之间，距教皇宫仅8分钟车程。

这座充满魅力的住宅将古典韵味与普罗旺斯生活艺术完美融合。

这是一个非凡的场所，充满宁静与祥和，是举办高端优雅婚礼的理想之选。

宽敞优雅的接待空间，400平方米的宴会大厅满足一切需求。`,

  'rocabella': `罗卡贝拉住宅位于瓦尔省，提供独特的海景婚礼体验。

多个独立空间满足婚礼各环节需求，每个空间都有其独特魅力。

全方位服务确保每场活动顺利进行。`,

  'domaine-terra-rosa': `特拉罗萨庄园是举办难忘欢乐婚礼的完美之地。

庄园位于卡斯泰尔诺-德莱维，距图卢兹-阿尔比高速5分钟，距阿尔比10分钟。

庄园占地7公顷橄榄园，风景如画，景色壮观。

古老石砌建筑经过精心修复，增添了田园牧歌般的魅力。

每一个角落都经过精心装饰，每一个细节都精益求精。`,

  'chteau-hlose': `在索姆省的心脏地带，亚眠与索姆湾之间，埃洛伊兹城堡展开其迷人的魅力。

这座非凡的庄园将优雅、舒适与欢乐融为一体。

以其迷人的环境和高端服务，承诺每一段爱情故事都值得最盛大的庆典。

宏伟的仪式空间，量身定制的贴心服务。`,

  'les-domaines-de-patras': `帕特拉庄园是举办优雅精致婚礼的理想场所。

永恒的 charm 和温馨的氛围，定会让每一位宾客流连忘返。

设施与容量
坐落在80公顷的薰衣草和松露橡树公园中心。

您可以在17世纪的湖畔庭院举办鸡尾酒会，宾客可在树荫下放松。

谷仓可容纳180位宾客享用晚宴。`,

  'chteau-des-briottires': `在曼恩-卢瓦尔省的尚皮涅，布里奥蒂耶尔城堡为您的婚礼敞开大门。

这座真正的家族城堡已改建为四星级酒店，为您提供田园诗般的环境。

在50公顷公园的中心，矗立着布里奥蒂耶尔城堡主楼。

英式风格的百年老树花园中，您可以共享美好时光。`,

  'fleurs-de-prestige': `普雷斯蒂奇花艺是巴黎一家充满灵魂的工坊，让爱在花朵中绽放。

在首都的中心，公司为婚礼设计量身定制的花卉装饰。

每一件作品都被视为一幅活生生的画作：华丽的拱门、浪漫的花墙、空灵的花卉装置。

不放过任何一个细节。

充满激情的花艺团队，将全部专业知识倾注于情感的表达。`,

  'chteau-de-tresserve': `位于萨瓦省的特雷塞尔沃城堡，欢迎您来庆祝人生中最美好的一天。

在湖泊与群山之间，发现独特的接待空间。

布尔歇湖的全景，介于艾克斯莱班和尚贝里之间。

高端场所，奢华精致的装修。

两个不同楼层的接待空间。`,

  'chteau-le-fresne': `建于19世纪的弗雷讷城堡，为您的大日子敞开大门。

位于曼恩河畔，距布什曼和昂热中心仅几分钟，发现这个历史悠久的迷人场地。

在这个历史和迷人的环境中，创造美好的婚礼回忆。

弗雷讷城堡公园为您提供田园诗般的拍照环境。

在绿色花园中举办晚宴，欣赏迷人的景色。`,

  'alliance-rve': `欢迎来到由洛尔·阿内雷尔管理的梦幻联盟，您定制婚礼的终极指南。

踏上一段旅程，让您的婚礼梦想化为令人惊叹的现实。

在壮丽的风景中，您的爱情故事由洛尔精心编排。

想象普罗旺斯宁静的薰衣草田和蔚蓝海岸阳光普照的海滩。`,

  'les-jardins-darlias-by-la-villa-alexandra': `阿尔利亚花园由拉维拉亚历山德拉管理，是戛纳中心的私密场地。

在郁郁葱葱优雅的环境中，这座私人花园为亲密婚礼提供独特的氛围。

作为城市中的绿洲，将自然环境的魅力与现代优雅相结合。

非常适合仪式、日落鸡尾酒会或星空晚宴。

现场有专业 discreet 团队精心关注每一个细节。`,

  'domaine-du-grand-lauron': `大洛伦庄园的植被、湖泊和普罗旺斯农舍的优雅氛围。

空间与容量
在大洛伦庄园举办婚礼，宾客将感受到特别的氛围。

11公顷的庄园供您支配，让您的活动成为梦寐以求的体验。

湖畔、内庭或泳池区域，都是举办鸡尾酒会的绝佳选择。

您可以在庭院中享用户外晚宴，感受典型的普罗旺斯村庄氛围。`,

  'le-domaine-anse-marcel-beach': `在碧绿海水和郁郁葱葱的山丘之间，安斯马塞尔海滩为新人提供非凡的体验。

位于圣马丁一个隐秘海湾的中心，将热带风情与法式优雅完美结合。

独特之处在于其保存完好的自然环境。

庄园提供多个私人接待场所：海滩仪式、花园晚宴等。

法式料理融入克里奥尔风味，带来独特的感官体验。`,

  'la-dme-de-giverny': `吉维尼小村以印象派画家莫奈的故居而闻名。

这座迷人的住宅以温暖的氛围欢迎您的家人和挚友。

空间与容量
建于13世纪的谷仓大厅，是接待宾客的理想场所。

可容纳20至120人，氛围温馨而 authentic。

户外，天井和美丽的石板庭院是仪式的理想背景。`,

  'chteau-de-la-faye': `拉法耶城堡——野性优雅：庆祝婚礼的非凡之地。

位于昂古莱姆35分钟、科涅克40分钟处，城堡敞开13世纪的大门。

真正的绿色天堂，以其 authentic 的建筑第一时间 captivate 您。

城堡在宁静优雅的环境中，将魅力与优雅完美结合。

经过精心翻新，将古典韵味与现代舒适和谐融合。

每个空间都经过精心设计，兼顾优雅与功能性。`,

  'chteau-de-chaumontel': `重要提示：2026年所有日期均可预订。

位于著名的尚蒂伊城堡和皇家蒙修道院附近的僻静之处。

距巴黎不到一小时，距其所在的林地公园仅几分钟。

高端活动、研讨会和私人住宿庄园。

庄园坐落在迷人的高端环境中。

六个接待区域，各有不同的氛围和容量。`,

  'dream-paris-wedding': `巴黎之梦婚礼是一家专注于巴黎目的地婚礼的活动策划公司。

2008年由巴黎人 Audrey 和 Vanessa 创立。

与这支专业团队合作，享受完美无瑕的婚礼体验。

提供策划和设计服务，打造专属您的特别时刻。`,

  'le-mas-des-cinq-fontaines': `来到上普罗旺斯阿尔卑斯省的西斯特龙，一个独特的五星级庄园。

在这个非凡的普罗旺斯环境中，杜朗斯河谷的中心。

共70个床位。

周末连续3天完全私人包场。

建在芳香植物、橄榄树、柏树和石泉点缀的景观公园中。`,

  'domaine-daveny': `距巴黎一小时，在百年树荫的绿色港湾中，达夫尼城堡。

优雅的建筑和精心修剪的花园，捕捉浪漫与历史的精髓。

空间与容量
正式花园为难忘的拍照提供完美背景。

无论是盛大婚礼还是亲密庆典，城堡都能满足您的需求。

18世纪的高端装饰，每个细节都提升您的特别日子。`,

  'chteau-comtesse-lafond': `19世纪的拉丰伯爵夫人城堡，欢迎您来举办盛大的活动。

如果您梦想一场宏伟优雅的仪式，拉丰庄园就是您的选择。

心怀蝴蝶般的悸动，眼中闪烁着星光，想象自己置身建筑之中。

梦想成真！城堡以简约的方式迎接您，氛围优雅而低调。`,

  'chteau-de-laurentie': `洛朗蒂城堡将成为一片翠绿伊甸园，让您在独特的环境中庆祝结合。

让自己被其不可抗拒的魅力所征服，它一定会让您的宾客惊叹。

每个关键时刻都有专属空间！

无论是仪式、接待、拍照还是宴会和晚间舞会。

让您在整个白天为亲友创造一段旅程。`,

  'chteau-de-serre-de-parc': `场地目前正在翻新，将于2026年春季开放。

俯瞰罗纳河谷的18世纪城堡，被列为历史古迹。

空间
被柏树、修剪整齐的紫杉、橄榄树和15公顷野花环绕。

漫步于法式花园，宾客将继续一段超越时间的旅程。`,

  'chteau-de-thorens': `在阿尔卑斯山的心脏地带，日内瓦和安纳西之间，壮丽的托朗城堡敞开大门。

在这个浪漫而 authentic 的环境中，体验独特的时刻。

空间与容量
见证数百年的无数冒险，托朗城堡向您揭示其秘密。

历史瑰宝提供可容纳400位宾客的主庭院。

团队将很高兴陪伴您度过人生的美好阶段。`,

  'chteau-de-saint-martin-du-tertre': `圣马丁迪泰尔特勒城堡是一个宏伟的场地，举办最美的婚礼庆典。

位于首都以北30分钟的绝佳位置，适合大小型接待。

在亲友的陪伴下，体验独特而难忘的时刻。

专为高端婚礼设计，可容纳220位宾客。

所有空间均被列为历史古迹，确保独特体验。`,

  'chteau-de-seguin': `在塞甘城堡提供的绝佳环境中，体验非凡的婚礼接待。

位于170公顷葡萄园的中心，在波尔多享受难忘的一天。

这里是品味欢乐和独特聚会的完美场所。

300平方米接待厅可容纳300人鸡尾酒会或250人晚宴。`,

  'chteau-pimo': `在19世纪城堡的环境中说出"我愿意"——皮莫城堡难忘的婚礼。

想象在一个宏伟的环境中庆祝婚礼，每块石头都在诉说故事。

欢迎来到皮莫城堡，一座位于瓦尔省中心的尊贵住宅。

美食家、美学家、幸福追求者：在皮莫，您会发现更多。

19世纪城堡的亲密与精致，被精心维护的花园环绕。`,

  'chteau-des-perrais': `在被林荫环绕的历史庄园中，体验和分享您的婚礼庆典。

17世纪城堡侧翼的大型模块化接待厅等待着您。

如果您更喜欢周围的绿色空间，一切皆有可能。

我们提供超过500平方米的空间，可轻松调整。

L形大厅一角设有舞台，非常适合自助餐桌。`,

  'samantha-bottelier-events': `精致奢华婚礼策划机构。

向您展现巴黎与法国的魔力，轻松无忧的婚礼策划体验。

萨曼莎·博蒂利埃活动是一家总部位于巴黎、波尔多及全法的婚礼策划公司。

为法国和国际客户组织优雅精致的婚礼。

热爱想象、设计和策划，为您创造美好的一天。`,

  'couvent-notre-dame-des-prs': `圣母修道院是普罗旺斯独特的接待场所。

在3.5公顷百年公园的环绕中，发现一座12世纪的前修道院。

庄园拥有回廊及其画廊、古老礼拜堂、餐厅、5间卧室和非凡的户外空间。

多个空间提供多种可能：140平方米的古老礼拜堂。`,

  'chteau-saint-laurent': `在普罗旺斯的心脏地带，以亲密的氛围体验您温柔的结合。

团队的热情、场地的友好、环境的美丽：您将被宠坏。

空间与容量
圣洛朗城堡横跨50公顷庄园，包括5公顷公园和30公顷有机葡萄园。

城堡庭院可容纳150位宾客，配备无障碍设施。

250平方米露台可欣赏葡萄园的壮丽景色。`,

  'le-petit-roulet': `小鲁莱庄园将为您的爱情提供一个田园诗般的周末。

这个迷人的地方建于17世纪。

坐落在普罗旺斯的心脏地带，是庆祝最美好一天的完美场所。

接待在120平方米的空调谷仓内进行。

户外，700平方米的百年梧桐树庭院。`,

  'chteau-de-la-pascalette': `坐落在葡萄园与地中海之间的自然环境中，帕斯卡莱特城堡敞开大门。

位于充满特色的普罗旺斯葡萄酒庄园中，将时代魅力与现代舒适完美结合。

建于19世纪的城堡体现了普罗旺斯所有的魅力与优雅。

普罗旺斯葡萄园中真正的宁静天堂。

独特的石砌建筑、阳光普照的景观和葡萄园的壮丽景色。`,

  'domaine-santa-maria': `圣玛丽亚庄园是希望举办美好婚礼的新人的理想场所。

这个壮观的场所坐落于俯瞰巴斯克全景的位置，三面环绕绿色景观。

家族住宅将为您保留：壮丽的接待大厅将让您惊叹。

室内外空间完美适合接待。

大厅可布置数十桌宴席。`,

  'chteau-sentout': `点击网络，您便进入天堂：波尔多最保守的秘密——桑图城堡。

空间与容量
面向加龙河谷，城堡在15公顷葡萄园的 authentic 环境中迎接宾客。

可容纳100人的空调接待厅，适合晚宴或鸡尾酒会。

城堡的宏伟礼拜堂也非常适合私人婚礼或祝福仪式。

您可以选择户外接待，利用众多绿色空间。`,

  'noces-du-monde': `环球婚礼是一家总部位于波尔多、法国西南部的婚礼策划服务。

公司崇尚优雅、真诚和 authentic。

其目标是通过帮助新人实现梦想婚礼来传播幸福。

公司始于2006年，旨在创造令人惊叹的婚礼庆典。

此后已策划、设计和执行了300多场婚礼。

创始人朱莉被对艺术、旅行和策划的热爱所驱动。`,

  'abbaye-de-talloires': `坐落在原始自然环境中，世界上最美丽的海湾之一，塔卢瓦尔修道院。

您会被这座迷人的房子所 captivate，优雅与精致在此相遇。

这座17世纪的建筑及其田园花园，适合举办最多200人的活动。

"水中脚"露台非常适合举办仪式和鸡尾酒会。

如遇恶劣天气，宏伟的大画廊将供您专属使用。`,

  'chteau-le-chreau': `2025赛季几乎全部订满，谢罗城堡很高兴开放2026年的预订。

对于自助式婚礼，谢罗城堡的提供非常适合想要亲手布置的年轻夫妇。

城堡和高端环境意味着优质服务！

位于蒙特里厄索洛涅镇，距尚博尔15公里。

您可以选择三日婚礼（周五至周日晚）或两日周末。

工作日晚间或冬季婚礼可显著降低成本。`,

  'chteau-de-vergieres': `在普罗旺斯庆祝您的结合，被拉克罗草地和大自然环绕。

享受这个25公顷非凡庄园和城堡的宁静。

空间与容量
韦尔吉耶尔城堡提供两个接待厅，位于庄园的前马厩中。

可容纳40至180人。

一座前谷仓，拥有宏伟的木结构和克罗鹅卵石墙，也可接待宾客。`,

  'lmk-events': `LMK环球活动创造独特的定制婚礼，完全符合您的愿望。

组织和协调专家，在每一个阶段都为您提供支持。

他们的最终目标很简单：确保您完全安心。

私密婚礼专家，已扩展到目的地婚礼领域。

提供定制专业知识、无忧支持和专业团队。`,

  'chteau-de-scalibert': `在斯卡利贝尔城堡结婚，承诺一场充满优雅和温柔的结合。

坐落在塔恩乡间的心脏地带，城堡是那种稀有的地方——您一到就感到宾至如归。

您将像在一个大家庭中一样受到欢迎，温暖而好客。

从林荫大道走向城堡的那一刻起，独特的氛围便弥漫开来。

一座懂得用心和真诚讲述爱情故事的住宅。`,

  'le-mas-de-la-rose': `真正的宁静绿洲，玫瑰农庄位于一个与世隔绝的自然环境中。

在 picturesque 的艾加利耶尔村门口，您将欣赏这个地方的私密性。

漫步于25公顷林公园的花径。

改建的17世纪羊圈为您举办华丽而浪漫的庆典。

在泳池旁或松林橄榄树荫下的露台上享用第一杯鸡尾酒。

水声、叶响、薰衣草香，一切都在玫瑰农庄散发着幸福。`,

  'la-grange-de-javon': `位于普罗旺斯吕贝隆的中心，距戈尔德20分钟，蒙旺图尔山脚下。

长期以来，这里是雅翁城堡的附属建筑，用作农场。

如今，雅翁的全部灵魂被用来将其打造为一个非凡的场所。

空间与容量
这个40公顷的庄园，被薰衣草田和森林环绕。

雅翁谷仓团队将为您打造梦想中的婚礼。`,

  'mas-de-la-massane': `坐落在阿尔皮勒山的中心，标志性的圣雷米德普罗旺斯村。

这座精心修复的普罗旺斯农舍欢迎您来到2公顷的绿色公园。

可用空间
现场住宿。

马萨纳农庄不仅仅是一个接待场所：它是一个生产 artisanal 蜂蜜的农场。

您和您的宾客从踏入这片土地的那一刻就能感受到它的灵魂和历史。`,

  'la-trsorire': `位于埃罗省莫雷扬，拉特雷索里耶尔敞开大门庆祝您的婚礼。

距海滩20分钟，这个宏伟的地方让您体验难忘的时刻。

空间与容量
庄园可容纳250人就座，坐落在5公顷的壮丽公园中。

除了温室和庭院，团队还提供游牧帐篷。

团队将回应您的所有需求，让婚礼如您所愿。`,

  'la-faiseuse-de-reves': `造梦师是一家专注于定制蜜月的高端旅行社。

为希望体验优雅、无缝且难忘蜜月的新人提供服务。

您的蜜月远不止是一次住宿。

它是新生活的第一个大旅行，一个应该讲述您故事的珍贵时刻。

团队花时间了解您的愿望、旅行风格和预算。

基于您的梦想，创造个性化、连贯且精致的行程。`,

  'chteau-de-la-no-sche': `位于阿摩尔滨海省勒弗伊，干诺埃城堡敞开大门庆祝最美的日子。

这座城堡为独特的一天提供浪漫而永恒的氛围。

每一次接待都成为非凡的时刻，融合魅力、情感和法式生活艺术。`,

  'phyllis-kent-events-weddings': `想在法国举办活动或婚礼，但不知从何开始？

菲丽丝肯特活动与婚礼是一家总部位于巴黎的专业婚礼策划公司。

我和团队可以帮助您创造您设想的活动，让您无忧地 fully 体验。`,

  'white-house-cannes': `让想象力自由飞翔，给自己一场梦幻婚礼：戛纳白宫欢迎您。

这座 belle 时代别墅坐落在私人安全绿色公园的中心。

在这个华丽的环境中，您将享受180度莱兰群岛全景。

空间与容量
白宫为您提供多种空间选择，每一个都比上一个更令人赞叹。

作为欢乐和 convivial 时刻的场所，这座宏伟住宅将为您的活动增添特色。`,

  'chteau-de-la-colaissiere': `在拉科莱西耶尔城堡的尊贵墙壁内庆祝婚礼。

空间与容量
庆祝人生最美好一天的非凡场所。

500平方米的主庭院可举办300人的鸡尾酒会。

以美丽的地板迎接宾客。

骑士厅拥有翻转船体的宏伟结构，可欣赏花园景色。`,

  'chteau-de-courcelles-le-roy': `库尔塞勒勒鲁瓦城堡提供非凡环境中的婚礼。

非凡环境中的魔幻氛围，让您的婚礼取得绝对成功。

在这片绿色环境中，您将远离尘嚣。

庄园拥有多个室内空间、壮丽的花园和公园。

三座侧厅可灵活配置接待空间。`,

  'chteau-la-tour-vaucros': `您是否梦想一个神奇的地方来庆祝人生中最美好的一天？沃克罗塔楼城堡。

这是举办难忘魔幻目的地婚礼的理想环境。

您的宾客将欣喜若狂。

庄园位于壮丽如画的乡村环境中。

城堡敞开两间特色接待厅的大门，每间都有精致的装饰。`,

  'domaine-le-grand-belly': `大贝利庄园建于13世纪，保留了那个时代的美丽。

此后经过现代化改造，确保您的舒适。

接待区域位于薰衣草田、葡萄园和橄榄树之间。

沐浴在光和温暖中，提供庆祝婚礼的理想环境。

接待可容纳300人，室内外均可。`,

  'domaine-de-la-chartrognire': `为了分享纯粹幸福的时刻，您在寻找一个兼具宁静与优雅的地方。

在德龙省的心脏地带，靠近罗纳河谷，沙尔特罗尼耶尔庄园坐落于此。

这个迷人的地方非常适合策划梦想中的婚礼。

美丽立面背后，过去的遗迹和宝藏已被翻新。

3公顷公园设有法式花园和朝南露台。`,

  'chteau-de-la-jarthe': `坐落在140公顷之中，拉雅尔特城堡及其宏伟的橘园提供魔幻般的场景。

欢迎来到一个永恒的场地，旨在让您的婚礼成为独特、优雅和难忘的体验。

婚礼接待可容纳300位宾客，并提供最多40人的高端住宿。

接待区域：橘园——帕维永·巴尔塔（600平方米）：阿基坦最大，沐浴在光线中。

适合80至300人就座或490人站立。`,

  'domaine-la-plume': `拉普吕姆庄园为您的大日子庆典敞开大门。

这座壮丽的意大利风格别墅，前拉佩讷侯爵的狩猎小屋。

在大家庭的氛围中，与宾客共度永恒的时刻。

建立在9公顷公园和永续农业农场之上。

庄园由各种空间组成，您可以按照自己的愿望举办婚礼。`,

  'kiss-me-in-paris-wedding-planner': `巴黎之吻是一家总部位于巴黎的婚礼策划公司。

在爱之城庆祝您的特别日子，专业团队提供建议和指导。

我们专注于为挑剔的新人打造非凡的定制体验。

与巴黎之吻合作，期待无与伦比的创造力、本地知识和对细节的关注。

我们将一步步引导您——创造属于您的完美婚礼。`,
}

async function main() {
  console.log('开始翻译测试法国 57 条数据...')
  let count = 0

  for (const t of translations) {
    const featCn = FEATURES_CN[t.slug] || []
    const descCn = DESC_CN[t.slug] || ''

    // 获取当前数据以更新 venue_types 和 towns
    const [rows] = await pool.execute(
      'SELECT venue_types, towns FROM cv_test_france WHERE slug = ?', [t.slug]
    )
    if (rows.length === 0) { console.log('跳过:', t.slug); continue }

    const parse = v => typeof v === 'string' ? JSON.parse(v) : (v || [])
    const venueTypes = parse(rows[0].venue_types)
    const towns = parse(rows[0].towns)

    // 翻译 venue_types
    const vtCn = venueTypes.map(vt => ({
      ...vt,
      name_cn: VTYPE_CN[vt.name_en] || vt.name_en || vt.name || '婚礼场地'
    }))

    // 翻译 towns
    const townsCn = towns.map(tw => ({
      ...tw,
      name_cn: TOWN_CN[tw.name] || tw.name_cn || tw.name
    }))

    const featuresCn = featCn.length > 0 ? featCn : (rows[0].features ? parse(rows[0].features) : [])

    // 更新 cv_test_france
    await pool.execute(
      `UPDATE cv_test_france SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=?, location=? WHERE slug=?`,
      [t.name_cn, t.tagline_cn, descCn, JSON.stringify(featuresCn), JSON.stringify(vtCn), JSON.stringify(townsCn), t.location_cn || '', t.slug]
    )

    // 更新 cd_test_france
    await pool.execute(
      `UPDATE cd_test_france SET name_cn=?, tagline_cn=?, description_cn=?, venue_types=?, towns=? WHERE slug=?`,
      [t.name_cn, t.tagline_cn, descCn, JSON.stringify(vtCn), JSON.stringify(townsCn), t.slug]
    )

    count++
    console.log(`[${count}/57] ✓ ${t.name_cn} (${t.slug})`)
  }

  await pool.end()
  console.log(`\n翻译完成！共 ${count} 条`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
