const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  });

  const slug = 'sesmarias';
  const name = 'Sesmarias Turismo Rural & Spa';
  const name_cn = '塞斯玛利亚斯乡村水疗度假村';
  const country = 'Portugal';
  const country_cn = '葡萄牙';
  const region = 'Alentejo';
  const city = 'Faro do Alentejo';
  const city_cn = '法鲁-杜阿连特茹';
  const address = 'Estrada Nacional 387, 7900-097 Alfundão';
  const postal_code = '7900-097';
  const lat = 38.1490;
  const lng = -8.0730;
  const tagline = 'A 300-hectare rural estate with spa, pool and Alentejo tranquility';
  const tagline_cn = '300公顷乡村庄园，配有水疗、泳池与阿连特茹的宁静';
  const desc = `Sesmarias Turismo Rural & Spa — A rural tourism estate in the Alentejo region, integrated into a 300-hectare property where you can enjoy an atmosphere of tradition, tranquility and leisure, privileged by a unique rural heritage.

The estate offers days outdoors with various recreational activities by the dam, including sport fishing, bicycle rides, and the possibility of observing migratory birds. The evening wanderings of nocturnal birds under the starry Alentejo sky are moments not to be missed.

At Sesmarias, you will find the refuge of a family environment, surrounded by a modern and eclectic space with a rustic timelessness. The venue features 9 air-conditioned rooms, an outdoor pool, spa, restaurant, and extensive gardens — perfect for an intimate destination wedding immersed in Portuguese countryside.`;
  const desc_cn = `Sesmarias Turismo Rural & Spa — 一座坐落于阿连特茹地区的乡村旅游庄园，占地300公顷，在这里您可以享受传统、宁静与休闲的氛围，拥有独特的乡村遗产。

庄园提供丰富的户外活动，包括水坝旁的运动钓鱼、骑自行车，以及观赏候鸟的机会。在阿连特茹星空下夜鸟的漫步，是不可错过的难忘时刻。

在 Sesmarias，您将找到家庭般温馨的避风港，被现代而折衷的空间所环绕，散发着永恒的质朴气息。场地设有9间空调客房、室外泳池、水疗中心、餐厅和开阔花园——非常适合沉浸在葡萄牙乡村中的亲密目的地婚礼。`;

  const amenities = [
    {
      titleCn: '场地设施',
      title: 'Venue Facilities',
      items: [
        { labelCn: '300公顷庄园', label: '300-Hectare Estate' },
        { labelCn: '活动空间', label: 'Event Spaces' },
        { labelCn: '餐厅', label: 'Restaurant' },
        { labelCn: '花园', label: 'Gardens' },
        { labelCn: '泳池区', label: 'Pool Area' }
      ]
    },
    {
      titleCn: '水疗与休闲',
      title: 'Spa & Leisure',
      items: [
        { labelCn: '水疗中心', label: 'Spa Center' },
        { labelCn: '室外泳池', label: 'Outdoor Pool' },
        { labelCn: '桑拿', label: 'Sauna' },
        { labelCn: '土耳其浴', label: 'Turkish Bath' },
        { labelCn: '按摩室', label: 'Massage Room' }
      ]
    },
    {
      titleCn: '户外活动',
      title: 'Outdoor Activities',
      items: [
        { labelCn: '骑自行车', label: 'Cycling' },
        { labelCn: '钓鱼', label: 'Sport Fishing' },
        { labelCn: '观鸟', label: 'Bird Watching' },
        { labelCn: '徒步旅行', label: 'Hiking' },
        { labelCn: '游戏室', label: 'Game Room' }
      ]
    },
    {
      titleCn: '住宿',
      title: 'Accommodation',
      items: [
        { labelCn: '豪华套房', label: 'Luxury Suite' },
        { labelCn: '私人泳池套房', label: 'Suite with Private Pool' },
        { labelCn: '按摩浴缸套房', label: 'Hydromassage Suite' },
        { labelCn: '高级套房', label: 'Junior Suite' },
        { labelCn: '双人房', label: 'Double Room' },
        { labelCn: '家庭房', label: 'Family Room' }
      ]
    }
  ];

  const venueTypes = [
    { name: 'Rural Estate', name_cn: '乡村庄园' },
    { name: 'Spa Resort', name_cn: '水疗度假村' },
    { name: 'Garden', name_cn: '花园' }
  ];

  const fs = require('fs');
  const files = fs.readdirSync('/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/sesmarias/')
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i))
    .sort();
  const galleryImages = files.map(f => `/uploads/crawled/sesmarias/${f}`);

  const capacity = '50-150';
  const phone = '+351 965 591 197';
  const website = 'https://www.sesmariasturismoruralspa.com/';
  const sourceUrl = 'https://www.weddingwire.com/destination-wedding/destination/sesmarias-turismo-rural-spa--e2211424';
  const sourceName = 'WeddingWire';
  const price = 5000;
  const priceUnit = '€';
  const sortOrder = 6;

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
