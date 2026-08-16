const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'verra_voile',
  waitForConnections: true,
  connectionLimit: 10,
})

/**
 * 初始化数据库表结构
 */
async function initDB() {
  const createReservationsSQL = `
    CREATE TABLE IF NOT EXISTS reservations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL COMMENT '客户姓名',
      phone VARCHAR(30) NOT NULL COMMENT '联系电话',
      email VARCHAR(100) DEFAULT '' COMMENT '电子邮箱',
      destination VARCHAR(100) NOT NULL COMMENT '期望目的地',
      date VARCHAR(50) NOT NULL COMMENT '计划举办时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约咨询表';
  `
  const createUsersSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(20) UNIQUE COMMENT '手机号',
      email VARCHAR(255) UNIQUE COMMENT '邮箱',
      password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
  `
  const createVerificationCodesSQL = `
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(255) NOT NULL COMMENT '手机号或邮箱',
      code VARCHAR(6) NOT NULL COMMENT '验证码',
      type VARCHAR(20) DEFAULT 'sms' COMMENT '验证方式: sms/email',
      used TINYINT(1) DEFAULT 0 COMMENT '是否已使用',
      expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      INDEX idx_phone_code (phone, code, used)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='验证码表';
  `
  const createMessagesSQL = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL COMMENT '用户ID',
      sender_type ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT '发送方',
      content TEXT NOT NULL COMMENT '消息内容',
      is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      INDEX idx_user_id (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='聊天消息表';
  `
  const createUserProductsSQL = `
    CREATE TABLE IF NOT EXISTS user_selected_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL COMMENT '用户ID',
      category_id VARCHAR(50) NOT NULL COMMENT '类别ID',
      product_id VARCHAR(50) NOT NULL COMMENT '商品ID',
      name VARCHAR(200) NOT NULL COMMENT '商品名称',
      name_en VARCHAR(200) DEFAULT '' COMMENT '商品英文名',
      price INT NOT NULL DEFAULT 0 COMMENT '价格',
      unit VARCHAR(10) DEFAULT '€' COMMENT '货币单位',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      UNIQUE KEY uk_user_product (user_id, category_id, product_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已选商品表';
  `
  const createProductsTableSQL = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id VARCHAR(50) NOT NULL COMMENT '大类ID',
      product_id VARCHAR(50) NOT NULL COMMENT '类内唯一ID',
      name VARCHAR(200) NOT NULL COMMENT '商品名称',
      name_en VARCHAR(200) DEFAULT '' COMMENT '商品英文名',
      description TEXT COMMENT '商品描述',
      image VARCHAR(500) DEFAULT '' COMMENT '图片URL',
      price INT NOT NULL DEFAULT 0 COMMENT '价格',
      unit VARCHAR(10) DEFAULT '€' COMMENT '货币单位',
      capacity VARCHAR(100) DEFAULT '' COMMENT '规格/容量',
      highlight VARCHAR(50) DEFAULT '' COMMENT '标签（热门/推荐等）',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_category_product (category_id, product_id),
      INDEX idx_category (category_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表（旧，待迁移）';
  `
  const createProductModulesTableSQL = `
    CREATE TABLE IF NOT EXISTS product_modules (
      id VARCHAR(50) PRIMARY KEY COMMENT '模块ID',
      name VARCHAR(100) NOT NULL COMMENT '模块中文名',
      name_en VARCHAR(100) DEFAULT '' COMMENT '模块英文名',
      image VARCHAR(500) DEFAULT '' COMMENT '模块封面图',
      description VARCHAR(200) DEFAULT '' COMMENT '模块描述',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品模块（大类）表';
  `
  const createDeployVersionsTableSQL = `
    CREATE TABLE IF NOT EXISTS deploy_versions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      version VARCHAR(50) NOT NULL COMMENT '版本号，如 0.0.3',
      branch VARCHAR(100) NOT NULL COMMENT 'git分支名，如 daily/0.0.3',
      frontend_commit VARCHAR(64) DEFAULT '' COMMENT '前端commit hash',
      backend_commit VARCHAR(64) DEFAULT '' COMMENT '后端commit hash',
      target VARCHAR(20) DEFAULT 'full' COMMENT '部署目标: full/frontend/backend',
      status VARCHAR(20) DEFAULT 'success' COMMENT '部署状态: success/failed/rolled_back',
      note VARCHAR(500) DEFAULT '' COMMENT '版本备注',
      deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '部署时间',
      rolled_back TINYINT(1) DEFAULT 0 COMMENT '是否已回滚',
      INDEX idx_version (version),
      INDEX idx_deployed_at (deployed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部署版本记录表';
  `
  await pool.execute(createReservationsSQL)
  await pool.execute(createUsersSQL)
  await pool.execute(createVerificationCodesSQL)
  await pool.execute(createMessagesSQL)
  await pool.execute(createUserProductsSQL)
  await pool.execute(createProductModulesTableSQL)
  await pool.execute(createProductsTableSQL)
  await pool.execute(createDeployVersionsTableSQL)
  console.log('✓ 数据库表 deploy_versions 已就绪')

  // 迁移：将旧 products 单表数据拆分到按种类独立表
  await migrateToPerCategoryTables(pool)

  // 种子数据：插入默认商品模块和商品（仅首次为空时插入）
  await seedProducts(pool)

  // 迁移：合并酒水与宴席模块，新增摄影模块（存量库兼容）
  await syncWineCateringMerge(pool)

  // 迁移：为酒水宴席商品表补充详情页富字段
  await ensureWineRichColumns(pool)

  // 爬取目的地试验表
  await ensureCrawledDestinationsTable(pool)
  await seedCrawledDestinations(pool)

  // 婚礼团队表
  await ensureWeddingTeamsTable(pool)

  // 爬取摄影师表
  await ensureCrawledPhotographersTable(pool)

  // 爬取花店表
  await ensureCrawledFloristsTable(pool)

  // 目的地场地表（含城市分组字段）
  await ensureDestinationTable(pool)
  await seedDestinationVenues(pool)
}

/**
 * 摄影模块种子商品
 */
const photographySeedProducts = [
  { category_id: 'photography', product_id: 'full-day', name: '婚礼当天全程跟拍', name_en: 'Full-Day Photography', description: '资深摄影师全天8小时跟拍，记录仪式每一个珍贵瞬间', image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=400&fit=crop', price: 1200, unit: '€', capacity: '全天8小时', highlight: '热门', sort_order: 1 },
  { category_id: 'photography', product_id: 'prewedding', name: '婚纱旅拍', name_en: 'Pre-wedding Shoot', description: '目的地婚纱旅拍，精修照片20张，定格最美婚纱照', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop', price: 800, unit: '€', capacity: '2小时精修20张', highlight: '推荐', sort_order: 2 },
  { category_id: 'photography', product_id: 'album', name: '精修相册套装', name_en: 'Premium Photo Album', description: '电影级精修+30页典藏相册，留存永恒回忆', image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop', price: 300, unit: '€', capacity: '30页相册', highlight: '', sort_order: 3 },
]

/**
 * 种子数据：初始化商品模块和商品
 */
async function seedProducts(pool) {
  const [moduleRows] = await pool.execute('SELECT COUNT(*) as cnt FROM product_modules')
  if (moduleRows[0].cnt > 0) {
    // 确保每个种类都有对应的独立表
    const [modules] = await pool.execute('SELECT id FROM product_modules')
    for (const mod of modules) {
      await ensureCategoryTable(pool, mod.id)
    }
    return
  }

  const modules = [
    { id: 'destination', name: '地点', name_en: 'Destination', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop', description: '全球浪漫目的地', sort_order: 0 },
    { id: 'team', name: '婚礼团队', name_en: 'Wedding Team', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=800&fit=crop', description: '一站式婚礼现场服务', sort_order: 1 },
    { id: 'floral', name: '花卉', name_en: 'Floral', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=800&fit=crop', description: '浪漫花艺设计', sort_order: 2 },
    { id: 'wine', name: '酒水宴席', name_en: 'Wine & Dining', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=800&fit=crop', description: '精选婚宴佳酿与米其林级飨宴', sort_order: 3 },
    { id: 'dress', name: '礼服', name_en: 'Dress', image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&h=800&fit=crop', description: '梦想中的嫁衣', sort_order: 4 },
    { id: 'photography', name: '摄影', name_en: 'Photography', image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop', description: '记录每一个珍贵瞬间', sort_order: 5 },
    { id: 'other', name: '其他', name_en: 'Others', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=800&fit=crop', description: '包车及其他服务', sort_order: 6 },
  ]

  for (const m of modules) {
    await pool.execute(
      'INSERT INTO product_modules (id, name, name_en, image, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [m.id, m.name, m.name_en, m.image, m.description, m.sort_order]
    )
  }

  const products = [
    // team
    { category_id: 'team', product_id: 'base', name: '基础套餐', name_en: 'Base Package', description: '策划+4h摄影+花艺+化妆+发型+主持+小提琴，一站式婚礼现场服务', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&h=400&fit=crop', price: 4100, unit: '€', capacity: '全程跟拍', highlight: '热门', sort_order: 1 },
    { category_id: 'team', product_id: 'makeup', name: '升级化妆师', name_en: 'Premium Makeup Artist', description: '专业新娘妆容升级，资深化妆师全天跟妆', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=400&fit=crop', price: 300, unit: '€', capacity: '全天跟妆', highlight: '', sort_order: 2 },
    { category_id: 'team', product_id: 'floral-upgrade', name: '升级花艺', name_en: 'Premium Floral Design', description: '高级花艺设计升级，手捧花+仪式装饰+胸花', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop', price: 500, unit: '€', capacity: '全套花艺', highlight: '', sort_order: 3 },
    { category_id: 'team', product_id: 'video', name: '婚礼视频', name_en: 'Wedding Film', description: '全程视频拍摄与电影级剪辑，记录每一个珍贵瞬间', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&h=400&fit=crop', price: 1000, unit: '€', capacity: '全天拍摄', highlight: '推荐', sort_order: 4 },
    // floral
    { category_id: 'floral', product_id: 'dahlia', name: '大丽花手捧花束', name_en: 'Dahlia Bouquet', description: '经典欧式手捧花设计，大丽花搭配尤加利叶，优雅大气', image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop', price: 500, unit: '€', capacity: '1束', highlight: '', sort_order: 1 },
    // wine（仅保留 Nobu 定制宴会，完整富数据由 scripts/insert-nobu-catering.cjs 写入）
    { category_id: 'wine', product_id: 'nobu-catering', name: 'Nobu 定制宴会', name_en: 'Nobu Catering London', description: 'Nobu Hotel London Portman Square 定制宴会餐饮。坐席晚宴、鸡尾酒会 canapés、现场烹饪台与主厨大师课任选，服务覆盖酒店、办公室、私人住宅，甚至游艇与私人飞机。', image: 'https://www.nobuhotels.com/london-portman/content/uploads/2024/09/Nobu_Hotel_London_Portman_Square_Nobu_Terrace_Food_Cocktails_Platter_2.jpg', price: 0, unit: '——', capacity: '定制规模', highlight: '米其林名厨', sort_order: 1 },
    // photography
    ...photographySeedProducts,
    // other
    { category_id: 'other', product_id: 'car', name: '当天包车', name_en: 'Day Car Rental', description: '全天接送用车服务，含专业司机', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=400&fit=crop', price: 100, unit: '€', capacity: '全天', highlight: '', sort_order: 1 },
  ]

  // 插入商品到对应的种类独立表
  for (const p of products) {
    const tableName = await ensureCategoryTable(pool, p.category_id)
    await pool.execute(
      `INSERT INTO \`${tableName}\` (product_id, name, name_en, description, image, price, unit, capacity, highlight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.product_id, p.name, p.name_en, p.description, p.image, p.price, p.unit, p.capacity, p.highlight, p.sort_order]
    )
  }

  console.log('✓ 种子数据已插入（product_modules + 各类别独立商品表）')
}

/**
 * 迁移：合并酒水与宴席（catering 并入 wine），新增摄影模块
 * 针对存量数据库，新库由 seedProducts 直接生成最终状态
 */
async function syncWineCateringMerge(pool) {
  // 1. 合并 catering 到 wine
  const [catRows] = await pool.execute("SELECT id FROM product_modules WHERE id = 'catering'")
  if (catRows.length > 0) {
    await ensureCategoryTable(pool, 'catering')
    await ensureCategoryTable(pool, 'wine')
    const [catProducts] = await pool.execute('SELECT * FROM `products_catering`')
    let merged = 0
    for (const p of catProducts) {
      const [exist] = await pool.execute('SELECT id FROM `products_wine` WHERE product_id = ?', [p.product_id])
      if (exist.length > 0) continue
      await pool.execute(
        'INSERT INTO `products_wine` (product_id, name, name_en, description, image, price, unit, capacity, highlight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.product_id, p.name, p.name_en || '', p.description || '', p.image || '', p.price || 0, p.unit || '€', p.capacity || '', p.highlight || '', (p.sort_order || 0) + 100]
      )
      merged++
    }
    await pool.execute("DELETE FROM product_modules WHERE id = 'catering'")
    console.log(`✓ 已合并酒水与宴席模块（catering → wine，并入 ${merged} 条商品）`)
  }

  // 2. wine 模块更名为"酒水宴席"
  await pool.execute(
    "UPDATE product_modules SET name = '酒水宴席', name_en = 'Wine & Dining', description = '精选婚宴佳酿与米其林级飨宴' WHERE id = 'wine' AND name <> '酒水宴席'"
  )

  // 3. 新增摄影模块
  const [photoRows] = await pool.execute("SELECT id FROM product_modules WHERE id = 'photography'")
  const tableName = await ensureCategoryTable(pool, 'photography')
  if (photoRows.length === 0) {
    await pool.execute(
      'INSERT INTO product_modules (id, name, name_en, image, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      ['photography', '摄影', 'Photography', 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=800&fit=crop', '记录每一个珍贵瞬间', 5]
    )
    for (const p of photographySeedProducts) {
      await pool.execute(
        `INSERT INTO \`${tableName}\` (product_id, name, name_en, description, image, price, unit, capacity, highlight, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.product_id, p.name, p.name_en, p.description, p.image, p.price, p.unit, p.capacity, p.highlight, p.sort_order]
      )
    }
    console.log(`✓ 新增摄影模块（photography，${photographySeedProducts.length} 条商品）`)
  }
}

/**
 * 根据商品种类 ID 获取对应的表名
 */
function getCategoryTable(categoryId) {
  return `products_${categoryId.replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/**
 * 创建按种类独立的商品表
 */
async function ensureCategoryTable(pool, categoryId) {
  const tableName = getCategoryTable(categoryId)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL COMMENT '类内唯一ID',
      name VARCHAR(200) NOT NULL COMMENT '商品名称',
      name_en VARCHAR(200) DEFAULT '' COMMENT '商品英文名',
      description TEXT COMMENT '商品描述',
      image VARCHAR(500) DEFAULT '' COMMENT '图片URL',
      price INT NOT NULL DEFAULT 0 COMMENT '价格',
      unit VARCHAR(10) DEFAULT '€' COMMENT '货币单位',
      capacity VARCHAR(100) DEFAULT '' COMMENT '规格/容量',
      highlight VARCHAR(50) DEFAULT '' COMMENT '标签',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_product_id (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表 - ${categoryId}'
  `)
  return tableName
}

/**
 * 迁移：将旧 products 单表数据拆分到按种类独立表
 */
async function migrateToPerCategoryTables(pool) {
  // 检查旧 products 表是否存在
  const [tables] = await pool.execute("SHOW TABLES LIKE 'products'")
  if (tables.length === 0) return

  // 检查是否有数据需要迁移
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM products')
  if (rows[0].cnt === 0) return

  // 获取所有种类
  const [modules] = await pool.execute('SELECT id FROM product_modules')
  for (const mod of modules) {
    const tableName = getCategoryTable(mod.id)
    // 确保表存在
    await ensureCategoryTable(pool, mod.id)
    // 检查是否已有数据
    const [existing] = await pool.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``)
    if (existing[0].cnt > 0) continue

    // 从旧表迁移数据
    const [products] = await pool.execute(
      'SELECT product_id, name, name_en, description, image, price, unit, capacity, highlight, sort_order FROM products WHERE category_id = ?',
      [mod.id]
    )
    for (const p of products) {
      await pool.execute(
        `INSERT INTO \`${tableName}\` (product_id, name, name_en, description, image, price, unit, capacity, highlight, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.product_id, p.name, p.name_en || '', p.description || '', p.image || '', p.price || 0, p.unit || '€', p.capacity || '', p.highlight || '', p.sort_order || 0]
      )
    }
    console.log(`✓ 迁移 ${products.length} 条商品到 ${tableName}`)
  }

  // 清空旧表（保留表结构以防回退）
  await pool.execute('DELETE FROM products')
  console.log('✓ 旧 products 表数据已清空（表结构保留）')
}

/**
 * 迁移：为 products_wine 补充详情页富字段（tagline/images/highlights/source_url）
 */
async function ensureWineRichColumns(pool) {
  await ensureCategoryTable(pool, 'wine')
  const richColumns = [
    { name: 'tagline', sql: "ADD COLUMN tagline VARCHAR(300) DEFAULT '' COMMENT '副标题/宣传语'" },
    { name: 'images', sql: "ADD COLUMN images JSON COMMENT '图片URL列表'" },
    { name: 'highlights', sql: "ADD COLUMN highlights JSON COMMENT '特色亮点列表'" },
    { name: 'source_url', sql: "ADD COLUMN source_url VARCHAR(500) DEFAULT '' COMMENT '数据来源URL'" },
  ]
  for (const col of richColumns) {
    const [cols] = await pool.execute(`SHOW COLUMNS FROM \`products_wine\` LIKE '${col.name}'`)
    if (cols.length === 0) {
      await pool.execute(`ALTER TABLE \`products_wine\` ${col.sql}`)
      console.log(`✓ products_wine 已补充 ${col.name} 字段`)
    }
  }
}

/**
 * 创建目的地场地表（比普通商品表多 city_id 和分类信息字段）
 */
async function ensureDestinationTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`products_destination\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL COMMENT '类内唯一ID',
      name VARCHAR(200) NOT NULL COMMENT '场地名称',
      name_en VARCHAR(200) DEFAULT '' COMMENT '场地英文名',
      description TEXT COMMENT '场地描述',
      image VARCHAR(500) DEFAULT '' COMMENT '图片URL',
      price INT NOT NULL DEFAULT 0 COMMENT '价格',
      unit VARCHAR(10) DEFAULT '€' COMMENT '货币单位',
      capacity VARCHAR(100) DEFAULT '' COMMENT '容纳人数',
      highlight VARCHAR(50) DEFAULT '' COMMENT '标签',
      city_id INT NOT NULL COMMENT '城市ID',
      category_id VARCHAR(50) NOT NULL COMMENT '场地类型ID（如church/manor）',
      category_name VARCHAR(100) DEFAULT '' COMMENT '场地类型中文名',
      category_name_en VARCHAR(100) DEFAULT '' COMMENT '场地类型英文名',
      category_icon VARCHAR(20) DEFAULT '' COMMENT '场地类型图标',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_product_id (product_id),
      INDEX idx_city_id (city_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='目的地场地表'
  `)

  // 迁移：如果旧表缺少 city_id 等字段，自动补充
  const [cols] = await pool.execute("SHOW COLUMNS FROM `products_destination` LIKE 'city_id'")
  if (cols.length === 0) {
    await pool.execute("ALTER TABLE `products_destination` ADD COLUMN city_id INT NOT NULL DEFAULT 0 COMMENT '城市ID' AFTER sort_order")
    await pool.execute("ALTER TABLE `products_destination` ADD COLUMN category_id VARCHAR(50) NOT NULL DEFAULT '' COMMENT '场地类型ID' AFTER city_id")
    await pool.execute("ALTER TABLE `products_destination` ADD COLUMN category_name VARCHAR(100) DEFAULT '' COMMENT '场地类型中文名' AFTER category_id")
    await pool.execute("ALTER TABLE `products_destination` ADD COLUMN category_name_en VARCHAR(100) DEFAULT '' COMMENT '场地类型英文名' AFTER category_name")
    await pool.execute("ALTER TABLE `products_destination` ADD COLUMN category_icon VARCHAR(20) DEFAULT '' COMMENT '场地类型图标' AFTER category_name_en")
    await pool.execute("ALTER TABLE `products_destination` ADD INDEX idx_city_id (city_id)")
    console.log('✓ products_destination 表已补充 city_id/category 字段')
  }
}

/**
 * 种子数据：插入目的地场地
 */
async function seedDestinationVenues(pool) {
  // 检查是否有带 city_id 的有效数据
  const [validCount] = await pool.execute('SELECT COUNT(*) as cnt FROM `products_destination` WHERE city_id > 0')
  if (validCount[0].cnt > 0) return

  // 旧数据无 city_id，清空后重新插入
  await pool.execute('DELETE FROM `products_destination`')

  const venues = [
    // 巴黎 (city_id=1)
    // 教堂
    { product_id: 'sacre-coeur', name: '圣心大教堂', name_en: 'Sacré-Cœur', description: '蒙马特高地上的白色穹顶，俯瞰巴黎全景', image: 'https://images.unsplash.com/photo-1583266560725-0113a0ef5c4c?w=600&h=400&fit=crop', price: 28, unit: '万起/场', capacity: '80-300人', highlight: '热门', city_id: 1, category_id: 'church', category_name: '教堂', category_name_en: 'Church', category_icon: '⛪', sort_order: 1 },
    { product_id: 'notre-dame', name: '巴黎圣母院', name_en: 'Notre-Dame', description: '哥特建筑瑰宝，八百年岁月的神圣殿堂', image: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=600&h=400&fit=crop', price: 45, unit: '万起/场', capacity: '100-500人', highlight: '限定', city_id: 1, category_id: 'church', category_name: '教堂', category_name_en: 'Church', category_icon: '⛪', sort_order: 2 },
    { product_id: 'madeleine', name: '玛德莲教堂', name_en: 'La Madeleine', description: '新古典主义风格，52根科林斯柱环绕', image: 'https://images.unsplash.com/photo-1568624556790-2c2a491e59e0?w=600&h=400&fit=crop', price: 22, unit: '万起/场', capacity: '60-200人', highlight: '', city_id: 1, category_id: 'church', category_name: '教堂', category_name_en: 'Church', category_icon: '⛪', sort_order: 3 },
    { product_id: 'saint-sulpice', name: '圣绪尔皮斯教堂', name_en: 'Saint-Sulpice', description: '巴黎第二大教堂，德拉克洛瓦壁画珍藏', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop', price: 18, unit: '万起/场', capacity: '50-150人', highlight: '', city_id: 1, category_id: 'church', category_name: '教堂', category_name_en: 'Church', category_icon: '⛪', sort_order: 4 },
    // 庄园
    { product_id: 'versailles', name: '凡尔赛宫', name_en: 'Château de Versailles', description: '路易十四的皇家宫殿，镜厅金碧辉煌', image: 'https://images.unsplash.com/photo-1551410224-699683e15636?w=600&h=400&fit=crop', price: 88, unit: '万起/场', capacity: '200-800人', highlight: '限定', city_id: 1, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Château', category_icon: '🏰', sort_order: 1 },
    { product_id: 'vaux', name: '沃子爵城堡', name_en: 'Vaux-le-Vicomte', description: '法式园林鼻祖，千支烛光晚宴', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop', price: 52, unit: '万起/场', capacity: '100-400人', highlight: '热门', city_id: 1, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Château', category_icon: '🏰', sort_order: 2 },
    { product_id: 'chantilly', name: '尚蒂伊城堡', name_en: 'Château de Chantilly', description: '文艺复兴宝库，湖畔浪漫仪式', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop', price: 38, unit: '万起/场', capacity: '80-300人', highlight: '', city_id: 1, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Château', category_icon: '🏰', sort_order: 3 },
    { product_id: 'fontainebleau', name: '枫丹白露宫', name_en: 'Fontainebleau', description: '拿破仑最爱的宫殿，万亩森林环绕', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', price: 42, unit: '万起/场', capacity: '100-350人', highlight: '', city_id: 1, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Château', category_icon: '🏰', sort_order: 4 },
    // 花园
    { product_id: 'luxembourg', name: '卢森堡公园', name_en: 'Jardin du Luxembourg', description: '巴黎人心中最美花园，法式对称美学', image: 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=600&h=400&fit=crop', price: 15, unit: '万起/场', capacity: '30-120人', highlight: '私享', city_id: 1, category_id: 'garden', category_name: '花园', category_name_en: 'Garden', category_icon: '🌿', sort_order: 1 },
    { product_id: 'tuileries', name: '杜乐丽花园', name_en: 'Jardin des Tuileries', description: '卢浮宫旁的皇家花园，协和广场为背景', image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&h=400&fit=crop', price: 20, unit: '万起/场', capacity: '50-200人', highlight: '', city_id: 1, category_id: 'garden', category_name: '花园', category_name_en: 'Garden', category_icon: '🌿', sort_order: 2 },
    { product_id: 'bagatelle', name: '巴加特尔公园', name_en: 'Parc de Bagatelle', description: '玫瑰园仙境，上千品种争艳', image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44d3ea?w=600&h=400&fit=crop', price: 12, unit: '万起/场', capacity: '20-80人', highlight: '私享', city_id: 1, category_id: 'garden', category_name: '花园', category_name_en: 'Garden', category_icon: '🌿', sort_order: 3 },
    // 河畔
    { product_id: 'seine-cruise', name: '塞纳河游船', name_en: 'Seine River Cruise', description: '流动的盛宴，经过埃菲尔与卢浮宫', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop', price: 35, unit: '万起/场', capacity: '60-200人', highlight: '热门', city_id: 1, category_id: 'riverside', category_name: '河畔', category_name_en: 'Riverside', category_icon: '🌊', sort_order: 1 },
    { product_id: 'pont-alexandre', name: '亚历山大三世桥', name_en: 'Pont Alexandre III', description: '巴黎最华丽的桥梁，金色雕塑与灯柱', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop', price: 25, unit: '万起/场', capacity: '40-150人', highlight: '', city_id: 1, category_id: 'riverside', category_name: '河畔', category_name_en: 'Riverside', category_icon: '🌊', sort_order: 2 },
    { product_id: 'ile-saint-louis', name: '圣路易岛', name_en: 'Île Saint-Louis', description: '塞纳河心的静谧小岛，私密仪式感', image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600&h=400&fit=crop', price: 18, unit: '万起/场', capacity: '20-60人', highlight: '私享', city_id: 1, category_id: 'riverside', category_name: '河畔', category_name_en: 'Riverside', category_icon: '🌊', sort_order: 3 },
    // 克罗地亚 (city_id=13)
    { product_id: 'hvar-island', name: 'Hvar岛', name_en: 'Hvar Island', description: '薰衣草田与亚得里亚海的梦幻岛屿，超小型私密婚礼圣地', image: 'https://images.unsplash.com/photo-1555990538-1e15d9b8730d?w=600&h=400&fit=crop', price: 5900, unit: '€', capacity: '2-20人', highlight: '热门', city_id: 13, category_id: 'island', category_name: '海岛', category_name_en: 'Island', category_icon: '🏝️', sort_order: 1 },
    { product_id: 'hvar-museum', name: 'Hvar博物馆', name_en: 'Hvar Museum', description: '古城历史博物馆，独特的婚纱拍照场地', image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&h=400&fit=crop', price: 50, unit: '€', capacity: '2-10人', highlight: '小众', city_id: 13, category_id: 'museum', category_name: '博物馆', category_name_en: 'Museum', category_icon: '🏛️', sort_order: 1 },
    // 瑞士 (city_id=14)
    { product_id: 'zurich-lake', name: '苏黎世湖畔花园', name_en: 'Lake Zürich Garden', description: '阿尔卑斯雪山倒映湖面，湖畔草坪上的纯净仪式', image: 'https://images.unsplash.com/photo-1530841377372-592672784221?w=600&h=400&fit=crop', price: 32, unit: '万起/场', capacity: '50-150人', highlight: '热门', city_id: 14, category_id: 'lakeside', category_name: '湖畔', category_name_en: 'Lakeside', category_icon: '🏞️', sort_order: 1 },
    { product_id: 'geneva-lake', name: '日内瓦湖庄园', name_en: 'Lake Geneva Manor', description: '日内瓦湖畔百年庄园，喷泉与雪山为背景', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=400&fit=crop', price: 58, unit: '万起/场', capacity: '80-200人', highlight: '限定', city_id: 14, category_id: 'lakeside', category_name: '湖畔', category_name_en: 'Lakeside', category_icon: '🏞️', sort_order: 2 },
    { product_id: 'jungfrau', name: '少女峰山麓教堂', name_en: 'Jungfrau Alpine Chapel', description: '少女峰脚下的百年教堂，雪山草甸环绕的童话婚礼', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&h=400&fit=crop', price: 25, unit: '万起/场', capacity: '30-100人', highlight: '推荐', city_id: 14, category_id: 'alpine', category_name: '雪山', category_name_en: 'Alpine', category_icon: '🏔️', sort_order: 1 },
    { product_id: 'matterhorn', name: '马特洪峰观景台', name_en: 'Matterhorn View Terrace', description: '三角峰顶的震撼全景，云端之上的极致仪式体验', image: 'https://images.unsplash.com/photo-1609948543765-5c4b8d5d5f8a?w=600&h=400&fit=crop', price: 45, unit: '万起/场', capacity: '20-60人', highlight: '限定', city_id: 14, category_id: 'alpine', category_name: '雪山', category_name_en: 'Alpine', category_icon: '🏔️', sort_order: 2 },
    { product_id: 'burgenstock', name: '布尔根施托克度假村', name_en: 'Bürgenstock Resort', description: '卢塞恩湖畔悬崖上的百年奢华酒店，俯瞰四森林州湖', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop', price: 68, unit: '万起/场', capacity: '60-250人', highlight: '热门', city_id: 14, category_id: 'swiss-hotel', category_name: '酒店', category_name_en: 'Hotel & Resort', category_icon: '🏨', sort_order: 1 },
    { product_id: 'giessbach', name: '吉斯巴赫大酒店', name_en: 'Hotel Giessbach', description: '瀑布旁的湖畔宫殿，乘船方可抵达的隐秘婚礼圣地', image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop', price: 42, unit: '万起/场', capacity: '40-120人', highlight: '', city_id: 14, category_id: 'swiss-hotel', category_name: '酒店', category_name_en: 'Hotel & Resort', category_icon: '🏨', sort_order: 2 },
    // 波尔多 (city_id=15)
    // 庄园
    { product_id: 'chateau-valouze', name: '瓦卢兹城堡', name_en: 'Château de la Valouze', description: '波尔多乡野间的百年庄园，43间卧室可容纳96人住宿。Grand Hall可举办150人晚宴或200人派对，配有地下爵士吧、Black Swan夜店、泳池及34公顷公园', image: 'https://smp-is.stylemepretty.com/uploads/portfolio/511492/hyepjvq$!1200x.jpg', price: 0, unit: '——', capacity: '96-200人', highlight: '', city_id: 15, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Château', category_icon: '🏰', sort_order: 1 },
    // 都柏林 (city_id=16)
    { product_id: 'luttrellstown-castle', name: '拉特雷尔斯敦城堡', name_en: 'Luttrellstown Castle', description: '都柏林近郊的专属城堡庄园，适合独家婚礼派对、商务活动及影视拍摄，中世纪建筑与翡翠绿茵交相辉映', image: 'https://smp-is.stylemepretty.com/uploads/lbb/default-listing$!1200x.png', price: 0, unit: '——', capacity: '——', highlight: '', city_id: 16, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Château', category_icon: '🏰', sort_order: 1 },
    // 纽约 (city_id=17)
    { product_id: 'lake-house-canandaigua', name: '卡南代瓜湖畔庄园', name_en: 'The Lake House on Canandaigua', description: '纽约指金湖畔的顶级度假胜地，拥有专属婚礼策划师、精致花园、湖畔场地与世界级餐饮，打造难忘的婚礼周末体验', image: 'https://smp-is.stylemepretty.com/uploads/portfolio/556707/1js5j86$!1200x.JPG', price: 0, unit: '——', capacity: '——', highlight: '', city_id: 17, category_id: 'lakeside', category_name: '湖畔', category_name_en: 'Lakeside', category_icon: '🏞️', sort_order: 1 },
    // 坦帕 (city_id=18)
    { product_id: 'mill-pond-estate', name: '磨坊池塘庄园', name_en: 'Mill Pond Estate', description: '坦帕户外婚礼场地，灵感丰富的户外仪式与接待空间，每年限量接待新人，专注打造个性化婚礼体验', image: 'https://smp-is.stylemepretty.com/uploads/portfolio/547814/2tu2pyvjq$!1200x.jpg', price: 0, unit: '——', capacity: '——', highlight: '', city_id: 18, category_id: 'manor', category_name: '庄园', category_name_en: 'Manor & Estate', category_icon: '🏰', sort_order: 1 },
    // 科德角 (city_id=19)
    { product_id: 'wychmere-beach-club', name: '威奇米尔海滩俱乐部', name_en: 'Wychmere Beach Club', description: '科德角海滨度假胜地，将新英格兰经典美式风格与航海优雅完美融合，海景露台与海滨仪式场地提供绝美背景', image: 'https://smp-is.stylemepretty.com/uploads/portfolio/570081/40vobao$!1200x.jpg', price: 0, unit: '——', capacity: '——', highlight: '', city_id: 19, category_id: 'hotel', category_name: '度假村', category_name_en: 'Resort & Club', category_icon: '🏨', sort_order: 1 },
    // 帕克城 (city_id=20)
    { product_id: 'river-bottoms-ranch', name: '河滩牧场', name_en: 'River Bottoms Ranch', description: '落基山脉脚下的现代农舍风格牧场，白色谷仓大厅可容纳175位晚宴或300位派对嘉宾，360度山谷、河流与雪山全景', image: 'https://smp-is.stylemepretty.com/uploads/portfolio/532904/41q3uvx$!1200x.JPG', price: 0, unit: '——', capacity: '175-300人', highlight: '', city_id: 20, category_id: 'manor', category_name: '庄园', category_name_en: 'Ranch & Estate', category_icon: '🏰', sort_order: 1 },
  ]

  for (const v of venues) {
    await pool.execute(
      `INSERT INTO \`products_destination\` (product_id, name, name_en, description, image, price, unit, capacity, highlight, city_id, category_id, category_name, category_name_en, category_icon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.product_id, v.name, v.name_en, v.description, v.image, v.price, v.unit, v.capacity, v.highlight, v.city_id, v.category_id, v.category_name, v.category_name_en, v.category_icon, v.sort_order]
    )
  }
  console.log(`✓ 目的地场地种子数据已插入（${venues.length} 条）`)
}

/**
 * 创建爬取目的地试验表
 */
async function ensureCrawledDestinationsTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_destinations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL COMMENT 'URL标识，如 amalfi-coast',
      name VARCHAR(200) NOT NULL COMMENT '目的地英文名',
      name_cn VARCHAR(200) DEFAULT '' COMMENT '目的地中文名',
      country VARCHAR(100) DEFAULT '' COMMENT '国家英文名',
      country_cn VARCHAR(100) DEFAULT '' COMMENT '国家中文名',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      tagline VARCHAR(300) DEFAULT '' COMMENT '副标题/宣传语',
      description TEXT COMMENT '完整描述文案',
      features JSON COMMENT '特色亮点（JSON数组）',
      venue_types JSON COMMENT '可用场地类型（JSON数组）',
      towns JSON COMMENT '提及的城镇（JSON数组）',
      images JSON COMMENT '图片URL列表（JSON数组）',
      budget_ranges JSON COMMENT '预算区间（JSON数组）',
      guest_capacities JSON COMMENT '宾客人数选项（JSON数组）',
      faq JSON COMMENT '常见问题（JSON数组）',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_country (country)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取目的地试验表'
  `)
  console.log('✓ 表 crawled_destinations 已就绪')
}

/**
 * 种子数据：插入爬取的目的地
 */
async function seedCrawledDestinations(pool) {
  const [count] = await pool.execute('SELECT COUNT(*) as cnt FROM crawled_destinations')
  if (count[0].cnt > 0) {
    // 已有数据，检查是否需要更新英文内容
    await updateCrawledDestinationsCN(pool)
    // 插入新增的目的地
    await insertNewCrawledDestinations(pool)
    return
  }

  const destinations = [
    {
      slug: 'amalfi-coast',
      name: 'Amalfi Coast',
      name_cn: '阿马尔菲海岸',
      country: 'Italy',
      country_cn: '意大利',
      source_url: 'https://italiandestinationweddings.com/destinations/amalfi-coast/',
      tagline: '在意大利的阳光下庆祝爱情',
      description: `想象一下，在地中海蔚蓝海水上方的悬崖露台上交换誓言，空气中弥漫着茉莉和柑橘花的芬芳。想象你的婚宴沐浴在金色夕阳的光辉中，海浪拍岸的节奏声化作自然的小夜曲。这一切，都在阿马尔菲海岸等你——一个无与伦比的婚礼目的地。

这条壮丽的海岸线上，古朴的村庄依偎在崎岖的悬崖间，为你的特别日子提供了千变万化的体验。无论你梦想在隐秘的小海湾举办亲密仪式，还是在历史别墅中举行盛大庆典，阿马尔菲海岸的婚礼策划都能满足你的每一个愿望。

除了令人叹为观止的风景，你还能体验意大利文化的热情与活力。漫步波西塔诺和阿马尔菲等迷人小镇，鹅卵石街道两旁是五彩缤纷的商店和咖啡馆。沉浸在丰富的历史中，从古代遗迹到迷人的教堂，每一处都在诉说着往昔的故事。

尽情品味该地区 renowned 的美食，以新鲜海鲜和当地农产品闻名。从精致的卡普雷塞沙拉到美味的意大利面，你的婚礼菜单将是一曲意大利风味的交响乐，完美衬托周围的美景。

阿马尔菲海岸提供的不仅仅是一个婚礼日，更是为你和宾客打造一段难忘的旅程。乘船探索隐秘的小海湾和僻静海滩，沿着壮丽的海岸线徒步旅行，或者只是在原始的海滩上放松身心，享受阳光。

将你的爱情故事编织进阿马尔菲海岸的婚礼画卷中。让这个非凡目的地的魔力，创造持续一生的美好回忆。`,
      features: JSON.stringify([
        '悬崖露台仪式，俯瞰地中海蔚蓝海水',
        '茉莉和柑橘花香弥漫的空气',
        '金色日落光辉中的招待会',
        '海浪拍岸的自然小夜曲',
        '古朴村庄依偎在崎岖悬崖上',
        '隐秘小海湾的亲密仪式或历史别墅的盛大庆典',
        '丰富的历史：从古代遗迹到迷人的教堂',
        '著名美食：新鲜海鲜、当地农产品、卡普雷塞沙拉、意大利面',
        '乘船探索隐秘小海湾和僻静海滩',
        '沿壮观海岸线的徒步旅行',
        '众多原始海滩'
      ]),
      venue_types: JSON.stringify([
        { name: '悬崖露台', name_en: 'Cliffside Terrace' },
        { name: '隐秘小海湾', name_en: 'Hidden Cove' },
        { name: '历史别墅', name_en: 'Historic Villa' },
        { name: '专属婚礼别墅', name_en: 'Exclusive Wedding Villa' },
        { name: '海滩', name_en: 'Beach' }
      ]),
      towns: JSON.stringify([
        { name: 'Positano', name_cn: '波西塔诺' },
        { name: 'Amalfi', name_cn: '阿马尔菲' }
      ]),
      images: JSON.stringify([
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-2.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-3.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-4.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-5.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-6.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-7.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-8.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-10.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-9.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-11.jpg'
      ]),
      budget_ranges: JSON.stringify([
        { label: '4万 - 8万欧元', min: 40000, max: 80000 },
        { label: '8万 - 15万欧元', min: 80000, max: 150000 },
        { label: '15万 - 25万欧元', min: 150000, max: 250000 },
        { label: '25万 - 50万欧元', min: 250000, max: 500000 },
        { label: '50万欧元以上', min: 500000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上']),
      cover_image: 'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-amalfi-coast-1.jpg',
      sort_order: 1
    }
  ]

  for (const d of destinations) {
    await pool.execute(
      `INSERT INTO crawled_destinations (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, faq, cover_image, cover_image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.slug, d.name, d.name_cn, d.country, d.country_cn, d.source_url, d.tagline, d.description, d.features, d.venue_types, d.towns, d.images, d.budget_ranges, d.guest_capacities, d.faq || null, d.cover_image, d.cover_image_url || d.cover_image, d.sort_order]
    )
  }
  console.log(`✓ 爬取目的地种子数据已插入（${destinations.length} 条）`)
}

/**
 * 更新已有爬取目的地数据为中文
 */
async function updateCrawledDestinationsCN(pool) {
  const [rows] = await pool.execute("SELECT id, tagline, description, budget_ranges FROM crawled_destinations WHERE slug = 'amalfi-coast'")
  if (rows.length === 0) return
  const row = rows[0]

  // 如果已经是中文则跳过
  if (row.tagline && row.tagline.includes('阳光')) return

  await pool.execute(
    `UPDATE crawled_destinations SET tagline = ?, description = ?, budget_ranges = ?, guest_capacities = ? WHERE slug = 'amalfi-coast'`,
    [
      '在意大利的阳光下庆祝爱情',
      `想象一下，在地中海蔚蓝海水上方的悬崖露台上交换誓言，空气中弥漫着茉莉和柑橘花的芬芳。想象你的婚宴沐浴在金色夕阳的光辉中，海浪拍岸的节奏声化作自然的小夜曲。这一切，都在阿马尔菲海岸等你——一个无与伦比的婚礼目的地。\n\n这条壮丽的海岸线上，古朴的村庄依偎在崎岖的悬崖间，为你的特别日子提供了千变万化的体验。无论你梦想在隐秘的小海湾举办亲密仪式，还是在历史别墅中举行盛大庆典，阿马尔菲海岸的婚礼策划都能满足你的每一个愿望。\n\n除了令人叹为观止的风景，你还能体验意大利文化的热情与活力。漫步波西塔诺和阿马尔菲等迷人小镇，鹅卵石街道两旁是五彩缤纷的商店和咖啡馆。沉浸在丰富的历史中，从古代遗迹到迷人的教堂，每一处都在诉说着往昔的故事。\n\n尽情品味该地区 renowned 的美食，以新鲜海鲜和当地农产品闻名。从精致的卡普雷塞沙拉到美味的意大利面，你的婚礼菜单将是一曲意大利风味的交响乐，完美衬托周围的美景。\n\n阿马尔菲海岸提供的不仅仅是一个婚礼日，更是为你和宾客打造一段难忘的旅程。乘船探索隐秘的小海湾和僻静海滩，沿着壮丽的海岸线徒步旅行，或者只是在原始的海滩上放松身心，享受阳光。\n\n将你的爱情故事编织进阿马尔菲海岸的婚礼画卷中。让这个非凡目的地的魔力，创造持续一生的美好回忆。`,
      JSON.stringify([
        { label: '4万 - 8万欧元', min: 40000, max: 80000 },
        { label: '8万 - 15万欧元', min: 80000, max: 150000 },
        { label: '15万 - 25万欧元', min: 150000, max: 250000 },
        { label: '25万 - 50万欧元', min: 250000, max: 500000 },
        { label: '50万欧元以上', min: 500000, max: null }
      ]),
      JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])
    ]
  )
  console.log('✓ 爬取目的地数据已更新为中文')
}

/**
 * 插入新增的爬取目的地（跳过已存在的）
 */
async function insertNewCrawledDestinations(pool) {
  const budgetRanges = JSON.stringify([
    { label: '4万 - 8万欧元', min: 40000, max: 80000 },
    { label: '8万 - 15万欧元', min: 80000, max: 150000 },
    { label: '15万 - 25万欧元', min: 150000, max: 250000 },
    { label: '25万 - 50万欧元', min: 250000, max: 500000 },
    { label: '50万欧元以上', min: 500000, max: null }
  ])
  const guestCapacities = JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上'])

  const newDests = [
    {
      slug: 'lake-como',
      name: 'Lake Como', name_cn: '科莫湖',
      country: 'Italy', country_cn: '意大利',
      source_url: 'https://italiandestinationweddings.com/destinations/lake-como/',
      tagline: '在迷人的科莫湖见证童话般的婚礼',
      description: `依偎在意大利阿尔卑斯山脚下的科莫湖，为你的梦想婚礼提供了令人叹为观止的背景。这个风景如画的目的地深受名人和新人的喜爱，不仅仅是一个令人惊叹的地点，更是一种在心底久久回荡的体验。\n\n想象一下在迷人的湖畔露台上交换誓言，微风轻拂，夕阳将水面染成金色和蓝宝石般的色彩。想象你的婚宴在星空下举行，闪烁的灯光如同百万萤火虫点缀着天鹅绒般的夜空。科莫湖的精致之美为难忘的时刻提供了画布，让你的婚礼成为一件视觉杰作。\n\n除了美景，科莫湖还拥有丰富的文化底蕴和热情好客的氛围。奢华的历史别墅配以华丽的花园，增添了一抹宏伟气派，而迷人的当地小餐馆则散发着质朴的优雅。无论你憧憬亲密的聚会还是盛大的庆典，科莫湖都能满足你的每一个愿望。\n\n该地区的美食场景同样令人赞叹。以新鲜当地食材和精致烹饪闻名，意大利美食在这里绽放光彩。从精致的湖鱼菜肴到奢华的意面创意，你的科莫湖婚礼菜单将是一曲风味的交响乐，挑动宾客的味蕾。\n\n科莫湖的魅力远不止婚礼当天。周边地区提供丰富的婚前和婚后活动，从探索贝拉焦和瓦伦纳等迷人村庄，到在闪烁的湖面上开启浪漫的游船之旅。你的宾客可以沉浸在丰富的历史中，品味当地美食，在这个田园诗般的地方创造持久的回忆。`,
      features: JSON.stringify([
        '阿尔卑斯山脚下的壮丽背景',
        '迷人的湖畔露台仪式',
        '奢华历史别墅配以华丽花园',
        '质朴优雅的当地餐馆',
        '新鲜当地食材的意大利美食',
        '婚前婚后丰富活动：村庄探索、游船之旅',
        '亲密聚会或盛大庆典皆宜'
      ]),
      venue_types: JSON.stringify([
        { name: '湖畔历史别墅', name_en: 'Lakeside Villa' },
        { name: '城堡', name_en: 'Castle' },
        { name: '酒店', name_en: 'Hotel' },
        { name: '湖畔餐厅', name_en: 'Trattoria' }
      ]),
      towns: JSON.stringify([
        { name: 'Bellagio', name_cn: '贝拉焦' },
        { name: 'Varenna', name_cn: '瓦伦纳' }
      ]),
      images: JSON.stringify([
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-header.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-3.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-2.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-7.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-6.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-5.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-8.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-4.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/02/lake-como.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/03/lake-como-2-1.jpg'
      ]),
      budget_ranges: budgetRanges,
      guest_capacities: guestCapacities,
      cover_image: 'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-lake-como-header.jpg',
      sort_order: 2
    },
    {
      slug: 'tuscany',
      name: 'Tuscany', name_cn: '托斯卡纳',
      country: 'Italy', country_cn: '意大利',
      source_url: 'https://italiandestinationweddings.com/destinations/tuscany/',
      tagline: '在起伏山丘与阳光葡萄园间说"我愿意"',
      description: `步入一幅文艺复兴油画般的场景，在托斯卡纳的心脏地带庆祝你们的爱情故事。这片迷人的地区以其起伏的山丘、阳光普照的葡萄园和迷人的中世纪小镇而闻名，提供了一场沉浸在浪漫与永恒之美中的婚礼体验。\n\n想象一下在橄榄树林和柏树交织的画卷中说"我愿意"，托斯卡纳的阳光温暖着你的面庞，微风带着薰衣草和野花的芬芳。想象你的婚宴在闪烁的灯光天篷下，沐浴在金色夕阳的光辉中，欢声笑语充满空气。托斯卡纳迷人的风景提供了如画的背景，将你的婚礼变成童话成真。\n\n除了视觉魅力，托斯卡纳拥有丰富的历史和温暖好客的氛围。历史城堡和古老别墅以其质朴的优雅和迷人的故事，为你的庆典提供了独特的场地。无论你梦想在迷人的葡萄园中举行亲密仪式，还是在宏伟城堡中举办盛大庆典，托斯卡纳都能满足你的每一个愿望。\n\n该地区的美食场景同样提升了你的婚礼体验。新鲜当地食材和传统烹饪方法创造出风味交响乐。从美味的意面到多汁的烤肉和精致的甜点，你的婚礼菜单将真正体现托斯卡纳的美食传承。\n\n托斯卡纳的魅力远不止婚礼当天。探索锡耶纳和圣吉米尼亚诺等迷人村庄，乘坐热气球在起伏山丘上空漫游，或在当地葡萄园品酒。你的宾客可以创造持久的回忆，发现托斯卡纳丰富的历史、令人叹为观止的美景和美酒美食。`,
      features: JSON.stringify([
        '起伏山丘、阳光葡萄园、中世纪小镇',
        '橄榄树林和柏树',
        '历史城堡和古老别墅',
        '新鲜当地食材的托斯卡纳美食',
        '葡萄酒文化：品酒、葡萄园之旅、葡萄酒主题婚礼',
        '热气球漫游起伏山丘',
        '亲密仪式或盛大庆典皆宜'
      ]),
      venue_types: JSON.stringify([
        { name: '葡萄园城堡', name_en: 'Vineyard Castle' },
        { name: '别墅', name_en: 'Villa' },
        { name: '中世纪村庄', name_en: 'Borgo' },
        { name: '葡萄园庄园', name_en: 'Vineyard Estate' }
      ]),
      towns: JSON.stringify([
        { name: 'Siena', name_cn: '锡耶纳' },
        { name: 'San Gimignano', name_cn: '圣吉米尼亚诺' }
      ]),
      images: JSON.stringify([
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-header.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-2.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-3.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-8.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-10.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-9.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-5.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-12.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-11.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-6-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/02/tuscany.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-7.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-4-1.jpg'
      ]),
      budget_ranges: budgetRanges,
      guest_capacities: guestCapacities,
      cover_image: 'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-tuscany-header.jpg',
      sort_order: 3
    },
    {
      slug: 'sicily',
      name: 'Sicily', name_cn: '西西里',
      country: 'Italy', country_cn: '意大利',
      source_url: 'https://italiandestinationweddings.com/destinations/sicily/',
      tagline: '西西里交响曲——当爱情故事遇上历史与魔法',
      description: `站在历史的中心，阳光普照的广场上。感受西西里温暖的阳光洒在肌肤上，传统小夜曲的旋律编织出迷人的画卷环绕着你的誓言。\n\n想象你的婚宴在古老城堡的墙壁间展开，亲人的欢声笑语在繁星闪烁的夜空下回荡。这一切都在西西里等着你——一座浪漫、历史和迷人之美交织成 symphony 的岛屿。\n\n西西里为你的婚礼日提供了万花筒般的体验。探索点缀着迷人渔村的戏剧性海岸线，见证埃特纳火山令人敬畏的壮丽身影，或沉浸在充满活力的城市能量中。无论你梦想在僻静海滩上举行亲密仪式，还是在华丽的巴洛克宫殿中举办盛大庆典，这座岛屿都能满足你的每一个愿望。\n\n除了视觉盛宴，深入探索西西里丰富的文化画卷。探索诉说着遗忘时代故事的古代遗迹，漫步在充满当地珍宝的热闹集市，拥抱定义西西里人民的热情好客。沉浸在传统音乐的悠扬声中，见证充满激情与活力的民间传统。\n\n尽情品味该地区的美食场景——新鲜地中海风味与世代相传的古老烹饪传统的活力融合。从展示周围水域丰饶的精致海鲜菜肴到丰盛的意面和美味的当地奶酪，你的西西里婚礼菜单将是一曲味觉与芬芳的交响乐。\n\n西西里提供的不仅仅是一个婚礼日，更是为你和宾客打造的难忘发现之旅。探索隐秘小海湾和迷人村庄，踏上埃特纳火山的冒险徒步，或只是在原始海滩上放松身心。`,
      features: JSON.stringify([
        '戏剧性海岸线与迷人渔村',
        '埃特纳火山壮丽景观',
        '古代遗迹与热闹集市',
        '传统音乐与民间传统',
        '新鲜地中海美食：海鲜、意面、当地奶酪',
        '隐秘小海湾与原始海滩',
        '巴洛克宫殿',
        '埃特纳火山徒步冒险'
      ]),
      venue_types: JSON.stringify([
        { name: '古堡', name_en: 'Castle' },
        { name: '别墅', name_en: 'Villa' },
        { name: '花园', name_en: 'Garden' },
        { name: '巴洛克宫殿', name_en: 'Baroque Palace' },
        { name: '海滩', name_en: 'Beach' }
      ]),
      towns: JSON.stringify([
        { name: 'Taormina', name_cn: '陶尔米纳' },
        { name: 'Catania', name_cn: '卡塔尼亚' }
      ]),
      images: JSON.stringify([
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-2.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-3.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-4.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-5.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-7.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-6.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/03/sicily-1-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/03/sicily-2-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/03/sicily-3-1.jpg'
      ]),
      budget_ranges: budgetRanges,
      guest_capacities: guestCapacities,
      cover_image: 'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-sicily-1.jpg',
      sort_order: 4
    },
    {
      slug: 'apulia',
      name: 'Apulia', name_cn: '普利亚',
      country: 'Italy', country_cn: '意大利',
      source_url: 'https://italiandestinationweddings.com/destinations/apulia/',
      tagline: '在普利亚，质朴魅力与永恒之美绽放，为爱情故事绘就完美画卷',
      description: `想象在古老橄榄树的树荫下低语你的誓言，树叶轻轻摇曳，织成一片自然的爱情天篷。想象你的婚宴在迷人的马塞里亚庄园中心举行，温暖的灯笼光芒照亮欢声笑语，繁星在清澈的夜空中闪烁。这一切都在普利亚等着你——一片质朴魅力与田园风光完美融合的土地，打造一场沉浸在传统与永恒之美中的婚礼体验。\n\n普利亚为你的特别日子展现了一幅迷人的多元景观画卷。探索坐落在悬崖之上的洁白村庄，俯瞰着闪烁的亚得里亚海。漫步在无尽的葡萄园和橄榄树林点缀的起伏山丘间，或穿梭在莱切和奥斯图尼等历史名城的活力街道，每一处都充满了文化瑰宝。无论你梦想在僻静海滩上举行亲密仪式，还是在修复的马塞里亚庄园中举办盛大庆典，普利亚都为你的爱情故事展开提供了真实而难忘的背景。\n\n除了视觉魅力，沉浸在普利亚温暖而丰富的文化中。见证热情的民间传统通过动人的舞蹈和迷人的当地音乐焕发活力，体验定义该地区的热情好客。探索古代遗迹和中世纪城堡，每一处都诉说着往昔的故事。\n\n尽情品味该地区精致的美食场景——庆祝新鲜时令食材和世代相传的传统烹饪方法。从展示亚得里亚海丰饶的精致海鲜菜肴到丰盛的意面和美味的当地奶酪，你的婚礼菜单将是一曲味觉与芬芳的交响乐。\n\n普利亚提供的不仅仅是一个婚礼日，更是为你和宾客打造的难忘发现之旅。探索隐秘小海湾和迷人村庄，在风景如画的乡间骑行，或只是在原始海滩上放松身心。`,
      features: JSON.stringify([
        '古老橄榄树作为天然天篷',
        '迷人的马塞里亚庄园，灯笼映照的招待会',
        '亚得里亚海悬崖上的洁白村庄',
        '葡萄园和橄榄树林的起伏山丘',
        '热情的民间传统：舞蹈与音乐',
        '古代遗迹和中世纪城堡',
        '新鲜时令美食：亚得里亚海鲜、意面、当地奶酪',
        '隐秘小海湾和原始海滩',
        '乡间骑行游览',
        '名人之选（贾斯汀·汀布莱克婚礼举办地）'
      ]),
      venue_types: JSON.stringify([
        { name: '城堡', name_en: 'Castle' },
        { name: '马塞里亚庄园', name_en: 'Masseria' },
        { name: '海滩', name_en: 'Beach' },
        { name: '别墅', name_en: 'Villa' }
      ]),
      towns: JSON.stringify([
        { name: 'Lecce', name_cn: '莱切' },
        { name: 'Ostuni', name_cn: '奥斯图尼' }
      ]),
      images: JSON.stringify([
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-3.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-6.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-2.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-5.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-8.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/03/apulia-2-1.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-7.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-4.jpg',
        'https://italiandestinationweddings.com/wp-content/uploads/2023/03/apulia-3-1.jpg'
      ]),
      budget_ranges: budgetRanges,
      guest_capacities: guestCapacities,
      cover_image: 'https://italiandestinationweddings.com/wp-content/uploads/2024/04/Italiandestinationweddings-destinations-apulia-1.jpg',
      sort_order: 5
    },
    // ===== 法国目的地 =====
    {
      slug: 'provence',
      name: 'Provence', name_cn: '普罗旺斯',
      country: 'France', country_cn: '法国',
      source_url: 'https://www.frenchdestinationwedding.com/wedding-destinations/provence/',
      tagline: '在薰衣草花海与阳光田园间，书写永恒的爱情篇章',
      description: `想象一下，在普罗旺斯紫色的薰衣草田中交换誓言，空气中弥漫着薰衣草和迷迭香的芬芳。想象你的婚宴在古老的石头庄园中举行，阳光透过百年梧桐树洒下斑驳的光影。这一切，都在普罗旺斯等着你——一个将浪漫融入每一寸土地的地方。\n\n这片位于法国东南部的梦幻之地，以其起伏的薰衣草田、阳光普照的葡萄园和迷人的中世纪村庄而闻名。在这里，每一条乡间小路都通向一幅油画般的风景，每一座古老的石头建筑都承载着几个世纪的故事。\n\n普罗旺斯为你的婚礼提供了无限可能。在私人庄园中举办亲密的乡村风格庆典，或在修复的文艺复兴城堡中举行盛大仪式。无论你的梦想是质朴的田园婚礼还是优雅的法式盛宴，这片土地都能完美实现。\n\n美食方面，普罗旺斯以新鲜时令食材、橄榄油、香草和地中海风味闻名。你的婚礼菜单将是一场味蕾的普罗旺斯之旅，从精致的南法料理到醇厚的当地葡萄酒，每一口都是对美好生活的礼赞。`,
      features: JSON.stringify([
        '紫色薰衣草田中的浪漫仪式',
        '空气中弥漫薰衣草与迷迭香芬芳',
        '古老石头庄园中的婚宴',
        '百年梧桐树下的斑驳光影',
        '中世纪村庄与文艺复兴城堡',
        '南法乡村风格或优雅法式盛宴',
        '新鲜时令食材与普罗旺斯美食',
        '醇厚的当地葡萄酒文化'
      ]),
      venue_types: JSON.stringify([
        { name: '石头庄园', name_en: 'Mas (Stone Farmhouse)' },
        { name: '文艺复兴城堡', name_en: 'Renaissance Castle' },
        { name: '葡萄园庄园', name_en: 'Vineyard Estate' },
        { name: '薰衣草花园', name_en: 'Lavender Garden' }
      ]),
      towns: JSON.stringify([
        { name: 'Gordes', name_cn: '戈尔德' },
        { name: 'Roussillon', name_cn: '鲁西永' },
        { name: 'Aix-en-Provence', name_cn: '艾克斯' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1200',
        'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1200',
        'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200',
        'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1200',
        'https://images.unsplash.com/photo-1559827260-dc66d5281a48?w=1200'
      ]),
      budget_ranges: JSON.stringify([
        { label: '3万 - 6万欧元', min: 30000, max: 60000 },
        { label: '6万 - 12万欧元', min: 60000, max: 120000 },
        { label: '12万 - 20万欧元', min: 120000, max: 200000 },
        { label: '20万欧元以上', min: 200000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-30人', '30-60人', '60-100人', '100人以上']),
      cover_image: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1200',
      sort_order: 10
    },
    {
      slug: 'french-riviera',
      name: 'French Riviera', name_cn: '蔚蓝海岸',
      country: 'France', country_cn: '法国',
      source_url: 'https://www.frenchdestinationwedding.com/wedding-destinations/french-riviera/',
      tagline: '在地中海的蔚蓝海岸线上，让爱情与海天一色',
      description: `想象在法国蔚蓝海岸的奢华露台上，俯瞰地中海的碧蓝海水交换誓言。海风轻柔地拂过面庞，阳光在波光粼粼的海面上跳跃，远处是尼斯和戛纳迷人的天际线。\n\n蔚蓝海岸是世界上最负盛名的婚礼目的地之一。这里汇聚了奢华与自然的完美结合——从摩纳哥的皇家气派到圣特罗佩的波西米亚风情，从戛纳的电影 glamour 到尼斯的老城魅力。\n\n在悬崖上的私人别墅中举办亲密仪式，或在五星级宫殿酒店中举行盛大庆典。你的婚宴可以是海滩上的浪漫晚宴，也可以是山顶露台上的星光派对。\n\n蔚蓝海岸的美食融合了普罗旺斯的田园风味与地中海的鲜美。新鲜海鲜、精致法餐和顶级香槟，为你的婚礼增添无与伦比的味觉享受。`,
      features: JSON.stringify([
        '地中海碧蓝海水的悬崖露台仪式',
        '尼斯、戛纳、圣特罗佩的迷人天际线',
        '奢华私人别墅或宫殿酒店',
        '海滩浪漫晚宴或山顶星光派对',
        '摩纳哥的皇家气派',
        '精致法餐与顶级香槟',
        '世界顶级婚礼目的地',
        '全年温和的地中海气候'
      ]),
      venue_types: JSON.stringify([
        { name: '悬崖别墅', name_en: 'Cliffside Villa' },
        { name: '宫殿酒店', name_en: 'Palace Hotel' },
        { name: '海滩', name_en: 'Beach' },
        { name: '游艇', name_en: 'Yacht' }
      ]),
      towns: JSON.stringify([
        { name: 'Nice', name_cn: '尼斯' },
        { name: 'Cannes', name_cn: '戛纳' },
        { name: 'Saint-Tropez', name_cn: '圣特罗佩' },
        { name: 'Monaco', name_cn: '摩纳哥' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200',
        'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=1200',
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200'
      ]),
      budget_ranges: JSON.stringify([
        { label: '5万 - 10万欧元', min: 50000, max: 100000 },
        { label: '10万 - 20万欧元', min: 100000, max: 200000 },
        { label: '20万 - 40万欧元', min: 200000, max: 400000 },
        { label: '40万欧元以上', min: 400000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-30人', '30-60人', '60-100人', '100人以上']),
      cover_image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1200',
      sort_order: 11
    },
    {
      slug: 'paris',
      name: 'Paris', name_cn: '巴黎',
      country: 'France', country_cn: '法国',
      source_url: 'https://www.frenchdestinationwedding.com/wedding-destinations/paris/',
      tagline: '在光之城，让埃菲尔铁塔见证你们的永恒之约',
      description: `巴黎，光之城，全世界最浪漫的首都。想象在埃菲尔铁塔的璀璨灯光下交换誓言，塞纳河的柔波倒映着你们的幸福笑容。\n\n这座城市本身就是爱情的象征。从卢浮宫的艺术瑰宝到巴黎圣母院的哥特式庄严，从香榭丽舍大街的优雅到蒙马特的艺术气息，巴黎的每一个角落都在诉说着浪漫的故事。\n\n在塞纳河畔的私人公馆中举办优雅的法式婚宴，或在五星級历史宫殿酒店中举行盛大庆典。你的婚礼可以是在凡尔赛宫镜厅中的皇家盛宴，也可以是在蒙马特小教堂旁的温馨聚会。\n\n巴黎的美食代表了法式烹饪的最高境界。从精致的米其林星级餐厅到经典的法式小酒馆，你的婚礼菜单将是一场味蕾的奢华之旅。`,
      features: JSON.stringify([
        '埃菲尔铁塔灯光下的浪漫仪式',
        '塞纳河畔的优雅婚宴',
        '卢浮宫、巴黎圣母院等世界级地标',
        '凡尔赛宫镜厅的皇家盛宴',
        '蒙马特的艺术气息',
        '米其林星级法式美食',
        '历史宫殿酒店与私人公馆',
        '全世界最浪漫的首都'
      ]),
      venue_types: JSON.stringify([
        { name: '历史宫殿酒店', name_en: 'Historic Palace Hotel' },
        { name: '塞纳河畔公馆', name_en: 'Parisian Mansion' },
        { name: '私人庄园', name_en: 'Private Estate' },
        { name: '餐厅', name_en: 'Restaurant' }
      ]),
      towns: JSON.stringify([
        { name: 'Paris', name_cn: '巴黎' },
        { name: 'Versailles', name_cn: '凡尔赛' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1502602682916-037bb08c01a9?w=1200',
        'https://images.unsplash.com/photo-1499856871958-5b964d297916?w=1200',
        'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=1200',
        'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=1200',
        'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=1200'
      ]),
      budget_ranges: JSON.stringify([
        { label: '5万 - 10万欧元', min: 50000, max: 100000 },
        { label: '10万 - 25万欧元', min: 100000, max: 250000 },
        { label: '25万 - 50万欧元', min: 250000, max: 500000 },
        { label: '50万欧元以上', min: 500000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-30人', '30-60人', '60-100人', '100人以上']),
      cover_image: 'https://images.unsplash.com/photo-1502602682916-037bb08c01a9?w=1200',
      sort_order: 12
    },
    {
      slug: 'loire-valley',
      name: 'Loire Valley', name_cn: '卢瓦尔河谷',
      country: 'France', country_cn: '法国',
      source_url: 'https://www.frenchdestinationwedding.com/wedding-destinations/loire-valley/',
      tagline: '在童话城堡与皇家花园间，开启你们的浪漫篇章',
      description: `卢瓦尔河谷，法国的花园，一片遍布童话城堡和皇家宫殿的土地。想象在一座拥有数百年历史的城堡前，在精心修剪的法式花园中交换誓言。\n\n这条联合国教科文组织世界遗产河谷，以其文艺复兴时期的城堡、茂密的森林和优雅的葡萄园而闻名。这里是法国国王和贵族曾经狩猎和度假的地方，如今成为梦想婚礼的完美舞台。\n\n在私人城堡中举办中世纪风格的盛大婚宴，或在精致的庄园中举行优雅的户外庆典。卢瓦尔河谷的每个角落都散发着皇家气派与浪漫情怀。\n\n这里的美食同样令人惊叹——新鲜的河鱼、当地奶酪和图赖讷地区的优质葡萄酒，为你的婚礼增添地道的法式风味。`,
      features: JSON.stringify([
        '童话般的文艺复兴城堡',
        '联合国教科文组织世界遗产',
        '精心修剪的法式花园',
        '皇家狩猎森林与葡萄园',
        '私人城堡的中世纪风格婚宴',
        '图赖讷地区的优质葡萄酒',
        '优雅的户外花园仪式',
        '法国王室的历史氛围'
      ]),
      venue_types: JSON.stringify([
        { name: '私人城堡', name_en: 'Private Château' },
        { name: '庄园', name_en: 'Manor House' },
        { name: '花园', name_en: 'Garden' },
        { name: '葡萄园', name_en: 'Vineyard' }
      ]),
      towns: JSON.stringify([
        { name: 'Chambord', name_cn: '尚博尔' },
        { name: 'Chenonceau', name_cn: '舍农索' },
        { name: 'Tours', name_cn: '图尔' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
        'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1200',
        'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1200',
        'https://images.unsplash.com/photo-1559827260-dc66d5281a48?w=1200',
        'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1200'
      ]),
      budget_ranges: JSON.stringify([
        { label: '3万 - 6万欧元', min: 30000, max: 60000 },
        { label: '6万 - 12万欧元', min: 60000, max: 120000 },
        { label: '12万 - 25万欧元', min: 120000, max: 250000 },
        { label: '25万欧元以上', min: 250000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上']),
      cover_image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200',
      sort_order: 13
    },
    {
      slug: 'bordeaux',
      name: 'Bordeaux', name_cn: '波尔多',
      country: 'France', country_cn: '法国',
      source_url: 'https://www.frenchdestinationwedding.com/wedding-destinations/bordeaux/',
      tagline: '在葡萄酒之都，品味爱情与生活的醇厚芬芳',
      description: `波尔多，世界葡萄酒之都，一座将优雅与热情完美融合的法国城市。想象在列级酒庄的葡萄园中，在金色夕阳的映照下交换誓言，空气中弥漫着葡萄的芬芳。\n\n这座城市以其18世纪的经典建筑、世界级的葡萄酒庄园和精致的美食文化而闻名。波尔多的历史城区是联合国教科文组织世界遗产，拥有令人叹为观止的新古典主义建筑群。\n\n在私人酒庄城堡中举办以葡萄酒为主题的盛大婚宴，或在波尔多市中心的优雅公馆中举行精致仪式。无论你的梦想是田园诗般的乡村婚礼还是都市优雅的现代庆典，波尔多都能完美实现。\n\n波尔多的美食与葡萄酒文化是世界顶级的。从圣埃美隆的列级名庄到 Arcachon 湾的新鲜生蚝，你的婚礼菜单将是一场味蕾的波尔多之旅。`,
      features: JSON.stringify([
        '列级酒庄葡萄园中的浪漫仪式',
        '世界葡萄酒之都的醇厚魅力',
        '联合国教科文组织历史城区',
        '私人酒庄城堡的盛大婚宴',
        '圣埃美隆列级名庄品酒',
        'Arcachon湾新鲜生蚝',
        '18世纪新古典主义建筑',
        '田园诗般的乡村与都市优雅'
      ]),
      venue_types: JSON.stringify([
        { name: '酒庄城堡', name_en: 'Wine Château' },
        { name: '城市公馆', name_en: 'Townhouse' },
        { name: '葡萄园', name_en: 'Vineyard' },
        { name: '餐厅', name_en: 'Restaurant' }
      ]),
      towns: JSON.stringify([
        { name: 'Bordeaux', name_cn: '波尔多' },
        { name: 'Saint-Émilion', name_cn: '圣埃美隆' },
        { name: 'Arcachon', name_cn: '阿卡雄' }
      ]),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200',
        'https://images.unsplash.com/photo-1559827260-dc66d5281a48?w=1200',
        'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1200',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200'
      ]),
      budget_ranges: JSON.stringify([
        { label: '3万 - 6万欧元', min: 30000, max: 60000 },
        { label: '6万 - 12万欧元', min: 60000, max: 120000 },
        { label: '12万 - 20万欧元', min: 120000, max: 200000 },
        { label: '20万欧元以上', min: 200000, max: null }
      ]),
      guest_capacities: JSON.stringify(['0-40人', '40-80人', '80-120人', '120人以上']),
      cover_image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200',
      sort_order: 14
    },
    // ===== 希腊婚礼场地 =====
    {
      slug: 'alsos-nimfon',
      name: 'Alsos Nimfon', name_cn: '森林女神庄园',
      country: 'Greece', country_cn: '希腊',
      source_url: 'https://www.weddingwire.com/biz/alsos-nimfon/7ce63ab1d0565691.html',
      tagline: '雅典近郊的湖畔庄园，在自然与湖光中见证永恒誓约',
      description: `Alsos Nimfon 是位于希腊 Oropos 的婚礼与活动场地，距雅典约30公里。这座占地六英亩的私人庄园是新人交换誓言的宁静休憩之所。自然环境、湖景和敬业的团队确保每对新人都拥有难忘的体验。\n\n俯瞰 Marathonas 湖，Alsos Nimfon 为新人在大自然中举办婚礼提供迷人氛围。郁郁葱葱的花园、私人游泳池和繁茂的树木遍布整个空间，为仪式和婚宴打造出引人注目的背景。室内场地之一是 St. Konstantinos & Eleni 教堂，是举行传统仪式的场所。室内宴会厅是一栋多功能建筑，玻璃墙环绕整个房间，确保每位宾客都不错过美景，还配有可伸缩屋顶，让自然光洒满整个空间，可容纳多达500位宾客。户外露台和草坪区域可容纳多达750人。此外，还提供私人套房和花园，可用作化妆准备套房或蜜月套房。\n\nAlsos Nimfon 拥有现场婚礼策划团队，帮助新人实现无缝、无压力的筹备过程。场地的内部烹饪团队 Anagnostopoulos Catering 将根据您的愿景定制菜单。知名调酒师为宾客提供各种饮品。团队还将与您联系其可信赖的供应商名单，从设计师到花艺师，让您的婚礼愿景成为现实。\n\nAlsos Nimfon 因其令人惊叹的场地环境和优质服务而备受新人好评。餐饮被评价为令人难忘，活动工作人员也以细心和友善著称。`,
      features: JSON.stringify([
        '俯瞰Marathonas湖的六英亩私人庄园',
        '郁郁葱葱的花园与私人游泳池',
        'St. Konstantinos & Eleni 传统教堂',
        '玻璃墙环绕的多功能室内宴会厅（可容纳500人）',
        '可伸缩屋顶，自然光洒满全场',
        '户外露台与草坪区域（可容纳750人）',
        '私人套房与花园（化妆/蜜月）',
        '现场婚礼策划团队',
        '内部烹饪团队 Anagnostopoulos Catering',
        '知名调酒师与可信赖供应商推荐',
        'WeddingWire 5.0满分评分，100%新人推荐',
        '20年经营经验，Google 4.8分（1033条评论）'
      ]),
      venue_types: JSON.stringify([
        { name: '农场/牧场', name_en: 'Farm/Ranch' },
        { name: '花园', name_en: 'Garden' },
        { name: '度假村', name_en: 'Resort' }
      ]),
      towns: JSON.stringify([
        { name: 'Oropos', name_cn: '奥罗波斯' },
        { name: 'Marathonas', name_cn: '马拉松纳' }
      ]),
      images: JSON.stringify([
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/1_51_2081127-172674857697709.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/nikos-tselios-dji-0277_51_2081127-172674857642556.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/png/4_51_2081127-178101497998875.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/png/3_51_2081127-178101497962250.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpeg/whatsapp-image-2026-05-27-at-5-23-56-pm_51_2081127-178101451781797.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpeg/whatsapp-image-2026-05-25-at-5-39-45-pm_51_2081127-178101451732242.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/2_51_2081127-172674857671498.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/3_51_2081127-172674857654912.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/5_51_2081127-172674857685034.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/6_51_2081127-172674857639156.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/7_51_2081127-172674857662845.jpeg',
        'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/8_51_2081127-172674857648391.jpeg'
      ]),
      budget_ranges: JSON.stringify([
        { label: '$6,200 起步', min: 6200, max: 6200 },
        { label: '$7,600 新人通常花费', min: 7600, max: 7600 }
      ]),
      guest_capacities: JSON.stringify(['50-500人（室内）', '50-750人（户外）', '最多850人']),
      faq: JSON.stringify([
        { q: '起始场地费包含哪些项目？', a: '椅子、桌布、桌子、停车、 Setup、清洁、新娘套房、餐具、玻璃器皿' },
        { q: '婚礼餐饮费用包含哪些？', a: '切蛋糕、甜点、服务员、婚礼蛋糕' },
        { q: '酒吧服务起始价格包含哪些？', a: '调酒师、家酿烈酒、家酿葡萄酒' },
        { q: '场地有什么特点？', a: '农场/牧场、花园、公园' },
        { q: '提供哪些室内/室外选择？', a: '室内、有遮盖室外、无遮盖室外' },
        { q: '提供哪些婚礼活动类型？', a: '仪式、婚宴、新娘派对、订婚派对、私奔、彩排晚餐' },
        { q: '提供哪些活动服务？', a: '清洁、活动租赁、新娘准备间、Setup' },
        { q: '提供哪些餐饮选择？', a: '自助餐、鸡尾酒会、甜点、家庭式、小食、外部蛋糕、装盘、服务员、摊位' },
        { q: '提供哪些酒吧服务？', a: '调酒师、开放式酒吧、优质烈酒、特调饮品' },
        { q: '提供哪些家具和装饰？', a: '音响设备、椅子、舞池、家具、灯光、桌子、帐篷、帐篷配件' }
      ]),
      cover_image: 'https://cdn0.weddingwire.com/vendor/721180/3_2/1920/jpg/nikos-tselios-dji-0277_51_2081127-172674857642556.jpeg',
      sort_order: 20
    },
    {
      slug: 'villa-bordeaux-santorini',
      name: 'Villa Bordeaux Santorini', name_cn: '波尔多圣托里尼别墅',
      country: 'Greece', country_cn: '希腊',
      source_url: 'https://www.weddingwire.com/biz/villa-bordeaux-santorini/dddd83f70e6872e8.html',
      tagline: '圣托里尼悬崖上的奢华婚礼殿堂，爱琴海日落见证永恒誓约',
      description: `Villa Bordeaux Santorini 是位于希腊 Fira 的目的地婚礼场地。坐落于 Caldera 悬崖之上，这个奢华的环境提供了爱琴海和岛屿的壮丽景色作为仪式背景。现场团队在整个婚礼周末陪伴新人，确保他们充分享受婚姻生活的第一步。其全包套餐、内部餐饮和奢华住宿可以将任何新人的婚礼日变成一场难忘的盛事。\n\n场地与容量\nVilla Bordeaux Santorini 始建于19世纪，经过精心翻新，将历史底蕴与现代美学完美融合。它坐落在岛上热闹的首府 Fira，为新人和宾客营造独一无二的氛围。别墅可容纳多达100位宾客。新人可以在露台或阳台上交换誓言，以火山和大海作为天然祭坛背景。露台还设有一个放松的无边泳池，可欣赏全景。泳池周围是如画的用餐区，适合亲密的彩排或招待晚餐。四间高品质套房可供新人和宾客在婚礼周末享受奢华住宿。\n\n服务\nVilla Bordeaux Santorini 的团队将与您密切合作，帮助您策划目的地婚礼。他们提供场地布置和拆卸服务，让新人有更多时间专注于重要的事情。桌子、椅子和桌布将按您喜欢的任何形式提供和安排。\n\n美食\n别墅的主要餐饮服务商 La Colline Restaurant 提供多种时令菜肴，从新鲜海鲜到炭烤创意料理，以及鸡尾酒会的小食选择。宾客还可以在夜晚结束时享用甜点，包括冰沙、苹果派和令人垂涎的巧克力作品。\n\n你会爱上这里的原因\n新人可以在海滩上以壮丽的海洋为背景交换誓言，然后在舞池上跳舞，度过难忘的庆典。`,
      features: JSON.stringify([
        '19世纪历史建筑，精心翻新融合现代美学',
        'Caldera悬崖之上，爱琴海与火山全景',
        '无边泳池与露台仪式场地',
        '四间高品质奢华套房（Aqua/Lava/Terra/Aeolus）',
        '内部餐饮 La Colline Restaurant',
        '可容纳2-100位宾客',
        '全包式婚礼策划服务',
        '穿梭巴士接送服务',
        '宠物友好',
        'Google 4.8分（139条评论）',
        '屋顶、水滨、历史建筑多重风格',
        '鸡尾酒吧与甜品台'
      ]),
      venue_types: JSON.stringify([
        { name: '度假村', name_en: 'Resort' },
        { name: '历史建筑', name_en: 'Historic Building' },
        { name: '水滨', name_en: 'Waterfront' }
      ]),
      towns: JSON.stringify([
        { name: 'Fira', name_cn: '菲拉' }
      ]),
      images: JSON.stringify([
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/rt0b6687_51_2039029-162463375989937.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/6_51_2039029-162463368872777.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/28_51_2039029-164310382026963.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/rt0b1321_51_2039029-162463452331286.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/rt0b1324_51_2039029-162463373849095.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/rt0b1289_51_2039029-162463373453013.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/rt0b6672_51_2039029-162463376367330.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/56_51_2039029-162463368595158.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/drz-bvillas-q1a7502_51_2039029-162463372025875.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/villabordeaux-23099413-1124127347690755-5317397661110763520-n_51_2039029-162463376083995.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/santorinivillabordeaux5260v-p_51_2039029-162463378110578.jpeg',
        'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/santorinivillabordeaux3872v-p-1_51_2039029-164312017280069.jpeg'
      ]),
      budget_ranges: JSON.stringify([
        { label: '仪式起步价', min: 6500, max: null },
        { label: '婚宴起步价', min: 6500, max: null },
        { label: '酒吧服务/人', min: 200, max: null }
      ]),
      guest_capacities: JSON.stringify(['2-60人', '60-100人']),
      faq: JSON.stringify([
        { q: 'Villa Bordeaux Santorini 的起始场地费包含哪些项目？', a: '椅子、桌布、桌子' },
        { q: 'Villa Bordeaux Santorini 的婚礼餐饮费用包含哪些项目？', a: '甜点、服务员' },
        { q: 'Villa Bordeaux Santorini 的酒吧服务起始价格包含哪些？', a: '调酒师、香槟祝酒、家酿啤酒、家酿烈酒、家酿葡萄酒、限量酒吧、开放式酒吧、优质烈酒、特调饮品、精酿啤酒、特选葡萄酒' },
        { q: 'Villa Bordeaux Santorini 在场地类型、风格和位置方面有什么特点？', a: '历史建筑、酒店、阁楼、庄园、码头、度假村、餐厅、屋顶、水滨、酒庄' },
        { q: 'Villa Bordeaux Santorini 提供哪些室内/室外选择？', a: '室内、无遮盖室外' },
        { q: 'Villa Bordeaux Santorini 提供哪些类型的婚礼活动？', a: '仪式、婚宴、订婚派对、私奔、彩排晚餐' },
        { q: 'Villa Bordeaux Santorini 为婚礼活动提供哪些服务？', a: '住宿、酒吧服务、餐饮服务、清洁、活动策划、活动租赁、新娘准备间、宠物友好、WiFi' },
        { q: 'Villa Bordeaux Santorini 提供哪些家具和装饰？', a: '椅子、椅套、垂幔、家具、桌子' }
      ]),
      cover_image: 'https://cdn0.weddingwire.com/vendor/920930/3_2/1920/jpg/6_51_2039029-162463368872777.jpeg',
      sort_order: 21
    }
  ]

  for (const d of newDests) {
    const [existing] = await pool.execute('SELECT id FROM crawled_destinations WHERE slug = ?', [d.slug])
    if (existing.length > 0) continue

    await pool.execute(
      `INSERT INTO crawled_destinations (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, faq, cover_image, cover_image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.slug, d.name, d.name_cn, d.country, d.country_cn, d.source_url, d.tagline, d.description, d.features, d.venue_types, d.towns, d.images, d.budget_ranges, d.guest_capacities, d.faq || null, d.cover_image, d.cover_image_url || d.cover_image, d.sort_order]
    )
    console.log(`✓ 新增爬取目的地: ${d.name_cn} (${d.slug})`)
  }
}

/**
 * 创建婚礼团队表
 */
async function ensureWeddingTeamsTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS wedding_teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL COMMENT '服务名称',
      name_en VARCHAR(200) DEFAULT '' COMMENT '英文名',
      role VARCHAR(100) DEFAULT '' COMMENT '角色/职能（如摄影师、化妆师）',
      role_en VARCHAR(100) DEFAULT '' COMMENT '角色英文名',
      description TEXT COMMENT '服务描述',
      image VARCHAR(500) DEFAULT '' COMMENT '图片URL',
      price INT NOT NULL DEFAULT 0 COMMENT '价格',
      unit VARCHAR(10) DEFAULT '€' COMMENT '货币单位',
      highlight VARCHAR(50) DEFAULT '' COMMENT '标签（热门/推荐等）',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='婚礼团队服务表'
  `)
  console.log('✓ 表 wedding_teams 已就绪')
}

/**
 * 创建爬取摄影师表
 */
async function ensureCrawledPhotographersTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_photographers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL COMMENT 'URL标识',
      name VARCHAR(200) NOT NULL COMMENT '摄影师英文名',
      name_cn VARCHAR(200) DEFAULT '' COMMENT '摄影师中文名',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      source_name VARCHAR(200) DEFAULT '' COMMENT '来源名称',
      category VARCHAR(100) DEFAULT '' COMMENT '分类标识（如 south-france, italy）',
      category_cn VARCHAR(100) DEFAULT '' COMMENT '分类中文（如 南法 · 私密婚礼）',
      country VARCHAR(100) DEFAULT '' COMMENT '国家中文',
      country_en VARCHAR(100) DEFAULT '' COMMENT '国家英文',
      tagline VARCHAR(500) DEFAULT '' COMMENT '宣传语/标语',
      description TEXT COMMENT '摄影师介绍',
      photo_styles JSON COMMENT '摄影风格标签列表',
      highlights JSON COMMENT '亮点标签列表',
      style JSON COMMENT '摄影风格详细分组',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      headshot VARCHAR(500) DEFAULT '' COMMENT '头像URL',
      images JSON COMMENT '图片URL列表',
      video_url VARCHAR(500) DEFAULT '' COMMENT '视频URL',
      website VARCHAR(500) DEFAULT '' COMMENT '官网地址',
      price INT DEFAULT NULL COMMENT '起步价（欧元）',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_country (country),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取摄影师表'
  `)
  console.log('✓ 表 crawled_photographers 已就绪')
}

/**
 * 创建爬取花店表
 */
async function ensureCrawledFloristsTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_florists (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL COMMENT 'URL标识',
      name VARCHAR(200) NOT NULL COMMENT '花店英文名',
      name_cn VARCHAR(200) DEFAULT '' COMMENT '花店中文名',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      country VARCHAR(100) DEFAULT '' COMMENT '所在国家英文',
      country_cn VARCHAR(100) DEFAULT '' COMMENT '所在国家中文',
      city VARCHAR(100) DEFAULT '' COMMENT '所在城市英文',
      city_cn VARCHAR(100) DEFAULT '' COMMENT '所在城市中文',
      tagline VARCHAR(500) DEFAULT '' COMMENT '宣传语/标语',
      description TEXT COMMENT '花店介绍',
      founded_year INT DEFAULT NULL COMMENT '成立年份',
      team_members JSON COMMENT '团队成员列表',
      services JSON COMMENT '婚礼服务列表',
      specialties JSON COMMENT '特色标签',
      design_process JSON COMMENT '设计流程',
      pricing_comparison JSON COMMENT '价格对比',
      wedding_venues JSON COMMENT '合作婚礼场地',
      wedding_stories JSON COMMENT '婚礼故事案例',
      fresh_flower_products JSON COMMENT '鲜花产品',
      infinity_rose_products JSON COMMENT '永生玫瑰产品',
      testimonials JSON COMMENT '客户评价',
      faq JSON COMMENT '常见问题',
      portfolio_images JSON COMMENT '婚礼作品集图片',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      headshot VARCHAR(500) DEFAULT '' COMMENT '头像/创始人图URL',
      website VARCHAR(500) DEFAULT '' COMMENT '官网地址',
      phone VARCHAR(50) DEFAULT '' COMMENT '联系电话',
      email VARCHAR(200) DEFAULT '' COMMENT '邮箱',
      address VARCHAR(500) DEFAULT '' COMMENT '地址',
      rating JSON COMMENT '评分信息',
      media_features JSON COMMENT '媒体报道',
      price INT DEFAULT NULL COMMENT '起步价（英镑）',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_country (country)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取花店表'
  `)
  console.log('✓ 表 crawled_florists 已就绪')
}

module.exports = { pool, initDB, getCategoryTable, ensureCategoryTable, ensureDestinationTable, ensureWeddingTeamsTable, ensureCrawledPhotographersTable, ensureCrawledFloristsTable }
