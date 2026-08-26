const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  });

  const slug = 'vale-pisco';
  const name = 'Vale Pisco';
  const name_cn = '瓦莱皮斯科庄园';
  const country = 'Portugal';
  const country_cn = '葡萄牙';
  const region = 'Oeste';
  const city = 'Bombarral';
  const city_cn = '邦巴尔';
  const address = 'Estrada Cova do Fialho, Carvalhal, 2540-372';
  const postal_code = '2540-372';
  const lat = 39.2957;
  const lng = -9.13033;
  const tagline = 'A tranquil refuge in Bombarral where nature and comfort walk hand in hand';
  const tagline_cn = '邦巴尔的宁静秘境，自然与舒适相伴而行';
  const desc = `Located in Bombarral, a region known for its rich agricultural tradition and stunning landscapes, Quinta Vale Pisco is a unique space that combines the charm of nature with the elegance of a welcoming and sophisticated environment.

With a history that dates back to the roots of Portuguese viticulture, the estate offers the perfect setting for unforgettable events, from weddings and baptisms to private parties, conferences, or corporate meetings.

In its restored rural spaces, Quinta Vale Pisco features a welcoming indoor room with capacity for up to 60 people. The interior is bordered by a charming outdoor area of approximately 6,500 square meters, where mobile structures can be integrated to extend the covered area. For larger celebrations, they design bespoke solutions.

Quinta Vale Pisco is not just a space; it is a place where moments happen naturally and stay effortlessly in the memory of those who live them.`;
  const desc_cn = `瓦莱皮斯科庄园坐落于邦巴尔，这里以丰富的农业传统和令人惊叹的自然风光而闻名，是一个独特的空间，将自然魅力与温馨优雅的环境完美融合。

庄园的历史可追溯到葡萄牙葡萄酒文化的根源，为各种难忘的活动提供了完美的场景，从婚礼、洗礼到私人派对、会议或企业活动。

在经过精心修复的乡村建筑中，瓦莱皮斯科庄园设有一间温馨的室内厅，可容纳多达60人。室内旁边是约6,500平方米的迷人户外区域，可安装移动结构以扩展覆盖面积。对于大型庆典，庄园提供量身定制的解决方案。

瓦莱皮斯科庄园不仅仅是一个场地，更是一个让美好时刻自然发生、深深刻印在每位来宾记忆中的地方。`;

  const amenities = [
    {
      titleCn: '仪式与宴会空间',
      title: 'Ceremony & Reception Spaces',
      items: [
        { labelCn: '室内活动厅 (60人)', label: 'Indoor Event Room (60 guests)' },
        { labelCn: '6500㎡户外区域', label: '6,500m² Outdoor Area' },
        { labelCn: '可移动结构扩展', label: 'Mobile Structure Extension' }
      ]
    },
    {
      titleCn: '户外空间',
      title: 'Outdoor Spaces',
      items: [
        { labelCn: '葡萄园景观', label: 'Vineyard Landscapes' },
        { labelCn: '修复的乡村建筑', label: 'Restored Rural Buildings' },
        { labelCn: '花园与绿地', label: 'Gardens & Green Areas' },
        { labelCn: '航拍庄园全景', label: 'Aerial Estate Views' }
      ]
    },
    {
      titleCn: '住宿与设施',
      title: 'Accommodation & Facilities',
      items: [
        { labelCn: '套房', label: 'Suites' },
        { labelCn: '儿童公园', label: 'Children\'s Playground' },
        { labelCn: '停车场', label: 'Parking Area' }
      ]
    },
    {
      titleCn: '活动类型',
      title: 'Event Types',
      items: [
        { labelCn: '婚礼', label: 'Weddings' },
        { labelCn: '洗礼', label: 'Baptisms' },
        { labelCn: '私人派对', label: 'Private Parties' },
        { labelCn: '企业活动', label: 'Corporate Events' }
      ]
    }
  ];

  const venueTypes = [
    { name: 'Quinta', name_cn: '庄园' },
    { name: 'Garden', name_cn: '花园' },
    { name: 'Winery', name_cn: '酒庄' }
  ];

  const coverImage = '/uploads/crawled/vale-pisco/vlp-000.jpg';
  const galleryImages = [];
  const fs = require('fs');
  const files = fs.readdirSync('/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/vale-pisco/')
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();
  files.forEach(f => galleryImages.push(`/uploads/crawled/vale-pisco/${f}`));

  const capacity = '60-300';
  const phone = '+351 191 519 9376';
  const website = 'https://www.valepisco.pt/en-gb';
  const sourceUrl = 'https://www.weddingwire.com/destination-wedding/destination/vale-pisco--e2230498';
  const sourceName = 'WeddingWire';
  const price = 5000;
  const priceUnit = '€';
  const sortOrder = 9;

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
