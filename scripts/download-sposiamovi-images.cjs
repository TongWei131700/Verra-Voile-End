/**
 * 下载 sposiamovi 所有外部图片到本地，并更新数据库中的 URL 为本地路径
 */
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')

const SLUG = 'sposiamovi'
const OUT_DIR = path.join(__dirname, '../uploads/crawled', SLUG)
const DB_CONFIG = { host: 'localhost', port: 3306, user: 'root', password: '', database: 'verra_voile' }

// 确保输出目录存在
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

/**
 * 下载单个文件，返回本地相对路径
 */
function download(url, subDir) {
  return new Promise((resolve) => {
    const ext = path.extname(new URL(url).pathname) || '.jpg'
    const basename = path.basename(new URL(url).pathname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80)
    const dir = path.join(OUT_DIR, subDir)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const localFile = path.join(dir, `${basename}${ext}`)
    const localPath = `/uploads/crawled/${SLUG}/${subDir}/${basename}${ext}`

    // 已存在则跳过
    if (fs.existsSync(localFile) && fs.statSync(localFile).size > 0) {
      console.log('  [SKIP]', localPath)
      return resolve(localPath)
    }

    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://sposiamovi.it/',
      },
      timeout: 20000,
    }, (res) => {
      // 处理重定向
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        console.log('  [REDIRECT]', res.headers.location)
        return download(res.headers.location, subDir).then(resolve)
      }
      if (res.statusCode !== 200) {
        console.log('  [FAIL]', url, '-> HTTP', res.statusCode)
        return resolve('')
      }
      const ws = fs.createWriteStream(localFile)
      res.pipe(ws)
      ws.on('finish', () => {
        const size = fs.statSync(localFile).size
        console.log('  [OK]', localPath, `(${(size/1024).toFixed(0)}KB)`)
        resolve(localPath)
      })
      ws.on('error', () => { resolve('') })
    })
    req.on('error', (e) => {
      console.log('  [ERR]', url, e.message)
      resolve('')
    })
    req.on('timeout', () => {
      req.destroy()
      console.log('  [TIMEOUT]', url)
      resolve('')
    })
  })
}

async function main() {
  const pool = mysql.createPool(DB_CONFIG)
  const [rows] = await pool.execute('SELECT * FROM crawled_wedding_teams WHERE slug = ?', [SLUG])
  if (!rows.length) { console.log('No sposiamovi found'); await pool.end(); return }
  const row = rows[0]

  const parse = (v) => typeof v === 'string' ? (v ? JSON.parse(v) : []) : (v || [])
  const images = parse(row.images)
  const members = parse(row.team_members)

  console.log('=== 下载 sposiamovi 图片 ===')

  // 1. cover_image
  console.log('\n[cover_image]')
  const coverLocal = row.cover_image ? await download(row.cover_image, 'cover') : ''

  // 2. headshot
  console.log('\n[headshot]')
  const headshotLocal = row.headshot ? await download(row.headshot, 'headshot') : ''

  // 3. portfolio images
  console.log('\n[portfolio images] (' + images.length + ')')
  const newImages = []
  for (let i = 0; i < images.length; i++) {
    const url = typeof images[i] === 'string' ? images[i] : images[i].url
    process.stdout.write(`  (${i+1}/${images.length}) `)
    const local = await download(url, 'portfolio')
    newImages.push(local || url) // 失败则保留原 URL
  }

  // 4. team member images
  console.log('\n[team members] (' + members.length + ')')
  const newMembers = []
  for (let i = 0; i < members.length; i++) {
    const m = { ...members[i] }
    if (m.image) {
      process.stdout.write(`  (${i+1}/${members.length}) `)
      const local = await download(m.image, 'team')
      if (local) m.image = local
    }
    newMembers.push(m)
  }

  // 5. 更新数据库
  console.log('\n=== 更新数据库 ===')
  await pool.execute(
    'UPDATE crawled_wedding_teams SET cover_image=?, headshot=?, images=?, team_members=? WHERE slug=?',
    [
      coverLocal || row.cover_image,
      headshotLocal || row.headshot,
      JSON.stringify(newImages),
      JSON.stringify(newMembers),
      SLUG,
    ]
  )
  console.log('Done!')

  // 统计
  const okImages = newImages.filter(p => p.startsWith('/uploads/')).length
  const okMembers = newMembers.filter(m => m.image && m.image.startsWith('/uploads/')).length
  console.log(`\nSummary: cover=${coverLocal ? 'OK' : 'FAIL'}, headshot=${headshotLocal ? 'OK' : 'FAIL'}, portfolio=${okImages}/${images.length}, members=${okMembers}/${members.length}`)

  await pool.end()
}

main().catch(e => { console.error(e); process.exit(1) })
