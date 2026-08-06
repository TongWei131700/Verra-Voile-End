/**
 * 提取 Hotel Corallo 视频 URL - 绕过反爬
 */
const puppeteer = require('puppeteer-core')

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TARGET = 'https://www.weddingwire.com/videos/hotel-corallo/44a3158d30b11e5a.html'

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,  // 非 headless 模式
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

  const videoUrls = new Set()
  const allUrls = []

  page.on('request', (req) => {
    const url = req.url()
    allUrls.push(url)
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

  // 先正常访问首页
  console.log('访问首页...')
  await page.goto('https://www.weddingwire.com/', { waitUntil: 'networkidle2', timeout: 20000 })
  await new Promise(r => setTimeout(r, 3000))

  console.log('访问视频页...')
  await page.goto(TARGET, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 5000))

  // 检查页面标题
  const title = await page.title()
  console.log('页面标题:', title)
  console.log('总请求数:', allUrls.length)

  // 获取页面 HTML 并搜索视频相关内容
  const html = await page.content()
  
  // 搜索各种视频 URL 模式
  const patterns = [
    /https?:\/\/[^\s"'<>\\]+\.mp4[^\s"'<>\\]*/gi,
    /https?:\/\/[^\s"'<>\\]*video[^\s"'<>\\]*/gi,
    /"videoUrl"\s*:\s*"([^"]+)"/gi,
    /"video_url"\s*:\s*"([^"]+)"/gi,
    /"src"\s*:\s*"([^"]*video[^"]*)"/gi,
    /"file"\s*:\s*"([^"]*\.mp4[^"]*)"/gi,
    /data-video="([^"]+)"/gi,
    /data-src="([^"]*video[^"]*)"/gi,
  ]
  
  for (const p of patterns) {
    const matches = html.matchAll(p)
    for (const m of matches) {
      const url = m[1] || m[0]
      if (url && !url.includes('weddingwire.com/videos/hotel-corallo')) {
        videoUrls.add(url)
        console.log('[html-match]', url)
      }
    }
  }

  // 查找 video/source 元素
  const videoEls = await page.evaluate(() => {
    const results = []
    document.querySelectorAll('video, video source, [class*="video"]').forEach(el => {
      results.push({
        tag: el.tagName,
        className: el.className,
        src: el.src || '',
        currentSrc: el.currentSrc || '',
        innerHTML: el.innerHTML?.substring(0, 200) || '',
        outerHTML: el.outerHTML?.substring(0, 500) || '',
      })
    })
    return results
  })
  console.log('\n=== video 元素 ===')
  videoEls.forEach(v => console.log(JSON.stringify(v, null, 2)))

  // 查找视频缩略图并点击
  console.log('\n=== 查找可点击视频 ===')
  const clickableVideos = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="video"], [class*="Video"], a[href*="video"]')
    return Array.from(els).map(el => ({
      tag: el.tagName,
      class: el.className,
      href: el.href || '',
      text: el.textContent?.substring(0, 50) || '',
    }))
  })
  console.log('可点击视频元素:', JSON.stringify(clickableVideos, null, 2))

  // 尝试点击第一个视频
  if (clickableVideos.length > 0) {
    try {
      const selector = '[class*="video"], [class*="Video"]'
      const el = await page.$(selector)
      if (el) {
        console.log('点击视频元素...')
        await el.click()
        await new Promise(r => setTimeout(r, 8000))
        
        // 检查点击后新加载的视频
        const newVids = allUrls.filter(u => /\.(mp4|m3u8)/i.test(u))
        console.log('点击后 mp4:', newVids)
      }
    } catch (e) {
      console.log('点击失败:', e.message)
    }
  }

  console.log('\n=== 最终结果 ===')
  console.log('视频 URL 数量:', videoUrls.size)
  for (const u of videoUrls) console.log(u)

  // 如果没找到，输出所有 CDN 相关请求
  if (videoUrls.size === 0) {
    const cdnReqs = allUrls.filter(u => /cdn|static|assets|media/i.test(u))
    console.log('\nCDN 相关请求:')
    cdnReqs.forEach(u => console.log(u))
  }

  // 不自动关闭，等 5 秒让用户观察
  await new Promise(r => setTimeout(r, 5000))
  await browser.close()
}

main().catch(console.error)
