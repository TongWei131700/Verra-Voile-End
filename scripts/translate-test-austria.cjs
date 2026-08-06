/**
 * 翻译测试奥地利场地数据为中文
 * 更新 cv_test_austria / cd_test_austria 的中文字段
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

// 特色/设施翻译映射
const FEATURE_MAP = {
  'Chapel': '礼拜堂', 'Function Room': '宴会厅', 'Gardens': '花园',
  'Lake': '湖景', 'Panoramic Mountain Views': '全景山景', 'Privacy': '私密空间',
  'Reception Room': '接待厅', 'Terrace': '露台', 'Courtyard': '庭院',
  'Bar': '酒吧', 'Restaurant': '餐厅', 'Winery': '酒庄', 'Barn': '谷仓',
  'Outdoor Terrace': '户外露台', 'Panoramic View': '全景视野',
  'Roof Terrace': '屋顶露台', 'In-house catering': '内置餐饮服务',
  'Parking': '停车场', 'Professional Kitchen': '专业厨房',
  'On the lake': '湖畔', 'Park': '公园', 'Gazebo': '凉亭',
  'Golf': '高尔夫', 'Spa': '水疗', 'Gourmet Food': '美食',
  'Piano': '钢琴', 'Beach': '沙滩', 'Boat access': '码头',
  'Horse riding': '骑马', 'Orangerie': '橘园', 'Woodland': '林地',
  'Kids Club': '儿童俱乐部', 'Rose Garden': '玫瑰花园',
}

// 仪式类型翻译
const CEREMONY_MAP = {
  'Legal': '合法婚礼', 'Symbolic': '仪式婚礼', 'Catholic': '天主教婚礼',
}

// 场地类型翻译
const TYPE_MAP = {
  'Castle': '城堡', 'Hotel': '酒店', 'Waterside': '水边',
  'Mountain Lodge': '山间小屋', 'Vineyard': '葡萄园', 'Chalet': '木屋',
  'Winery': '酒庄', 'Country House': '乡村庄园', 'Villa': '别墅',
  'Palace': '宫殿', 'Outdoor': '户外场地', 'Manor House': '庄园',
  'In the City': '城市中心', 'Urban Château': '都市城堡',
  '5-star Hotel': '五星级酒店',
}

// 地区翻译
const REGION_MAP = {
  'Salzburg': '萨尔茨堡', 'Vienna': '维也纳', 'Styria': '施泰尔马克',
  'Carinthia': '克恩顿州', 'Tyrol': '蒂罗尔', 'Upper Austria': '上奥地利州',
  'Lower Austria': '下奥地利州', 'Vorarlberg': '福拉尔贝格州',
}

// 场地中文翻译
const translations = [
  { slug: 'test-austria-schloss-leopoldskron', name_cn: '莱奥波茨克龙城堡', tagline_cn: '萨尔茨堡湖畔城堡婚礼', location_cn: '萨尔茨堡，奥地利' },
  { slug: 'test-austria-haggenberg-castle', name_cn: '哈根贝格城堡', tagline_cn: '八百年历史的童话城堡婚礼', location_cn: '上奥地利州，奥地利' },
  { slug: 'test-austria-oberforsthofalm', name_cn: '奥伯福斯特霍夫山间小屋', tagline_cn: '萨尔扎赫山谷上的温馨山间小屋', location_cn: '萨尔茨堡，奥地利' },
  { slug: 'test-austria-weinschloss-thaller', name_cn: '塔勒葡萄酒城堡', tagline_cn: '施泰尔马克中心的葡萄酒城堡婚礼', location_cn: '施泰尔马克，奥地利' },
  { slug: 'test-austria-schloss-gurhof', name_cn: '古尔霍夫城堡', tagline_cn: '瓦豪山谷上方的巴洛克梦幻城堡', location_cn: '下奥地利州，奥地利' },
  { slug: 'test-austria-weingut-holler', name_cn: '霍勒酒庄', tagline_cn: '施泰尔马克风景如画的木屋酒庄', location_cn: '施泰尔马克，奥地利' },
  { slug: 'test-austria-rufanaalp', name_cn: '鲁法纳阿尔卑斯山间小屋', tagline_cn: '布尔瑟贝格迷人的山间小屋婚礼', location_cn: '福拉尔贝格州，奥地利' },
  { slug: 'test-austria-schloss-maria-loretto', name_cn: '玛丽亚洛雷托城堡', tagline_cn: '韦尔特湖畔的湖畔城堡婚礼', location_cn: '克恩顿州，奥地利' },
  { slug: 'test-austria-schloss-ottersbach', name_cn: '奥特斯巴赫城堡', tagline_cn: '花园中的童话城堡婚礼', location_cn: '施泰尔马克，奥地利' },
  { slug: 'test-austria-schloss-prielau', name_cn: '普里劳城堡', tagline_cn: '湖畔花园中的自然婚礼', location_cn: '萨尔茨堡，奥地利' },
  { slug: 'test-austria-schloss-welsdorf', name_cn: '韦尔斯多夫城堡', tagline_cn: '施泰尔马克exclusive城堡公园婚礼', location_cn: '施泰尔马克，奥地利' },
  { slug: 'test-austria-schloss-herberstein', name_cn: '赫伯斯坦城堡', tagline_cn: '历史花园城堡的童话婚礼', location_cn: '施泰尔马克，奥地利' },
  { slug: 'test-austria-hotel-schloss-obermayerhofen', name_cn: '奥伯迈尔霍芬城堡酒店', tagline_cn: '南施泰尔马克葡萄园中的城堡婚礼', location_cn: '施泰尔马克，奥地利' },
  { slug: 'test-austria-ernegg-castle', name_cn: '埃内格城堡', tagline_cn: '十二世纪城堡的亲密婚礼', location_cn: '上奥地利州，奥地利' },
  { slug: 'test-austria-jufenalm', name_cn: '朱芬阿尔卑斯山间小屋', tagline_cn: '萨尔茨堡壮美山景户外婚礼', location_cn: '萨尔茨堡，奥地利' },
  { slug: 'test-austria-eckartsau-castle', name_cn: '埃卡措城堡', tagline_cn: '维也纳巴洛克城堡婚礼', location_cn: '维也纳，奥地利' },
  { slug: 'test-austria-ansitz-wartenfels', name_cn: '瓦滕费尔斯庄园', tagline_cn: '富施尔湖畔的私密婚礼场地', location_cn: '萨尔茨堡，奥地利' },
  { slug: 'test-austria-palais-coburg', name_cn: '科堡宫殿', tagline_cn: '维也纳城市宫殿婚礼', location_cn: '维也纳，奥地利' },
  { slug: 'test-austria-hotel-schlossvilla-miralago', name_cn: '米拉龙湖城堡别墅酒店', tagline_cn: '克恩顿州私人湖畔别墅婚礼', location_cn: '克恩顿州，奥地利' },
  { slug: 'test-austria-schloss-matzen', name_cn: '马岑城堡', tagline_cn: '蒂罗尔十二世纪城堡微型婚礼', location_cn: '蒂罗尔，奥地利' },
  { slug: 'test-austria-hotel-sacher-vienna', name_cn: '维也纳萨赫酒店', tagline_cn: '维也纳一流婚礼酒店', location_cn: '维也纳，奥地利' },
  { slug: 'test-austria-hochzeitswald', name_cn: '婚礼森林', tagline_cn: '格拉茨附近的魔法森林婚礼', location_cn: '施泰尔马克，奥地利' },
]

function translateFeatures(featuresArr) {
  return featuresArr.map(f => {
    // 处理 "仪式: Legal, Symbolic" 格式
    if (f.startsWith('仪式: ') || f.startsWith('仪式：')) {
      const ceremonies = f.replace(/^仪式:\s*/, '').split(', ').map(c => CEREMONY_MAP[c.trim()] || c.trim())
      return `仪式: ${ceremonies.join('、')}`
    }
    return FEATURE_MAP[f] || f
  })
}

