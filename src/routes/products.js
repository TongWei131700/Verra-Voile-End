const express = require('express')
const { pool, getCategoryTable, ensureCategoryTable, ensureDestinationTable, ensureWeddingTeamsTable } = require('../db')

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
 * GET /api/products/destination
 * 获取目的地场地数据（按城市分组）
 */
router.get('/destination', async (req, res) => {
  try {
    await ensureDestinationTable(pool)
    const [rows] = await pool.execute(
      `SELECT product_id AS productId, name, name_en AS nameEn, description, image, price, unit, capacity, highlight,
              city_id AS cityId, category_id AS categoryId, category_name AS categoryName,
              category_name_en AS categoryNameEn, category_icon AS categoryIcon, sort_order
       FROM \`products_destination\`
       ORDER BY city_id ASC, category_id ASC, sort_order ASC`
    )

    // 按城市分组
    const cityMap = {}
    for (const row of rows) {
      const cid = row.cityId
      if (!cityMap[cid]) {
        cityMap[cid] = {
          cityId: cid,
          categories: {},
        }
      }
      const catId = row.categoryId
      if (!cityMap[cid].categories[catId]) {
        cityMap[cid].categories[catId] = {
          id: row.categoryId,
          label: row.categoryName,
          labelEn: row.categoryNameEn,
          icon: row.categoryIcon,
          venues: [],
        }
      }
      cityMap[cid].categories[catId].venues.push({
        id: row.productId,
        name: row.name,
        nameEn: row.nameEn,
        desc: row.description,
        img: row.image,
        price: row.price,
        unit: row.unit,
        capacity: row.capacity,
        highlight: row.highlight,
      })
    }

    // 转为数组格式
    const cities = Object.values(cityMap).map(city => ({
      cityId: city.cityId,
      categories: Object.values(city.categories),
    }))

    res.json({ success: true, data: { cities } })
  } catch (error) {
    console.error('获取目的地场地失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/wedding-teams
 * 获取婚礼团队服务列表
 */
router.get('/wedding-teams', async (req, res) => {
  try {
    await ensureWeddingTeamsTable(pool)
    const [rows] = await pool.execute(
      'SELECT * FROM wedding_teams ORDER BY sort_order ASC'
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取婚礼团队列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-destinations
 * 获取爬取目的地列表（试验表）
 */
router.get('/crawled-destinations', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn,
              LEFT(COALESCE(description_cn, description), 200) AS description_preview, description_cn,
              cover_image, features, venue_types, towns, budget_ranges, guest_capacities,
              sort_order, created_at
       FROM crawled_destinations
       ORDER BY sort_order ASC`
    )

    // 合并 crawled_venues 表数据（如“测试英国”）
    const [venueRows] = await pool.execute(
      `SELECT id, slug, name, name_cn, country, country_cn, source_url, tagline,
              LEFT(description, 200) AS description_preview,
              cover_image, features, venue_types, towns, budget_ranges, guest_capacities,
              sort_order, created_at
       FROM crawled_venues
       ORDER BY sort_order ASC`
    )

    // 格式化 venueRows 使其与 crawled_destinations 字段对齐
    const venueData = venueRows.map(v => ({
      ...v,
      tagline_cn: '',
      description_cn: null,
    }))

    res.json({ success: true, data: [...rows, ...venueData] })
  } catch (error) {
    console.error('获取爬取目的地列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-destinations/:slug
 * 获取单个爬取目的地详情（试验表）
 */
router.get('/crawled-destinations/:slug', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM crawled_destinations WHERE slug = ?`,
      [req.params.slug]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '目的地不存在' })
    }
    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('获取爬取目的地详情失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-venues
 * 获取爬取场地列表（crawled_venues 表），可选 country_cn 筛选
 */
router.get('/crawled-venues', async (req, res) => {
  try {
    const { country_cn } = req.query
    let sql = 'SELECT * FROM crawled_venues'
    const params = []
    if (country_cn) {
      sql += ' WHERE country_cn = ?'
      params.push(country_cn)
    }
    sql += ' ORDER BY sort_order ASC, id ASC'
    const [rows] = await pool.execute(sql, params)
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取爬取场地列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-venues/:slug
 * 获取单个爬取场地详情（crawled_venues 表）
 */
router.get('/crawled-venues/:slug', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM crawled_venues WHERE slug = ?`,
      [req.params.slug]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '场地不存在' })
    }
    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('获取爬取场地详情失败:', error)
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
