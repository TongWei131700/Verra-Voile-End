const mysql = require('mysql2/promise')
;(async () => {
  const pool = await mysql.createPool({host:'127.0.0.1',port:13306,user:'root',password:'caoqiangiot@123',database:'verra_voile'})
  const [rows] = await pool.execute('SELECT features FROM crawled_destinations WHERE slug=?', ['our-quinta'])
  const v = rows[0]
  console.log('type:', typeof v.features)
  console.log('isArray:', Array.isArray(v.features))
  console.log('test on string:', /[a-zA-Z]{5,}/.test(String(v.features)))
  console.log('first 150:', String(v.features).substring(0, 150))
  let parsed
  try { parsed = JSON.parse(v.features); console.log('parsed type:', typeof parsed, Array.isArray(parsed)) } catch(e) { console.log('parse error:', e.message) }
  await pool.end()
})()