function translateVenueTypes(typesArr) {
  return typesArr.map(t => ({
    name: t.name,
    name_cn: TYPE_MAP[t.name] || t.name_cn || t.name
  }))
}

function translateTowns(townsArr, locationCn) {
  return townsArr.map(t => {
    const cn = REGION_MAP[t.name] || locationCn || t.name
    return { name: t.name, name_cn: cn }
  })
}

function translateBudget(budgetArr) {
  return budgetArr.map(b => {
    let label = b.label
    label = label.replace(/start at\s*/i, '起价 ')
    label = label.replace(/On enquiry/i, '需咨询')
    label = label.replace(/per person including room rental fees, drinks reception & dinner\./, '每人含场地租赁、迎宾酒会和晚餐')
    label = label.replace(/for exclusive use of the chapel or the Rittersaal/, '独占礼拜堂或骑士厅起价')
    label = label.replace(/for weekend rental in May - October\. Different pricing applies to weekdays/, '5-10月周末租赁，工作日另议')
    label = label.replace(/on weekdays\.\s*€(\d+) on weekends\./, '工作日起，€$1 周末')
    label = label.replace(/Castle chapel,/, '城堡礼拜堂')
    label = label.replace(/Outdoor areas and rooms in the castle/, '户外区域及城堡房间')
    label = label.replace(/\\n/g, '；')
    return { ...b, label: label.slice(0, 80) }
  })
}

