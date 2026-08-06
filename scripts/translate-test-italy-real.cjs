/**
 * 测试意大利场地翻译脚本 - 基于原文翻译
 * 使用 Google Translate API 翻译 tagline 和 description
 * 
 * 用法: node scripts/translate-test-italy-real.cjs
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

const SUFFIX = 'test_italy'

// 场地名中文翻译映射 (保留手动翻译)
const nameTranslations = {
  'Aba Chiara': '阿巴基亚拉', 'Abbazia di San Giusto': '圣朱斯托修道院',
  'Above & Beyond Tuscan Weddings': '超越托斯卡纳婚礼', 'Agriresort Leano': '莱亚诺农业度假村',
  'Agriturismo Belagaggio': '贝拉贾乔农庄', 'Agriturismo Le Anfore': '双耳瓶农庄',
  'Agriturismo Le Mura': '城墙农庄', 'Agriturismo Poggianto': '波贾托农庄',
  'Agriturismo romantico Taverna di Bibbiano': '比比亚诺浪漫酒馆农庄',
  'Al Chiar di Luna': '月光之下', 'Alba Wedding Lighting': '阿尔巴婚礼灯光',
  'AMORITALY - Weddings in Italy': '爱在意大利婚礼', 'Antica Masseria Martuccio': '古马图乔农场',
  'Antica Meridiana': '古子午线庄园', 'AZSTUDIO - LAKE GARDA': 'AZ工作室加尔达湖',
  'B-Roof': 'B屋顶', 'Bacio Wedding': '巴乔婚礼', 'Baia dei Faraglioni': '海石柱湾',
  'Borgo Antichi Orti Assisi': '阿西西古园村', 'Borgo Bucciano': '布恰诺村',
  'Borgo Castelvecchi': '卡斯泰尔韦基村', 'Borgo del Carato': '卡拉托村',
  'Borgo di Castelvecchio': '卡斯泰尔韦基奥村', 'Borgo di Pietrafitta Relais': '皮耶特拉菲塔中继村',
  'Borgo San Rocco Resort': '圣罗科度假村', 'Br Wedding': 'BR婚礼',
  'Byblos Art Hotel': '比布洛斯艺术酒店', 'Capo Santa Croce': '圣十字角',
  'Carradori Ricevimenti': '卡拉多里宴会', 'Casale 500': '五百农舍',
  'Casino Lenza': '伦扎别墅', 'CastelBrando': '布兰登城堡',
  'Castello Bevilacqua': '贝维拉夸城堡', 'Castello Brancaccio': '布兰卡乔城堡',
  'Castello del Trebbio': '特雷比奥城堡', 'Castello Della Castelluccia': '卡斯泰卢恰城堡',
  'Castello di Meleto': '梅莱托城堡', 'Castello di Montaldo': '蒙塔尔多城堡',
  'Castello di Petrata': '佩特拉塔城堡', 'Castello di Rosciano': '罗夏诺城堡',
  'Castello di Sorgnano': '索尔尼亚诺城堡', 'Castello di Spessa': '斯佩萨城堡',
  'Castello Leonina': '莱奥尼纳城堡', 'Castello Visconteo': '维斯孔蒂城堡',
  'Castrum Wine Relais': '卡斯特鲁姆葡萄酒中继酒店', 'Convento San Giuseppe': '圣约瑟夫修道院',
  'Country House Felicia': '费利恰乡村别墅', 'Cristalli di Sale': '盐晶',
  'Distinctive Italy Weddings': '独特意大利婚礼', 'Dolce Promessa': '甜蜜承诺',
  'Du Lac et Du Parc Grand Resort': '湖与公园大酒店', 'Exclusive Italy Weddings': '尊享意大利婚礼',
  'Fantastic Garden': '梦幻花园', 'Fattoria degli Usignoli': '夜莺农场',
  'Fattoria di Corsignano': '科尔西尼亚诺农场', 'Fonte Sala': '喷泉大厅',
  'Forever Tuscany': '永恒托斯卡纳', 'Furore Grand Hotel': '弗罗雷大酒店',
  'Fuego di Gianni Cardì': '贾尼卡尔迪之火', 'Grand Hotel Europa Palace': '欧洲宫殿大酒店',
  'Grand Palladium Sicilia Resort & Spa': '西西里大帕拉迪奥度假村', 'GranDuomo': '大教堂',
  'Guadalupe Tuscany Resort': '瓜达卢佩托斯卡纳度假村', 'Hamalia': '哈马利亚',
  'Hotel Club 2 Torri - Costiera Amalfitana': '双塔酒店阿马尔菲海岸',
  'Hotel Villa Condulmer': '孔杜尔默别墅酒店', 'Il Castello di San Ruffino': '圣鲁菲诺城堡',
  'Il Fontanile': '喷泉', 'Il Sorriso Ricevimenti': '微笑宴会', 'Il Trappetello': '小油坊',
  'Italea': '意大利花园', 'Italian Style': '意大利风格', 'Just Amore': '就是爱',
  'Kolbe Hotel Rome': '罗马科尔贝酒店', 'La Casa degli Spiriti': '精灵之家',
  'La Dolce Wedding Italy': '甜蜜意大利婚礼', 'La Locanda del Pontefice': '教皇客栈',
  'La Medusa Hotel & Boutique Spa': '美杜莎精品水疗酒店', 'La Navona': '纳沃纳',
  'Le 7 Fonti': '七泉', 'Le Ali del Frassino': '白蜡树之翼',
  'Le Cirque Firenze': '佛罗伦萨马戏团', 'Le Reve': '梦境',
  'Lily Happens': '百合绽放', 'Magic Fire': '魔法火焰', 'MamaMare': '妈妈海',
  'Mani di Forbice': '剪刀之手', 'Masseria Campitelli': '坎皮泰利农场',
  'Masseria Li Reni': '莱雷尼农场', 'Masseria Spina Resort': '斯皮纳度假村',
  'Momenti, a wedding story': '时刻，一个婚礼故事', 'Monastero Santa Margherita': '圣玛格丽塔修道院',
  'Nèroli Bio Relais': '尼罗利有机中继酒店', 'Obicà': '奥比卡',
  'Other Lights': '其他灯光', 'Our Italian Fairytale': '我们的意大利童话',
  'Palazzo Brancaccio': '布兰卡乔宫', 'Park Hotel Villa Grazioli': '格拉齐奥利别墅公园酒店',
  'Pieve del Castello': '城堡教区', 'Progetto White Wedding': '白色婚礼计划',
  'QDC Wedding': 'QDC婚礼', 'Ravello art Hotel Marmorata': '拉韦洛马尔莫拉塔艺术酒店',
  'Relais Casanova': '卡萨诺瓦中继酒店', 'Relais La Corte Dei Papi': '教皇庭院中继酒店',
  'Relais La Tenuta Del Gallo': '公鸡庄园中继酒店', 'Resort 37': '37号度假村',
  'Ricca Wedding Stories': '里卡婚礼故事', 'Ristorante Portobello': '波特贝洛餐厅',
  'RM Glamour Ricevimenti': 'RM魅力宴会', 'Romance in Italy': '浪漫意大利',
  'Romeo and Juliet - Elegant weddings in Italy': '罗密欧与朱丽叶优雅婚礼',
  'Salva le Api': '拯救蜜蜂', 'San Pietro Sopra Le Acque Resort & Spa': '水上圣彼得度假村',
  'Sassa al Sole': '阳光之石', 'Scatti Spontanei': '自然瞬间',
  'Swing me to the moon': '摇我到月球', 'Tenuta Cherici Mascagni': '凯里奇马斯卡尼庄园',
  'Tenuta dei Mori': '摩尔人庄园', 'Tenuta Della Selva': '森林庄园',
  'Tenuta delle Ripalte': '里帕尔特庄园', 'Tenuta La Borriana': '拉博里亚纳庄园',
  'Tenuta La Madonnina di Barni': '巴尔尼小圣母庄园', 'Tenuta La Valle': '山谷庄园',
  'Tenuta Riseicoli': '里塞科利庄园', 'Tenuta San Lorenzo Vecchio': '老圣洛伦佐庄园',
  'Tenute Baglio Passofondo': '巴利奥帕索丰多庄园', 'That\'s Amore': '那就是爱',
  'That\'s Amore Weddings Italy': '那就是爱意大利婚礼', 'The Foreigners Club': '外国人俱乐部',
  'The Sense': '感觉', 'The Wedding Issue': '婚礼议题',
  'Torre d\'Ansovigi La Molinella': '安索维吉塔莫利内拉', 'Tour de Force': '杰作',
  'Trappetello': '小油坊', 'Uliveto Casa Della Rocca': '橄榄林岩石之家',
  'Valle di Assisi': '阿西西山谷', 'Veil in the Wind - Wedding Films': '风中面纱婚礼电影',
  'Villa Alta': '高别墅', 'Villa Apparita': '阿帕里塔别墅', 'Villa Arvedi': '阿尔韦迪别墅',
  'Villa Bellaria': '贝拉利亚别墅', 'Villa Bossi': '博西别墅', 'Villa Brunelli': '布鲁内利别墅',
  'Villa Calcinaia': '卡尔奇纳亚别墅', 'Villa Cariola': '卡廖拉别墅',
  'Villa Castelletti': '卡斯泰莱蒂别墅', 'Villa Castello Durini': '杜里尼城堡别墅',
  'Villa Dafne Majestic': '达芙妮宏伟别墅', 'Villa Demetra Resort': '德墨特拉度假村',
  'Villa di Maiano': '马亚诺别墅', 'Villa Diamante': '钻石别墅',
  'Villa Dianella': '迪亚内拉别墅', 'Villa Grande al Belvedere': '观景台大别墅',
  'Villa La Palagina': '帕拉吉纳别墅', 'Villa la Personala': '佩尔索纳拉别墅',
  'Villa Le Vigne': '葡萄园别墅', 'Villa Merlo Nero': '黑画眉别墅',
  'Villa O\'Hara': '奥哈拉别墅', 'Villa Orsini': '奥尔西尼别墅',
  'Villa Paolina': '保琳娜别墅', 'Villa Piccolomini': '皮科洛米尼别墅',
  'Villa Poggio di Gaville': '加维莱山别墅', 'Villa Porta': '门别墅',
  'Villa Quaranta Tommasi Wine Resort & Thermal SPA': '夸兰塔托马西温泉酒庄',
  'Villa Rocca 1914': '罗卡1914别墅', 'Villa Savino': '萨维诺别墅',
  'Villa Scorzi': '斯科尔齐别墅', 'Villa Tolomei Hotel & Resort': '托洛梅伊酒店度假村',
  'Villa Valente': '瓦伦特别墅', 'Villa Valentini Bonaparte': '瓦伦蒂尼波拿巴别墅',
  'Villa Ventura': '文图拉别墅', 'Villa Zaffiro': '蓝宝石别墅',
  'Wed in Rome': '罗马婚礼', 'Wedding in Tuscany': '托斯卡纳婚礼',
  'Weddings Italy by Regency': '摄政意大利婚礼', 'Weweddings': '我们婚礼',
  'Wine Resort Colsereno': '科尔塞雷诺酒庄', 'Your Destination Wedding in Italy': '你的意大利目的地婚礼',
}

// 场地类型中文映射
const typeCnMap = {
  'Wedding Venue': '婚礼场地', 'Hotel': '酒店', 'Villa': '别墅',
  'Castle': '城堡', 'Restaurant': '餐厅', 'Golf Course': '高尔夫球场',
  'Garden': '花园', 'Mansion': '庄园', 'Manor House': '庄园',
  'Banquet Hall': '宴会厅', 'Barn': '谷仓', 'Historic Building': '历史建筑',
  'Country House': '乡村庄园', 'Religious': '宗教场所', 'Vineyard': '酒庄',
  'Farm': '农场', 'Resort': '度假村', 'Estate': '庄园', 'Palace': '宫殿',
}

// 意大利城镇中文翻译
const townTranslations = {
  'Rome': '罗马', 'Milan': '米兰', 'Florence': '佛罗伦萨', 'Venice': '威尼斯',
  'Naples': '那不勒斯', 'Turin': '都灵', 'Bologna': '博洛尼亚',
  'Palermo': '巴勒莫', 'Catania': '卡塔尼亚', 'Syracuse': '锡拉库萨',
  'Taormina': '陶尔米纳', 'Cefalù': '切法卢', 'Agrigento': '阿格里真托',
  'Tuscany': '托斯卡纳', 'Sicily': '西西里', 'Sardinia': '撒丁岛',
  'Amalfi Coast': '阿马尔菲海岸', 'Lake Como': '科莫湖', 'Lake Garda': '加尔达湖',
  'Sorrento': '索伦托', 'Positano': '波西塔诺', 'Ravello': '拉韦洛',
  'Lucca': '卢卡', 'Pisa': '比萨', 'Siena': '锡耶纳',
  'San Gimignano': '圣吉米尼亚诺', 'Volterra': '沃尔泰拉', 'Arezzo': '阿雷佐',
  'Cortona': '科尔托纳', 'Montepulciano': '蒙特普尔恰诺', 'Assisi': '阿西西',
  'Perugia': '佩鲁贾', 'Orvieto': '奥尔维耶托', 'Verona': '维罗纳',
  'Padua': '帕多瓦', 'Vicenza': '维琴察', 'Brescia': '布雷西亚',
  'Bergamo': '贝加莫', 'Como': '科莫', 'Mantua': '曼图亚',
  'Parma': '帕尔马', 'Modena': '摩德纳', 'Ravenna': '拉文纳',
  'Rimini': '里米尼', 'Ferrara': '费拉拉', 'Pistoia': '皮斯托亚',
  'Prato': '普拉托', 'Livorno': '里窝那', 'Grosseto': '格罗塞托',
  'Lecce': '莱切', 'Brindisi': '布林迪西', 'Taranto': '塔兰托',
  'Bari': '巴里', 'Foggia': '福贾', 'Monopoli': '莫诺波利',
  'Ostuni': '奥斯图尼', 'Alberobello': '阿尔贝罗贝洛',
  'Polignano a Mare': '滨海波利尼亚诺', 'Martina Franca': '马尔蒂纳弗兰卡',
  'Salerno': '萨莱诺', 'Caserta': '卡塞塔', 'Matera': '马泰拉',
  'Cosenza': '科森扎', 'Reggio Calabria': '雷焦卡拉布里亚',
  'Catanzaro': '卡坦扎罗', 'Potenza': '波坦扎',
}

async function translateText(text, retries = 5) {
  if (!text || !text.trim()) return ''
  // 使用 MyMemory 免费翻译 API（每天5000词限额）
  try {
    const encoded = encodeURIComponent(text.slice(0, 500))
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|zh-CN`
    const res = await fetch(url)
    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }
    throw new Error(data.responseDetails || 'Translation failed')
  } catch (e) {
    if (retries > 0) {
      const wait = (6 - retries) * 3000 + 2000
      await new Promise(r => setTimeout(r, wait))
      return translateText(text, retries - 1)
    }
    console.log('  ⚠ 翻译失败:', e.message, '- 使用原文')
    return text
  }
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  const cvTable = `cv_${SUFFIX}`
  const cdTable = `cd_${SUFFIX}`

  // 读取所有场地（包含原始英文内容）
  const [venues] = await pool.execute(`SELECT slug, name, tagline, description, venue_types, towns FROM \`${cvTable}\``)
  console.log(`共 ${venues.length} 个场地需要翻译`)

  let count = 0
  for (const v of venues) {
    count++
    const nameCn = nameTranslations[v.name] || v.name
    const venueTypes = Array.isArray(v.venue_types) ? v.venue_types : JSON.parse(v.venue_types || '[]')
    const towns = Array.isArray(v.towns) ? v.towns : JSON.parse(v.towns || '[]')

    // 翻译场地类型
    const translatedTypes = venueTypes.map(t => ({
      name: t.name, name_cn: t.name_cn || typeCnMap[t.name] || t.name
    }))

    // 翻译城镇
    const translatedTowns = towns.map(t => ({
      name: t.name,
      name_cn: townTranslations[t.name] || t.name_cn || t.name
    }))

    // 基于原文翻译 tagline
    let taglineCn = ''
    if (v.tagline) {
      taglineCn = await translateText(v.tagline)
      if (taglineCn.length > 200) taglineCn = taglineCn.slice(0, 197) + '...'
    } else {
      taglineCn = `${nameCn} - 意大利婚礼场地`
    }

    // 基于原文翻译 description
    let descCn = ''
    if (v.description) {
      descCn = await translateText(v.description)
    } else {
      const townName = translatedTowns[0]?.name_cn || '意大利'
      const typeName = translatedTypes[0]?.name_cn || '婚礼场地'
      descCn = `${nameCn}是位于${townName}的${typeName}。`
    }

    // 翻译 features（基于原文）
    const origFeatures = Array.isArray(v.features) ? v.features : JSON.parse(v.features || '[]')
    let translatedFeatures = []
    if (origFeatures.length > 0 && typeof origFeatures[0] === 'string') {
      // 逐个翻译 feature
      for (const f of origFeatures) {
        const tf = await translateText(f)
        translatedFeatures.push(tf)
      }
    } else {
      translatedFeatures = [`${nameCn} - 意大利精选婚礼场地`]
    }

    if (count % 10 === 0) console.log(`--- 进度: ${count}/${venues.length} ---`)
    console.log(`[${count}] ${v.name} → ${nameCn}`)
    console.log(`    tagline: ${(v.tagline || '').slice(0, 50)}...`)
    console.log(`    tagline_cn: ${taglineCn.slice(0, 50)}...`)

    // 更新 cv_ 表
    await pool.execute(
      `UPDATE \`${cvTable}\` SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=? WHERE slug=?`,
      [nameCn, taglineCn, descCn, JSON.stringify(translatedFeatures), JSON.stringify(translatedTypes), JSON.stringify(translatedTowns), v.slug]
    )

    // 更新 cd_ 表
    await pool.execute(
      `UPDATE \`${cdTable}\` SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=? WHERE slug=?`,
      [nameCn, taglineCn, descCn, JSON.stringify(translatedFeatures), JSON.stringify(translatedTypes), JSON.stringify(translatedTowns), v.slug]
    )

    // 更新 products
    const prodSlug = v.slug.slice(0, 50).replace(/-$/, '')
    await pool.execute(
      `UPDATE products SET name=?, description=? WHERE product_id=?`,
      [nameCn, descCn.slice(0, 200), prodSlug]
    )

    // 防止 API 限流 - 每次请求间隔3秒
    await new Promise(r => setTimeout(r, 3000))
  }

  await pool.end()
  console.log('\n✅ 所有翻译完成！共翻译', count, '条')
}

main().catch(e => { console.error(e.message); process.exit(1) })
