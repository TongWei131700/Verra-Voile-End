/**
 * 从已翻译的中文描述中提取特色（features）
 * 
 * 用法: node scripts/extract-features.cjs
 */

const mysql = require('mysql2/promise')
const nodemailer = require('nodemailer')

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 13306,
  user: 'root',
  password: 'caoqiangiot@123',
  database: 'verra_voile',
  waitForConnections: true,
  connectionLimit: 3,
}

const SMTP_CONFIG = {
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: { user: 'TW15536500878@163.com', pass: 'DZVj2VwzTE8Amuh2' }
}

async function sendEmail(subject, html) {
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG)
    const info = await transporter.sendMail({
      from: `"薇雅通知" <TW15536500878@163.com>`,
      to: 'TW15536500878@163.com',
      subject,
      html
    })
    console.log(`✓ 邮件已发送`)
    return true
  } catch (err) {
    console.error('✗ 邮件发送失败:', err.message)
    return false
  }
}

// 从中文描述中提取特色句子
function extractFeatures(description, maxFeatures = 6) {
  if (!description) return []
  
  // 按句号、感叹号、问号、换行分割
  const sentences = description.split(/[。！？\n]+/).map(s => s.trim()).filter(s => s.length > 5)
  
  // 过滤掉太短或太长的句子，以及标题性质的句子
  const meaningful = sentences.filter(s => {
    if (s.length < 6 || s.length > 150) return false
    // 过滤掉标题性文字
    if (/^(空间|它提供|其中|此外|另外|主要|设施|服务|关于|在|这里|该|这个|那个|我们|他们)/.test(s)) return false
    return true
  })
  
  // 去重（相似度高的只保留一个）
  const unique = []
  const seen = new Set()
  for (const s of meaningful) {
    const key = s.slice(0, 12)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(s)
    }
    if (unique.length >= maxFeatures) break
  }
  
  return unique.slice(0, maxFeatures)
}

async function main() {
  console.log('🔄 开始从中文描述提取特色...')
  
  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')
  
  const [venues] = await pool.execute(
    'SELECT id, slug, name, description, features FROM crawled_destinations WHERE country = ? ORDER BY sort_order',
    ['Portugal']
  )
  console.log(`✓ 找到 ${venues.length} 个场地`)
  
  let updatedCount = 0
  
  for (const v of venues) {
    // 检查 features 是否包含英文（需要更新）
    // mysql2 可能已自动解析 JSON 为数组
    let featuresArr = v.features
    if (typeof v.features === 'string') {
      try { featuresArr = JSON.parse(v.features) } catch { featuresArr = [] }
    }
    
    const needsUpdate = Array.isArray(featuresArr) && featuresArr.length > 0 && /[a-zA-Z]{5,}/.test(featuresArr[0] || '')
    
    if (!needsUpdate) {
      console.log(`   ${v.name} - 已是中文`)
      continue
    }
    
    // 从描述中提取特色
    const features = extractFeatures(v.description)
    
    if (features.length > 0) {
      await pool.execute(
        'UPDATE crawled_destinations SET features = ? WHERE id = ?',
        [JSON.stringify(features), v.id]
      )
      console.log(`  ✓ ${v.name} - ${features.length}个特色`)
      updatedCount++
    } else {
      console.log(`  ⚠ ${v.name} - 未能提取特色`)
    }
  }
  
  await pool.end()
  console.log(`\n✅ 完成！更新了 ${updatedCount} 个场地的特色`)
  
  await sendEmail(
    `✅ 葡萄牙场地特色提取完成 - 更新${updatedCount}个`,
    `<h2>特色提取完成</h2>
     <p><b>目标:</b> 从中文描述提取特色</p>
     <p><b>更新数量:</b> ${updatedCount} 个场地</p>
     <p><b>时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p style="margin-top:20px;color:#666">请前往 <a href="https://www.europewedding.cn/crawled-portugal">https://www.europewedding.cn/crawled-portugal</a> 查看结果。</p>`
  )
}

main().catch(async err => {
  console.error('❌ 执行失败:', err.message)
  await sendEmail('❌ 特色提取失败', `<p>错误: ${err.message}</p>`)
  process.exit(1)
})
