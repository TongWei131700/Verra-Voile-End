/**
 * 导入翻译结果到数据库
 * 读取已翻译的 JSON 文件，根据 slug 标识更新 cv_ 和 cd_ 表
 * 
 * 用法: node scripts/import-translated.cjs --country=italy
 *       node scripts/import-translated.cjs --country=spain
 * 
 * 输入: scripts/translate-pending-{country}.json (需已翻译)
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
  const cdTable = `cd_${suffix}`

  // 读取翻译文件
  const inFile = path.join(__dirname, `translate-pending-${country}.json`)
  if (!fs.existsSync(inFile)) {
    console.error(`文件不存在: ${inFile}`)
    process.exit(1)
  }

  const translatedData = JSON.parse(fs.readFileSync(inFile, 'utf-8'))
  const slugs = Object.keys(translatedData)
  console.log(`共 ${slugs.length} 条翻译数据待导入 (cv_${suffix})`)

  let updated = 0, skipped = 0

  for (const slug of slugs) {
    const item = translatedData[slug]

    // 检查是否有翻译内容（至少 name_cn 或 tagline_cn 非空）
    const nameCn = item.name_cn || ''
    const taglineCn = item.tagline_cn || ''
    const descCn = item.description_cn || ''

    if (!nameCn && !taglineCn) {
      skipped++
      continue
    }

    // 构建 features 中文数组
    const featuresCn = item.features_cn || []
    // 构建 venue_types 带中文
    const venueTypesCn = item.venue_types_cn || []
    // 构建 towns 带中文
    const townsCn = item.towns_cn || []
    // 构建 FAQ 中文
    const faqCn = item.faq_cn || []

    // 更新 cv_ 表
    await pool.execute(
      `UPDATE \`${cvTable}\` SET 
        name_cn = COALESCE(?, name_cn),
        tagline_cn = COALESCE(?, tagline_cn),
        description_cn = COALESCE(?, description_cn),
        features = ?,
        venue_types = ?,
        towns = ?,
        faq = ?
       WHERE slug = ?`,
      [
        nameCn || null,
        taglineCn || null,
        descCn || null,
        JSON.stringify(featuresCn),
        JSON.stringify(venueTypesCn),
        JSON.stringify(townsCn),
        JSON.stringify(faqCn),
        slug
      ]
    )

    // 更新 cd_ 表
    await pool.execute(
      `UPDATE \`${cdTable}\` SET 
        name_cn = COALESCE(?, name_cn),
        tagline_cn = COALESCE(?, tagline_cn),
        description_cn = COALESCE(?, description_cn),
        features = ?,
        venue_types = ?,
        towns = ?,
        faq = ?
       WHERE slug = ?`,
      [
        nameCn || null,
        taglineCn || null,
        descCn || null,
        JSON.stringify(featuresCn),
        JSON.stringify(venueTypesCn),
        JSON.stringify(townsCn),
        JSON.stringify(faqCn),
        slug
      ]
    )

    // 更新 products 表
    const prodSlug = slug.slice(0, 50).replace(/-$/, '')
    const prodDesc = descCn ? descCn.slice(0, 200) : `测试${country === 'italy' ? '意大利' : country === 'spain' ? '西班牙' : country}婚礼场地 - ${nameCn}`
    await pool.execute(
      `UPDATE products SET name = ?, description = ? WHERE product_id = ?`,
      [nameCn, prodDesc, prodSlug]
    )

    updated++
    if (updated % 20 === 0) {
      console.log(`--- 进度: ${updated}/${slugs.length} ---`)
    }
  }

  await pool.end()
  console.log(`\n✅ 导入完成！更新: ${updated}, 跳过: ${skipped}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
