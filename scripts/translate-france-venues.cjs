/**
 * 翻译 crawled_venues 表中58个法国场地的数据为中文
 * 用法: node scripts/translate-france-venues.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

const translations = {
  'domaine-de-beauregard--e2229202': { name_cn: '博雷加德庄园', tagline: '普罗旺斯腹地的十八世纪瑰宝', venue_types: ['庄园','花园','户外场地'] },
  'le-mas-des-cinq-fontaines--e2132875': { name_cn: '五泉庄园', tagline: '普罗旺斯山间的隐秘婚礼圣地', venue_types: ['庄园','户外场地','花园'] },
  'phyllis-kent-events-weddings': { name_cn: '菲利斯·肯特婚礼策划', tagline: '法国高端婚礼策划服务', venue_types: ['婚礼策划','户外场地'] },
  'la-grange-de-javon--e2159329': { name_cn: '雅冯谷仓庄园', tagline: '普罗旺斯高原上的浪漫婚礼庄园', venue_types: ['庄园','户外场地','花园'] },
  'le-domaine-anse-marcel-beach--e2211738': { name_cn: '安斯海滩庄园', tagline: '地中海畔的海滩婚礼胜地', venue_types: ['海滩','户外场地','度假村'] },
  'chateau-la-tour-vaucros--e1950435': { name_cn: '沃克罗塔堡', tagline: '普罗旺斯葡萄园中的古典城堡', venue_types: ['城堡','庄园','花园'] },
  'domaine-la-plume--e2120425': { name_cn: '羽笔庄园', tagline: '法式优雅与自然交融的婚礼场地', venue_types: ['庄园','花园','户外场地'] },
  'kiss-me-in-paris-wedding-planner': { name_cn: '巴黎之吻婚礼策划', tagline: '浪漫巴黎的专属婚礼定制', venue_types: ['婚礼策划','城堡','庄园'] },
  'chateau-de-saint-martin-du-tertre--e2200210': { name_cn: '圣马丁山丘堡', tagline: '法兰西岛森林中的童话城堡', venue_types: ['城堡','庄园','花园'] },
  'mas-de-la-massane--e2234596': { name_cn: '马萨讷农庄', tagline: '南法橄榄树下的田园婚礼', venue_types: ['农庄','户外场地','花园'] },
  'domaine-le-grand-belly--e2092325': { name_cn: '大贝利庄园', tagline: '科西嘉岛上的壮丽自然婚礼', venue_types: ['庄园','户外场地','山景'] },
  'chateau-sentout--e2216644': { name_cn: '桑图堡', tagline: '波尔多地区的典雅婚礼城堡', venue_types: ['城堡','庄园','花园'] },
  'chateau-de-serre-de-parc--e2217626': { name_cn: '塞尔德帕克堡', tagline: '群山环抱的宁静婚礼城堡', venue_types: ['城堡','庄园','户外场地'] },
  'chateau-de-la-faye--e2233222': { name_cn: '拉费堡', tagline: '橡木林中的法式优雅婚礼', venue_types: ['城堡','庄园','花园'] },
  'domaine-d-aveny--e2152703': { name_cn: '阿维尼庄园', tagline: '香槟区森林中的私密婚礼庄园', venue_types: ['庄园','城堡','花园'] },
  'domaine-dares--e2215212': { name_cn: '阿雷斯庄园', tagline: '阿卡雄湾旁的自然婚礼场地', venue_types: ['庄园','户外场地','花园'] },
  'chateau-de-scalibert--e2223360': { name_cn: '斯卡利贝尔堡', tagline: '佩里戈尔地区的浪漫婚礼城堡', venue_types: ['城堡','庄园','花园'] },
  'domaine-de-la-chartrogniere--e2136551': { name_cn: '沙尔特罗尼耶尔庄园', tagline: '香槟葡萄园中的典雅婚礼', venue_types: ['庄园','城堡','花园'] },
  'fleurs-de-prestige--e2219288': { name_cn: '尊享花艺', tagline: '法国高端婚礼花艺定制服务', venue_types: ['婚礼策划','花艺服务'] },
  'domaine-du-grand-lauron--e2197854': { name_cn: '大劳隆庄园', tagline: '普罗旺斯薰衣草田旁的婚礼庄园', venue_types: ['庄园','户外场地','花园'] },
  'chateau-comtesse-lafond--e2215968': { name_cn: '拉丰伯爵夫人堡', tagline: '波尔多葡萄酒产区的贵族城堡', venue_types: ['城堡','庄园','花园'] },
  'chateau-de-la-bourlie--e2225000': { name_cn: '拉布尔利堡', tagline: '多尔多涅河畔的宁静城堡', venue_types: ['城堡','庄园','花园'] },
  'domaine-santa-maria--e2154721': { name_cn: '圣玛丽亚庄园', tagline: '科西嘉岛上的地中海婚礼天堂', venue_types: ['庄园','户外场地','海滩'] },
  'noces-du-monde': { name_cn: '环球婚礼', tagline: '全球目的地婚礼策划专家', venue_types: ['婚礼策划','户外场地'] },
  'abbaye-de-talloires--e2121487': { name_cn: '塔卢瓦尔修道院', tagline: '安纳西湖畔的千年修道院婚礼', venue_types: ['修道院','湖畔','花园'] },
  'les-domaines-de-patras--e2142416': { name_cn: '帕特拉庄园', tagline: '卢瓦尔河谷的优雅庄园婚礼', venue_types: ['庄园','城堡','花园'] },
  'chateau-de-la-jarthe--e2224724': { name_cn: '雅尔特堡', tagline: '波尔多地区的精致婚礼城堡', venue_types: ['城堡','庄园','花园'] },
  'la-faiseuse-de-reves--e2233224': { name_cn: '织梦庄园', tagline: '编织梦想中的法式婚礼', venue_types: ['庄园','户外场地','花园'] },
  'chateau-de-la-colaissiere--e1950453': { name_cn: '拉科莱西耶尔堡', tagline: '布列塔尼的古典城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-pimo--e2214730': { name_cn: '皮莫堡', tagline: '南法普罗旺斯的精品城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'la-dime-de-giverny--e1992655': { name_cn: '吉维尼十分之一税所', tagline: '莫奈花园旁的艺术婚礼场地', venue_types: ['庄园','花园','户外场地'] },
  'le-mas-de-la-rose--e2096297': { name_cn: '玫瑰农庄', tagline: '普罗旺斯玫瑰园中的浪漫婚礼', venue_types: ['农庄','花园','户外场地'] },
  'chateau-de-laurentie--e2213646': { name_cn: '洛朗蒂堡', tagline: '图尔大区森林中的隐秘城堡', venue_types: ['城堡','庄园','花园'] },
  'chateau-des-briottieres--e2042507': { name_cn: '布里奥蒂耶尔堡', tagline: '卢瓦尔河谷的文艺复兴城堡', venue_types: ['城堡','庄园','花园'] },
  'rocabella--e2216044': { name_cn: '洛卡贝拉', tagline: '地中海悬崖上的浪漫婚礼', venue_types: ['户外场地','花园','度假村'] },
  'le-petit-roulet--e2114615': { name_cn: '小鲁莱庄园', tagline: '波尔多乡间的温馨婚礼场地', venue_types: ['庄园','花园','户外场地'] },
  'alliance-revee': { name_cn: '梦幻联盟', tagline: '梦想婚礼的策划专家', venue_types: ['婚礼策划','城堡','庄园'] },
  'white-house-cannes--e2209162': { name_cn: '戛纳白宫', tagline: '蔚蓝海岸的奢华婚礼场地', venue_types: ['庄园','户外场地','花园'] },
  'chateau-heloise--e2236838': { name_cn: '埃洛伊斯堡', tagline: '巴黎近郊的浪漫城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-de-tresserve--e2001745': { name_cn: '特雷塞尔沃堡', tagline: '萨瓦地区的湖畔城堡婚礼', venue_types: ['城堡','湖畔','花园'] },
  'chateau-de-courcelles-le-roy--e2008027': { name_cn: '库塞尔堡', tagline: '勃艮第地区的典雅城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-le-chereau--e2234246': { name_cn: '谢罗堡', tagline: '卢瓦尔河谷的水上城堡', venue_types: ['城堡','庄园','花园'] },
  'lmk-events--e2233234': { name_cn: 'LMK活动策划', tagline: '法国专业婚礼活动策划', venue_types: ['婚礼策划','户外场地'] },
  'chateau-de-seguin--e2099525': { name_cn: '塞吉尼堡', tagline: '波尔多葡萄园中的婚礼城堡', venue_types: ['城堡','庄园','花园'] },
  'chateau-des-perrais--e2233910': { name_cn: '佩雷堡', tagline: '卢瓦尔河谷的宁静庄园婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-de-la-noe-seche--e2233988': { name_cn: '拉诺埃塞什堡', tagline: '布列塔尼的古典庄园婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-saint-laurent--e2207142': { name_cn: '圣洛朗堡', tagline: '普罗旺斯阳光下的城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'la-tresoriere--e2191310': { name_cn: '拉特雷索里耶尔', tagline: '昂热市中心的河畔婚礼庄园', venue_types: ['庄园','河畔','花园'] },
  'chateau-de-la-pascalette--e2232310': { name_cn: '帕斯卡莱特堡', tagline: '普罗旺斯薰衣草庄园的婚礼', venue_types: ['城堡','庄园','花园'] },
  'samantha-bottelier-events': { name_cn: '萨曼莎·博特利耶活动策划', tagline: '法国高端婚礼策划与设计', venue_types: ['婚礼策划','户外场地'] },
  'les-jardins-darlias-by-la-villa-alexandra--e2218082': { name_cn: '阿利亚斯花园·亚历山德拉别墅', tagline: '蔚蓝海岸的花园别墅婚礼', venue_types: ['庄园','花园','户外场地'] },
  'chateau-le-fresne--e2090847': { name_cn: '弗雷纳堡', tagline: '香槟区的优雅城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-de-thorens--e2108701': { name_cn: '托朗堡', tagline: '阿尔卑斯山脚下的历史城堡', venue_types: ['城堡','庄园','花园'] },
  'domaine-terra-rosa--e2191838': { name_cn: '玫瑰大地庄园', tagline: '普罗旺斯玫瑰色的婚礼庄园', venue_types: ['庄园','花园','户外场地'] },
  'chateau-de-vergieres--e2211030': { name_cn: '韦尔日耶堡', tagline: '巴黎近郊的精致城堡婚礼', venue_types: ['城堡','庄园','花园'] },
  'chateau-de-chaumontel--e2221826': { name_cn: '肖蒙泰尔堡', tagline: '法兰西岛的典雅庄园婚礼', venue_types: ['城堡','庄园','花园'] },
  'dream-paris-wedding': { name_cn: '巴黎之梦婚礼', tagline: '巴黎梦想婚礼的缔造者', venue_types: ['婚礼策划','城堡','庄园'] },
  'couvent-notre-dame-des-pres--e2162793': { name_cn: '田野圣母修道院', tagline: '普罗旺斯修道院中的庄严婚礼', venue_types: ['修道院','庄园','花园'] },
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  let updated = 0, skipped = 0
  for (const [slug, t] of Object.entries(translations)) {
    const [existing] = await pool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [slug])
    if (existing.length === 0) {
      console.log(`⚠️ 不存在，跳过: ${slug}`)
      skipped++
      continue
    }

    const venueTypesJson = JSON.stringify(t.venue_types.map(name => ({ name, name_en: name })))

    await pool.execute(
      `UPDATE crawled_venues SET name_cn = ?, tagline = ?, venue_types = ? WHERE slug = ?`,
      [t.name_cn, t.tagline, venueTypesJson, slug]
    )
    console.log(`✅ ${t.name_cn} (${slug})`)
    updated++
  }

  console.log(`\n🎉 翻译完成！更新: ${updated}, 跳过: ${skipped}`)
  await pool.end()
}

main().catch(err => {
  console.error('❌ 翻译失败:', err.message)
  process.exit(1)
})
