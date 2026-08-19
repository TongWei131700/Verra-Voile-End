/**
 * 插入 Flowers by Árvore De Luz 花店数据到 crawled_florists 表
 * 数据来源：flowersbyarvoredeluz.com 爬取
 */
const mysql = require('mysql2/promise')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 1. 确保表存在
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_florists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL,
      name VARCHAR(200) NOT NULL,
      name_cn VARCHAR(200) DEFAULT '',
      source_url VARCHAR(500) DEFAULT '',
      country VARCHAR(100) DEFAULT '',
      country_cn VARCHAR(100) DEFAULT '',
      city VARCHAR(100) DEFAULT '',
      city_cn VARCHAR(100) DEFAULT '',
      tagline VARCHAR(500) DEFAULT '',
      description TEXT,
      founded_year INT DEFAULT NULL,
      team_members JSON,
      services JSON,
      specialties JSON,
      design_process JSON,
      pricing_comparison JSON,
      wedding_venues JSON,
      wedding_stories JSON,
      fresh_flower_products JSON,
      infinity_rose_products JSON,
      testimonials JSON,
      faq JSON,
      portfolio_images JSON,
      cover_image VARCHAR(500) DEFAULT '',
      headshot VARCHAR(500) DEFAULT '',
      website VARCHAR(500) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      email VARCHAR(200) DEFAULT '',
      address VARCHAR(500) DEFAULT '',
      rating JSON,
      media_features JSON,
      price INT DEFAULT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
  console.log('✓ 表 crawled_florists 已就绪')

  // 2. 检查是否已存在
  const [existing] = await pool.execute('SELECT id FROM crawled_florists WHERE slug = ?', ['flowers-by-arvore-de-luz'])
  if (existing.length > 0) {
    console.log('⚠ 已存在，先删除旧数据...')
    await pool.execute('DELETE FROM crawled_florists WHERE slug = ?', ['flowers-by-arvore-de-luz'])
  }

  // 3. 插入数据
  await pool.execute(
    `INSERT INTO crawled_florists
     (slug, name, name_cn, source_url, country, country_cn, city, city_cn,
      tagline, description, founded_year,
      team_members, services, specialties, design_process, pricing_comparison,
      wedding_venues, wedding_stories, fresh_flower_products, infinity_rose_products,
      testimonials, faq, portfolio_images,
      cover_image, headshot, website, phone, email, address,
      rating, media_features, price, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      'flowers-by-arvore-de-luz',
      'Flowers by Árvore De Luz',
      '光之树花艺',
      'https://www.flowersbyarvoredeluz.com/',
      'United States',
      '美国',
      'Southern California',
      '南加州',
      '南加州全方位婚礼与活动花艺设计工作室，免费定制咨询',
      `Flowers by Árvore De Luz（光之树花艺）是一家位于南加州的全方位服务婚礼与活动花艺工作室，由 Melissa 创立并主理。从初次咨询到最终呈现，团队与每对新人紧密合作，设计并打造独一无二的花艺作品，将你们的婚礼愿景变为现实。工作室提供免费的初次咨询和报价服务，服务范围覆盖整个南加州及目的地婚礼。Melissa 擅长将新人的想法整合为统一的花艺视觉，同时兼顾预算，打造梦幻般的婚礼花艺景观。`,
      null,
      JSON.stringify([
        {
          name: 'Melissa', name_cn: '梅丽莎',
          role: 'Founder & Lead Floral Designer', role_cn: '创始人兼首席花艺设计师',
          description: 'Melissa 是 Flowers by Árvore De Luz 的创始人和首席花艺师。她擅长倾听每对新人的想法，帮助他们将创意整合为统一的视觉方案，同时兼顾预算。从花束设计到大型场地花艺，Melissa 用她的才华和热情让每场婚礼都成为梦想中的样子。',
          image: '',
        },
      ]),
      JSON.stringify([
        {
          title: 'Wedding Florals', title_cn: '婚礼花艺',
          items: [
            { label: 'Bridal Bouquets', label_cn: '新娘手捧花', desc: '根据新人风格定制的个性化手捧花' },
            { label: 'Ceremony & Reception Florals', label_cn: '仪式与婚宴花艺', desc: '花拱、通道装饰、桌花、场地布置' },
            { label: 'Boutonnieres & Corsages', label_cn: '胸花与腕花', desc: '为伴郎团、家人和贵宾定制' },
            { label: 'Custom Floral Installations', label_cn: '定制花艺装置', desc: '大型沉浸式花艺艺术创作' },
            { label: 'Table Centerpieces', label_cn: '桌花中央装饰', desc: '从精致单品到连续桌面花带' },
          ],
        },
        {
          title: 'Everyday & Gift Flowers', title_cn: '日常与礼品花艺',
          items: [
            { label: 'Custom Bouquets', label_cn: '定制花束', desc: '根据喜好定制的每日花束' },
            { label: 'Gift Arrangements', label_cn: '礼品花艺', desc: '适合各种场合的精美花艺礼品' },
            { label: 'Sympathy & Memorials', label_cn: '慰问与纪念花艺', desc: '表达关怀与敬意的花艺作品' },
          ],
        },
      ]),
      JSON.stringify(['婚礼花艺', '南加州目的地婚礼', '免费定制咨询', '全方位花艺服务', '日常花束', '礼品花艺']),
      JSON.stringify([
        { step: 1, title: 'Free Consultation', title_cn: '免费咨询', desc: '初次咨询和报价完全免费。通过电话或短信与 Melissa 沟通，分享你们的婚礼愿景、风格偏好和预算。' },
        { step: 2, title: 'Design Your Vision', title_cn: '设计你的愿景', desc: 'Melissa 帮助你们整理想法，将创意转化为统一的花艺方案，从花材选择到色彩搭配，每个细节都量身定制。' },
        { step: 3, title: 'Refine Every Detail', title_cn: '精炼每个细节', desc: '反复沟通调整，确保花艺方案完美契合你们的婚礼主题和场地，同时保持在预算范围内。' },
        { step: 4, title: 'Dream Wedding Day', title_cn: '梦幻婚礼日', desc: '婚礼当天，团队负责所有花艺的布置和交付。你们只需享受这特别的一天，感受花艺带来的魔法。' },
      ]),
      null, // pricing_comparison
      JSON.stringify([
        { name: 'Green Gables Estate', name_cn: '绿盖布庄园', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/d835b6c1-c552-4a85-abe6-0f7cebd9b0ca/IMG_7811.jpeg' },
        { name: 'Safari Park', name_cn: '野生动物园', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735673395062-3N0TTSPGR57OZR6IE8YK/Barashy%2B018_websize.jpg' },
        { name: 'Tivoli, Fallbrook', name_cn: '蒂沃利，法尔布鲁克', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735830144092-EZJYWTF7QJ2J1IBU090C/DSC_7353_Original.jpg' },
        { name: "Tom Ham's Lighthouse", name_cn: '汤姆汉姆灯塔', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735832494835-W68VJK7E1U0XDFKE4AQ7/GRP_2812.jpg' },
        { name: 'Leo Carrillo Ranch', name_cn: '莱奥卡里略牧场', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735842124805-2542WKIOI5YQC7F7IZO3/IMG_6539.jpg' },
        { name: 'Brooklyn Winery', name_cn: '布鲁克林酒庄', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735839807322-61Y1P9F9SBGJZSUUXH5I/KateEdwardsWeddings_Erin%2526Serge_Wedding-267.jpg' },
      ]),
      JSON.stringify([
        { venue: 'Green Gables Estate, San Marcos', venue_cn: '绿盖布庄园，圣马科斯', tagline: 'A DREAM COME TRUE', tagline_cn: '梦想成真', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/9157bd37-ac03-451b-ad35-aab3c5724fd1/IMG_7821.JPG' },
        { venue: 'Safari Park, San Diego', venue_cn: '野生动物园，圣迭戈', tagline: 'VISION BROUGHT TO LIFE', tagline_cn: '愿景化为现实', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735673427574-C7NUO8Q5FOQJKHZ1X2SI/Barashy%2B375_websize.jpg' },
        { venue: 'Tivoli, Fallbrook', venue_cn: '蒂沃利，法尔布鲁克', tagline: 'AMAZING FLORALS WITHIN BUDGET', tagline_cn: '预算内的惊艳花艺', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/8c7cc5b8-23e4-4c96-b7e1-cb17e1e72f94/DSC_1314_Original.jpg' },
        { venue: 'Leo Carrillo Ranch, Carlsbad', venue_cn: '莱奥卡里略牧场，卡尔斯巴德', tagline: 'A DREAM WEDDING LANDSCAPE', tagline_cn: '梦幻婚礼场景', image: 'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735842085613-8VFT6723P4XJR6JMKZ23/IMG_4309.jpg' },
      ]),
      JSON.stringify([
        // 日常花束产品（原网站真实在售商品，有价格）
        { slug: 'dahlia-dreams', name: 'Dahlia Dreams', name_cn: '大丽花之梦', price: 256, price_from: false, category: '日常花束', image: '/uploads/crawled/flowers-by-arvore-de-luz/products/dahlia-dreams.jpg', desc: 'Dahlias, Clematis, Spray Roses, Stock in bright magenta, lavender, purple and yellow tones, set in a medium-large white or gold vase. Approximate finished size 16-24" oblong.', desc_cn: '大丽花、铁线莲、喷雾玫瑰、紫罗兰，明亮洋红、薰衣草、紫色和黄色调，置于中大号白色或金色花瓶中。成品尺寸约16-24英寸椭圆。' },
        { slug: 'english-cottage', name: 'English Cottage', name_cn: '英式乡村', price: 145, price_from: false, category: '日常花束', image: '/uploads/crawled/flowers-by-arvore-de-luz/products/english-cottage.jpg', desc: 'A pretty arrangement like fresh picked from an English Garden. White Hydrangeas, Gerbera Daisy, Larkspur, Carnations, Snapdragons and Helleborus, set in a low white ceramic vase.', desc_cn: '如同从英式花园中新鲜采摘的美丽花艺。白色绣球花、非洲菊、飞燕草、康乃馨、金鱼草和铁筷子，置于矮白色陶瓷花瓶中。' },
        { slug: 'cream-pastels', name: 'Cream & Pastels Arrangement', name_cn: '奶油 pastel 花艺', price: 165, price_from: false, category: '日常花束', image: '/uploads/crawled/flowers-by-arvore-de-luz/products/cream-pastels.jpg', desc: 'Two dozen Roses with Veronica, Stock, Rice or Wax Flower, Alstroemerias in soft pinks, peaches, creams and pastel tones set in a clear or white vase.', desc_cn: '两打玫瑰搭配紫罗兰、紫罗兰、米粒花或蜡花、阿斯特罗梅里亚，柔和粉色、桃色、奶油色和淡彩色调，置于透明或白色花瓶中。' },
        { slug: 'sweet-garden', name: 'Sweet Garden Collection', name_cn: '甜蜜花园', price: 98, price_from: false, category: '日常花束', image: '/uploads/crawled/flowers-by-arvore-de-luz/products/sweet-garden.jpg', desc: 'Large mix of florist choice in-season garden flowers like Sweet Peas, Roses, Stock, Wax Flower, Orlaya, Spray Roses and others.', desc_cn: '花艺师精选当季花园花卉大混搭，如甜豌豆、玫瑰、紫罗兰、蜡花、奥兰亚、喷雾玫瑰等。' },
        { slug: 'blueberry-blush', name: 'Blueberry Blush Compote', name_cn: '蓝莓红晕花艺', price: 268, price_from: false, category: '日常花束', image: '/uploads/crawled/flowers-by-arvore-de-luz/products/blueberry-blush.jpg', desc: 'Luscious romantic arrangement in large gold compote featuring two dozen deep red-burgundy Blueberry Roses and White Cotton Explosion Roses, Stock, Rice Flower, Ferns, Camellia and lush greens.', desc_cn: '奢华浪漫花艺置于大号金色高脚碗中， featuring 两打深红紫红色蓝莓玫瑰和白色棉花爆炸玫瑰、紫罗兰、米粒花、蕨类、山茶花和丰富绿叶。' },
        { slug: 'fifty-shades-pink', name: 'Fifty Shades of Pink', name_cn: '五十度粉', price: 168, price_from: false, category: '日常花束', image: '/uploads/crawled/flowers-by-arvore-de-luz/products/fifty-shades-pink.jpg', desc: 'A lipstick inspired collection of pinks and coral featuring Peonies, Dahlias, Roses and more in a deep white ceramic bowl. Large centerpiece display.', desc_cn: '口红灵感的粉色和珊瑚色系列， featuring 牡丹、大丽花、玫瑰等，置于深白色陶瓷碗中。大型中央展示花艺。' },
      ]),
      JSON.stringify([]), // infinity_rose_products
      JSON.stringify([
        { couple: 'Lauren & Casey', text: 'Thank you for everything! You made my wedding literally look like a dream. I was so incredibly happy with my florals.', text_cn: '感谢你们的一切！你们让我的婚礼真的看起来像一场梦。我对花艺感到非常满意。', venue: 'Green Gables Estate, San Marcos' },
        { couple: 'Ofir & Alexis', text: 'Melissa was so great to work with, she helped me rein in all of my ideas to make my vision come true.', text_cn: 'Melissa 非常棒，她帮我整理了所有想法，让我的愿景成为现实。', venue: 'Safari Park, San Diego' },
        { couple: 'Michael & Sally', text: 'Melissa is amazing! She was able to work through my ideas with me while keeping my budget in mind, and in the end, she brought my vision to life. I would recommend her to any bride looking for a florist.', text_cn: 'Melissa 太棒了！她能在考虑我预算的同时帮我梳理想法，最终将我的愿景变为现实。我向所有寻找花艺师的新娘推荐她。', venue: 'Tivoli, Fallbrook' },
        { couple: 'Mike & Alex', text: 'Flowers by Árvore De Luz completely exceeded our expectations and made our wedding look like a dream wedding landscape.', text_cn: '光之树花艺完全超出了我们的期望，让我们的婚礼看起来像梦幻般的婚礼场景。', venue: 'Leo Carrillo Ranch, Carlsbad' },
        { couple: 'Serge & Erin', text: 'Melissa and her team made my wedding dreams come true! Every single arrangement was absolutely gorgeous. I got so many compliments on the florals at my wedding they truly made the evening magical.', text_cn: 'Melissa 和她的团队让我的婚礼梦想成真！每个花艺作品都绝对华丽。我收到了太多关于婚礼花艺的赞美，它们真的让夜晚变得魔幻。', venue: 'Brooklyn Winery, Brooklyn NY' },
      ]),
      null, // faq
      JSON.stringify([
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/d835b6c1-c552-4a85-abe6-0f7cebd9b0ca/IMG_7811.jpeg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/34109869-44a6-4600-a0b6-c4e2d73422e6/IMG_7812+2.JPEG',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/9157bd37-ac03-451b-ad35-aab3c5724fd1/IMG_7821.JPG',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/fa2a9b83-f32d-4d30-97e6-41900200ccc5/IMG_7803.JPG',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/5d6c2965-bf22-4fff-8b7e-57484db202f1/IMG_0472.JPG',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/b1d3976c-6a3f-4950-b356-ec1926a1389a/IMG_7786.JPG',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735673395062-3N0TTSPGR57OZR6IE8YK/Barashy%2B018_websize.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735830612161-PXS4LF0DTS2LSA6OPW07/Barashy%252B485_websize.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735673427574-C7NUO8Q5FOQJKHZ1X2SI/Barashy%2B375_websize.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735832591144-H0489VP3QVF5TLZFUG4L/Barashy%25252B346_websize.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735830144092-EZJYWTF7QJ2J1IBU090C/DSC_7353_Original.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/8c7cc5b8-23e4-4c96-b7e1-cb17e1e72f94/DSC_1314_Original.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735840085797-WA7IM7C4PC03Q4Q9BEV8/DSC_7429_Original.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735832494835-W68VJK7E1U0XDFKE4AQ7/GRP_2812.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735832509873-WQP7F0TELJDJOS4CZXHW/image0.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735832530163-LYA94EEA4XY2EQZSR3PI/image4.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735842124805-2542WKIOI5YQC7F7IZO3/IMG_6539.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735842085613-8VFT6723P4XJR6JMKZ23/IMG_4309.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735842106827-XYKTC2CXI3DD1PWV6RZQ/IMG_6640.jpg',
        'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/1735842115214-032R3LMNN47GWOOTR46J/IMG_6428.jpg',
      ]),
      'https://images.squarespace-cdn.com/content/v1/673b4f46d56154461893b5e4/8b84aa16-94c8-42d6-a157-bb8aaa736e22/IMG_7803.jpg',
      '', // headshot
      'https://www.flowersbyarvoredeluz.com/',
      '4252132040',
      'melissaA@arvoredeluz.com',
      'Southern California, USA',
      null, // rating
      null, // media_features
      98,   // price - 最低产品价格
      2,    // sort_order
    ]
  )

  console.log('✓ Flowers by Árvore De Luz 数据插入成功')

  // 4. 验证
  const [rows] = await pool.execute('SELECT slug, name, name_cn, city, city_cn FROM crawled_florists')
  console.log(`当前花店列表（${rows.length} 家）:`)
  rows.forEach(r => console.log(`  - ${r.slug} | ${r.name} | ${r.name_cn} | ${r.city}, ${r.city_cn}`))

  await pool.end()
  console.log('✓ 完成')
}

run().catch(err => { console.error('插入失败:', err); process.exit(1) })
