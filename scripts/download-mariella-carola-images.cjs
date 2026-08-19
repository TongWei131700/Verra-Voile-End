/**
 * Mariella Carola Fiori 图片下载脚本（使用 Puppeteer 绕过 CDN）
 * 
 * 从 Junebug CDN 下载 21 张作品集图片 + 1 张商品图到本地
 */

require('dotenv').config();
const puppeteer = require('puppeteer-core');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'crawled', 'mariella-carola-fiori');
const PRODUCTS_DIR = path.join(UPLOADS_DIR, 'products');
const PORTFOLIO_DIR = path.join(UPLOADS_DIR, 'portfolio');

async function getPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
    waitForConnections: true,
    connectionLimit: 5,
  });
}

async function downloadImage(page, url, outputPath, index, total) {
  try {
    // 已存在则跳过
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
      console.log(`  ⏭ [${index}/${total}] 已存在: ${path.basename(outputPath)} (${size}KB)`);
      return true;
    }

    process.stdout.write(`  ⬇ [${index}/${total}] 下载中...`);

    // 导航到图片URL
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });

    // 用 canvas 提取图片数据
    const base64 = await page.evaluate(() => {
      const img = document.querySelector('img') || document.images[0];
      if (!img || !img.naturalWidth) throw new Error('No image found');
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      return dataUrl.split('base64,')[1];
    });

    if (!base64) throw new Error('Canvas extraction failed');
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length < 1000) {
      throw new Error(`Image too small: ${buffer.length} bytes`);
    }

    fs.writeFileSync(outputPath, buffer);
    const size = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(` ✓ ${size}KB`);
    return true;
  } catch (err) {
    console.log(` ✗ ${err.message}`);
    return false;
  }
}

async function main() {
  const pool = await getPool();
  console.log('✓ 数据库已连接');

  // 创建目录
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PORTFOLIO_DIR)) {
    fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });
  }

  // 启动浏览器
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  console.log('✓ 浏览器已启动');

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // 先导航到 Junebug 建立会话上下文
  try {
    await page.goto('https://junebugweddings.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('✓ 已建立 Junebug 会话上下文');
  } catch (e) {
    console.log('⚠ Junebug 首页加载超时，继续尝试...');
  }

  // 获取花店数据
  const [rows] = await pool.execute(
    'SELECT portfolio_images FROM crawled_florists WHERE slug = ?',
    ['mariella-carola-fiori']
  );
  
  let portfolioImages = rows[0].portfolio_images;
  if (typeof portfolioImages === 'string') {
    portfolioImages = JSON.parse(portfolioImages);
  }

  console.log(`\n📷 共 ${portfolioImages.length} 张作品集图片`);

  // 下载作品集图片
  let successCount = 0;
  for (let i = 0; i < portfolioImages.length; i++) {
    const url = portfolioImages[i];
    const filename = `portfolio-${i + 1}.jpg`;
    const outputPath = path.join(PORTFOLIO_DIR, filename);
    
    const success = await downloadImage(page, url, outputPath, i + 1, portfolioImages.length);
    if (success) successCount++;
  }

  console.log(`\n✓ 作品集图片下载完成: ${successCount}/${portfolioImages.length}`);

  // 更新数据库中的图片路径为本地路径
  const localPaths = portfolioImages.map((_, i) => `/uploads/crawled/mariella-carola-fiori/portfolio/portfolio-${i + 1}.jpg`);
  
  await pool.execute(
    'UPDATE crawled_florists SET portfolio_images = ? WHERE slug = ?',
    [JSON.stringify(localPaths), 'mariella-carola-fiori']
  );
  console.log('✓ 数据库已更新（作品集图片路径）');

  // 商品图已经存在，无需重复下载
  console.log('\n✅ 全部完成！');

  await browser.close();
  await pool.end();
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
