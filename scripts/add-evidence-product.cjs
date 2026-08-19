/**
 * 添加 Evidence 花束到 florajet 商品记录
 */
const mysql = require('mysql2/promise')
require('dotenv').config()

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  try {
    // 读取现有数据
    const [rows] = await pool.execute("SELECT fresh_flower_products FROM crawled_florists WHERE slug = 'florajet'")
    let products = rows[0].fresh_flower_products
    if (typeof products === 'string') products = JSON.parse(products)

    // 检查是否已存在
    if (products.some(p => p.slug === 'evidence')) {
      console.log('⚠️  Evidence 已存在，跳过')
      await pool.end()
      return
    }

    // 新商品数据
    const evidence = {
      slug: 'evidence',
      name: 'EVIDENCE',
      name_cn: '证据花束',
      price: 36.90,
      price_from: true,
      category: '鲜花花束',
      image: '/uploads/crawled/florajet/products/evidence.jpg',
      images: [
        '/uploads/crawled/florajet/products/evidence.jpg',
        '/uploads/crawled/florajet/products/evidence-2.jpg',
        '/uploads/crawled/florajet/products/evidence-3.jpg',
        '/uploads/crawled/florajet/products/evidence-4.jpg',
      ],
      desc: "Plongez dans l'univers coloré du bouquet Evidence, une création florale audacieuse imaginée par nos fleuristes pour celles et ceux qui aiment les bouquets qui sortent de l'ordinaire. Cette composition marie avec intensité la passion des roses rouges, la tendresse des œillets crème et l'énergie solaire des roses orange. Le tout est délicatement rehaussé par la texture fine du wax, apportant légèreté et contraste à l'ensemble.",
      desc_cn: '沉浸在Evidence花束的缤纷世界中，这是我们花艺师为喜爱独特花束的人们精心打造的创意花艺作品。这组花束将红玫瑰的热情、奶油色康乃馨的温柔与橙色玫瑰的阳光活力热烈交融。蜡花精致的质感巧妙地提升了整体效果，为花束增添了轻盈感与层次对比。',
      desc_full: "Un bouquet de fleurs pensé pour séduire au premier regard, entre force des couleurs et subtilité des matières. Parfait pour marquer une occasion comme un anniversaire, surprendre un proche ou simplement apporter une touche de chaleur à votre intérieur, ce bouquet est une déclaration en soi. Son style dynamique et original en fait une excellente idée cadeau, livrée avec soin partout en France grâce à notre service de livraison de fleurs rapide et fiable.",
      desc_full_cn: '这是一束旨在第一眼就打动人心花束，色彩的力量与材质的细腻完美融合。无论是标记生日等特殊场合、给亲友惊喜，还是为居家空间增添一抹温暖，这束花都是一份独特的告白。其动感而原创的风格使其成为一份绝佳的礼物选择，通过我们快速可靠的配送服务，精心送达各地。',
      composition: 'Bouquet composé de roses rouges, oeillets crème, roses oranges, germinis blancs, wax et eucalyptus.',
      composition_cn: '花束由红玫瑰、奶油色康乃馨、橙色玫瑰、白色小菊、蜡花和尤加利叶组成。',
      conseils: "Votre arrangement floral Florajet, composé de fleurs fraîches, pourra être quelque peu différent du visuel présenté qui a valeur indicative. Votre composition, créée spécialement pour vous par un de nos artisans, est susceptible de varier légèrement en fonction de la sensibilité artistique du fleuriste mais aussi de la saisonnalité des fleurs qui la composent. L'esprit du bouquet, sa forme, ses couleurs ainsi que ses essences principales seront respectés par notre artisan fleuriste qui réalisera, à votre intention, cette création inédite quelques minutes avant de la livrer.",
      conseils_cn: '您的Florajet花艺作品由鲜花制成，可能与展示的图片略有不同，图片仅供参考。您的花艺作品由花艺师专门为您手工制作，可能会因花艺师的艺术感觉以及花卉的季节性而略有变化。花束的整体风格、形状、颜色及主要花材将由花艺师在配送前几分钟精心制作时予以保留。',
      delivery_info: 'Ce produit sera livré et remis en mains propres par un fleuriste membre du réseau Florajet. Frais de livraison à partir de : 12,95€. Frais de livraison OFFERTS si vous êtes client Premium.',
      delivery_info_cn: '此产品将由Florajet网络的花艺师亲自配送。配送费起步价：12.95€。Premium会员免配送费。',
      formules: [
        { name: 'Beaucoup', name_cn: '经典款', price: 36.90, diameter: '34cm - 38cm' },
        { name: 'Énormément', name_cn: '推荐款', price: 42.90, diameter: '38cm - 42cm' },
        { name: 'Passionnément', name_cn: '豪华款', price: 52.90, diameter: '42cm - 46cm' },
      ],
      accessoires: [
        { name: 'Bulle d\u2019eau', name_cn: '水球保鲜', price: 4.50 },
        { name: 'Rochers', name_cn: '岩石装饰', price: 12.00 },
        { name: 'Ours blanc', name_cn: '白色小熊', price: 12.00 },
        { name: 'Vase PVC', name_cn: 'PVC花瓶', price: 5.00 },
        { name: 'Amandes', name_cn: '杏仁甜点', price: 12.00 },
        { name: 'Vase en verre', name_cn: '玻璃花瓶', price: 10.00 },
        { name: 'Carte', name_cn: '贺卡', price: 5.00 },
        { name: 'Ours brun', name_cn: '棕色小熊', price: 12.00 },
      ],
    }

    products.push(evidence)

    // 更新数据库
    await pool.execute(
      'UPDATE crawled_florists SET fresh_flower_products = ? WHERE slug = ?',
      [JSON.stringify(products), 'florajet']
    )

    console.log('✅ Evidence 花束已添加')
    console.log(`   当前共 ${products.length} 个商品`)
    console.log('   图片: 4 张')
    console.log('   规格: 3 档 (€36.90 / €42.90 / €52.90)')
    console.log('   附加选项: 8 个')
  } catch (err) {
    console.error('❌ 错误:', err.message)
  } finally {
    await pool.end()
  }
}

main()
