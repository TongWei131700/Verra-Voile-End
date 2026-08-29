/**
 * Agent 主循环（ReAct 模式）
 * - 所有 LLM 调用均使用流式（stream: true），实时推送 token
 * - onEvent 回调在每个阶段触发：thinking / token / done
 */
const OpenAI = require('openai')
const { SYSTEM_PROMPT } = require('./prompt')
const tools = require('./tools')
const { executeTool } = require('./tool-executor')

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})

const MODEL = 'qwen-plus'
const MAX_TOOL_ROUNDS = 8

/**
 * 解析内容中的 [TABLE]...[/TABLE] 块
 * 返回: { text: '带标记的纯文本', tables: [{ index, content }] }
 */
function parseTables(content) {
  const tables = []
  let text = content
  let idx = 0
  const regex = /\[TABLE\]([\s\S]*?)\[\/TABLE\]/g
  let result = ''
  let lastIdx = 0
  let m

  while ((m = regex.exec(content)) !== null) {
    idx++
    tables.push({ index: idx, content: m[1].trim() })
    result += content.slice(lastIdx, m.index) + `[TABLE_${idx}]`
    lastIdx = m.index + m[0].length
  }
  result += content.slice(lastIdx)

  return { text: result, tables }
}

/**
 * 运行 Agent（流式 + 事件回调）
 * @param {string} userMessage 用户消息
 * @param {Array} conversationHistory 对话历史
 * @param {Function} [onEvent] 事件回调 (event) => void
 *   event 类型：
 *   - { type: 'thinking', tool: string, args: object }  工具调用
 *   - { type: 'token', content: string }                 流式 token
 *   - { type: 'done', reply: string, history: Array }    完成
 */
async function runAgent(userMessage, conversationHistory = [], onEvent = null) {
  const emit = (event) => { if (onEvent) onEvent(event) }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // 流式调用 LLM
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto',
      stream: true,
    })

    let content = ''
    const toolCallsMap = {}

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta

      // 累积文本内容（先缓存，流完再决定是思考还是回复）
      if (delta?.content) {
        content += delta.content
      }

      // 累积工具调用（流式分片到达）
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          if (!toolCallsMap[idx]) {
            toolCallsMap[idx] = {
              id: tc.id || '',
              type: 'function',
              function: { name: tc.function?.name || '', arguments: '' },
            }
          }
          if (tc.function?.arguments) {
            toolCallsMap[idx].function.arguments += tc.function.arguments
          }
          if (tc.id) {
            toolCallsMap[idx].id = tc.id
          }
          if (tc.function?.name) {
            toolCallsMap[idx].function.name = tc.function.name
          }
        }
      }
    }

    const toolCalls = Object.values(toolCallsMap)

    // 没有工具调用 → 最终回复
    if (toolCalls.length === 0) {
      messages.push({ role: 'assistant', content })

      // 解析 [TABLE] 块，分别推送文字和表格
      const { text: parsedText, tables } = parseTables(content)
      console.log(`[Agent] 回复长度: ${content.length}, 解析到 ${tables.length} 个表格`)
      if (tables.length > 0) {
        console.log('[Agent] 表格内容预览:', tables.map(t => `#${t.index}: ${t.content.slice(0, 60)}...`))
      }
      for (const char of parsedText) {
        emit({ type: 'token', content: char })
      }
      for (const table of tables) {
        emit({ type: 'table_data', index: table.index, content: table.content })
      }

      emit({ type: 'done', reply: content, history: messages.slice(1) })
      return { reply: content, history: messages.slice(1) }
    }

    // 有工具调用 → 推送思考 + 执行工具
    messages.push({
      role: 'assistant',
      content: content || null,
      tool_calls: toolCalls,
    })

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments)
      const toolName = toolCall.function.name
      console.log(`[Agent] 调用工具: ${toolName}(${JSON.stringify(args)})`)

      // 实时推送思考步骤（用模型自己的话）
      emit({
        type: 'thinking',
        tool: toolName,
        label: content.trim() || `调用 ${toolName}...`,
        args,
      })
      content = '' // 清空，避免下一轮重复

      const result = await executeTool(toolName, args)
      console.log(`[Agent] 工具返回: ${JSON.stringify(result).substring(0, 200)}...`)

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }
  }

  // 超过最大轮次，强制总结（也流式）
  messages.push({
    role: 'user',
    content: '（系统提示：请根据已收集的信息给出你的建议，不要再调用工具了。）',
  })

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  })

  let content = ''
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta
    if (delta?.content) {
      content += delta.content
    }
  }

  messages.push({ role: 'assistant', content })

  // 解析 [TABLE] 块，分别推送文字和表格
  const { text: parsedText, tables } = parseTables(content)
  for (const char of parsedText) {
    emit({ type: 'token', content: char })
  }
  for (const table of tables) {
    emit({ type: 'table_data', index: table.index, content: table.content })
  }

  emit({ type: 'done', reply: content, history: messages.slice(1) })
  return { reply: content, history: messages.slice(1) }
}

module.exports = { runAgent }
