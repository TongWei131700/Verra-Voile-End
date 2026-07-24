const express = require('express')
const { pool, getCategoryTable, ensureCategoryTable } = require('../db')

const router = express.Router()

/**
 * GET /api/products
 * 获取所有商品种类概览（用于 Listing 页面卡片）
 * 返回格式: { categories: [{ id, name, nameEn, image, description }] }
 */
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT id, name, name_en AS nameEn, image, description FROM product_modules ORDER BY sort_order ASC'
    )
    res.json({ success: true, data: { categories } })
  } catch (error) {
    console.error('获取商品种类失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/:moduleId
 * 获取指定种类及其商品列表（从对应的独立表查询）
 */
router.get('/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params

    // 查询种类信息
    const [modules] = await pool.execute(
      'SELECT id, name, name_en AS nameEn, image, description FROM product_modules WHERE id = ?',
      [moduleId]
    )

    if (modules.length === 0) {
      return res.status(404).json({ success: false, message: '种类不存在' })
    }

    // 确保该种类对应的表存在
    const tableName = await ensureCategoryTable(pool, moduleId)

    // 从对应的独立表中查询商品
    const [products] = await pool.execute(
      `SELECT product_id AS productId, name, name_en AS nameEn, description, image, price, unit, capacity, highlight, sort_order FROM \`${tableName}\` ORDER BY sort_order ASC`
    )

    const mod = modules[0]
    res.json({
      success: true,
      data: {
        id: mod.id,
        name: mod.name,
        nameEn: mod.nameEn,
        image: mod.image,
        description: mod.description,
        products,
      },
    })
  } catch (error) {
    console.error('获取种类商品失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

module.exports = router
