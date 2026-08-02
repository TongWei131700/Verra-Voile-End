/**
 * 修复 venue_types 和 features - v2
 * 1. venue_types: 只保留真正的场地类型，去除所有UI噪音
 * 2. features: 更好地翻译英文/法文内容
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

// 有效的 WeddingWire 场地类型 → 中文翻译
const VALID_VENUE_TYPES = {
  // 英文
  'Barns & Farms': '农场与谷仓', 'Country Club': '乡村俱乐部',
  'Estate/Land': '庄园/土地', 'Gardens': '花园', 'Garden': '花园',
  'Hotels': '酒店', 'Hotel': '酒店', 'Mansions': '庄园',
  'Museums': '博物馆', 'Museum': '博物馆', 'Parks': '公园', 'Park': '公园',
  'Restaurants': '餐厅', 'Restaurant': '餐厅', 'Vineyards': '葡萄园', 'Vineyard': '葡萄园',
  'Winery': '酒庄', 'Wineries & Breweries': '酒庄与酿酒厂',
  'Beaches': '海滩', 'Beach': '海滩', 'Waterfronts': '海滨',
  'Rooftops & Lofts': '屋顶与阁楼', 'Boats': '游船',
  'Historic Venues': '历史场地', 'Religious Venues': '宗教场地',
  'Ban Halls': '宴会厅', 'Breweries': '酿酒厂',
  'Farms': '农场', 'Barn': '谷仓', 'Church': '教堂', 'Churches': '教堂',
  'Chapel': '小教堂', 'Castles': '城堡', 'Castle': '城堡',
  'Lodges': '小屋', 'Tent': '帐篷', 'Yacht': '游艇',
  'Nightclub': '夜店', 'Aquarium': '水族馆', 'Zoo': '动物园',
  'Clubhouse': '会所', 'Convention Center': '会议中心',
  'Performing Arts Center': '表演艺术中心',
  // 法语
  'Domaines et terres': '庄园与土地', 'Châteaux': '城堡',
  'Mas et bastides': '农庄与别墅', 'Salles de réception': '宴会厅',
  'Jardins': '花园', 'Plages': '海滩', 'Hôtels': '酒店',
  'Restaurants': '餐厅', 'Vignobles': '葡萄园',
  // 意大利语
  'Masseria': '农庄', 'Villa': '别墅', 'Ville': '别墅',
  'Castello': '城堡', 'Castelli': '城堡', 'Tenuta': '庄园',
  'Ristorante': '餐厅', 'Ristoranti': '餐厅',
  'Agriturismo': '农庄旅游', 'Dimora storica': '历史宅邸',
  'Giardino': '花园', 'Giardini': '花园',
  'Hotel': '酒店', 'Resort': '度假村',
  'Casale': '农舍', 'Borgo': '村庄', 'Baglio': '西西里庄园',
  'Trullo': '圆顶石屋', 'Masserie': '农庄',
  // 西班牙语
  'Hacienda': '庄园', 'Finca': '庄园', 'Fincas': '庄园',
  'Palacio': '宫殿', 'Palacios': '宫殿', 'Cortijo': '农庄',
  'Masía': '农庄', 'Parador': '国宾馆', 'Hotel Rural': '乡村酒店',
  'Playa': '海滩', 'Jardín': '花园',
  // 希腊语
  'Villa': '别墅', 'Resort': '度假村',
}

// 需要排除的UI噪音（大小写不敏感匹配）
const EXCLUDE_PATTERNS = [
  /^planning/i, /^organize/i, /^view all/i, /^checklist/i, /^guests?$/i,
  /^seating/i, /^budget/i, /^vendor/i, /^website/i, /^personalize/i,
  /^engine$/i, /^date finder/i, /^cost guide/i, /^color gen/i,
  /^hashtag/i, /^venues?$/i, /^find your/i, /^all featured/i,
  /^contact$/i, /^message$/i, /^about$/i, /^review/i, /^award/i,
  /^promotion/i, /^blog$/i, /^faq$/i, /^portfolio/i, /^team$/i,
  /^service/i, /^pricing/i, /^availab/i, /^package/i, /^browse/i,
  /^wedding vendor/i, /^create your/i, /^get started/i, /^learn more/i,
  /^inspiration/i, /^ideas?$/i, /^real wedding/i, /^featured/i,
  /^show all/i, /^see all/i, /^more/i, /^less/i, /^filter/i,
  /^sort/i, /^map/i, /^list/i, /^grid/i, /^photo/i, /^video/i,
]

function isValidVenueType(name) {
  if (!name || name.trim().length < 2 || name.trim().length > 40) return false
  for (const p of EXCLUDE_PATTERNS) {
    if (p.test(name)) return false
  }
  return true
}

function translateVenueType(name) {
  if (VALID_VENUE_TYPES[name]) return VALID_VENUE_TYPES[name]
  // 尝试小写匹配
  const lower = name.toLowerCase()
  for (const [en, zh] of Object.entries(VALID_VENUE_TYPES)) {
    if (en.toLowerCase() === lower) return zh
  }
  // 如果名称本身看起来像有效类型（2-20字符，不含特殊符号），保留原名
  if (name.length <= 20 && /^[A-Za-zÀ-ÿÀ-\u0400-\u04FF\s&'-]+$/.test(name)) {
    return name // 保留原名（如人名、品牌名等）
  }
  return null
}

function cleanVenueTypes(vtArr) {
  const seen = new Set()
  const result = []
  
  for (const vt of vtArr) {
    const name = (vt.name || vt.name_en || '').trim()
    if (!isValidVenueType(name)) continue
    const cn = translateVenueType(name)
    if (!cn) continue
    if (seen.has(cn)) continue
    seen.add(cn)
    result.push({ name: cn, name_en: name, name_cn: cn })
  }
  
  // 限制最多6个
  const final = result.slice(0, 6)
  if (final.length === 0) {
    final.push({ name: '婚礼场地', name_en: 'Wedding Venue', name_cn: '婚礼场地' })
  }
  return final
}

// 翻译 features
function translateFeature(text) {
  if (!text || text.trim().length === 0) return ''
  
  // 清理 cookie/隐私文本
  const cookiePatterns = [
    /at the knot worldwide[\s\S]*/gi,
    /by clicking "send"[\s\S]*/gi,
    /you have the right to opt-out[\s\S]*/gi,
    /if you have enabled privacy[\s\S]*/gi,
    /we use cookies[\s\S]*/gi,
    /privacy policy[\s\S]*/gi,
    /terms of (use|service)[\s\S]*/gi,
  ]
  let clean = text
  for (const p of cookiePatterns) clean = clean.replace(p, '')
  clean = clean.trim()
  if (clean.length < 10) return ''
  
  // 如果已经是中文为主
  const cnChars = (clean.match(/[\u4e00-\u9fff]/g) || []).length
  if (cnChars > clean.length * 0.3) return clean

  // 英法混合翻译 - 按短语长度降序替换
  const dict = {
    // 英语长句
    'is located in': '位于', 'is situated in': '坐落于', 'is set in': '坐落于',
    'can accommodate': '可容纳', 'can host up to': '最多可接待',
    'up to': '最多', 'guests': '位宾客', 'people': '人',
    'your special day': '您的特殊日子', 'your big day': '您的大日子',
    'dream wedding': '梦想婚礼', 'perfect setting': '完美场景',
    'surrounded by': '环绕着', 'in the heart of': '坐落于',
    'with views of': '可眺望', 'close to': '靠近',
    'minutes from': '分钟车程', 'minutes drive': '分钟车程',
    'wedding ceremony': '婚礼仪式', 'wedding reception': '婚宴',
    'cocktail party': '鸡尾酒会', 'outdoor ceremony': '户外仪式',
    'indoor reception': '室内宴会', 'garden party': '花园派对',
    'swimming pool': '游泳池', 'hot tub': '热水浴缸',
    'wedding planner': '婚礼策划师', 'wedding coordinator': '婚礼协调员',
    'full service': '全方位服务', 'all inclusive': '全包',
    'open bar': '开放酒吧', 'live music': '现场音乐',
    'fireworks': '烟火', 'valet parking': '代客泊车',
    'bridal suite': '新娘套房', 'getting ready': '准备',
    // 英语形容词
    'beautiful': '美丽', 'stunning': '惊艳', 'elegant': '优雅',
    'romantic': '浪漫', 'luxurious': '奢华', 'luxury': '豪华',
    'exclusive': '专属', 'unique': '独特', 'perfect': '完美',
    'ideal': '理想', 'spectacular': '壮观', 'magnificent': '宏伟',
    'charming': '迷人', 'picturesque': '如画', 'breathtaking': '令人叹为观止',
    'sublime': '绝美', 'scenic': '风景优美', 'refined': '精致',
    'welcoming': '温馨', 'spacious': '宽敞', 'intimate': '私密',
    'historic': '历史悠久', 'traditional': '传统', 'modern': '现代',
    'rustic': '质朴', 'contemporary': '当代', 'classic': '经典',
    'grand': '盛大', 'majestic': '庄严', 'magical': '魔幻',
    'unforgettable': '难忘', 'peaceful': '宁静', 'tranquil': '静谧',
    // 英语名词
    'countryside': '乡村', 'landscape': '风景', 'vineyard': '葡萄园',
    'vineyards': '葡萄园', 'olive grove': '橄榄树林', 'olive trees': '橄榄树',
    'cypress': '柏树', 'lavender': '薰衣草', 'rose garden': '玫瑰花园',
    'fountain': '喷泉', 'terrace': '露台', 'balcony': '阳台',
    'courtyard': '庭院', 'cellar': '酒窖', 'chapel': '小教堂',
    'cathedral': '大教堂', 'cloister': '回廊', 'arcade': '拱廊',
    'panoramic view': '全景', 'sea view': '海景', 'lake view': '湖景',
    'mountain view': '山景', 'garden view': '花园景观',
    'Mediterranean': '地中海', 'Atlantic': '大西洋',
    'hectares': '公顷', 'hectare': '公顷', 'acres': '英亩',
    'square meters': '平方米', 'sqm': '平方米',
    'bedrooms': '卧室', 'bedroom': '卧室', 'bathrooms': '浴室',
    'rooms': '房间', 'hall': '大厅', 'salon': '沙龙',
    'estate': '庄园', 'manor': '庄园', 'property': '场地',
    'venue': '场地', 'castle': '城堡', 'chateau': '城堡',
    'villa': '别墅', 'palace': '宫殿', 'abbey': '修道院',
    'monastery': '修道院', 'convent': '修道院',
    'century': '世纪', 'centuries': '世纪',
    'ceremony': '仪式', 'reception': '宴会', 'celebration': '庆典',
    'dinner': '晚宴', 'banquet': '宴会', 'party': '派对',
    'event': '活动', 'events': '活动',
    'food': '美食', 'cuisine': '料理', 'gastronomy': '美食',
    'wine': '葡萄酒', 'champagne': '香槟', 'cocktail': '鸡尾酒',
    'photography': '摄影', 'music': '音乐', 'decoration': '装饰',
    'floral': '花卉', 'flowers': '鲜花',
    'parking': '停车', 'accommodation': '住宿', 'transportation': '交通',
    'airport': '机场', 'station': '车站', 'center': '中心',
    'city': '城市', 'village': '村庄', 'town': '小镇',
    // 法语
    'La maison de famille': '家族庄园', 'Le domaine': '庄园',
    'Le château': '城堡', 'La villa': '别墅', 'Le jardin': '花园',
    'La terrasse': '露台', 'La piscine': '泳池', 'La chapelle': '小教堂',
    "L'église": '教堂', 'Le parc': '公园', 'La salle de réception': '宴会厅',
    'Le salon': '沙龙', 'est situé': '坐落于', 'est située': '坐落于',
    'est un': '是一个', 'est une': '是一个',
    'offre': '提供', 'dispose de': '配有', 'peut accueillir': '可容纳',
    "jusqu'à": '最多', 'invités': '位宾客', 'personnes': '人',
    'mariage': '婚礼', 'cérémonie': '仪式', 'réception': '宴会',
    'soirée': '晚宴', 'cocktail': '鸡尾酒会', 'fête': '庆典',
    'élégant': '优雅', 'romantique': '浪漫', 'magnifique': '美丽',
    'superbe': '惊艳', 'charmante': '迷人', 'luxueux': '奢华',
    'rustique': '质朴', 'moderne': '现代', 'historique': '历史',
    'en plein air': '户外', "à l'intérieur": '室内',
    'pierre': '石砌', 'siècle': '世纪', 'hectare': '公顷',
    'oliviers': '橄榄树', 'cyprès': '柏树', 'lavande': '薰衣草',
    'roses': '玫瑰', 'fleurs': '花卉', 'fontaine': '喷泉',
    'votre grand jour': '您的大日子', 'mariage de rêve': '梦想婚礼',
    'cadre parfait': '完美场景', 'inoubliable': '难忘',
    'magique': '魔幻', 'entouré de': '被...环绕',
    'au cœur de': '在...中心', 'vue sur': '可眺望',
    'proche de': '靠近', 'minutes de': '分钟',
    'splendide': '华丽的', 'cathédrale': '拱顶式',
    'abritée': '遮蔽的', 'couverts': '有顶的',
    'modulable': '可灵活布置', "d'accueillir": '接待',
    "vin d'honneur": '迎宾酒会',
    'et': '和', 'ou': '或', 'de': '的', 'du': '的', 'des': '的',
  }

  let result = clean
  const sorted = Object.entries(dict).sort((a, b) => b[0].length - a[0].length)
  for (const [en, zh] of sorted) {
    const regex = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
    result = result.replace(regex, zh)
  }

  // 检查翻译质量
  const newCnRatio = (result.match(/[\u4e00-\u9fff]/g) || []).length / Math.max(result.length, 1)
  if (newCnRatio < 0.2) {
    // 翻译质量太差，提取关键数字信息
    const nums = clean.match(/\d+/g)
    const capacity = nums ? nums.find(n => parseInt(n) >= 30 && parseInt(n) <= 500) : null
    const area = nums ? nums.find(n => parseInt(n) >= 2 && parseInt(n) < 200) : null
    if (capacity && area) return `占地${area}公顷，可容纳${capacity}位宾客`
    if (capacity) return `可容纳${capacity}位宾客的精致婚礼场地`
    return '精心打造的婚礼场地，为您的特殊日子增添浪漫与优雅'
  }

  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim()
  return result
}

