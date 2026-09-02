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
      sender_type ENUM('user', 'admin', 'system') NOT NULL DEFAULT 'user' COMMENT '发送方',
      content TEXT NOT NULL COMMENT '消息内容',
            channel VARCHAR(20) NOT NULL DEFAULT 'order' COMMENT '消息渠道',
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
      image VARCHAR(500) DEFAULT '' COMMENT '商品图片URL',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      UNIQUE KEY uk_user_product (user_id, category_id, product_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户已选商品表';
  `
  const createUserWishlistSQL = `
    CREATE TABLE IF NOT EXISTS user_wishlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL COMMENT '用户ID',
      category_id VARCHAR(50) NOT NULL COMMENT '类别ID: floral/wine等',
      product_id VARCHAR(100) NOT NULL COMMENT '花店slug/酒水productId',
      item_name VARCHAR(200) DEFAULT '' COMMENT '商品名称',
      item_name_en VARCHAR(200) DEFAULT '' COMMENT '商品英文名',
      image VARCHAR(500) DEFAULT '' COMMENT '图片URL',
      base_price INT DEFAULT 0 COMMENT '基础价格',
      total_price INT DEFAULT 0 COMMENT '总价（含选项）',
      unit VARCHAR(10) DEFAULT '£' COMMENT '货币单位',
      options_json JSON COMMENT '选花/选酒明细 {idx:{name,price,qty}}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_wish (user_id, category_id, product_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户意向单明细表';
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
  await pool.execute(createUserWishlistSQL)
  console.log('✓ 数据库表 user_wishlist 已就绪')
    // 迁移：为 user_selected_products 表补充 image 字段（如不存在）
    try {
      const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='user_selected_products' AND COLUMN_NAME='image'")
      if (cols.length === 0) {
        await pool.execute("ALTER TABLE user_selected_products ADD COLUMN image VARCHAR(500) DEFAULT '' COMMENT '商品图片URL' AFTER unit")
        console.log('✓ user_selected_products 表已添加 image 字段')
      }
    } catch (e) {
      console.warn('迁移 image 字段时出错（可忽略）:', e.message)
    }
    // 迁移：为 user_selected_products 表补充 qty / specs 字段
    try {
      const [cols2] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='user_selected_products' AND COLUMN_NAME='qty'")
      if (cols2.length === 0) {
        await pool.execute("ALTER TABLE user_selected_products ADD COLUMN qty INT DEFAULT 1 COMMENT '数量（花卉选花数等）' AFTER image")
        console.log('✓ user_selected_products 表已添加 qty 字段')
      }
      const [cols3] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='user_selected_products' AND COLUMN_NAME='specs'")
      if (cols3.length === 0) {
        await pool.execute("ALTER TABLE user_selected_products ADD COLUMN specs VARCHAR(500) DEFAULT '' COMMENT '规格明细描述' AFTER qty")
        console.log('✓ user_selected_products 表已添加 specs 字段')
      }
    } catch (e) {
      console.warn('迁移 qty/specs 字段时出错（可忽略）:', e.message)
    }
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

  // 旅拍景点表
  await ensureCrawledTravelAttractionsTable(pool)
  await seedTravelAttractions(pool)

  // 埋点事件表
  await ensureAnalyticsEventsTable(pool)

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
    // wine（酒水宴席商品数据为空，待后续写入）
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
    { name: 'tags', sql: "ADD COLUMN tags JSON COMMENT '分类标签（region/type/vintage）'" },
    { name: 'buying_options', sql: "ADD COLUMN buying_options JSON COMMENT '购买选项（Bottle/Case规格套餐）'" },
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

/**
 * 创建旅拍景点表
 */
async function ensureCrawledTravelAttractionsTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS crawled_travel_attractions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(150) NOT NULL COMMENT 'URL标识',
      name VARCHAR(200) NOT NULL COMMENT '中文名',
      name_en VARCHAR(200) DEFAULT '' COMMENT '英文名',
      country VARCHAR(100) DEFAULT '' COMMENT '国家中文',
      country_en VARCHAR(100) DEFAULT '' COMMENT '国家英文',
      location VARCHAR(100) DEFAULT '' COMMENT '城市中文',
      location_en VARCHAR(100) DEFAULT '' COMMENT '城市英文',
      cover_image VARCHAR(500) DEFAULT '' COMMENT '封面图URL',
      tagline VARCHAR(500) DEFAULT '' COMMENT '宣传语',
      description TEXT COMMENT '景点介绍',
      description_en TEXT COMMENT '景点介绍英文',
      highlights JSON COMMENT '亮点标签',
      price INT DEFAULT 0 COMMENT '起步价（欧元）',
      sort_order INT DEFAULT 0 COMMENT '排序权重',
      tags JSON COMMENT '标签分类',
      recommended_photographers JSON COMMENT 'SEO固定推荐摄影师slug列表',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_slug (slug),
      INDEX idx_country (country)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='旅拍景点表'
  `)
  // 兼容旧表：添加 recommended_photographers 字段
  try {
    await pool.execute(`ALTER TABLE crawled_travel_attractions ADD COLUMN recommended_photographers JSON COMMENT 'SEO固定推荐摄影师slug列表'`)
    console.log('✓ 已添加 recommended_photographers 字段')
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.log('⚠ recommended_photographers 字段已存在或跳过')
  }
  // 兼容旧表：添加 photo_tips 字段
  try {
    await pool.execute(`ALTER TABLE crawled_travel_attractions ADD COLUMN photo_tips TEXT COMMENT '拍摄建议'`)
    console.log('✓ 已添加 photo_tips 字段')
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.log('⚠ photo_tips 字段已存在或跳过')
  }
  console.log('✓ 表 crawled_travel_attractions 已就绪')
}

/**
 * 种子数据：旅拍景点
 */
async function seedTravelAttractions(pool) {
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM crawled_travel_attractions')
  if (rows[0].cnt > 0) return

  const attractions = [
    { slug: 'eiffel-tower', name: '埃菲尔铁塔', name_en: 'Eiffel Tower', country: '法国', country_en: 'France', location: '巴黎', location_en: 'Paris', cover_image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200&fit=crop', tagline: '巴黎地标，浪漫之都的象征', description: '埃菲尔铁塔矗立在塞纳河南岸的战神广场上，是法国巴黎最具标志性的建筑。这座铁塔由工程师居斯塔夫·埃菲尔设计，于1889年世界博览会期间落成，至今已矗立超过一百三十年，见证了无数历史时刻。铁塔高324米，由18038件锻铁构件和250万颗铆钉组装而成，其精密的结构本身就是工程美学的巅峰之作。\n\n对于欧洲旅拍而言，埃菲尔铁塔提供了无与伦比的拍摄体验。清晨时分，铁塔在柔和的晨光中呈现出温暖的金色调，战神广场几乎空无一人，是拍摄私密合影的绝佳时机。黄昏时分，铁塔在夕阳余晖中剪影般矗立，入夜后每整点的灯光闪烁更为画面增添浪漫氛围。特罗卡德罗广场的宽阔平台可以完整收纳铁塔全貌，是拍摄大场景的经典机位；而铁塔脚下的仰拍角度则能营造出宏伟壮观的视觉冲击力。', description_en: 'The Eiffel Tower stands on the Champ de Mars in Paris, France. Designed by engineer Gustave Eiffel, it was constructed for the 1889 World\'s Fair and has become one of the most visited paid tourist attractions in the world.', highlights: JSON.stringify([{ icon: '🗼', title: '建筑高度', desc: '324米，巴黎最高建筑' }, { icon: '📸', title: '最佳拍摄', desc: '日落时分，铁塔亮灯瞬间' }, { icon: '🌅', title: '推荐时段', desc: '4月-9月，光线柔和温暖' }, { icon: '👗', title: '推荐风格', desc: '浪漫法式、复古胶片、时尚杂志' }]), price: 0, sort_order: 1, tags: JSON.stringify(['城市地标', '铁塔', '夜景', '浪漫法式']) },
    { slug: 'louvre-museum', name: '卢浮宫', name_en: 'Louvre Museum', country: '法国', country_en: 'France', location: '巴黎', location_en: 'Paris', cover_image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&fit=crop', tagline: '世界最大艺术博物馆，蒙娜丽莎的故乡', description: '卢浮宫位于巴黎市中心塞纳河北岸，是世界上最大、最著名的艺术博物馆之一。这座昔日的法国王宫始建于12世纪，经过数百年的扩建与修缮，汇集了从中世纪到文艺复兴时期的建筑精华。贝聿铭设计的玻璃金字塔入口于1989年落成，以简洁的几何造型与古典宫殿形成鲜明对话，本身已成为巴黎的新地标。\n\n卢浮宫收藏了从古代文明到19世纪的数十万件艺术珍品，其中包括蒙娜丽莎、断臂维纳斯和胜利女神等旷世杰作。对于旅拍而言，卢浮宫的魅力在于多层次的空间体验：玻璃金字塔的反射面在不同光线下呈现变幻莫测的色彩，卡鲁塞尔花园的对称花坛提供了优雅的取景框架，而塞纳河沿岸的远眺则将整座宫殿的恢弘天际线尽收眼底。', description_en: 'The Louvre Museum is located on the Right Bank of the Seine in Paris. It is the world\'s largest and most visited art museum, housing thousands of works of art from antiquity to the 19th century.', highlights: JSON.stringify([]), price: 0, sort_order: 2, tags: JSON.stringify(['博物馆', '宫殿', '城市地标', '艺术']) },
    { slug: 'provence-lavender', name: '普罗旺斯薰衣草田', name_en: 'Provence Lavender Fields', country: '法国', country_en: 'France', location: '普罗旺斯', location_en: 'Provence', cover_image: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1200&fit=crop', tagline: '紫色花海中的法式浪漫', description: '普罗旺斯的薰衣草花田是法国南部最具代表性的自然景观之一。每年6月中旬至8月初，瓦朗索尔高原和索尔格地区的薰衣草竞相绽放，紫色的花海绵延起伏，与金色的麦田、翠绿的橄榄园交织成一幅印象派油画。空气中弥漫着薰衣草的芬芳，蜂蝶在花间穿梭，构成了一幅充满感官享受的南法田园画卷。\n\n这里是欧洲旅拍的梦幻之地。广阔的薰衣草田提供了天然的紫色背景，无需任何人工布景便能营造出浪漫至极的画面。日出前后和日落前后的金色光线穿透花穗，为照片增添温暖的光晕。建议穿着轻盈飘逸的白色或浅色系礼服，与紫色花海形成优雅的色彩对比。索尔格的周一集市也是拍摄法式乡村生活气息的好素材。', description_en: 'The lavender fields of Provence are one of the most iconic landscapes in southern France, with purple blooms stretching across rolling hills from June to August.', highlights: JSON.stringify([]), price: 0, sort_order: 3, tags: JSON.stringify(['田园', '花海', '乡村', '自然']) },
    { slug: 'mont-saint-michel', name: '圣米歇尔山', name_en: 'Mont Saint-Michel', country: '法国', country_en: 'France', location: '诺曼底', location_en: 'Normandy', cover_image: '/uploads/crawled/travel-attractions/mont-saint-michel.jpg', tagline: '海上孤岛的中世纪修道院', description: '圣米歇尔山是法国诺曼底海岸外的一座潮汐岛，被誉为"西方奇迹"。山顶的本笃会修道院始建于公元8世纪，历经数百年扩建，层层叠叠的哥特式建筑群直插云霄，远处望去宛如一座海上的天空之城。作为世界文化遗产，这里每年吸引数百万游客前来朝圣。\n\n潮汐岛周围的海湾拥有欧洲最大的潮差之一，涨潮时海水环绕孤岛，退潮时露出广袤的沙滩和泥滩，一日之间景色变幻无穷。岛上的石板街道蜿蜒而上，沿途经过手工艺品店、小餐馆和古老的城墙，每一步都能发现不同的取景角度。\n\n从对岸堤坝远眺，整座山在晨雾中若隐若现，宛如仙境。我们推荐在日出或日落时分拍摄，金色的光线洒在修道院的尖塔上，配合潮汐的壮美背景，能呈现出最具戏剧性的画面。', description_en: 'Mont Saint-Michel is a tidal island off the coast of Normandy, France. The Benedictine monastery at its summit dates back to the 8th century, a masterpiece of medieval architecture.', highlights: JSON.stringify([]), price: 0, sort_order: 4, tags: JSON.stringify(['海岛', '古堡', '世界遗产', '日出日落']) },
    { slug: 'hallstatt', name: '哈尔施塔特', name_en: 'Hallstatt', country: '奥地利', country_en: 'Austria', location: '哈尔施塔特', location_en: 'Hallstatt', cover_image: '/uploads/crawled/travel-attractions/hallstatt.jpg', tagline: '阿尔卑斯山畔的童话小镇', description: '哈尔施塔特是奥地利萨尔茨卡默古特地区的一座湖畔小镇，背靠阿尔卑斯山脉，面朝碧绿的哈尔施塔特湖，被誉为"世界最美小镇"。这座有着7000年历史的小镇以其色彩斑斓的木屋、陡峭的山峰和如镜面般的湖水闻名于世，是联合国教科文组织世界文化遗产。\n\n小镇沿湖岸排列着精心维护的木质房屋，远处雪山矗立，宛如一幅流动的油画。镇上的集市广场虽小，却有着标志性的三位一体瘟疫柱和别致的喷泉，是取景的绝佳点缀。\n\n湖畔栈道可以拍摄小镇全景与湖面倒影，乘船到湖心角度更能收纳完整的山、湖、村三层画面。清晨薄雾笼罩湖面时最为梦幻，秋冬雪后更是银装素裹的童话世界。盐矿观景台则是俯瞰全镇的制高点，能将整个哈尔施塔特湖尽收眼底。', description_en: 'Hallstatt is a charming lakeside town in Upper Austria, nestled against the Alps and facing the emerald-green Hallstatt Lake. Known as one of the most beautiful towns in the world, it offers breathtaking scenery for wedding photography.', highlights: JSON.stringify([]), price: 0, sort_order: 5, tags: JSON.stringify(['湖畔', '山脉', '世界遗产', '童话小镇']) },
    { slug: 'venice', name: '威尼斯水城', name_en: 'Venice', country: '意大利', country_en: 'Italy', location: '威尼斯', location_en: 'Venice', cover_image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200&fit=crop', tagline: '水上城市的浪漫与诗意', description: '威尼斯是意大利东北部著名的水上城市，由118个小岛组成，177条运河纵横其间，以400余座桥梁相连。这座独特的城市没有汽车，运河就是街道，贡多拉就是出租车。圣马可广场上的拜占庭式大教堂和总督宫见证了威尼斯共和国千年的辉煌历史，而蜿蜒的水巷两侧，哥特式宫殿的精美倒影在水波中轻轻摇曳。\n\n威尼斯是全世界最浪漫的旅拍目的地之一。清晨的运河笼罩在薄雾中，贡多拉静静停泊在码头旁，整座城市仿佛还在沉睡——这是拍摄空灵画面的最佳时刻。乘坐贡多拉穿行于小桥之下，每一转弯都是一幅画。里亚尔托桥附近的宽阔水道可以拍摄到两岸宫殿的完整倒影。黄昏时分，圣马可广场在落日余晖中呈现出温暖的琥珀色调，乐队的演奏声为画面增添了动人的背景。', description_en: 'Venice is a city in northeastern Italy built on 118 small islands connected by canals and bridges. Known for its unique urban landscape, gondolas, and rich artistic heritage.', highlights: JSON.stringify([]), price: 0, sort_order: 5, tags: JSON.stringify(['水城', '运河', '浪漫', '历史']) },
    { slug: 'florence-cathedral', name: '佛罗伦萨大教堂', name_en: 'Florence Cathedral', country: '意大利', country_en: 'Italy', location: '佛罗伦萨', location_en: 'Florence', cover_image: 'https://images.unsplash.com/photo-1543429258-f4e4837a0e3e?w=1200&fit=crop', tagline: '文艺复兴的发源地', description: '佛罗伦萨大教堂是文艺复兴建筑的巅峰之作。其标志性的红色穹顶由菲利波·布鲁内莱斯基设计，直径达45米，在没有现代工程设备的15世纪便已完工，至今仍是佛罗伦萨天际线最醒目的地标。教堂外立面以粉、绿、白三色大理石拼贴出精美的几何图案，乔托钟楼矗立一旁，高达84米，可登顶俯瞰整座城市的红瓦屋顶。\n\n佛罗伦萨是文艺复兴的摇篮，整座城市就是一座露天博物馆。对于旅拍而言，大教堂广场提供了最经典的取景角度——穹顶的宏伟弧线在广场上方展开，营造出震撼的视觉效果。阿诺河上的老桥两侧是传统金匠铺，桥上建筑的独特轮廓是绝佳的背景。米开朗基罗广场的山坡上可以拍摄到包含穹顶在内的城市全景，日落时分金色的光线洒满红瓦屋顶，画面温暖而壮丽。', description_en: 'Florence Cathedral, with its iconic red dome designed by Brunelleschi, is a masterpiece of Renaissance architecture and the most recognizable landmark of the Florence skyline.', highlights: JSON.stringify([]), price: 0, sort_order: 6, tags: JSON.stringify(['教堂', '穹顶', '文艺复兴', '城市地标']) },
    { slug: 'amalfi-coast', name: '阿马尔菲海岸', name_en: 'Amalfi Coast', country: '意大利', country_en: 'Italy', location: '坎帕尼亚', location_en: 'Campania', cover_image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1200&fit=crop', tagline: '地中海最迷人的海岸线', description: '阿马尔菲海岸位于意大利南部坎帕尼亚大区，绵延约50公里的悬崖海岸线上点缀着色彩斑斓的小镇、层叠的柠檬花园和碧蓝的第勒尼安海水。从波西塔诺的粉色与赤陶色房屋悬崖直落入海，到拉韦洛的空中花园俯瞰全景，每一个转弯都是一张明信片。这条海岸公路被誉为世界上最美的驾车路线之一，蜿蜒于峭壁与碧海之间。\n\n阿马尔菲海岸是欧洲旅拍的梦幻目的地。波西塔诺的阶梯小巷和鲜花阳台提供了充满南意风情的取景场景，从海滩仰望悬崖上层层叠叠的彩色房屋，画面极具戏剧性。拉韦洛的辛波内别墅和鲁福洛花园拥有海岸线上最壮观的观景平台，可以拍摄到无限延伸的海天一色。阿马尔菲大教堂的阿拉伯-诺曼风格立面和9世纪阶梯也是不可错过的拍摄点。', description_en: 'The Amalfi Coast stretches along 50 kilometers of cliffside coastline in southern Italy, dotted with colorful villages, lemon gardens, and azure waters.', highlights: JSON.stringify([]), price: 0, sort_order: 7, tags: JSON.stringify(['海岸', '悬崖', '海景', '田园']) },
    { slug: 'tuscany-countryside', name: '托斯卡纳田园', name_en: 'Tuscany Countryside', country: '意大利', country_en: 'Italy', location: '托斯卡纳', location_en: 'Tuscany', cover_image: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&fit=crop', tagline: '金色阳光下的橄榄园与葡萄藤', description: '托斯卡纳的田园风光是意大利最具诗意的自然景观之一。起伏的丘陵上遍布橄榄园、葡萄园和古老的石砌农庄，丝柏树如哨兵般排列在蜿蜒的小路两旁，构成了一幅永恒的田园画卷。从基安蒂的葡萄园到瓦尔多尔恰的金色麦浪，从圣吉米尼亚诺的中世纪塔楼到皮恩扎的理想城市，每一处都散发着文艺复兴以来未曾改变的宁静与优雅。\n\n这里是追求自然与人文完美融合的旅拍首选。清晨的薄雾笼罩在丘陵之间，阳光透过丝柏树洒下斑驳光影，营造出梦幻般的氛围。葡萄园在秋季转为金黄与深红，色彩层次丰富。一座孤零零的石砌农庄矗立在山顶，四周是无尽的田园——这就是托斯卡纳最经典的画面。圣吉米尼亚诺的中世纪塔楼群在天际线上勾勒出独特的轮廓，为画面增添了历史的厚重感。', description_en: 'The Tuscan countryside is one of Italy\'s most poetic landscapes, with rolling hills covered in olive groves, vineyards, and ancient stone farmhouses.', highlights: JSON.stringify([]), price: 0, sort_order: 8, tags: JSON.stringify(['田园', '葡萄园', '乡村', '金色']) },
    { slug: 'kirkjufell', name: '教堂山', name_en: 'Kirkjufell', country: '冰岛', country_en: 'Iceland', location: '斯奈山半岛', location_en: 'Snæfellsnes', cover_image: '/uploads/crawled/travel-attractions/kirkjufell.jpg', tagline: '冰岛最上镜的箭头形山峰', description: '教堂山是冰岛斯奈山半岛上最具标志性的山峰，因其独特的箭头形轮廓而得名。这座海拔463米的山峰矗立在格陵兰海畔，四周环绕着广袤的苔藓熔岩原，远处可眺望冰川与峡湾。无论春夏秋冬，教堂山都呈现出令人屏息的壮美景色，是冰岛出镜率最高的自然景观。\n\n这里是拍摄极光的绝佳地点。每年9月至次年3月，北极光在山峰上空舞动，绿色、紫色的光带与雪山交相辉映，构成一幅超现实的画面。夏季午夜阳光下的教堂山则笼罩在金色暖光中，别有一番韵味。山前的瀑布虽小，却为构图增添了层次感。\n\n从雷克雅未克出发约两小时车程即可到达，是冰岛西部最不可错过的旅拍目的地。', description_en: 'Kirkjufell is the most iconic mountain on the Snæfellsnes peninsula, known for its distinctive arrowhead shape.', highlights: JSON.stringify([]), price: 0, sort_order: 10, tags: JSON.stringify(['山峰', '极光', '地标', '雪山']) },
    { slug: 'jokulsarlon', name: '冰河湖', name_en: 'Jökulsárlón', country: '冰岛', country_en: 'Iceland', location: '瓦特纳冰川', location_en: 'Vatnajökull', cover_image: '/uploads/crawled/travel-attractions/jokulsarlon.jpg', tagline: '漂浮着千年冰块的冰川泻湖', description: '冰河湖是冰岛东南部瓦特纳冰川国家公园内的冰川泻湖，也是冰岛最深的湖泊之一。巨大的冰块从冰川前沿断裂后漂浮在湖面上，呈现出晶莹剔透的蓝色与白色，宛如散落在镜面上的宝石。远处的冰川舌在阳光照耀下闪烁着幽蓝的光芒，场面震撼人心。\n\n冰河湖对面的钻石沙滩同样令人惊叹——被海浪冲上岸的冰块散落在乌黑的火山沙滩上，在阳光下折射出钻石般的光芒。这里是冰岛最具超现实感的旅拍场景之一，每一帧都如同来自另一个星球。\n\n乘船穿行于冰块之间，或站在湖畔远眺冰川，都能获得绝佳的拍摄角度。冬季湖面结冰时更可直接走上冰面，近距离拍摄冰层内部的蓝色纹理。', description_en: 'Jökulsárlón is a glacial lagoon in Vatnajökull National Park, where massive icebergs calved from the glacier float on the still water.', highlights: JSON.stringify([]), price: 0, sort_order: 11, tags: JSON.stringify(['冰川', '湖泊', '自然', '钻石沙滩']) },
    { slug: 'skogafoss', name: '斯科加瀑布', name_en: 'Skógafoss', country: '冰岛', country_en: 'Iceland', location: '南部海岸', location_en: 'South Coast', cover_image: '/uploads/crawled/travel-attractions/skogafoss.jpg', tagline: '60米高的壮丽冰川瀑布', description: '斯科加瀑布是冰岛南部海岸最壮观的瀑布之一，落差达60米，宽25米，是冰岛最大的瀑布之一。瀑布从古老的冰川悬崖顶端倾泻而下，水雾弥漫，阳光照射时常常出现一道甚至双道彩虹横跨瀑布上方，场面极为壮观。\n\n瀑布两侧是陡峭的峡谷崖壁，底部有完善的步道系统，可以从多个角度拍摄。沿瀑布旁的阶梯攀登至顶部，可以俯瞰整个南部海岸线和冰川源头，视野开阔。瀑布下方的观景平台是拍摄全景的最佳位置，水雾扑面的感受更增添了身临其境的震撼。\n\n从雷克雅未克沿一号环岛公路约两小时即可到达，交通便利，是冰岛南部最热门的旅拍打卡地。', description_en: 'Skógafoss is one of the most spectacular waterfalls in Iceland, with a drop of 60 meters and width of 25 meters.', highlights: JSON.stringify([]), price: 0, sort_order: 12, tags: JSON.stringify(['瀑布', '自然', '彩虹', '徒步']) },
    { slug: 'reynisfjara', name: '黑沙滩', name_en: 'Reynisfjara', country: '冰岛', country_en: 'Iceland', location: '维克镇', location_en: 'Vík', cover_image: '/uploads/crawled/travel-attractions/reynisfjara.jpg', tagline: '玄武岩柱与黑色沙滩的异域奇观', description: '黑沙滩位于冰岛南部维克镇附近，是世界上最独特的海滩之一。乌黑发亮的火山砂铺满海岸，大西洋的巨浪不断拍打着岸边，溅起白色的浪花。海岸边矗立着整齐的六角形玄武岩柱群，如同大自然雕刻的管风琴，气势恢宏。\n\n海面上矗立的雷尼斯德兰格海蚀柱是黑沙滩的标志性景观——三根巨大的玄武岩柱从海中拔起，形态各异，在云雾缭绕中宛如远古巨人的剪影。这里是拍摄戏剧性海景和地质奇观的绝佳场所。\n\n需要注意的是，黑沙滩的浪涌极为凶猛，游客必须与海浪保持安全距离。拍摄时建议站在高处俯瞰全景，或走近玄武岩柱群拍摄细节纹理，两种视角都能呈现令人惊叹的画面。', description_en: 'Reynisfjara is a world-famous black sand beach near Vík, Iceland, known for its dramatic basalt column formations and powerful Atlantic waves.', highlights: JSON.stringify([]), price: 0, sort_order: 13, tags: JSON.stringify(['海滩', '玄武岩', '火山', '海蚀柱']) },
    { slug: 'landmannalaugar', name: '兰德曼纳劳卡', name_en: 'Landmannalaugar', country: '冰岛', country_en: 'Iceland', location: '高地', location_en: 'Highlands', cover_image: '/uploads/crawled/travel-attractions/landmannalaugar.jpg', tagline: '彩色流纹岩山脉与天然温泉', description: '兰德曼纳劳卡位于冰岛内陆高地，是世界上最色彩斑斓的自然景观之一。这里的流纹岩山脉呈现出令人难以置信的色调——赭红、橙黄、翠绿、灰蓝，如同一块巨大的调色盘铺展在大地上。冰川融水形成的溪流蜿蜒于彩色山谷之间，夏季绿草如茵，与远处的冰川相映成趣。\n\n这里是冰岛最著名的徒步目的地之一，著名的Laugavegur徒步路线便从这里出发。沿途可以拍摄到火山口、熔岩原、间歇泉和天然温泉池等多种地貌。山脚下的天然温泉是徒步后放松的绝佳去处，在热气氤氲中远眺彩色山脉，别有一番体验。\n\n由于地处高地，每年仅在6月至9月间可通过四驱车抵达。航拍视角下的兰德曼纳劳卡尤为壮观，色彩层次和地形纹理在高空一览无余。', description_en: 'Landmannalaugar is a stunning area in the Icelandic Highlands known for its colorful rhyolite mountains and natural hot springs.', highlights: JSON.stringify([]), price: 0, sort_order: 14, tags: JSON.stringify(['山脉', '温泉', '徒步', '彩色地貌']) },
  ]

  for (const a of attractions) {
    await pool.execute(
      `INSERT INTO crawled_travel_attractions (slug, name, name_en, country, country_en, location, location_en, cover_image, tagline, description, description_en, highlights, price, sort_order, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.slug, a.name, a.name_en, a.country, a.country_en, a.location, a.location_en, a.cover_image, a.tagline, a.description, a.description_en, a.highlights, a.price, a.sort_order, a.tags]
    )
  }
  console.log(`✓ 已插入 ${attractions.length} 条旅拍景点种子数据`)
}

