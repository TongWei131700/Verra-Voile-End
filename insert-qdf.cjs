const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  });

  const slug = 'quinta-do-furao';
  const name = 'Quinta do Furão';
  const name_cn = '金塔多弗劳';
  const country = 'Portugal';
  const country_cn = '葡萄牙';
  const region = 'Madeira';
  const city = 'Santana';
  const city_cn = '圣塔纳';
  const address = 'Estrada da Quinta do Furão, 6 Santana, 9230-082';
  const postal_code = '9230-082';
  const lat = 32.8241;
  const lng = -16.8849;
  const tagline = 'A magnificent sea-view estate in the heart of Madeira Island';
  const tagline_cn = '马德拉岛中心坐拥壮丽海景的优雅庄园';
  const desc = `Quinta do Furão — Situated in the beautiful and picturesque region of Santana, on the island of Madeira, Quinta do Furão is surrounded by lush natural scenery and offers a unique and magical experience for your celebration.

With absolutely magnificent sea views, this estate boasts charming and expansive gardens where you can appreciate the natural beauty. The interior spaces have been designed with attention to detail, combining traditional and modern elements to provide comfort, elegance, and a welcoming atmosphere.

In perfect harmony with the surrounding nature, Quinta do Furão offers several spaces specially designed for your wedding. The olive press garden can accommodate around 300 people. The venue features on-site hotel accommodation, making it an ideal choice for destination weddings.`;
  const desc_cn = `Quinta do Furão — 坐落于马德拉岛风景如画的圣塔纳地区，Quinta do Furão 被郁郁葱葱的自然景观环绕，为您的庆典带来独特而魔幻的体验。

这座庄园拥有壮丽的海景，迷人的开阔花园让您尽享自然之美。室内空间精心设计，融合传统与现代元素，营造舒适、优雅而温馨的氛围。

与周围自然完美和谐，Quinta do Furão 提供多个专为婚礼设计的空间。橄榄压榨花园可容纳约300人。场地设有酒店住宿，是目的地婚礼的理想之选。`;

  const amenities = [
    {
      titleCn: '仪式与宴会空间',
      title: 'Ceremony & Reception',
      items: [
        { labelCn: '橄榄压榨花园（300人）', label: 'Olive Press Garden (300 guests)' },
        { labelCn: '棕榈树仪式区', label: 'Palm Tree Ceremony Area' },
        { labelCn: '帐篷接待区', label: 'Tented Reception Area' },
        { labelCn: '室内宴会厅', label: 'Indoor Reception Hall' },
        { labelCn: '鸡尾酒露台', label: 'Cocktail Terrace' }
      ]
    },
    {
      titleCn: '场地特色',
      title: 'Venue Features',
      items: [
        { labelCn: '壮丽海景', label: 'Magnificent Sea Views' },
        { labelCn: '开阔花园', label: 'Expansive Gardens' },
        { labelCn: '传统与现代融合设计', label: 'Traditional & Modern Design' },
        { labelCn: '葡萄酒压榨坊', label: 'Wine Press (Lagar)' },
        { labelCn: '舞池区域', label: 'Dance Floor Area' }
      ]
    },
    {
      titleCn: '住宿与休闲',
      title: 'Accommodation & Leisure',
      items: [
        { labelCn: '酒店客房', label: 'Hotel Rooms' },
        { labelCn: '新娘准备室', label: 'Bridal Preparation Room' },
        { labelCn: '新郎准备室', label: 'Groom Preparation Room' },
        { labelCn: '水疗中心', label: 'Wellness & Spa' },
        { labelCn: '餐厅与酒吧', label: 'Restaurant & Bar' }
      ]
    }
  ];

  const venueTypes = [
    { name: 'Quinta', name_cn: '庄园' },
    { name: 'Mansion', name_cn: '豪宅' },
    { name: 'Garden', name_cn: '花园' },
    { name: 'Hotel', name_cn: '酒店' }
  ];

  const fs = require('fs');
  const files = fs.readdirSync('/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/quinta-do-furao/')
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();
  const galleryImages = files.map(f => `/uploads/crawled/quinta-do-furao/${f}`);

  const capacity = '200-300';
  const phone = '+351 129 157 0100';
  const website = 'https://www.quintadofurao.com/';
  const sourceUrl = 'https://www.weddingwire.com/destination-wedding/destination/quinta-do-furao--e2232942';
  const sourceName = 'WeddingWire';
  const price = 8000;
  const priceUnit = '€';
  const sortOrder = 5;

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
     galleryImages.length > 0 ? galleryImages[0] : '',
     JSON.stringify(galleryImages), JSON.stringify(venueTypes),
     JSON.stringify(amenities), capacity, phone, website, sourceUrl, sourceName,
     price, priceUnit, sortOrder]
  );

  console.log(`Inserted ${slug} with ${galleryImages.length} gallery images`);
  await conn.end();
})();
