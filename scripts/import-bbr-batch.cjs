/**
 * BBR 批量入库脚本
 * 将爬取的 BBR 产品数据写入 products_wine 表
 * 
 * 用法: node import-bbr-batch.cjs [category]
 * 示例: node import-bbr-batch.cjs all
 *       node import-bbr-batch.cjs champagne
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, 'bbr-data');

// 分类配置：映射到数据库 tags
const CATEGORY_MAP = {
  champagne: { type: '香槟', region: '法国' },
  red:       { type: '红葡萄酒', region: null }, // 从产品数据中取
  white:     { type: '白葡萄酒', region: null },
  rose:      { type: '桃红葡萄酒', region: null },
  sparkling: { type: '起泡酒', region: null },
};

// icon 映射：根据属性选择正确的 icon
function getIcon(label) {
  const map = {
    '色泽': 'droplet', '颜色': 'droplet', 'colour': 'droplet',
    '甜度': 'glass', '口感': 'glass', 'sweetness': 'glass',
    '年份': 'calendar', 'vintage': 'calendar',
    '酒精度': 'percent', 'alcohol': 'percent',
    '成熟度': 'clock', 'maturity': 'clock',
    '品种': 'grape', 'grape': 'grape',
    '酒体': 'body', 'body': 'body',
    '产区': 'producer', '酒庄': 'producer', 'producer': 'producer',
  };
  for (const [key, icon] of Object.entries(map)) {
    if (label.includes(key)) return icon;
  }
  return 'producer'; // 默认
}

// 颜色映射到色泽描述
function colourToValue(colour) {
  const map = {
    'Red': '红葡萄酒', 'White': '白葡萄酒', 'Rosé': '桃红葡萄酒',
  };
  return map[colour] || colour || '葡萄酒';
}

// 甜度映射
function sweetnessToValue(sweetness) {
  const map = {
    'Very Dry': '特干 (Extra Brut)',
    'Dry': '干 (Brut)',
    'Medium Dry': '半干 (Extra Dry)',
    'Medium': '半甜 (Sec)',
    'Sweet': '甜 (Doux)',
  };
  return map[sweetness] || sweetness || '';
}

// 构建 overview JSON
function buildOverview(product) {
  const attributes = [];

  // 色泽
  if (product.colour) {
    attributes.push({ icon: 'droplet', label: '色泽', value: colourToValue(product.colour) });
  }
  // 甜度
  if (product.sweetness) {
    attributes.push({ icon: 'glass', label: '甜度', value: sweetnessToValue(product.sweetness) });
  }
  // 年份
  if (product.vintage) {
    attributes.push({ icon: 'calendar', label: '年份', value: String(product.vintage) });
  }
  // 酒精度
  if (product.alcohol_percentage) {
    attributes.push({ icon: 'percent', label: '酒精度', value: `${product.alcohol_percentage}%` });
  }
  // 成熟度
  if (product.maturity) {
    attributes.push({ icon: 'clock', label: '成熟度', value: product.maturity });
  }
  // 品种
  if (product.grape_varieties && product.grape_varieties.length > 0) {
    attributes.push({ icon: 'grape', label: '品种', value: product.grape_varieties.join(', ') });
  }
  // 产区
  const regionParts = [product.subregion, product.region].filter(Boolean);
  if (regionParts.length > 0) {
    attributes.push({ icon: 'producer', label: '产区', value: regionParts.join(' > ') });
  }
  // 酒庄
  if (product.producer) {
    attributes.push({ icon: 'producer', label: '酒庄', value: product.producer });
  }

  return {
    description: `${product.vintage || ''} ${product.name}`.trim(),
    attributes,
    aboutItems: [],
  };
}

// 构建 tags JSON
function buildTags(product, categoryKey) {
  const catConfig = CATEGORY_MAP[categoryKey] || {};
  return {
    type: catConfig.type || '葡萄酒',
    region: product.country || catConfig.region || '',
    vintage: product.vintage ? String(product.vintage) : '',
  };
}

// 构建 buying_options JSON
function buildBuyingOptions(product) {
  const options = [];
  
  // 从 purchase_options 构建
  if (product.purchase_options && product.purchase_options.length > 0) {
    product.purchase_options.forEach((po, i) => {
      if (po.price_per_bottle || po.price_per_case) {
        options.push({
          name: po.bottle_volume || '75cl',
          price: Math.round(po.price_per_bottle || 0),
          spec: po.bottle_volume || '75cl',
          purchase_mode: po.purchase_mode || '',
          case_price: po.price_per_case || null,
          case_size: po.case_size || null,
        });
      }
    });
  }

  // 如果没有 purchase_options，用总价
  if (options.length === 0 && product.price_per_bottle) {
    options.push({
      name: '75cl',
      price: Math.round(product.price_per_bottle),
      spec: '75cl',
    });
  }

  return options;
}

// 构建 highlights
function buildHighlights(product) {
  const highlights = [];
  if (product.grape_varieties?.length) highlights.push(...product.grape_varieties);
  if (product.subregion) highlights.push(product.subregion);
  if (product.maturity) highlights.push(product.maturity);
  return highlights.slice(0, 4);
}

// 生成 product_id (slug)
function genProductId(product) {
  // 使用 BBR 的 slug，去掉开头的年份前缀如果太长
  let slug = product.slug || '';
  if (!slug) {
    // 从 name 生成
    slug = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  }
  return slug;
}

// 主入库函数
async function importCategory(categoryKey) {
  const dataFile = path.join(DATA_DIR, `${categoryKey}-all.json`);
  if (!fs.existsSync(dataFile)) {
    console.log(`  ⚠️ 数据文件不存在: ${dataFile}`);
    return 0;
  }

  const products = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  console.log(`\n📥 开始入库: ${categoryKey} (${products.length} 款)`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  });

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const productId = genProductId(product);
    if (!productId) {
      skipped++;
      continue;
    }

    // 检查是否已存在
    const [existing] = await conn.execute(
      'SELECT id FROM products_wine WHERE product_id = ?',
      [productId]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // 构建各字段
    const name = product.name.replace(/^\d{4}\s+/, ''); // 去掉开头年份
    const nameEn = name;
    const description = `${product.vintage || ''} ${product.name} - ${product.region || ''} ${product.subregion || ''}`.trim();
    const image = `/uploads/crawled/wine/${productId}.jpg`;
    const price = Math.round(product.price_per_bottle || 0);
    const unit = '£';
    const capacity = product.purchase_options?.find(po => po.bottle_volume)?.bottle_volume || '75cl';
    const tagline = [product.producer, product.subregion, product.region].filter(Boolean).join(' · ');
    const highlights = buildHighlights(product);
    const overview = buildOverview(product);
    const tags = buildTags(product, categoryKey);
    const buyingOptions = buildBuyingOptions(product);
    const sourceUrl = `https://www.bbr.com/products-${product.parent_sku}-${productId}`;

    try {
      await conn.execute(
        `INSERT INTO products_wine 
         (product_id, name, name_en, description, image, price, unit, capacity, 
          highlight, tagline, images, highlights, overview, tags, buying_options, 
          source_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productId,
          name,
          nameEn,
          description,
          image,
          price,
          unit,
          capacity,
          highlights[0] || null,
          tagline,
          JSON.stringify([]), // images
          JSON.stringify(highlights),
          JSON.stringify(overview),
          JSON.stringify(tags),
          JSON.stringify(buyingOptions),
          sourceUrl,
        ]
      );
      inserted++;
    } catch (e) {
      console.error(`  ❌ 入库失败 [${productId}]: ${e.message}`);
      errors++;
    }
  }

  await conn.end();

  console.log(`  ✅ 入库完成: 新增 ${inserted}, 跳过 ${skipped}, 失败 ${errors}`);
  return inserted;
}

// ===== 执行 =====
async function main() {
  const categoryArg = process.argv[2] || 'all';
  console.log('🍷 BBR 批量入库');
  console.log(`   分类: ${categoryArg}`);

  let totalInserted = 0;

  if (categoryArg === 'all') {
    for (const cat of ['champagne', 'red', 'white', 'rose', 'sparkling']) {
      const count = await importCategory(cat);
      totalInserted += count;
    }
  } else {
    totalInserted = await importCategory(categoryArg);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 总计入库: ${totalInserted} 款新产品`);
}

main().catch(e => {
  console.error('致命错误:', e.message);
  process.exit(1);
});
