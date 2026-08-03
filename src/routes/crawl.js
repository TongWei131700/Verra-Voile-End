const express = require('express')
const { crawlGreeceDestinations, crawlUKVenues, crawlFranceVenues, getCrawlState } = require('./crawler')

const router = express.Router()

/**
 * POST /api/crawl/start
 * 触发爬取任务（异步执行，立即返回）
 * Body: { country: 'greece', limit: 5 }
 */
router.post('/start', async (req, res) => {
  try {
    const { country = 'greece', limit = 5 } = req.body

    const supportedCountries = { greece: '希腊', uk: '英国', france: '法国' }
    const countryKey = country.toLowerCase()
    const countryLabel = supportedCountries[countryKey]

    if (!countryLabel) {
      return res.status(400).json({ success: false, message: `不支持的国家: ${country}，目前支持: ${Object.keys(supportedCountries).join(', ')}` })
    }

    const state = getCrawlState()
    if (state.running) {
      return res.json({ success: false, message: '已有爬取任务正在运行', state })
    }

    // 异步执行爬取，立即返回
    res.json({
      success: true,
      message: `爬取任务已启动，完成后将通过邮件通知`,
      country: countryLabel
    })

    // 后台执行爬取
    const crawlMap = { uk: crawlUKVenues, france: crawlFranceVenues }
    const crawlFn = crawlMap[countryKey] || crawlGreeceDestinations
    crawlFn(limit).catch(err => {
      console.error('爬取任务失败:', err.message)
    })
  } catch (err) {
    console.error('启动爬取失败:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * GET /api/crawl/state
 * 获取当前爬取状态
 */
router.get('/state', (req, res) => {
  const state = getCrawlState()
  res.json({ success: true, data: state })
})

module.exports = router
