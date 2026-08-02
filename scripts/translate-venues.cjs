/**
 * 翻译 crawled_venues 表中的英文/法文内容为中文
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  const translations = {
    'domaine-de-beauregard': {
      name_cn: '博雷加德庄园',
      tagline: '普罗旺斯腹地的十八世纪瑰宝',
      description: `博雷加德庄园始建于18世纪，坐落于阿维尼翁与卡庞特拉之间的蒙图小镇，距A7高速公路仅8分钟车程，距阿维尼翁TGV高铁站25分钟。庄园以其宏伟的花园迎接您的到来，将古老的魅力与普罗旺斯的生活艺术优雅地融为一体。这是一处非凡之地，宁静而祥和，是举办一场尊贵而原汁原味的南法阳光婚礼的理想之选。

宽敞优雅的宴会厅

庄园为您提供一座400平方米的豪华宴会厅，完全符合无障碍标准。裸露的木梁、高挑的天花板与温暖的氛围相得益彰，这个空调空间可舒适容纳多达220位宾客就座。宴会厅配备专业厨房供餐饮团队使用，空间布局灵活，可根据您的装饰需求自由调整。

迷人的户外空间

花园为您的婚礼摄影和户外环节提供了无限可能。林荫大道与法式花园之间，您将找到举办浪漫世俗仪式或树荫下欢乐鸡尾酒会的完美场景。泳池区域则是早午餐的理想之地，让宾客在田园诗般的氛围中尽情享受普罗旺斯温和的气候。

普罗旺斯乡间的悠长时光

为了让您与挚爱之人共度美好时光，我们的套餐包含庄园内6间精品客房的住宿，可容纳多达20位宾客。这些精心装饰的房间让您的亲友能够留在庄园内，将婚礼变成一段真正特别而难忘的经历。普罗旺斯乡间的宁静与庄园建筑之美，将使您在博雷加德庄园的停留成为永恒的记忆。`,
      features: JSON.stringify([
        '18世纪历史庄园，普罗旺斯建筑典范',
        '400平方米豪华宴会厅，可容纳220位宾客',
        '裸露木梁与高挑天花板的温暖空间',
        '专业厨房配备，满足各类餐饮需求',
        '宏伟花园与法式园林设计',
        '林荫大道与浪漫户外仪式场地',
        '泳池区域，田园诗般的早午餐空间',
        '6间精品客房，可容纳20位宾客住宿',
        '距阿维尼翁TGV高铁站仅25分钟',
        '距A7高速公路仅8分钟，交通便利',
        'WeddingWire 5.0满分评分',
        '111条新人好评，100%推荐率',
        '专业婚礼策划团队全程服务',
        '灵活的空间布局与装饰方案',
        '完善的雨天备选方案'
      ]),
      venue_types: JSON.stringify([
        { name: '庄园', name_en: 'Manor & Château' },
        { name: '花园', name_en: 'Garden' },
        { name: '户外场地', name_en: 'Outdoor Venue' }
      ]),
      towns: JSON.stringify([
        { name: 'Monteux', name_cn: '蒙图' },
        { name: 'Avignon', name_cn: '阿维尼翁' },
        { name: 'Carpentras', name_cn: '卡庞特拉' }
      ]),
      budget_ranges: JSON.stringify([
        { label: '场地费详情请联系咨询', min: 0, max: null }
      ]),
      guest_capacities: JSON.stringify(['50-150人', '150-220人']),
      faq: JSON.stringify([
        { q: '庄园可容纳多少位宾客？', a: '宴会厅可舒适容纳多达220位宾客就座，户外空间可容纳更多宾客。' },
        { q: '庄园提供住宿吗？', a: '是的，庄园提供6间精品客房，可容纳多达20位宾客住宿。' },
        { q: '庄园距离阿维尼翁有多远？', a: '距阿维尼翁TGV高铁站25分钟车程，距A7高速公路仅8分钟。' },
        { q: '宴会厅有哪些设施？', a: '宴会厅配备专业厨房、空调系统、裸露木梁装饰，空间布局灵活可调整。' },
        { q: '户外场地有哪些选择？', a: '庄园提供法式花园、林荫大道、泳池区域等多种户外场地选择。' },
        { q: '有雨天备选方案吗？', a: '是的，庄园提供完善的室内备选方案，确保婚礼顺利进行。' },
        { q: '庄园的评分如何？', a: 'WeddingWire评分5.0满分，111条新人好评，100%推荐率。' }
      ]),
      location: '524, Chemin de Beauregard, 84170 Monteux, 普罗旺斯, 法国'
    },
    'le-mas-des-cinq-fontaines': {
      name_cn: '五泉庄园',
      tagline: '普罗旺斯山间的隐秘婚礼圣地',
      description: `五泉庄园（Le Mas des Cinq Fontaines）坐落于普罗旺斯阿尔卑斯山区的西斯特龙小镇，是一座充满魅力的传统普罗旺斯农舍。庄园被薰衣草田、橄榄树林和壮丽的山景环绕，为新人提供了一个远离喧嚣、回归自然的婚礼场所。

庄园的历史建筑保留了普罗旺斯传统的石砌风格，裸露的石墙、古老的木梁和陶土地板营造出温暖而质朴的氛围。宽敞的户外露台可俯瞰山谷全景，是举办仪式和鸡尾酒会的理想之地。

庄园提供灵活的场地布局，可 accommodate 从亲密的小型婚礼到盛大的庆典。户外花园和泳池区域为宾客提供了休闲放松的空间，让婚礼周末成为一段难忘的普罗旺斯体验。

五泉庄园以其宁静的环境、热情的服务和地道的普罗旺斯风情，成为追求独特婚礼体验的新人们的理想之选。`,
      features: JSON.stringify([
        '传统普罗旺斯农舍，石砌建筑风格',
        '薰衣草田与橄榄树林环绕',
        '壮丽山景与山谷全景',
        '宽敞户外露台，仪式与鸡尾酒会场地',
        '泳池区域，宾客休闲空间',
        '灵活场地布局，适应不同规模婚礼',
        '远离喧嚣的隐秘婚礼圣地',
        '地道的普罗旺斯风情体验',
        'WeddingWire 5.0满分评分',
        '76条新人好评',
        '专业婚礼策划服务',
        '可容纳住宿的庄园客房',
        '适合多日婚礼周末体验',
        '自然光线充足的室内空间',
        '完善的餐饮配套设施'
      ]),
      venue_types: JSON.stringify([
        { name: '庄园', name_en: 'Manor & Mas' },
        { name: '户外场地', name_en: 'Outdoor Venue' },
        { name: '花园', name_en: 'Garden' }
      ]),
      towns: JSON.stringify([
        { name: 'Sisteron', name_cn: '西斯特龙' },
        { name: 'Alpes-de-Haute-Provence', name_cn: '上普罗旺斯阿尔卑斯' }
      ]),
      budget_ranges: JSON.stringify([
        { label: '场地费详情请联系咨询', min: 0, max: null }
      ]),
      guest_capacities: JSON.stringify(['50-150人', '150-200人']),
      faq: JSON.stringify([
        { q: '庄园可容纳多少位宾客？', a: '庄园可灵活 accommodate 50至200位宾客，具体取决于场地布局。' },
        { q: '庄园提供住宿吗？', a: '是的，庄园提供客房住宿，适合婚礼周末体验。' },
        { q: '庄园距离最近的城市有多远？', a: '距西斯特龙镇中心约10分钟车程，距马赛约2小时车程。' },
        { q: '户外场地有哪些选择？', a: '庄园提供露台、花园、泳池区域等多种户外场地选择。' },
        { q: '有雨天备选方案吗？', a: '是的，庄园提供室内备选方案，确保婚礼顺利进行。' },
        { q: '庄园的评分如何？', a: 'WeddingWire评分5.0满分，76条新人好评。' }
      ]),
      location: '81, Route de Saint-Geniez, 04200 Sisteron, 上普罗旺斯阿尔卑斯, 法国'
    },
    'la-grange-de-javon': {
      name_cn: '雅冯谷仓庄园',
      tagline: '普罗旺斯高原上的浪漫婚礼庄园',
      description: `雅冯谷仓庄园（La Grange de Javon）位于普罗旺斯高原的索村（Sault），是一座经过精心修复的传统普罗旺斯谷仓。庄园被薰衣草田和壮丽的自然风光环绕，为新人提供了一个独特而浪漫的婚礼场所。

庄园保留了传统的石砌建筑风格，高挑的天花板、裸露的木梁和石墙营造出温暖而质朴的氛围。宽敞的室内空间可 accommodate 大型婚宴，户外露台和花园则为仪式和鸡尾酒会提供了完美的场景。

索村被誉为"世界薰衣草之都"，每年夏季薰衣草盛开时，庄园被紫色的花海环绕，为婚礼增添了无与伦比的浪漫氛围。庄园距离索村镇中心仅几分钟车程，交通便利。

雅冯谷仓庄园以其独特的建筑风格、壮丽的自然景观和热情的服务，成为追求普罗旺斯风情婚礼的新人们的理想之选。`,
      features: JSON.stringify([
        '传统普罗旺斯谷仓，精心修复',
        '薰衣草田环绕，世界薰衣草之都',
        '高挑天花板与裸露木梁',
        '宽敞室内空间，可容纳大型婚宴',
        '户外露台与花园，仪式场地',
        '壮丽的普罗旺斯高原景观',
        '距离索村镇中心仅几分钟车程',
        '夏季薰衣草盛开的浪漫氛围',
        'WeddingWire 5.0满分评分',
        '14条新人好评',
        '专业婚礼策划服务',
        '灵活的场地布局',
        '完善的餐饮配套设施',
        '适合多日婚礼周末体验',
        '自然光线充足的室内空间'
      ]),
      venue_types: JSON.stringify([
        { name: '庄园', name_en: 'Manor & Grange' },
        { name: '户外场地', name_en: 'Outdoor Venue' },
        { name: '花园', name_en: 'Garden' }
      ]),
      towns: JSON.stringify([
        { name: 'Sault', name_cn: '索村' },
        { name: 'Vaucluse', name_cn: '沃克吕兹' }
      ]),
      budget_ranges: JSON.stringify([
        { label: '场地费详情请联系咨询', min: 0, max: null }
      ]),
      guest_capacities: JSON.stringify(['50-150人', '150-200人']),
      faq: JSON.stringify([
        { q: '庄园可容纳多少位宾客？', a: '庄园室内空间可容纳多达200位宾客，户外场地可 accommodate 更多。' },
        { q: '庄园距离索村有多远？', a: '距离索村镇中心仅几分钟车程，交通便利。' },
        { q: '薰衣草什么时候盛开？', a: '每年6月下旬至8月上旬是薰衣草盛开的最佳时期。' },
        { q: '户外场地有哪些选择？', a: '庄园提供露台、花园等多种户外场地选择，可俯瞰普罗旺斯高原景观。' },
        { q: '有雨天备选方案吗？', a: '是的，庄园提供室内备选方案，确保婚礼顺利进行。' },
        { q: '庄园的评分如何？', a: 'WeddingWire评分5.0满分，14条新人好评。' }
      ]),
      location: '227, Chemin des Plaines d\'Imbert, 84390 Sault, 沃克吕兹, 法国'
    }
  }

  for (const [slug, data] of Object.entries(translations)) {
    const [existing] = await pool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [slug])
    if (existing.length === 0) {
      console.log(`⚠️ 场地 ${slug} 不存在，跳过`)
      continue
    }

    await pool.execute(
      `UPDATE crawled_venues SET 
        name_cn = ?, tagline = ?, description = ?, features = ?,
        venue_types = ?, towns = ?, budget_ranges = ?,
        guest_capacities = ?, faq = ?, location = ?
       WHERE slug = ?`,
      [
        data.name_cn, data.tagline, data.description, data.features,
        data.venue_types, data.towns, data.budget_ranges,
        data.guest_capacities, data.faq, data.location, slug
      ]
    )
    console.log(`✅ 已翻译: ${slug} -> ${data.name_cn}`)
  }

  await pool.end()
  console.log('🎉 翻译完成！')
}

main().catch(err => {
  console.error('❌ 翻译失败:', err.message)
  process.exit(1)
})