function translateGuestCapacities(guestArr) {
  const purposeMap = {
    'Ceremony': '仪式', 'Drinks reception': '迎宾酒会', 'Dinner': '晚宴',
    'Party': '派对', 'Accommodation': '住宿',
  }
  return guestArr.map(g => {
    if (typeof g !== 'string') return g
    // 处理 "Ceremony/Drinks reception: 2-80人" 格式
    const match = g.match(/^(.+?):\s*(\d+)-(\d+)人$/)
    if (match) {
      const purposes = match[1].split('/').map(p => purposeMap[p.trim()] || p.trim())
      return `${purposes.join('/')}：${match[2]}-${match[3]}人`
    }
    // 处理默认格式 "0-40人" 等
    return g
  })
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  console.log('开始翻译测试奥地利数据...\n')

  for (const t of translations) {
    // 查询当前数据
    const [rows] = await pool.execute('SELECT * FROM cv_test_austria WHERE slug = ?', [t.slug])
    if (rows.length === 0) { console.log(`⚠️ ${t.slug} 不存在`); continue }
    const row = rows[0]

    // 翻译各字段
    const features = translateFeatures(row.features || [])
    const venueTypes = translateVenueTypes(row.venue_types || [])
    const towns = translateTowns(row.towns || [], t.location_cn)
    const budget = translateBudget(row.budget_ranges || [])
    const guest = translateGuestCapacities(row.guest_capacities || [])

    // 生成中文描述（基于英文描述的结构）
    let descCn = row.description || ''
    // 将【heading】替换为中文
    const headingMap = {
      'Accommodation': '住宿', 'Reception': '接待', 'Ceremony': '仪式',
      'History': '历史', 'Surroundings': '周边环境', 'Location': '位置',
      'Highlights': '亮点', 'About this venue': '关于此场地',
    }
    for (const [en, cn] of Object.entries(headingMap)) {
      descCn = descCn.replace(new RegExp(`【${en}】`, 'g'), `【${cn}】`)
    }
    // 截断作为 tagline
    const taglineCn = t.tagline_cn || ''

    // 更新 cv_ 表
    await pool.execute(
      `UPDATE cv_test_austria SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=?, budget_ranges=?, guest_capacities=?, location=? WHERE slug=?`,
      [t.name_cn, taglineCn, descCn, JSON.stringify(features), JSON.stringify(venueTypes), JSON.stringify(towns), JSON.stringify(budget), JSON.stringify(guest), t.location_cn, t.slug]
    )

    // 更新 cd_ 表
    await pool.execute(
      `UPDATE cd_test_austria SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=?, budget_ranges=?, guest_capacities=? WHERE slug=?`,
      [t.name_cn, taglineCn, descCn, JSON.stringify(features), JSON.stringify(venueTypes), JSON.stringify(towns), JSON.stringify(budget), JSON.stringify(guest), t.slug]
    )

    // 更新 products
    const prodSlug = t.slug.slice(0, 50).replace(/-$/, '')
    await pool.execute(
      `UPDATE products SET name=? WHERE product_id=?`,
      [t.name_cn, prodSlug]
    )

    console.log(`✓ ${t.name_cn} (${t.slug})`)
  }

  await pool.end()
  console.log('\n✅ 全部翻译完成！')
}

main().catch(e => { console.error(e.message); process.exit(1) })
