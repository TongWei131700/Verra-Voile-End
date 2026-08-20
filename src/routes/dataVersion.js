/**
 * 数据版本控制 API
 * 支持多表数据快照管理
 */
const express = require('express')
const { pool } = require('../db')

const router = express.Router()

// 允许管理的表白名单
const MANAGED_TABLES = ['crawled_venues']

/**
 * 初始化 data_versions 表（增加 source_table 字段）
 */
async function ensureDataVersionsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS data_versions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version_name VARCHAR(100) NOT NULL COMMENT '版本名称',
      source_table VARCHAR(100) NOT NULL COMMENT '源表名',
      snapshot_table VARCHAR(100) NOT NULL COMMENT '快照表名',
      record_count INT DEFAULT 0 COMMENT '记录数',
      country_summary JSON COMMENT '各国数据量摘要',
      note VARCHAR(500) DEFAULT '' COMMENT '版本备注',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据版本记录表'
  `)
  
  // 检查是否有 source_table 字段，没有则添加
  const [cols] = await pool.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'data_versions' AND COLUMN_NAME = 'source_table'
  `)
  if (cols.length === 0) {
    await pool.execute(`ALTER TABLE data_versions ADD COLUMN source_table VARCHAR(100) NOT NULL DEFAULT 'testDestination' COMMENT '源表名' AFTER version_name`)
  }
}

/**
 * GET /api/data-version/tables
 * 获取可管理的表列表及当前数据量
 */
