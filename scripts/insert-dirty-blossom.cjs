/**
 * Dirty Blossom 数据插入脚本
 * 
 * 美国圣路易斯的精品花艺工作室（黑人女性拥有）
 * 数据来源: https://www.dirtyblossom.co/
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
    ['dirty-blossom']
  );

  if (existing.length > 0) {
    console.log('⚠ 该花店已存在，将更新数据');
    await pool.execute('DELETE FROM crawled_florists WHERE slug = ?', ['dirty-blossom']);
  }

  // 作品集图片（23张：15张婚礼 + 8张工作室）
  const portfolioImages = [
    'https://static.wixstatic.com/media/0949b0_57f42f4b5cda414eb24d0157762bf4db~mv2.jpg/v1/crop/x_0,y_236,w_2400,h_3128/fill/w_1016,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/CGM06753.jpg',
    'https://static.wixstatic.com/media/0949b0_c90b9825f3344907a514a39a77784c38~mv2.jpg/v1/crop/x_0,y_364,w_3648,h_4745/fill/w_1018,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/5L8A6679_VSCO_JPG.jpg',
    'https://static.wixstatic.com/media/0949b0_6cdcdfb0d9e44b1a8758fa8e5750d519~mv2.jpeg/v1/crop/x_0,y_363,w_1104,h_1277/fill/w_982,h_1277,al_c,q_85,enc_avif,quality_auto/Wedding_445.jpeg',
    'https://static.wixstatic.com/media/0949b0_bf26ec22975e4085920b312150e52e9b~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_7e42aa32d3e240039f7365a36bc14a5f~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_3e06847fc5304b2eb1de6e7c0e376a81~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_62c0daf117214d5e8700de64977ce728~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_1a37599db8a54d61b88fc0b5a6ac274c~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_605c59bbfd4d40d693a731ead43f83d6~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_7d4dff0a939a4b17888e884bf9c585cc~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_8211d2d9dc724c6890b17319cc5b88d5~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_ab9e9eae63fe44ed94086f5b739d243c~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_f651dd598f5546209ce6343ff1a0175d~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_c7d42d2a14cb4d9c904c5465c3fb8d23~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_43bfec998386412c8a6c0c2a3ae29c90~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_e212fff382ac420aba3d7ca699bb423e~mv2.jpg',
    'https://static.wixstatic.com/media/0949b0_3a580417286c4578b4377c2f43563f14~mv2.jpg/v1/crop/x_0,y_364,w_3648,h_4745/fill/w_1018,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/5L8A6629_VSCO_JPG.jpg',
    'https://static.wixstatic.com/media/0949b0_daabd6e7b7d34e0fa46e6beeac8f2ff2~mv2.jpg/v1/crop/x_0,y_364,w_3648,h_4745/fill/w_1018,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/5L8A6709_VSCO_JPG.jpg',
    'https://static.wixstatic.com/media/0949b0_8f3f2eea55c74adf90521d4ba3d2da38~mv2.jpg/v1/crop/x_88,y_0,w_572,h_744/fill/w_572,h_744,al_c,q_85,enc_avif,quality_auto/FullSizeRender-5.jpg',
    'https://static.wixstatic.com/media/0949b0_34e643bc144847e69a7e066c13b61766~mv2.jpg/v1/crop/x_0,y_363,w_3648,h_4745/fill/w_838,h_1090,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/5L8A9358_JPG.jpg',
    'https://static.wixstatic.com/media/0949b0_95a79717f97f4359b1ae72b816cd10b5~mv2.jpg/v1/crop/x_0,y_364,w_3648,h_4745/fill/w_1018,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/5L8A9423_JPG.jpg',
    'https://static.wixstatic.com/media/0949b0_e283ac3a42974c0da67163378c8394a7~mv2.jpg/v1/crop/x_0,y_364,w_3648,h_4745/fill/w_1018,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_2061_JPG.jpg',
    'https://static.wixstatic.com/media/0949b0_2761e0b4d0cd4e8589aa283966c33ca1~mv2.jpg/v1/crop/x_0,y_364,w_3648,h_4745/fill/w_1018,h_1324,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/IMG_1991_JPG.jpg',
  ];

  // 客户评价（3条）
  const reviews = [
    { author: 'Ellie O\'Connell', rating: 5, text: 'Tee is not only unbelievably talented, she\'s also a delightful person to work with. She did florals for our wedding and was able to design a package that fit our individual needs, which is hard to find! She absolutely delivered on our inspiration and was able to accommodate a few last minute changes with grace and patience.', text_cn: 'Tee不仅才华横溢，而且是一位令人愉快的工作伙伴。她为我们的婚礼设计了花艺，并能够根据我们的个人需求定制方案，这很难得！她完美地实现了我们的灵感，并优雅耐心地 accommodating 了一些临时变更。' },
    { author: 'Mark Timmerman', rating: 5, text: 'Tee\'s work is astounding because she puts into it her whole heart. She is an artist with flowers and also a brilliant creative director and consultant. She is quick to respond to an order, delivers on time, and the final product is always memorable.', text_cn: 'Tee的作品令人惊叹，因为她全心投入。她是花艺艺术家，也是出色的创意总监和顾问。她响应订单迅速、准时交付，最终作品总是令人难忘。' },
    { author: 'Tessa Rhomberg', rating: 5, text: 'I found Tee on Instagram and was drawn to her style and creativity instantly. I knew that I wanted her for our wedding florals as soon as I scrolled through her posts. Tee went above and beyond our expectations and we loved our florals so much.', text_cn: '我在Instagram上发现了Tee，立刻被她的风格和创意所吸引。浏览她的帖子后，我就知道我要让她负责我们的婚礼花艺。Tee超出了我们的期望，我们非常喜欢我们的花艺。' },
  ];

  // 鲜花产品（2个有标价的商品）
  const freshFlowerProducts = [
    {
      slug: 'surprise-me-blooms',
      name: 'Surprise Me Blooms!',
      name_cn: '惊喜花艺布置',
      price: 220,
      price_from: false,
      category: '日常花束',
      image: '/uploads/crawled/dirty-blossom/products/surprise-me-blooms.jpg',
      desc: 'Let the floral designer get creative and craft a unique, stunning arrangement using seasonal blooms. Customers can specify preferred colors. All arrangements are made-to-order with the freshest, most unique blooms available.',
      desc_cn: '让花艺师发挥创意，使用当季鲜花打造独特精美的花艺作品。客户可以指定偏好的颜色。所有花艺均为当天订购、使用最新鲜独特的花材手工制作。',
    },
    {
      slug: 'lovebirds-elopement-bundle',
      name: 'Lovebirds + Elopement Bundle',
      name_cn: '私奔花艺套餐',
      price: 410,
      price_from: false,
      category: '婚礼花艺',
      image: '/uploads/crawled/dirty-blossom/products/lovebirds-bundle.jpg',
      desc: 'Designed for couples seeking intimacy and authenticity. Includes bridal bouquet ($185 value), 1 matching groom boutonniere ($25 value), and 1 matching standard arrangement ($200 value). Optional color palette, Designer\'s Choice style. Pickup or delivery Wed-Fri only.',
      desc_cn: '为追求亲密和真实感的情侣设计的私奔花艺套餐。包含新娘花束（价值$185）、1个配套新郎胸花（价值$25）和1个配套标准花艺布置（价值$200）。可选色系，Designer\'s Choice风格。仅限周三至周五取货或配送。',
    },
  ];

  // 服务套餐（2组核心服务）
  const services = [
    {
      title: 'Wedding & Event Florals',
      title_cn: '婚礼与活动花艺',
      label: 'Custom Design',
      label_cn: '定制设计',
      price: 2500,
      price_from: true,
      desc: 'Complete wedding and event floral design service including consultation, custom design proposal, flower selection, delivery, setup and teardown. Services include bridal bouquets, boutonnieres, ceremony decorations, reception centerpieces, and installation art. Serving St. Louis Metro Area.',
      desc_cn: '完整婚礼和活动花艺设计服务，包括咨询、定制设计方案、花材选择、配送、布置和撤场。服务包括新娘手捧花、胸花、仪式装饰、宴会桌花和艺术装置。服务圣路易斯大都会区。',
    },
    {
      title: 'Weekly Floral Service',
      title_cn: '每周花艺服务',
      label: 'Subscription',
      label_cn: '订阅服务',
      price: 220,
      price_from: true,
      desc: 'Regular floral arrangements for homes, offices, or businesses. Fresh, unique designs delivered weekly or bi-weekly. Perfect for maintaining beautiful spaces with seasonal blooms and artistic flair.',
      desc_cn: '为家庭、办公室或企业提供的定期花艺布置。新鲜独特的设计，每周或每两周配送一次。非常适合用当季鲜花和艺术气息维持美丽空间。',
    },
  ];

  // 公司信息
  const companyInfo = {
    name: 'Dirty Blossom',
    name_cn: '不羁之花',
    slug: 'dirty-blossom',
    description: 'Dirty Blossom 是一家位于密苏里州圣路易斯的**黑人女性拥有**的花艺工作室，由花艺师 Tee 创立并主理。工作室提供活动花艺设计、每周花艺服务、艺术装置和编辑造型服务。Tee 致力于通过使用常被忽视的日常物品来重新定义现代花艺设计，创造独特、真实的设计，为家庭和活动现场传播爱与欢乐。她以签名风格的惊艳花束闻名，擅长将创意与真实情感融入每一作品中。',
    country: 'United States',
    country_cn: '美国',
    city: 'St. Louis',
    city_cn: '圣路易斯',
    address: 'St. Louis, MO, USA',
    email: 'dirtyblossominfo@gmail.com',
    phone: '',
    website: 'https://www.dirtyblossom.co/',
    cover_image: portfolioImages[0],
    sort_order: 4,
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
