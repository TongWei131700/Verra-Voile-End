require('dotenv').config()
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  const slug = 'test-uk-morden-hall'
  const desc = `Nestled among sweeping National Trust parkland and private gardens bordered by the tranquil River Wandle, Morden Hall in Sutton, Surrey, is a picturesque wedding venue. This elegant country house shines exclusively for you amid its picturesque parkland surroundings. It feels miles from anywhere, creating a sense of escape for your big day.

Flow of the Day

Entirely yours for the day, celebrations at Morden Hall start in the Cherry Suite, a luxurious, sunlit room with modern décor where you can relax with your party before the ceremony begins. You then make a grand entrance down the ornate staircase and exchange your vows as the sunlight streams in the windows of the Willow Room. Enjoy a drinks reception outside on the plush, manicured lawn after to toast to your status as newlyweds, before entering the Mulbery Suite for your wedding meal. Finally, dance the night away in style with your friends and loved ones as you celebrate one of the happiest days of your lives.

Services Offered

To make your big day extra special, our recommended caterers and events team at Morden Hall will be on hand to help you design a day to remember. You can work with the caterers to create a bespoke menu, with options ranging from a casual meal to five-course fine dining and spectacular evening food. Every dish they make is of the highest standard and can be tailored to suit your needs and tastes. This venue will be exclusively yours for the duration of your big day.`

  const tagline = 'Morden Hall - Exclusive wedding venue in Sutton, Surrey'

  const images = ["https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/rs-886_4_197059-172838956393130.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/cd-summer-morden-hall-wedding-modern-editorial-35mm-film-the-chamberlins-london-wedding-photography-1_4_197059-174611258094869.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/an-134_4_197059-172838690726653.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/kerry-and-shahan-310_4_197059-172838735421185.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/an-442_4_197059-172838687638710.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/reecha-ameel-civil-105_4_197059-172838811317763.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/rs-442_4_197059-172838740652742.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/safiarob-28_4_197059-172838773764730.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/3d4a4910_4_197059-172838988994110.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/cd-summer-morden-hall-wedding-modern-editorial-35mm-film-the-chamberlins-london-wedding-photography-447_4_197059-174611274440225.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/nm0034_4_197059-172838946530963.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/london-wedding-photographer-41_4_197059-172839010498387.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/dl-sneakpeek33_4_197059-172863966891695.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/yasmin-27_4_197059-172838765647509.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/gallery_4_197059-172863936077492.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/jocelyn-joe-joanna-nicole-photography-789-copy_4_197059-172838698063837.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/events_4_197059-172863937417164.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/ch-134_4_197059-172838724780519.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/hazelwilf-hq-6_4_197059-172838805140406.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/micaelakarina-kristinasam-previews-73_4_197059-172838974361395.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/3d4a0845_4_197059-172840038249790.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/cynthia-sam-332_4_197059-172839000734478.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/8g9a4688_4_197059-172838794899622.jpeg","https://cdn0.hitched.co.uk/vendor/7059/3_2/1920/jpg/an-986_4_197059-172838759165856.jpeg"]
  const features = ["Exclusive use for your big day","Cherry Suite preparation room","Ornate staircase ceremony in Willow Room","Outdoor drinks reception on manicured lawn","Mulbery Suite wedding reception","National Trust parkland surroundings","Bespoke catering from casual to fine dining","Recommended caterers and events team"]

  await pool.execute('DELETE FROM cv_test_uk WHERE slug=?', [slug])
  await pool.execute('DELETE FROM cd_test_uk WHERE slug=?', [slug])
  await pool.execute('DELETE FROM products WHERE product_id=?', [slug])

  await pool.execute(
    `INSERT INTO cv_test_uk (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,rating,review_count,location,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug,'Morden Hall','Morden Hall','Test United Kingdom','测试英国','https://www.weddingwire.com/destination-wedding/united-kingdom/morden-hall--e2229594',tagline,'',desc,'',JSON.stringify(features),JSON.stringify([{name:'Country House',name_en:'Country House'}]),JSON.stringify([{name:'Morden Hall Road Sutton',name_cn:''}]),JSON.stringify(images),'[]','[]','[]',images[0],'4.9','60','Morden Hall Road Sutton, SM4 5JD',100]
  )
  await pool.execute(
    `INSERT INTO cd_test_uk (slug,name,name_cn,country,country_cn,source_url,tagline,tagline_cn,description,description_cn,features,venue_types,towns,images,budget_ranges,guest_capacities,faq,cover_image,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug,'Morden Hall','Morden Hall','Test United Kingdom','测试英国','https://www.weddingwire.com/destination-wedding/united-kingdom/morden-hall--e2229594',tagline,'',desc,'',JSON.stringify(features),JSON.stringify([{name:'Country House',name_en:'Country House'}]),JSON.stringify([{name:'Morden Hall Road Sutton',name_cn:''}]),JSON.stringify(images),'[]','[]','[]',images[0],100]
  )
  await pool.execute(
    'INSERT INTO products (category_id,product_id,name,name_en,description,image,price,unit,highlight,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ['destination',slug,'Morden Hall','Morden Hall',tagline,images[0],0,'€','',100]
  )

  const [c1] = await pool.execute('SELECT COUNT(*) as c FROM cv_test_uk')
  const [c2] = await pool.execute('SELECT COUNT(*) as c FROM cd_test_uk')
  const [c3] = await pool.execute('SELECT COUNT(*) as c FROM cv_uk')
  console.log('✅ Morden Hall 已插入')
  console.log(`cv_test_uk: ${c1[0].c} | cd_test_uk: ${c2[0].c}`)
  console.log(`cv_uk (正式英国): ${c3[0].c} (未修改)`)

  await pool.end()
  console.log('🎉 完成')
}

main().catch(e => { console.error(e.message); process.exit(1) })
