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

  // 爬取目的地试验表
  await ensureCrawledDestinationsTable(pool)
  await seedCrawledDestinations(pool)

  // 目的地场地表（含城市分组字段）
  await ensureDestinationTable(pool)
  await seedDestinationVenues(pool)
}

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
    { id: 'wine', name: '酒水', name_en: 'Wine & Dining', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=800&fit=crop', description: '精选婚宴佳酿', sort_order: 3 },
    { id: 'dress', name: '礼服', name_en: 'Dress', image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&h=800&fit=crop', description: '梦想中的嫁衣', sort_order: 4 },
    { id: 'catering', name: '宴席', name_en: 'Catering', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=800&fit=crop', description: '米其林级飨宴', sort_order: 5 },
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
    // wine
    { category_id: 'wine', product_id: 'maslina', name: 'Maslina Resort 酒店', name_en: 'Maslina Resort', description: '精品度假酒店住宿，地中海风格的私密空间', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop', price: 450, unit: '€', capacity: '含早餐', highlight: '', sort_order: 1 },
    { category_id: 'wine', product_id: 'dinner', name: '酒店海边小晚宴', name_en: 'Seaside Dinner', description: '海滨私密晚宴体验，日落时分享用地中海美食', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', price: 380, unit: '€', capacity: '6人宴席', highlight: '推荐', sort_order: 2 },
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
      `INSERT INTO crawled_destinations (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, cover_image, cover_image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.slug, d.name, d.name_cn, d.country, d.country_cn, d.source_url, d.tagline, d.description, d.features, d.venue_types, d.towns, d.images, d.budget_ranges, d.guest_capacities, d.cover_image, d.cover_image_url || d.cover_image, d.sort_order]
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
    }
  ]

  for (const d of newDests) {
    const [existing] = await pool.execute('SELECT id FROM crawled_destinations WHERE slug = ?', [d.slug])
    if (existing.length > 0) continue

    await pool.execute(
      `INSERT INTO crawled_destinations (slug, name, name_cn, country, country_cn, source_url, tagline, description, features, venue_types, towns, images, budget_ranges, guest_capacities, cover_image, cover_image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.slug, d.name, d.name_cn, d.country, d.country_cn, d.source_url, d.tagline, d.description, d.features, d.venue_types, d.towns, d.images, d.budget_ranges, d.guest_capacities, d.cover_image, d.cover_image_url || d.cover_image, d.sort_order]
    )
    console.log(`✓ 新增爬取目的地: ${d.name_cn} (${d.slug})`)
  }
}

module.exports = { pool, initDB, getCategoryTable, ensureCategoryTable, ensureDestinationTable }
