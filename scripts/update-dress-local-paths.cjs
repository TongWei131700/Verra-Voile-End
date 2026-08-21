// 将礼服数据中的远程 URL 替换为本地路径
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', '..', 'Verra-Voile', 'src', 'data', 'wonaDressProducts.ts');
const BASE = '/uploads/crawled/dresses';

let content = fs.readFileSync(DATA_FILE, 'utf-8');

// 收集所有 wonaconcept URL
const allUrls = new Set();
const urlRegex = /https:\/\/wonaconcept\.com\/upload\/[^'"\s,]+/g;
let m;
while ((m = urlRegex.exec(content)) !== null) {
  allUrls.add(m[0]);
}
console.log(`找到 ${allUrls.size} 个唯一远程 URL`);

// 解析每个商品，建立 URL -> 本地路径映射
const urlMap = new Map(); // url -> localPath
const blocks = content.split(/\{\s*slug:\s*['"]/);

for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  const slugEnd = block.indexOf("'");
  const slugEnd2 = block.indexOf('"');
  const end = slugEnd >= 0 ? slugEnd : slugEnd2;
  if (end < 0) continue;
  const slug = block.substring(0, end);
  const rest = block.substring(end);

  // 提取 images 数组中的 URL（保持顺序）
  const imagesMatch = rest.match(/images:\s*\[([\s\S]*?)\]/);
  const imageUrls = [];
  if (imagesMatch) {
    const inner = imagesMatch[1];
    const imgUrlRe = /'(https:\/\/wonaconcept\.com\/upload\/[^']+)'/g;
    let im;
    while ((im = imgUrlRe.exec(inner)) !== null) imageUrls.push(im[1]);
  }

  // 提取 cover
  const coverMatch = rest.match(/cover:\s*'(https:\/\/wonaconcept\.com\/upload\/[^']+)'/);
  const coverUrl = coverMatch ? coverMatch[1] : null;

  // 提取 video
  const videoMatch = rest.match(/video:\s*'(https:\/\/wonaconcept\.com\/upload\/[^']+)'/);
  const videoUrl = videoMatch ? videoMatch[1] : null;

  // 建立映射：images 数组按索引
  imageUrls.forEach((url, idx) => {
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    urlMap.set(url, `${BASE}/${slug}/images/${String(idx).padStart(2, '0')}${ext}`);
  });

  // cover 如果不在 images 中，下载脚本会把它放在 index 0
  if (coverUrl && !imageUrls.includes(coverUrl)) {
    const ext = path.extname(new URL(coverUrl).pathname) || '.jpg';
    urlMap.set(coverUrl, `${BASE}/${slug}/images/00${ext}`);
    // 原来的 images 索引需要 +1
    imageUrls.forEach((url, idx) => {
      urlMap.set(url, `${BASE}/${slug}/images/${String(idx + 1).padStart(2, '0')}${ext}`);
    });
  }

  // video
  if (videoUrl) {
    const ext = path.extname(new URL(videoUrl).pathname) || '.webm';
    urlMap.set(videoUrl, `${BASE}/${slug}/videos/video${ext}`);
  }
}

console.log(`映射 ${urlMap.size} 个 URL`);

// 替换
for (const [url, localPath] of urlMap) {
  content = content.split(url).join(localPath);
}

fs.writeFileSync(DATA_FILE, content, 'utf-8');

// 验证
const updated = fs.readFileSync(DATA_FILE, 'utf-8');
const remaining = (updated.match(/https:\/\/wonaconcept\.com\/upload/g) || []).length;
console.log(`替换完成，剩余远程 upload URL: ${remaining}`);
