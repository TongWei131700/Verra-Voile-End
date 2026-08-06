/**
 * 提取 Villa Cariola 的 WeddingWire 视频 URL
 */
const puppeteer = require('puppeteer-core')

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TARGET = 'https://www.weddingwire.com/videos/villa-cariola/791e099b2d03fc59.html'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  const videoUrls = new Set()

  page.on('request', (req) => {
    const url = req.url()
    if (/\.(mp4|m3u8|webm)/i.test(url)) {
      videoUrls.add(url)
      console.log('[mp4]', url)
    }
  })

  page.on('response', async (resp) => {
    const url = resp.url()
    const ct = resp.headers()['content-type'] || ''
    if (/video/i.test(ct)) {
      videoUrls.add(url)
      console.log('[video-ct]', url)
    }
  })

  await page.goto('https://www.weddingwire.com/', { waitUntil: 'networkidle2', timeout: 20000 })
  await new Promise(r => setTimeout(r, 2000))

  console.log('访问视频页...')
  await page.goto(TARGET, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 5000))

  const title = await page.title()
  console.log('页面标题:', title)

  // 从 HTML 提取 mp4 URL
  const html = await page.content()
  const mp4Matches = html.match(/https?:\/\/cdn0\.(weddingwire|matrimonio)\.com\/emp\/videos\/[^"\\<>]+\.mp4/gi) || []
  mp4Matches.forEach(u => videoUrls.add(u))

  console.log('\n=== 视频 URL ===')
  const mp4Only = [...videoUrls].filter(u => u.includes('.mp4') && u.includes('cdn0'))
  mp4Only.forEach(u => console.log(u))

  if (mp4Only.length === 0) {
    console.log('未找到视频，尝试访问商家页视频链接...')
    await page.goto('https://www.weddingwire.com/biz/villa-cariola/791e099b2d03fc59.html', { waitUntil: 'networkidle2', timeout: 30000 })
    await new Promise(r => setTimeout(r, 3000))
    
    // 查找视频链接
    const videoLink = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="video"]')
      return Array.from(links).map(a => a.href)
    })
    console.log('视频相关链接:', videoLink)
    
    const html2 = await page.content()
    const mp4Matches2 = html2.match(/https?:\/\/cdn0\.(weddingwire|matrimonio)\.com\/emp\/videos\/[^"\\<>]+\.mp4/gi) || []
    mp4Matches2.forEach(u => videoUrls.add(u))
    
    console.log('\n=== 补充视频 URL ===')
    const mp4Only2 = [...videoUrls].filter(u => u.includes('.mp4') && u.includes('cdn0'))
    mp4Only2.forEach(u => console.log(u))
  }

  await new Promise(r => setTimeout(r, 3000))
  await browser.close()
}

main().catch(console.error)
