/**
 * Agent 工具定义（Function Calling Schema）
 * 这些描述会发送给 LLM，让它知道有哪些工具可用
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_venues',
      description: '搜索目的地婚礼场地。可按国家、城市、容纳人数、预算筛选。',
      parameters: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: '国家英文名，如 france, italy, spain, greece, portugal',
          },
          city: {
            type: 'string',
            description: '城市英文名，如 paris, rome, santorini',
          },
          min_capacity: {
            type: 'number',
            description: '最少容纳人数',
          },
          max_capacity: {
            type: 'number',
            description: '最多容纳人数',
          },
          max_budget: {
            type: 'number',
            description: '最高预算（人民币元）',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_photographers',
      description: '搜索目的地婚礼摄影师。可按国家和风格筛选。',
      parameters: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: '国家英文名，如 france, italy, spain',
          },
          style: {
            type: 'string',
            description: '摄影风格，如 romantic, documentary, fine-art',
          },
          max_budget: {
            type: 'number',
            description: '最高预算（人民币元）',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_florists',
      description: '搜索婚礼花店/花卉服务商。可按国家和城市筛选。',
      parameters: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: '国家英文名，如 france, italy, spain',
          },
          city: {
            type: 'string',
            description: '城市英文名',
          },
          max_budget: {
            type: 'number',
            description: '最高预算（人民币元）',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_flowers',
      description: '搜索具体花卉商品（花束、花艺摆件、绿植等）。可按分类和价格筛选。返回 Florajet 的真实商品数据。',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '花束分类，如：玫瑰花束、混合花束、夏季花束、花卉与礼物、花艺摆件、花艺师精选、绿植',
          },
          max_price: {
            type: 'number',
            description: '最高价格（欧元）',
          },
          keyword: {
            type: 'string',
            description: '搜索关键词（匹配商品名称或描述）',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_budget',
      description: '根据总预算计算婚礼各项费用的建议分配（场地、摄影、花卉、餐饮、其他）。',
      parameters: {
        type: 'object',
        properties: {
          total_budget: {
            type: 'number',
            description: '总预算（人民币元）',
          },
          guest_count: {
            type: 'number',
            description: '预计宾客人数',
          },
        },
        required: ['total_budget'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_wines',
      description: '搜索婚礼酒水商品（红酒、白酒、桃红等）。可按关键词和价格筛选。返回 66 款真实酒水数据。',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: '搜索关键词（匹配酒名、产区、酒庄等）',
          },
          max_price: {
            type: 'number',
            description: '最高价格（欧元）',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_dresses',
      description: '搜索婚礼礼服商品。返回 crawled_dresses 表中的真实礼服数据（slug 格式为 wona-xxx），可直接用于生成卡片链接。',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_wedding_visuals',
      description: '分析用户上传的婚礼视频或图片中的视觉要素。提取场地风格、色调、花艺、婚纱、布置风格等特征，返回结构化标签。当用户上传了视频/图片并希望获得类似风格的推荐时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          video_id: {
            type: 'string',
            description: '用户上传视频/图片后返回的 mediaId（格式如 v_xxxxx_xxxxxx）',
          },
        },
        required: ['video_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_plan_summary',
      description: '生成最终婚礼推荐方案摘要。当用户已确定最终选择、要求汇总推荐、或需要完整方案时使用此工具。将各项推荐汇总为结构化方案，前端会渲染为精美表格并支持 PDF 下载。',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: '推荐项目列表，每项代表一个婚礼服务类别',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', description: '类别英文名：venue/flowers/dress/photographer/wine/team/decoration' },
                category_cn: { type: 'string', description: '类别中文名：场地/花艺/礼服/摄影/酒水/策划团队/布置' },
                name: { type: 'string', description: '推荐商品/服务中文名称' },
                name_en: { type: 'string', description: '商品/服务英文名称（如 Villa Rossa、COCCINELLE、Princess A-line）' },
                description: { type: 'string', description: '一句话推荐理由' },
                price_range: { type: 'string', description: '价格区间，如 €5000-8000 或 ¥30000-50000' },
                image: { type: 'string', description: '商品封面图 URL（可选）' },
                link: { type: 'string', description: '商品详情页链接（必须使用工具返回的 slug 拼接，如 /destinations/villa-rossa、/flowers/product/coccinelle）' },
              },
              required: ['category', 'category_cn', 'name', 'description', 'price_range'],
            },
          },
        },
        required: ['items'],
      },
    },
  },
]

module.exports = tools
