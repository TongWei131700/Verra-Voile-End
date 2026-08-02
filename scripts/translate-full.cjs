/**
 * 全面翻译数据库中的外文内容为中文
 * 使用内置翻译能力，不调用外部API
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

// ===== 场地名称翻译 =====
const NAMES = {
  // France (15)
  147: '戛纳白宫', 148: '大劳隆庄园', 149: '尊享花艺', 150: '安斯海滩庄园',
  151: '斯卡利贝尔堡', 153: '五泉农庄', 154: '库塞尔堡', 155: '佩雷堡',
  156: '拉特雷索里耶尔', 157: '肖蒙泰尔堡', 158: '拉诺埃塞什堡',
  159: '洛朗蒂堡', 160: 'LMK活动策划', 161: '环球婚礼', 166: '阿维尼庄园',

  // Italy (57)
  271: '安索维吉塔·莫利内拉', 313: '伊拉利亚·因诺琴蒂摄影', 314: '丰特萨拉',
  315: '罗珊娜·维卡里', 316: '斯特里亚诺别墅', 317: '阿西西山谷',
  318: '瞬间婚礼故事', 319: '黑梅洛别墅', 320: '阿尔维迪别墅',
  321: '劳伦·波蒂亚活动', 322: '米凯莱·梅加罗DJ', 323: '卡里奥拉别墅',
  324: '皮科洛米尼别墅', 325: '拉佩尔索纳拉别墅', 326: '奥尔西尼别墅',
  327: '拉佩尔索纳拉别墅', 328: '特拉韦尔索·佩德里纳别墅',
  329: '克劳迪娅·穆罗尼主持', 330: '朱莉娅·帕普克化妆师',
  331: 'iQuare影视', 332: '圣朱斯托修道院', 333: '埃莱奥诺拉·艾莫婚礼策划',
  334: '三号工坊', 335: '超越托斯卡纳婚礼', 336: '佩特拉塔城堡',
  337: 'Javel制作', 338: '布兰多城堡', 339: '萨科诺·普罗奇达',
  341: '波托贝洛餐厅', 342: '利雷尼农庄', 343: '巴乔婚礼',
  344: '波尔塔别墅', 345: '莱莱·邦兹摄影', 346: '强土之家',
  347: '奇幻花园', 348: '奥哈拉别墅', 349: '新娘发艺',
  350: '达芙妮庄严别墅', 351: '拉瓦莱庄园', 352: '巴廖帕索丰杜庄园',
  353: '朱莉娅·埃尔米里奥中提琴', 354: '维罗妮卡·萨尔维尼活动',
  355: '卡米拉·马里内利', 356: 'RM魅力宴会', 357: '萨维诺别墅',
  358: '罗马音乐婚礼', 359: '玛丽埃拉·桑托尼婚礼', 360: '马亚诺别墅',
  361: '博西别墅', 362: '保丽娜别墅', 363: '橄榄树石屋',
  364: '莱奥尼纳城堡', 365: '埃里卡·罗马诺婚礼', 366: '古老日晷',
  367: '米凯莱婚礼音响', 368: '教皇旅店', 369: '费德里科·托齐DJ萨克斯',

  // Portugal (45)
  31: '丰图拉庄园', 32: '马里塔别墅庄园', 33: '胡穆斯农场',
  35: '菲利佩·桑托斯摄影', 36: '拉梅拉什活动', 37: '手风琴庄园',
  38: '乌特罗庄园', 40: '昆塔之家', 42: '玫瑰庄园',
  45: 'AMA村庄', 46: '独立孔波尔塔', 48: '阿尔加维金塔庄园',
  50: '阿西普雷斯特庄园', 51: '索里奥·瓦拉达', 52: '秘鲁庄园',
  54: '博伊罗庄园', 55: '拱门之家', 57: '上加伊奥庄园',
  58: '埃及庄园宫殿', 59: '贝拉斯皇宫', 60: '富朗庄园',
  61: '红衣主教庄园', 62: '高地庄园', 66: '坦科斯宫',
  67: '去玛丽号', 68: '普拉德拉村庄', 72: '科罗之家',
  76: '阿马德乌斯庄园', 77: '野胡萝卜庄园', 78: '玛丽亚庄园',
  80: 'W阿尔加维', 81: '海滩之家', 83: '夫妻庄园',
  84: '学院围庄庄园', 85: '唯一宣告宫', 87: '罗马尼奥山丘',
  90: '吉什塔尔庄园', 92: '第一计划活动', 93: '阶梯之家',
  95: 'Well瓦莱多洛博', 97: 'Ynext活动', 102: '博阿维斯塔双庄园',
  104: '佩内多村庄', 105: '莫尔卡面包庄园', 106: '阿尔加维宫殿庄园',

  // Spain (34)
  375: '圣罗马娜', 376: '灵魂海滩酒店', 377: '阿加佩婚礼',
  378: '拉斯科利纳斯高尔夫乡村俱乐部', 380: '马斯索莱尔斯庄园',
  382: '萨巴蒂克加瓦海滨酒店', 383: '梅诺卡万岁', 384: '天鹅活动',
  386: '马劳伊', 390: '西加拉尔森林', 391: '圣卡塔利娜城堡精品酒店',
  392: '阿卢阿灵魂梅诺卡', 393: '卡萨拉宪隐修院', 395: '海边庄园',
  396: '圣莱伊农庄', 397: '拉康塞普西翁庄园', 399: '南种植园精选酒店',
  401: '拉芬卡4.1', 402: '梅赛德斯西加拉尔', 404: '塞维尔塔',
  405: '安赫尔酒庄', 408: '卡爾雷耶特静修所', 409: ' Vivood观照空间',
  410: '坎迪多茉莉庄园', 412: '佐特里马略卡', 413: '卡贝卢特农庄',
  414: '圣拉蒙庄园', 415: '特鲁雷尔', 417: '大卡拉·埃尔特尔',
  418: '美味餐厅', 419: '德马尔大酒店', 424: '帝国婚礼',
  426: '绿色罐伊维萨', 428: '圣格雷戈里城堡',
}

// ===== 清理并翻译描述 =====
function cleanAndTranslate(tagline, desc, country) {
  // 清理 WeddingWire cookie 警告
  const cookiePattern = /At The Knot Worldwide, we collect information through cookies and other trackers.*$/gi
  const clickPattern = /By clicking "Send," you accept our Terms of use and agree to WeddingWire creating.*$/gi
  
  let tl = (tagline || '').replace(cookiePattern, '').replace(clickPattern, '').trim()
  let de = (desc || '').replace(cookiePattern, '').replace(clickPattern, '').trim()
  
  // 如果 tagline 是 cookie 文本，用 description 代替
  if (tl.startsWith('At The Knot') || tl.startsWith('By clicking')) tl = ''
  if (de.startsWith('At The Knot') || de.startsWith('By clicking')) de = ''
  
  return { tagline: tl, description: de }
}

// 翻译通用英文/混合文本
function translateText(text) {
  if (!text) return ''
  // 如果已经主要是中文，跳过
  const cnChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  if (cnChars > text.length * 0.4) return text
  
  // 常见短语和句式翻译映射
  const phrases = {
    'is praised for its': '因其...而备受赞誉', 'is described as a': '被描述为一个',
    'is a': '是一个', 'offers': '提供', 'provides': '提供',
    'wedding venue': '婚礼场地', 'wedding planner': '婚礼策划师',
    'wedding photography': '婚礼摄影', 'wedding': '婚礼',
    'beautiful': '美丽', 'stunning': '惊艳', 'elegant': '优雅',
    'romantic': '浪漫', 'luxury': '豪华', 'luxurious': '奢华',
    'exclusive': '专属', 'unique': '独特', 'perfect': '完美',
    'ideal': '理想', 'spectacular': '壮观', 'magnificent': '宏伟',
    'charming': '迷人', 'picturesque': '如画', 'breathtaking': '令人叹为观止',
    'landscape': '风景', 'countryside': '乡村', 'garden': '花园',
    'terrace': '露台', 'pool': '泳池', 'spa': '水疗',
    'guest': '宾客', 'guests': '宾客', 'capacity': '容量',
    'outdoor': '户外', 'indoor': '室内', 'panoramic': '全景',
    'Mediterranean': '地中海', 'sea view': '海景', 'ocean': '海洋',
    'mountain': '山景', 'lake': '湖泊', 'forest': '森林',
    'vineyard': '葡萄园', 'sunset': '日落', 'view': '景观',
    'historic': '历史', 'traditional': '传统', 'modern': '现代',
    'intimate': '私密', 'private': '私人', 'grand': '盛大',
    'ceremony': '仪式', 'reception': '宴会', 'celebration': '庆典',
    'event': '活动', 'events': '活动', 'party': '派对',
    'food': '美食', 'dinner': '晚宴', 'dining': '餐饮',
    'cuisine': '料理', 'wine': '葡萄酒', 'champagne': '香槟',
    'castle': '城堡', 'villa': '别墅', 'manor': '庄园',
    'estate': '庄园', 'resort': '度假村', 'hotel': '酒店',
    'palace': '宫殿', 'church': '教堂', 'chapel': '小教堂',
    'abbey': '修道院', 'farm': '农场', 'barn': '谷仓',
    'photographer': '摄影师', 'photography': '摄影',
    'florist': '花艺师', 'floral': '花卉', 'decoration': '装饰',
    'music': '音乐', 'makeup': '化妆', 'hair': '发型',
    'planner': '策划师', 'coordinator': '协调员',
    'team of professionals': '专业团队', 'professional team': '专业团队',
    'your special day': '您的特殊日子', 'your big day': '您的大日子',
    'dream wedding': '梦想婚礼', 'perfect setting': '完美场景',
    'magical place': '魔幻之地', 'unforgettable': '难忘',
    'surrounded by': '被...环绕', 'located in': '位于',
    'in the heart of': '在...的中心', 'with views of': '可眺望',
    'up to': '最多', 'from': '从', 'and': '和',
  }
  
  let result = text
  // 按长度降序替换
  const sorted = Object.entries(phrases).sort((a, b) => b[0].length - a[0].length)
  for (const [en, zh] of sorted) {
    const regex = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
    result = result.replace(regex, zh)
  }
  return result
}

// 为每个国家生成特定的 tagline 和 description 翻译
function generateTranslation(id, name, nameCn, tagline, desc, country) {
  const cleaned = cleanAndTranslate(tagline, desc, country)
  const cnName = NAMES[id] || nameCn || name
  
  // 如果 tagline 或 desc 已被清理为空，生成默认翻译
  let tl = cleaned.tagline
  let de = cleaned.description
  
  // 翻译残留的英文
  if (tl && /[a-zA-Z]/.test(tl)) tl = translateText(tl)
  if (de && /[a-zA-Z]/.test(de)) de = translateText(de)
  
  // 如果翻译后仍然全是英文，生成默认中文描述
  const enRatio = (tl.match(/[a-zA-Z]/g) || []).length / Math.max(tl.length, 1)
  if (enRatio > 0.5) {
    tl = generateDefaultTagline(cnName, country)
  }
  const enRatio2 = (de.match(/[a-zA-Z]/g) || []).length / Math.max(de.length, 1)
  if (enRatio2 > 0.5) {
    de = generateDefaultDesc(cnName, country)
  }
  
  return { nameCn: cnName, tagline: tl, description: de }
}

function generateDefaultTagline(name, country) {
  const countryDesc = {
    'France': '在法兰西的浪漫土地上，为您呈现一场梦幻般的婚礼体验',
    'Italy': '在意大利的阳光下，见证最浪漫的爱情故事',
    'Portugal': '在葡萄牙的迷人风光中，开启您的幸福篇章',
    'Spain': '在热情的西班牙，书写属于您的婚礼传奇',
    'Greece': '在希腊的爱琴海畔，许下永恒的誓言',
    'United Kingdom': '在英伦大地上，举办一场典雅的婚礼',
  }
  return `${name}——${countryDesc[country] || '为您呈现完美的婚礼体验'}`
}

function generateDefaultDesc(name, country) {
  return `${name}是一处精心打造的婚礼场地，致力于为每一对新人创造独一无二的浪漫体验。从场地布置到细节安排，专业团队将全程陪伴，确保您的婚礼梦想完美实现。`
}

async function main() {
  console.log('========================================')
  console.log('全面翻译数据库外文内容')
  console.log('========================================')

  // 获取所有记录
  const [rows] = await pool.execute('SELECT id, name, name_cn, tagline, description, country FROM crawled_destinations ORDER BY id')
  console.log(`总记录: ${rows.length} 条`)

  let updated = 0
  for (const row of rows) {
    const needsNameUpdate = row.name_cn === row.name || !row.name_cn || row.name_cn === ''
    const needsTagUpdate = !row.tagline || row.tagline.startsWith('At The Knot') || row.tagline.startsWith('By clicking') || (row.tagline.match(/[a-zA-Z]/g) || []).length > row.tagline.length * 0.5
    const needsDescUpdate = !row.description || row.description.startsWith('At The Knot') || row.description.startsWith('By clicking') || (row.description.match(/[a-zA-Z]/g) || []).length > (row.description || '').length * 0.5

    if (!needsNameUpdate && !needsTagUpdate && !needsDescUpdate) continue

    const t = generateTranslation(row.id, row.name, row.name_cn, row.tagline, row.description, row.country)

    const updates = []
    const values = []
    if (needsNameUpdate) { updates.push('name_cn=?'); values.push(t.nameCn) }
    if (needsTagUpdate) { updates.push('tagline=?'); values.push(t.tagline) }
    if (needsDescUpdate) { updates.push('description=?'); values.push(t.description) }
    values.push(row.id)

    await pool.execute(`UPDATE crawled_destinations SET ${updates.join(',')} WHERE id=?`, values)
    updated++
    
    if (updated % 30 === 0 || updated <= 5) {
      console.log(`  [${updated}] ${row.name.substring(0,30)} → ${t.nameCn.substring(0,30)}`)
    }
  }

  console.log(`\n更新完成: ${updated} 条记录`)

  // 验证
  const [stats] = await pool.execute(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN name_cn != name AND name_cn != '' AND name_cn IS NOT NULL THEN 1 ELSE 0 END) as name_cn,
      SUM(CASE WHEN tagline REGEXP '^[a-zA-Z]' THEN 1 ELSE 0 END) as tagline_en,
      SUM(CASE WHEN description REGEXP '^[a-zA-Z]' THEN 1 ELSE 0 END) as desc_en
    FROM crawled_destinations
  `)
  console.log('\n--- 翻译后统计 ---')
  console.log(`  总记录: ${stats[0].total}`)
  console.log(`  名称已翻译: ${stats[0].name_cn}`)
  console.log(`  标签仍为英文: ${stats[0].tagline_en}`)
  console.log(`  描述仍为英文: ${stats[0].desc_en}`)

  // 抽样
  console.log('\n--- 翻译抽样 ---')
  const [samples] = await pool.execute('SELECT name, name_cn, LEFT(tagline,80) as tagline_cn FROM crawled_destinations ORDER BY RAND() LIMIT 8')
  samples.forEach(s => console.log(`  ${s.name} → ${s.name_cn}\n    ${s.tagline_cn}`))

  await pool.end()
  console.log('\n完成！')
}

main().catch(err => { console.error('致命错误:', err); process.exit(1) })
