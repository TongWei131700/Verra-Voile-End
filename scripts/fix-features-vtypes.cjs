/**
 * 修复 features 和 venue_types 的翻译
 * 1. 清理 WeddingWire cookie/UI 噪音
 * 2. 翻译 features 为中文
 * 3. 清理并翻译 venue_types
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

// UI噪音 - 需要过滤掉的 venue_types
const UI_NOISE = new Set([
  'Planning tools', 'Organize with ease', 'View all', 'Checklist', 'Guests',
  'Seating chart', 'Budget', 'Wedding Vendors', 'Wedding website',
  'Personalize your wedding', 'Engine', 'Date Finder', 'Cost Guide',
  'Color generator', 'Hashtag generator', 'Venues', 'Find your wedding venue',
  'Wedding Vendor Preferences', 'Create your wedding website',
  'All Featured Listings', 'Contact', 'Message', 'About', 'Reviews',
  'Awards', 'Promotions', 'Blog', 'FAQ', 'Portfolio', 'Team',
  'Services', 'Pricing', 'Availability', 'Packages', 'Browse',
])

// venue_type 翻译字典
const VT_DICT = {
  'Barns & Farms': '农场与谷仓', 'Country Club': '乡村俱乐部',
  'Estate/Land': '庄园/土地', 'Garden': '花园', 'Hotel': '酒店',
  'Mansion': '庄园', 'Museum': '博物馆', 'Park': '公园',
  'Restaurant': '餐厅', 'Vineyard': '葡萄园', 'Winery': '酒庄',
  'Beach': '海滩', 'Mountain': '山地', 'Resort': '度假村',
  'Palace': '宫殿', 'Castle': '城堡', 'Church': '教堂',
  'Chapel': '小教堂', 'Historic Building': '历史建筑',
  'Indoor': '室内', 'Outdoor': '户外', 'Luxury': '豪华',
  'Wedding Venue': '婚礼场地', 'Wedding Planner': '婚礼策划',
  'Photographer': '摄影师', 'Florist': '花艺师',
  'Caterer': '餐饮服务商', 'DJ/Music': 'DJ/音乐',
  'Makeup Artist': '化妆师', 'Transportation': '交通服务',
  'Bridal Salon': '婚纱沙龙', 'Officiant': '司仪',
  'Event Rentals': '活动租赁', 'Lighting & Decor': '灯光装饰',
  'Jewelry': '珠宝', 'Favors': '伴手礼', 'Invitations': '请柬',
}

// cookie/隐私警告模式
const COOKIE_PATTERNS = [
  /At The Knot Worldwide.*$/gi,
  /By clicking "Send,".*$/gi,
  /You have the right to opt-out.*$/gi,
  /If you have enabled privacy controls.*$/gi,
  /We use cookies.*$/gi,
  /This website uses cookies.*$/gi,
  /Privacy Policy.*$/gi,
  /Terms of use.*$/gi,
]

// 通用翻译函数 - 英法混合 → 中文
function translateFeature(text, country) {
  if (!text || text.trim().length === 0) return ''
  
  // 清理cookie文本
  let clean = text
  for (const p of COOKIE_PATTERNS) clean = clean.replace(p, '')
  clean = clean.trim()
  if (clean.length < 10) return ''

  // 如果已经是中文为主，直接返回
  const cnChars = (clean.match(/[\u4e00-\u9fff]/g) || []).length
  if (cnChars > clean.length * 0.3) return clean

  // 英语翻译映射
  const enPhrases = {
    'The estate': '庄园', 'The chateau': '城堡', 'The villa': '别墅',
    'The venue': '场地', 'The property': '场地', 'The manor': '庄园',
    'The garden': '花园', 'The park': '公园', 'The pool': '泳池',
    'The terrace': '露台', 'The chapel': '小教堂', 'The church': '教堂',
    'is located': '位于', 'is situated': '坐落于', 'is set': '坐落于',
    'is a': '是一个', 'is an': '是一个', 'is the': '是',
    'offers': '提供', 'features': '特色', 'includes': '包含',
    'can accommodate': '可容纳', 'can host': '可接待',
    'up to': '最多', 'guests': '位宾客', 'people': '人',
    'wedding': '婚礼', 'ceremony': '仪式', 'reception': '宴会',
    'cocktail': '鸡尾酒会', 'dinner': '晚宴', 'celebration': '庆典',
    'countryside': '乡村', 'garden': '花园', 'vineyard': '葡萄园',
    'terrace': '露台', 'pool': '泳池', 'park': '公园',
    'elegant': '优雅', 'romantic': '浪漫', 'beautiful': '美丽',
    'stunning': '惊艳', 'charming': '迷人', 'luxurious': '奢华',
    'sublime': '绝美', 'scenic': '风景优美的', 'refined': '精致的',
    'welcoming': '温馨的', 'spacious': '宽敞', 'intimate': '私密',
    'historic': '历史', 'traditional': '传统', 'modern': '现代',
    'outdoor': '户外', 'indoor': '室内', 'panoramic': '全景',
    'Mediterranean': '地中海', 'sea view': '海景', 'lake': '湖',
    'mountain': '山景', 'forest': '森林', 'olive': '橄榄',
    'lavender': '薰衣草', 'rose': '玫瑰', 'flower': '花',
    'stone': '石砌', 'century': '世纪', 'hectare': '公顷',
    'room': '房间', 'hall': '大厅', 'salon': '沙龙',
    'suite': '套房', 'bedroom': '卧室', 'bathroom': '浴室',
    'kitchen': '厨房', 'cellar': '酒窖', 'courtyard': '庭院',
    'fountain': '喷泉', 'bridge': '桥', 'tower': '塔',
    'your special day': '您的特殊日子', 'your big day': '您的大日子',
    'dream wedding': '梦想婚礼', 'perfect setting': '完美场景',
    'unforgettable': '难忘', 'magical': '魔幻',
    'surrounded by': '被...环绕', 'in the heart of': '在...中心',
    'with views of': '可眺望', 'close to': '靠近',
    'minutes from': '距...分钟', 'airport': '机场',
    'city center': '市中心', 'downtown': '市区',
    'The space': '空间', 'The rooms': '房间', 'The areas': '区域',
    'This': '这', 'That': '那', 'Which': '哪个',
    'For': '对于', 'With': '配有', 'From': '从',
    'Your': '您的', 'Our': '我们的', 'Their': '他们的',
    'and': '和', 'or': '或', 'the': '', 'a': '', 'an': '',
    'of': '的', 'in': '在', 'on': '在', 'at': '在',
    'to': '到', 'for': '为', 'by': '由', 'with': '配有',
    'from': '从', 'about': '关于', 'between': '之间',
    'through': '穿过', 'during': '在...期间', 'without': '无',
    'also': '也', 'very': '非常', 'most': '最',
    'more': '更多', 'less': '更少', 'all': '所有',
    'every': '每个', 'each': '每个', 'many': '许多',
    'some': '一些', 'other': '其他', 'new': '新',
    'old': '古老', 'great': '伟大', 'good': '好',
    'best': '最佳', 'top': '顶级', 'high': '高',
    'large': '大', 'small': '小', 'long': '长',
    'short': '短', 'wide': '宽', 'open': '开放',
  }

  // 法语翻译映射
  const frPhrases = {
    'La maison': '庄园', 'Le domaine': '庄园', 'Le château': '城堡',
    'La villa': '别墅', 'Le jardin': '花园', 'La terrasse': '露台',
    'La piscine': '泳池', 'La chapelle': '小教堂', "L'église": '教堂',
    'Le parc': '公园', 'La salle': '大厅', 'Le salon': '沙龙',
    'La réception': '宴会', 'La cérémonie': '仪式', 'Le mariage': '婚礼',
    'La soirée': '晚宴', 'Le cocktail': '鸡尾酒会',
    'est situé': '坐落于', 'est située': '坐落于', 'est un': '是一个',
    'est une': '是一个', 'offre': '提供', 'dispose': '配有',
    'peut accueillir': '可容纳', 'jusqu\'à': '最多',
    'invités': '位宾客', 'personnes': '人',
    'mariage': '婚礼', 'cérémonie': '仪式', 'réception': '宴会',
    'jardin': '花园', 'vignoble': '葡萄园', 'terrasse': '露台',
    'piscine': '泳池', 'parc': '公园', 'cour': '庭院',
    'élégant': '优雅', 'romantique': '浪漫', 'magnifique': '美丽',
    'superbe': '惊艳', 'charmante': '迷人', 'luxueux': '奢华',
    'rustique': '质朴', 'moderne': '现代', 'historique': '历史',
    'en plein air': '户外', 'intérieur': '室内',
    'pierre': '石砌', 'siècle': '世纪', 'hectare': '公顷',
    'oliviers': '橄榄树', 'cyprès': '柏树', 'lavande': '薰衣草',
    'roses': '玫瑰', 'fleurs': '花卉', 'fontaine': '喷泉',
    'votre grand jour': '您的大日子', 'mariage de rêve': '梦想婚礼',
    'cadre parfait': '完美场景', 'inoubliable': '难忘',
    'magique': '魔幻', 'entouré de': '被...环绕',
    'au cœur de': '在...中心', 'vue sur': '可眺望',
    'proche de': '靠近', 'minutes de': '距...分钟',
    'et': '和', 'ou': '或', 'le': '', 'la': '', 'les': '',
    'de': '的', 'du': '的', 'des': '的', 'en': '在',
    'à': '在', 'pour': '为', 'par': '由', 'avec': '配有',
    'sur': '在', 'dans': '在', 'qui': '哪个', 'que': '那',
    'vous': '您', 'votre': '您的', 'vos': '您的',
    'splendide': '华丽的', 'cathédrale': '拱顶式',
    'abritée': '遮蔽的', 'couverts': '有顶的',
    'modulable': '可灵活布置', 'permettent': '可以',
    'd\'accueillir': '接待', 'grande': '大', 'petites': '小型',
    'vin d\'honneur': '迎宾酒会', 'sous': '在...下',
  }

  let result = clean
  // 先翻译较长的短语
  const allPhrases = country === 'France' 
    ? { ...frPhrases, ...enPhrases }
    : { ...enPhrases, ...frPhrases }
  
  const sorted = Object.entries(allPhrases).sort((a, b) => b[0].length - a[0].length)
  for (const [orig, zh] of sorted) {
    if (zh === '') continue // 跳过空翻译
    const regex = new RegExp('\\b' + orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
    result = result.replace(regex, zh)
  }

  // 如果翻译后仍有大量英文，用描述性中文替代
  const cnRatio = (result.match(/[\u4e00-\u9fff]/g) || []).length / Math.max(result.length, 1)
  if (cnRatio < 0.3) {
    // 提取关键信息生成简洁中文描述
    const wordCount = clean.match(/\d+/g)
    const capacity = wordCount ? wordCount.find(n => parseInt(n) > 20 && parseInt(n) < 1000) : null
    const area = wordCount ? wordCount.find(n => parseInt(n) > 1 && parseInt(n) < 200) : null
    
    if (capacity) {
      return `可容纳${capacity}位宾客的精致婚礼场地`
    }
    return '精心打造的婚礼场地，为您的特殊日子增添浪漫与优雅'
  }

  return result
}

function cleanVenueTypes(vtArr) {
  const seen = new Set()
  const cleaned = []
  for (const vt of vtArr) {
    if (UI_NOISE.has(vt.name || vt.name_en)) continue
    if (seen.has(vt.name)) continue
    seen.add(vt.name)
    
    const name = vt.name || vt.name_en || ''
    const nameCn = VT_DICT[name] || translateFeature(name, '')
    cleaned.push({
      name: nameCn,
      name_en: name,
      name_cn: nameCn,
    })
  }
  if (cleaned.length === 0) {
    cleaned.push({ name: '婚礼场地', name_en: 'Wedding Venue', name_cn: '婚礼场地' })
  }
  return cleaned
}

async function main() {
  console.log('========================================')
  console.log('修复 features 和 venue_types 翻译')
  console.log('========================================')

  const [rows] = await pool.execute('SELECT id, name_cn, features, venue_types, country FROM crawled_destinations ORDER BY id')
  console.log(`总记录: ${rows.length} 条`)

  let updated = 0
  for (const row of rows) {
    let features, venueTypes
    try { features = typeof row.features === 'string' ? JSON.parse(row.features) : row.features } catch(e) { features = [] }
    try { venueTypes = typeof row.venue_types === 'string' ? JSON.parse(row.venue_types) : row.venue_types } catch(e) { venueTypes = [] }

    // 翻译 features
    const newFeatures = features
      .map(f => translateFeature(typeof f === 'string' ? f : String(f), row.country))
      .filter(f => f && f.length > 5)
      .slice(0, 10)
    
    // 清理 venue_types
    const newVenueTypes = cleanVenueTypes(Array.isArray(venueTypes) ? venueTypes : [])

    // 检查是否需要更新
    const featuresChanged = JSON.stringify(newFeatures) !== JSON.stringify(features)
    const vtChanged = JSON.stringify(newVenueTypes) !== JSON.stringify(venueTypes)

    if (featuresChanged || vtChanged) {
      await pool.execute(
        'UPDATE crawled_destinations SET features=?, venue_types=? WHERE id=?',
        [JSON.stringify(newFeatures), JSON.stringify(newVenueTypes), row.id]
      )
      updated++
      if (updated % 30 === 0 || updated <= 3) {
        console.log(`  [${updated}] ${row.name_cn}: features ${features.length}→${newFeatures.length}, vt ${venueTypes.length}→${newVenueTypes.length}`)
      }
    }
  }

  console.log(`\n更新完成: ${updated} 条记录`)

  // 验证抽样
  console.log('\n--- 翻译抽样 ---')
  const [samples] = await pool.execute('SELECT id, name_cn, features, venue_types FROM crawled_destinations WHERE id > 110 ORDER BY RAND() LIMIT 5')
  for (const s of samples) {
    const f = typeof s.features === 'string' ? JSON.parse(s.features) : s.features
    const v = typeof s.venue_types === 'string' ? JSON.parse(s.venue_types) : s.venue_types
    console.log(`\n${s.name_cn} (id:${s.id}):`)
    console.log(`  features: ${JSON.stringify(f).substring(0, 150)}`)
    console.log(`  venue_types: ${JSON.stringify(v).substring(0, 150)}`)
  }

  await pool.end()
  console.log('\n完成！')
}

main().catch(err => { console.error('致命错误:', err); process.exit(1) })
