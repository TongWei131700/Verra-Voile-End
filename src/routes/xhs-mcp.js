const express = require('express')
const { exec, spawn } = require('child_process')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')
const { pool } = require('../db')
const OpenAI = require('openai')

const router = express.Router()

// LLM 客户端（复用 Agent 的 DashScope Token Plan）
const llmClient = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
})
const LLM_MODEL = 'qwen3.7-plus'
const LLM_VISION_MODEL = 'qwen-vl-plus' // 视觉模型用于 OCR

const MCP_BINARY = '/Users/hongli/WorkSpace/Verra-Voile/tools/xiaohongshu-mcp/xiaohongshu-mcp-darwin-arm64'
const LOGIN_BINARY = '/Users/hongli/WorkSpace/Verra-Voile/tools/xiaohongshu-mcp/xiaohongshu-login-darwin-arm64'
const ACCOUNT_A_DIR = '/Users/hongli/WorkSpace/Verra-Voile'
const ACCOUNT_B_DIR = path.join(process.env.HOME || '', '.xhs-mcp-account2')

/* ── 高价值判定关键词 ── */
const INQUIRY_KW = ['求推荐', '推荐一下', '寻找', '有没有', '求助', '求姐妹', '能接吗', '能接', '预算', '多少钱', '怎么办']
const AD_KW = ['推荐', '分享', '攻略', '干货', '合集', '盘点', '必看', '整理', '总结']
const MERCHANT_KW = ['婚礼', '摄影', '工作室', '策划', '团队', '官方', '品牌']

function isHighValuePost(title, author) {
  // 排除广告
  if (AD_KW.some(kw => title.includes(kw))) return false
  if (MERCHANT_KW.some(kw => author.includes(kw))) return false
  // 高价值：明确求助
  if (INQUIRY_KW.some(kw => title.includes(kw))) return true
  return false
}

function isAdPost(title, author) {
  if (AD_KW.some(kw => title.includes(kw))) return true
  if (MERCHANT_KW.some(kw => author.includes(kw))) return true
  return false
}

/**
 * POST /api/xhs-mcp/logout
 * 一键登出小红书 MCP 服务
 * 执行：停止服务 + 删除 Cookie 文件
 */
router.post('/logout', async (req, res) => {
  try {
    // 1. 调用 MCP API 清除登录态（账号 A 和账号 B）
    const ports = [18060, 18061]
    const deletePromises = ports.map(port => 
      fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'delete_cookies', arguments: {} },
          id: 1,
        }),
      }).catch(() => null) // 忽略服务未运行的情况
    )
    await Promise.all(deletePromises)

    // 2. 停止 MCP 服务进程
    await new Promise((resolve) => {
      exec('pkill -f xiaohongshu-mcp-darwin-arm64', (error) => {
        // 忽略错误（可能是没有运行的进程）
        resolve()
      })
    })

    // 3. 删除 Cookie 文件
    const cookiePaths = [
      path.join(process.cwd(), 'cookies.json'),
      path.join(process.env.HOME || '', '.xhs-mcp', 'cookies.json'),
      path.join(process.env.HOME || '', '.xhs-mcp-account2', 'cookies.json'),
    ]

    const deleteFilePromises = cookiePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath)
      } catch (e) {
        // 忽略文件不存在的错误
      }
    })
    await Promise.all(deleteFilePromises)

    res.json({
      success: true,
      message: '完全登出成功：已清除登录态、停止服务、删除 Cookie 文件',
    })
  } catch (error) {
    console.error('登出失败:', error)
    res.status(500).json({
      success: false,
      message: '登出失败: ' + error.message,
    })
  }
})

/**
 * GET /api/xhs-mcp/status
 * 检查 MCP 服务状态和登录状态
 */
router.get('/status', async (req, res) => {
  try {
    // 先确保 MCP 正在运行（如果未运行则自动拉起）
    const mcpStatus = await ensureMcpRunning('A')
    if (!mcpStatus.running) {
      res.json({ loggedIn: false, serviceRunning: false, message: mcpStatus.message })
      return
    }

    // 检查账号 A 的登录状态
    const response = await fetch('http://localhost:18060/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: 'check_login_status', arguments: {} },
        id: 1,
      }),
    })
    const data = await response.json()
    const text = data?.result?.content?.[0]?.text || ''
    
    if (text.includes('已登录')) {
      const match = text.match(/用户名:\s*(.+)/)
      const nickname = match ? match[1].trim() : '未知用户'
      res.json({ loggedIn: true, nickname, account: '账号 A' })
    } else {
      res.json({ loggedIn: false })
    }
  } catch (error) {
    // MCP 服务未运行
    res.json({ loggedIn: false, serviceRunning: false })
  }
})

