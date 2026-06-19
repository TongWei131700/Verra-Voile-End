const express = require('express')
const { pool } = require('../db')

const router = express.Router()

/**
 * POST /api/reservation
 * 接收前端 RSVP 表单提交，将预约信息存入数据库
 */
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, destination, date } = req.body

    // 参数校验
    if (!name || !phone || !destination || !date) {
      return res.status(400).json({
        success: false,
        message: '请填写必填字段（姓名、电话、目的地、时间）',
      })
    }

    const sql = `
      INSERT INTO reservations (name, phone, email, destination, date)
      VALUES (?, ?, ?, ?, ?)
    `
    const [result] = await pool.execute(sql, [
      name,
      phone,
      email || '',
      destination,
      date,
    ])

    res.status(201).json({
      success: true,
      message: '预约成功',
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error('预约接口错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误，请稍后重试',
    })
  }
})

/**
 * GET /api/reservation
 * 获取所有预约列表（管理用）
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM reservations ORDER BY created_at DESC'
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('查询预约列表错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    })
  }
})

module.exports = router
