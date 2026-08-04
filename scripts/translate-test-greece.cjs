/**
 * 测试希腊场地翻译脚本
 * 将 cv_test_greece / cd_test_greece 中的中文翻译字段填充
 * 
 * 用法: node scripts/translate-test-greece.cjs
 */

require('dotenv').config()
const mysql = require('mysql2/promise')

const SUFFIX = 'test_greece'

const translations = [
  {
    slug: 'test-greece-alsos-nimfon',
    name_cn: '阿尔索斯尼姆丰庄园',
    tagline_cn: '雅典湖畔六英亩私密庄园，自然环绕的梦幻婚礼场地',
    description_cn: `阿尔索斯尼姆丰是位于希腊奥罗佩的婚礼与活动场地，距离雅典约30公里。这片私密的六英亩庄园是新人交换誓言的宁静避风港。自然风光、湖景与专业团队确保每一对新人都拥有难忘的体验。

设施与容量

阿尔索斯尼姆丰俯瞰马拉松纳斯湖，为新人提供在大自然中举办婚礼的迷人氛围。郁郁葱葱的花园、私人泳池和茂盛的树木，营造出如梦似幻的户外婚礼场景。`,
    features: ['雅典近郊六英亩私密庄园', '马拉松纳斯湖迷人湖景', '郁郁葱葱的花园与泳池', '专业婚礼策划团队', '可举办各类社交活动'],
    venue_types: [{ name: 'Wedding Venue', name_cn: '婚礼场地' }],
    towns: [{ name: 'Oropos', name_cn: '奥罗波斯' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '奥罗波斯，希腊'
  },
  {
    slug: 'test-greece-villa-bordeaux-santorini',
    name_cn: '波尔多圣托里尼别墅',
    tagline_cn: '悬崖上的奢华婚礼别墅，尽览爱琴海绝美风光',
    description_cn: `波尔多圣托里尼别墅是位于希腊费拉的目的地婚礼场地。这座奢华别墅坐落于火山口悬崖之上，提供壮丽的爱琴海和岛屿景观作为婚礼仪式背景。现场团队全程陪伴新人的婚礼周末，确保他们尽情享受步入婚姻的美好时刻。一站式全包服务、内部餐饮和奢华住宿，将新人的婚礼日变成一场难忘的盛事。

设施与容量

别墅拥有多个观景露台和无边泳池，可举办从亲密仪式到盛大晚宴的各类婚礼活动。每间客房均享有爱琴海全景，为新人和宾客提供极致的住宿体验。`,
    features: ['火山口悬崖绝佳位置', '爱琴海全景无边视野', '一站式全包婚礼服务', '内部精致餐饮服务', '奢华客房与套房住宿'],
    venue_types: [{ name: 'Villa', name_cn: '别墅' }],
    towns: [{ name: 'Fira', name_cn: '费拉' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '费拉，圣托里尼，希腊'
  },
  {
    slug: 'test-greece-rocabella-santorini-hotel-spa',
    name_cn: '洛卡贝拉圣托里尼酒店水疗中心',
    tagline_cn: '火山口上方的全景奢华酒店，圣托里尼日落婚礼首选',
    description_cn: `洛卡贝拉圣托里尼酒店水疗中心坐落于火山口上方，提供举世闻名的圣托里尼日落全景和宁静而精致的奢华氛围，是举办难忘庆典的终极目的地。

20年婚礼行业经验——超过1000场卓越活动的举办传承，确保您的庆典由真正的专业人士操刀。3个火山口观景点——每个场地都提供令人叹为观止的景色，戏剧性的火山地貌与爱琴海标志性蓝色天际线交相辉映。1间高级餐厅——在优雅环境中为宾客呈现精致美食。3个游泳池——完美的放松空间，适合婚礼前后的休闲娱乐。42间客房与套房——优雅的内部住宿，让您和宾客舒适地共同庆祝。

将您的婚礼打造成一生一次的难忘体验。凭借超过二十年的专业经验和成熟的传承，我们以无与伦比的优雅实现您梦想中的庆典。`,
    features: ['20年婚礼行业专业经验', '三个火山口观景场地', '高级餐厅精致美食', '三个游泳池休闲空间', '42间客房与套房住宿'],
    venue_types: [{ name: 'Hotel', name_cn: '酒店' }],
    towns: [{ name: 'Santorini', name_cn: '圣托里尼' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '圣托里尼，希腊'
  },
  {
    slug: 'test-greece-love-cave',
    name_cn: '爱情洞穴',
    tagline_cn: '伊亚火山口悬崖上的洞穴婚礼场地，俯瞰爱琴海',
    description_cn: `爱情洞穴位于圣托里尼岛著名的伊亚村，是希腊婚礼的理想场地。这座场地坐落于火山口悬崖之上，提供如明信片般美丽的白色房屋和蓝色圆顶教堂景观。这个户外场地为仪式和宴会提供了私密而风景如画的场景。

设施与容量

您的大日子可以在俯瞰伊亚村和宁静爱琴海的露台上举行仪式。在地中海灿烂的阳光下，在亲朋好友面前交换誓言。仪式后，可以以村庄为背景拍摄独一无二的婚纱照。宴会可在同一场地举行，这个宽敞空间可配置座位区、舞池和现场娱乐设施。

住宿

爱情洞穴提供一系列遵循圣托里尼独特建筑风格的精美套房。所有房间都包含优质睡眠和放松住宿所需的一切。日光浴阳台提供大海和村庄的绝佳景观。

服务内容

预订婚礼后，活动团队将确保一切顺利进行。您还可以使用多种租赁选项来装饰活动空间，包括椅子、桌子、布料、家具、灯光等。`,
    features: ['伊亚村火山口悬崖位置', '爱琴海明信片般美景', '私密户外仪式与宴会', '精美套房住宿体验', '全方位婚礼策划服务'],
    venue_types: [{ name: 'Cave', name_cn: '洞穴' }],
    towns: [{ name: 'Oia', name_cn: '伊亚' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '伊亚，圣托里尼，希腊'
  },
  {
    slug: 'test-greece-ktima-orizontes',
    name_cn: '地平线庄园',
    tagline_cn: '雅典七英亩热带花园庄园，瀑布泳池环绕的梦幻场地',
    description_cn: `当郁郁葱葱的绿植、异国情调的棕榈树、壮观的瀑布和两个大型泳池在7.5英亩的区域内融为一体时，便为任何类型的活动创造了一个宏伟的场景。任何类型的社交或商务活动、婚礼或洗礼——以及随后的宴会——都可以在我们设施完善的"地平线庄园"室内和/或室外举行。`,
    features: ['七英亩热带花园景观', '壮观瀑布与双泳池', '棕榈树环绕的异域风情', '室内外多功能活动空间', '完善的婚礼配套设施'],
    venue_types: [{ name: 'Wedding Venue', name_cn: '婚礼场地' }],
    towns: [{ name: 'Athens', name_cn: '雅典' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '雅典，希腊'
  },
  {
    slug: 'test-greece-agaze-bistro-restaurant',
    name_cn: '阿加兹小酒馆餐厅',
    tagline_cn: '圣托里尼白色建筑上的浪漫海景婚礼餐厅',
    description_cn: `阿加兹小酒馆餐厅位于圣托里尼岛皮尔戈斯，是希腊婚礼的理想场地。这座迷人的建筑是圣托里尼的标志性景观。提供海景视野，这座白色建筑为您庆祝人生最珍贵时刻提供了真正浪漫的场景。

设施与容量

订婚派对、排练晚宴和宴会均可在阿加兹小酒馆餐厅举行。您在大日子当天可以使用丰富的室内外活动空间。内部餐厅分两层，空间充裕，可举办现场希腊音乐伴奏的宴会。还有一个大型露台区域，可举办户外鸡尾酒会、小型宴会和持续到深夜的宴会。这个别致的区域非常适合拍照，可与主餐厅空间结合使用。

服务内容

预订大日子后，活动团队将与您密切合作，确保一切顺利进行。他们可以在所有装饰的完整布置和拆除中发挥主导作用。此外，餐厅的餐饮团队可以设计以当地食材为特色的希腊风味菜单。从羊排到经典希腊沙拉，您的地中海庆典将伴随当地传统美食。`,
    features: ['圣托里尼标志性白色建筑', '浪漫海景户外场地', '希腊风味本地食材菜单', '室内外多功能活动空间', '专业婚礼布置与策划'],
    venue_types: [{ name: 'Restaurant', name_cn: '餐厅' }],
    towns: [{ name: 'Pyrgos', name_cn: '皮尔戈斯' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '皮尔戈斯，圣托里尼，希腊'
  },
  {
    slug: 'test-greece-golf-prive-manor-house',
    name_cn: '高尔夫私人庄园',
    tagline_cn: '雅典市中心松林海景庄园，可容纳800位宾客',
    description_cn: `高尔夫私人庄园提供多种房间、用餐区域和私人场地，用于举办独家活动，每个空间都根据特定活动的需求进行定制。

庄园位于市中心核心位置，享有松林的凉爽微风和壮丽的海景，绝对是活动举办的首选之地。高尔夫私人庄园提供多种功能空间、宴会厅和私人场地，每个空间都可适应特定活动的需求。如果您正在考虑公司派对、庆祝晚宴、鸡尾酒会或盛大晚宴，庄园的宴会厅——加上卓越的服务——保证您的活动完美成功。

庄园场地可在不分隔的内部大厅中容纳多达800位就座宾客，可观赏高尔夫花园景观，也可分为三个独立大厅（创造更小的空间），同时举办多个婚礼宴会、鸡尾酒会和活动。户外空间（露台和花园）最大容量可容纳800位就座宾客，非常适合婚礼仪式和鸡尾酒会。

无论您举办的是公司派对、盛大晚宴、鸡尾酒晚会还是团队建设活动，我们的场地将确保您和宾客在舒适和时尚中得到款待。`,
    features: ['雅典市中心绝佳位置', '松林海景自然环境', '最大容纳800位宾客', '可分隔的多功能宴会厅', '全年运营的希腊餐厅'],
    venue_types: [{ name: 'Manor House', name_cn: '庄园' }],
    towns: [{ name: 'Athens', name_cn: '雅典' }],
    budget_ranges: [{ label: '2万-5万欧元', min: 20000, max: 50000 }, { label: '5万-10万欧元', min: 50000, max: 100000 }, { label: '10万欧元以上', min: 100000, max: null }],
    guest_capacities: ['0-40人', '40-80人', '80-120人', '120人以上'],
    location: '雅典，希腊'
  }
]

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

  for (const t of translations) {
    console.log(`翻译: ${t.name_cn} (${t.slug})`)

    // 更新 cv_ 表
    await pool.execute(
      `UPDATE \`${cvTable}\` SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=?, budget_ranges=?, guest_capacities=?, location=? WHERE slug=?`,
      [t.name_cn, t.tagline_cn, t.description_cn, JSON.stringify(t.features), JSON.stringify(t.venue_types), JSON.stringify(t.towns), JSON.stringify(t.budget_ranges), JSON.stringify(t.guest_capacities), t.location, t.slug]
    )

    // 更新 cd_ 表
    await pool.execute(
      `UPDATE \`${cdTable}\` SET name_cn=?, tagline_cn=?, description_cn=?, features=?, venue_types=?, towns=?, budget_ranges=?, guest_capacities=? WHERE slug=?`,
      [t.name_cn, t.tagline_cn, t.description_cn, JSON.stringify(t.features), JSON.stringify(t.venue_types), JSON.stringify(t.towns), JSON.stringify(t.budget_ranges), JSON.stringify(t.guest_capacities), t.slug]
    )

    // 更新 products 表
    await pool.execute(
      `UPDATE products SET name=?, description=? WHERE product_id=?`,
      [t.name_cn, `测试希腊婚礼场地 - ${t.name_cn}`, t.slug]
    )
  }

  await pool.end()
  console.log('\n✅ 所有翻译完成！')
}

main().catch(e => { console.error(e.message); process.exit(1) })
