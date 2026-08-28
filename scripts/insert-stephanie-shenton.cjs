#!/usr/bin/env node
/**
 * 插入摄影师 Stephanie Shenton Photography 到数据库
 * 数据来源：stephanieshentonphotography.com 官网爬取
 */
const mysql = require('mysql2/promise')
require('dotenv').config()

const LOCAL = '/uploads/crawled/photographers/stephanie-shenton-photography'

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
    waitForConnections: true,
    connectionLimit: 1,
  })

  const slug = 'stephanie-shenton-photography'
  const data = {
    slug,
    name: 'Stephanie Shenton Photography',
    name_cn: '斯蒂芬妮·申顿摄影',
    source_url: 'https://www.stephanieshentonphotography.com/',
    source_name: 'stephanieshentonphotography.com',
    category: 'spain',
    category_cn: '西班牙 · 目的地婚礼',
    country: '西班牙',
    country_en: 'Spain',
    tagline: '伊比萨岛目的地婚礼 · 婚礼摄影记者与时尚编辑风格',
    description: `我是一名婚礼摄影记者，对爱本身充满热爱。我被人与人之间的情感连接所吸引，被相聚时刻的美好所打动。我的热情在于捕捉真实——人们毫无防备的一面，并始终寻找 ways 来呈现它，让你不仅能看到那个瞬间，更能真切地感受到它。

凭借时尚摄影背景，我的作品自然倾向于编辑风格。当我记录婚礼时，我将每一帧都视为捕捉人物的机会，如同艺术。

我着迷于个性与连接的细节，着迷于人们爱着人们的艺术。每一场婚礼都是一个全新的故事，我的目标是通过影像来讲述那个故事——将编辑构图的优雅与真实生活的原始之美融为一体。

对我而言，摄影关乎连接。这是我庆祝爱情及其无数展开方式的方式。`,
    photo_styles: ['纪实摄影', '编辑风格', '自然光', '目的地婚礼', '时尚婚礼'],
    highlights: ['伊比萨岛在地摄影师', '婚礼摄影记者', '时尚编辑风格', '真实情感捕捉', '23年伊比萨生活经验'],
    style: [
      {
        title: '风格定位',
        items: [
          { label: '婚礼摄影记者', desc: '捕捉真实、未编排的瞬间（raw & unscripted moments）' },
          { label: '编辑风格', desc: '时尚背景赋予的艺术构图（editorial composition）' },
          { label: '自然光运用', desc: '以自然光为核心，呈现真实质感' },
        ],
      },
      {
        title: '拍摄手法',
        items: [
          { label: '融入式记录', desc: '成为庆典的一部分，而非旁观者' },
          { label: '情感驱动', desc: '让人物、能量、动态引导拍摄' },
          { label: '不干预真实', desc: '不强迫瞬间，不转移焦点' },
        ],
      },
      {
        title: '服务特色',
        items: [
          { label: '23年伊比萨经验', desc: '深谙伊比萨岛的光线与场地' },
          { label: '真实情感捕捉', desc: '让你记住当时的感受，而非仅仅是模样' },
          { label: '时尚与纪实融合', desc: '优雅构图 × 原始真实' },
        ],
      },
    ],
    cover_image: `${LOCAL}/00.jpg`,
    headshot: `${LOCAL}/headshot.jpg`,
    images: [
      // 前 3 张：原有 Junebug 爬取图片
      `${LOCAL}/00.jpg`,
      `${LOCAL}/01.jpg`,
      `${LOCAL}/02.jpg`,
      // 官网作品
      `${LOCAL}/03_first-kiss-altar.jpg`,
      `${LOCAL}/04_couple-kiss-wall.jpg`,
      `${LOCAL}/06_wedding-moment.jpg`,
      `${LOCAL}/07_dancing-sunset.jpg`,
      `${LOCAL}/08_ronaldo-celina-wedding.jpg`,
      `${LOCAL}/09_raco-ibiza-wedding.jpg`,
      `${LOCAL}/10_mallorca-editorial.jpg`,
      `${LOCAL}/11_couple-portrait.jpg`,
      `${LOCAL}/12_wedding-detail.jpg`,
    ],
    video_url: '',
    website: 'https://www.stephanieshentonphotography.com/',
    price: 280,
    sort_order: 100,
  }

  try {
    // 检查是否已存在
    const [existing] = await pool.execute('SELECT id FROM crawled_photographers WHERE slug = ?', [slug])
    if (existing.length > 0) {
      console.log(`⚠️  摄影师 ${slug} 已存在（ID: ${existing[0].id}），跳过插入`)
      await pool.end()
      return
    }

    // 插入数据
    const [result] = await pool.execute(
      `INSERT INTO crawled_photographers 
       (slug, name, name_cn, source_url, source_name, category, category_cn, country, country_en, 
        tagline, description, photo_styles, highlights, style, cover_image, headshot, images, 
        video_url, website, price, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.slug,
        data.name,
        data.name_cn,
        data.source_url,
        data.source_name,
        data.category,
        data.category_cn,
        data.country,
        data.country_en,
        data.tagline,
        data.description,
        JSON.stringify(data.photo_styles),
        JSON.stringify(data.highlights),
        JSON.stringify(data.style),
        data.cover_image,
        data.headshot,
        JSON.stringify(data.images),
        data.video_url,
        data.website,
        data.price,
        data.sort_order,
      ]
    )

    console.log(`✅ 成功插入摄影师 ${data.name_cn}（${data.name}）`)
    console.log(`   ID: ${result.insertId}`)
    console.log(`   图片数量: ${data.images.length}`)
    console.log(`   国家: ${data.country}`)
    console.log(`   官网: ${data.website}`)
  } catch (err) {
    console.error('❌ 插入失败:', err.message)
  } finally {
    await pool.end()
  }
}

main()
