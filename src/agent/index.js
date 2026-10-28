/** Public Agent API. LangGraph owns the model/tool/summary execution flow. */
const { createAgentRunner } = require('./graph')
const { trimHistory } = require('./graph')

// Lazy initialization allows health checks and tests without loading provider secrets.
let runner
async function runAgent(userMessage, conversationHistory = [], onEvent = null, options = {}) {
  if (!runner) {
    const OpenAI = require('openai')
    const { SYSTEM_PROMPT } = require('./prompt')
    const tools = require('./tools')
    const { executeTool } = require('./tool-executor')
    runner = createAgentRunner({
      client: new OpenAI({
        apiKey: process.env.DASHSCOPE_API_KEY,
        baseURL: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
        timeout: 60000,
        maxRetries: 0,
      }),
      model: 'qwen3.7-plus',
      systemPrompt: SYSTEM_PROMPT,
      tools,
      executeTool,
      onTrace: record => console.info('[AgentHarness]', JSON.stringify(record)),
    })
  }
  return runner(userMessage, conversationHistory, onEvent, options)
}
module.exports = { runAgent, trimHistory }
