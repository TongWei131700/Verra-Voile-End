/**
 * 下载 La Fête 原站图片到本地
 * 图片来源: la-fete.com
 */
const https = require('https')
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const BASE_DIR = path.join(__dirname, '../uploads/crawled/la-fete')

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://la-fete.com/',
      },
      timeout: 30000,
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const ws = fs.createWriteStream(dest)
      res.pipe(ws)
      ws.on('finish', () => { ws.close(); resolve() })
      ws.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout for ${url}`)) })
  })
}

async function main() {
  // 原站图片 URL
  const cover = 'https://la-fete.com/wp-content/uploads/2025/05/La-Fete-Who-We-Are.jpg'
  const headshot = 'https://la-fete.com/wp-content/uploads/2025/05/The-La-Fete-Team.png'
  const portfolio = [
    'https://la-fete.com/wp-content/uploads/2025/05/French-Wedding-Couple-and-Groomsmen-1.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Indian-Wedding-Hampton-Court-Palace.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Luxury-Italian-Wedding-at-la-Foce-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/La-Fete-Jewish-Party-Events-Organiser.jpeg',
    'https://la-fete.com/wp-content/uploads/2025/05/Luxurious-Weddings-Planned-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Luxury-Spanish-Beach-Wedding-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Hackett-London-Corporate-Event-with-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Engaged-Couple-at-their-Party-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/Awards-Ceremony-Planned-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/RSVP-Networking-Meetup-Planned-by-La-Fete.jpg',
    'https://la-fete.com/wp-content/uploads/2025/05/60th-Anniversary-Party-Organised-by-La-Fete.jpg',
  ]

  // 创建目录
  fs.mkdirSync(path.join(BASE_DIR, 'cover'), { recursive: true })
  fs.mkdirSync(path.join(BASE_DIR, 'headshot'), { recursive: true })
  fs.mkdirSync(path.join(BASE_DIR, 'portfolio'), { recursive: true })

  let ok = 0, fail = 0

  // 下载封面
  try {
    const ext = '.jpg'
    await download(cover, path.join(BASE_DIR, 'cover', `cover${ext}`))
    console.log(`✅ cover/cover${ext}`)
    ok++
  } catch (e) {
    console.error(`❌ cover: ${e.message}`)
    fail++
  }

  // 下载头像
  try {
    const ext = '.png'
    await download(headshot, path.join(BASE_DIR, 'headshot', `headshot${ext}`))
    console.log(`✅ headshot/headshot${ext}`)
    ok++
  } catch (e) {
    console.error(`❌ headshot: ${e.message}`)
    fail++
  }

  // 下载作品集
  for (let i = 0; i < portfolio.length; i++) {
    const url = portfolio[i]
    const ext = path.extname(url).split('?')[0] || '.jpg'
    const name = `${String(i + 1).padStart(2, '0')}${ext}`
    try {
      await download(url, path.join(BASE_DIR, 'portfolio', name))
      console.log(`✅ portfolio/${name}`)
      ok++
    } catch (e) {
      console.error(`❌ portfolio/${name}: ${e.message}`)
      fail++
    }
  }

  console.log(`\n下载完成: ${ok} 成功, ${fail} 失败`)

  // 更新数据库
  const pool = mysql.createPool({ host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile' })

  const localCover = '/uploads/crawled/la-fete/cover/cover.jpg'
  const localHeadshot = '/uploads/crawled/la-fete/headshot/headshot.png'
  const localPortfolio = portfolio.map((_, i) => `/uploads/crawled/la-fete/portfolio/${String(i + 1).padStart(2, '0')}${path.extname(portfolio[i]).split('?')[0] || '.jpg'}`)

  await pool.execute(
    'UPDATE crawled_wedding_teams SET cover_image = ?, headshot = ?, images = ? WHERE slug = ?',
    [localCover, localHeadshot, JSON.stringify(localPortfolio), 'la-fete']
  )
  console.log('✅ 数据库已更新')

  await pool.end()
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
