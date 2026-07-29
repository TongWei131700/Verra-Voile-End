const nodemailer = require('nodemailer')

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.163.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const SMTP_USER = process.env.SMTP_USER || 'TW15536500878@163.com'
const SMTP_PASS = process.env.SMTP_PASS || 'DZVj2VwzTE8Amuh2'
const NOTIFY_TO = process.env.NOTIFY_TO || 'TW15536500878@163.com'

let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  }
  return transporter
}

async function sendMail(subject, html) {
  try {
    const info = await getTransporter().sendMail({
      from: `"薇雅爬虫通知" <${SMTP_USER}>`,
      to: NOTIFY_TO,
      subject,
      html
    })
    console.log('✓ 邮件已发送:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error('✗ 邮件发送失败:', err.message)
    return { success: false, error: err.message }
  }
}

async function sendCrawlStart(country) {
  return sendMail(
    `🚀 爬虫任务开始 - ${country}`,
    `<h2>爬虫任务已启动</h2>
     <p><b>目标国家:</b> ${country}</p>
     <p><b>开始时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     <p>爬取完成后将再次通知您结果。</p>`
  )
}

async function sendCrawlResult(country, results, error = null) {
  const status = error ? '❌ 失败' : '✅ 成功'
  const resultHtml = error
    ? `<p style="color:red"><b>错误信息:</b> ${error}</p>`
    : `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
         <tr style="background:#f0f0f0"><th>#</th><th>名称</th><th>中文</th><th>状态</th></tr>
         ${results.map((r, i) => `
           <tr>
             <td>${i + 1}</td>
             <td>${r.name || '-'}</td>
             <td>${r.name_cn || '-'}</td>
             <td style="color:green">✓ 已入库</td>
           </tr>
         `).join('')}
       </table>
       <p style="margin-top:16px"><b>共爬取 ${results.length} 个目的地</b></p>`

  return sendMail(
    `${status} 爬虫任务完成 - ${country}`,
    `<h2>爬虫任务${error ? '失败' : '完成'}</h2>
     <p><b>目标国家:</b> ${country}</p>
     <p><b>完成时间:</b> ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
     ${resultHtml}
     <p style="margin-top:20px;color:#666">请前往 <a href="https://www.europewedding.cn/crawled-greece">https://www.europewedding.cn/crawled-greece</a> 查看结果。</p>`
  )
}

async function sendCrawlProgress(country, elapsed, progress) {
  return sendMail(
    `⏳ 爬虫进行中 - ${country}（已运行 ${Math.round(elapsed / 60000)} 分钟）`,
    `<h2>爬虫仍在运行中</h2>
     <p><b>目标国家:</b> ${country}</p>
     <p><b>已运行时间:</b> ${Math.round(elapsed / 60000)} 分钟</p>
     <p><b>当前进度:</b> ${progress}</p>
     <p>完成后将通知您最终结果。</p>`
  )
}

module.exports = { sendMail, sendCrawlStart, sendCrawlResult, sendCrawlProgress }
