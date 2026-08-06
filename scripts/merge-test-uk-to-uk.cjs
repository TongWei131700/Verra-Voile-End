/**
 * 将"测试英国"数据合并到"英国"
 * 数据源：crawled_venues 表中 country_cn='测试英国' 的记录
 * 目标：cv_uk 表（添加/更新，不覆盖已有）
 * 
 * 同时检查 crawled_destinations 中是否有英国相关数据 → cd_uk
 * 
 * 操作：
 * 1. 从 crawled_venues 读取"测试英国"数据
 * 2. 清理 slug（去掉 test- 前缀）
 * 3. 更新 country_cn → "英国"，country → "United Kingdom"
 * 4. 写入 cv_uk：不存在则插入，已存在则更新空字段
 * 5. crawled_destinations 中如有英国数据同理写入 cd_uk
 */
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'verra_voile',
  })

  try {
    // ===== 1. 摸底：查看当前数据情况 =====
    console.log('===== 摸底当前数据 =====\n')

    // crawled_venues 中测试英国
    let crawledVenues = []
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM crawled_venues WHERE country_cn = '测试英国' ORDER BY sort_order"
      )
      crawledVenues = rows
      console.log(`crawled_venues 中"测试英国": ${rows.length} 条`)
      rows.forEach(r => console.log(`  - ${r.slug} | ${r.name} | ${r.country_cn}`))
    } catch (e) {
      console.log('crawled_venues 表不存在或查询失败:', e.message)
    }

    // crawled_destinations 中英国相关
    let crawledDests = []
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM crawled_destinations WHERE country_cn LIKE '%英国%' OR country LIKE '%Kingdom%' OR country LIKE '%UK%' ORDER BY sort_order"
      )
      crawledDests = rows
      console.log(`\ncrawled_destinations 中英国相关: ${rows.length} 条`)
      rows.forEach(r => console.log(`  - ${r.slug} | ${r.name_cn || r.name} | ${r.country_cn}`))
    } catch (e) {
      console.log('crawled_destinations 查询失败:', e.message)
    }

    // 检查 cv_uk 现有数据
    let cvUKExisting = []
    try {
      const [rows] = await pool.execute("SELECT slug, name FROM cv_uk ORDER BY sort_order")
      cvUKExisting = rows
      console.log(`\ncv_uk 已有数据: ${rows.length} 条`)
      rows.forEach(r => console.log(`  - ${r.slug} | ${r.name}`))
    } catch (e) {
      console.log('\ncv_uk 表不存在')
    }

    // 检查 cd_uk 现有数据
    let cdUKExisting = []
    try {
      const [rows] = await pool.execute("SELECT slug, name FROM cd_uk ORDER BY sort_order")
      cdUKExisting = rows
      console.log(`\ncd_uk 已有数据: ${rows.length} 条`)
      rows.forEach(r => console.log(`  - ${r.slug} | ${r.name}`))
    } catch (e) {
      console.log('cd_uk 表不存在')
    }

    if (crawledVenues.length === 0 && crawledDests.length === 0) {
      console.log('\n没有需要合并的数据，退出。')
      return
    }

    // ===== 2. 确保 cv_uk 表存在 =====
    console.log('\n===== 开始合并 =====\n')

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`cv_uk\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        name_cn VARCHAR(200) DEFAULT '',
        country VARCHAR(100) DEFAULT '',
        country_cn VARCHAR(100) DEFAULT '',
        source_url VARCHAR(500) DEFAULT '',
        tagline VARCHAR(500) DEFAULT '',
        tagline_cn VARCHAR(500) DEFAULT '',
        description TEXT,
        description_cn TEXT,
        features JSON,
        venue_types JSON,
        towns JSON,
        images JSON,
        budget_ranges JSON,
        guest_capacities JSON,
        faq JSON,
        cover_image VARCHAR(500) DEFAULT '',
        rating VARCHAR(20) DEFAULT '',
        review_count VARCHAR(20) DEFAULT '0',
        location VARCHAR(300) DEFAULT '',
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    console.log('✓ cv_uk 表已就绪')

    // ===== 3. 合并 crawled_venues(测试英国) → cv_uk =====
    if (crawledVenues.length > 0) {
      console.log(`\n--- crawled_venues(测试英国) → cv_uk ---`)
      let added = 0, updated = 0

      for (const row of crawledVenues) {
        // 清理 slug：去掉 test-uk- 或 test- 前缀
        let cleanSlug = row.slug.replace(/^test-uk-/, '').replace(/^test-/, '')

        const [existing] = await pool.execute("SELECT id FROM cv_uk WHERE slug = ?", [cleanSlug])

        if (existing.length > 0) {
          // 已存在 → 更新空字段（不覆盖已有内容）
          const updates = { country: 'United Kingdom', country_cn: '英国' }
          // 如果目标表该字段为空而源数据有值，也更新
          const [target] = await pool.execute("SELECT name_cn, description_cn, tagline_cn FROM cv_uk WHERE slug = ?", [cleanSlug])
          const t = target[0]
          if (!t.name_cn && row.name_cn) updates.name_cn = row.name_cn
          if (!t.description_cn && row.description_cn) updates.description_cn = row.description_cn
          if (!t.tagline_cn && row.tagline_cn) updates.tagline_cn = row.tagline_cn

          const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ')
          const values = Object.values(updates)
          await pool.execute(`UPDATE cv_uk SET ${setClauses} WHERE slug = ?`, [...values, cleanSlug])
          updated++
          console.log(`  ↻ 更新: ${cleanSlug}`)
        } else {
          // 不存在 → 插入
          await pool.execute(
            `INSERT INTO cv_uk 
             (slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn,
              description, description_cn, features, venue_types, towns, images,
              budget_ranges, guest_capacities, faq, cover_image, rating, review_count,
              location, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              cleanSlug, row.name, row.name_cn || '',
              'United Kingdom', '英国',
              row.source_url || '', row.tagline || '', row.tagline_cn || '',
              row.description || '', row.description_cn || '',
              row.features || '[]', row.venue_types || '[]',
              row.towns || '[]', row.images || '[]',
              row.budget_ranges || '[]', row.guest_capacities || '[]',
              row.faq || '[]', row.cover_image || '',
              row.rating || '', row.review_count || '0',
              row.location || '', row.sort_order || 0
            ]
          )
          added++
          console.log(`  + 新增: ${cleanSlug} (${row.name})`)
        }
      }
      console.log(`\n结果: 新增 ${added} 条，更新 ${updated} 条`)
    }

    // ===== 4. 确保 cd_uk 表存在并合并 crawled_destinations =====
    if (crawledDests.length > 0) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS \`cd_uk\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          slug VARCHAR(100) NOT NULL,
          name VARCHAR(200) NOT NULL,
          name_cn VARCHAR(200) DEFAULT '',
          country VARCHAR(100) DEFAULT '',
          country_cn VARCHAR(100) DEFAULT '',
          source_url VARCHAR(500) DEFAULT '',
          tagline VARCHAR(500) DEFAULT '',
          tagline_cn VARCHAR(500) DEFAULT '',
          description TEXT,
          description_cn TEXT,
          features JSON,
          venue_types JSON,
          towns JSON,
          images JSON,
          budget_ranges JSON,
          guest_capacities JSON,
          faq JSON,
          cover_image VARCHAR(500) DEFAULT '',
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('\n✓ cd_uk 表已就绪')

      console.log(`\n--- crawled_destinations(英国) → cd_uk ---`)
      let added = 0, updated = 0

      for (const row of crawledDests) {
        let cleanSlug = row.slug.replace(/^test-uk-/, '').replace(/^test-/, '')
        const [existing] = await pool.execute("SELECT id FROM cd_uk WHERE slug = ?", [cleanSlug])

        if (existing.length > 0) {
          const updates = { country: 'United Kingdom', country_cn: '英国' }
          const [target] = await pool.execute("SELECT name_cn, description_cn, tagline_cn FROM cd_uk WHERE slug = ?", [cleanSlug])
          const t = target[0]
          if (!t.name_cn && row.name_cn) updates.name_cn = row.name_cn
          if (!t.description_cn && row.description_cn) updates.description_cn = row.description_cn
          if (!t.tagline_cn && row.tagline_cn) updates.tagline_cn = row.tagline_cn

          const setClauses = Object.keys(updates).map(k => `\`${k}\` = ?`).join(', ')
          const values = Object.values(updates)
          await pool.execute(`UPDATE cd_uk SET ${setClauses} WHERE slug = ?`, [...values, cleanSlug])
          updated++
          console.log(`  ↻ 更新: ${cleanSlug}`)
        } else {
          await pool.execute(
            `INSERT INTO cd_uk 
             (slug, name, name_cn, country, country_cn, source_url, tagline, tagline_cn,
              description, description_cn, features, venue_types, towns, images,
              budget_ranges, guest_capacities, faq, cover_image, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              cleanSlug, row.name, row.name_cn || '',
              'United Kingdom', '英国',
              row.source_url || '', row.tagline || '', row.tagline_cn || '',
              row.description || '', row.description_cn || '',
              row.features || '[]', row.venue_types || '[]',
              row.towns || '[]', row.images || '[]',
              row.budget_ranges || '[]', row.guest_capacities || '[]',
              row.faq || '[]', row.cover_image || '',
              row.sort_order || 0
            ]
          )
          added++
          console.log(`  + 新增: ${cleanSlug} (${row.name_cn || row.name})`)
        }
      }
      console.log(`\n结果: 新增 ${added} 条，更新 ${updated} 条`)
    }

    // ===== 5. 修正 cv_uk 中可能残留的测试标识 =====
    const [fix1] = await pool.execute(
      "UPDATE cv_uk SET country = 'United Kingdom', country_cn = '英国' WHERE country_cn = '测试英国' OR country = 'Test United Kingdom'"
    )
    if (fix1.affectedRows > 0) console.log(`\n修正 cv_uk 残留测试标识: ${fix1.affectedRows} 条`)

    const [fix2] = await pool.execute(
      "UPDATE cd_uk SET country = 'United Kingdom', country_cn = '英国' WHERE country_cn = '测试英国' OR country = 'Test United Kingdom'"
    )
    if (fix2.affectedRows > 0) console.log(`修正 cd_uk 残留测试标识: ${fix2.affectedRows} 条`)

    // ===== 6. 最终统计 =====
    const [finalCv] = await pool.execute("SELECT COUNT(*) as cnt FROM cv_uk")
    console.log(`\n===== 合并完成 =====`)
    console.log(`cv_uk 最终: ${finalCv[0].cnt} 条`)
    try {
      const [finalCd] = await pool.execute("SELECT COUNT(*) as cnt FROM cd_uk")
      console.log(`cd_uk 最终: ${finalCd[0].cnt} 条`)
    } catch (e) { /* cd_uk 可能没创建 */ }

    // 展示最终 cv_uk 数据
    const [finalRows] = await pool.execute("SELECT slug, name, name_cn, country, country_cn FROM cv_uk ORDER BY sort_order")
    console.log('\ncv_uk 最终数据:')
    finalRows.forEach(r => console.log(`  ${r.slug} | ${r.name} | ${r.name_cn} | ${r.country} | ${r.country_cn}`))

  } catch (err) {
    console.error('合并失败:', err.message)
    console.error(err)
  } finally {
    await pool.end()
  }
}

main()
