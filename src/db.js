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

module.exports = { pool, initDB, getCategoryTable, ensureCategoryTable }
