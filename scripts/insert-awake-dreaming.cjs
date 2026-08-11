/**
 * 插入 Awake and Dreaming Photography 到 crawled_photographers 表
 * 运行方式：ssh 到服务器后 node scripts/insert-awake-dreaming.cjs
 */
require('dotenv').config()
const mysql = require('mysql2/promise')

const LOCAL = '/uploads/crawled/photographers'

const p = {
  slug: 'awake-and-dreaming',
  name: 'Awake and Dreaming Photography',
  name_cn: '唤醒与逐梦摄影',
  source_url: 'https://junebugweddings.com/vendors/wedding-photographers/ireland/Awake-and-Dreaming',
  source_name: 'Junebug Weddings',
  category: 'ireland',
  category_cn: '爱尔兰 · 目的地婚礼',
  country: '爱尔兰',
  country_en: 'Ireland',
  tagline: '爱尔兰 · 全球目的地 | 捕捉生命中最真实的感动瞬间',
  description: 'Awake and Dreaming 由 David 与 Laurie 这对充满默契的夫妻档组成，他们以对摄影的无限热忱与天赋，打造出独具个人风格的婚礼影像。深受爱尔兰壮丽海岸线的启发，他们的作品呈现出对色彩、构图与形式的独特理解。无论是任何一场冒险、庆典或人生里程碑，他们都能以有机、空灵的影像语言，记录下生活中最美好的时刻。足迹遍布爱尔兰及全球各地。',
  photo_styles: ['真实情感', '空灵美学', '目的地婚礼', '纪实叙事'],
  highlights: ['夫妻档双人拍摄', '爱尔兰目的地专家', '空灵有机影像风格', '全球目的地可用'],
  style: [
    { title: '风格定位', items: [
      { label: '真实情感记录', desc: '专注捕捉自然流露的情感与真实瞬间' },
      { label: '空灵有机美学', desc: '画面充满梦幻质感与自然韵味（ethereal & organic）' },
      { label: '目的地婚礼', desc: '服务覆盖爱尔兰全境及全球目的地' },
    ]},
    { title: '服务特色', items: [
      { label: '夫妻档双人拍摄', desc: '双视角捕捉，视角更丰富全面' },
      { label: '独特色彩与构图', desc: '对色彩、形状与构图有独到的鉴赏力' },
      { label: '欢乐轻松的拍摄体验', desc: '以感染力十足的亲和力让新人完全放松' },
    ]},
  ],
  cover_image: `${LOCAL}/awake-and-dreaming/00_img-0.jpg`,
  headshot: '',
  images: [
    `${LOCAL}/awake-and-dreaming/00_img-0.jpg`,
    `${LOCAL}/awake-and-dreaming/01_img-1.jpg`,
    `${LOCAL}/awake-and-dreaming/02_img-2.jpg`,
    `${LOCAL}/awake-and-dreaming/03_img-3.jpg`,
    `${LOCAL}/awake-and-dreaming/04_img-4.jpg`,
    `${LOCAL}/awake-and-dreaming/05_img-5.jpg`,
    `${LOCAL}/awake-and-dreaming/06_img-6.jpg`,
    `${LOCAL}/awake-and-dreaming/07_img-7.jpg`,
    `${LOCAL}/awake-and-dreaming/08_img-8.jpg`,
    `${LOCAL}/awake-and-dreaming/09_img-9.jpg`,
    `${LOCAL}/awake-and-dreaming/10_img-10.jpg`,
    `${LOCAL}/awake-and-dreaming/11_img-11.jpg`,
    `${LOCAL}/awake-and-dreaming/12_img-12.jpg`,
    `${LOCAL}/awake-and-dreaming/13_img-13.jpg`,
    `${LOCAL}/awake-and-dreaming/14_img-14.jpg`,
    `${LOCAL}/awake-and-dreaming/15_img-15.jpg`,
    `${LOCAL}/awake-and-dreaming/16_img-16.jpg`,
    `${LOCAL}/awake-and-dreaming/17_img-17.jpg`,
    `${LOCAL}/awake-and-dreaming/18_img-18.jpg`,
    `${LOCAL}/awake-and-dreaming/19_img-19.jpg`,
    `${LOCAL}/awake-and-dreaming/20_img-20.jpg`,
    `${LOCAL}/awake-and-dreaming/21_img-21.jpg`,
    `${LOCAL}/awake-and-dreaming/22_img-22.jpg`,
    `${LOCAL}/awake-and-dreaming/23_img-23.jpg`,
  ],
  video_url: '',
  website: 'https://awakeanddreamingweddings.com',
  price: 260,
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  // 获取当前最大 sort_order
  const [maxRows] = await pool.execute('SELECT COALESCE(MAX(sort_order), 0) AS m FROM crawled_photographers')
  const sort = maxRows[0].m + 1

  await pool.execute(
    `INSERT INTO crawled_photographers
      (slug, name, name_cn, source_url, source_name, category, category_cn, country, country_en,
       tagline, description, photo_styles, highlights, style, cover_image, headshot, images,
       video_url, website, price, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name=VALUES(name), name_cn=VALUES(name_cn), source_url=VALUES(source_url),
       source_name=VALUES(source_name), category=VALUES(category), category_cn=VALUES(category_cn),
       country=VALUES(country), country_en=VALUES(country_en), tagline=VALUES(tagline),
       description=VALUES(description), photo_styles=VALUES(photo_styles),
       highlights=VALUES(highlights), style=VALUES(style), cover_image=VALUES(cover_image),
       headshot=VALUES(headshot), images=VALUES(images), video_url=VALUES(video_url),
       website=VALUES(website), price=VALUES(price), sort_order=VALUES(sort_order)`,
    [
      p.slug, p.name, p.name_cn, p.source_url, p.source_name,
      p.category, p.category_cn, p.country, p.country_en,
      p.tagline, p.description,
      JSON.stringify(p.photo_styles), JSON.stringify(p.highlights), JSON.stringify(p.style),
      p.cover_image, p.headshot, JSON.stringify(p.images),
      p.video_url, p.website, p.price, sort,
    ]
  )
  console.log(`✅ ${p.name_cn} (${p.slug}) 已插入/更新，sort_order=${sort}`)

  // 验证
  const [rows] = await pool.execute('SELECT slug, name, name_cn, category, country, images FROM crawled_photographers WHERE slug = ?', [p.slug])
  if (rows.length > 0) {
    const r = rows[0]
    const imgCount = Array.isArray(r.images) ? r.images.length : JSON.parse(r.images || '[]').length
    console.log(`验证: ${r.name_cn} | ${r.country} | ${imgCount} 张图片`)
  }

  await pool.end()
}

main().catch(err => {
  console.error('❌ 插入失败:', err.message)
  process.exit(1)
})
