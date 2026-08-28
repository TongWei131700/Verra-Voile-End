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

  const images = [
    '00.jpg','01.jpg','02.jpg',
    '13_aisle-bw.jpg','14_altar-flowers.jpg','15_ronaldo-reception-bw.jpg',
    '16_bride-twirling.jpg','17_couple-golden-hour.jpg','18_cliffside-villa.jpg',
    '19_bride-stone-wall.jpg','20_altar-ceremony.jpg','21_couple-sunglasses-bw.jpg',
    '22_bride-lace-veil.jpg','23_sunset-palm.jpg','24_pasta-show.jpg',
  ].map(f => `${LOCAL}/${f}`)

  await pool.execute(
    `UPDATE crawled_photographers SET images = ? WHERE slug = ?`,
    [JSON.stringify(images), 'stephanie-shenton-photography']
  )

  console.log(`✅ 更新完成: ${images.length} 张图片`)
  await pool.end()
}
main()
