const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  });

  const slug = 'quinta-do-boiro';
  const name = 'Quinta do Boiro';
  const name_cn = '金塔多博伊罗';
  const country = 'Portugal';
  const country_cn = '葡萄牙';
  const region = 'Lisbon';
  const city = 'Alenquer';
  const city_cn = '阿伦克尔';
  const address = 'Pereiro de Palhacana, 2580-252 Alenquer';
  const postal_code = '2580-252';
  const lat = 39.0577;
  const lng = -9.10851;
  const tagline = 'A magical vineyard retreat 30 minutes from Lisbon, perfect for exclusive celebrations';
  const tagline_cn = '距里斯本30分钟的迷人葡萄园秘境，专为专属庆典而设';
  const desc = `Quinta do Boiro — Located in the municipality of Alenquer, Lisbon district, and just 30 minutes from Lisbon airport, Quinta do Boiro is an enchanting place, a magical and verdant retreat perfect for hosting an exclusive celebration.

With 9 hectares marked by extensive vineyards and terraces offering a range of distinct experiences in this vast region, and expansive gardens, a stunning setting is created for a delicate and unforgettable ceremony. For a religious ceremony, discover its charming chapel.

They offer rooms with varying capacities, each with a unique atmosphere. Expect a complete and personalized reception service that will exceed all your expectations. One event at a time, ensuring every couple receives undivided attention.`;
  const desc_cn = `Quinta do Boiro — 坐落于里斯本大区阿伦克尔市，距里斯本机场仅30分钟车程，是一座迷人的田园庄园，一片神奇而郁郁葱葱的秘境，专为举办专属庆典而完美打造。

庄园占地9公顷，广袤的葡萄园与梯田错落有致，搭配开阔的花园，营造出精致而难忘的仪式场景。这里还拥有一座迷人的小教堂，适合举办浪漫的宗教仪式。

庄园提供多间不同容量的宴会厅，每间都拥有独特的氛围。这里承诺完整而个性化的接待服务，超越您的所有期望。每次只接待一场活动，确保每对新人都获得全心全意的关注。`;

  const amenities = [
    {
      titleCn: '仪式空间',
      title: 'Ceremony Spaces',
      items: [
        { labelCn: '葡萄园露台', label: 'Vineyard Terrace' },
        { labelCn: '小教堂', label: 'Chapel' },
        { labelCn: '花园仪式区', label: 'Garden Ceremony Area' },
        { labelCn: '室内宴会厅', label: 'Indoor Reception Hall' }
      ]
    },
    {
      titleCn: '户外空间',
      title: 'Outdoor Spaces',
      items: [
        { labelCn: '9公顷葡萄园', label: '9-Hectare Vineyards' },
        { labelCn: '梯田景观', label: 'Terraced Landscapes' },
        { labelCn: '开阔花园', label: 'Expansive Gardens' },
        { labelCn: '泳池区', label: 'Swimming Pool Area' },
        { labelCn: '庭院', label: 'Courtyard' }
      ]
    },
    {
      titleCn: '住宿与服务',
      title: 'Accommodation & Services',
      items: [
        { labelCn: '新娘套房', label: 'Bridal Suite' },
        { labelCn: '多容量客房', label: 'Guest Rooms' },
        { labelCn: '个性化接待服务', label: 'Personalized Reception Service' },
        { labelCn: '每场仅接待一场活动', label: 'One Event at a Time' }
      ]
    }
  ];

  const venueTypes = [
    { name: 'Quinta', name_cn: '庄园' },
    { name: 'Vineyard', name_cn: '葡萄园' },
    { name: 'Garden', name_cn: '花园' }
  ];

  const coverImage = '/uploads/crawled/quinta-do-boiro/qdb-000.jpg';
  const galleryImages = [];
  const fs = require('fs');
  const files = fs.readdirSync('/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/quinta-do-boiro/')
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();
  files.forEach(f => galleryImages.push(`/uploads/crawled/quinta-do-boiro/${f}`));

  const capacity = '100-200';
  const phone = '+351 196 181 2469';
  const website = 'https://www.casadapraia.pt/';
  const sourceUrl = 'https://www.weddingwire.com/destination-wedding/destination/quinta-do-boiro--e2226284';
  const sourceName = 'WeddingWire';
  const price = 7000;
  const priceUnit = '€';
  const sortOrder = 4;

  // Delete existing record if any
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
