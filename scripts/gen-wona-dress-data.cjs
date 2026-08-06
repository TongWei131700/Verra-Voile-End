/**
 * 生成前端礼服数据文件 src/data/wonaDressProducts.ts
 * 输入：scripts/wona-dress-details.json
 * 功能：过滤系列页 → 解析规格 → gtx 翻译（带缓存）→ 输出 TS
 * 运行：node scripts/gen-wona-dress-data.cjs
 */
const fs = require('fs')
const path = require('path')

const DETAILS_FILE = path.join(__dirname, 'wona-dress-details.json')
const CACHE_FILE = path.join(__dirname, 'wona-translate-cache.json')
const OUT_FILE = path.join(__dirname, '..', '..', 'Verra-Voile', 'src', 'data', 'wonaDressProducts.ts')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ===== 规格词典（高频词本地映射，减少翻译调用） =====
const SPEC_DICT = {
  'A-line': 'A 字', 'Mermaid': '鱼尾', 'Fitted': '修身', 'Ball Gown': '蓬裙',
  'Fit and Flare': '鱼尾伞摆', 'Sheath': '直筒', 'Trumpet': '喇叭',
  'Modern': '现代', 'Romantic': '浪漫', 'Classic': '经典', 'Boho': '波西米亚',
  'Minimalist': '极简', 'Glamour': '华丽', 'Vintage': '复古', 'Sexy': '性感',
  'Floor length': '落地长裙', 'Chapel train': '教堂拖尾', 'Cathedral train': '大教堂拖尾',
  'Sweep train': '扫尾', 'No train': '无拖尾', 'Detachable train': '可拆卸拖尾',
  'Sweetheart': '心形领', 'Strapless': '抹胸', 'V-neck': 'V 领', 'Off-the-shoulder': '一字肩',
  'Halter': '挂脖', 'Square': '方领', 'High neck': '高领', 'Illusion': '薄纱领',
  'Boat': '船领', 'Scoop': '圆领', 'Plunging': '深 V 领', 'Asymmetrical': '不对称领',
  'No sleeves': '无袖', 'Long sleeves': '长袖', 'Short sleeves': '短袖',
  'Detachable sleeves': '可拆卸袖', 'Cap sleeves': '盖袖', 'Spaghetti straps': '细肩带',
  'Mikado': 'Mikado 缎', 'Satin': '缎面', 'Lace': '蕾丝', 'Tulle': '薄纱',
  'Chiffon': '雪纺', 'Crepe': '双绉', 'Organza': '欧根纱', 'Beaded': '串珠',
  'Sequined': '亮片', 'Embroidered': '刺绣', 'Light ivory': '浅象牙白', 'Ivory': '象牙白',
  'White': '白色', 'Off-white': '米白', 'Champagne': '香槟色', 'Nude': '裸色',
  'Corset': '束腰', 'Zipper': '拉链', 'Buttons': '纽扣',
}

const SPEC_KEY_CN = {
  'Silhouette': '廓形', 'Style': '风格', 'Dress length': '裙长', 'Neckline': '领型',
  'Sleeves': '袖型', 'Fabric': '面料', 'Color': '颜色', 'Back': '背部', 'Waist': '腰线',
  'Train': '拖尾', 'Decor': '装饰',
}

// ===== 产品线分组 =====
const LINE_GROUPS = [
  { key: 'maison-blanche', label: 'Maison Blanche', match: ['Maison Blanche'] },
  { key: 'atelier', label: 'Atelier 系列', match: ['Atelier', 'Atelier La Femme Edition', 'Atelier Lumière Edition', 'Atelier Signature Edition', 'Atelier Limited Edition'] },
  { key: 'white', label: 'White 系列', match: ['White', 'White Edit', 'White Swan'] },
  { key: 'couture', label: 'Couture 高定系列', match: ['Couture', "L'Unico", 'Special Edition'] },
  { key: 'bridal-alchemy', label: 'Bridal Alchemy', match: ['Bridal Alchemy'] },
  { key: 'gemini', label: 'Gemini Collection', match: ['Gemini Collection'] },
  { key: 'alma-de-oro', label: 'Alma de Oro', match: ['Alma de Oro'] },
  { key: 'amore-in-fiore', label: 'Amore in Fiore', match: ['Amore in Fiore'] },
  { key: 'endless-styles', label: 'Endless Styles', match: ['Endless Styles'] },
  { key: 'miami-bliss', label: 'Miami Bliss', match: ['Miami Bliss'] },
]

function unescapeHtml(s) {
  return s.replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

// 解析规格串 ". Silhouette: A-line. Style: Modern. ..."
function parseSpecs(specs) {
  const result = {}
  if (!specs) return result
  specs.split(/\.\s+/).forEach(seg => {
    const m = seg.match(/^([A-Za-z ]+):\s*(.+)$/)
    if (m) result[m[1].trim()] = m[2].replace(/\.$/, '').trim()
  })
  return result
}

function translateValue(v) {
  if (!v) return ''
  return v.split(/,\s*/).map(part => SPEC_DICT[part.trim()] || SPEC_DICT[part.trim().replace(/\s+/g, ' ')] || null).filter(Boolean).join(' · ')
}

// ===== gtx 免密翻译（带本地缓存） =====
let cache = {}
if (fs.existsSync(CACHE_FILE)) cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
let cacheDirty = false

async function gtxTranslate(text, retries = 3) {
  const key = text.slice(0, 200)
  if (cache[key] !== undefined) return cache[key]
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const out = (data[0] || []).map(seg => seg[0]).join('')
      cache[key] = out
      cacheDirty = true
      return out
    } catch (e) {
      if (i === retries - 1) { console.warn('  ⚠ 翻译失败，保留原文:', text.slice(0, 40)); return text }
      await wait(1200 * (i + 1))
    }
  }
}

