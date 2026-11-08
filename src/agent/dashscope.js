const DASHSCOPE_MODEL = 'qwen3.8-max'

function getDashScopeConfig() {
  return {
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: process.env.DASHSCOPE_BASE_URL?.trim() ||
      'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
  }
}

module.exports = { DASHSCOPE_MODEL, getDashScopeConfig }
