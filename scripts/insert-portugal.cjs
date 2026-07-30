/**
 * 葡萄牙婚礼场地数据入库 + 图片下载脚本
 * 
 * 在服务器上直接运行：node scripts/insert-portugal.cjs
 * 连接服务器本地数据库 127.0.0.1:13306
 */
const mysql = require('mysql2/promise')
const https = require('https')
const fs = require('fs')
const path = require('path')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'crawled')

async function getPool() {
  return mysql.createPool({
    host: '127.0.0.1',
    port: 13306,
    user: 'root',
    password: 'caoqiangiot@123',
    database: 'verra_voile',
    waitForConnections: true,
    connectionLimit: 5,
  })
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.weddingwire.com/',
        'Accept': 'image/webp,image/*,*/*;q=0.8',
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${url}`))
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)) })
  })
}

function getFilename(url, index) {
  try {
    const u = new URL(url)
    const ext = path.extname(u.pathname) || '.jpeg'
    const base = path.basename(u.pathname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
    return `${base}_${index}${ext}`
  } catch { return `img_${index}.jpeg` }
}

// ===== 葡萄牙场地数据 =====
const COUNTRY = 'Portugal'
const COUNTRY_CN = '葡萄牙'
const SOURCE_URL = 'https://www.weddingwire.com/shared/search?destCountry=6'

const budgetRanges = JSON.stringify([
  { label: '2万-5万欧元', min: 20000, max: 50000 },
  { label: '5万-10万欧元', min: 50000, max: 100000 },
  { label: '10万欧元以上', min: 100000, max: null }
])
const guestCapacities = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

const venues = [
  {
    slug: 'our-quinta',
    name: 'Our Quinta',
    name_cn: '我们的庄园',
    tagline: '里斯本近郊的私密庄园，在自然与精致中见证永恒誓约',
    description: `Our Quinta 位于 Mafra 地区的 Vila Franca do Rosário，距里斯本仅20分钟车程，是实现梦想婚礼的完美场地。这里配备了精心装饰的空间和高度专业的团队，确保从第一分钟到最后一分钟都无可挑剔。\n\n场地拥有宽敞的大厅、露台、花园、舞池和私人停车场，每个角落都散发着卓越与精致的气息。在这里，自然美景与优雅环境完美融合，为你的特别日子打造出梦幻般的背景。\n\nOur Quinta 提供全方位服务，包括餐饮、新娘蛋糕、装饰、家具和住宿。专业团队将与你密切合作，确保婚礼的每个细节都完美呈现。无论是浪漫的户外仪式还是优雅的室内宴会，这里都能完美实现你的婚礼愿景。`,
    features: JSON.stringify([
      '距里斯本仅20分钟的私密庄园',
      '宽敞大厅、露台、花园与舞池',
      '私人停车场',
      '专业餐饮与新娘蛋糕服务',
      '精致装饰与家具提供',
      '住宿设施',
      'WeddingWire 5.0满分评分（45条评价）',
      '100%新人推荐'
    ]),
    venue_types: JSON.stringify([
      { name: '庄园', name_en: 'Mansion' },
      { name: '花园', name_en: 'Garden' },
      { name: '露台', name_en: 'Terrace' }
    ]),
    towns: JSON.stringify([
      { name: 'Vila Franca do Rosário', name_cn: '维拉弗兰卡' },
      { name: 'Mafra', name_cn: '马夫拉' }
    ]),
    images: [
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/our-quinta-miguel-gameiro-1080_6_139847-159843295133425.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/1-2_6_139847-163906392269521.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/tnia-afonso-photograhy_6_139847-159500824148270.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/40-20_6_139847-176788167357986.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/1-_6_139847-162211293671086.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/5-3_6_139847-162211294074947.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/20-4_6_139847-162211294313618.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/5-12_6_139847-163906392387216.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/7014_6_139847-176788150793854.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/138-10_6_139847-159379814396221.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/140-9_6_139847-162211294587211.jpeg',
      'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/our-quinta-miguel-gameiro-1105_6_139847-159843295323268.jpeg'
    ],
    cover_image: 'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/our-quinta-miguel-gameiro-1080_6_139847-159843295133425.jpeg',
    sort_order: 30
  },
  {
    slug: 'quinta-da-fontoura',
    name: 'Quinta da Fontoura',
    name_cn: '丰图拉庄园',
    tagline: '三千年花园与湖畔庄园，在自然怀抱中许下永恒誓言',
    description: `Quinta da Fontoura 是你婚礼的理想之地。一座圆形帐篷坐落于花园之中，以湖泊和生物泳池为背景，还有一片近乎魔幻的小森林可以举办你的仪式——Quinta da Fontoura 无疑是一个特别的地方。\n\n场地占地3000平方米，拥有完全致力于实现梦想的设施，可接待多达250位婚礼宾客。八角形建筑风格的帐篷配以玻璃墙，让自然光透过正前方的湖面反射而入，营造出梦幻般的氛围。\n\n位于 Alquerubim 教区，Albergaria-a-Velha 市，沿着 Vouga 河的美丽风光。这里的团队将确保你的每一个愿望都得到实现，从仪式到婚宴，每个细节都精心安排。`,
    features: JSON.stringify([
      '3000平方米专属场地',
      '八角形玻璃墙帐篷，自然光充盈',
      '湖泊与生物泳池',
      '魔幻小森林仪式场地',
      '可容纳250位宾客',
      '花园与花园景观',
      'WeddingWire 4.9分（103条评价）',
      'Vouga河畔优美风光'
    ]),
    venue_types: JSON.stringify([
      { name: '庄园', name_en: 'Mansion' },
      { name: '花园', name_en: 'Garden' },
      { name: '湖畔', name_en: 'Lakeside' }
    ]),
    towns: JSON.stringify([
      { name: 'Albergaria-a-Velha', name_cn: '阿尔贝加里亚' },
      { name: 'Alquerubim', name_cn: '阿尔凯鲁宾' }
    ]),
    images: [
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/dji-0042-2_6_51164.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/caerimonia_6_51164-169330698417184.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/0225_6_51164-1563814614.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpeg/cerimonia-parreira_6_51164-163549408197239.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/0777_6_51164-1563815042.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/0011_6_51164-170896752433430.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/g-f-177_6_51164-157677247492652.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/cerimonia-mata_6_51164-163549408012223.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/exterior-1_6_51164-163549408816154.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/02-lago-02_6_51164.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/noite-68_6_51164.jpeg',
      'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/piscina_6_51164-163352110033342.jpeg'
    ],
    cover_image: 'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/dji-0042-2_6_51164.jpeg',
    sort_order: 31
  },
  {
    slug: 'quinta-vila-marita',
    name: 'Quinta Vila Marita',
    name_cn: '玛丽塔庄园',
    tagline: '明戈之心五万平方米花园庄园，瀑布湖泊间的浪漫婚礼',
    description: `Quinta Vila Marita 专注于婚礼组织，拥有一支专业团队和丰富的酒店服务经验。在这座庄园中，经典与现代完美共生，坐落于 Minho 心脏地带的特权区域。\n\n场地占地50000平方米，拥有众多花园、草坪、瀑布、湖泊，以及极其丰富的植物和花卉品种。这里为你的婚礼提供了一个如诗如画的背景，每一个角落都充满了自然的惊喜。\n\n位于 Guimarães 和 Braga 之间的 Santa Maria de Souto 镇，Quinta Vila Marita 提供精致的装饰、保姆服务和花艺服务。也可举办洗礼、圣餐、会议等活动。WeddingWire 4.9分，124位新人评价，以出色的服务、美味的美食和美丽的装饰备受赞誉。`,
    features: JSON.stringify([
      '50000平方米超大庄园',
      '众多花园、草坪、瀑布与湖泊',
      '丰富的植物和花卉品种',
      '精致装饰与花艺服务',
      '专业婚礼策划团队',
      'WeddingWire 4.9分（124条评价）',
      '位于Minho心脏地带',
      '经典与现代完美融合'
    ]),
    venue_types: JSON.stringify([
      { name: '庄园', name_en: 'Mansion' },
      { name: '花园', name_en: 'Garden' },
      { name: '度假村', name_en: 'Resort' }
    ]),
    towns: JSON.stringify([
      { name: 'Guimarães', name_cn: '吉马良斯' },
      { name: 'Braga', name_cn: '布拉加' }
    ]),
    images: [
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-0276_6_97457-178041225233032.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpeg/image00003_6_97457-169608084053762.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpeg/image00001_6_97457-169608333129370.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/vm25-0186_6_97457-175810849540453.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/vm25-1082_6_97457-175810865869423.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/ha302247_6_97457-177002821244455.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/aa3-6522_6_97457-178041225166799.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-0282_6_97457-178041225279734.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-20260501221932-0130-d_6_97457-178041225387958.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/vm26-0045_6_97457-178041225846221.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/fh206690_6_97457-178041276723439.jpeg',
      'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpeg/cortebolo1-qfilm_6_97457-177002847526775.jpeg'
    ],
    cover_image: 'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-0276_6_97457-178041225233032.jpeg',
    sort_order: 32
  },
  {
    slug: 'humus-farm',
    name: 'Humus Farm',
    name_cn: '胡马斯农场',
    tagline: '帕尔梅拉的田园农场，在乡村魅力与精致 refinement 中庆祝爱情',
    description: `Humus Farm 位于美丽的 Palmela 地区，是一座非常热情的农场，为你的大型婚礼庆典提供所有条件。拥有宽敞的室内外空间，这座物业完美结合了乡村环境的魅力与你婚礼应有的精致与品味。\n\n场地设有宴会厅、露台、花园区、设备齐全的厨房、舞池、游泳池、果园和私人停车场。无论是浪漫的户外仪式还是盛大的室内宴会，Humus Farm 都能完美满足你的需求。\n\n场地提供接待服务，以及与摄影、音乐和装饰服务的奢华合作。WeddingWire 4.8分评价，新人称赞其轻松而质朴优雅的氛围，个性化的目的地婚礼体验，以及专业、乐于助人的团队。`,
    features: JSON.stringify([
      'Palmela美丽的田园农场',
      '宽敞室内外空间',
      '宴会厅、露台与花园',
      '舞池与游泳池',
      '果园与私人停车场',
      '设备齐全的专业厨房',
      'WeddingWire 4.8分（13条评价）',
      '轻松质朴而优雅的目的地婚礼体验'
    ]),
    venue_types: JSON.stringify([
      { name: '农场/庄园', name_en: 'Farm' },
      { name: '花园', name_en: 'Garden' },
      { name: '度假村', name_en: 'Resort' }
    ]),
    towns: JSON.stringify([
      { name: 'Palmela', name_cn: '帕尔梅拉' },
      { name: 'Fernando Pó', name_cn: '费尔南多波' }
    ]),
    images: [
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/05_6_126649-167715448659938.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-214_6_126649-172961619154106.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-229_6_126649-172961385594233.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/catarinapedro-0852_6_126649-167715413173652.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/raquelbernardo-669_6_126649-172961575085813.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/wed-752-resized_6_126649-172961618781253.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-171_6_126649-172961383825181.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-64_6_126649-172961383643430.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/img-2424_6_126649-169445914269486.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/img-1950_6_126649-169445901096791.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/-dsc7164_6_126649-167715430675088.jpeg',
      'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/-dsc7188_6_126649-167715439821259.jpeg'
    ],
    cover_image: 'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/05_6_126649-167715448659938.jpeg',
    sort_order: 33
  },
  {
    slug: 'montebello-wedding-events',
    name: 'Montebello Wedding Events',
    name_cn: '蒙特的贝洛婚礼',
    tagline: '佩纳菲耶尔的满分婚礼庄园，178位新人一致推荐的极致体验',
    description: `Montebello Wedding Events 位于 Penafiel 的 Croca 地区，是葡萄牙最受欢迎的婚礼场地之一。凭借超过15年的活动策划市场经验，提供基于专业性和质量的服务。\n\n场地专注于与客户的直接联系，确保你的婚礼完全按照梦想中的样子呈现。场地设有室内大厅（可容纳250人）、空调设施、无障碍通道、专业厨房、花园开放式客厅等。\n\n花园区域约5000平方米，配有湖泊、酒吧、休息区、钢琴、儿童室、育婴室、拍照亭等设施。Montebello Wedding Events 以出色的服务、美味的食物和美丽的装饰闻名，是 WeddingWire 5.0满分评分、178位新人评价的顶级场地。`,
    features: JSON.stringify([
      'WeddingWire 5.0满分评分（178条评价）',
      '15年以上活动策划经验',
      '室内大厅可容纳250人',
      '5000平方米花园区域',
      '湖泊与酒吧休息区',
      '专业厨房与无障碍设施',
      '儿童室与育婴室',
      '100%新人推荐率'
    ]),
    venue_types: JSON.stringify([
      { name: '庄园', name_en: 'Mansion' },
      { name: '花园', name_en: 'Garden' },
      { name: '餐厅', name_en: 'Restaurant' }
    ]),
    towns: JSON.stringify([
      { name: 'Penafiel', name_cn: '佩纳菲耶尔' },
      { name: 'Croca', name_cn: '克罗卡' }
    ]),
    images: [
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/1000013332_6_105484-175865085874889.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/db303714_6_105484-169901843048726.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/1000009128_6_105484-172457724517786.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/309_6_105484-165106959513200.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/339_6_105484-165106914846916.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/238_6_105484-165115879999201.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/001_6_105484-165115759093114.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/010_6_105484-165115767590919.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/030_6_105484-165115775645584.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/054_6_105484-165115784211588.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/178_6_105484-165115856676613.jpeg',
      'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/183_6_105484-165115863259286.jpeg'
    ],
    cover_image: 'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/1000013332_6_105484-175865085874889.jpeg',
    sort_order: 34
  }
]

async function main() {
  const pool = await getPool()
  console.log('✓ 数据库已连接 (127.0.0.1:13306)')

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }

  for (const v of venues) {
    console.log(`\n📍 处理: ${v.name_cn} (${v.slug})`)

    // 1. 检查是否已存在
    const [existing] = await pool.execute('SELECT id FROM crawled_destinations WHERE slug = ?', [v.slug])
    
    // 2. 下载图片到本地
    const destDir = path.join(UPLOADS_DIR, v.slug)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    const localPaths = []
    let coverLocal = ''
    
    for (let i = 0; i < v.images.length; i++) {
      const url = v.images[i]
      const filename = getFilename(url, i)
      const outputPath = path.join(destDir, filename)
      const localPath = `/uploads/crawled/${v.slug}/${filename}`

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        const size = (fs.statSync(outputPath).size / 1024).toFixed(1)
        console.log(`  ⏭ [${i+1}/${v.images.length}] 已存在: ${filename} (${size}KB)`)
        localPaths.push(localPath)
        if (i === 0) coverLocal = localPath
        continue
      }

      try {
        process.stdout.write(`  ⬇ [${i+1}/${v.images.length}] 下载中...`)
        const buffer = await downloadImage(url)
        if (buffer.length < 1000) throw new Error(`太小: ${buffer.length} bytes`)
        fs.writeFileSync(outputPath, buffer)
        const size = (buffer.length / 1024).toFixed(1)
        console.log(` ✓ ${size}KB`)
        localPaths.push(localPath)
        if (i === 0) coverLocal = localPath
      } catch (err) {
        console.log(` ✗ ${err.message}`)
        localPaths.push(url) // 失败保留原URL
        if (i === 0) coverLocal = url
      }
    }

    // 3. 入库/更新
    if (existing.length > 0) {
      await pool.execute(
        `UPDATE crawled_destinations SET name=?, name_cn=?, tagline=?, description=?, features=?, venue_types=?, towns=?, images=?, budget_ranges=?, guest_capacities=?, cover_image=?, cover_image_url=?, source_url=?, sort_order=? WHERE slug=?`,
        [v.name, v.name_cn, v.tagline, v.description, v.features, v.venue_types, v.towns, JSON.stringify(localPaths), budgetRanges, guestCapacities, coverLocal, v.cover_image, SOURCE_URL, v.sort_order, v.slug]
      )
      console.log(`  ✓ 已更新: ${v.name_cn}`)
    } else {
      await pool.execute(
        `INSERT INTO crawled_destinations (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, cover_image, cover_image_url, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [v.slug, v.name, v.name_cn, COUNTRY, COUNTRY_CN, SOURCE_URL, v.tagline, v.description, v.features, v.venue_types, v.towns, JSON.stringify(localPaths), budgetRanges, guestCapacities, coverLocal, v.cover_image, v.sort_order]
      )
      console.log(`  ✓ 已入库: ${v.name_cn}`)
    }
  }

  await pool.end()
  console.log('\n✅ 葡萄牙场地数据入库完成！')
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err)
  process.exit(1)
})
