const express = require('express')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const { pool } = require('../db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'verra-voile-secret-key-2026'

// 鉴权中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无管理员权限' })
    }
    req.admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'token已过期，请重新登录' })
  }
}

router.use(authMiddleware)

// 项目路径配置
const FRONTEND_DIR = '/Users/hongli/WorkSpace/Verra-Voile'
const BACKEND_DIR = '/Users/hongli/WorkSpace/Verra-Voile-End'

// 分支前缀
const BRANCH_PREFIX = { frontend: 'fe', backend: 'be' }

function getDir(side) {
  return side === 'frontend' ? FRONTEND_DIR : BACKEND_DIR
}

function getPrefix(side) {
  return BRANCH_PREFIX[side] || 'fe'
}

/**
 * 辅助函数：执行 shell 命令
 */
function runCmd(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 30000 }).trim()
  } catch (e) {
    return ''
  }
}

/**
 * 辅助函数：获取下一个版本号
 */
function getNextVersion(currentVersion) {
  const parts = currentVersion.split('.').map(Number)
  parts[2] = (parts[2] || 0) + 1
  return parts.join('.')
}

/**
 * GET /api/version/current
 * 获取前端和后端的当前状态（git 分支 + 最新版本记录）
 */
router.get('/current', async (req, res) => {
  try {
    // 分别获取前端和后端最新版本记录
    const [feRows] = await pool.execute(
      "SELECT * FROM deploy_versions WHERE target = 'frontend' ORDER BY deployed_at DESC LIMIT 1"
    )
    const [beRows] = await pool.execute(
      "SELECT * FROM deploy_versions WHERE target = 'backend' ORDER BY deployed_at DESC LIMIT 1"
    )

    // 获取当前 git 分支信息
    const frontendBranch = runCmd('git rev-parse --abbrev-ref HEAD', FRONTEND_DIR)
    const backendBranch = runCmd('git rev-parse --abbrev-ref HEAD', BACKEND_DIR)
    const frontendCommit = runCmd('git rev-parse HEAD', FRONTEND_DIR)
    const backendCommit = runCmd('git rev-parse HEAD', BACKEND_DIR)

    res.json({
      success: true,
      data: {
        frontend: {
          branch: frontendBranch,
          commit: frontendCommit,
          shortCommit: frontendCommit.substring(0, 7),
          latest: feRows[0] || null,
        },
        backend: {
          branch: backendBranch,
          commit: backendCommit,
          shortCommit: backendCommit.substring(0, 7),
          latest: beRows[0] || null,
        },
      },
    })
  } catch (error) {
    console.error('查询当前版本失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/version/next?side=frontend|backend
 * 获取指定端的下一个版本号
 */
router.get('/next', async (req, res) => {
  try {
    const side = req.query.side || 'frontend'
    if (!['frontend', 'backend'].includes(side)) {
      return res.status(400).json({ success: false, message: 'side 必须为 frontend 或 backend' })
    }

    const [rows] = await pool.execute(
      "SELECT version FROM deploy_versions WHERE target = ? ORDER BY deployed_at DESC LIMIT 1",
      [side]
    )
    const currentVersion = rows[0]?.version || '0.0.0'
    const nextVersion = getNextVersion(currentVersion)
    const prefix = getPrefix(side)

    res.json({
      success: true,
      data: {
        side,
        current: currentVersion,
        next: nextVersion,
        nextBranch: `${prefix}/${nextVersion}`,
      },
    })
  } catch (error) {
    console.error('获取下一版本失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/version/list?side=frontend|backend
 * 获取指定端的版本历史
 */
router.get('/list', async (req, res) => {
  try {
    const side = req.query.side || 'frontend'
    if (!['frontend', 'backend'].includes(side)) {
      return res.status(400).json({ success: false, message: 'side 必须为 frontend 或 backend' })
    }

    const [rows] = await pool.execute(
      'SELECT * FROM deploy_versions WHERE target = ? ORDER BY deployed_at DESC',
      [side]
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('查询版本列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/version/deploy
 * 记录一次部署（指定前端或后端）
 * body: { side: 'frontend'|'backend', note?: string }
 */
router.post('/deploy', async (req, res) => {
  try {
    const { side, note } = req.body
    if (!['frontend', 'backend'].includes(side)) {
      return res.status(400).json({ success: false, message: 'side 必须为 frontend 或 backend' })
    }

    const dir = getDir(side)
    const prefix = getPrefix(side)

    // 获取当前该端的最新版本号，计算下一个
    const [rows] = await pool.execute(
      "SELECT version FROM deploy_versions WHERE target = ? ORDER BY deployed_at DESC LIMIT 1",
      [side]
    )
    const currentVersion = rows[0]?.version || '0.0.0'
    const version = getNextVersion(currentVersion)
    const branch = `${prefix}/${version}`

    // 获取当前 commit
    const commit = runCmd('git rev-parse HEAD', dir)

    await pool.execute(
      `INSERT INTO deploy_versions (version, branch, frontend_commit, backend_commit, target, status, note)
       VALUES (?, ?, ?, ?, ?, 'success', ?)`,
      [version, branch, side === 'frontend' ? commit : '', side === 'backend' ? commit : '', side, note || '']
    )

    res.json({ success: true, message: `${side === 'frontend' ? '前端' : '后端'}版本 v${version} 已记录`, data: { version, branch } })
  } catch (error) {
    console.error('记录部署版本失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * POST /api/version/rollback/:id
 * 回滚到指定版本（只影响对应端）
 */
router.post('/rollback/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute('SELECT * FROM deploy_versions WHERE id = ?', [id])

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '版本记录不存在' })
    }

    const version = rows[0]
    const side = version.target
    const dir = getDir(side)
    const sideLabel = side === 'frontend' ? '前端' : '后端'

    // 标记为已回滚
    await pool.execute("UPDATE deploy_versions SET rolled_back = 1 WHERE id = ?", [id])

    // git checkout 到对应 commit 或分支
    let result = ''
    const commit = side === 'frontend' ? version.frontend_commit : version.backend_commit
    if (commit) {
      result = runCmd(`git checkout ${commit} 2>&1`, dir)
    } else {
      result = runCmd(`git checkout ${version.branch} 2>&1 || git checkout -b ${version.branch} origin/${version.branch} 2>&1`, dir)
    }

    res.json({
      success: true,
      message: `已回滚${sideLabel}到版本 v${version.version}`,
      data: {
        side,
        version: version.version,
        branch: version.branch,
        result: result || '已切换',
      },
    })
  } catch (error) {
    console.error('回滚版本失败:', error)
    res.status(500).json({ success: false, message: '回滚失败: ' + error.message })
  }
})

/**
 * POST /api/version/switch-branch
 * 发布后合并 main 并切换到下一个版本分支
 * body: { side: 'frontend'|'backend', version: '0.0.4' }
 */
router.post('/switch-branch', async (req, res) => {
  try {
    const { side, version } = req.body
    if (!['frontend', 'backend'].includes(side)) {
      return res.status(400).json({ success: false, message: 'side 必须为 frontend 或 backend' })
    }
    if (!version) {
      return res.status(400).json({ success: false, message: '版本号不能为空' })
    }

    const dir = getDir(side)
    const prefix = getPrefix(side)
    const nextBranch = `${prefix}/${version}`
    const sideLabel = side === 'frontend' ? '前端' : '后端'

    // 获取当前分支
    const currentBranch = runCmd('git rev-parse --abbrev-ref HEAD', dir)
    const steps = []

    if (currentBranch && currentBranch !== 'main' && currentBranch !== 'HEAD') {
      // 先提交当前未提交的更改（如果有）
      const status = runCmd('git status --porcelain', dir)
      if (status) {
        runCmd('git add -A && git commit -m "auto: 发布前自动提交"', dir)
        steps.push('自动提交未保存的更改')
      }

      // 切到 main 并合并
      runCmd('git checkout main', dir)
      runCmd('git pull origin main --rebase 2>/dev/null || true', dir)
      const mergeResult = runCmd(`git merge ${currentBranch} --no-edit 2>&1`, dir)
      steps.push(`合并 ${currentBranch} → main`)

      if (mergeResult && !mergeResult.includes('CONFLICT')) {
        runCmd('git push origin main', dir)
        steps.push('推送 main 到远程')
      } else {
        steps.push(`合并冲突，请手动解决`)
      }
    }

    // 创建并切换到下一分支
    let result = runCmd(`git checkout ${nextBranch} 2>&1`, dir)
    if (!result) {
      result = runCmd(`git checkout -b ${nextBranch} 2>&1`, dir)
      if (result) {
        runCmd(`git push origin ${nextBranch}`, dir)
        result = `创建并推送新分支 ${nextBranch}`
      }
    }
    steps.push(`切换到 ${nextBranch}`)

    res.json({
      success: true,
      message: `${sideLabel}发布完成，已合并到 main 并切换到 ${nextBranch}`,
      data: { side, branch: nextBranch, steps },
    })
  } catch (error) {
    console.error('切换分支失败:', error)
    res.status(500).json({ success: false, message: '切换分支失败: ' + error.message })
  }
})

/**
 * DELETE /api/version/:id
 * 删除版本记录
 */
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM deploy_versions WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '版本记录不存在' })
    }
    res.json({ success: true, message: '版本记录已删除' })
  } catch (error) {
    console.error('删除版本记录失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router