async function main() {
  console.log('========================================')
  console.log('修复 venue_types 和 features - v2')
  console.log('========================================')

  const [rows] = await pool.execute('SELECT id, name_cn, features, venue_types, country FROM crawled_destinations ORDER BY id')
  console.log(`总记录: ${rows.length}`)

  let updated = 0
  for (const row of rows) {
    let features, venueTypes
    try { features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features } catch(e) { features = [] }
    try { venueTypes = typeof row.venue_types === 'string' ? JSON.parse(row.venue_types) : row.venue_types } catch(e) { venueTypes = [] }

    // 翻译 features
    const newFeatures = features
      .map(f => translateFeature(typeof f === 'string' ? f : String(f)))
      .filter(f => f && f.length > 5)
      .slice(0, 8)

    // 清理 venue_types - 从原始英文名开始
    const originalVt = venueTypes.map(vt => ({
      name: vt.name_en || vt.name || '',
      name_en: vt.name_en || vt.name || '',
    }))
    const newVt = cleanVenueTypes(originalVt)

    const fChanged = JSON.stringify(newFeatures) !== JSON.stringify(features)
    const vtChanged = JSON.stringify(newVt) !== JSON.stringify(venueTypes)

    if (fChanged || vtChanged) {
      await pool.execute(
        'UPDATE crawled_destinations SET features=?, venue_types=? WHERE id=?',
        [JSON.stringify(newFeatures), JSON.stringify(newVt), row.id]
      )
      updated++
      if (updated % 50 === 0 || updated <= 3) {
        console.log(`  [${updated}] ${row.name_cn}: feat ${features.length}→${newFeatures.length}, vt ${venueTypes.length}→${newVt.length}`)
      }
    }
  }

  console.log(`\n更新: ${updated} 条`)

  // 抽样验证
  console.log('\n--- 抽样验证 ---')
  const [samples] = await pool.execute('SELECT id, name_cn, features, venue_types FROM crawled_destinations WHERE id > 110 ORDER BY RAND() LIMIT 5')
  for (const s of samples) {
    const f = typeof s.features === 'string' ? JSON.parse(s.features) : s.features
    const v = typeof s.venue_types === 'string' ? JSON.parse(s.venue_types) : s.venue_types
    console.log(`\n${s.name_cn} (id:${s.id}):`)
    console.log(`  特色(${f.length}):`, f.slice(0,3).map(x => x.substring(0,40)).join(' | '))
    console.log(`  类型(${v.length}):`, v.map(x => x.name).join(', '))
  }

  await pool.end()
  console.log('\n完成！')
}

main().catch(err => { console.error('致命错误:', err); process.exit(1) })
