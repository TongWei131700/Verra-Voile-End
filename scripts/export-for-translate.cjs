/**
 * 导出待翻译文本到 JSON 文件
 * 从 cv_{suffix} 表读取英文数据，按 slug 标识输出
 * 
 * 用法: node scripts/export-for-translate.cjs --country=italy
 *       node scripts/export-for-translate.cjs --country=spain
 * 
 * 输出: scripts/translate-pending-{country}.json
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

async function main() {
  const args = process.argv.slice(2)
  const countryArg = args.find(a => a.startsWith('--country='))
  const country = countryArg ? countryArg.split('=')[1] : 'italy'
  const suffix = `test_${country}`

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile'
  })

  const cvTable = `cv_${suffix}`

  // 读取所有场地数据
  const [venues] = await pool.execute(
    `SELECT slug, name, tagline, description, features, venue_types, towns, faq, location 
     FROM \`${cvTable}\` 
     ORDER BY slug`
  )

  console.log(`共 ${venues.length} 条数据待翻译 (cv_${suffix})`)

  // 构建导出结构
  const exportData = {}

  for (const v of venues) {
    const features = Array.isArray(v.features) ? v.features : JSON.parse(v.features || '[]')
    const venueTypes = Array.isArray(v.venue_types) ? v.venue_types : JSON.parse(v.venue_types || '[]')
    const towns = Array.isArray(v.towns) ? v.towns : JSON.parse(v.towns || '[]')
    const faq = Array.isArray(v.faq) ? v.faq : JSON.parse(v.faq || '[]')

    // 导出所有需要翻译的字段
    const item = {
      name: v.name,
    }

    if (v.tagline && v.tagline.trim()) {
      item.tagline = v.tagline
    }

    if (v.description && v.description.trim()) {
      item.description = v.description
    }

    // features: 导出英文内容
    if (features.length > 0) {
      item.features = features.filter(f => typeof f === 'string' && /[a-zA-Z]/.test(f))
    }

    // venue_types: 提取英文类型名
    if (venueTypes.length > 0) {
      item.venue_types = venueTypes.map(t => t.name).filter(Boolean)
    }

    // towns: 提取英文城镇名
    if (towns.length > 0) {
      item.towns = towns.map(t => t.name).filter(Boolean)
    }

    // FAQ: 导出问答对
    if (faq.length > 0) {
      item.faq = faq.map(f => ({ q: f.q || '', a: f.a || '' }))
    }

    // location: 导出地址
    if (v.location && v.location.trim()) {
      item.location = v.location
    }

    exportData[v.slug] = item
  }

  // 写入文件
  const outFile = path.join(__dirname, `translate-pending-${country}.json`)
  fs.writeFileSync(outFile, JSON.stringify(exportData, null, 2), 'utf-8')

  // 统计
  let taglineCount = 0, descCount = 0, featureCount = 0, faqCount = 0, locationCount = 0
  for (const v of Object.values(exportData)) {
    if (v.tagline) taglineCount++
    if (v.description) descCount++
    if (v.features) featureCount += v.features.length
    if (v.faq) faqCount += v.faq.length
    if (v.location) locationCount++
  }

  console.log(`\n导出完成: ${outFile}`)
  console.log(`  tagline: ${taglineCount} 条`)
  console.log(`  description: ${descCount} 条`)
  console.log(`  features: ${featureCount} 条`)
  console.log(`  faq: ${faqCount} 条`)
  console.log(`  location: ${locationCount} 条`)
  console.log(`  venue_types: ${Object.values(exportData).filter(v => v.venue_types).length} 条`)
  console.log(`  towns: ${Object.values(exportData).filter(v => v.towns).length} 条`)
  console.log(`\n文件大小: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`)
  console.log(`\n下一步: 翻译该文件后运行 import-translated.cjs 导入`)

  await pool.end()
}

main().catch(e => { console.error(e.message); process.exit(1) })
