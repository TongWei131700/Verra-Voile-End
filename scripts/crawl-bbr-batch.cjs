/**
 * BBR 批量爬取脚本 — 全自动：curl 获取页面 → 解析 JSON-LD → 下载图片 → 入库
 * 用法: node crawl-bbr-batch.cjs <category_url> <count>
 * 示例: node crawl-bbr-batch.cjs https://www.bbr.com/rose-wines 10
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = "/Users/hongli/WorkSpace/Verra-Voile-End/uploads/crawled/wine";
const FRONTEND_UPLOAD_DIR = "/Users/hongli/WorkSpace/Verra-Voile/uploads/crawled/wine";
const BARREL_MD5 = "eb690da5de7d1fef53d968125d99aef5";
const DEFAULT_WINE_SIZE = 29019; // ~29KB 默认酒图

// 品种翻译表
const GRAPE_MAP = {
  "Grenache": "歌海娜", "Roussanne": "瑚珊", "Carignan": "佳利酿",
  "Pinot Noir": "黑皮诺", "Chardonnay": "霞多丽", "Sauvignon Blanc": "长相思",
  "Riesling": "雷司令", "Merlot": "梅洛", "Cabernet Sauvignon": "赤霞珠",
  "Syrah": "西拉", "Shiraz": "西拉", "Viognier": "维欧尼", "Sémillon": "赛美蓉",
  "Mourvèdre": "慕合怀特", "Cinsault": "神索", "Garganega": "卡尔卡耐卡",
  "Malagousia": "马拉古西亚", "Hondarribi Zuri": "翁达里比祖里",
  "Furmint": "富尔民特", "Hárslevelű": "哈斯莱威路",
  "Godello": "格德约", "Albariño": "阿尔巴利诺", "Verdejo": "弗德乔",
  "Tempranillo": "丹魄", "Graciano": "格拉西亚诺", "Mazuelo": "马苏埃洛",
  "Corvina": "科维纳", "Rondinella": "罗蒂内拉", "Molinara": "莫利纳拉",
  "Sangiovese": "桑娇维塞", "Nebbiolo": "内比奥罗", "Barbera": "巴贝拉",
  "Dolcetto": "多姿桃", "Trebbiano": "特雷比奥罗", "Vermentino": "维蒙蒂诺",
  "Cortese": "柯蒂斯", "Arneis": "阿内斯", "Fiano": "菲亚诺",
  "Greco": "格雷克", "Falanghina": "法兰吉娜", "Cataratto": "卡塔拉托",
  "Grillo": "格里洛", "Inzolia": "因佐利亚", "Nero d'Avola": "黑达沃拉",
  "Primitivo": "普里米蒂沃", "Negroamaro": "黑曼罗", "Aglianico": "艾格尼科",
  "Pinot Gris": "灰皮诺", "Pinot Grigio": "灰皮诺", "Gewürztraminer": "琼瑶浆",
  "Muscat": "麝香", "Moscato": "莫斯卡托", "Chenin Blanc": "白诗南",
  "Marsanne": "玛珊", "Viura": "维乌拉", "Macabeo": "马卡贝奥",
  "Xarel·lo": "沙雷洛", "Parellada": "帕雷亚达", "Garnacha": "歌海娜",
  "Monastrell": "慕合怀特", "Bobal": "博巴尔", "Mencía": "门西亚",
  "Touriga Nacional": "国产多瑞加", "Touriga Franca": "多瑞加弗兰卡",
  "Tinta Roriz": "罗丽红", "Tinta Barroca": "巴罗卡", "Tinto Cão": "红狗",
  "Baga": "巴加", "Encruzado": "恩克鲁萨多", "Arinto": "阿林托",
  "Rabigato": "拉比加多", "Viosinho": "维奥西尼奥", "Gouveio": "格维奥",
  "Malbec": "马尔贝克", "Cabernet Franc": "品丽珠", "Petit Verdot": "小维多",
  "Carménère": "佳美娜", "Tannat": "丹娜", "Zinfandel": "仙粉黛",
  "Petite Sirah": "小西拉", "Mourvèdre": "慕合怀特", "Cinsaut": "神索",
  "Grenache Blanc": "白歌海娜", "Grenache Gris": "灰歌海娜",
  "Sémillon": "赛美蓉", "Muscadelle": "密斯卡岱", "Sauvignon Gris": "灰长相思",
  "Colombard": "鸽笼白", "Ugni Blanc": "白玉霓", "Sémillon": "赛美蓉",
};

function translateGrape(name) {
  return GRAPE_MAP[name] || name;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

function md5File(filePath) {
  try {
    return execSync(`md5 -q "${filePath}"`).toString().trim();
  } catch { return ""; }
}

function downloadImage(url, filename) {
  const filepath = path.join(UPLOAD_DIR, filename);
  try {
    execSync(`curl -sL "${url}" -o "${filepath}"`, { timeout: 30000 });
    const stat = fs.statSync(filepath);
    if (stat.size < 1000) {
      fs.unlinkSync(filepath);
      return { success: false, reason: "too small" };
    }
    const md5 = md5File(filepath);
    if (md5 === BARREL_MD5) {
      // 酒桶占位图，替换为默认酒图
      const productCode = filename.replace(/\.jpg$/, "").replace(/-grape|-region|-producer|-20\d{2}/, "");
      console.log(`  ⚠️  ${filename} 是酒桶占位图，尝试 /s/ 路径...`);
      const sUrl = url.replace(/\/i\//, "/s/").replace(/\?.*/, `?img404=Default_Wine&fmt=auto&qlt=default&w=944&h=944`);
      execSync(`curl -sL "${sUrl}" -o "${filepath}"`, { timeout: 30000 });
      const newSize = fs.statSync(filepath).size;
      if (newSize === DEFAULT_WINE_SIZE || newSize < 50000) {
        console.log(`  📦 使用默认酒图 (${newSize} bytes)`);
      } else {
        console.log(`  ✅ /s/ 路径获取到真实图片 (${newSize} bytes)`);
      }
    } else {
      console.log(`  ✅ ${filename} (${stat.size} bytes)`);
    }
    return { success: true, filepath };
  } catch (e) {
    return { success: false, reason: e.message };
  }
}

