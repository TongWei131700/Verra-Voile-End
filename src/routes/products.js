const express = require('express')
const { pool, getCategoryTable, ensureCategoryTable, ensureDestinationTable, ensureWeddingTeamsTable, ensureCrawledFloristsTable } = require('../db')

const router = express.Router()

/**
 * 辅助：安全解析 JSON 数组字段
 */
function safeJsonArr(str) {
  try {
    const v = JSON.parse(str)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/**
 * 辅助：动态发现所有 cd_ / cv_ 国家分表
 */
async function getCountryTables(prefix) {
  const [tables] = await pool.execute(`SHOW TABLES LIKE '${prefix}\\_%'`)
  return tables.map(t => Object.values(t)[0])
}

/**
 * 辅助：从所有 cd_ 表中 UNION 查询列表
 */
async function queryAllDestinations() {
  const tables = await getCountryTables('cd')
  if (tables.length === 0) return []
  const selects = tables.map(t =>
    `SELECT id, slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn,
            LEFT(COALESCE(description_cn, description), 200) AS description_preview, description_cn,
            cover_image, features, venue_types, towns, budget_ranges, guest_capacities,
            sort_order, created_at
     FROM \`${t}\``
  )
  const [rows] = await pool.execute(selects.join(' UNION ALL ') + ' ORDER BY sort_order ASC')
  return rows
}

/**
 * 辅助：从所有 cv_ 表中按 slug 查找场地
 */
async function findVenueBySlug(slug) {
  const tables = await getCountryTables('cv')
  for (const t of tables) {
    const [rows] = await pool.execute(`SELECT * FROM \`${t}\` WHERE slug = ? LIMIT 1`, [slug])
    if (rows.length > 0) return rows[0]
  }
  return null
}

/**
 * 辅助：从所有 cd_ 表中按 slug 查找目的地
 */
async function findDestinationBySlug(slug) {
  const tables = await getCountryTables('cd')
  for (const t of tables) {
    const [rows] = await pool.execute(`SELECT * FROM \`${t}\` WHERE slug = ? LIMIT 1`, [slug])
    if (rows.length > 0) return rows[0]
  }
  return null
}

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
 * 获取爬取目的地列表（从所有国家分表 UNION）
 */
router.get('/crawled-destinations', async (req, res) => {
  try {
    const data = await queryAllDestinations()
    res.json({ success: true, data })
  } catch (error) {
    console.error('获取爬取目的地列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-destinations/:slug
 * 获取单个爬取目的地详情（从所有国家分表查找）
 */
router.get('/crawled-destinations/:slug', async (req, res) => {
  try {
    const data = await findDestinationBySlug(req.params.slug)
    if (!data) {
      return res.status(404).json({ success: false, message: '目的地不存在' })
    }
    res.json({ success: true, data })
  } catch (error) {
    console.error('获取爬取目的地详情失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-venues
 * 获取爬取场地列表（从所有国家分表），可选 country_cn 筛选
 */
router.get('/crawled-venues', async (req, res) => {
  try {
    const { country_cn } = req.query
    const tables = await getCountryTables('cv')
    if (tables.length === 0) return res.json({ success: true, data: [] })

    const selects = tables.map(t => {
      if (country_cn) {
        return `SELECT * FROM \`${t}\` WHERE country_cn = ?`
      }
      return `SELECT * FROM \`${t}\``
    })
    const params = country_cn ? tables.map(() => country_cn).flat() : []
    const [rows] = await pool.execute(
      selects.join(' UNION ALL ') + ' ORDER BY sort_order ASC, id ASC',
      params
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取爬取场地列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-venues/:slug
 * 获取单个爬取场地详情（从所有国家分表查找）
 */
router.get('/crawled-venues/:slug', async (req, res) => {
  try {
    const data = await findVenueBySlug(req.params.slug)
    if (!data) {
      return res.status(404).json({ success: false, message: '场地不存在' })
    }
    res.json({ success: true, data })
  } catch (error) {
    console.error('获取爬取场地详情失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-wedding-teams
 * 获取爬取婚礼团队公司列表
 */
router.get('/crawled-wedding-teams', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, slug, name, name_cn, source_url, country, country_cn, city, city_cn,
              tagline, LEFT(description, 200) AS description_preview,
              founded_year, specialties, service_areas,
              cover_image, headshot, website, price, sort_order, created_at
       FROM crawled_wedding_teams ORDER BY sort_order ASC`
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取爬取婚礼团队列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-wedding-teams/:slug
 * 获取单个爬取婚礼团队公司详情
 */
router.get('/crawled-wedding-teams/:slug', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM crawled_wedding_teams WHERE slug = ? LIMIT 1',
      [req.params.slug]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '婚礼团队不存在' })
    }
    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('获取爬取婚礼团队详情失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-photographers
 * 获取爬取摄影师列表
 */
router.get('/crawled-photographers', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, slug, name, name_cn, country, country_en, category, category_cn,
              tagline, LEFT(description, 200) AS description_preview,
              photo_styles, highlights, cover_image, headshot, website, price,
              video_url, sort_order, created_at
       FROM crawled_photographers ORDER BY sort_order ASC`
    )
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取摄影师列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-photographers/:slug
 * 获取单个摄影师详情
 */
router.get('/crawled-photographers/:slug', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM crawled_photographers WHERE slug = ? LIMIT 1',
      [req.params.slug]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '摄影师不存在' })
    }
    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('获取摄影师详情失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-florists
 * 获取爬取花店列表
 */
router.get('/crawled-florists', async (req, res) => {
  try {
    await ensureCrawledFloristsTable(pool)
    const { type } = req.query
    let query = `SELECT id, slug, name, name_cn, source_url, country, country_cn, city, city_cn,
              tagline, LEFT(description, 200) AS description_preview,
              specialties, cover_image, headshot, website, price, sort_order, created_at
       FROM crawled_florists`
    const params = []
    
    if (type) {
      query += ' WHERE type = ?'
      params.push(type)
    }
    
    query += ' ORDER BY sort_order ASC'
    
    const [rows] = await pool.execute(query, params)
    res.json({ success: true, data: rows })
  } catch (error) {
    console.error('获取爬取花店列表失败:', error)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

/**
 * GET /api/products/crawled-florists/:slug
 * 获取单个花店详情
 */
router.get('/crawled-florists/:slug', async (req, res) => {
  try {
    await ensureCrawledFloristsTable(pool)
    const [rows] = await pool.execute(
      'SELECT * FROM crawled_florists WHERE slug = ? LIMIT 1',
      [req.params.slug]
    )
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '花店不存在' })
    }
    res.json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('获取爬取花店详情失败:', error)
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

    // 检测表中是否存在详情页富字段（tagline/images/highlights/source_url）
    const [colRows] = await pool.execute(`SHOW COLUMNS FROM \`${tableName}\``)
    const colNames = colRows.map(c => c.Field)
    const richCols = ['tagline', 'images', 'highlights', 'source_url'].filter(c => colNames.includes(c))
    const richSelect = richCols.length > 0 ? ', ' + richCols.join(', ') : ''

    // 从对应的独立表中查询商品
    const [rawProducts] = await pool.execute(
      `SELECT product_id AS productId, name, name_en AS nameEn, description, image, price, unit, capacity, highlight, sort_order${richSelect} FROM \`${tableName}\` ORDER BY sort_order ASC`
    )

    // JSON 字段解析为数组
    const products = rawProducts.map(p => ({
      ...p,
      images: typeof p.images === 'string' && p.images ? safeJsonArr(p.images) : (Array.isArray(p.images) ? p.images : undefined),
      highlights: typeof p.highlights === 'string' && p.highlights ? safeJsonArr(p.highlights) : (Array.isArray(p.highlights) ? p.highlights : undefined),
      tagline: p.tagline || undefined,
      sourceUrl: p.source_url || undefined,
    }))

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
