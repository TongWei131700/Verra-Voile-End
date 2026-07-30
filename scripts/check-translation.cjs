const mysql = require('mysql2/promise')
;(async () => {
  const pool = await mysql.createPool({host:'127.0.0.1',port:13306,user:'root',password:'caoqiangiot@123',database:'verra_voile'})
  const [venues] = await pool.execute('SELECT slug, name, description FROM crawled_destinations WHERE country=? ORDER BY sort_order', ['Portugal'])
  
  let chineseCount = 0
  let englishCount = 0
  const englishVenues = []
  
  for (const v of venues) {
    const hasChinese = /[\u4e00-\u9fa5]/.test(v.description)
    if (hasChinese) {
      chineseCount++
    } else {
      englishCount++
      englishVenues.push(v.slug)
    }
  }
  
  console.log(`总计: ${venues.length} 个场地`)
  console.log(`已翻译(含中文): ${chineseCount}`)
  console.log(`未翻译(纯英文): ${englishCount}`)
  console.log(`未翻译场地: ${englishVenues.join(', ')}`)
  
  await pool.end()
})()