/**
 * 创建埋点事件表
 */
async function ensureAnalyticsEventsTable(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL COMMENT '会话标识（前端生成）',
      user_token VARCHAR(64) DEFAULT '' COMMENT '用户标识（登录用户/访客）',
      event_type VARCHAR(50) NOT NULL COMMENT '事件类型：page_view / click / add_cart / consult ...',
      page_path VARCHAR(300) DEFAULT '' COMMENT '当前页面路径',
      referrer VARCHAR(300) DEFAULT '' COMMENT '来源页面',
      element_id VARCHAR(100) DEFAULT '' COMMENT '触发元素标识（点击事件用）',
      metadata JSON COMMENT '扩展数据 {product_id, category, price, ...}',
      user_agent VARCHAR(500) DEFAULT '' COMMENT '设备信息',
      ip VARCHAR(45) DEFAULT '' COMMENT '访客IP',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id),
      INDEX idx_event_type (event_type),
      INDEX idx_user_token (user_token),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='埋点事件表'
  `)
  console.log('✓ 表 analytics_events 已就绪')
}

module.exports = { pool, initDB, getCategoryTable, ensureCategoryTable, ensureDestinationTable, ensureWeddingTeamsTable, ensureCrawledPhotographersTable, ensureCrawledFloristsTable, ensureCrawledVenuesTable, ensureCrawledDressesTable, ensureCrawledTravelAttractionsTable, seedTravelAttractions, ensureAnalyticsEventsTable }
