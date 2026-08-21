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

  // 婚礼团队表
  await ensureWeddingTeamsTable(pool)

  // 爬取摄影师表
  await ensureCrawledPhotographersTable(pool)

  // 爬取花店表
  await ensureCrawledFloristsTable(pool)

  // 爬取目的地场地表（新）
  await ensureCrawledVenuesTable(pool)

  // 爬取礼服商品表
  await ensureCrawledDressesTable(pool)

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

/**
 * 创建爬取目的地场地表（新架构）
 */
async function ensureCrawledVenuesTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_venues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL COMMENT 'URL标识',
      name VARCHAR(200) NOT NULL COMMENT '场地英文名',
      name_cn VARCHAR(200) DEFAULT '' COMMENT '场地中文名',
      country VARCHAR(100) DEFAULT '' COMMENT '国家英文',
      country_cn VARCHAR(100) DEFAULT '' COMMENT '国家中文',
      region VARCHAR(100) DEFAULT '' COMMENT '大区/州（如 Puglia）',
      city VARCHAR(100) DEFAULT '' COMMENT '城市英文',
      city_cn VARCHAR(100) DEFAULT '' COMMENT '城市中文',
      address VARCHAR(500) DEFAULT '' COMMENT '详细地址',
      postal_code VARCHAR(20) DEFAULT '' COMMENT '邮编',
      latitude DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
      longitude DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
      tagline VARCHAR(500) DEFAULT '' COMMENT '宣传语',
      description TEXT COMMENT '场地完整介绍',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      gallery_images JSON COMMENT '图集（JSON数组）',
      venue_types JSON COMMENT '场地类型标签（JSON数组）',
      amenities JSON COMMENT '设施服务（JSON数组）',
      capacity VARCHAR(100) DEFAULT '' COMMENT '容纳人数',
      built_year VARCHAR(50) DEFAULT '' COMMENT '建造年代',
      land_size VARCHAR(100) DEFAULT '' COMMENT '占地面积',
      phone VARCHAR(50) DEFAULT '' COMMENT '联系电话',
      website VARCHAR(500) DEFAULT '' COMMENT '官网',
      source_url VARCHAR(500) DEFAULT '' COMMENT '爬取来源URL',
      source_name VARCHAR(200) DEFAULT '' COMMENT '来源名称',
      price INT DEFAULT NULL COMMENT '起步价',
      price_unit VARCHAR(20) DEFAULT '' COMMENT '价格单位',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_country (country),
      INDEX idx_city (city)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取目的地场地表'
  `)
  console.log('✓ 表 crawled_venues 已就绪')
}

/**
 * 创建爬取礼服商品表
 */
async function ensureCrawledDressesTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_dresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL COMMENT 'URL标识',
      name VARCHAR(200) NOT NULL COMMENT '中文名',
      name_en VARCHAR(200) DEFAULT '' COMMENT '英文名',
      category VARCHAR(100) DEFAULT '' COMMENT '分类key',
      category_cn VARCHAR(100) DEFAULT '' COMMENT '分类显示名',
      tagline VARCHAR(500) DEFAULT '' COMMENT '宣传语',
      description TEXT COMMENT '商品描述',
      highlights JSON COMMENT '亮点标签列表',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      images JSON COMMENT '图片URL列表',
      video_url VARCHAR(500) DEFAULT '' COMMENT '视频URL',
      source_name VARCHAR(200) DEFAULT '' COMMENT '来源名称',
      source_url VARCHAR(500) DEFAULT '' COMMENT '来源URL',
      price INT DEFAULT NULL COMMENT '价格',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取礼服商品表'
  `)
  console.log('✓ 表 crawled_dresses 已就绪')
}

module.exports = { pool, initDB, getCategoryTable, ensureCategoryTable, ensureDestinationTable, ensureWeddingTeamsTable, ensureCrawledPhotographersTable, ensureCrawledFloristsTable, ensureCrawledVenuesTable, ensureCrawledDressesTable }