/**
 * POST /api/xhs-mcp/login
 * 一键登录小红书 MCP 服务
 * 清理 Cookie → 启动登录工具 → 浏览器弹出二维码
 */
router.post('/login', async (req, res) => {
  try {
    const { account = 'A' } = req.body
    const workDir = account === 'B' ? ACCOUNT_B_DIR : ACCOUNT_A_DIR
    const port = account === 'B' ? 18061 : 18060

    // 1. 先停止已有的 MCP 服务
    await new Promise((resolve) => {
      exec('pkill -f xiaohongshu-mcp-darwin-arm64', () => resolve())
    })

    // 2. 清理所有 Cookie 文件（防止登录工具误判已登录）
    const cookiePaths = [
      path.join(ACCOUNT_A_DIR, 'cookies.json'),
      path.join(process.env.HOME || '', '.xhs-mcp', 'cookies.json'),
      path.join(ACCOUNT_B_DIR, 'cookies.json'),
    ]
    const deletePromises = cookiePaths.map(async (p) => {
      try { await fs.unlink(p) } catch {}
    })
    await Promise.all(deletePromises)

    // 3. 启动登录工具（会自动打开浏览器显示二维码）
    const loginProcess = spawn(LOGIN_BINARY, [], {
      cwd: workDir,
      detached: true,
      stdio: 'ignore',
    })
    loginProcess.unref()

    res.json({
      success: true,
      message: `登录工具已启动，请在弹出的浏览器窗口中扫码登录（账号 ${account}）`,
      account,
      port,
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      message: '登录失败: ' + error.message,
    })
  }
})

/**
 * POST /api/xhs-mcp/start-service
 * 扫码登录成功后，启动 MCP 服务
 */
router.post('/start-service', async (req, res) => {
  try {
    const { account = 'A' } = req.body
    const workDir = account === 'B' ? ACCOUNT_B_DIR : ACCOUNT_A_DIR
    const port = account === 'B' ? 18061 : 18060

    // 检查 Cookie 是否存在
    const cookiePath = path.join(workDir, 'cookies.json')
    try {
      await fs.access(cookiePath)
    } catch {
      res.status(400).json({
        success: false,
        message: 'Cookie 文件不存在，请先完成扫码登录',
      })
      return
    }

    // 检查是否已有服务在运行
    try {
      const checkRes = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'check', version: '1.0' } },
          id: 1,
        }),
      })
      if (checkRes.ok) {
        res.json({ success: true, message: `账号 ${account} 服务已在运行`, alreadyRunning: true })
        return
      }
    } catch {}

    // 启动 MCP 服务
    const mcpProcess = spawn(MCP_BINARY, ['-port', `:${port}`], {
      cwd: workDir,
      detached: true,
      stdio: 'ignore',
    })
    mcpProcess.unref()

    // 等待服务就绪
    await new Promise(resolve => setTimeout(resolve, 2000))

    res.json({
      success: true,
      message: `账号 ${account} MCP 服务已启动（端口 ${port}）`,
    })
  } catch (error) {
    console.error('启动服务失败:', error)
    res.status(500).json({
      success: false,
      message: '启动服务失败: ' + error.message,
    })
  }
})

/**
 * POST /api/xhs-mcp/search
 * 异步搜索：创建任务 → 立即返回 taskId → 后台执行 MCP 搜索 → 结果写入 DB
 */
router.post('/search', async (req, res) => {
  try {
    const { tags, timePeriod = '一周内', sortBy = '综合', noteType = '不限' } = req.body
    if (!Array.isArray(tags) || tags.length === 0) {
      res.json({ success: false, message: 'tags 不能为空' })
      return
    }

    const taskId = crypto.randomUUID()
    const tagNames = tags.map(t => typeof t === 'string' ? t : t.name)
    const filters = { publish_time: timePeriod, sort_by: sortBy, note_type: noteType }

    // 1. 创建任务记录
    await pool.execute(
      'INSERT INTO xhs_search_tasks (id, status, tags, time_period, filters, total_steps) VALUES (?, ?, ?, ?, ?, ?)',
      [taskId, 'pending', JSON.stringify(tagNames), timePeriod, JSON.stringify(filters), tagNames.length]
    )

    // 2. 立即返回 taskId
    res.json({ success: true, taskId, message: '搜索任务已创建' })

    // 3. 后台异步执行搜索（不阻塞响应）
    executeSearchAsync(taskId, tagNames, filters).catch(err => {
      console.error(`搜索任务 ${taskId} 后台执行失败:`, err)
    })
  } catch (error) {
    console.error('创建搜索任务失败:', error)
    res.status(500).json({ success: false, message: '创建搜索任务失败: ' + error.message })
  }
})

