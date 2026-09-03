/**
 * Agent 工具执行器
 * 将 LLM 的工具调用映射到实际数据库查询
 */
const { pool } = require('../db')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

// 视觉模型客户端（复用 Token Plan endpoint + qwen3.7-plus 的视觉理解能力）
const visionClient = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
})
const VISION_MODEL = 'qwen3.7-plus'

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
    case 'analyze_wedding_visuals':
      return analyzeVisuals(args)
    case 'generate_plan_summary':
      return generatePlanSummary(args)
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
    // 模糊匹配 city 字段 + 回退到名称/slug 中包含关键词的场地
    const cityKw = `%${args.city}%`
    conditions.push('(city LIKE ? OR city_cn LIKE ? OR name LIKE ? OR slug LIKE ?)')
    params.push(cityKw, cityKw, cityKw, cityKw)
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
    // 模糊匹配 city 字段 + 回退到名称/slug
    const cityKw = `%${args.city}%`
    conditions.push('(city LIKE ? OR city_cn LIKE ? OR name LIKE ? OR slug LIKE ?)')
    params.push(cityKw, cityKw, cityKw, cityKw)
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
 * 搜索礼服商品（从 crawled_dresses 表获取，与前端列表页/详情页数据一致）
 */
async function searchDresses() {
  const [rows] = await pool.execute(
    `SELECT slug, name, name_en, category_cn, tagline,
            LEFT(description, 200) AS description,
            cover_image, price, highlights
     FROM crawled_dresses
     ORDER BY sort_order ASC
     LIMIT 10`
  )

  return rows.map(r => ({
    slug: r.slug,
    name: r.name,
    nameEn: r.name_en,
    category: r.category_cn || '',
    tagline: r.tagline || '',
    price: r.price,
    unit: '€',
    coverImage: r.cover_image || '',
    description: r.description ? r.description.substring(0, 150) : '',
  }))
}

/**
 * 分析婚礼视频/图片的视觉要素
 * 读取关键帧图片，调用视觉模型提取结构化婚礼标签
 */
async function analyzeVisuals(args) {
  const videoId = args.video_id
  const framesDir = path.join(__dirname, '../../uploads/tmp', videoId, 'frames')

  if (!fs.existsSync(framesDir)) {
    return { error: '关键帧不存在或已过期，请让用户重新上传' }
  }

  const frameFiles = fs.readdirSync(framesDir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort()

  if (frameFiles.length === 0) {
    return { error: '未找到可分析的图片帧' }
  }

  // 构建多图消息内容
  const content = [
    {
      type: 'text',
      text: `请仔细分析这些婚礼相关图片，提取以下视觉要素并以严格 JSON 格式返回（不要包含任何其他文字，只返回 JSON）：
{
  "venue_style": "场地类型（城堡/花园/海滩/教堂/庄园/酒店/户外草坪/室内宴会厅）",
  "setting": "室内/室外/半室外",
  "color_palette": ["主色调1", "主色调2", "主色调3"],
  "flower_style": "花艺风格（自然田园/经典圆形/瀑布型/极简/奢华）",
  "flower_types": ["可见花材1", "可见花材2"],
  "dress_style": "婚纱款式（A字/鱼尾/蓬蓬裙/短款/修身）",
  "dress_detail": "婚纱细节（蕾丝/缎面/薄纱/刺绣/珍珠）",
  "decor_style": "布置风格（波西米亚/经典优雅/田园/现代简约/复古/奢华）",
  "lighting": "灯光氛围（暖光/自然光/烛光/串灯/水晶灯）",
  "overall_mood": "整体氛围关键词（如：浪漫、清新、大气、温馨）",
  "season_feel": "季节感（春/夏/秋/冬）"
}
如果某项在图片中无法判断，填写"未识别"。`,
    },
  ]

  for (const frame of frameFiles) {
    const framePath = path.join(framesDir, frame)
    const base64 = fs.readFileSync(framePath).toString('base64')
    const ext = path.extname(frame).slice(1)
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    content.push({
      type: 'image_url',
      image_url: { url: `data:${mime};base64,${base64}` },
    })
  }

  try {
    const response = await visionClient.chat.completions.create({
      model: VISION_MODEL,
      messages: [{ role: 'user', content }],
      max_tokens: 1500,
    })

    const text = response.choices[0]?.message?.content || '{}'
    // 提取 JSON（兼容模型返回 markdown 代码块的情况）
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    // ✅ 分析完成后清理关键帧文件
    try { fs.rmSync(framesDir, { recursive: true, force: true }) } catch {}

    return result
  } catch (error) {
    console.error('[analyze_wedding_visuals] 视觉模型调用失败:', error.message)
    return { error: `视觉分析失败: ${error.message}。请检查视觉模型是否可用。` }
  }
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

/**
 * 生成最终婚礼推荐方案摘要
 * 返回结构化数据，前端会渲染为精美表格并支持 PDF 下载
 */
function generatePlanSummary(args) {
  const items = args.items || []
  if (items.length === 0) return { error: '请提供至少一项推荐' }

  // 返回结构化数据（供前端渲染）+ 文本摘要（供 LLM 参考）
  const lines = items.map(item => {
    const price = item.price_range ? `，${item.price_range}` : ''
    return `• ${item.category_cn}：${item.name} — ${item.description}${price}`
  })

  return {
    _type: 'plan_summary',
    items: items.map(item => ({
      category: item.category,
      categoryCn: item.category_cn,
      name: item.name,
      nameEn: item.name_en || '',
      description: item.description,
      priceRange: item.price_range || '',
      image: item.image || '',
      link: item.link || '',
    })),
    _text: `已生成推荐方案摘要：\n${lines.join('\n')}\n\n请向用户展示以上方案，并告知可下载 PDF 保存。`,
  }
}

module.exports = { executeTool, analyzeVisuals }
