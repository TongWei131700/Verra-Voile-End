require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "verra_voile",
  });

  const wines = [
    {
      productId: "prum-riesling-auslese-2024",
      name: "2024 雷司令精选 约翰约瑟夫普鲁姆酒庄",
      nameEn: "2024 Riesling, Auslese, Graacher Himmelreich, Joh. Jos. Prüm, Mosel, Germany",
      price: 41,
      capacity: "75cl",
      image: "/uploads/crawled/wine/prum-riesling-auslese-2024.jpg",
      tagline: "摩泽尔顶级酒庄·精选级甜白·7.5%低酒精度",
      tags: { type: "甜葡萄酒", region: "德国", vintage: "2024" },
      highlights: ["100% 雷司令", "摩泽尔·格拉赫天堂园", "精选级 Auslese", "7.5% 酒精度"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 75cl", unit: "£", price: 41.00 },
        { name: "整箱", spec: "6 x 75cl", unit: "£", price: 246.00 },
      ],
      overview: {
        description: "",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "甜型" },
          { icon: "calendar", label: "年份", value: "2024" },
          { icon: "percent", label: "酒精度", value: "7.5%" },
          { icon: "clock", label: "适饮期", value: "尚未成熟" },
          { icon: "grape", label: "品种", value: "100% 雷司令" },
          { icon: "body", label: "酒体", value: "中等酒体" },
          { icon: "producer", label: "酒庄", value: "Weingut Joh Jos Prüm" },
        ],
        aboutItems: [
          {
            title: "雷司令 (Riesling)",
            image: "/uploads/crawled/wine/riesling-grape.jpg",
            text: "很少有葡萄品种能像雷司令一样同时展现细腻与浓郁。以其芬芳的香气和锐利的酸度著称，这种贵族品种能酿造出从干型矿物感到浓郁陈年甜酒的惊人范围。无论是德国板岩山坡、阿尔萨斯火山丘陵还是新世界的阳光葡萄园，雷司令都能表达出独一无二的风土感。",
          },
          {
            title: "约翰约瑟夫普鲁姆酒庄 (Weingut Joh Jos Prüm)",
            image: "",
            text: "普鲁姆是摩泽尔最顶级的酒庄之一。由约翰·约瑟夫·普鲁姆于1911年创立，酒庄迅速以其纯净、优雅的雷司令表达建立了声誉，葡萄种植在摩泽尔中心极其陡峭的板岩山坡上。如今酒庄由卡特琳娜·普鲁姆博士管理，守护着13.5公顷的葡萄园，其中包括一些罕见的未嫁接老藤。",
          },
        ],
      },
    },
    {
      productId: "oremus-tokaji-late-harvest-2024",
      name: "2024 晚收托卡伊 奥雷穆斯酒庄",
      nameEn: "2024 Tokaji, Late Harvest, Oremus, Hungary",
      price: 28,
      capacity: "50cl",
      image: "/uploads/crawled/wine/oremus-tokaji-late-harvest-2024.jpg",
      tagline: "匈牙利托卡伊经典晚收·富尔民特主导·蜂蜜与杏脯风味",
      tags: { type: "甜葡萄酒", region: "匈牙利", vintage: "2024" },
      highlights: ["富尔民特为主", "托卡伊产区", "晚收 Late Harvest", "11.5% 酒精度"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 50cl", unit: "£", price: 27.50 },
        { name: "整箱", spec: "6 x 50cl", unit: "£", price: 165.00 },
      ],
      overview: {
        description: "",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "甜型" },
          { icon: "calendar", label: "年份", value: "2024" },
          { icon: "percent", label: "酒精度", value: "11.5%" },
          { icon: "clock", label: "适饮期", value: "适饮·年轻" },
          { icon: "grape", label: "品种", value: "富尔民特等" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Oremus" },
        ],
        aboutItems: [
          {
            title: "富尔民特 (Furmint)",
            image: "/uploads/crawled/wine/furmint-grape.jpg",
            text: "富尔民特是匈牙利和斯洛伐克种植的白葡萄品种，也是托卡伊阿苏的主要原料。它是早发芽晚成熟的品种，特别容易感染贵腐菌。",
          },
          {
            title: "托卡伊 (Tokaj)",
            image: "/uploads/crawled/wine/tokaj-region.jpg",
            text: "托卡伊葡萄酒产区位于匈牙利东北部，以生产托卡伊葡萄酒而闻名，这是世界上最古老、最著名的甜酒之一。以蜂蜜和杏酱风味著称，同时保持清爽的酸度，托卡伊葡萄酒与食物搭配极佳，陈年潜力出色。",
          },
          {
            title: "奥雷穆斯酒庄 (Oremus)",
            image: "/uploads/crawled/wine/oremus-producer.jpg",
            text: "奥雷穆斯酒庄历史悠久，早在1620年就开始生产托卡伊葡萄酒。奥雷穆斯的目标是生产优雅平衡的托卡伊葡萄酒，甜果味与天然酸度完美和谐。",
          },
        ],
      },
    },
    {
      productId: "bbr-sauternes-suduiraut-2023",
      name: "2023 BBR 苏甜白 旭金堡酒庄",
      nameEn: "2023 Berry Bros. & Rudd Sauternes by Château Suduiraut, Bordeaux",
      price: 20,
      capacity: "37.5cl",
      image: "/uploads/crawled/wine/bbr-sauternes-suduiraut-2023.jpg",
      tagline: "BBR 精选·一级庄旭金堡酿造·麦卢卡蜂蜜与橙花香气",
      tags: { type: "甜葡萄酒", region: "法国", vintage: "2023" },
      highlights: ["94% 赛美蓉", "苏玳产区", "贵腐甜白", "15个月橡木桶陈酿"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 37.5cl", unit: "£", price: 19.50 },
        { name: "整箱", spec: "12 x 37.5cl", unit: "£", price: 234.00 },
      ],
      overview: {
        description: "我们的精选苏玳由旭金堡酒庄酿造，采用94%赛美蓉和6%长相思混酿。葡萄感染贵腐菌后浓缩糖分，创造出苏玳标志性的蜂蜜、杏脯和坚果风味。搭配肉酱、蓝纹奶酪或水果甜点。酒香浓郁， layered with 麦卢卡蜂蜜、橙花和一丝姜的微妙气息。口感丰富浓郁，带有杏、油桃和榅桲的优美融合。清爽的酸度提升了酒体，带来悠长美丽的余韵。",
        attribution: "Olly Hallworth, Wine Buyer, Berry Bros. & Rudd",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2023" },
          { icon: "percent", label: "酒精度", value: "14%" },
          { icon: "clock", label: "适饮期", value: "适饮·最佳 (2024-2033)" },
          { icon: "grape", label: "品种", value: "赛美蓉" },
          { icon: "producer", label: "酒庄", value: "Château Suduiraut" },
        ],
        aboutItems: [
          {
            title: "旭金堡酒庄 (Château Suduiraut)",
            image: "/uploads/crawled/wine/suduiraut-producer.jpg",
            text: "旭金堡位于普雷尼亚克 commune，葡萄园与滴金酒庄相邻。酒庄历史可追溯至15世纪。酿酒师 Pierre Pascaud 酿造了一系列出色、强劲、复杂且和谐优美的葡萄酒。这些酒在至少10年瓶陈后表现最佳。",
          },
          {
            title: "苏玳 (Sauternes)",
            image: "/uploads/crawled/wine/sauternes-region.jpg",
            text: "苏玳位于波尔多南部，堪称世界 finest 甜白葡萄酒的故乡。这里的气候与波尔多其他产区不同，清晨的雾气和温暖晴朗的午后为贵腐菌的生长提供了理想条件，赋予了苏玳独特的风味特征。",
          },
          {
            title: "赛美蓉 (Sémillon)",
            image: "/uploads/crawled/wine/semillon-grape.jpg",
            text: "苏玳的主要葡萄品种，在澳大利亚猎人谷也特别成功种植。在波尔多，它是种植最广泛的白葡萄品种，与长相思混酿生产格拉夫的伟大干白和苏玳的伟大甜酒。皮薄使其极易感染贵腐菌，这是酿造苏玳的必要条件。",
          },
        ],
      },
    },
    {
      productId: "chateau-rieussec-2023",
      name: "2023 莱斯古堡 苏玳",
      nameEn: "2023 Château Rieussec, Sauternes, Bordeaux",
      price: 77,
      capacity: "75cl",
      image: "/uploads/crawled/wine/chateau-rieussec-2023.jpg",
      tagline: "一级庄·拉菲罗斯柴尔德集团·苏玳最浓郁 exotic 风格",
      tags: { type: "甜葡萄酒", region: "法国", vintage: "2023" },
      highlights: ["89% 赛美蓉 11% 长相思", "苏玳一级庄", "拉菲集团管理", "适饮期至2042年"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 75cl", unit: "£", price: 77.00 },
        { name: "整箱", spec: "4 x 75cl", unit: "£", price: 308.00 },
      ],
      overview: {
        description: "",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2023" },
          { icon: "percent", label: "酒精度", value: "13.5%" },
          { icon: "clock", label: "适饮期", value: "适饮·年轻 (2024-2042)" },
          { icon: "grape", label: "品种", value: "89% 赛美蓉 11% 长相思" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Château Rieussec" },
        ],
        aboutItems: [
          {
            title: "莱斯古堡 (Château Rieussec)",
            image: "/uploads/crawled/wine/rieussec-producer.jpg",
            text: "莱斯古堡是苏玳最浓郁、最 exotic 的酒庄之一，在1980年代末和1990年代中期出产了特别优秀的葡萄酒。自1985年起由拉菲罗斯柴尔德集团管理，位于苏玳法格村最高点，葡萄园与滴金酒庄相邻。",
          },
          {
            title: "苏玳 (Sauternes)",
            image: "/uploads/crawled/wine/sauternes-region.jpg",
            text: "苏玳位于波尔多南部，堪称世界 finest 甜白葡萄酒的故乡。清晨的雾气和温暖晴朗的午后为贵腐菌的生长提供了理想条件，赋予了苏玳独特的风味特征。",
          },
          {
            title: "赛美蓉 (Sémillon)",
            image: "/uploads/crawled/wine/semillon-grape.jpg",
            text: "苏玳的主要葡萄品种。皮薄使其极易感染贵腐菌，这是酿造苏玳的必要条件。在橡木桶陈年中表现优异，年轻时带有淡淡的柠檬香气，随着陈年发展出羊毛脂风味，质地丰富、奶油般浓郁，呈现深金色。",
          },
        ],
      },
    },
    {
      productId: "chateau-climens-2023",
      name: "2023 克里蒙堡 巴萨克",
      nameEn: "2023 Château Climens, Barsac, Bordeaux",
      price: 134,
      capacity: "75cl",
      image: "/uploads/crawled/wine/chateau-climens-2023.jpg",
      tagline: "巴萨克一级庄·100%赛美蓉·优雅细腻之典范",
      tags: { type: "甜葡萄酒", region: "法国", vintage: "2023" },
      highlights: ["100% 赛美蓉", "巴萨克一级庄", "22个月橡木桶陈酿", "适饮期至2054年"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 75cl", unit: "£", price: 134.00 },
        { name: "整箱", spec: "6 x 75cl", unit: "£", price: 804.00 },
      ],
      overview: {
        description: "",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2023" },
          { icon: "percent", label: "酒精度", value: "14%" },
          { icon: "clock", label: "适饮期", value: "适饮·年轻 (2026-2054)" },
          { icon: "grape", label: "品种", value: "100% 赛美蓉" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Château Climens" },
        ],
        aboutItems: [
          {
            title: "赛美蓉 (Sémillon)",
            image: "/uploads/crawled/wine/semillon-grape.jpg",
            text: "苏玳的主要葡萄品种。皮薄使其极易感染贵腐菌。在橡木桶陈年中表现优异，年轻时带有淡淡的柠檬香气，随着陈年发展出羊毛脂风味，质地丰富、奶油般浓郁，呈现深金色。",
          },
          {
            title: "格拉夫与苏玳 (Graves & Sauternes)",
            image: "/uploads/crawled/wine/graves-sauternes-region.jpg",
            text: "格拉夫和苏玳位于波尔多历史核心地带，砾石土壤、温和坡地和独特温和的气候塑造了非凡特色的葡萄酒。从优雅的烟草香气红葡萄酒到世界最深邃的甜白，这个产区定义了波尔多数个世纪的声誉。",
          },
          {
            title: "克里蒙堡 (Château Climens)",
            image: "/uploads/crawled/wine/climens-producer.jpg",
            text: "克里蒙堡是巴萨克的领先酒庄，出产波尔多最伟大的甜酒之一。历史可追溯至16世纪，1971年由 Lucien Lurton 购入，1992年起由 Bérengère Lurton 管理。葡萄园位于巴萨克最高点（海拔20米），产量严格限制，在小型橡木桶中发酵并陈酿22个月。如果说滴金是力量与浓缩的典范，那么克里蒙就是优雅、细腻与复杂的典范。最佳年份可陈年50年。",
          },
        ],
      },
    },
    {
      productId: "chateau-dyquem-2023",
      name: "2023 滴金酒庄 苏玳",
      nameEn: "2023 Château d'Yquem, Sauternes, Bordeaux",
      price: 780,
      capacity: "75cl",
      image: "/uploads/crawled/wine/chateau-dyquem-2023.jpg",
      tagline: "苏玳超一级庄·甜酒之王·三满分酒评",
      tags: { type: "甜葡萄酒", region: "法国", vintage: "2023" },
      highlights: ["70% 赛美蓉 30% 长相思", "1855超一级庄", "三满分评价", "适饮期至2060年"],
      buyingOptions: [
        { name: "整箱", spec: "3 x 75cl", unit: "£", price: 780.00, note: "In Bond 保税仓储" },
      ],
      overview: {
        description: "2023年份标志着滴金标志性三部曲的最终章。风格上，它捕捉了前作的最佳特质：2021年的明亮与纯净，以及2022年的深度、力量与浓缩。口感深邃复杂，每个成分都以高清晰度呈现。塞维利亚橙、杏、果酱、干菠萝和橙花的香气以完美定义的层次展现。一条酸度线贯穿酒体，驱动出异常悠长的余韵。这无疑将提供数十年的享受，但凭借其新鲜感和平衡度，也可以在年轻时享用。",
        attribution: "Olly Hallworth, Junior Buyer, Berry Bros. & Rudd (February 2026)",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2023" },
          { icon: "percent", label: "酒精度", value: "14%" },
          { icon: "clock", label: "适饮期", value: "尚未成熟 (2027-2060)" },
          { icon: "grape", label: "品种", value: "70% 赛美蓉 30% 长相思" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Château d'Yquem" },
        ],
        aboutItems: [
          {
            title: "赛美蓉 (Sémillon)",
            image: "/uploads/crawled/wine/semillon-grape.jpg",
            text: "苏玳的主要葡萄品种。皮薄使其极易感染贵腐菌，这是酿造苏玳的必要条件。在橡木桶陈年中表现优异，年轻时带有淡淡的柠檬香气，随着陈年发展出羊毛脂风味，质地丰富、奶油般浓郁，呈现深金色。",
          },
          {
            title: "格拉夫与苏玳 (Graves & Sauternes)",
            image: "/uploads/crawled/wine/graves-sauternes-region.jpg",
            text: "格拉夫和苏玳位于波尔多历史核心地带，砾石土壤、温和坡地和独特温和的气候塑造了非凡特色的葡萄酒。从优雅的烟草香气红葡萄酒到世界最深邃的甜白，这个产区定义了波尔多数个世纪的声誉。",
          },
          {
            title: "滴金酒庄 (Château d'Yquem)",
            image: "/uploads/crawled/wine/dyquem-producer.jpg",
            text: "滴金酒庄是苏玳无可争议的巅峰，出产 extraordinary 复杂度和陈年潜力的葡萄酒。1855年被列为超一级庄——唯一获此殊荣的酒庄——为全球甜酒树立了标杆。每一瓶都是耐心、精准和冒险精神的结果，这些品质定义了滴金四个多世纪的历史。",
          },
        ],
      },
    },
    {
      productId: "capela-vesuvio-port-2022",
      name: "2022 维苏威庄园礼拜堂 波特酒",
      nameEn: "2022 Capela da Quinta do Vesuvio, Port, Portugal",
      price: 79,
      capacity: "75cl",
      image: "/uploads/crawled/wine/capela-vesuvio-port-2022.jpg",
      tagline: "杜罗河谷顶级单一园·极小产量·薰衣草与深色水果",
      tags: { type: "甜葡萄酒", region: "葡萄牙", vintage: "2022" },
      highlights: ["维苏威庄园精选", "波特酒", "20% 酒精度", "极具陈年潜力"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 75cl", unit: "£", price: 79.00 },
      ],
      overview: {
        description: "维苏威礼拜堂波特酒是令人惊叹的维苏威庄园 finest 葡萄园的杰出表达，仅在极小产量和 extraordinary 品质的年份酿造。香气极其复杂，散发出薰衣草、多种深色水果、雪松和胡椒香料的气息。口感宏大，具有令人难以置信的强大结构，展现深层复杂的深色水果层次，伴随黑巧克力和烟草的暗示，带来极其持久的余韵。这是一款真正特别的波特酒，将在酒窖中回报耐心。",
        attribution: "Hugo Dale, Account Manager, Berry Bros. & Rudd",
        attributes: [
          { icon: "droplet", label: "色泽", value: "红葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2022" },
          { icon: "percent", label: "酒精度", value: "20%" },
          { icon: "clock", label: "适饮期", value: "尚未成熟" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Quinta do Vesuvio" },
        ],
        aboutItems: [
          {
            title: "维苏威庄园 (Quinta do Vesuvio)",
            image: "",
            text: "维苏威庄园位于杜罗河谷，是波特酒产区最令人惊叹的庄园之一。礼拜堂系列仅在最佳年份从 finest 葡萄园中选取酿造，产量极小，代表了庄园的最高品质表达。",
          },
        ],
      },
    },
    {
      productId: "dows-lbv-port-2020",
      name: "2020 道斯晚装瓶年份波特酒",
      nameEn: "2020 Dow's, Late Bottled Vintage Port, Portugal",
      price: 25,
      capacity: "75cl",
      image: "/uploads/crawled/wine/dows-lbv-port-2020.jpg",
      tagline: "Symington 家族五代传承·黑醋栗与黑莓· peppery 单宁",
      tags: { type: "甜葡萄酒", region: "葡萄牙", vintage: "2020" },
      highlights: ["多品种混酿", "晚装瓶年份波特", "Symington 家族", "20% 酒精度"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 75cl", unit: "£", price: 25.00 },
      ],
      overview: {
        description: "这款2020晚装瓶年份波特与道斯传奇年份波特同源，均来自 Bomfim 庄园和 Senhora da Ribeira 庄园。这些葡萄园自19世纪末以来一直由 Symington 家族拥有。五代 Symington 酿酒师悉心照料这些葡萄园，赋予道斯独特的葡萄酒风格——以强度和结构为特征，带有新鲜黑色水果风味、peppery 单宁和标志性的干爽风格。诱人的黑醋栗和黑莓香气，伴随黑巧克力的底蕴，随后是岩玫瑰（杜罗野花）和森林元素的气息。道斯标志性的 peppery 单宁与 earthy 片岩特征完美融合，被矿物般的清新感提升。",
        attribution: "Rob Symington, Managing Director (UK), Berry Bros. & Rudd",
        attributes: [
          { icon: "droplet", label: "色泽", value: "红葡萄酒" },
          { icon: "glass", label: "甜度", value: "甜型" },
          { icon: "calendar", label: "年份", value: "2020" },
          { icon: "percent", label: "酒精度", value: "20%" },
          { icon: "clock", label: "适饮期", value: "适饮·最佳" },
          { icon: "grape", label: "品种", value: "国产弗兰卡等混酿" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Dow's" },
        ],
        aboutItems: [
          {
            title: "道斯酒庄 (Dow's)",
            image: "",
            text: "道斯是 Symington 家族旗下的标志性波特品牌，以强度、结构和 peppery 单宁著称。葡萄园位于杜罗河谷的 Bomfim 和 Senhora da Ribeira 庄园，自19世纪末由家族管理。五代酿酒师的传承赋予道斯独特的干爽风格。",
          },
        ],
      },
    },
    {
      productId: "oremus-tokaji-aszu-2019",
      name: "2019 托卡伊阿苏五篓 奥雷穆斯酒庄",
      nameEn: "2019 Tokaji Aszú, 5 Puttonyos, Oremus, Hungary",
      price: 71,
      capacity: "50cl",
      image: "/uploads/crawled/wine/oremus-tokaji-aszu-2019.jpg",
      tagline: "托卡伊顶级甜酒·五篓阿苏·蜡质柠檬与蜂蜜菠萝",
      tags: { type: "甜葡萄酒", region: "匈牙利", vintage: "2019" },
      highlights: ["富尔民特为主", "5 Puttonyos 阿苏", "James Suckling 96分", "11% 酒精度"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 50cl", unit: "£", price: 71.00 },
        { name: "整箱", spec: "6 x 50cl", unit: "£", price: 426.00 },
      ],
      overview: {
        description: "",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2019" },
          { icon: "percent", label: "酒精度", value: "11%" },
          { icon: "clock", label: "适饮期", value: "适饮·年轻" },
          { icon: "grape", label: "品种", value: "富尔民特等" },
          { icon: "producer", label: "酒庄", value: "Oremus" },
        ],
        aboutItems: [
          {
            title: "富尔民特 (Furmint)",
            image: "/uploads/crawled/wine/furmint-grape.jpg",
            text: "富尔民特是匈牙利和斯洛伐克种植的白葡萄品种，也是托卡伊阿苏的主要原料。它是早发芽晚成熟的品种，特别容易感染贵腐菌。",
          },
          {
            title: "托卡伊 (Tokaj)",
            image: "/uploads/crawled/wine/tokaj-region.jpg",
            text: "托卡伊葡萄酒产区位于匈牙利东北部，以生产托卡伊葡萄酒而闻名，这是世界上最古老、最著名的甜酒之一。以蜂蜜和杏酱风味著称，同时保持清爽的酸度，托卡伊葡萄酒与食物搭配极佳，陈年潜力出色。",
          },
          {
            title: "奥雷穆斯酒庄 (Oremus)",
            image: "/uploads/crawled/wine/oremus-producer.jpg",
            text: "奥雷穆斯酒庄历史悠久，早在1620年就开始生产托卡伊葡萄酒。奥雷穆斯的目标是生产优雅平衡的托卡伊葡萄酒，甜果味与天然酸度完美和谐。",
          },
        ],
      },
    },
    {
      productId: "chateau-raymond-lafon-2019",
      name: "2019 雷蒙拉丰堡 苏玳",
      nameEn: "2019 Château Raymond-Lafon, Sauternes, Bordeaux",
      price: 30,
      capacity: "75cl",
      image: "/uploads/crawled/wine/chateau-raymond-lafon-2019.jpg",
      tagline: "苏玳性价比之选·成熟芒果与菠萝·蜂蜡气息",
      tags: { type: "甜葡萄酒", region: "法国", vintage: "2019" },
      highlights: ["赛美蓉与长相思混酿", "苏玳产区", "Neal Martin 94分", "适饮期至2050年"],
      buyingOptions: [
        { name: "单瓶", spec: "1 x 75cl", unit: "£", price: 29.95 },
        { name: "整箱", spec: "6 x 75cl", unit: "£", price: 179.70 },
      ],
      overview: {
        description: "成熟的芒果和菠萝香气从杯中跃出，紧随其后的是蜂蜜般、近乎蜂蜡的气息，将你 unmistakably 带入苏玳的世界。年轻时这款酒非常浓郁，但被明亮的酸度所控制，避免了甜腻感。与许多甜酒一样，耐心将获得更深层的复杂回报——但现在享用也完全令人愉悦。搭配经典食物：与鹅肝搭配令人眼前一亮，与孔泰或格鲁耶尔等咸味奶酪搭配堪称天堂。但作为餐后单独享用也同样美丽。",
        attribution: "Kyle Piccinino, Wine & Spirits Advisor at Berry Bros. & Rudd (May 2026)",
        attributes: [
          { icon: "droplet", label: "色泽", value: "白葡萄酒" },
          { icon: "glass", label: "甜度", value: "极甜" },
          { icon: "calendar", label: "年份", value: "2019" },
          { icon: "percent", label: "酒精度", value: "14%" },
          { icon: "clock", label: "适饮期", value: "适饮·成熟 (2020-2024)" },
          { icon: "grape", label: "品种", value: "赛美蓉 长相思" },
          { icon: "body", label: "酒体", value: "饱满酒体" },
          { icon: "producer", label: "酒庄", value: "Château Raymond-Lafon" },
        ],
        aboutItems: [
          {
            title: "赛美蓉 (Sémillon)",
            image: "/uploads/crawled/wine/semillon-grape.jpg",
            text: "苏玳的主要葡萄品种。皮薄使其极易感染贵腐菌，这是酿造苏玳的必要条件。在橡木桶陈年中表现优异，年轻时带有淡淡的柠檬香气，随着陈年发展出羊毛脂风味，质地丰富、奶油般浓郁，呈现深金色。",
          },
          {
            title: "格拉夫与苏玳 (Graves & Sauternes)",
            image: "/uploads/crawled/wine/graves-sauternes-region.jpg",
            text: "格拉夫和苏玳位于波尔多历史核心地带，砾石土壤、温和坡地和独特温和的气候塑造了非凡特色的葡萄酒。从优雅的烟草香气红葡萄酒到世界最深邃的甜白，这个产区定义了波尔多数个世纪的声誉。",
          },
        ],
      },
    },
  ];

  let inserted = 0;
  let updated = 0;

  for (const w of wines) {
    const [existing] = await pool.query("SELECT product_id FROM products_wine WHERE product_id = ?", [w.productId]);
    const sql = `INSERT INTO products_wine (product_id, name, name_en, price, unit, capacity, image, tagline, tags, highlights, buying_options, overview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), name_en=VALUES(name_en), price=VALUES(price), capacity=VALUES(capacity),
      image=VALUES(image), tagline=VALUES(tagline), tags=VALUES(tags), highlights=VALUES(highlights),
      buying_options=VALUES(buying_options), overview=VALUES(overview)`;

    await pool.query(sql, [
      w.productId, w.name, w.nameEn, w.price, "£", w.capacity, w.image,
      w.tagline, JSON.stringify(w.tags), JSON.stringify(w.highlights),
      JSON.stringify(w.buyingOptions), JSON.stringify(w.overview),
    ]);

    if (existing.length > 0) {
      console.log(`✅ Updated: ${w.productId}`);
      updated++;
    } else {
      console.log(`✅ Inserted: ${w.productId}`);
      inserted++;
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated`);
  process.exit(0);
})();
