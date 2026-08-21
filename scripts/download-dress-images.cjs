// 下载所有礼服图片和视频到本地
// 存储路径: uploads/crawled/dresses/{slug}/images/ 和 videos/
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..', 'uploads', 'crawled', 'dresses');
const DATA_FILE = path.join(__dirname, '..', '..', 'Verra-Voile', 'src', 'data', 'wonaDressProducts.ts');

const CONCURRENCY = 8; // 并发下载数

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(dest)) {
      const stat = fs.statSync(dest);
      if (stat.size > 0) return resolve({ url, dest, skipped: true });
    }
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return resolve({ url, dest, error: `HTTP ${res.statusCode}` });
      }
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', () => {
        ws.close();
        resolve({ url, dest, size: fs.statSync(dest).size });
      });
      ws.on('error', (e) => { fs.unlinkSync(dest); resolve({ url, dest, error: e.message }); });
    });
    req.on('error', (e) => resolve({ url, dest, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, dest, error: 'timeout' }); });
  });
}

function parseProducts() {
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  const products = [];
  // Split by slug entries
  const blocks = content.split(/\{\s*slug:/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const slugMatch = block.match(/^\s*['"]([^'"]+)['"]/);
    if (!slugMatch) continue;
    const slug = slugMatch[1];

    // Extract images array
    const imagesMatch = block.match(/images:\s*\[([\s\S]*?)\]/);
    const images = [];
    if (imagesMatch) {
      const urlMatches = imagesMatch[1].matchAll(/'(https?:\/\/[^']+)'/g);
      for (const m of urlMatches) images.push(m[1]);
    }

    // Extract cover
    const coverMatch = block.match(/cover:\s*'(https?:\/\/[^']+)'/);
    if (coverMatch && !images.includes(coverMatch[1])) {
      images.unshift(coverMatch[1]);
    }

    // Extract video
    const videoMatch = block.match(/video:\s*'(https?:\/\/[^']+)'/);
    const video = videoMatch ? videoMatch[1] : null;

    products.push({ slug, images, video });
  }
  return products;
}

async function runWithConcurrency(tasks, limit) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log('解析商品数据...');
  const products = parseProducts();
  console.log(`共 ${products.length} 件商品`);

  const tasks = [];
  let totalImages = 0, totalVideos = 0;

  for (const p of products) {
    for (let i = 0; i < p.images.length; i++) {
      const url = p.images[i];
      const ext = path.extname(new URL(url).pathname) || '.jpg';
      const filename = `${String(i).padStart(2, '0')}${ext}`;
      const dest = path.join(BASE_DIR, p.slug, 'images', filename);
      tasks.push(() => download(url, dest));
      totalImages++;
    }
    if (p.video) {
      const ext = path.extname(new URL(p.video).pathname) || '.webm';
      const dest = path.join(BASE_DIR, p.slug, 'videos', `video${ext}`);
      tasks.push(() => download(p.video, dest));
      totalVideos++;
    }
  }

  console.log(`待下载: ${totalImages} 张图片 + ${totalVideos} 个视频 = ${tasks.length} 个文件`);
  console.log(`存储目录: ${BASE_DIR}`);
  console.log(`并发数: ${CONCURRENCY}`);
  console.log('开始下载...\n');

  const start = Date.now();
  const results = await runWithConcurrency(tasks, CONCURRENCY);

  let success = 0, skipped = 0, failed = 0, totalSize = 0;
  const errors = [];
  for (const r of results) {
    if (!r) continue;
    if (r.skipped) { skipped++; success++; }
    else if (r.error) { failed++; errors.push(r); }
    else { success++; totalSize += r.size || 0; }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n===== 下载完成 =====`);
  console.log(`成功: ${success} (跳过已存在: ${skipped})`);
  console.log(`失败: ${failed}`);
  console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`耗时: ${elapsed}s`);

  if (errors.length > 0 && errors.length <= 20) {
    console.log('\n失败文件:');
    for (const e of errors) console.log(`  ${e.error}: ${e.url}`);
  }
}

main().catch(console.error);
