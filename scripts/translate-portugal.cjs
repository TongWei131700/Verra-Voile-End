/**
 * 葡萄牙场地数据中文化翻译脚本
 * 
 * 将所有葡萄牙场地的英文内容翻译为中文
 * 翻译字段：name_cn, tagline, description, features, venue_types, towns
 * 
 * 用法: node scripts/translate-portugal.cjs
 */

const mysql = require('mysql2/promise')
const https = require('https')
const http = require('http')

// ===== 配置 =====
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
const NOTIFY_TO = 'TW15536500878@163.com'

// ===== MyMemory 翻译 API（免费，国内可用）=====
function translateText(text, targetLang = 'zh-CN') {
  return new Promise((resolve, reject) => {
    if (!text || text.trim() === '') return resolve('')
    
    const encoded = encodeURIComponent(text.slice(0, 500)) // MyMemory 限制 500 字符
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${targetLang}&de=TW15536500878@163.com`
    
    const req = https.get(url, { timeout: 15000 }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.responseStatus === 200 && json.responseData && json.responseData.translatedText) {
            resolve(json.responseData.translatedText)
          } else {
            resolve(text) // 翻译失败返回原文
          }
        } catch (e) {
          resolve(text)
        }
      })
    })
    req.on('error', () => resolve(text))
    req.on('timeout', () => { req.destroy(); resolve(text) })
  })
}

// 批量翻译（逐条翻译，MyMemory 不支持批量）
async function translateBatch(texts, targetLang = 'zh-CN') {
  if (!texts || texts.length === 0) return []
  const results = []
  for (const text of texts) {
    const translated = await translateText(text, targetLang)
    results.push(translated)
    await wait(200) // 避免频率限制
  }
  return results
}

// 延迟
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 邮件发送
async function sendEmail(subject, html) {
  try {
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport(SMTP_CONFIG)
    const info = await transporter.sendMail({
      from: `"薇雅翻译通知" <TW15536500878@163.com>`,
      to: NOTIFY_TO,
      subject,
      html
    })
    console.log(`✓ 邮件已发送: ${info.messageId}`)
    return true
  } catch (err) {
    console.error('✗ 邮件发送失败:', err.message)
    return false
  }
}

// ===== 葡萄牙地名翻译字典 =====
const PLACE_NAMES = {
  'Vila Franca do Rosário': '维拉弗兰卡-杜罗萨里奥',
  'Mafra': '马夫拉',
  'Albergaria-a-Velha': '阿尔贝加里亚-阿韦利亚',
  'Alquerubim': '阿尔凯鲁宾',
  'Guimarães': '吉马良斯',
  'Braga': '布拉加',
  'Palmela': '帕尔梅拉',
  'Fernando Pó': '费尔南多波',
  'Penafiel': '佩纳菲耶尔',
  'Croca': '克罗卡',
  'Lisboa': '里斯本',
  'Porto': '波尔图',
  'Faro': '法鲁',
  'Évora': '埃武拉',
  'Coimbra': '科英布拉',
  'Sintra': '辛特拉',
  'Cascais': '卡斯卡伊斯',
  'Óbidos': '奥比都斯',
  'Lagos': '拉各斯',
  'Tavira': '塔维拉',
  'Albufeira': '阿尔布费拉',
  'Portimão': '波尔蒂芒',
  'Sagres': '萨格雷斯',
  'Setúbal': '塞图巴尔',
  'Comporta': '孔波尔塔',
  'Alentejo': '阿连特茹',
  'Algarve': '阿尔加维',
  'Douro': '杜罗',
  'Minho': '米尼奥',
  'Madeira': '马德拉',
  'Azores': '亚速尔',
  'Vila Nova de Gaia': '加亚新城',
  'Oliveira': '奥利韦拉',
  'Estoril': '埃斯托利尔',
  'Belas': '贝拉斯',
  'Tancos': '坦库什',
  'Anunciada': '阿努西亚达',
  'Ludovice': '卢多维什',
  'Espinho': '埃斯皮尼奥',
}

function translatePlaceName(name) {
  if (PLACE_NAMES[name]) return PLACE_NAMES[name]
  // 尝试部分匹配
  for (const [en, cn] of Object.entries(PLACE_NAMES)) {
    if (name.toLowerCase().includes(en.toLowerCase())) return cn
  }
  return name
}

// ===== 场地类型翻译字典 =====
const VENUE_TYPE_MAP = {
  'Mansion': '庄园',
  'Garden': '花园',
  'Hotel': '酒店',
  'Restaurant': '餐厅',
  'Beach': '海滩',
  'Barn': '谷仓',
  'Banquet Hall': '宴会厅',
  'Country House': '乡村别墅',
  'Farm': '农场',
  'Resort': '度假村',
  'Villa': '别墅',
  'Castle': '城堡',
  'Church': '教堂',
  'Vineyard': '葡萄园',
  'Lakeside': '湖畔',
  'Terrace': '露台',
  'Wedding Venue': '婚礼场地',
  'Wedding Planner': '婚礼策划',
  'Photographer': '摄影师',
  'Event Planner': '活动策划',
  'Golf Resort': '高尔夫度假村',
  'Rural Tourism': '乡村旅游',
  'Design Centre': '设计中心',
  'Rooftop Bar': '屋顶酒吧',
}

function translateVenueType(nameEn) {
  return VENUE_TYPE_MAP[nameEn] || nameEn
}

// ===== 主函数 =====
async function main() {
  const startTime = Date.now()
  console.log('🔄 开始翻译葡萄牙场地数据...')

  await sendEmail(
    ' 葡萄牙场地翻译任务开始',
    `<h2>翻译任务已启动</h2>
     <p><b>目标:</b> 葡萄牙 78 个场地数据中文化</p>
     <p><b>开始时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p>翻译完成后将通知您结果。</p>`
  )

  const pool = await mysql.createPool(DB_CONFIG)
  console.log('✓ 数据库已连接')

  // 获取所有葡萄牙场地
  const [venues] = await pool.execute(
    'SELECT id, slug, name, name_cn, tagline, description, features, venue_types, towns FROM crawled_destinations WHERE country = ? ORDER BY sort_order',
    ['Portugal']
  )
  console.log(`✓ 找到 ${venues.length} 个场地`)
  
  // 过滤出未翻译的场地
  const needTranslate = venues.filter(v => !/[\u4e00-\u9fa5]/.test(v.description || ''))
  console.log(`✓ 其中 ${needTranslate.length} 个需要翻译`)

  let successCount = 0
  let failCount = 0
  const results = []

  for (let i = 0; i < needTranslate.length; i++) {
    const v = needTranslate[i]
    console.log(`\n[${i + 1}/${needTranslate.length}] 翻译: ${v.name}`)

    try {
      // 1. 翻译名称（name_cn）
      const nameCn = await translateText(v.name)
      console.log(`  名称: ${v.name} → ${nameCn}`)

      // 2. 翻译标语（tagline）
      let taglineCn = ''
      if (v.tagline) {
        taglineCn = await translateText(v.tagline)
        // 确保不超过合理长度
        if (taglineCn.length > 100) taglineCn = taglineCn.slice(0, 100)
      }
      console.log(`  标语: ${taglineCn}`)

      // 3. 翻译描述（description）- 按句子分段翻译
      let descCn = v.description
      if (v.description) {
        // 按句子分割（每句最多 450 字符）
        const sentences = v.description.split(/(?<=[。\.\!\?])\s+/).filter(s => s.trim())
        const translatedSentences = []
        for (const sentence of sentences) {
          if (sentence.length <= 450) {
            const translated = await translateText(sentence)
            translatedSentences.push(translated)
          } else {
            // 超长句子按逗号分割
            const parts = sentence.split(/(?<=[,，])\s+/)
            for (const part of parts) {
              if (part.trim()) {
                const translated = await translateText(part)
                translatedSentences.push(translated)
              }
            }
          }
          await wait(250) // 避免频率限制
        }
        descCn = translatedSentences.join('')
      }
      console.log(`  描述: ${descCn.length}字`)

      // 4. 翻译特色（features）
      let featuresCn = v.features
      if (v.features) {
        try {
          const features = JSON.parse(v.features)
          if (Array.isArray(features)) {
            // 批量翻译特色
            const translatedFeatures = await translateBatch(features)
            featuresCn = JSON.stringify(translatedFeatures)
          }
        } catch {}
      }

      // 5. 翻译场地类型（venue_types）
      let venueTypesCn = v.venue_types
      if (v.venue_types) {
        try {
          const types = JSON.parse(v.venue_types)
          if (Array.isArray(types)) {
            for (const t of types) {
              if (t.name_en) {
                t.name = translateVenueType(t.name_en)
              } else if (t.name) {
                t.name = translateVenueType(t.name)
              }
            }
            venueTypesCn = JSON.stringify(types)
          }
        } catch {}
      }

      // 6. 翻译城镇（towns）
      let townsCn = v.towns
      if (v.towns) {
        try {
          const towns = JSON.parse(v.towns)
          if (Array.isArray(towns)) {
            for (const t of towns) {
              if (t.name) {
                t.name_cn = translatePlaceName(t.name)
              }
            }
            townsCn = JSON.stringify(towns)
          }
        } catch {}
      }

      // 更新数据库
      await pool.execute(
        `UPDATE crawled_destinations SET 
          name_cn = ?, tagline = ?, description = ?, 
          features = ?, venue_types = ?, towns = ?
         WHERE id = ?`,
        [nameCn, taglineCn, descCn, featuresCn, venueTypesCn, townsCn, v.id]
      )

      console.log(`  ✓ 翻译完成`)
      results.push({ name: v.name, name_cn: nameCn, status: '已翻译' })
      successCount++

      // 每个场地之间延迟，避免被 Google 限流
      await wait(500 + Math.random() * 500)

    } catch (err) {
      console.error(`  ✗ 翻译失败: ${err.message}`)
      results.push({ name: v.name, name_cn: v.name, status: `失败: ${err.message}` })
      failCount++
    }
  }

  await pool.end()

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 翻译完成！成功: ${successCount}, 失败: ${failCount}, 耗时: ${elapsed}秒`)

  // 发送结果邮件
  const resultRows = results.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.name_cn}</td>
      <td style="color:${r.status.includes('失败') ? 'red' : 'green'}">${r.status}</td>
    </tr>
  `).join('')

  await sendEmail(
    `✅ 葡萄牙场地翻译完成 - 成功${successCount}/失败${failCount}`,
    `<h2>翻译任务完成</h2>
     <p><b>目标:</b> 葡萄牙场地数据中文化</p>
     <p><b>完成时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p><b>耗时:</b> ${elapsed} 秒</p>
     <p><b>成功:</b> ${successCount} | <b>失败:</b> ${failCount}</p>
     <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">
       <tr style="background:#f0f0f0"><th>#</th><th>英文名</th><th>中文名</th><th>状态</th></tr>
       ${resultRows}
     </table>
     <p style="margin-top:20px;color:#666">请前往 <a href="https://www.europewedding.cn/crawled-portugal">https://www.europewedding.cn/crawled-portugal</a> 查看结果。</p>`
  )
}

main().catch(async err => {
  console.error('❌ 翻译脚本执行失败:', err.message)
  await sendEmail(
    '❌ 葡萄牙场地翻译任务异常失败',
    `<h2>翻译任务异常失败</h2>
     <p><b>错误信息:</b> ${err.message}</p>
     <p><b>时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>`
  )
  process.exit(1)
})
