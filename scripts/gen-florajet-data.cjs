/**
 * 将 florajet-products.json 转换为前端数据文件 florajetFlowers.ts（含中文翻译）
 * 运行：node scripts/gen-florajet-data.cjs
 */
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, 'florajet-products.json')
const OUT = path.join(__dirname, '../../Verra-Voile/src/data/florajetFlowers.ts')

// 法文官方名 → 中文名
const CN_NAMES = {
  'CREATION ANNIVERSAIRE': '生日花艺师创作',
  'ALCHIMIE + ROCHERS': '炼金术 + 巧克力礼盒',
  "CIEL D'ETE": '夏日天空',
  'COCCINELLE': '瓢虫',
  'PLEIN ETE': '盛夏',
  'PRELUDE': '序曲',
  'DUCHESSE': '公爵夫人',
  'EVIDENCE': '显而易见',
  'DOUCEUR ESTIVALE': '夏日温柔',
  'IMAGINATION': '想象',
  'DIVIN': '神圣',
  'BEL AIR': '美景',
  'CEZANNE': '塞尚',
  "NUIT D'ETE": '夏夜',
  'CREATION FLEURS SECHEES MULTICOLORES': '多彩干花花艺创作',
  'COEUR ROUGE': '红玫瑰之心',
  'ESPOIR': '希望',
  'BELLISSIMA': '绝美',
  'PRELUDE + OURSON': '序曲 + 小熊',
  'MISS CHICAGO': '芝加哥小姐',
  'SUMATRA': '苏门答腊',
  'TOURNESOL EN POT': '盆栽向日葵',
  'CHAMALLOW': '棉花糖',
  "MISS CHICAGO + AMANDES": '芝加哥小姐 + 杏仁',
  'FLEUR DE ROSE + BALLON': '玫瑰花 + 心形气球',
  'LIMONE': '柠檬',
  '20 ROSES BLANCHES + CHAMPAGNE': '20支白玫瑰 + 香槟',
  'CLARISSE': '克拉丽丝',
  'OLIVIER + COFFRET OLIVE': '橄榄树 + 橄榄礼盒',
  'ETE SAUVAGE': '野夏',
  'NOCTURNE': '夜曲',
  '15 ROSES + CHAMPAGNE': '15支玫瑰 + 香槟',
  'HAPPINESS + ROCHERS': '幸福 + 巧克力礼盒',
  'DELICE CHOCOLATE': '巧克力之悦',
  'ORCHIDEE 2 BRANCHES': '双枝蝴蝶兰',
  'GERMINIS + BALLON': '迷你菊 + 心形气球',
  'HORTENSIA BOULE': '绣球花球',
  'DOUCEUR GOURMANDE': '甜蜜美食',
  'MELODIE DES JARDINS M': '花园旋律',
  'MELODIE DES JARDINS': '花园旋律',
  'FLEUR DE ROSE + JOURNAL': '玫瑰花 + 出生报',
  'OLIVIER + RHUM': '橄榄树 + 朗姆酒',
  'BOUQUET BOUGIES VARIÉES': '多彩蜡烛花束',
  'FOLIE GOURMANDE HARIBO': '哈瑞宝糖果花束',
  'BOUQUET BOUGIES TULIPES': '珊瑚郁金香蜡烛花束',
  'DOUCE BRUME': '温柔薄雾',
  'ORCHIDEE + JOURNAL': '蝴蝶兰 + 出生报',
  'LEGO® - BONSAI': '乐高®盆景',
  'LEGO® - BOUQUET DE TULIPES': '乐高®郁金香花束',
  'BOUQUET DIY M': 'DIY花束 M',
  'TERRA NOVA M': '新大陆 M',
  'BOUGIES PIVOINES': '珊瑚牡丹蜡烛',
  'HELIOS M': '太阳神 M',
  'BONSAI GINSENG  + VIN ROUGE': '人参榕盆景 + 红酒',
}

// 法文分类 → 中文分类
const CAT_CN = {
  'Bouquets de fleurs': '花束',
  'Bouquet de roses': '玫瑰花束',
  'Plantes': '盆栽绿植',
  'Fleurs et cadeaux': '花与礼物',
  'Fleurs éternelles': '永生花艺',
  'Composition': '花艺组合',
}

const products = JSON.parse(fs.readFileSync(SRC, 'utf8'))

const lines = products.map((p) => {
  const cn = CN_NAMES[p.name] || p.display_name
  if (!CN_NAMES[p.name]) console.warn(`⚠️ 缺少中文翻译: ${p.name}`)
  const cat = CAT_CN[p.display_category] || p.display_category
  const slug = `fj-${p.source_id}`
  const price = Number(p.price).toFixed(2)
  const safeEn = p.display_name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `  {
    slug: '${slug}',
    name: '${cn}',
    nameEn: '${safeEn}',
    category: 'florajet',
    categoryCn: '${cat}',
    tagline: 'Florajet · Livraison dès demain',
    desc: '法国 Florajet 花艺师出品的「${cn}」（${safeEn}），属于${cat}系列。生日祝福之选，法国全境配送，最快次日送达。',
    highlights: ['法国花艺师出品', '次日送达', '€${price} 起'],
    cover: '${p.image}',
    images: ['${p.image}'],
    price: ${price},
    source: { name: 'Florajet（测试数据）', url: '${p.url}' },
  }`
})

const ts = `// Florajet 花卉商品数据 —— 来源：florajet.com 生日专题页爬取（测试数据）
// 爬取脚本：Verra-Voile-End/scripts/crawl-florajet.cjs
import type { FloralProduct } from './floralWorks'

export const florajetProducts: FloralProduct[] = [
${lines.join(',\n')},
]
`

fs.writeFileSync(OUT, ts, 'utf8')
console.log(`✅ 生成 ${products.length} 个商品 → ${OUT}`)
