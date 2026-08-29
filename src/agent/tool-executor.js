/**
 * Agent 工具执行器
 * 将 LLM 的工具调用映射到实际数据库查询
 */
const { pool } = require('../db')

async function executeTool(name, args) {
  switch (name) {
    case 'search_venues':
      return searchVenues(args)
    case 'search_photographers':
      return searchPhotographers(args)
    case 'search_florists':
      return searchFlorists(args)
    case 'search_flowers':
      return searchFlowers(args)
    case 'search_wines':
      return searchWines(args)
    case 'search_dresses':
      return searchDresses(args)
    case 'calculate_budget':
      return calculateBudget(args)
    default:
      return { error: `未知工具: ${name}` }
  }
}

/**
 * 搜索婚礼场地
 */
async function searchVenues(args) {
  const conditions = []
  const params = []

  if (args.country) {
    conditions.push('(country = ? OR country_cn = ?)')
    params.push(args.country, args.country)
  }
  if (args.city) {
    conditions.push('(city = ? OR city_cn = ?)')
    params.push(args.city, args.city)
  }
  if (args.max_budget) {
    conditions.push('price <= ?')
    params.push(args.max_budget)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT slug, name, name_cn, country_cn, city_cn, tagline,
            capacity, price, price_unit, venue_types, cover_image, description
     FROM crawled_venues ${where}
     ORDER BY sort_order DESC, price ASC
     LIMIT 10`,
    params
  )

  // 解析 JSON 字段
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name_cn || r.name,
    country: r.country_cn,
    city: r.city_cn,
    tagline: r.tagline,
    capacity: r.capacity,
    price: r.price,
    priceUnit: r.price_unit,
    venueTypes: safeJsonParse(r.venue_types, []),
    coverImage: r.cover_image,
    description: r.description ? r.description.substring(0, 200) : '',
  }))
}

/**
 * 搜索摄影师
 */
async function searchPhotographers(args) {
  const conditions = []
  const params = []

  if (args.country) {
    conditions.push('(country_en = ? OR country = ?)')
    params.push(args.country, args.country)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT slug, name, name_cn, country, country_en, tagline,
            photo_styles, price, cover_image, description
     FROM crawled_photographers ${where}
     ORDER BY sort_order DESC, price ASC
     LIMIT 10`,
    params
  )

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name_cn || r.name,
    country: r.country || r.country_en,
    tagline: r.tagline,
    styles: safeJsonParse(r.photo_styles, []),
    price: r.price,
    coverImage: r.cover_image,
    description: r.description ? r.description.substring(0, 200) : '',
  }))
}

/**
 * 搜索花店
 */
async function searchFlorists(args) {
  const conditions = []
  const params = []

  if (args.country) {
    conditions.push('(country = ? OR country_cn = ?)')
    params.push(args.country, args.country)
  }
  if (args.city) {
    conditions.push('(city = ? OR city_cn = ?)')
    params.push(args.city, args.city)
  }
  if (args.max_budget) {
    conditions.push('price <= ?')
    params.push(args.max_budget)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT slug, name, name_cn, country_cn, city_cn, tagline,
            specialties, price, cover_image, description
     FROM crawled_florists ${where}
     ORDER BY sort_order DESC, price ASC
     LIMIT 10`,
    params
  )

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name_cn || r.name,
    country: r.country_cn,
    city: r.city_cn,
    tagline: r.tagline,
    specialties: safeJsonParse(r.specialties, []),
    price: r.price,
    coverImage: r.cover_image,
    description: r.description ? r.description.substring(0, 200) : '',
  }))
}

/**
 * 搜索花卉商品（Florajet 产品）
 */
async function searchFlowers(args) {
  // 从 Florajet 的 crawled_florists 记录中获取产品列表
  const [rows] = await pool.execute(
    "SELECT fresh_flower_products FROM crawled_florists WHERE slug LIKE '%florajet%' LIMIT 1"
  )
  if (!rows.length) return { error: '未找到花卉商品数据' }

  let raw = rows[0].fresh_flower_products
  let products = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (!Array.isArray(products)) return { error: '花卉商品数据格式异常' }

  // 筛选
  if (args.category) {
    products = products.filter(p => p.category === args.category)
  }
  if (args.max_price != null) {
    products = products.filter(p => p.price <= args.max_price)
  }
  if (args.keyword) {
    const kw = args.keyword.toLowerCase()
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(kw)) ||
      (p.name_cn && p.name_cn.toLowerCase().includes(kw)) ||
      (p.desc_cn && p.desc_cn.toLowerCase().includes(kw)) ||
      (p.category && p.category.toLowerCase().includes(kw))
    )
  }

  // 返回精简数据（最多 10 条）
  return products.slice(0, 10).map(p => ({
    slug: p.slug,
    name: p.name_cn || p.name,
    category: p.category,
    price: p.price,
    coverImage: p.image || (p.images && p.images[0]) || '',
    description: p.desc_cn ? p.desc_cn.substring(0, 120) : '',
    composition: p.composition_cn || '',
  }))
}

/**
 * 搜索酒水商品
 */
async function searchWines(args) {
  const conditions = []
  const params = []

  if (args.keyword) {
    conditions.push('(name LIKE ? OR name_en LIKE ? OR tagline LIKE ?)')
    const kw = `%${args.keyword}%`
    params.push(kw, kw, kw)
  }
  if (args.max_price != null) {
    conditions.push('price <= ?')
    params.push(args.max_price)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [rows] = await pool.execute(
    `SELECT product_id, name, name_en, description, image, price, unit, tagline
     FROM products_wine ${where}
     ORDER BY sort_order DESC, price ASC
     LIMIT 10`,
    params
  )

  return rows.map(r => ({
    slug: r.product_id,
    name: r.name,
    nameEn: r.name_en,
    tagline: r.tagline || '',
    price: r.price,
    unit: r.unit || '€',
    coverImage: r.image || '',
    description: r.description ? r.description.substring(0, 150) : '',
  }))
}

/**
 * 搜索礼服商品
 */
async function searchDresses() {
  const [rows] = await pool.execute(
    `SELECT product_id, name, name_en, description, image, price, unit, highlight
     FROM products_dress
     ORDER BY sort_order ASC`
  )

  return rows.map(r => ({
    slug: r.product_id,
    name: r.name,
    nameEn: r.name_en,
    price: r.price,
    unit: r.unit || '€',
    coverImage: r.image || '',
    description: r.description ? r.description.substring(0, 150) : '',
    highlight: r.highlight || '',
  }))
}

/**
 * 计算预算分配
 */
function calculateBudget(args) {
  const total = args.total_budget
  const guests = args.guest_count || 60

  // 目的地婚礼经验分配比例
  const breakdown = {
    venue: { label: '场地租赁', percent: 30, amount: Math.round(total * 0.3) },
    catering: { label: '餐饮宴席', percent: 25, amount: Math.round(total * 0.25) },
    photography: { label: '摄影摄像', percent: 15, amount: Math.round(total * 0.15) },
    flowers: { label: '花卉布置', percent: 12, amount: Math.round(total * 0.12) },
    decoration: { label: '场景布置', percent: 8, amount: Math.round(total * 0.08) },
    other: { label: '交通住宿/其他', percent: 10, amount: Math.round(total * 0.1) },
  }

  const perGuestCost = Math.round(total / guests)

  return {
    totalBudget: total,
    guestCount: guests,
    perGuest: perGuestCost,
    breakdown,
    feasibility: total >= 50000 ? '可行' : '预算较紧张，建议考虑缩减规模或选择性价比更高的目的地',
  }
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

module.exports = { executeTool }
