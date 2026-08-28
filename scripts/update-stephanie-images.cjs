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

  const newImages = [
    `${LOCAL}/00.jpg`,
    `${LOCAL}/01.jpg`,
    `${LOCAL}/02.jpg`,
    `${LOCAL}/03_first-kiss-altar.jpg`,
    `${LOCAL}/04_couple-kiss-wall.jpg`,
    `${LOCAL}/06_wedding-moment.jpg`,
    `${LOCAL}/07_dancing-sunset.jpg`,
    `${LOCAL}/08_ronaldo-celina-wedding.jpg`,
    `${LOCAL}/09_raco-ibiza-wedding.jpg`,
    `${LOCAL}/10_mallorca-editorial.jpg`,
    `${LOCAL}/11_couple-portrait.jpg`,
    `${LOCAL}/12_wedding-detail.jpg`,
  ]

  const [result] = await pool.execute(
    `UPDATE crawled_photographers SET images = ? WHERE slug = ?`,
    [JSON.stringify(newImages), 'stephanie-shenton-photography']
  )

  console.log(`✅ 更新完成，影响行数: ${result.affectedRows}`)
  console.log(`   图片数量: ${newImages.length}`)
  await pool.end()
}

main()
