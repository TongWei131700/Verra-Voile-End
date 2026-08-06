/**
 * 批量翻译待翻译文件
 * 读取 translate-pending-{country}.json，翻译后写回同文件
 * 支持断点续翻：已有 name_cn 的条目自动跳过
 * 
 * 用法: node scripts/batch-translate-file.cjs --country=italy
 */

const fs = require('fs')
const path = require('path')

// Google Translate API (gtx 端点，无频率限制)
async function translateText(text, retries = 3) {
  if (!text || !text.trim()) return ''
  try {
    const encoded = encodeURIComponent(text.slice(0, 1000))
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encoded}`
    const res = await fetch(url)
    const data = await res.json()
    // gtx 端点返回格式: [[["翻译","原文",null,null,...],...],null,"en"]
    let result = ''
    if (data && data[0]) {
      for (const segment of data[0]) {
        if (segment[0]) result += segment[0]
      }
    }
    return result || text
  } catch (e) {
    if (retries > 0) {
      const wait = (4 - retries) * 2000 + 1000
      console.log(`    重试中... (${retries}次剩余)`)
      await new Promise(r => setTimeout(r, wait))
      return translateText(text, retries - 1)
    }
    console.log(`    ⚠ 翻译失败: ${e.message}`)
    return text
  }
}

// 场地名中文映射（从之前的脚本复用）
const nameTranslations = {
  'Aba Chiara': '阿巴基亚拉', 'Abbazia di San Giusto': '圣朱斯托修道院',
  'Above & Beyond Tuscan Weddings': '超越托斯卡纳婚礼', 'Agriresort Leano': '莱亚诺农业度假村',
  'Agriturismo Belagaggio': '贝拉贾乔农庄', 'Agriturismo Le Anfore': '双耳瓶农庄',
  'Agriturismo Le Mura': '城墙农庄', 'Agriturismo Poggianto': '波贾托农庄',
  'Al Chiar di Luna': '月光之下', 'Alba Wedding Lighting': '阿尔巴婚礼灯光',
  'AMORITALY - Weddings in Italy': '爱在意大利婚礼', 'Antica Masseria Martuccio': '古马图乔农场',
  'Antica Meridiana': '古子午线庄园', 'Bacio Wedding': '巴乔婚礼',
  'Baia dei Faraglioni': '海石柱湾', 'Borgo Antichi Orti Assisi': '阿西西古园村',
  'Borgo del Carato': '卡拉托村', 'Borgo San Rocco Resort': '圣罗科度假村',
  'Br Wedding': 'BR婚礼', 'Byblos Art Hotel': '比布洛斯艺术酒店',
  'Capo Santa Croce': '圣十字角', 'Casale 500': '五百农舍',
  'CastelBrando': '布兰登城堡', 'Castello Bevilacqua': '贝维拉夸城堡',
  'Castello Brancaccio': '布兰卡乔城堡', 'Castello del Trebbio': '特雷比奥城堡',
  'Castello di Meleto': '梅莱托城堡', 'Castello di Rosciano': '罗夏诺城堡',
  'Castello di Spessa': '斯佩萨城堡', 'Castello Leonina': '莱奥尼纳城堡',
  'Castello Visconteo': '维斯孔蒂城堡', 'Convento San Giuseppe': '圣约瑟夫修道院',
  'Cristalli di Sale': '盐晶', 'Distinctive Italy Weddings': '独特意大利婚礼',
  'Dolce Promessa': '甜蜜承诺', 'Du Lac et Du Parc Grand Resort': '湖与公园大酒店',
  'Exclusive Italy Weddings': '尊享意大利婚礼', 'Fantastic Garden': '梦幻花园',
  'Fattoria degli Usignoli': '夜莺农场', 'Fonte Sala': '喷泉大厅',
  'Forever Tuscany': '永恒托斯卡纳', 'Furore Grand Hotel': '弗罗雷大酒店',
  'Grand Hotel Europa Palace': '欧洲宫殿大酒店', 'GranDuomo': '大教堂',
  'Hamalia': '哈马利亚', 'Il Fontanile': '喷泉', 'Il Sorriso Ricevimenti': '微笑宴会',
  'Italea': '意大利花园', 'Italian Style': '意大利风格', 'Just Amore': '就是爱',
  'Kolbe Hotel Rome': '罗马科尔贝酒店', 'La Casa degli Spiriti': '精灵之家',
  'La Dolce Wedding Italy': '甜蜜意大利婚礼', 'La Locanda del Pontefice': '教皇客栈',
  'La Medusa Hotel & Boutique Spa': '美杜莎精品水疗酒店', 'La Navona': '纳沃纳',
  'Le 7 Fonti': '七泉', 'Le Reve': '梦境', 'Lily Happens': '百合绽放',
  'Magic Fire': '魔法火焰', 'MamaMare': '妈妈海', 'Mani di Forbice': '剪刀之手',
  'Masseria Li Reni': '莱雷尼农场', 'Masseria Spina Resort': '斯皮纳度假村',
  'Obicà': '奥比卡', 'Other Lights': '其他灯光',
  'Our Italian Fairytale': '我们的意大利童话', 'Palazzo Brancaccio': '布兰卡乔宫',
  'Park Hotel Villa Grazioli': '格拉齐奥利别墅公园酒店', 'QDC Wedding': 'QDC婚礼',
  'Relais Casanova': '卡萨诺瓦中继酒店', 'Relais La Corte Dei Papi': '教皇庭院中继酒店',
  'Resort 37': '37号度假村', 'Ristorante Portobello': '波特贝洛餐厅',
  'Romance in Italy': '浪漫意大利', 'Salva le Api': '拯救蜜蜂',
  'San Pietro Sopra Le Acque Resort & Spa': '水上圣彼得度假村',
  'Sassa al Sole': '阳光之石', 'Scatti Spontanei': '自然瞬间',
  'Tenuta dei Mori': '摩尔人庄园', 'Tenuta Della Selva': '森林庄园',
  'Tenuta La Valle': '山谷庄园', 'Tenuta Riseccoli': '里塞科利庄园',
  'That\'s Amore': '那就是爱', 'The Foreigners Club': '外国人俱乐部',
  'The Sense': '感觉', 'The Wedding Issue': '婚礼议题',
  'Tour de Force': '杰作', 'Trappetello': '小油坊',
  'Valle di Assisi': '阿西西山谷', 'Villa Alta': '高别墅',
  'Villa Bellaria': '贝拉利亚别墅', 'Villa Brunelli': '布鲁内利别墅',
  'Villa Calcinaia': '卡尔奇纳亚别墅', 'Villa Castelletti': '卡斯泰莱蒂别墅',
  'Villa Demetra Resort': '德墨特拉度假村', 'Villa Diamante': '钻石别墅',
  'Villa La Palagina': '帕拉吉纳别墅', 'Villa Merlo Nero': '黑画眉别墅',
  'Villa Orsini': '奥尔西尼别墅', 'Villa Paolina': '保琳娜别墅',
  'Villa Porta': '门别墅', 'Villa Savino': '萨维诺别墅',
  'Villa Scorzi': '斯科尔齐别墅', 'Villa Valente': '瓦伦特别墅',
  'Villa Ventura': '文图拉别墅', 'Villa Zaffiro': '蓝宝石别墅',
  'Wed in Rome': '罗马婚礼', 'Wedding in Tuscany': '托斯卡纳婚礼',
  'Weweddings': '我们婚礼', 'Wine Resort Colsereno': '科尔塞雷诺酒庄',
}

// 场地类型映射
const typeCnMap = {
  'Wedding Venue': '婚礼场地', 'Hotel': '酒店', 'Villa': '别墅',
  'Castle': '城堡', 'Restaurant': '餐厅', 'Garden': '花园',
  'Mansion': '庄园', 'Banquet Hall': '宴会厅', 'Barn': '谷仓',
  'Historic Building': '历史建筑', 'Country House': '乡村庄园',
  'Resort': '度假村', 'Estate': '庄园', 'Palace': '宫殿',
  'Vineyard': '酒庄', 'Farm': '农场',
}

// 城镇映射
const townTranslations = {
  'Rome': '罗马', 'Milan': '米兰', 'Florence': '佛罗伦萨', 'Venice': '威尼斯',
  'Naples': '那不勒斯', 'Turin': '都灵', 'Bologna': '博洛尼亚',
  'Palermo': '巴勒莫', 'Catania': '卡塔尼亚', 'Syracuse': '锡拉库萨',
  'Taormina': '陶尔米纳', 'Agrigento': '阿格里真托', 'Tuscany': '托斯卡纳',
  'Sicily': '西西里', 'Amalfi Coast': '阿马尔菲海岸', 'Lake Como': '科莫湖',
  'Lake Garda': '加尔达湖', 'Sorrento': '索伦托', 'Positano': '波西塔诺',
  'Ravello': '拉韦洛', 'Lucca': '卢卡', 'Pisa': '比萨', 'Siena': '锡耶纳',
  'San Gimignano': '圣吉米尼亚诺', 'Arezzo': '阿雷佐', 'Cortona': '科尔托纳',
  'Assisi': '阿西西', 'Perugia': '佩鲁贾', 'Verona': '维罗纳',
  'Padua': '帕多瓦', 'Brescia': '布雷西亚', 'Bergamo': '贝加莫',
  'Parma': '帕尔马', 'Modena': '摩德纳', 'Ravenna': '拉文纳',
  'Ferrara': '费拉拉', 'Livorno': '里窝那', 'Lecce': '莱切',
  'Bari': '巴里', 'Matera': '马泰拉', 'Salerno': '萨莱诺',
  'Test Italy': '测试意大利',
}

async function main() {
  const args = process.argv.slice(2)
  const countryArg = args.find(a => a.startsWith('--country='))
  const country = countryArg ? countryArg.split('=')[1] : 'italy'

  const inFile = path.join(__dirname, `translate-pending-${country}.json`)
  if (!fs.existsSync(inFile)) {
    console.error(`文件不存在: ${inFile}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(inFile, 'utf-8'))
  const slugs = Object.keys(data)
  console.log(`共 ${slugs.length} 条待翻译`)

  // 统计跳过和待翻译
  const pending = slugs.filter(s => !data[s].name_cn)
  console.log(`已有翻译: ${slugs.length - pending.length}, 待翻译: ${pending.length}`)

  let count = 0
  for (const slug of pending) {
    count++
    const item = data[slug]

    // 翻译 name
    item.name_cn = nameTranslations[item.name] || item.name

    // 翻译 tagline
    if (item.tagline) {
      item.tagline_cn = await translateText(item.tagline)
      if (item.tagline_cn.length > 200) item.tagline_cn = item.tagline_cn.slice(0, 197) + '...'
    }

    // 翻译 description
    if (item.description) {
      item.description_cn = await translateText(item.description)
    }

    // 翻译 features
    if (item.features && item.features.length > 0) {
      item.features_cn = []
      for (const f of item.features) {
        const tf = await translateText(f)
        item.features_cn.push(tf)
      }
    } else {
      item.features_cn = [`${item.name_cn} - 意大利精选婚礼场地`]
    }

    // 翻译 venue_types
    if (item.venue_types) {
      item.venue_types_cn = item.venue_types.map(t => ({
        name: t,
        name_cn: typeCnMap[t] || t
      }))
    }

    // 翻译 towns
    if (item.towns) {
      item.towns_cn = item.towns.map(t => ({
        name: t,
        name_cn: townTranslations[t] || t
      }))
    }

    // 翻译 FAQ
    if (item.faq && item.faq.length > 0) {
      item.faq_cn = []
      for (const faq of item.faq) {
        const qCn = await translateText(faq.q)
        const aCn = await translateText(faq.a)
        item.faq_cn.push({ q: qCn, a: aCn })
      }
    }

    console.log(`[${count}/${pending.length}] ${item.name} → ${item.name_cn}`)
    console.log(`    tagline: ${(item.tagline || '').slice(0, 40)}... → ${(item.tagline_cn || '').slice(0, 40)}...`)

    // 每5条保存一次（断点续翻）
    if (count % 5 === 0) {
      fs.writeFileSync(inFile, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`    💾 已保存进度 (${count}/${pending.length})`)
    }

    // 请求间隔 1 秒
    await new Promise(r => setTimeout(r, 1000))
  }

  // 最终保存
  fs.writeFileSync(inFile, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`\n✅ 翻译完成！共 ${count} 条`)
  console.log(`文件已保存: ${inFile}`)
  console.log(`\n下一步: node scripts/import-translated.cjs --country=${country}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