function parseProductPage(html, url) {
  const data = {};

  // 提取完整 JSON-LD Product 对象
  const productStart = html.indexOf('"@type":"Product"');
  if (productStart < 0) return data;

  // 从 "@type":"Product" 往前找到 { 开始
  let jsonStart = html.lastIndexOf('{', productStart);
  // 往后找到匹配的 }
  let depth = 0, jsonEnd = jsonStart;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
  }

  const jsonStr = html.substring(jsonStart, jsonEnd);
  let product;
  try {
    product = JSON.parse(jsonStr);
  } catch (e) {
    console.log(`  ⚠️ JSON 解析失败: ${e.message}`);
    return data;
  }

  data.nameEn = (product.name || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  data.description = (product.description || "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  data.imageUrl = (product.image || "").replace(/\$deskPDP\$/, "").replace(/&amp;/g, "&");
  data.sku = product.mpn || "";
  data.brand = product.brand?.name || "";
  data.price = product.offers?.price || 0;

  // 属性
  if (product.additionalProperty && Array.isArray(product.additionalProperty)) {
    data.attributes = {};
    for (const a of product.additionalProperty) {
      if (a.name && a.value && !data.attributes[a.name]) {
        data.attributes[a.name] = a.value;
      }
    }
  }

  // 购买选项
  if (product.hasVariant && Array.isArray(product.hasVariant)) {
    data.buyingOptions = product.hasVariant.map(v => {
      const offers = v.offers || {};
      const specMatch = offers.sku?.match(/(\d+)\s*x\s*(\d+\s*cl)/);
      return {
        name: v.name || "单瓶",
        spec: specMatch ? specMatch[0] : "1 x 75cl",
        unit: "£",
        price: offers.price || data.price || 0,
      };
    });
  }

  // 年份 & 容量
  const yearMatch = url.match(/products-(\d{4})\d{5,}/);
  if (yearMatch) data.vintage = yearMatch[1];
  if (data.attributes?.["Bottle Volume"]) data.capacity = data.attributes["Bottle Volume"].trim();

  return data;
}

function buildWineRecord(parsed, url) {
  const attrs = parsed.attributes || {};
  const colour = attrs["Colour"] || "";
  const sweetness = attrs["Sweetness"] || "";
  const body = attrs["Body"] || "";
  const maturity = attrs["Maturity"] || "";
  const alcohol = attrs["Alcohol %"] || "";
  const producer = attrs["Producer"] || parsed.brand || "";
  const region = attrs["Region Info"] || "";
  const vintage = parsed.vintage || attrs["Vintage"] || "";

  // 品种
  const grapeList = attrs["Grape List"] || "";
  const grapes = grapeList ? grapeList.split(",").map(g => translateGrape(g.trim())) : [];

  // 类型映射
  const typeMap = { "Red": "红葡萄酒", "White": "白葡萄酒", "Rosé": "桃红葡萄酒", "Rose": "桃红葡萄酒", "Dessert": "甜葡萄酒", "Fortified": "加强型葡萄酒", "Sparkling": "起泡酒" };
  const wineType = typeMap[colour] || colour || "葡萄酒";

  // 生成 productId
  const nameParts = (parsed.nameEn || "").split(",").map(s => s.trim());
  const productId = slugify(`${nameParts.slice(0, 3).join("-")}-${vintage}`);

  // 中文名：年份 + 品种/酒款 + 酒庄
  // nameEn 格式: "2025 Domaine Zafeirakis, Malagousia, Tyrnavos, Greece"
  const grapeCn = grapes.length > 0 ? grapes.join("/") : "";
  const producerCn = producer ? `${producer}酒庄` : "";
  // 从 nameParts[0] 去掉年份得到酒款名
  const wineNamePart = nameParts[0]?.replace(/^\d{4}\s*/, "") || "";
  const name = `${vintage} ${grapeCn || wineNamePart} ${producerCn}`.replace(/\s+/g, " ").trim();

  // 属性网格
  const iconMap = {
    "Colour": { icon: "droplet", label: "色泽", value: colour },
    "Sweetness": { icon: "glass", label: "甜度", value: sweetness },
    "Vintage": { icon: "calendar", label: "年份", value: vintage },
    "Alcohol %": { icon: "percent", label: "酒精度", value: alcohol ? `${alcohol}%` : "" },
    "Maturity": { icon: "clock", label: "适饮期", value: maturity },
    "Grape List": { icon: "grape", label: "品种", value: grapeList },
    "Body": { icon: "body", label: "酒体", value: body },
    "Producer": { icon: "producer", label: "酒庄", value: producer },
    "Region Info": { icon: "producer", label: "产区", value: region },
  };

  const attributes = [];
  for (const [key, cfg] of Object.entries(iconMap)) {
    if (attrs[key] || key === "Grape List") {
      attributes.push({ ...cfg, value: attrs[key] || cfg.value || "" });
    }
  }

  // 购买选项
  const buyingOptions = parsed.buyingOptions || [
    { name: "单瓶", spec: `1 x ${parsed.capacity || "75cl"}`, unit: "£", price: parsed.price || 0 }
  ];

  // 图片
  const imageFilename = `${productId}.jpg`;
  const imageUrl = parsed.imageUrl
    ? parsed.imageUrl.replace(/\$deskPDP\$/, "").replace(/&amp;/g, "&")
    : `https://media.bbr.com/s/bbr/${parsed.sku}-ms?img404=Default_Wine&fmt=auto&qlt=default&w=944&h=944`;

  const record = {
    productId,
    name,
    nameEn: parsed.nameEn || "",
    price: Math.round(parsed.price || 0),
    capacity: parsed.capacity || "75cl",
    image: `/uploads/crawled/wine/${imageFilename}`,
    images: [`/uploads/crawled/wine/${imageFilename}`],
    tagline: "",
    tags: { type: wineType, region: region || "", vintage: vintage || "" },
    highlights: grapes.length > 0 ? [`100% ${grapes.join("/")}`] : [],
    buyingOptions,
    overview: {
      description: parsed.description || "",
      attribution: "Berry Bros. & Rudd",
      attributes,
      aboutItems: [],
    },
    sourceUrl: url,
    imageUrl,
    imageFilename,
  };

  return record;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("用法: node crawl-bbr-batch.cjs <category_url> <count>");
    console.log("示例: node crawl-bbr-batch.cjs https://www.bbr.com/rose-wines 10");
    process.exit(1);
  }

  const categoryUrl = args[0];
  const count = parseInt(args[1]) || 10;

  console.log(`🍷 BBR 批量爬取: ${categoryUrl} (目标 ${count} 款)\n`);

  // Step 1: 从分类页提取产品 URL
  console.log("📋 步骤 1: 从分类页提取产品 URL...");
  const tmpFile = "/tmp/bbr-category.html";
  execSync(`curl -s "${categoryUrl}" -o "${tmpFile}"`, { timeout: 30000 });
  const categoryHtml = fs.readFileSync(tmpFile, "utf-8");
  const urls = [...new Set(
    categoryHtml.match(/href="\/products-\d+-[^"]+"/g) || []
  )]
    .map(h => `https://www.bbr.com${h.replace('href="', "").replace('"', "")}`)
    .filter(u => u.includes("/products-"));

  console.log(`  找到 ${urls.length} 个产品链接\n`);

  // Step 2: 逐个获取产品数据
  console.log("📦 步骤 2: 获取产品数据...");
  const wines = [];
  const skipKeywords = ["whisky", "gin", "cognac", "brandy", "rum", "tequila", "mezcal", "vodka", "bourbon", "scotch", "liqueur", "sake"];

  for (let i = 0; i < urls.length && wines.length < count; i++) {
    const url = urls[i];
    // 跳过非葡萄酒
    if (skipKeywords.some(k => url.toLowerCase().includes(k))) continue;

    console.log(`  [${wines.length + 1}/${count}] ${url.split("/").pop()}`);
    try {
      const tmpPage = "/tmp/bbr-product.html";
      execSync(`curl -s "${url}" -o "${tmpPage}"`, { timeout: 30000 });
      const html = fs.readFileSync(tmpPage, "utf-8");
      const parsed = parseProductPage(html, url);

      if (!parsed.nameEn || !parsed.price) {
        console.log(`    ⚠️ 数据不完整，跳过`);
        continue;
      }

      const record = buildWineRecord(parsed, url);
      wines.push(record);
      console.log(`    ✅ ${record.name} | £${record.price} | ${record.tags.type}`);
    } catch (e) {
      console.log(`    ❌ 获取失败: ${e.message}`);
    }
  }

  console.log(`\n共获取 ${wines.length} 款酒\n`);

  // Step 3: 下载图片
  console.log("🖼️  步骤 3: 下载产品图片...");
  for (const w of wines) {
    console.log(`  下载 ${w.imageFilename}...`);
    downloadImage(w.imageUrl, w.imageFilename);
  }

  // 同步到前端
  console.log("\n📂 步骤 4: 同步图片到前端...");
  for (const w of wines) {
    const src = path.join(UPLOAD_DIR, w.imageFilename);
    const dst = path.join(FRONTEND_UPLOAD_DIR, w.imageFilename);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`  ✅ ${w.imageFilename}`);
    }
  }

  // Step 5: 插入数据库
  console.log("\n️  步骤 5: 插入数据库...");
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "verra_voile",
  });

  for (const w of wines) {
    try {
      const [existing] = await pool.query("SELECT product_id FROM products_wine WHERE product_id = ?", [w.productId]);
      const cols = [w.name, w.nameEn, w.price, w.capacity, w.image, JSON.stringify(w.images), w.tagline, JSON.stringify(w.tags), JSON.stringify(w.highlights), JSON.stringify(w.buyingOptions), JSON.stringify(w.overview), w.sourceUrl];
      if (existing.length > 0) {
        await pool.query("UPDATE products_wine SET name=?, name_en=?, price=?, capacity=?, image=?, images=?, tagline=?, tags=?, highlights=?, buying_options=?, overview=?, source_url=? WHERE product_id=?", [...cols, w.productId]);
        console.log(`  ✅ Updated: ${w.productId}`);
      } else {
        await pool.query("INSERT INTO products_wine (product_id, name, name_en, price, capacity, image, images, tagline, tags, highlights, buying_options, overview, source_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [w.productId, ...cols]);
        console.log(`  ✅ Inserted: ${w.productId}`);
      }
    } catch (e) {
      console.log(`   ${w.productId}: ${e.message}`);
    }
  }
  await pool.end();

  // Step 7: 验证
  console.log("\n 步骤 7: API 验证...");
  try {
    const apiResult = execSync(`curl -s http://localhost:3000/api/products/wine`, { timeout: 10000 }).toString();
    const apiData = JSON.parse(apiResult);
    const productIds = wines.map(w => w.productId);
    const found = apiData.data.products.filter(p => productIds.includes(p.productId));
    console.log(`  ✅ API 返回 ${found.length}/${wines.length} 款新产品`);
    for (const p of found) {
      const ov = p.overview || {};
      console.log(`    ${p.productId}: ${p.name} | £${p.price} | attrs:${(ov.attributes||[]).length}`);
    }
  } catch (e) {
    console.log(`  ⚠️ API 验证失败: ${e.message}`);
  }

  console.log("\n🎉 批量爬取完成！");
}

main().catch(e => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
