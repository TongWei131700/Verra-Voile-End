/**
 * Florajet 婚礼花卉数据插入脚本
 * 
 * 法国 Florajet 在线花店的婚礼系列商品
 * 数据来源: https://www.florajet.com/
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
    ['florajet']
  );

  if (existing.length > 0) {
    console.log('⚠ 该花店已存在，将更新数据');
    await pool.execute('DELETE FROM crawled_florists WHERE slug = ?', ['florajet']);
  }

  // 婚礼花卉商品（7个）
  const freshFlowerProducts = [
    {
      slug: 'creation-mariage',
      name: 'CREATION MARIAGE',
      name_cn: '婚礼花艺创作',
      price: 36.90,
      price_from: true,
      category: '婚礼花束',
      image: '/uploads/crawled/florajet/products/creation-mariage.jpg',
      desc: 'Conception florale exclusive pour célébrations de mariage, somptueux mélange de fleurs fraîches créé librement par le fleuriste selon les fleurs de saison et son inspiration artistique.',
      desc_cn: '专为婚礼庆祝而设计的花艺师创作，华丽的混合鲜花花束，由花艺师根据当季鲜花和艺术感觉自由创作。',
    },
    {
      slug: 'roxane',
      name: 'ROXANE',
      name_cn: '罗克珊',
      price: 57.90,
      price_from: true,
      category: '婚礼花束',
      image: '/uploads/crawled/florajet/products/roxane.jpg',
      desc: 'Bouquet élégant aux tons blancs, conçu spécialement pour la saison des mariages. Fusionne de magnifiques hortensias avec des marguerites lumineuses, accompagné de petites fleurs de saison pour un effet rayonnant qui sublime parfaitement l\'ambiance nuptiale.',
      desc_cn: '优雅的季节性白色花束，专为婚礼季节设计。融合了宏伟的绣球花、明亮的小雏菊，配以当季小花，营造出 radiant 的整体效果，完美衬托婚礼氛围。',
    },
    {
      slug: 'phenix',
      name: 'PHÉNIX',
      name_cn: '凤凰',
      price: 108.90,
      price_from: true,
      category: '高端婚礼花束',
      image: '/uploads/crawled/florajet/products/phenix.jpg',
      desc: 'Impressionnant ! Somptueux bouquet composé de nombreux lys, roses et fleurs de saison dans des tons pastel doux, impossible à ignorer. Choix haut de gamme idéal pour les mariages et occasions importantes.',
      desc_cn: '气势恢宏！以大量百合、玫瑰和当季花卉组成的奢华花束，色调柔和粉彩，绝对不会被忽视。适合婚礼等重要场合的高端之选。',
    },
    {
      slug: 'duchesse',
      name: 'DUCHESSE',
      name_cn: '公爵夫人',
      price: 35.90,
      price_from: true,
      category: '婚礼花束',
      image: '/uploads/crawled/florajet/products/duchesse.jpg',
      desc: 'Plein de féminité ! Composition florale délicate rendant hommage à la splendeur féminine. Entre finesse et sensibilité, raffinement et naturel, ce rond de fleurs rose et blanc composé de gerberas, lys, roses, fleurettes et feuillages incarne l\'élégance florale pure.',
      desc_cn: '充满女性魅力！精致的花艺作品向女性的华美致敬。在细腻与感性、精致与自然之间，粉白相间的圆花束由非洲菊、百合、玫瑰、小花和绿叶组成，诠释纯粹的花艺优雅。',
    },
    {
      slug: 'creation-blanche',
      name: 'CRÉATION BLANCHE',
      name_cn: '白色花艺创作',
      price: 36.90,
      price_from: true,
      category: '婚礼花束',
      image: '/uploads/crawled/florajet/products/creation-blanche.jpg',
      desc: 'Choix tendance. Le fleuriste compose une création exclusive en fleurs blanches, transmettant des émotions de pureté et d\'abondance avec un charme élégant, parfait pour les moments précieux comme les mariages. Le blanc symbolise la pureté, un choix classique pour les noces.',
      desc_cn: '时尚之选。花艺师将用白色花卉打造一件独家创作，传达纯洁与丰富的情感，具有优雅的魅力，适合婚礼等珍贵时刻。白色象征纯洁，是婚礼的经典选择。',
    },
    {
      slug: 'perle-fine',
      name: 'PERLE FINE',
      name_cn: '精致珍珠',
      price: 52.90,
      price_from: true,
      category: '婚礼花束',
      image: '/uploads/crawled/florajet/products/perle-fine.jpg',
      desc: 'Magnifique composition aux tons blancs, roses et verts, idéale pour toutes les occasions spéciales. Créée avec soin par le fleuriste où chaque détail est pensé, offrant une élégance raffinée. Parfait pour mariages, anniversaires ou fêtes.',
      desc_cn: '精美的白、粉、绿色调花束，适合所有特殊场合。由花艺师精心打造，每个细节都经过考量，呈现出优雅精致的 compositions。婚礼、生日或派对的理想之选。',
    },
    {
      slug: 'candeur',
      name: 'CANDEUR',
      name_cn: '柔情',
      price: 39.90,
      price_from: true,
      category: '玫瑰花束',
      image: '/uploads/crawled/florajet/products/candeur.jpg',
      desc: 'Douceur et romantisme ! Extrêmement féminin, ce magnifique bouquet de roses se distingue par l\'utilisation astucieuse du bear grass. Exprime parfaitement des sentiments tendres, un classique incontournable de la collection. Roses roses associées à des feuillages uniques créent une ambiance romantique.',
      desc_cn: '温柔与浪漫！极具女性气质，这个精美的玫瑰花束的独到之处在于 bear grass 的巧妙运用。完美表达温柔的情感，是花束系列中不可或缺的经典款。粉玫瑰搭配独特的绿叶，营造浪漫氛围。',
    },
  ];

  // 公司信息
  const companyInfo = {
    name: 'Florajet',
    name_cn: 'Florajet',
    slug: 'florajet',
    description: 'Florajet 是法国领先的在线花店，提供当日或次日送达服务（17:30前下单）。专注于为婚礼、生日、纪念日等特殊场合提供高品质鲜花花束。所有花束均由专业花艺师手工制作，使用当季最新鲜的花材。Florajet 覆盖法国全境，配送费起步 12.95€。',
    country: 'France',
    country_cn: '法国',
    city: 'Nationwide',
    city_cn: '全国',
    address: 'France',
    email: '',
    phone: '',
    website: 'https://www.florajet.com/',
    cover_image: '/uploads/crawled/florajet/products/creation-mariage.jpg',
    sort_order: 5,
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
      JSON.stringify([]),  // 无作品集图片
      JSON.stringify([]),  // 无服务套餐
      JSON.stringify([]),  // 无客户评价
      companyInfo.sort_order,
    ]
  );

  console.log('✓ 数据已插入数据库');
  console.log(`  - 花店名称: ${companyInfo.name}`);
  console.log(`  - 位置: ${companyInfo.city}, ${companyInfo.country}`);
  console.log(`  - 鲜花产品: ${freshFlowerProducts.length} 个`);

  await pool.end();
  console.log('\n✅ 完成！');
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
