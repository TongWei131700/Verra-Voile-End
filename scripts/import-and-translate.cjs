/**
 * 导入服务器爬取数据到本地数据库（增量，不覆盖）
 * 然后翻译所有英文数据为中文
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const MYSQL_BIN = '/usr/local/mysql-8.4.5-macos15-arm64/bin/mysql'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verra_voile',
  waitForConnections: true,
  connectionLimit: 5,
})

// 使用免费翻译 API
async function translateText(text, from = 'en', to = 'zh') {
  if (!text || text.trim().length === 0) return text
  // 如果已经是中文为主，跳过
  if (/[\u4e00-\u9fff]/.test(text) && text.match(/[\u4e00-\u9fff]/g).length > text.length * 0.3) return text
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text.substring(0, 5000))}`
    const res = await fetch(url)
    const data = await res.json()
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('')
    }
  } catch (e) {
    // 静默失败
  }
  return text
}

// 翻译 JSON 数组中的字符串
async function translateJsonArray(jsonStr, fields = ['name']) {
  if (!jsonStr) return jsonStr
  try {
    const arr = JSON.parse(jsonStr)
    if (!Array.isArray(arr)) return jsonStr
    
    for (const item of arr) {
      for (const field of fields) {
        if (item[field] && typeof item[field] === 'string') {
          item[field + '_cn'] = await translateText(item[field])
        }
      }
    }
    return JSON.stringify(arr)
  } catch (e) {
    return jsonStr
  }
}

async function main() {
  console.log('========================================')
  console.log('导入服务器数据 & 翻译为中文')
  console.log('========================================')

  // 1. 读取导出的 JSON
  const dataPath = '/tmp/crawled_export.json'
  if (!fs.existsSync(dataPath)) {
    console.error('找不到导出文件:', dataPath)
    process.exit(1)
  }
  
  const records = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  console.log(`读取到 ${records.length} 条记录`)

  // 2. 增量导入（INSERT IGNORE）
  let inserted = 0, skipped = 0
  
  for (const r of records) {
    try {
      await pool.execute(
        `INSERT IGNORE INTO crawled_destinations 
         (slug, name, name_cn, country, country_cn, source_url, tagline, description, 
          features, venue_types, towns, images, budget_ranges, guest_capacities, faq, 
          cover_image, cover_image_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.slug, r.name, r.name_cn || r.name, r.country, r.country_cn, r.source_url,
         r.tagline || '', r.description || '', r.features || '[]', r.venue_types || '[]',
         r.towns || '[]', r.images || '[]', r.budget_ranges || '[]', r.guest_capacities || '[]',
         r.faq || null, r.cover_image || '', r.cover_image_url || r.cover_image || '', r.sort_order || 0]
      )
      inserted++
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        skipped++
      } else {
        console.log(`  导入失败 (${r.slug}): ${e.message.substring(0, 60)}`)
      }
    }
  }
  
  console.log(`\n导入完成: 新增 ${inserted} 条, 跳过(已存在) ${skipped} 条`)

  // 3. 翻译为中文
  console.log('\n--- 开始翻译为中文 ---')
  
  // 获取所有需要翻译的记录（name_cn 和 name 相同的 = 未翻译）
  const [needTranslate] = await pool.execute(
    "SELECT id, name, name_cn, tagline, description, features, venue_types, towns, guest_capacities, budget_ranges FROM crawled_destinations WHERE name_cn = name OR name_cn = '' OR name_cn IS NULL"
  )
  
  console.log(`需要翻译: ${needTranslate.length} 条记录`)
  
  let translated = 0
  for (const row of needTranslate) {
    try {
      // 翻译名称
      const nameCn = await translateText(row.name)
      
      // 翻译 tagline
      const taglineCn = row.tagline ? await translateText(row.tagline) : ''
      
      // 翻译 description（可能很长，分段翻译）
      let descCn = row.description || ''
      if (descCn.length > 100) {
        // 按句号分段翻译
        const sentences = descCn.match(/[^.!?]+[.!?]*/g) || [descCn]
        const chunks = []
        let current = ''
        for (const s of sentences) {
          if (current.length + s.length > 4000) {
            chunks.push(current)
            current = s
          } else {
            current += s
          }
        }
        if (current) chunks.push(current)
        
        const translatedChunks = []
        for (const chunk of chunks) {
          translatedChunks.push(await translateText(chunk))
          await new Promise(r => setTimeout(r, 200)) // 避免请求太快
        }
        descCn = translatedChunks.join('')
      } else if (descCn) {
        descCn = await translateText(descCn)
      }
      
      // 翻译 features
      const featuresCn = await translateJsonArray(row.features, ['name'])
      // features 是纯字符串数组，需要特殊处理
      let featuresFinal = row.features
      try {
        const fArr = JSON.parse(row.features)
        if (Array.isArray(fArr) && fArr.length > 0 && typeof fArr[0] === 'string') {
          const translatedFeatures = []
          for (const f of fArr.slice(0, 8)) {
            translatedFeatures.push(await translateText(f))
            await new Promise(r => setTimeout(r, 150))
          }
          featuresFinal = JSON.stringify(translatedFeatures)
        }
      } catch(e) {}
      
      // 翻译 venue_types
      let venueTypesCn = row.venue_types
      try {
        const vtArr = JSON.parse(row.venue_types)
        if (Array.isArray(vtArr)) {
          for (const vt of vtArr) {
            if (vt.name) vt.name_cn = await translateText(vt.name)
          }
          venueTypesCn = JSON.stringify(vtArr)
        }
      } catch(e) {}
      
      // 翻译 towns
      let townsCn = row.towns
      try {
        const tArr = JSON.parse(row.towns)
        if (Array.isArray(tArr)) {
          for (const t of tArr) {
            if (t.name) t.name_cn = await translateText(t.name)
          }
          townsCn = JSON.stringify(tArr)
        }
      } catch(e) {}
      
      // 翻译 guest_capacities
      let guestCn = row.guest_capacities
      try {
        const gArr = JSON.parse(row.guest_capacities)
        if (Array.isArray(gArr) && gArr.length > 0 && typeof gArr[0] === 'string') {
          const tg = []
          for (const g of gArr) {
            if (/please inquire/i.test(g)) {
              tg.push('请咨询')
            } else {
              tg.push(await translateText(g))
            }
            await new Promise(r => setTimeout(r, 100))
          }
          guestCn = JSON.stringify(tg)
        }
      } catch(e) {}
      
      // 翻译 budget_ranges
      let budgetCn = row.budget_ranges
      try {
        const bArr = JSON.parse(row.budget_ranges)
        if (Array.isArray(bArr)) {
          for (const b of bArr) {
            if (b.label) b.label_cn = await translateText(b.label)
          }
          budgetCn = JSON.stringify(bArr)
        }
      } catch(e) {}
      
      // 更新数据库
      await pool.execute(
        `UPDATE crawled_destinations SET name_cn=?, tagline=?, description=?, features=?, venue_types=?, towns=?, guest_capacities=?, budget_ranges=? WHERE id=?`,
        [nameCn, taglineCn, descCn, featuresFinal, venueTypesCn, townsCn, guestCn, budgetCn, row.id]
      )
      
      translated++
      if (translated % 10 === 0) {
        console.log(`  已翻译 ${translated}/${needTranslate.length}: ${row.name.substring(0, 30)} → ${nameCn.substring(0, 30)}`)
      }
      
      // 翻译间隔，避免 API 限流
      await new Promise(r => setTimeout(r, 300))
      
    } catch (err) {
      console.log(`  翻译失败 (${row.name}): ${err.message.substring(0, 60)}`)
    }
  }
  
  console.log(`\n翻译完成: ${translated} 条记录`)
  
  // 4. 最终统计
  console.log('\n--- 最终数据统计 ---')
  const [stats] = await pool.execute('SELECT country, country_cn, COUNT(*) as cnt FROM crawled_destinations GROUP BY country, country_cn ORDER BY cnt DESC')
  stats.forEach(s => console.log(`  ${s.country_cn} (${s.country}): ${s.cnt} 条`))
  
  const [total] = await pool.execute('SELECT COUNT(*) as cnt FROM crawled_destinations')
  console.log(`  总计: ${total[0].cnt} 条`)
  
  await pool.end()
  console.log('\n完成！')
}

main().catch(err => { console.error('致命错误:', err); process.exit(1) })