/**
 * 确保 MCP 服务正在运行，如果未运行则自动拉起
 */
async function ensureMcpRunning(account = 'A') {
  const port = account === 'B' ? 18061 : 18060
  const workDir = account === 'B' ? ACCOUNT_B_DIR : ACCOUNT_A_DIR

  try {
    const checkRes = await fetch(`http://localhost:${port}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'health', version: '1.0' } },
        id: 1,
      }),
    })
    if (checkRes.ok) return { running: true }
  } catch {}

  // MCP 未运行，尝试自动拉起
  console.log(`[MCP] 账号 ${account} 未运行，自动启动...`)
  return await startMcpProcess(account, port, workDir)
}

/**
 * 启动 MCP 进程
 */
async function startMcpProcess(account, port, workDir) {
  try {
    const cookiePath = path.join(workDir, 'cookies.json')
    try { await fs.access(cookiePath) } catch {
      return { running: false, message: 'Cookie 文件不存在，请先扫码登录' }
    }

    const mcpProcess = spawn(MCP_BINARY, ['-port', `:${port}`], {
      cwd: workDir,
      detached: true,
      stdio: 'ignore',
    })
    mcpProcess.unref()

    // 等待启动
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 验证启动成功
    try {
      const verifyRes = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'verify', version: '1.0' } },
          id: 2,
        }),
      })
      if (verifyRes.ok) {
        console.log(`[MCP] 账号 ${account} 启动成功（端口 ${port}）`)
        return { running: true, autoStarted: true }
      }
    } catch {}

    return { running: false, message: 'MCP 启动后验证失败' }
  } catch (e) {
    return { running: false, message: '自动启动失败: ' + e.message }
  }
}

/**
 * 强制重启 MCP（杀掉旧进程 + 启动新进程）
 */
async function restartMcp(account = 'A') {
  const port = account === 'B' ? 18061 : 18060
  const workDir = account === 'B' ? ACCOUNT_B_DIR : ACCOUNT_A_DIR

  console.log(`[MCP] 强制重启账号 ${account}...`)

  // 1. 杀掉旧进程
  await new Promise((resolve) => {
    exec('pkill -f xiaohongshu-mcp-darwin-arm64', () => resolve())
  })
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 2. 启动新进程
  const result = await startMcpProcess(account, port, workDir)
  if (result.running) {
    console.log(`[MCP] 账号 ${account} 重启成功`)
  } else {
    console.error(`[MCP] 账号 ${account} 重启失败:`, result.message)
  }
  return result
}

/**
 * MCP 健康检查：做一次快速测试搜索，验证 MCP 是否处于正常状态
 * 返回 { healthy: true } 或 { healthy: false, reason: '...' }
 */
async function healthCheckMcp(account = 'A') {
  const port = account === 'B' ? 18061 : 18060

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000) // 20秒超时

    let response
    try {
      response = await fetch(`http://localhost:${port}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'check_login_status',
            arguments: {}
          },
          id: 1,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const data = await response.json()
    const text = data?.result?.content?.[0]?.text || ''

    // 如果返回了错误信息（非正常登录状态）
    if (text.includes('错误') || text.includes('error') || text.includes('deadline')) {
      return { healthy: false, reason: `登录检查异常: ${text.substring(0, 100)}` }
    }

    return { healthy: true }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { healthy: false, reason: '健康检查超时（20秒）' }
    }
    return { healthy: false, reason: `健康检查失败: ${err.message}` }
  }
}

/**
 * 用视觉大模型 OCR 图片，提取文字内容（用于无标题帖子）
 * @param {string} imageUrl - 图片 URL
 * @returns {string} 提取的文字，失败返回空字符串
 */
async function ocrImage(imageUrl) {
  try {
    const response = await llmClient.chat.completions.create({
      model: LLM_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
            {
              type: 'text',
              text: '请识别这张图片中的所有中文文字。如果图片中有明显的标题或主题文字，请提取出来作为帖子标题。只返回识别到的文字，不要加任何解释。如果图片中没有文字或无法识别，返回空字符串。',
            },
          ],
        },
      ],
      max_tokens: 200,
    })
    const text = response.choices?.[0]?.message?.content || ''
    // 清理返回的文本，去掉引号和多余空白
    return text.replace(/^["'「『]+|["'」』]+$/g, '').trim().substring(0, 100)
  } catch (err) {
    console.error('OCR 失败:', err.message)
    return ''
  }
}

/**
 * 搜索单个关键词，返回 { posts: number, error: string | null }
 */
