const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile'
  })

  // ===== Villa Bordeaux Santorini =====
  const vbData = {
    slug: 'villa-bordeaux-santorini',
    name: 'Villa Bordeaux Santorini',
    name_cn: '波尔多圣托里尼别墅',
    country: 'Greece',
    country_cn: '希腊',
    source_url: 'https://www.weddingwire.com/biz/villa-bordeaux-santorini/dddd83f70e6872e8.html',
    tagline: '圣托里尼悬崖上的奢华婚礼殿堂，爱琴海日落见证永恒誓约',
    description: `Villa Bordeaux Santorini 是位于希腊 Fira 的目的地婚礼场地。坐落于 Caldera 悬崖之上，这个奢华的环境提供了爱琴海和岛屿的壮丽景色作为仪式背景。现场团队在整个婚礼周末陪伴新人，确保他们充分享受婚姻生活的第一步。其全包套餐、内部餐饮和奢华住宿可以将任何人的婚礼日变成难忘的盛事。\n\n团队将与新人密切合作，帮助策划目的地婚礼。他们提供场地布置和拆卸服务，让新人有充足的时间专注于重要的事情。桌子、椅子和亚麻布将提供并按您喜欢的任何形式布置。服务员将在鸡尾酒会和婚宴期间全程在场，确保每位宾客的美食需求得到满足。\n\n别墅的主厨 La Colline Restaurant 提供各式时令菜肴，从新鲜海鲜到炭烤佳肴，以及鸡尾酒会的小吃选择。宾客还可以在夜晚结束时享用甜点，包括冰沙、苹果派和令人垂涎的巧克力创作。\n\n新人可以在海滩上举行仪式，以美丽的海洋为背景。然后在舞池上翩翩起舞，举办一场难忘的庆典。`,
    features: [
      'Caldera悬崖上的奢华婚礼场地',
      '爱琴海和火山岛壮丽景色',
      '全包套餐与内部餐饮',
      'La Colline Restaurant 主厨定制菜单',
      '新鲜海鲜与炭烤佳肴',
      '奢华住宿（仅4间套房，极致私密）',
      '海滩仪式与舞池庆典',
      'Google 4.8分（139条评论）',
      '2-60位宾客的私密婚礼',
      '仪式+婚宴+住宿一站式服务',
      '全年温和的圣托里尼气候',
      '专属婚礼策划团队全程陪伴'
    ],
    venue_types: [
      { name: '历史建筑', name_en: 'Historic Building' },
      { name: '度假村', name_en: 'Resort' },
      { name: '餐厅', name_en: 'Restaurant' }
    ],
    towns: [
      { name: 'Fira', name_cn: '菲拉' },
      { name: 'Santorini', name_cn: '圣托里尼' }
    ],
    // 精选12张最佳图片（全部1920px横版原链接）
    images: [
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/rt0b6687_51_2039029-162463375989937.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villa-bordeaux-santorini-island-160622-122-1_51_2039029-166747476785690.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villa-bordeaux-santorini-island-160622-127-1_51_2039029-166747476446353.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villa-bordeaux-santorini-island-160622-114-2_51_2039029-166747476420883.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villa-bordeaux-santorini-island-160622-121-1_51_2039029-166747476481333.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/santorinivillabordeaux3996v_51_2039029-162463377333143.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/drz-bvillas-e9a6877_51_2039029-162463370836549.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/drz-bvillas-e9a6857_51_2039029-162463370740338.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/santorinivillabordeaux5260v-p_51_2039029-162463378110578.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villabordeaux-37357182-525747434508274-483500364184682496-n_51_2039029-162463377420630.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/drz-bvillas-q1a7502_51_2039029-162463372025875.jpeg',
      'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/santorinivillabordeaux3872v-p-1_51_2039029-164312017280069.jpeg'
    ],
    // 头图选悬崖全景（最宽最广）
    cover_image: 'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villa-bordeaux-santorini-island-160622-122-1_51_2039029-166747476785690.jpeg',
    budget_ranges: [
      { label: '$6,500 仪式/婚宴起步', min: 6500, max: 6500 },
      { label: '$18,200 平均花费', min: 18200, max: 18200 }
    ],
    guest_capacities: ['2-60人'],
    faq: [
      { q: '婚宴场地费起步价是多少？', a: '$6,500（旺季和淡季同价）' },
      { q: '仪式场地费起步价是多少？', a: '$6,500（旺季和淡季同价）' },
      { q: '场地起步费包含哪些项目？', a: '椅子、桌布、桌子' },
      { q: '婚礼餐饮费用包含哪些？', a: '甜点、服务员' },
      { q: '酒吧服务每人起步价是多少？', a: '$200/人' },
      { q: '酒吧服务包含哪些？', a: '调酒师、香槟祝酒、家酿啤酒、家酿烈酒、家酿葡萄酒、限量酒吧、开放酒吧、高级烈酒、特调饮品、精酿啤酒、特选葡萄酒' },
      { q: '最低宾客人数是多少？', a: '2人' },
      { q: '场地有多少活动空间？', a: '4个房间，2个室内用餐区，1个室外餐厅空间' },
      { q: '场地特征是什么？', a: '历史建筑、酒店、阁楼、豪宅、码头、度假村、餐厅、屋顶、海滨、酒庄' },
      { q: '提供哪些室内/室外选项？', a: '室内、无遮盖室外' },
      { q: '提供哪些婚礼活动类型？', a: '仪式、婚宴、订婚派对、私奔婚礼、彩排晚宴' },
      { q: '提供哪些服务？', a: '住宿、酒吧服务、餐饮服务、清洁、婚礼策划、活动租赁、化妆准备室、允许宠物、WiFi' },
      { q: '提供哪些餐饮服务？', a: '自助餐、鸡尾酒会、甜点、法式服务、小吃、位上餐、服务员、试菜' },
      { q: '提供哪些家具和装饰？', a: '椅子、椅套、帷幔、家具、桌子' },
      { q: '旺季包含哪些月份？', a: '6月、7月、8月、9月' },
      { q: '淡季包含哪些月份？', a: '4月、5月、10月、11月' }
    ]
  }

  // 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_destinations WHERE slug = ?', [vbData.slug])
  
  if (existing.length > 0) {
    // 更新已有数据
    await pool.execute(
      `UPDATE crawled_destinations SET name_cn=?, tagline=?, description=?, features=?, venue_types=?, towns=?, images=?, cover_image=?, budget_ranges=?, guest_capacities=?, faq=? WHERE slug=?`,
      [vbData.name_cn, vbData.tagline, vbData.description, JSON.stringify(vbData.features), JSON.stringify(vbData.venue_types), JSON.stringify(vbData.towns), JSON.stringify(vbData.images), vbData.cover_image, JSON.stringify(vbData.budget_ranges), JSON.stringify(vbData.guest_capacities), JSON.stringify(vbData.faq), vbData.slug]
    )
    console.log(`✓ 已更新: ${vbData.name_cn} (${vbData.slug})`)
  } else {
    // 插入新数据
    await pool.execute(
      `INSERT INTO crawled_destinations (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, faq, cover_image, cover_image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vbData.slug, vbData.name, vbData.name_cn, vbData.country, vbData.country_cn, vbData.source_url, vbData.tagline, vbData.description, JSON.stringify(vbData.features), JSON.stringify(vbData.venue_types), JSON.stringify(vbData.towns), JSON.stringify(vbData.images), JSON.stringify(vbData.budget_ranges), JSON.stringify(vbData.guest_capacities), JSON.stringify(vbData.faq), vbData.cover_image, vbData.cover_image, 21]
    )
    console.log(`✓ 已插入: ${vbData.name_cn} (${vbData.slug})`)
  }

  // 验证
  const [rows] = await pool.execute("SELECT name_cn, JSON_LENGTH(images) as img_cnt, JSON_LENGTH(faq) as faq_cnt FROM crawled_destinations WHERE slug=?", [vbData.slug])
  console.log(`验证: ${rows[0].name_cn}, 图片=${rows[0].img_cnt}, FAQ=${rows[0].faq_cnt}`)

  await pool.end()
}

main().catch(console.error)
