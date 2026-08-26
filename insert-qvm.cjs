const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  });

  const slug = 'quinta-vila-marita';
  const name = 'Quinta Vila Marita';
  const name_cn = '玛丽塔庄园';
  const country = 'Portugal';
  const country_cn = '葡萄牙';
  const region = 'Minho';
  const city = 'Guimarães';
  const city_cn = '吉马良斯';
  const address = 'Souto Santa Maria Guimarães, 4800-256';
  const postal_code = '4800-256';
  const lat = 41.5137;
  const lng = -8.29772;
  const tagline = 'A stunning 50,000m² estate in the heart of Minho, where classic charm meets modern elegance';
  const tagline_cn = '米尼奥心脏地带的迷人5万㎡庄园，经典魅力与现代优雅完美融合';
  const desc = `Quinta Vila Marita specializes in organizing weddings, with a team of professionals and experience in hotel services. On this farm, the classic is in perfect symbiosis with the modern, in a privileged area in the heart of Minho. You will spend a very pleasant day, in harmony with emotions and unforgettable moments.

With a total space of 50,000m², the interior of the farm is made up of numerous gardens, lawns, waterfalls, and lakes, and a great diversity of plants and flowers. It is a welcoming place that provides well-being and comfort.

The team is prepared to welcome you with great friendliness and additional quality services. You can opt for the refined decoration of the entire space, babysitting, and florist.

It is located between Guimarães and Braga, in the town of Santa Maria de Souto, in a region of great natural beauty. In addition to weddings, it also hosts baptism parties, communions, and conferences, among others. Schedule a visit and be dazzled by this charming place.`;
  const desc_cn = `玛丽塔庄园专注于婚礼策划，拥有一支专业的酒店服务团队，经验丰富。在这座庄园里，经典与现代完美融合，坐落于米尼奥心脏地带的优越位置。您将在此度过愉悦的一天，沉浸在和谐的情感与难忘的时刻中。

庄园总面积达50,000平方米，内部拥有众多花园、草坪、瀑布和湖泊，以及丰富多样的植物和花卉。这是一个温馨宜人的场所，带给您舒适与惬意。

专业团队以极大的热情和优质的额外服务迎接您的到来。您可以选择精致的全场装饰服务、保姆看护和花艺设计，打造完美的大日子。

庄园位于吉马良斯与布拉加之间的圣玛丽亚·德·索乌托小镇，自然风光秀丽。除婚礼外，还承办洗礼派对、圣餐礼和会议等活动。预约参观，被这迷人之地所倾倒。`;

  const amenities = [
    {
      titleCn: '仪式与宴会空间',
      title: 'Ceremony & Reception Spaces',
      items: [
        { labelCn: '室内宴会厅', label: 'Indoor Reception Hall' },
        { labelCn: '户外仪式区', label: 'Outdoor Ceremony Area' },
        { labelCn: '花园景观区', label: 'Garden Landscape Area' }
      ]
    },
    {
      titleCn: '户外空间',
      title: 'Outdoor Spaces',
      items: [
        { labelCn: '5万㎡庄园', label: '50,000m² Estate' },
        { labelCn: '瀑布与湖泊', label: 'Waterfalls & Lakes' },
        { labelCn: '多样花园', label: 'Diverse Gardens' },
        { labelCn: '草坪区', label: 'Lawn Areas' }
      ]
    },
    {
      titleCn: '服务与设施',
      title: 'Services & Facilities',
      items: [
        { labelCn: '精致装饰服务', label: 'Refined Decoration Service' },
        { labelCn: '花艺服务', label: 'Florist Service' },
        { labelCn: '保姆看护', label: 'Babysitting Service' },
        { labelCn: '专业酒店团队', label: 'Professional Hotel Team' }
      ]
    },
    {
      titleCn: '活动类型',
      title: 'Event Types',
      items: [
        { labelCn: '婚礼', label: 'Weddings' },
        { labelCn: '洗礼派对', label: 'Baptism Parties' },
        { labelCn: '圣餐礼', label: 'Communions' },
        { labelCn: '会议', label: 'Conferences' }
      ]
    }
  ];

  const venueTypes = [
    { name: 'Quinta', name_cn: '庄园' },
    { name: 'Garden', name_cn: '花园' },
    { name: 'Mansion', name_cn: '豪宅' }
  ];

  const coverImage = '/uploads/crawled/quinta-vila-marita/qvm-000.jpg';
  const galleryImages = [];
  const fs = require('fs');
  const files = fs.readdirSync('/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/quinta-vila-marita/')
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();
  files.forEach(f => galleryImages.push(`/uploads/crawled/quinta-vila-marita/${f}`));

  const capacity = '200-300';
  const phone = '+351 968 104 293';
  const website = 'https://www.vilamarita.com/?lang=en';
  const sourceUrl = 'https://www.weddingwire.com/destination-wedding/destination/quinta-vila-marita--e2189252';
  const sourceName = 'WeddingWire';
  const price = 6000;
  const priceUnit = '€';
  const sortOrder = 7;

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
