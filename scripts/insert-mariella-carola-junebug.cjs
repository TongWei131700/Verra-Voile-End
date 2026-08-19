/**
 * Mariella Carola Fiori 数据插入脚本（Junebug 版本）
 * 
 * 意大利 Cassino 地区的婚礼花艺设计师
 * 数据来源: https://junebugweddings.com/vendors/wedding-florists/italy/central-italy/Mariella-Carola-Fiori
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('✓ 数据库已连接');

  // 检查是否已存在
  const [existing] = await pool.execute(
    'SELECT id FROM crawled_florists WHERE slug = ?',
    ['mariella-carola-fiori']
  );

  if (existing.length > 0) {
    console.log('⚠ 该花店已存在，将更新数据');
    await pool.execute('DELETE FROM crawled_florists WHERE slug = ?', ['mariella-carola-fiori']);
  }

  // Junebug 作品集图片（21张）- 本地路径
  const portfolioImages = [
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-1.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-2.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-3.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-4.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-5.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-6.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-7.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-8.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-9.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-10.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-11.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-12.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-13.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-14.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-15.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-16.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-17.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-18.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-19.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-20.jpg',
    '/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-21.jpg',
  ];

  // 客户评价（6条来自官网）
  const reviews = [
    { author: 'Sara M.', rating: 5, text: 'Volevo ringraziarti per tutto, era tutto meraviglioso e perfetto! Sono rimasti tutti incantati!', text_cn: '谢谢你做的一切，一切都太美妙太完美了！所有人都被迷住了！' },
    { author: 'Giulia R.', rating: 5, text: 'Volevo ringraziarti immensamente per i fiori stupendi, per l\'accortezza e la perfezione che hai messo in tutto.', text_cn: '非常感谢你美丽的花朵，以及你在一切中投入的细心和完美。' },
    { author: 'Francesca L.', rating: 5, text: 'Lo stupore dei miei occhi nel guardare la tua meraviglia!', text_cn: '看着你的杰作，我眼中满是惊叹！' },
    { author: 'Marco & Elena', rating: 5, text: 'Grazie di vero cuore! È stato tutto bellissimo e pazzesco. Non potevamo desiderare di meglio.', text_cn: '衷心感谢！一切都太美丽太疯狂了。我们不可能期望更好的了。' },
    { author: 'Valentina P.', rating: 5, text: 'Sono rimasta senza parole… Grazie per l\'atmosfera in chiesa, al ristorante, tutto semplicemente spettacolare. Sceglierei te altre mille volte.', text_cn: '我无语了…感谢教堂和餐厅的氛围，一切都太壮观了。我会再选你一千次。' },
    { author: 'Roberta C.', rating: 5, text: 'Grazie ancora per tutto, hai fatto un lavoro fantastico', text_cn: '再次感谢一切，你做得太棒了' },
  ];

  // 虚拟商品：定制婚礼花艺服务（基于意大利市场均价）
  const freshFlowerProducts = [
    {
      slug: 'custom-wedding-floral',
      name: 'Custom Wedding Floral Design',
      name_cn: '定制婚礼花艺设计',
      price: 2500,
      price_from: true,  // 起价
      category: '婚礼花艺定制',
      image: '/uploads/crawled/mariella-carola-fiori/products/custom-wedding-floral.jpg',
      desc: 'Personalized wedding floral design service including consultation, color scheme planning, flower selection, bridal bouquet, ceremony decorations, reception arrangements, and accessories (boutonniere, corsage, crown, ring pillow). Service covers all of Italy for destination weddings.',
      desc_cn: '个性化婚礼花艺设计服务，包括咨询、色彩方案规划、花材选择、新娘花束、仪式装饰、宴会布置和配饰（胸花、手镯、花冠、戒指枕）。服务覆盖全意大利各地婚礼。',
    },
  ];

  // 服务套餐（2组核心服务）
  const services = [
    {
      title: 'Wedding Floral Package',
      title_cn: '婚礼花艺全套设计',
      label: 'Full Service',
      label_cn: '全套服务',
      price: 3500,
      price_from: true,
      desc: 'Complete wedding floral solution: initial consultation, color scheme design, flower selection, delivery, setup and teardown. Includes bridal bouquet, groom boutonniere, bridesmaid bouquets (up to 4), ceremony decorations (arch + aisle), reception centerpieces (up to 10 tables).',
      desc_cn: '完整婚礼花艺解决方案：初步咨询、色彩方案设计、花材选择、配送、布置和撤场。包括新娘手捧花、新郎胸花、伴娘花束（最多4束）、仪式装饰（拱门+走道）、宴会桌花（最多10桌）。',
    },
    {
      title: 'Event Floral Decoration',
      title_cn: '活动花艺装饰',
      label: 'Custom Event',
      label_cn: '定制活动',
      price: 1500,
      price_from: true,
      desc: 'Floral decoration for birthdays, graduations, corporate events, baptisms, communions and other celebrations. Custom design based on event theme, venue and budget. Includes consultation, design proposal, delivery and setup.',
      desc_cn: '生日派对、毕业典礼、企业活动、洗礼、圣餐等庆典的花艺装饰。根据活动主题、场地和预算进行定制设计。包括咨询、设计方案、配送和布置。',
    },
  ];

  // 公司信息
  const companyInfo = {
    name: 'Mariella Carola Fiori',
    name_cn: '玛丽埃拉·卡罗拉花卉',
    slug: 'mariella-carola-fiori',
    description: 'Mariella Carola Fiori 以其精致现代的花艺设计闻名，为意大利各地的婚礼带来国际化的时尚风格。她与新人紧密合作，创造反映他们愿景、个性和整体婚礼美学的定制花艺。从托斯卡纳到阿马尔菲海岸，她在各种目的地场景和场地设计方面经验丰富。她对花卉的热情源于在伦敦金融城担任活动经理期间。新爱好如此强烈，以至于她决定在英国最负盛名的花艺设计学院之一学习并获得花艺设计师文凭。毕业后，她有幸与伦敦顶级花艺师合作，接触到高端场地，积累了丰富的经验和精致的品味。回到意大利后，她开始了自己的创业之旅，全身心投入婚礼和活动花艺装饰。',
    country: 'Italy',
    country_cn: '意大利',
    city: 'Cassino',
    city_cn: '卡西诺',
    address: 'Via San Leonardo Filieri 39, 03043 Cassino (FR), Italy',
    email: 'info@mariellacarolafiori.it',
    phone: '+39 339 6519542',
    website: 'https://mariellacarolafiori.it/',
    cover_image: '/uploads/crawled/mariella-carola-fiori/cover.jpg',
    sort_order: 3,
  };

  await pool.execute(
    `INSERT INTO crawled_florists 
    (slug, name, name_cn, description, country, country_cn, city, city_cn, address, email, phone, website, cover_image, fresh_flower_products, portfolio_images, services, testimonials, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      companyInfo.slug,
      companyInfo.name,
      companyInfo.name_cn,
      companyInfo.description,
      companyInfo.country,
      companyInfo.country_cn,
      companyInfo.city,
      companyInfo.city_cn,
      companyInfo.address,
      companyInfo.email,
      companyInfo.phone,
      companyInfo.website,
      companyInfo.cover_image,
      JSON.stringify(freshFlowerProducts),
      JSON.stringify(portfolioImages),
      JSON.stringify(services),
      JSON.stringify(reviews),
      companyInfo.sort_order,
    ]
  );

  console.log('✓ 数据已插入数据库');
  console.log(`  - 花店名称: ${companyInfo.name}`);
  console.log(`  - 位置: ${companyInfo.city}, ${companyInfo.country}`);
  console.log(`  - 鲜花产品: ${freshFlowerProducts.length} 个`);
  console.log(`  - 作品集图片: ${portfolioImages.length} 张`);
  console.log(`  - 服务套餐: ${services.length} 组`);
  console.log(`  - 客户评价: ${reviews.length} 条`);

  await pool.end();
  console.log('\n✅ 完成！');
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
