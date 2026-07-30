/**
 * 更新葡萄牙场地图片为外部URL（不下载）
 * node scripts/update-portugal-images.cjs
 */
const mysql = require('mysql2/promise')

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1', port: 13306, user: 'root',
    password: 'caoqiangiot@123', database: 'verra_voile'
  })
  console.log('✓ 数据库已连接')

  const venues = {
    'our-quinta': {
      cover: 'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/our-quinta-miguel-gameiro-1080_6_139847-159843295133425.jpeg',
      images: [
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/our-quinta-miguel-gameiro-1080_6_139847-159843295133425.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/1-2_6_139847-163906392269521.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/tnia-afonso-photograhy_6_139847-159500824148270.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/40-20_6_139847-176788167357986.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/1-_6_139847-162211293671086.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/5-3_6_139847-162211294074947.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/20-4_6_139847-162211294313618.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/5-12_6_139847-163906392387216.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/7014_6_139847-176788150793854.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/138-10_6_139847-159379814396221.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/140-9_6_139847-162211294587211.jpeg',
        'https://cdn0.casamentos.pt/vendor/9847/3_2/960/jpg/our-quinta-miguel-gameiro-1105_6_139847-159843295323268.jpeg'
      ]
    },
    'quinta-da-fontoura': {
      cover: 'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/dji-0042-2_6_51164.jpeg',
      images: [
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/dji-0042-2_6_51164.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/caerimonia_6_51164-169330698417184.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/0225_6_51164-1563814614.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpeg/cerimonia-parreira_6_51164-163549408197239.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/0777_6_51164-1563815042.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/0011_6_51164-170896752433430.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/g-f-177_6_51164-157677247492652.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/cerimonia-mata_6_51164-163549408012223.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/exterior-1_6_51164-163549408816154.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/02-lago-02_6_51164.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/noite-68_6_51164.jpeg',
        'https://cdn0.casamentos.pt/vendor/1164/3_2/960/jpg/piscina_6_51164-163352110033342.jpeg'
      ]
    },
    'quinta-vila-marita': {
      cover: 'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-0276_6_97457-178041225233032.jpeg',
      images: [
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-0276_6_97457-178041225233032.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpeg/image00003_6_97457-169608084053762.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpeg/image00001_6_97457-169608333129370.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/vm25-0186_6_97457-175810849540453.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/vm25-1082_6_97457-175810865869423.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/ha302247_6_97457-177002821244455.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/aa3-6522_6_97457-178041225166799.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-0282_6_97457-178041225279734.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/dji-20260501221932-0130-d_6_97457-178041225387958.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/vm26-0045_6_97457-178041225846221.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpg/fh206690_6_97457-178041276723439.jpeg',
        'https://cdn0.casamentos.pt/vendor/7457/3_2/960/jpeg/cortebolo1-qfilm_6_97457-177002847526775.jpeg'
      ]
    },
    'humus-farm': {
      cover: 'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/05_6_126649-167715448659938.jpeg',
      images: [
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/05_6_126649-167715448659938.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-214_6_126649-172961619154106.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-229_6_126649-172961385594233.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/catarinapedro-0852_6_126649-167715413173652.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/raquelbernardo-669_6_126649-172961575085813.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/wed-752-resized_6_126649-172961618781253.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-171_6_126649-172961383825181.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/anaemiguel-070724-64_6_126649-172961383643430.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/img-2424_6_126649-169445914269486.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/img-1950_6_126649-169445901096791.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/-dsc7164_6_126649-167715430675088.jpeg',
        'https://cdn0.casamentos.pt/vendor/6649/3_2/960/jpg/-dsc7188_6_126649-167715439821259.jpeg'
      ]
    },
    'montebello-wedding-events': {
      cover: 'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/1000013332_6_105484-175865085874889.jpeg',
      images: [
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/1000013332_6_105484-175865085874889.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/db303714_6_105484-169901843048726.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/1000009128_6_105484-172457724517786.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/309_6_105484-165106959513200.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/339_6_105484-165106914846916.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/238_6_105484-165115879999201.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/001_6_105484-165115759093114.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/010_6_105484-165115767590919.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/030_6_105484-165115775645584.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/054_6_105484-165115784211588.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/178_6_105484-165115856676613.jpeg',
        'https://cdn0.casamentos.pt/vendor/5484/3_2/960/jpg/183_6_105484-165115863259286.jpeg'
      ]
    }
  }

  for (const [slug, data] of Object.entries(venues)) {
    await pool.execute(
      'UPDATE crawled_destinations SET cover_image = ?, cover_image_url = ?, images = ? WHERE slug = ?',
      [data.cover, data.cover, JSON.stringify(data.images), slug]
    )
    console.log(`✓ 已更新: ${slug} (${data.images.length} 张图片)`)
  }

  // 验证
  const [rows] = await pool.execute("SELECT slug, name_cn, cover_image, LENGTH(images) as img_len FROM crawled_destinations WHERE country='Portugal' ORDER BY sort_order")
  console.log('\n--- 验证 ---')
  rows.forEach(r => console.log(`  ${r.slug}: ${r.name_cn}, cover=${r.cover_image?.slice(0,50)}...`))

  await pool.end()
  console.log('\n✅ 完成！')
}

main().catch(e => { console.error(e); process.exit(1) })
