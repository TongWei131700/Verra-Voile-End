const mysql = require('mysql2/promise')
require('dotenv').config()

const items = [
  ['riga-old-town','里加老城','Riga Old Town','拉脱维亚','Latvia','里加','Riga','波罗的海最大的中世纪老城','🏘️ 中世纪老城 | 世界遗产 | 波罗的海明珠',
   '里加老城是波罗的海国家最大的中世纪老城之一，被联合国教科文组织列为世界遗产。老城的新艺术风格建筑在全世界独一无二，超过800栋新艺术风格建筑散布在老城中。\n\n拍摄建议：从市政厅广场拍摄老城全景是最经典的角度。日落时分的金色光线照射在红色屋顶上格外壮观。从圣彼得教堂塔楼拍摄整个老城的全景也很壮观。',
   'Riga Old Town is one of the largest medieval old towns in the Baltic states, a UNESCO World Heritage Site. Over 800 Art Nouveau buildings are scattered throughout.',
   [{icon:'🏘️',title:'中世纪老城',desc:'波罗的海最大中世纪老城'},{icon:'🏆',title:'世界遗产',desc:'联合国教科文组织世界遗产'},{icon:'📸',title:'最佳拍摄',desc:'市政厅广场拍摄老城全景'}],
   ['老城','世界遗产','里加','拉脱维亚']],
  ['riga-art-nouveau','里加新艺术区','Riga Art Nouveau District','拉脱维亚','Latvia','里加','Riga','全世界新艺术建筑最集中的城市','🏛️ 新艺术建筑 | 800栋 | 全世界之最',
   '里加拥有全世界最集中的新艺术风格建筑群，超过800栋建筑分布在阿尔伯特街和伊丽莎白街。这些建于19世纪末20世纪初的建筑以精美的浮雕和装饰闻名。\n\n拍摄建议：从阿尔伯特街拍摄建筑立面全景是最经典的角度。日落时分的金色光线照射在建筑装饰上格外壮观。从街道拍摄建筑细节也很壮观。',
   'Riga has the world\'s most concentrated collection of Art Nouveau architecture, with over 800 buildings on Alberta and Elizabetes streets. Famous for exquisite reliefs and decorations.',
   [{icon:'🏛️',title:'新艺术建筑',desc:'全世界新艺术建筑最集中的城市'},{icon:'🎨',title:'800栋',desc:'超过800栋新艺术风格建筑'},{icon:'📸',title:'最佳拍摄',desc:'阿尔伯特街拍摄建筑立面全景'}],
   ['新艺术','建筑','里加','拉脱维亚']],
  ['jurmala-beach','尤尔马拉海滩','Jurmala Beach','拉脱维亚','Latvia','尤尔马拉','Jurmala','波罗的海最受欢迎的度假胜地','🏖️ 海滩 | 度假胜地 | 波罗的海',
   '尤尔马拉是波罗的海最受欢迎的度假胜地，以33公里长的白色沙滩和木制温泉别墅闻名。小镇的温泉文化和新艺术风格的木制建筑是独特的旅游资源。\n\n拍摄建议：从海滩拍摄波罗的海全景是最经典的角度。日落时分的金色光线照射在海面上格外壮观。从沙丘拍摄海岸线也很壮观。',
   'Jurmala is the Baltic\'s most popular resort, famous for 33 kilometers of white sand beaches and wooden spa villas. The spa culture and Art Nouveau wooden architecture are unique.',
   [{icon:'🏖️',title:'海滩',desc:'波罗的海最受欢迎的度假胜地'},{icon:'🌊',title:'33公里',desc:'33公里长的白色沙滩'},{icon:'📸',title:'最佳拍摄',desc:'海滩拍摄波罗的海全景'}],
   ['海滩','度假','尤尔马拉','拉脱维亚']],
  ['rundale-palace','隆代莱宫','Rundale Palace','拉脱维亚','Latvia','南部','Southern','波罗的海的凡尔赛宫','🏰 巴洛克宫殿 | 波罗的海凡尔赛 | 拉脱维亚地标',
   '隆代莱宫被称为"波罗的海的凡尔赛宫"，是拉脱维亚最壮观的巴洛克建筑。宫殿由意大利建筑师设计，内部的金碧辉煌的装饰和精美的花园令人叹为观止。\n\n拍摄建议：从宫殿正前方拍摄完整建筑群全景是最经典的角度。日落时分的金色光线照射在宫殿上格外壮观。从花园拍摄宫殿与花坛的组合全景也很壮观。',
   'Rundale Palace, known as the "Versailles of the Baltic," is Latvia\'s most spectacular Baroque building. Designed by an Italian architect with magnificent interiors and gardens.',
   [{icon:'🏰',title:'巴洛克宫殿',desc:'波罗的海的凡尔赛宫'},{icon:'🏛️',title:'意大利设计',desc:'意大利建筑师设计的巴洛克建筑'},{icon:'📸',title:'最佳拍摄',desc:'宫殿正前方拍摄建筑群全景'}],
   ['宫殿','巴洛克','南部','拉脱维亚']],
  ['sigulda-castle','锡古尔达城堡','Sigulda Castle','拉脱维亚','Latvia','中部','Central','拉脱维亚的瑞士','🏰 中世纪城堡 | 高亚河谷 | 拉脱维亚自然',
   '锡古尔达位于高亚河谷中，被称为"拉脱维亚的瑞士"。锡古尔达城堡遗址和周围的自然风光构成了拉脱维亚最美丽的风景之一。高亚河谷的红色砂岩悬崖是徒步的天堂。\n\n拍摄建议：从河谷高处拍摄城堡与河流的全景是最经典的角度。日落时分的金色光线照射在河谷上格外壮观。从城堡遗址拍摄高亚河谷也很壮观。',
   'Sigulda, located in the Gauja River Valley, is known as the "Switzerland of Latvia." The castle ruins and natural scenery create Latvia\'s most beautiful landscape.',
   [{icon:'🏰',title:'中世纪城堡',desc:'拉脱维亚的瑞士'},{icon:'🏞️',title:'高亚河谷',desc:'红色砂岩悬崖徒步天堂'},{icon:'📸',title:'最佳拍摄',desc:'河谷高处拍摄城堡河流全景'}],
   ['城堡','河谷','锡古尔达','拉脱维亚']],
]

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  let so = 389
  for (const [slug,name,nameEn,country,countryEn,loc,locEn,tagline,hlStr,desc,descEn,hlArr,tags] of items) {
    const cover = `/uploads/crawled/travel-attractions/${slug}.jpg`
    const highlights = JSON.stringify(hlArr)
    const tagsJson = JSON.stringify(tags)
    await pool.execute(
      `INSERT INTO crawled_travel_attractions
       (slug,name,name_en,country,country_en,location,location_en,cover_image,tagline,description,description_en,highlights,price,sort_order,tags)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [slug,name,nameEn,country,countryEn,loc,locEn,cover,tagline,desc,descEn,highlights,0,so,tagsJson]
    )
    console.log(`✓ ${name} (${slug})`)
    so++
  }
  console.log(`\n共插入 ${items.length} 个拉脱维亚景点`)
  await pool.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
