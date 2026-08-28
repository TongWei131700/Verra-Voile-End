require('dotenv').config();
const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  const slug = 'brandenburg-gate';
  const description = `勃兰登堡门(Brandenburger Tor)位于德国柏林米特区(Mitte),是柏林最标志性的地标,也是德国统一的象征。勃兰登堡门建于1788年至1791年,由普鲁士国王腓特烈·威廉二世(Friedrich Wilhelm II)下令修建,建筑师卡尔·戈特哈德·朗汉斯(Carl Gotthard Langhans)设计,采用新古典主义风格,模仿雅典卫城的入口。勃兰登堡门高26米,宽65.5米,深11米,由12根多立克柱(Dorische Säulen)支撑,形成5个通道。门顶矗立着著名的胜利女神四马战车(Quadriga),高5.2米,由雕塑家约翰·戈特弗里德·沙多(Johann Gottfried Schadow)于1793年创作,描绘胜利女神维多利亚(Victoria)驾驭四匹战车的场景。勃兰登堡门见证了德国历史的重大事件:1806年拿破仑(Napoléon)将其作为战利品通过,1961年柏林墙建成后勃兰登堡门成为东西柏林分裂的象征,1989年柏林墙倒塌后成为德国统一的标志。`;
  const photo_tips = `【最佳机位】从巴黎广场(Pariser Platz)正面拍摄勃兰登堡门全景;从胜利柱(Siegessäule)拍摄勃兰登堡门与六月十七日大街;从夜间拍摄勃兰登堡门灯光;从侧面拍摄门柱与雕塑
【镜头推荐】16-35mm广角镜头拍摄勃兰登堡门全景;24-70mm标准镜头拍摄建筑和雕塑;70-200mm长焦镜头拍摄胜利女神四马战车细节
【最佳时段】日落前金色光线照射勃兰登堡门;蓝调时刻勃兰登堡门灯光;清晨勃兰登堡门无人;冬季雪景
【拍摄技巧】利用门柱的对称构图创造视觉冲击;利用六月十七日大街作为引导线;长焦可压缩勃兰登堡门与天空;偏振镜增强蓝天与建筑色彩
【注意事项】勃兰登堡门免费参观;从柏林中央火车站乘地铁约5分钟;勃兰登堡门周围禁止停车;夏季游客众多建议清晨拍摄;勃兰登堡门周围有众多景点可步行前往`;
  await conn.execute(
    'UPDATE crawled_travel_attractions SET description = ?, photo_tips = ? WHERE slug = ?',
    [description, photo_tips, slug]
  );
  console.log(`Updated: ${slug}`);
  await conn.end();
}
main();
