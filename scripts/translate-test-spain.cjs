/**
 * 测试西班牙场地翻译脚本
 * 读取 cv_test_spain 英文数据，生成中文翻译并更新
 * 
 * 用法: node scripts/translate-test-spain.cjs
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

const SUFFIX = 'test_spain'

// 场地名中文翻译映射
const nameTranslations = {
  'Mas Pomer': '马斯波默庄园',
  'La Cartuja de Cazalla': '卡萨拉修道院',
  'Finca la Concepción': '拉孔塞普西翁庄园',
  'Castell de Peralada': '佩拉拉达城堡',
  'Bodegas Ángel': '天使酒庄',
  'Hotel Roger de Flor by Seleqtta': '罗杰德弗洛尔精选酒店',
  'Los Pilares de Ronda': '龙达之柱',
  'Finca Mas Solers': '马索勒斯庄园',
  'Castillo de Viñuelas - Life Gourmet Catering': '比纽埃拉斯城堡',
  'Hotel Ametlla Mar - BodasRV': '拉梅特利亚海滨酒店',
  'Sabàtic Gavà Mar - Tribute Portfolio': '萨巴蒂克加瓦海滨酒店',
  'Hotel Spa Gametxo': '加梅乔水疗酒店',
  'Hotel Rural Sa Bassa Rotja': '萨巴萨罗哈乡村酒店',
  'Atzavara Hotel & Spa': '阿察瓦拉水疗酒店',
  'Torre Sever': '塞韦尔塔',
  'Finca Los Jazmines by Cándido': '素馨花庄园',
  'Palau Les Arts - Espai Los Toros Gourmet Catering & Eventos': '艺术宫活动空间',
  'Restaurante Suculenta': '苏库伦塔餐厅',
  'Casa Anamaria Hotel & Villas': '安娜玛丽亚别墅酒店',
  'Casa Benigalip': '贝尼加利普庄园',
  'Cal Reiet Holistic Retreat': '卡雷耶特 holistic 度假村',
  'Treurer': '特雷乌雷尔庄园',
  'Hotel Alfonso XIII': '阿方索十三世酒店',
  'Hotel Molí El Canyisset': '莫利埃尔卡尼塞特酒店',
  'La Finka 4.1': '拉芬卡4.1',
  'Secrets Bahia Real Resort & Spa': '秘密皇家海湾度假村',
  'Cala Gran - El Trull': '卡拉格兰酒庄',
  'Dénia Marriott La Sella Golf Resort & Spa': '德尼亚万豪高尔夫度假村',
  'Santa Romana': '圣罗马纳',
  'Cigarral de las Mercedes': '西加拉尔德拉斯梅赛德斯',
  'Los Lavaderos de Rojas': '罗哈斯洗衣坊',
  'Monestir de Sant Salvi': '圣萨尔维修道院',
  'Las Arenas Balneario Resort': '拉斯阿雷纳斯温泉度假村',
  'Zoëtry Mallorca': '马略卡佐特里度假村',
  'Hotel Marqués de Riscal': '马里凯斯德里斯卡尔酒店',
  'Masos Valle de Guadalest': '瓜达莱斯特山谷庄园',
  'Cygnus Events': '天鹅座活动场地',
  'Hotel Santa Marta': '圣玛尔塔酒店',
  'Hotel Casa Fuster': '卡萨福斯特酒店',
  'Vincci Selección La Plantación del Sur 5*L': '温奇南方种植园五星酒店',
  'De Mar, a Gran Meliá Hotel': '德马尔格兰美利亚酒店',
  'Racó del Pastor': '牧羊人之角',
  'The Imperial Weddings': '帝国婚礼',
  'Masía Casa del Mar': '海边庄园',
  'Soho Boutique Castillo Santa Catalina': '苏荷精品圣卡塔利娜城堡',
  'Mallaui': '马劳伊',
  'La Masia Alt Penedès': '阿尔佩内德斯庄园',
  'Pula Golf Resort': '普拉高尔夫度假村',
  'Soul Beach Hotel': '灵魂海滩酒店',
  'Espacio Contemple by Vivood': '维伍德冥想空间',
  'Green Jar Ibiza': '伊比萨绿罐',
  'Hard Rock Hotel Tenerife': '特内里费硬石酒店',
  'The Westin La Quinta Golf Resort & Spa': '威斯汀拉金塔高尔夫度假村',
  'Viva la pepa Menorca': '梅诺卡维瓦拉佩帕',
  'Hotel Sevilla Center': '塞维利亚中心酒店',
  'Ses Cases de Sa Font Seca': '萨丰塞卡之家',
  'Hotel María Cristina': '玛丽亚克里斯蒂娜酒店',
  'Cigarral El Bosque': '西加拉尔德尔博斯克',
}

// 城镇中文翻译
const townTranslations = {
  'Camprodon': '坎普罗东', 'Cazalla De La Sierra': '卡萨拉德拉谢拉',
  'Marbella': '马尔韦利亚', 'Peralada': '佩拉拉达',
  'Santa Maria Del Cami (Isla De Mallorca)': '圣玛丽亚德尔卡米，马略卡岛',
  'Lloret De Mar': '略雷特德马尔', 'Ronda': '龙达',
  'Sant Pere De Ribes': '圣佩雷德里韦斯', 'Tres Cantos': '三坎托斯',
  "L' Ametlla De Mar": '拉梅特利亚德马尔', 'Gava': '加瓦',
  'Getxo': '格乔', 'Santanyí': '桑塔尼',
  'Oropesa Del Mar': '奥罗佩萨德尔马尔', 'Kropia': '克罗皮亚',
  'Ronda, Málaga': '龙达，马拉加', 'Toledo': '托莱多',
  'Seville': '塞维利亚', 'Barcelona': '巴塞罗那',
  'Madrid': '马德里', 'Valencia': '瓦伦西亚',
  'Málaga': '马拉加', 'Granada': '格拉纳达',
  'Ibiza': '伊比萨', 'Tenerife': '特内里费',
  'Menorca': '梅诺卡', 'Mallorca': '马略卡',
  'San Sebastian': '圣塞巴斯蒂安', 'Bilbao': '毕尔巴鄂',
  'Cadiz': '加的斯', 'Córdoba': '科尔多瓦',
  'Salamanca': '萨拉曼卡', 'Zaragoza': '萨拉戈萨',
  'Santiago De Compostela': '圣地亚哥-德孔波斯特拉',
  'Tarragona': '塔拉戈纳', 'Girona': '赫罗纳',
  'Lleida': '莱里达', 'Valladolid': '巴利亚多利德',
  'Alicante': '阿利坎特', 'Murcia': '穆尔西亚',
  'Vitoria-Gasteiz': '维多利亚', 'Pamplona': '潘普洛纳',
  'Logroño': '洛格罗尼奥', 'Huesca': '韦斯卡',
  'Teruel': '特鲁埃尔', 'Soria': '索里亚',
  'Segovia': '塞戈维亚', 'Ávila': '阿维拉',
  'Cuenca': '昆卡', 'Guadalajara': '瓜达拉哈拉',
  'Albacete': '阿尔瓦塞特', 'Ciudad Real': '雷阿尔城',
  'Badajoz': '巴达霍斯', 'Cáceres': '卡塞雷斯',
  'León': '莱昂', 'Zamora': '萨莫拉',
  'Palencia': '帕伦西亚', 'Burgos': '布尔戈斯',
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

  // 读取所有场地
  const [venues] = await pool.execute(`SELECT slug, name, description, venue_types, towns FROM \`${cvTable}\``)
  console.log(`共 ${venues.length} 个场地需要翻译`)

  for (const v of venues) {
    const nameCn = nameTranslations[v.name] || v.name
    const venueTypes = Array.isArray(v.venue_types) ? v.venue_types : JSON.parse(v.venue_types || '[]')
    const towns = Array.isArray(v.towns) ? v.towns : JSON.parse(v.towns || '[]')

    // 翻译场地类型
    const typeCnMap = {
      'Wedding Venue': '婚礼场地', 'Hotel': '酒店', 'Villa': '别墅',
      'Finca': '庄园', 'Castle': '城堡', 'Restaurant': '餐厅',
      'Golf Course': '高尔夫球场', 'Garden': '花园', 'Mansion': '庄园',
      'Manor House': '庄园', 'Banquet Hall': '宴会厅', 'Barn': '谷仓',
      'Historic Building': '历史建筑', 'Country House': '乡村庄园',
    }
    const translatedTypes = venueTypes.map(t => ({
      name: t.name, name_cn: t.name_cn || typeCnMap[t.name] || t.name
    }))

    // 翻译城镇
    const translatedTowns = towns.map(t => ({
      name: t.name,
      name_cn: townTranslations[t.name] || t.name_cn || t.name
    }))

    // 生成简短描述作为 tagline
    const desc = v.description || ''
    let taglineCn = ''
    if (desc) {
      // 取第一句话
      const firstSentence = desc.split('.')[0].trim()
      taglineCn = `${nameCn} - 西班牙精选婚礼场地`
      if (taglineCn.length > 50) taglineCn = taglineCn.slice(0, 47) + '...'
    } else {
      taglineCn = `${nameCn} - 西班牙婚礼场地`
    }

    // 生成中文描述（简化版：基于场地类型和位置）
    const townName = translatedTowns[0]?.name_cn || '西班牙'
    const typeName = translatedTypes[0]?.name_cn || '婚礼场地'
    const descCn = `${nameCn}是位于${townName}的${typeName}，为您提供专业的婚礼服务和独特的场地体验。在这里，您可以享受西班牙独特的文化氛围和迷人的风景，打造一场难忘的目的地婚礼。`

    // 生成特色
    const features = [
      `${townName}精选${typeName}`,
      '专业婚礼策划团队',
      '西班牙目的地婚礼',
      '独特文化氛围体验',
    ]

    console.log(`翻译: ${nameCn} (${v.slug})`)

    // 更新 cv_ 表
    await pool.execute(
      `UPDATE \`${cvTable}\` SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=? WHERE slug=?`,
      [nameCn, taglineCn, descCn, JSON.stringify(features), JSON.stringify(translatedTypes), JSON.stringify(translatedTowns), v.slug]
    )

    // 更新 cd_ 表
    await pool.execute(
      `UPDATE \`${cdTable}\` SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=? WHERE slug=?`,
      [nameCn, taglineCn, descCn, JSON.stringify(features), JSON.stringify(translatedTypes), JSON.stringify(translatedTowns), v.slug]
    )

    // 更新 products
    const prodSlug = v.slug.slice(0, 50).replace(/-$/, '')
    await pool.execute(
      `UPDATE products SET name=?, description=? WHERE product_id=?`,
      [nameCn, `测试西班牙婚礼场地 - ${nameCn}`, prodSlug]
    )
  }

  await pool.end()
  console.log('\n✅ 所有翻译完成！')
}

main().catch(e => { console.error(e.message); process.exit(1) })
