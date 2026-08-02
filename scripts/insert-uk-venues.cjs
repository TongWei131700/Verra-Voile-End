/**
 * 插入英国前3个婚礼场地数据（已翻译为中文）
 * 用法: node scripts/insert-uk-venues.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

const venues = [
  {
    slug: 'brinsop-court-manor-house-and-barn',
    name: 'Brinsop Court Manor House and Barn',
    name_cn: '布林索普庄园及谷仓',
    country: 'United Kingdom',
    country_cn: '英国',
    source_url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/brinsop-court-manor-house-and-barn--e2189560',
    tagline: '十二世纪护城河庄园，专属你的沉浸式婚礼庆典',
    description: `布林索普庄园是一座始建于12世纪的护城河庄园及谷仓婚礼场地，提供庄园主楼、花园及诺特谷仓的完全私人租赁，为追求真正沉浸式、难忘庆典的新人而设计。

坐落于赫里福德郡乡间，布林索普庄园专为重视以下价值的新人而打造：
——私密性高于场地分租
——氛围高于简单布置
——"套餐式"婚礼体验

每一场在布林索普庄园举办的婚礼都是私人庄园庆典，整个场地和团队将 exclusively 服务于您和您的宾客。

布林索普庄园的独特之处：
——整个庄园独家使用——主楼、谷仓、庭院和花园
——多个室内外婚礼仪式场地，均持有合法执照
——诺特谷仓用于大型晚宴和晚间庆典
——现场住宿及豪华露营村
——专属内部婚礼协调团队
——次日招牌恢复早餐

宾客规模与婚礼风格：
我们可接待最多180位宾客，大多数庆典欢迎60-150位宾客。
虽然小型婚礼也可举办，但布林索普庄园作为完全私人租赁场地运营，无论宾客人数多少，规模、人员配置和体验始终保持高端水准。

价格参考：
布林索普庄园的婚礼通常为中等到较高的五位数英镑投资。
菜单起步价每人85英镑，最终费用取决于宾客人数、季节、星期几及所选体验。
作为独家使用庄园，这里并非经济型或"精简"场地。

餐饮与体验：
所有婚礼均由我们经验丰富的内部餐饮团队提供餐饮服务，确保全天的一致性、品质和流畅服务。从优雅的婚礼早宴到晚间盛宴和轻松的恢复早午餐，美食与款待是布林索普庄园体验的核心。`,
    features: JSON.stringify([
      '12世纪护城河庄园，历史底蕴深厚',
      '整个庄园独家使用，私密性极佳',
      '多个室内外仪式场地，均持合法执照',
      '诺特谷仓大型宴会厅，适合晚宴庆典',
      '现场住宿及豪华露营村',
      '专属内部婚礼协调团队全程服务',
      '次日招牌恢复早餐',
      '内部餐饮团队，菜单起步£85/人',
      '可容纳最多180位宾客',
      '私人主持参观，需提前预约'
    ]),
    venue_types: JSON.stringify([
      { name: '庄园', name_en: 'Manor House' },
      { name: '谷仓与农场', name_en: 'Barns & Farms' },
      { name: '历史场地', name_en: 'Historic Venues' }
    ]),
    towns: JSON.stringify([
      { name: 'Hereford', name_cn: '赫里福德' },
      { name: 'Herefordshire', name_cn: '赫里福德郡' },
      { name: 'United Kingdom', name_cn: '英国' }
    ]),
    images: JSON.stringify([
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/rosie-thomas-4_4_194111-165264426491856.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/rosie-thomas-470_4_194111-165264435624667.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/credit-milly-fletcher-671_4_194111-163924306410544.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/courtyard-lucy-g-weddings_4_194111-170663329587934.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/zw-102_4_194111-165260916177718.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/bp-33_4_194111-165264439487904.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/dsc-0136_4_194111-165264476174658.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/dsc-0098_4_194111-165264475322356.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/zw-163_4_194111-165260935912094.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/JPG/brinsop-cour-20180516103047521.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/laura-martha-photography-brinsop-11-11_4_194111-165264458665644.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/credit-milly-fletcher-58_4_194111-163924302039937.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/wordsworth-outdoor-ceremony_4_194111-165262926568702.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/glamping35_4_194111-165788417789442.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/mandy-paul-wedding-44-of-180_4_194111-167068696733138.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/13-brinsop-court-bailey-web_4_194111-163924354713957.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/brinsop-cour-20180725104314508.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/cg-175_4_194111-165260830265812.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/credit-milly-fletcher-8_4_194111-163924301210000.jpeg',
      'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/brinsop-cour-20180924041401900.jpeg'
    ]),
    budget_ranges: JSON.stringify([{ label: '菜单起步价 £85/人，总费用详情请联系咨询', min: 0, max: null }]),
    guest_capacities: JSON.stringify(['60-150人', '150-180人']),
    faq: JSON.stringify([]),
    cover_image: 'https://cdn0.hitched.co.uk/vendor/4111/3_2/1920/jpg/rosie-thomas-4_4_194111-165264426491856.jpeg',
    rating: '5.0',
    review_count: '131',
    location: 'Brinsop, Hereford, HR4 8LS, 赫里福德郡, 英国',
    sort_order: 1
  },
  {
    slug: 'morden-hall',
    name: 'Morden Hall',
    name_cn: '莫登庄园',
    country: 'United Kingdom',
    country_cn: '英国',
    source_url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/morden-hall--e2229594',
    tagline: '隐于国家信托公园与河畔的优雅乡村庄园',
    description: `莫登庄园坐落于萨顿市，被广阔的英国国家信托公园绿地和私人花园环绕，宁静的旺德尔河从中流过，是伦敦附近一处如画的婚礼场地。这座优雅的乡村庄园在风景如画的公园环境中为您专属绽放，让人感觉远离尘嚣，为大日子营造出逃离都市的绝佳氛围。

一日流程：
全天专属使用，庆典从樱桃套房开始——一间奢华的、阳光充足的现代装饰房间，您可以在仪式开始前与婚礼派对在此放松。随后您将沿着华丽的楼梯隆重登场，在柳柳厅中阳光透过窗户洒入时交换誓言。之后在修剪整齐的草坪上享用户外鸡尾酒接待，举杯庆祝新婚身份，最后进入桑葚套房享用婚礼晚宴。最终与亲朋好友在舞池中尽情欢舞，庆祝人生中最幸福的日子之一。

提供服务：
为了让您的大日子更加特别，我们推荐的餐饮供应商和活动团队将随时协助您设计难忘的一天。您可以与厨师合作创建定制菜单，从休闲餐到五道式精致晚餐及晚间小食应有尽有。每道菜品均达到最高标准，可根据您的需求和口味量身定制。场地全天 exclusively 为您使用。`,
    features: JSON.stringify([
      '场地全天独家使用，尽享私密',
      '国家信托公园绿地环绕，风景如画',
      '旺德尔河畔，远离都市喧嚣',
      '多个仪式空间：柳厅、樱桃套房、桑葚套房',
      '户外草坪仪式与花园鸡尾酒接待',
      '推荐餐饮供应商，定制菜单可选',
      '从休闲餐到五道式精致晚宴',
      '专属婚礼协调员全程协助',
      '橘园、橡厅等多个活动空间',
      '距伦敦市中心仅30分钟车程'
    ]),
    venue_types: JSON.stringify([
      { name: '乡村庄园', name_en: 'Country House' },
      { name: '历史场地', name_en: 'Historic Venues' }
    ]),
    towns: JSON.stringify([
      { name: 'Sutton', name_cn: '萨顿' },
      { name: 'Surrey', name_cn: '萨里郡' },
      { name: 'United Kingdom', name_cn: '英国' }
    ]),
    images: JSON.stringify([
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/rs-886_4_197059-172838956393130.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/cd-summer-morden-hall-wedding-modern-editorial-35mm-film-the-chamberlins-london-wedding-photography-1_4_197059-174611258094869.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/an-134_4_197059-172838690726653.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/kerry-and-shahan-310_4_197059-172838735421185.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/an-442_4_197059-172838687638710.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/reecha-ameel-civil-105_4_197059-172838811317763.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/rs-442_4_197059-172838740652742.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/safiarob-28_4_197059-172838773764730.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/3d4a4910_4_197059-172838988994110.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/cd-summer-morden-hall-wedding-modern-editorial-35mm-film-the-chamberlins-london-wedding-photography-447_4_197059-174611274440225.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/nm0034_4_197059-172838946530963.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/london-wedding-photographer-41_4_197059-172839010498387.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/dl-sneakpeek33_4_197059-172863966891695.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/yasmin-27_4_197059-172838765647509.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/gallery_4_197059-172863936077492.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/jocelyn-joe-joanna-nicole-photography-789-copy_4_197059-172838698063837.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/events_4_197059-172863937417164.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/ch-134_4_197059-172838724780519.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/hazelwilf-hq-6_4_197059-172838805140406.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/micaelakarina-kristinasam-previews-73_4_197059-172838974361395.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/3d4a0845_4_197059-172840038249790.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/cynthia-sam-332_4_197059-172839000734478.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/8g9a4688_4_197059-172838794899622.jpeg',
      'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/an-986_4_197059-172838759165856.jpeg'
    ]),
    budget_ranges: JSON.stringify([{ label: '场地费详情请联系咨询', min: 0, max: null }]),
    guest_capacities: JSON.stringify(['50-120人', '120-200人']),
    faq: JSON.stringify([]),
    cover_image: 'https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/rs-886_4_197059-172838956393130.jpeg',
    rating: '4.9',
    review_count: '60',
    location: 'Morden Hall Road, Sutton, SM4 5JD, 萨里郡, 英国',
    sort_order: 2
  },
  {
    slug: 'st-giles-house',
    name: 'St Giles House',
    name_cn: '圣吉尔斯庄园',
    country: 'United Kingdom',
    country_cn: '英国',
    source_url: 'https://www.weddingwire.com/destination-wedding/united-kingdom/st-giles-house--e2189270',
    tagline: '多塞特乡间的传奇庄园，开启你的奇幻婚礼篇章',
    description: `圣吉尔斯庄园坐落于宁静的多塞特郡乡间，是本地和国际宾客的理想婚礼场地。为您和挚爱提供难忘而独特的体验，在真正魔幻的环境中缔结良缘。

还有太多精彩故事等待书写，太多激动人心的浪漫篇章待续。是时候登上舞台，成为圣吉尔斯庄园传奇故事的一部分。

圣吉尔斯庄园获准在庄园主楼的任何主要房间举行婚礼仪式，最大容量为120位宾客。如果您向往户外仪式，湖畔草坪可欣赏到花园和庄园的绝佳景色；而始建于18世纪、镶嵌着从加勒比海运回的贝壳的石窟，则为最多20位宾客提供独特而亲密的仪式场所。如果您希望举行教堂仪式，圣吉尔斯教堂就在林荫大道的尽头。租一支行进乐队，让宾客从教堂列队行进至庄园，别有一番风味。

被誉为"秘密宝藏"的场地。如果您想让宾客惊叹于出乎意料的惊喜，我们屡获殊荣的地下夜总会和地下酒吧将令人大开眼界。从奢华到"舞"力全开，让夜晚精彩纷呈。

您的预订包含两晚17世纪骑术府的住宿，以及新郎小屋——两间翻新过的公寓，每间可住4人。还可在胡椒瓶小屋和圣吉尔斯庄园卧室获得额外住宿，现场可容纳42位以上宾客入住，步行距离内另有约120位宾客的住宿选择。

是时候成为传奇故事的一部分，在圣吉尔斯庄园开启您的旅程。我们期待与您相遇。

距希思罗机场90英里。
距盖特威克机场113英里。
最近火车站：索尔兹伯里站（25分钟）和伯恩茅斯站（30分钟）。`,
    features: JSON.stringify([
      '18世纪传奇庄园，历史底蕴深厚',
      '多个主厅均可举行婚礼仪式',
      '湖畔草坪户外仪式，景色绝佳',
      '18世纪加勒比贝壳石窟，独特亲密',
      '教堂仪式可选，行进乐队入场',
      '屡获殊荣的地下夜总会和秘密酒吧',
      '17世纪骑术府两晚住宿含在内',
      '新郎小屋及胡椒瓶小屋额外住宿',
      '现场可容纳42+位宾客住宿',
      '最大容量120位宾客'
    ]),
    venue_types: JSON.stringify([
      { name: '历史庄园', name_en: 'Historic Estate' },
      { name: '乡村俱乐部', name_en: 'Country Club' }
    ]),
    towns: JSON.stringify([
      { name: 'Wimborne St. Giles', name_cn: '温伯恩圣吉尔斯' },
      { name: 'Dorset', name_cn: '多塞特郡' },
      { name: 'United Kingdom', name_cn: '英国' }
    ]),
    images: JSON.stringify([
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/kw-imogen-xiana-photography-st-giles-house-5-1_4_115289-176951523874098.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/cj-st-giles-house-wedding-imogen-xiana-7-46_4_115289-174126113567577.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/imogenxiana-stgiles-april2023-8_4_115289-176346192549998.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/the-club_4_115289-165668200784445.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/10091250346-jpg-exif1_4_115289-174126038927818.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/imogenxiana-stgilesopenday-oct23-70_4_115289-176346192547087.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/cl2_4_115289-170955127814517.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/imogenxiana-stgilesopenday-oct23-87_4_115289-170238420343540.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/english-garden-ceremony-st-giles-house-wedding_4_115289-174126035019194.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/6_4_115289-176346193343488.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/cj-st-giles-house-wedding-imogen-xiana-6-63_4_115289-174126076768301.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/jasmine-miles-1102_4_115289-172259804571970.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/st-giles-wedding-holly-clark-photography-h-588_4_115289-167535406912371.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/aimee-liam-sp-by-leah-marie-photography-132_4_115289-176339382368800.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/alexandrajack-942_4_115289-176346204396365.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/om-imogenxiana-wedding-317_4_115289-170238403590079.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/ew-44_4_115289-170238452354478.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/nickhollystgilesweddingbyimogenxiana-10_4_115289-165668519851401.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/r_4_115289-172259828526330.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/ek-stgiles-wedding-imogen-xiana-836_4_115289-166332260642376.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/lisa-sean-wedding-at-st-gilles-by-leah-marie-photography-189-websize_4_115289-171835580011376.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/stgileshousewedding-sabinaeis-londonphotographer-117_4_115289-170955123369455.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/terrace-bar_4_115289-167543917778319.jpeg',
      'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/om-imogenxiana-wedding-1023_4_115289-170238610957347.jpeg'
    ]),
    budget_ranges: JSON.stringify([{ label: '场地费详情请联系咨询', min: 0, max: null }]),
    guest_capacities: JSON.stringify(['50-120人']),
    faq: JSON.stringify([]),
    cover_image: 'https://cdn0.hitched.co.uk/vendor/5289/3_2/1920/jpg/kw-imogen-xiana-photography-st-giles-house-5-1_4_115289-176951523874098.jpeg',
    rating: '5.0',
    review_count: '4',
    location: 'St. Giles House, Wimborne St. Giles, Knowlton, BH21 5NA, 多塞特郡, 英国',
    sort_order: 3
  }
]

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 确保表存在
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_venues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL COMMENT 'URL标识',
      name VARCHAR(300) NOT NULL COMMENT '场地英文名',
      name_cn VARCHAR(300) DEFAULT '' COMMENT '场地中文名',
      country VARCHAR(100) DEFAULT '' COMMENT '国家英文名',
      country_cn VARCHAR(100) DEFAULT '' COMMENT '国家中文名',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      tagline VARCHAR(500) DEFAULT '' COMMENT '副标题/宣传语',
      description TEXT COMMENT '完整描述',
      features JSON COMMENT '特色亮点',
      venue_types JSON COMMENT '场地类型',
      towns JSON COMMENT '位置/城镇',
      images JSON COMMENT '图片URL列表(最多24张)',
      budget_ranges JSON COMMENT '预算区间',
      guest_capacities JSON COMMENT '宾客容量',
      faq JSON COMMENT 'FAQ',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      rating VARCHAR(20) DEFAULT '' COMMENT '评分',
      review_count VARCHAR(20) DEFAULT '0' COMMENT '评论数',
      location VARCHAR(500) DEFAULT '' COMMENT '地址',
      sort_order INT DEFAULT 0 COMMENT '排序',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取场地详情表'
  `)
  console.log('✓ 表 crawled_venues 已就绪')

  for (const v of venues) {
    const [existing] = await pool.execute('SELECT id FROM crawled_venues WHERE slug = ?', [v.slug])
    if (existing.length > 0) {
      console.log(`⚠️ ${v.name_cn} (${v.slug}) 已存在，更新中...`)
      await pool.execute(
        `UPDATE crawled_venues SET 
          name=?, name_cn=?, country=?, country_cn=?, source_url=?, tagline=?,
          description=?, features=?, venue_types=?, towns=?, images=?,
          budget_ranges=?, guest_capacities=?, faq=?, cover_image=?,
          rating=?, review_count=?, location=?, sort_order=?
         WHERE slug=?`,
        [v.name, v.name_cn, v.country, v.country_cn, v.source_url, v.tagline,
         v.description, v.features, v.venue_types, v.towns, v.images,
         v.budget_ranges, v.guest_capacities, v.faq, v.cover_image,
         v.rating, v.review_count, v.location, v.sort_order, v.slug]
      )
    } else {
      console.log(`➕ 插入 ${v.name_cn} (${v.slug})...`)
      await pool.execute(
        `INSERT INTO crawled_venues 
          (slug, name, name_cn, country, country_cn, source_url, tagline, description,
           features, venue_types, towns, images, budget_ranges, guest_capacities,
           faq, cover_image, rating, review_count, location, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.slug, v.name, v.name_cn, v.country, v.country_cn, v.source_url, v.tagline, v.description,
         v.features, v.venue_types, v.towns, v.images, v.budget_ranges, v.guest_capacities,
         v.faq, v.cover_image, v.rating, v.review_count, v.location, v.sort_order]
      )
    }
    console.log(`✅ ${v.name_cn} 已完成`)
  }

  console.log('\n🎉 全部3个英国场地数据已入库！')
  await pool.end()
}

main().catch(err => {
  console.error('❌ 错误:', err.message)
  process.exit(1)
})
