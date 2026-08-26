const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  });

  const slug = 'herdade-do-peru';
  const name = 'Herdade do Peru';
  const name_cn = '佩鲁庄园';
  const country = 'Portugal';
  const country_cn = '葡萄牙';
  const region = 'Serra da Arrábida';
  const city = 'Brejos de Azeitão';
  const city_cn = '布雷茹斯-迪阿济唐';
  const address = 'Rua do Perú, Brejos de Azeitão, 2925-206';
  const postal_code = '2925-206';
  const lat = 38.5392;
  const lng = -9.02634;
  const tagline = 'A 600-hectare estate with refinement, glamour and sophistication in the unique landscape of Serra da Arrábida';
  const tagline_cn = '阿拉比达山脉独特景观中的600公顷精致奢华庄园';
  const desc = `On your big day, opt for a space with refinement, glamor, and sophistication. Herdade do Peru, with its incredible and huge gardens, is the ideal choice to celebrate your union. Located in Brejos de Azeitão, it is inserted in the unique landscape of the Serra da Arrábida, with incredible views.

Herdade do Peru has plenty of space for you to celebrate the happiest day of your life. There are 600 hectares of nature that you can enjoy at your wedding. Outside, there are the huge and well-kept gardens where you can give a welcome cocktail, hold your civil ceremony, or even hold the entire wedding reception. The interior cellar has all the conditions to receive your friends and family. There is also the possibility of setting up a tent to accommodate the maximum number of guests.

At Herdade do Peru, you can count on a team at your disposal so that you can have your dream wedding. You will be able to celebrate your wedding reception and even your ceremony, making use of the magnificent gardens. Enjoy the landscapes of the Serra da Arrábida with all the comforts.`;
  const desc_cn = `在您最重要的日子，选择一个充满精致、魅力与优雅的空间。佩鲁庄园拥有令人惊叹的广阔花园，是庆祝您结合的理想之选。庄园坐落于布雷茹斯-迪阿济唐，融入阿拉比达山脉独特的自然景观中，拥有令人难以置信的美景。

佩鲁庄园拥有充足的空间，让您庆祝人生中最幸福的一天。600公顷的自然风光，您可以在婚礼中尽情享用。户外有精心打理的巨大花园，适合举办欢迎鸡尾酒会、民事仪式，甚至整场婚礼接待。内部酒窖具备接待亲朋好友的一切条件。还可以搭建帐篷以容纳最多数量的宾客。

在佩鲁庄园，您可以依靠一支随时为您服务的团队，帮您实现梦想婚礼。您可以利用壮丽的花园举办婚礼接待甚至仪式。在阿拉比达山脉的美景中，享受一切舒适。`;

  const amenities = [
    {
      titleCn: '仪式与宴会空间',
      title: 'Ceremony & Reception Spaces',
      items: [
        { labelCn: '花园仪式区', label: 'Garden Ceremony Area' },
        { labelCn: '室内酒窖', label: 'Interior Cellar' },
        { labelCn: '帐篷搭建区', label: 'Tent Setup Area' },
        { labelCn: '欢迎鸡尾酒区', label: 'Welcome Cocktail Area' }
      ]
    },
    {
      titleCn: '户外空间',
      title: 'Outdoor Spaces',
      items: [
        { labelCn: '600公顷自然', label: '600 Hectares of Nature' },
        { labelCn: '广阔花园', label: 'Huge Well-kept Gardens' },
        { labelCn: '阿拉比达山脉景观', label: 'Serra da Arrábida Views' },
        { labelCn: '户外接待区', label: 'Outdoor Reception Area' }
      ]
    },
    {
      titleCn: '建筑与住宿',
      title: 'Buildings & Accommodation',
      items: [
        { labelCn: '大宅 (Casa Grande)', label: 'Casa Grande' },
        { labelCn: '孙辈之屋 (Casa dos Netos)', label: 'Casa dos Netos' },
        { labelCn: '圣安娜之屋 (Casa Sant\'Anna)', label: 'Casa Sant\'Anna' }
      ]
    },
    {
      titleCn: '服务',
      title: 'Services',
      items: [
        { labelCn: '专属婚礼团队', label: 'Dedicated Wedding Team' },
        { labelCn: '定制帐篷服务', label: 'Custom Tent Service' },
        { labelCn: '个性化婚礼策划', label: 'Personalized Wedding Planning' }
      ]
    }
  ];

  const venueTypes = [
    { name: 'Quinta', name_cn: '庄园' },
    { name: 'Mansion', name_cn: '豪宅' },
    { name: 'Garden', name_cn: '花园' }
  ];

  const coverImage = '/uploads/crawled/herdade-do-peru/hdp-000.jpg';
  const galleryImages = [];
  const fs = require('fs');
  const files = fs.readdirSync('/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/herdade-do-peru/')
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();
  files.forEach(f => galleryImages.push(`/uploads/crawled/herdade-do-peru/${f}`));

  const capacity = '200-300';
  const phone = '+351 934 191 316';
  const website = 'https://herdadedoperu.com/en/herdade-do-peru/';
  const sourceUrl = 'https://www.weddingwire.com/destination-wedding/destination/herdade-do-peru--e2031049';
  const sourceName = 'WeddingWire';
  const price = 7000;
  const priceUnit = '€';
  const sortOrder = 8;

  await conn.query('DELETE FROM crawled_venues WHERE slug = ?', [slug]);

  await conn.query(
    `INSERT INTO crawled_venues
     (slug, name, name_cn, country, country_cn, region, city, city_cn,
      address, postal_code, latitude, longitude,
      tagline, tagline_cn, description, description_cn,
      cover_image, gallery_images, venue_types, amenities,
      capacity, phone, website, source_url, source_name,
      price, price_unit, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, name, name_cn, country, country_cn, region, city, city_cn,
     address, postal_code, lat, lng, tagline, tagline_cn, desc, desc_cn,
     galleryImages.length > 0 ? galleryImages[0] : coverImage,
     JSON.stringify(galleryImages), JSON.stringify(venueTypes),
     JSON.stringify(amenities), capacity, phone, website, sourceUrl, sourceName,
     price, priceUnit, sortOrder]
  );

  console.log(`Inserted ${slug} with ${galleryImages.length} gallery images`);
  await conn.end();
})();
