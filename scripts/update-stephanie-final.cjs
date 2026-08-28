const mysql = require('mysql2/promise')
require('dotenv').config()

const LOCAL = '/uploads/crawled/photographers/stephanie-shenton-photography'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 所有作品图片（不含 headshot）
  const images = [
    '00.jpg','01.jpg','02.jpg',
    '03_first-kiss-altar.jpg','04_couple-kiss-wall.jpg','06_wedding-moment.jpg',
    '07_dancing-sunset.jpg','08_ronaldo-celina-wedding.jpg','09_raco-ibiza-wedding.jpg',
    '10_mallorca-editorial.jpg','11_couple-portrait.jpg','12_wedding-detail.jpg',
    '13_aisle-bw.jpg','14_altar-flowers.jpg','15_ronaldo-reception-bw.jpg',
    '16_wedding-portrait.jpg','17_bride-twirling.jpg','18_wedding-detail2.jpg',
    '19_ronaldo-reception-setup.jpg','20_wedding-panorama.jpg','21_cliffside-villa.jpg',
    '22_wedding-ceremony.jpg','23_bride-stone-wall.jpg','24_altar-ceremony.jpg',
    '25_couple-sunglasses-bw.jpg','26_wedding-portrait2.jpg','27_wedding-detail3.jpg',
    '28_wedding-portrait3.jpg','29_bride-lace-veil.jpg','30_reception-hugging.jpg',
    '31_performers-white.jpg','32_wedding-portrait4.jpg','33_wedding-panorama2.jpg',
    '34_wedding-portrait5.jpg','35_sunset-palm.jpg','36_pasta-show.jpg',
  ].map(f => `${LOCAL}/${f}`)

  // 更新图片列表和封面（用第一张作为封面）
  const [result] = await pool.execute(
    `UPDATE crawled_photographers SET images = ?, cover_image = ? WHERE slug = ?`,
    [JSON.stringify(images), `${LOCAL}/00.jpg`, 'stephanie-shenton-photography']
  )

  console.log(`✅ 更新完成，影响行数: ${result.affectedRows}`)
  console.log(`   图片总数: ${images.length}`)
  
  // 验证
  const [rows] = await pool.execute('SELECT images FROM crawled_photographers WHERE slug = ?', ['stephanie-shenton-photography'])
  const stored = JSON.parse(rows[0].images)
  console.log(`   数据库验证: ${stored.length} 张图片`)
  
  await pool.end()
}

main()
