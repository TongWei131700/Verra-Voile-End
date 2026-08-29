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
      description: '搜索婚礼礼服商品（白纱、蓬蓬裙、缎面等）。返回所有可用礼服款式。',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
]

module.exports = tools
