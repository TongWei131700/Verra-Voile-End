const express = require('express')
const router = express.Router()
const { pool } = require('../db')

/**
 * POST /api/analytics/report
 * 批量上报埋点事件
 * Body: { events: [{ sessionId, eventType, pagePath, referrer, elementId, metadata }] }
 */
router.post('/report', async (req, res) => {
  try {
    const { events } = req.body
    if (!Array.isArray(events) || events.length === 0) {
      return res.json({ success: true, inserted: 0 })
    }

    // 从请求中提取公共信息
    const ua = req.headers['user-agent'] || ''
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || ''

    // 获取用户标识（前端在 metadata 中传递 userToken）
    const placeholders = []
    const values = []
    for (const ev of events) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      values.push(
        ev.sessionId || '',
        ev.userToken || '',
        ev.eventType || 'unknown',
        ev.pagePath || '',
        ev.referrer || '',
        ev.elementId || '',
        ev.metadata ? JSON.stringify(ev.metadata) : null,
        ua.substring(0, 500),
        ip.substring(0, 45),
        ev.createdAt || new Date().toISOString()  // 前端未传则用服务器当前时间
      )
    }

    const sql = `INSERT INTO analytics_events (session_id, user_token, event_type, page_path, referrer, element_id, metadata, user_agent, ip, created_at) VALUES ${placeholders.join(', ')}`
    const [result] = await pool.execute(sql, values)

    res.json({ success: true, inserted: result.affectedRows })
  } catch (err) {
    console.error('埋点上报失败:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/analytics/overview
 * 数据概览：今日 PV/UV、最近 7 天趋势
 */
router.get('/overview', async (req, res) => {
  try {
    // 今日 PV
    const [pvRows] = await pool.execute(
      `SELECT COUNT(*) as pv FROM analytics_events WHERE DATE(created_at) = CURDATE()`
    )
    // 今日 UV（按 session_id 去重）
    const [uvRows] = await pool.execute(
      `SELECT COUNT(DISTINCT session_id) as uv FROM analytics_events WHERE DATE(created_at) = CURDATE()`
    )
    // 昨日 PV / UV
    const [yesterdayPv] = await pool.execute(
      `SELECT COUNT(*) as pv FROM analytics_events WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
    )
    const [yesterdayUv] = await pool.execute(
      `SELECT COUNT(DISTINCT session_id) as uv FROM analytics_events WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
    )
    // 最近 7 天每日 PV
    const [trend] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as pv, COUNT(DISTINCT session_id) as uv
       FROM analytics_events
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY date`
    )
    // 总事件数
    const [total] = await pool.execute(`SELECT COUNT(*) as cnt FROM analytics_events`)

    res.json({
      success: true,
      data: {
        todayPv: pvRows[0].pv,
        todayUv: uvRows[0].uv,
        yesterdayPv: yesterdayPv[0].pv,
        yesterdayUv: yesterdayUv[0].uv,
        totalEvents: total[0].cnt,
        trend,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/analytics/top-pages
 * 热门页面 Top N
 */
router.get('/top-pages', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const [rows] = await pool.query(
      `SELECT page_path, COUNT(*) as pv, COUNT(DISTINCT session_id) as uv
       FROM analytics_events
       WHERE event_type = 'page_view' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
       GROUP BY page_path ORDER BY pv DESC LIMIT ${limit}`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/analytics/events
 * 按事件类型统计
 */
router.get('/events', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const [rows] = await pool.query(
      `SELECT event_type, COUNT(*) as count, COUNT(DISTINCT session_id) as sessions
       FROM analytics_events
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
       GROUP BY event_type ORDER BY count DESC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * GET /api/analytics/timeline
 * 最近事件时间线（Admin 查看用）
 */
router.get('/timeline', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const [rows] = await pool.query(
      `SELECT id, session_id, user_token, event_type, page_path, element_id, metadata, created_at
       FROM analytics_events ORDER BY id DESC LIMIT ${limit}`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