async function searchSingleKeyword(taskId, keyword, filters) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)

    let mcpResponse
    try {
      mcpResponse = await fetch('http://localhost:18060/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'search_feeds',
            arguments: { keyword, filters }
          },
          id: 1,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const mcpData = await mcpResponse.json()
    const text = mcpData?.result?.content?.[0]?.text
    if (!text) return { posts: 0, error: null }

    let searchResult
    try {
      searchResult = JSON.parse(text)
    } catch {
      // MCP 返回错误信息而非 JSON（如超时）
      const errMsg = text.substring(0, 200)
      return { posts: 0, error: errMsg }
    }

    const feeds = searchResult.feeds || []
    let count = 0

    // 逐条写入数据库
    for (const f of feeds) {
      const nc = f.noteCard || f
      const info = nc.interactInfo || {}
      const postId = f.id || f.feed_id || nc.noteId || ''
      let title = nc.displayTitle || nc.title || ''
      const author = nc.user?.nickname || ''
      const xsecToken = f.xsecToken || nc.xsecToken || ''
      const url = postId
        ? `https://www.xiaohongshu.com/explore/${postId}?xsec_token=${xsecToken}`
        : ''

      // 提取封面图片 URL
      const coverUrl = nc.cover?.urlDefault || nc.cover?.url || nc.cover?.urlPre || ''
      const images = coverUrl ? [coverUrl] : []

      // 无标题帖子先标记，搜索完成后由 fillUntitledPosts 批量处理
      if (!title || title.trim() === '') {
        title = '(无标题)'
      }

      const highValue = isHighValuePost(title, author) ? 1 : 0
      const ad = isAdPost(title, author) ? 1 : 0

      try {
        await pool.execute(
          `INSERT IGNORE INTO xhs_posts
           (post_id, task_id, keyword, title, author, likes, collects, comments, shares, url, xsec_token, images, is_high_value, is_ad)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [postId, taskId, keyword, title, author,
           info.likedCount || '0', info.collectedCount || '0',
           info.commentCount || '0', info.shareCount || '0',
           url, xsecToken, JSON.stringify(images), highValue, ad]
        )
        count++
      } catch (dbErr) {
        console.error(`写入帖子 ${postId} 失败:`, dbErr.message)
      }
    }

    return { posts: count, error: null }
  } catch (err) {
    if (err.name === 'AbortError') {
      return { posts: 0, error: '搜索超时（90秒）' }
    }
    return { posts: 0, error: err.message }
  }
}

/**
 * 对无标题帖子批量获取详情，提取正文作为标题
 */
async function fillUntitledPosts(taskId) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, post_id, xsec_token FROM xhs_posts WHERE task_id = ? AND (title = '(无标题)' OR title = '' OR title IS NULL)",
      [taskId]
    )
    if (rows.length === 0) return

    console.log(`[标题补充] 发现 ${rows.length} 条无标题帖子，开始获取详情...`)

    for (const row of rows) {
      const { id, post_id, xsec_token } = row
      if (!post_id || !xsec_token) continue

      try {
        // 调用 MCP 获取帖子详情
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000)

        let response
        try {
          response = await fetch('http://localhost:18060/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'tools/call',
              params: {
                name: 'get_feed_detail',
                arguments: { feed_id: post_id, xsec_token }
              },
              id: 1,
            }),
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeout)
        }

        const data = await response.json()
        const text = data?.result?.content?.[0]?.text
        if (!text) continue

        const detail = JSON.parse(text)
        const note = detail?.data?.note || {}
        const desc = note.desc || ''
        const imageList = note.imageList || []

        // 提取标题：优先 desc 第一行，截取前 50 字
        let newTitle = ''
        if (desc && desc.trim()) {
          // 取第一行作为标题，最多 50 字
          const firstLine = desc.split('\n').find(l => l.trim()) || ''
          newTitle = firstLine.trim().substring(0, 50)
        }

        // 更新数据库
        if (newTitle) {
          await pool.execute('UPDATE xhs_posts SET title = ? WHERE id = ?', [newTitle, id])
          console.log(`[标题补充] ${post_id} → "${newTitle}"`)
        }

        // 保存图片列表
        if (imageList.length > 0) {
          const imgUrls = imageList.map(img => img.urlDefault || img.url || '').filter(Boolean)
          if (imgUrls.length > 0) {
            await pool.execute('UPDATE xhs_posts SET images = ? WHERE id = ?', [JSON.stringify(imgUrls), id])
          }
        }

        // 延迟 1 秒降低风控
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (err) {
        console.error(`[标题补充] ${post_id} 失败:`, err.message)
      }
    }

    console.log(`[标题补充] 完成`)
  } catch (err) {
    console.error('[标题补充] 批量处理失败:', err.message)
  }
}

/**
 * 后台异步执行搜索任务
 */
async function executeSearchAsync(taskId, tagNames, filters) {
  // filters = { publish_time, sort_by, note_type }
  // 1. 确保 MCP 正在运行
  const mcpStatus = await ensureMcpRunning('A')
  if (!mcpStatus.running) {
    await pool.execute(
      'UPDATE xhs_search_tasks SET status = ?, error_message = ? WHERE id = ?',
      ['failed', mcpStatus.message || 'MCP 服务未运行且自动启动失败', taskId]
    )
    return
  }

  // 2. 健康检查：验证 MCP 是否处于正常状态（非僵死状态）
  console.log('[搜索] 执行 MCP 健康检查...')
  const health = await healthCheckMcp('A')
  if (!health.healthy) {
    console.warn('[搜索] 健康检查失败:', health.reason, '→ 强制重启 MCP')
    const restartResult = await restartMcp('A')
    if (!restartResult.running) {
      await pool.execute(
        'UPDATE xhs_search_tasks SET status = ?, error_message = ? WHERE id = ?',
        ['failed', 'MCP 健康检查失败且重启失败: ' + restartResult.message, taskId]
      )
      return
    }
    console.log('[搜索] MCP 重启成功，继续搜索...')
  } else {
    console.log('[搜索] MCP 健康检查通过 ✓')
  }

  // 更新状态为 running
  await pool.execute(
    'UPDATE xhs_search_tasks SET status = ?, current_keyword = ? WHERE id = ?',
    ['running', tagNames[0], taskId]
  )

  let totalPosts = 0
  let lastError = ''
  let mcpRestartedThisRun = false // 防止无限重启

  for (let i = 0; i < tagNames.length; i++) {
    const keyword = tagNames[i]

    // 更新进度
    await pool.execute(
      'UPDATE xhs_search_tasks SET current_step = ?, current_keyword = ? WHERE id = ?',
      [i + 1, keyword, taskId]
    )

    // 搜索单个关键词，失败时自动重启 MCP 并重试一次
    const result = await searchSingleKeyword(taskId, keyword, filters)

    if (result.error && !mcpRestartedThisRun) {
      // 搜索失败（MCP 超时或异常），尝试重启 MCP 并重试
      console.warn(`[搜索] "${keyword}" 失败: ${result.error} → 强制重启 MCP 并重试`)
      const restartResult = await restartMcp('A')
      if (restartResult.running) {
        mcpRestartedThisRun = true
        // 重试一次
        const retryResult = await searchSingleKeyword(taskId, keyword, filters)
        if (retryResult.posts > 0) {
          totalPosts += retryResult.posts
        } else if (retryResult.error) {
          lastError = `"${keyword}": ${retryResult.error}`
        }
      } else {
        lastError = `"${keyword}": ${result.error} (MCP 重启失败)`
      }
    } else if (result.error) {
      lastError = `"${keyword}": ${result.error}`
    } else {
      totalPosts += result.posts
    }

    // 标签间延迟 1.5 秒降低风控
    if (i < tagNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  // 更新任务状态为完成
  const finalStatus = (totalPosts === 0 && lastError) ? 'failed' : 'done'
  await pool.execute(
    'UPDATE xhs_search_tasks SET status = ?, result_count = ?, current_keyword = ?, error_message = ? WHERE id = ?',
    [finalStatus, totalPosts, '', lastError || null, taskId]
  )

  // 对无标题帖子：获取详情提取正文作为标题
  if (finalStatus === 'done' && totalPosts > 0) {
    await fillUntitledPosts(taskId)
  }

  // 同时写入搜索历史（兼容旧逻辑）
  try {
    const [postRows] = await pool.execute(
      'SELECT title, url FROM xhs_posts WHERE task_id = ?',
      [taskId]
    )
    await pool.execute(
      'INSERT INTO xhs_search_history (tags, time_period, filters, result_count, posts, task_id) VALUES (?, ?, ?, ?, ?, ?)',
      [JSON.stringify(tagNames), filters.publish_time, JSON.stringify(filters), totalPosts, JSON.stringify(postRows.map(r => ({ title: r.title, url: r.url }))), taskId]
    )
  } catch (e) {
    console.error('写入搜索历史失败:', e.message)
  }

  console.log(`✓ 搜索任务 ${taskId} 完成，共 ${totalPosts} 条帖子`)
}

/**
 * GET /api/xhs-mcp/search/:taskId
 * 轮询搜索任务状态和结果
 */
router.get('/search/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params
    const [tasks] = await pool.execute(
      'SELECT id, status, tags, time_period, current_step, total_steps, current_keyword, result_count, error_message, created_at FROM xhs_search_tasks WHERE id = ?',
      [taskId]
    )

    if (tasks.length === 0) {
      res.json({ success: false, message: '任务不存在' })
      return
    }

    const task = tasks[0]
    const response = {
      success: true,
      taskId: task.id,
      status: task.status,
      progress: {
        current: task.current_step,
        total: task.total_steps,
        keyword: task.current_keyword,
      },
      resultCount: task.result_count,
      createdAt: task.created_at,
    }

    // 如果任务完成，返回帖子数据
    if (task.status === 'done') {
      const [posts] = await pool.execute(
        `SELECT id, post_id, keyword, title, author, likes, collects, comments, shares, url, xsec_token, image_content, images, is_high_value, is_ad
         FROM xhs_posts WHERE task_id = ? ORDER BY is_high_value DESC, id ASC`,
        [taskId]
      )
      response.posts = posts.map(p => ({
        id: p.post_id,
        keyword: p.keyword,
        title: p.title,
        author: p.author,
        likes: p.likes,
        collects: p.collects,
        comments: p.comments,
        shares: p.shares,
        url: p.url,
        token: p.xsec_token,
        imageContent: p.image_content || '',
        images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
        isHighValue: !!p.is_high_value,
        isAd: !!p.is_ad,
      }))
    }

    // 如果任务失败，返回错误信息
    if (task.status === 'failed') {
      response.error = task.error_message
    }

    res.json(response)
  } catch (error) {
    console.error('查询任务状态失败:', error)
    res.status(500).json({ success: false, message: '查询失败: ' + error.message })
  }
})

/**
 * GET /api/xhs-mcp/posts
 * 获取帖子列表（支持按关键词/任务ID筛选）
 */
router.get('/posts', async (req, res) => {
  try {
    const { taskId, keyword, limit = 100 } = req.query
    let sql = 'SELECT * FROM xhs_posts WHERE 1=1'
    const params = []

    if (taskId) {
      sql += ' AND task_id = ?'
      params.push(taskId)
    }
    if (keyword) {
      sql += ' AND keyword = ?'
      params.push(keyword)
    }

    sql += ' ORDER BY is_high_value DESC, id DESC LIMIT ?'
    params.push(Number(limit))

    const [posts] = await pool.execute(sql, params)
    res.json({
      success: true,
      posts: posts.map(p => ({
        id: p.post_id,
        keyword: p.keyword,
        title: p.title,
        author: p.author,
        likes: p.likes,
        collects: p.collects,
        comments: p.comments,
        shares: p.shares,
        url: p.url,
        token: p.xsec_token,
        imageContent: p.image_content || '',
        images: p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : [],
        isHighValue: !!p.is_high_value,
        isAd: !!p.is_ad,
        taskId: p.task_id,
        createdAt: p.created_at,
      })),
    })
  } catch (error) {
    console.error('获取帖子列表失败:', error)
    res.status(500).json({ success: false, message: '获取失败: ' + error.message })
  }
})

/**
 * POST /api/xhs-mcp/posts/:postId/image-content
 * 保存帖子的图片文字内容
 */
router.post('/posts/:postId/image-content', async (req, res) => {
  try {
    const { postId } = req.params
    const { imageContent, taskId } = req.body
    const sql = taskId
      ? 'UPDATE xhs_posts SET image_content = ? WHERE post_id = ? AND task_id = ?'
      : 'UPDATE xhs_posts SET image_content = ? WHERE post_id = ? ORDER BY id DESC LIMIT 1'
    const params = taskId ? [imageContent, postId, taskId] : [imageContent, postId]
    await pool.execute(sql, params)
    res.json({ success: true })
  } catch (error) {
    console.error('保存图片内容失败:', error)
    res.status(500).json({ success: false, message: '保存失败: ' + error.message })
  }
})

/**
 * POST /api/xhs-mcp/posts/:postId/images
 * 保存帖子的图片列表
 */
router.post('/posts/:postId/images', async (req, res) => {
  try {
    const { postId } = req.params
    const { images, taskId } = req.body
    const sql = taskId
      ? 'UPDATE xhs_posts SET images = ? WHERE post_id = ? AND task_id = ?'
      : 'UPDATE xhs_posts SET images = ? WHERE post_id = ? ORDER BY id DESC LIMIT 1'
    const params = taskId ? [JSON.stringify(images), postId, taskId] : [JSON.stringify(images), postId]
    await pool.execute(sql, params)
    res.json({ success: true })
  } catch (error) {
    console.error('保存图片列表失败:', error)
    res.status(500).json({ success: false, message: '保存失败: ' + error.message })
  }
})

/**
 * GET /api/xhs-mcp/tags
 * 获取所有订阅标签
 */
router.get('/tags', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, sort_order FROM xhs_tags ORDER BY sort_order, id')
    res.json({ success: true, tags: rows.map(r => ({ name: r.name, custom: true })) })
  } catch (error) {
    console.error('获取标签失败:', error)
    res.json({ success: true, tags: [] })
  }
})

/**
 * POST /api/xhs-mcp/tags
 * 保存标签列表（全量替换）
 */
router.post('/tags', async (req, res) => {
  try {
    const { tags } = req.body
    if (!Array.isArray(tags)) {
      res.json({ success: false, message: 'tags 必须是数组' })
      return
    }
    // 使用事务确保删除和插入是原子操作
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.execute('DELETE FROM xhs_tags')
      for (let i = 0; i < tags.length; i++) {
        await conn.execute('INSERT INTO xhs_tags (name, sort_order) VALUES (?, ?)', [tags[i].name || tags[i], i])
      }
      await conn.commit()
      res.json({ success: true })
    } catch (e) {
      await conn.rollback()
      throw e
    } finally {
      conn.release()
    }
  } catch (error) {
    console.error('保存标签失败:', error)
    res.status(500).json({ success: false, message: '保存失败: ' + error.message })
  }
})

/**
 * GET /api/xhs-mcp/search-history
 * 获取搜索历史（最近20条）
 */
router.get('/search-history', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, search_time, tags, time_period, filters, result_count, posts, task_id FROM xhs_search_history ORDER BY search_time DESC LIMIT 20'
    )
    res.json({
      success: true,
      history: rows.map(r => {
        const f = r.filters ? (typeof r.filters === 'string' ? JSON.parse(r.filters) : r.filters) : null
        return {
          id: String(r.id),
          time: new Date(r.search_time).toLocaleString('zh-CN'),
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
          timePeriod: r.time_period,
          filters: f || { publish_time: r.time_period, sort_by: '综合', note_type: '不限' },
          count: r.result_count,
          posts: typeof r.posts === 'string' ? JSON.parse(r.posts) : r.posts,
          taskId: r.task_id || '',
        }
      }),
    })
  } catch (error) {
    console.error('获取搜索历史失败:', error)
    res.json({ success: true, history: [] })
  }
})

/**
 * POST /api/xhs-mcp/search-history
 * 保存搜索历史
 */
router.post('/search-history', async (req, res) => {
  try {
    const { tags, timePeriod, count, posts, taskId } = req.body
    await pool.execute(
      'INSERT INTO xhs_search_history (tags, time_period, result_count, posts, task_id) VALUES (?, ?, ?, ?, ?)',
      [JSON.stringify(tags), timePeriod || '', count || 0, JSON.stringify(posts || []), taskId || '']
    )
    res.json({ success: true })
  } catch (error) {
    console.error('保存搜索历史失败:', error)
    res.status(500).json({ success: false, message: '保存失败: ' + error.message })
  }
})

/**
 * POST /api/xhs-mcp/feed-detail
 * 代理 MCP get_feed_detail 调用（获取帖子图片）
 */
router.post('/feed-detail', async (req, res) => {
  try {
    const { feed_id, xsec_token } = req.body
    if (!feed_id) {
      res.json({ success: false, message: 'feed_id 不能为空' })
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    let mcpResponse
    try {
      mcpResponse = await fetch('http://localhost:18060/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_feed_detail',
            arguments: { feed_id, xsec_token: xsec_token || '' }
          },
          id: 1,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const mcpData = await mcpResponse.json()
    const text = mcpData?.result?.content?.[0]?.text
    if (!text) {
      res.json({ success: false, message: 'MCP 无返回' })
      return
    }

    let detail
    try {
      detail = JSON.parse(text)
    } catch {
      res.json({ success: false, message: 'MCP 返回异常' })
      return
    }

    const note = detail?.data?.note
    const images = (note?.imageList || []).map(img => ({
      url: img.urlDefault || img.urlPre || '',
      width: img.width || 0,
      height: img.height || 0,
    }))

    res.json({ success: true, images, detail })
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    res.status(500).json({ success: false, message: '获取失败: ' + error.message })
  }
})

/**
 * POST /api/xhs-mcp/analyze-high-value
 * 用 LLM 批量分析帖子的高价值/广告/普通分类
 * Body: { taskId: string }
 */
router.post('/analyze-high-value', async (req, res) => {
  try {
    const { taskId } = req.body
    if (!taskId) {
      return res.json({ success: false, message: 'taskId 不能为空' })
    }

    // 1. 从 DB 加载该任务的所有帖子
    const [posts] = await pool.execute(
      'SELECT id, post_id, title, author, likes, collects, comments FROM xhs_posts WHERE task_id = ?',
      [taskId]
    )
    if (posts.length === 0) {
      return res.json({ success: false, message: '未找到该任务的帖子' })
    }

    // 2. 构建 LLM 输入
    const postList = posts.map((p, i) =>
      `${i + 1}. [ID:${p.id}] 标题:「${p.title || '(无标题)'}」 作者:${p.author} 点赞:${p.likes} 收藏:${p.collects} 评论:${p.comments}`
    ).join('\n')

    const systemPrompt = `你是一个小红书婚礼行业分析师。你的任务是判断每个帖子属于以下三类之一：

**high_value（高价值询盘帖）**：
- 用户以个人身份发帖求助、求推荐、寻找供应商
- 包含具体需求描述（目的地、预算、人数、风格偏好等）
- 例如：“巴塞罗那化妆师求推荐”、“求意大利阿马尔菲海岸婚礼摄影师”、“预算10w，求推荐欧洲目的地婚礼策划”
- 注意：即使标题没有“求推荐”等关键词，只要语义上是个人求助/寻找服务商，就是高价值

**ad（广告/营销帖）**：
- 商家/工作室/策划师以官方身份发布
- 内容是攻略、合集、作品展示、品牌宣传
- 作者昵称包含工作室/品牌/策划等商业标识
- 例如：“意大利婚礼攻略”、“XX工作室作品合集”、“婚礼摄影避坑指南”

**normal（普通帖）**：
- 个人分享自己的婚礼经历、照片、感受
- 非求助性质，也不是商业推广
- 例如：“我们的托斯卡纳婚礼”、“婚礼当天超开心”

请严格以 JSON 数组格式返回，每个元素包含 id 和 category：
[{"id": 1, "category": "high_value"}, {"id": 2, "category": "ad"}, ...]
只返回 JSON，不要其他内容。`

    // 3. 调用 LLM
    console.log(`[XHS AI] 开始分析 ${posts.length} 条帖子...`)
    const completion = await llmClient.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请分析以下 ${posts.length} 条小红书帖子：\n\n${postList}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    console.log('[XHS AI] LLM 原始返回:', raw.substring(0, 500))

    // 4. 解析 LLM 返回
    let results = []
    try {
      const parsed = JSON.parse(raw)
      // 支持 {results: [...]} 或直接 [...]
      results = Array.isArray(parsed) ? parsed : (parsed.results || [])
    } catch (e) {
      console.error('[XHS AI] JSON 解析失败:', e.message)
      return res.json({ success: false, message: 'LLM 返回格式异常', raw: raw.substring(0, 200) })
    }

    // 5. 更新 DB
    // 构建 post_id -> DB id 的映射，以及序号 -> DB id 的映射
    const idBySeq = {} // 1-based 序号 -> DB id
    const idByDbId = {} // DB id -> DB id
    posts.forEach((p, i) => {
      idBySeq[i + 1] = p.id
      idByDbId[p.id] = p.id
    })

    let updatedCount = 0
    for (const item of results) {
      // LLM 可能返回序号或 DB id，两种都尝试匹配
      const dbId = idBySeq[item.id] || idByDbId[item.id]
      if (!dbId) continue

      const category = item.category || 'normal'
      const isHighValue = category === 'high_value' ? 1 : 0
      const isAd = category === 'ad' ? 1 : 0

      await pool.execute(
        'UPDATE xhs_posts SET is_high_value = ?, is_ad = ? WHERE id = ?',
        [isHighValue, isAd, dbId]
      )
      updatedCount++
    }

    // 6. 统计结果
    const [updated] = await pool.execute(
      `SELECT 
        SUM(is_high_value) as hv_count, 
        SUM(is_ad) as ad_count, 
        COUNT(*) - SUM(is_high_value) - SUM(is_ad) as normal_count
      FROM xhs_posts WHERE task_id = ?`,
      [taskId]
    )

    console.log(`[XHS AI] 分析完成: 更新 ${updatedCount} 条, 高价值=${updated[0].hv_count}, 广告=${updated[0].ad_count}, 普通=${updated[0].normal_count}`)

    res.json({
      success: true,
      analyzed: updatedCount,
      stats: {
        highValue: Number(updated[0].hv_count) || 0,
        ad: Number(updated[0].ad_count) || 0,
        normal: Number(updated[0].normal_count) || 0,
      },
    })
  } catch (error) {
    console.error('[XHS AI] 分析失败:', error.message)
    res.status(500).json({ success: false, message: 'AI 分析失败: ' + error.message })
  }
})

module.exports = router
