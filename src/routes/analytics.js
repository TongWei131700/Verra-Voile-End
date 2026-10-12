const express = require('express')
const router = express.Router()
const { pool } = require('../db')
const { sendMail } = require('./mailer')

// ISO 时间转 MySQL datetime 格式
function toMysqlDatetime(isoStr) {
  const d = new Date(isoStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 已通知过的 sessionId 集合（内存级，重启后重置）
const notifiedSessions = new Set()

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
        ev.createdAt ? toMysqlDatetime(ev.createdAt) : toMysqlDatetime(new Date().toISOString())  // 转为 MySQL datetime 格式
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

/**
 * GET /api/analytics/session/:sessionId
 * 按 sessionId 查询完整访问路径（全链路追踪）
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const [rows] = await pool.query(
      `SELECT id, event_type, page_path, referrer, element_id, metadata, created_at
       FROM analytics_events
       WHERE session_id = ?
       ORDER BY created_at ASC`,
      [sessionId]
    )
    
    // 构建访问路径摘要
    const pageViews = rows.filter(r => r.event_type === 'page_view')
    const pathSequence = pageViews.map(r => r.page_path)
    const duration = pageViews.length >= 2
      ? Math.round((new Date(pageViews[pageViews.length - 1].created_at) - new Date(pageViews[0].created_at)) / 1000)
      : 0
    
    res.json({
      success: true,
      data: {
        sessionId,
        totalEvents: rows.length,
        pageViewCount: pageViews.length,
        pathSequence,           // 访问路径数组 ["/", "/destinations", "/destinations/xxx"]
        durationSeconds: duration, // 会话时长（秒）
        firstPage: pathSequence[0] || null,
        lastPage: pathSequence[pathSequence.length - 1] || null,
        events: rows,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

/**
 * POST /api/analytics/visit-notify
 * 用户进入首页时发送邮件通知（同一 sessionId 只通知一次）
 * Body: { sessionId, userToken, referrer, userAgent }
 */
router.post('/visit-notify', async (req, res) => {
  try {
    const { sessionId, userToken, referrer } = req.body
    if (!sessionId) return res.json({ success: false, error: '缺少 sessionId' })

    // 同一 sessionId 只通知一次
    if (notifiedSessions.has(sessionId)) {
      return res.json({ success: true, notified: false, reason: 'already_notified' })
    }
    notifiedSessions.add(sessionId)

    // 防止内存无限增长：超过 10000 条时清理最早的一半
    if (notifiedSessions.size > 10000) {
      const arr = Array.from(notifiedSessions)
      for (let i = 0; i < 5000; i++) notifiedSessions.delete(arr[i])
    }

    const ua = req.headers['user-agent'] || ''
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || ''
    const isGuest = !userToken || userToken.startsWith('guest_')
    const userLabel = isGuest ? `访客 (${userToken || '未知'})` : `用户 (${userToken})`
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    const subject = `🏠 新访客进入首页 - ${time}`
    
    // 生成追踪链接（公开页面，无需登录）
    const traceUrl = `https://europewedding.cn/trace?sid=${encodeURIComponent(sessionId)}`
    
    const html = `
      <h2>有新访客进入首页</h2>
      <table border="0" cellpadding="6" cellspacing="0" style="font-size:14px;line-height:1.8">
        <tr><td style="color:#888;width:100px">用户身份</td><td><b>${userLabel}</b></td></tr>
        <tr><td style="color:#888">Session</td><td style="font-family:monospace;font-size:12px">${sessionId}</td></tr>
        <tr><td style="color:#888">IP 地址</td><td>${ip || '未知'}</td></tr>
        <tr><td style="color:#888">来源</td><td>${referrer || '直接访问'}</td></tr>
        <tr><td style="color:#888">浏览器</td><td>${ua.substring(0, 200)}</td></tr>
        <tr><td style="color:#888">时间</td><td>${time}</td></tr>
      </table>
      
      <div style="margin-top:24px;padding:16px;background:#f8f6f3;border-radius:8px;border-left:4px solid #2a2723">
        <p style="margin:0 0 12px 0;font-size:14px;color:#555">👇 点击下方按钮查看该访客的完整访问路径</p>
        <a href="${traceUrl}" 
           style="display:inline-block;padding:10px 24px;background:#2a2723;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">
          📊 查看访问路径
        </a>
        <p style="margin:12px 0 0 0;font-size:12px;color:#999">（需要管理员登录）</p>
      </div>
      
      <p style="margin-top:20px;color:#999;font-size:12px">同一 Session 不会重复通知</p>
    `

    const result = await sendMail(subject, html)
    res.json({ success: result.success, notified: result.success })
  } catch (err) {
    console.error('visit-notify 失败:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
