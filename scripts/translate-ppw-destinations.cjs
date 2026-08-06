/**
 * 翻译测试peachperfectweddings目的地数据为中文
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

const translations = [
  {
    slug: 'test-ppw-ireland', name_cn: '爱尔兰', tagline_cn: '在爱尔兰举办目的地婚礼',
    desc_intro: '爱尔兰', features_cn: ['区域: 克莱尔', '区域: 科克', '区域: 凯里', '区域: 都柏林', '区域: 戈尔韦', '合法婚礼', '仪式婚礼', '城堡婚礼', '悬崖婚礼', '庄园婚礼'],
    budget_cn: [{ label: '€8,000-€20,000', min: 8000, max: 20000 }, { label: '€20,000-€50,000', min: 20000, max: 50000 }, { label: '€50,000+', min: 50000, max: null }],
    towns_cn: [{ name: 'Ireland', name_cn: '爱尔兰' }]
  },
  {
    slug: 'test-ppw-italy', name_cn: '意大利', tagline_cn: '在意大利举办目的地婚礼',
    desc_intro: '意大利', features_cn: ['区域: 阿马尔菲海岸', '区域: 科莫湖', '区域: 罗马/佛罗伦萨/威尼斯', '区域: 西西里与撒丁岛', '区域: 托斯卡纳', '合法婚礼', '仪式婚礼', '天主教婚礼', '城堡婚礼', '湖畔婚礼'],
    budget_cn: [{ label: '€7,000-€15,000', min: 7000, max: 15000 }, { label: '€15,000-€40,000', min: 15000, max: 40000 }, { label: '€40,000+', min: 40000, max: null }],
    towns_cn: [{ name: 'Italy', name_cn: '意大利' }]
  },
  {
    slug: 'test-ppw-spain', name_cn: '西班牙', tagline_cn: '在西班牙举办目的地婚礼',
    desc_intro: '西班牙', features_cn: ['区域: 巴塞罗那', '区域: 马德里', '区域: 马拉加', '区域: 马略卡岛', '区域: 塞维利亚', '合法婚礼', '仪式婚礼', '天主教婚礼', '海滩婚礼', '庄园婚礼'],
    budget_cn: [{ label: '€5,000-€12,000', min: 5000, max: 12000 }, { label: '€12,000-€30,000', min: 12000, max: 30000 }, { label: '€30,000+', min: 30000, max: null }],
    towns_cn: [{ name: 'Spain', name_cn: '西班牙' }]
  },
  {
    slug: 'test-ppw-portugal', name_cn: '葡萄牙', tagline_cn: '在葡萄牙举办目的地婚礼',
    desc_intro: '葡萄牙', features_cn: ['区域: 里斯本', '区域: 波尔图', '区域: 阿尔加维', '区域: 马德拉', '区域: 阿连特茹', '合法婚礼', '仪式婚礼', '天主教婚礼', '海滩婚礼', '庄园婚礼'],
    budget_cn: [{ label: '€5,000-€12,000', min: 5000, max: 12000 }, { label: '€12,000-€30,000', min: 12000, max: 30000 }, { label: '€30,000+', min: 30000, max: null }],
    towns_cn: [{ name: 'Portugal', name_cn: '葡萄牙' }]
  },
  {
    slug: 'test-ppw-germany', name_cn: '德国', tagline_cn: '在德国举办目的地婚礼',
    desc_intro: '德国', features_cn: ['区域: 巴伐利亚', '区域: 黑森林', '区域: 莱茵河谷', '区域: 柏林', '区域: 汉堡', '合法婚礼', '仪式婚礼', '城堡婚礼', '庄园婚礼', '花园婚礼'],
    budget_cn: [{ label: '€10,000-€25,000', min: 10000, max: 25000 }, { label: '€25,000-€60,000', min: 25000, max: 60000 }, { label: '€60,000+', min: 60000, max: null }],
    towns_cn: [{ name: 'Germany', name_cn: '德国' }]
  },
  {
    slug: 'test-ppw-austria', name_cn: '奥地利', tagline_cn: '在奥地利举办目的地婚礼',
    desc_intro: '奥地利', features_cn: ['区域: 萨尔茨堡', '区域: 维也纳', '区域: 施泰尔马克', '区域: 蒂罗尔', '区域: 克恩顿州', '合法婚礼', '仪式婚礼', '城堡婚礼', '山间婚礼', '湖畔婚礼'],
    budget_cn: [{ label: '€10,000-€25,000', min: 10000, max: 25000 }, { label: '€25,000-€60,000', min: 25000, max: 60000 }, { label: '€60,000+', min: 60000, max: null }],
    towns_cn: [{ name: 'Austria', name_cn: '奥地利' }]
  },
  {
    slug: 'test-ppw-switzerland', name_cn: '瑞士', tagline_cn: '在瑞士举办目的地婚礼',
    desc_intro: '瑞士', features_cn: ['区域: 苏黎世', '区域: 日内瓦', '区域: 卢塞恩', '区域: 伯尔尼', '区域: 因特拉肯', '合法婚礼', '仪式婚礼', '山间婚礼', '湖畔婚礼', '庄园婚礼'],
    budget_cn: [{ label: 'CHF 15,000-CHF 40,000', min: 15000, max: 40000 }, { label: 'CHF 40,000-CHF 80,000', min: 40000, max: 80000 }, { label: 'CHF 80,000+', min: 80000, max: null }],
    towns_cn: [{ name: 'Switzerland', name_cn: '瑞士' }]
  },
]

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  console.log('开始翻译测试peachperfectweddings目的地数据...\n')

  for (const t of translations) {
    const [rows] = await pool.execute('SELECT * FROM cd_test_peachperfectweddings WHERE slug = ?', [t.slug])
    if (rows.length === 0) { console.log('⚠️ ' + t.slug + ' 不存在'); continue }
    const row = rows[0]

    // 翻译描述：将英文heading替换为中文
    let descCn = row.description || ''
    const headingTranslations = {
      'Why couples choose': '为什么选择',
      'THE EXPERIENCE': '体验',
      'THE VENUES': '场地',
      'THE PRACTICALITIES': '实用信息',
      'When to get married': '最佳婚礼时间',
      'Spring': '春季', 'Summer': '夏季', 'Autumn': '秋季', 'Winter': '冬季',
      'Cost of a wedding': '婚礼费用',
      'Experiences around': '周边体验',
      'Wedding traditions': '婚礼传统',
      'Getting around': '交通出行',
      'Staying in': '住宿选择',
      'FAQs about': '常见问题',
    }
    for (const [en, cn] of Object.entries(headingTranslations)) {
      descCn = descCn.replace(new RegExp('【' + en + '[^】]*】', 'g'), '【' + cn + '】')
    }

    // 翻译FAQ
    const faqCn = (row.faq || []).map(function(f) {
      return { q: f.q, a: f.a }
    })

    // 更新 cd_ 表
    await pool.execute(
      'UPDATE cd_test_peachperfectweddings SET name_cn=?, tagline_cn=?, description_cn=?, features=?, towns=?, budget_ranges=?, faq=? WHERE slug=?',
      [t.name_cn, t.tagline_cn, descCn, JSON.stringify(t.features_cn), JSON.stringify(t.towns_cn), JSON.stringify(t.budget_cn), JSON.stringify(faqCn), t.slug]
    )

    // 更新 products
    const prodSlug = t.slug.slice(0, 50).replace(/-$/, '')
    await pool.execute('UPDATE products SET name=? WHERE product_id=?', [t.name_cn, prodSlug])

    console.log('✓ ' + t.name_cn + ' (' + t.slug + ')')
  }

  await pool.end()
  console.log('\n✅ 全部翻译完成！')
}

main().catch(function(e) { console.error(e.message); process.exit(1) })