function saveCache() {
  if (cacheDirty) fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1), 'utf8')
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}

async function main() {
  const details = JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf8'))
  const products = details.filter(p => p.images.length > 0 && p.name)
  console.log(`✓ 有效商品 ${products.length} 个（过滤系列页 ${details.length - products.length} 个）`)

  const out = []
  let n = 0
  for (const p of products) {
    n++
    const line = unescapeHtml(p.line || '')
    const group = LINE_GROUPS.find(g => g.match.includes(line))
    const category = group ? group.key : 'endless-styles'

    const specs = parseSpecs(p.specs)
    // 亮点：规格中译（廓形/领型/面料/拖尾优先）
    const highlights = []
    if (specs.Silhouette) { const v = translateValue(specs.Silhouette); if (v) highlights.push(`${v}廓形`) }
    if (specs.Neckline) { const v = translateValue(specs.Neckline); if (v) highlights.push(v) }
    if (specs.Fabric) { const v = translateValue(specs.Fabric); if (v) highlights.push(v) }
    if (specs.Train) { const v = translateValue(specs.Train); if (v) highlights.push(v) }
    else if (specs['Dress length']) { const v = translateValue(specs['Dress length']); if (v) highlights.push(v) }
    if (specs.Sleeves && specs.Sleeves !== 'No sleeves') { const v = translateValue(specs.Sleeves); if (v) highlights.push(v) }
    if (highlights.length === 0) highlights.push(line || 'WONÁ 婚纱')

    // tagline：系列 · 风格
    const style = translateValue(specs.Style || '')
    const tagline = [line, style].filter(Boolean).join(' · ') || 'WONÁ Concept'

    // 描述清洗：截断尾部弹窗文案
    let descEn = p.desc.replace(/\s*(WHERE TO BUY|GET FREE BRIDE GUIDE|TALK TO A STYLIST)[\s\S]*$/i, '').trim()
    const descCn = descEn ? await gtxTranslate(descEn) : ''
    const nameCn = await gtxTranslate(p.name)

    if (n % 25 === 0) { console.log(`  翻译进度 ${n}/${products.length}`); saveCache() }

    out.push({
      slug: `wona-${p.slug}`,
      name: nameCn === p.name ? p.name : `${nameCn} ${p.name}`,
      nameEn: p.name,
      category,
      categoryCn: (group ? group.label : line),
      tagline,
      desc: descCn,
      highlights: highlights.slice(0, 6),
      cover: p.images[0],
      images: p.images.slice(0, 8),
      video: p.video || undefined,
      source: { name: 'WONÁ Concept（测试数据）', url: p.url },
    })
    await wait(80)
  }
  saveCache()

  // ===== 输出 TS =====
  const lines = [
    '// WONÁ Concept 礼服商品数据 —— 来源：wonaconcept.com/wedding-dresses 批量爬取（测试数据）',
    '// 爬取脚本：Verra-Voile-End/scripts/crawl-wona-dresses.cjs + crawl-wona-details.cjs',
    '// 生成脚本：Verra-Voile-End/scripts/gen-wona-dress-data.cjs（勿手动编辑）',
    "import type { DressProduct } from './wonaDresses'",
    '',
    'export const wonaProducts: DressProduct[] = [',
  ]
  for (const p of out) {
    lines.push('  {')
    lines.push(`    slug: '${esc(p.slug)}',`)
    lines.push(`    name: '${esc(p.name)}',`)
    lines.push(`    nameEn: '${esc(p.nameEn)}',`)
    lines.push(`    category: '${p.category}',`)
    lines.push(`    categoryCn: '${esc(p.categoryCn)}',`)
    lines.push(`    tagline: '${esc(p.tagline)}',`)
    lines.push(`    desc: '${esc(p.desc)}',`)
    lines.push(`    highlights: [${p.highlights.map(h => `'${esc(h)}'`).join(', ')}],`)
    lines.push(`    cover: '${p.cover}',`)
    lines.push(`    images: [${p.images.map(i => `'${i}'`).join(', ')}],`)
    if (p.video) lines.push(`    video: '${p.video}',`)
    lines.push(`    source: { name: '${esc(p.source.name)}', url: '${p.source.url}' },`)
    lines.push('  },')
  }
  lines.push(']')
  lines.push('')
  fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8')
  console.log(`✅ 已生成 ${out.length} 个商品 → ${OUT_FILE}`)
}

main().catch(err => { saveCache(); console.error('❌ 生成失败:', err.message); process.exit(1) })
