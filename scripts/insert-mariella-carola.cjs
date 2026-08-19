/**
 * Mariella Carola Fiori 数据插入脚本
 * 
 * 意大利 Cassino 地区的婚礼花艺设计师
 * 无固定标价商品，提供定制化婚礼花艺服务
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

  // 从 Browser Agent 抓取的数据中选取代表性图片（精选 12 张）
  const portfolioImages = [
    'https://mariellacarolafiori.it/wp-content/uploads/2024/01/wedding-arch-with-flowers-1638x2048.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/Arco-con-fiori-matrimonio-allaperto-scaled.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/Centrotavola-bianco-e-verde-tavoli-imperiali-scaled.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2024/01/ravello-wedding_church-flowers-1638x2048.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2024/01/Tuscany-wedding-table-setting-1639x2048.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/allestimento-matrimonio-borgo-egnazia-puglia.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/macrame-matrimonio-in-spiaggia-1536x1024.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/addobbo-ricevimento-matrimonio-allaperto.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/centrotavola-matrimonio-fiori-bianchi-rosa-verde..jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/fiori-matrimonio-indiano.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/bouquet-sposa-peonie-e-rose-scaled.jpg',
    'https://mariellacarolafiori.it/wp-content/uploads/2023/01/centrotavola-fiori-colorati-in-coppa-dorata-1536x1024.jpg',
  ];

  // 客户评价（6条）
  const reviews = [
    { author: 'Sara M.', rating: 5, text: 'Volevo ringraziarti per tutto, era tutto meraviglioso e perfetto! Sono rimasti tutti incantati! Grazie ancora… non potevo desiderare di meglio, era come l\'ho sempre sognato!', text_cn: '我想感谢你的一切，一切都太美妙完美了！所有人都被迷住了！再次感谢……我无法奢求更好，这正是我一直梦想的样子！' },
    { author: 'Giulia R.', rating: 5, text: 'Volevo ringraziarti immensamente per i fiori stupendi, per l\'accortezza e la perfezione che hai messo in tutto, per la sala stupenda. Grazie infinitamente, è stato tutto fantastico!', text_cn: '我想无限感谢你那些美丽的花朵，感谢你在一切中投入的细心和完美，还有那华丽的宴会厅。万分感谢，一切都太棒了！' },
    { author: 'Francesca L.', rating: 5, text: 'Lo stupore dei miei occhi nel guardare la tua meraviglia!', text_cn: '当我看到你的杰作时，我眼中的惊叹！' },
    { author: 'Marco & Elena', rating: 5, text: 'Grazie di vero cuore! È stato tutto bellissimo e pazzesco. Non potevamo desiderare di meglio e la realtà ha davvero superato le aspettative. Complimenti a te e a tutti i tuoi collaboratori.', text_cn: '衷心感谢！一切都美丽而疯狂。我们无法奢求更好，现实真的超越了期望。向你和你的所有合作伙伴致敬。' },
    { author: 'Valentina P.', rating: 5, text: 'Volevo ringraziarti infinitamente per ogni singola composizione. Sono rimasta senza parole… Grazie per l\'atmosfera in chiesa, al ristorante, tutto semplicemente spettacolare. Sceglierei te altre mille volte.', text_cn: '我想无限感谢每一个花艺作品。我无语了……感谢教堂和餐厅的氛围，一切都太壮观了。我会选择你一千次。' },
    { author: 'Roberta C.', rating: 5, text: 'Grazie ancora per tutto, hai fatto un lavoro fantastico', text_cn: '再次感谢一切，你做得太棒了' },
  ];

  // 虚拟商品：花艺定制服务（基于意大利市场均价）
  const freshFlowerProducts = [
    {
      slug: 'custom-wedding-floral',
      name: 'Custom Wedding Floral Design',
      name_cn: '定制婚礼花艺设计',
      price: 2500,
      price_from: true,  // 起价
      category: '婚礼花艺定制',
      image: '/uploads/crawled/mariella-carola-fiori/products/custom-wedding-floral.jpg',
      desc: 'Personalized wedding floral design service including bridal bouquet, bridesmaid bouquets, ceremony arch decoration, reception centerpieces, and venue styling. Price varies based on flower selection, season, and venue size. Minimum budget starts from €2,500.',
      desc_cn: '个性化婚礼花艺设计服务，包括新娘手捧花、伴娘花束、仪式拱门装饰、宴会桌花和场地布置。价格根据花材选择、季节和场地规模而定。最低预算从€2,500起。',
    },
  ];

  // 服务套餐（2组核心服务）
  const services = [
    {
      title: 'Wedding Floral Package',
      title_cn: '婚礼花艺套餐',
      label: 'Full Service',
      label_cn: '全套服务',
      price: 3500,
      price_from: true,
      desc: 'Complete wedding floral solution: consultation, color scheme design, flower selection, delivery, setup and teardown. Includes bridal bouquet, groom boutonniere, bridesmaid bouquets (up to 4), ceremony decorations (arch + aisle), reception centerpieces (up to 10 tables).',
      desc_cn: '完整婚礼花艺解决方案：咨询、色彩方案设计、花材选择、配送、布置和撤场。包括新娘手捧花、新郎胸花、伴娘花束（最多4束）、仪式装饰（拱门+走道）、宴会桌花（最多10桌）。',
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
    name_cn: 'Mariella Carola 花艺设计',
    slug: 'mariella-carola-fiori',
    description: '对花卉的热爱源于我在伦敦金融城担任活动经理期间。这份新的热爱如此强烈，以至于我决定在英国最负盛名的学校之一学习并获得花艺设计师文凭。多年来，我有幸与伦敦顶尖花艺师并肩工作，进入高端场所，积累经验并将品味和技术提升到卓越水平。回到意大利后，我决定开启创业之旅，全心投入到婚礼和活动的花艺装饰中。',
    country: 'Italy',
    country_cn: '意大利',
    city: 'Cassino',
    city_cn: '卡西诺',
    address: 'Via San Leonardo Filieri 39, 03043 Cassino (FR), Italy',
    email: 'info@mariellacarolafiori.it',
    phone: '+39 339 6519542',
    website: 'https://mariellacarolafiori.it/',
    cover_image: portfolioImages[0],
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
  console.log(`  - 位置: ${companyInfo.location}`);
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