router.get('/tables', async (req, res) => {
  try {
    await ensureDataVersionsTable()
    const tables = []
    for (const tableName of MANAGED_TABLES) {
      try {
        const [rows] = await pool.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``)
        const [versions] = await pool.execute(
          'SELECT COUNT(*) as cnt FROM data_versions WHERE source_table = ?',
          [tableName]
        )
        tables.push({
          name: tableName,
          record_count: rows[0].cnt,
          version_count: versions[0].cnt,
          label: tableName
        })
      } catch (e) {
        // 表不存在则跳过
      }
    }
    res.json({ success: true, data: tables })
  } catch (error) {
    console.error('获取表列表失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/data-version/list?table=xxx
 * 获取指定表的版本列表
 */
router.get('/list', async (req, res) => {
  try {
    await ensureDataVersionsTable()
    const { table } = req.query
    let sql = 'SELECT * FROM data_versions'
    const params = []
    if (table) {
      sql += ' WHERE source_table = ?'
      params.push(table)
    }
    sql += ' ORDER BY created_at DESC'
    const [rows] = await pool.execute(sql, params)
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取版本列表失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/data-version/save
 * 将指定表数据保存为新版本快照
 * Body: { table: string, name: string, note?: string }
 */
router.post('/save', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await ensureDataVersionsTable()
    const { table, name, note = '' } = req.body
    if (!table || !MANAGED_TABLES.includes(table)) {
      return res.status(400).json({ success: false, message: '无效的表名' })
    }
    if (!name) {
      return res.status(400).json({ success: false, message: '版本名称不能为空' })
    }

    // 检查表是否有数据
    const [count] = await conn.execute(`SELECT COUNT(*) as cnt FROM \`${table}\``)
    if (count[0].cnt === 0) {
      return res.status(400).json({ success: false, message: `${table} 表无数据，无法创建快照` })
    }

    // 创建版本记录
    const [insertResult] = await conn.execute(
      'INSERT INTO data_versions (version_name, source_table, snapshot_table, record_count, note) VALUES (?, ?, ?, ?, ?)',
      [name, table, '', count[0].cnt, note]
    )
    const versionId = insertResult.insertId
    const snapshotTable = `snapshot_${table}_${versionId}`

    // 创建快照表
    await conn.execute(`DROP TABLE IF EXISTS \`${snapshotTable}\``)
    await conn.execute(`CREATE TABLE \`${snapshotTable}\` LIKE \`${table}\``)
    const [copyResult] = await conn.execute(
      `INSERT INTO \`${snapshotTable}\` SELECT * FROM \`${table}\``
    )

    // 统计各国数据量（如果有 country 字段）
    let countryStats = []
    try {
      const [stats] = await conn.execute(
        `SELECT country, country_cn, COUNT(*) as cnt FROM \`${snapshotTable}\` GROUP BY country, country_cn ORDER BY cnt DESC`
      )
      countryStats = stats
    } catch (e) {
      // 表可能没有 country 字段
    }

    // 更新版本记录
    await conn.execute(
      'UPDATE data_versions SET snapshot_table = ?, country_summary = ? WHERE id = ?',
      [snapshotTable, JSON.stringify(countryStats), versionId]
    )

    res.json({
      success: true,
      data: {
        id: versionId,
        version_name: name,
        source_table: table,
        snapshot_table: snapshotTable,
        record_count: copyResult.affectedRows,
        country_summary: countryStats,
        note,
      }
    })
  } catch (error) {
    console.error('保存版本失败:', error)
    res.status(500).json({ success: false, message: error.message })
  } finally {
    conn.release()
  }
})

/**
 * GET /api/data-version/preview/:id?page=1&pageSize=10
 * 预览指定版本的数据（全字段，分页）
 */
router.get('/preview/:id', async (req, res) => {
  try {
    const [versions] = await pool.execute(
      'SELECT snapshot_table, source_table FROM data_versions WHERE id = ?',
      [req.params.id]
    )
    if (versions.length === 0) {
      return res.status(404).json({ success: false, message: '版本不存在' })
    }
    const tableName = versions[0].snapshot_table

    // 分页参数
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10))
    const offset = (page - 1) * pageSize

    // 获取总记录数
    const [countResult] = await pool.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``)
    const total = countResult[0].cnt

    // 获取全字段数据，分页返回
    const [rows] = await pool.execute(
      `SELECT * FROM \`${tableName}\` ORDER BY sort_order ASC, id ASC LIMIT ${pageSize} OFFSET ${offset}`
    )

    // 获取表的列信息
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`,
      [tableName]
    )

    res.json({
      success: true,
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      columns: columns.map(c => c.COLUMN_NAME),
      versionId: Number(req.params.id)
    })
  } catch (error) {
    console.error('预览版本失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * POST /api/data-version/restore/:id
 * 将指定版本数据回滚到源表
 */
router.post('/restore/:id', async (req, res) => {
  const conn = await pool.getConnection()
  try {
    const [versions] = await conn.execute(
      'SELECT snapshot_table, source_table, version_name FROM data_versions WHERE id = ?',
      [req.params.id]
    )
    if (versions.length === 0) {
      return res.status(404).json({ success: false, message: '版本不存在' })
    }
    const { snapshot_table, source_table, version_name } = versions[0]

    // 清空源表并从快照恢复
    await conn.execute(`DELETE FROM \`${source_table}\``)
    const [restoreResult] = await conn.execute(
      `INSERT INTO \`${source_table}\` SELECT * FROM \`${snapshot_table}\``
    )

    res.json({
      success: true,
      message: `已回滚到版本「${version_name}」，共 ${restoreResult.affectedRows} 条记录`,
      record_count: restoreResult.affectedRows
    })
  } catch (error) {
    console.error('回滚版本失败:', error)
    res.status(500).json({ success: false, message: error.message })
  } finally {
    conn.release()
  }
})

/**
 * DELETE /api/data-version/:id
 * 删除指定版本（连同快照表）
 */
router.delete('/:id', async (req, res) => {
  try {
    const [versions] = await pool.execute(
      'SELECT snapshot_table, version_name FROM data_versions WHERE id = ?',
      [req.params.id]
    )
    if (versions.length === 0) {
      return res.status(404).json({ success: false, message: '版本不存在' })
    }

    // 删除快照表
    await pool.execute(`DROP TABLE IF EXISTS \`${versions[0].snapshot_table}\``)
    // 删除版本记录
    await pool.execute('DELETE FROM data_versions WHERE id = ?', [req.params.id])

    res.json({ success: true, message: `已删除版本「${versions[0].version_name}」` })
  } catch (error) {
    console.error('删除版本失败:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
