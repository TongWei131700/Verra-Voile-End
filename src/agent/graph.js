/** LangGraph orchestration. Provider and business tools are injected for testing. */
const { StateGraph, Annotation, START, END } = require('@langchain/langgraph')
const Ajv = require('ajv')
const { createHarness, AgentError } = require('./harness')

// Keep whole user turns so tool calls and their results are never split.
function trimHistory(history = [], limit = 20) {
  const safe = history.filter(message => message.role !== 'system')
  let start = Math.max(0, safe.length - limit)
  while (start < safe.length && safe[start].role !== 'user') start++
  return safe.slice(start)
}

function parseTables(content) {
  const tables = []
  const text = content.replace(/\[TABLE\]([\s\S]*?)\[\/TABLE\]/g, (_, body) => {
    const index = tables.length + 1
    tables.push({ index, content: body.trim() })
    return `[TABLE_${index}]`
  })
  return { text, tables }
}

function createAgentRunner({ client, model, systemPrompt, tools, executeTool, maxToolRounds = 8, harnessOptions, onTrace }) {
  const harness = createHarness(harnessOptions, onTrace)
  // Only explicitly declared tools and arguments are exposed to the provider.
  tools = structuredClone(tools)
  function constrain(schema) {
    if (schema.type === 'object') {
      schema.additionalProperties = false
      for (const [name, child] of Object.entries(schema.properties || {})) {
        if (child.type === 'number') child.minimum = name.includes('guest') || name.includes('capacity') ? 1 : 0
        if (child.type === 'string') child.maxLength = 4000
        constrain(child)
      }
    }
    if (schema.type === 'array') { schema.maxItems = 30; constrain(schema.items) }
  }
  for (const tool of tools) constrain(tool.function.parameters)
  const ajv = new Ajv({ strict: false })
  const validators = new Map(tools.map(tool => [tool.function.name, ajv.compile(tool.function.parameters)]))
  const State = Annotation.Root({
    messages: Annotation({ reducer: (previous, next) => previous.concat(next), default: () => [] }),
    rounds: Annotation({ default: () => 0 }),
    reply: Annotation({ default: () => '' }),
    stopTools: Annotation({ default: () => false }),
  })

  return async function runAgent(userMessage, conversationHistory = [], onEvent = null, options = {}) {
    const run = harness.begin(userMessage, options.signal)
    let failure
    try {
      const emit = event => { run.check(); if (onEvent) onEvent(event) }
      async function callModel(state, summarize = false) {
        const messages = summarize
          ? [...state.messages, { role: 'user', content: '（系统提示：请根据已收集的信息给出你的建议，不要再调用工具了。）' }]
          : state.messages
        if (JSON.stringify(messages).length > run.limits.maxContextChars) throw new AgentError('CONTEXT_LIMIT', '对话内容过长，请开始新的会话', 400)
        run.trace('model_start', { round: state.rounds + 1, summarize })
        return run.model(async signal => {
          const stream = await client.chat.completions.create({
            model, messages, stream: true, max_tokens: run.limits.maxOutputTokens,
            ...(!summarize ? { tools, tool_choice: 'auto' } : {}),
          }, { signal, maxRetries: 0 })
          let content = '', finishReason
          const calls = new Map()
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta
            finishReason = chunk.choices?.[0]?.finish_reason || finishReason
            content += delta?.content || ''
            if (content.length > run.limits.maxOutputChars) throw new AgentError('OUTPUT_LIMIT', '模型回复过长，请缩小需求')
            for (const fragment of delta?.tool_calls || []) {
              const call = calls.get(fragment.index) || { id: '', type: 'function', function: { name: '', arguments: '' } }
              if (fragment.id) call.id = fragment.id
              if (fragment.function?.name) call.function.name += fragment.function.name
              call.function.arguments += fragment.function?.arguments || ''
              if (call.function.arguments.length > run.limits.maxToolArgumentChars || call.function.name.length > 128 || calls.size >= run.limits.maxCallsPerRound && !calls.has(fragment.index)) throw new AgentError('TOOL_CALL_LIMIT', '工具调用内容超过限制')
              calls.set(fragment.index, call)
            }
          }
          run.check()
          if (finishReason === 'length') throw new AgentError('OUTPUT_LIMIT', '模型输出已达上限，请缩小需求后重试')
          const toolCalls = [...calls.values()]
          if (new Set(toolCalls.map(c => c.id)).size !== toolCalls.length || toolCalls.some(c => !c.id)) throw new AgentError('INVALID_TOOL_CALL', '模型工具调用标识异常')
          if (!toolCalls.length && !content.trim()) throw new AgentError('EMPTY_RESPONSE', '模型未返回有效内容，请重试')
          if (summarize && toolCalls.length) throw new Error('Model returned tool calls during final summary')
          const response = { role: 'assistant', content: content || (toolCalls.length ? null : '') }
          if (toolCalls.length) response.tool_calls = toolCalls
          // Do not leak planning text into the final answer or split [TABLE] markers.
          run.trace('model_end', { round: state.rounds + 1, toolCount: toolCalls.length, outputChars: content.length })
          return { messages: [response], rounds: state.rounds + 1 }
        })
      }

      async function toolNode(state) {
        const last = state.messages.at(-1)
        const messages = []
        let stopTools = false
        for (const call of last.tool_calls) {
          let args, result
          try {
            if (!call.id) throw new Error('Missing tool call id')
            const validate = validators.get(call.function.name)
            if (!validate) throw new Error('Unknown tool')
            args = JSON.parse(call.function.arguments || '{}')
            if (!validate(args)) throw new Error('Invalid tool arguments')
          } catch {
            if (!call.id) throw new Error('Invalid model tool call: missing id')
            result = { error: '工具名称或参数无效，请按工具定义修正后重试。' }
          }
          if (!result) {
            emit({ type: 'thinking', tool: call.function.name, label: last.content?.trim() || `调用 ${call.function.name}...`, args })
            result = await run.tool(call.function.name, args, signal => executeTool(call.function.name, args, { signal }))
            if (result?._type === 'plan_summary') emit({ type: 'plan_summary', items: result.items })
          }
          if (['TOOL_BUDGET', 'REPEATED_TOOL'].includes(result?.code)) stopTools = true
          messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result ?? null) })
        }
        return { messages, stopTools }
      }

      function answer(state) {
        const reply = state.messages.at(-1).content || ''
        const { text, tables } = parseTables(reply)
        // Preserve the existing frontend event protocol, including table placeholders.
        for (const char of text) emit({ type: 'token', content: char })
        for (const table of tables) emit({ type: 'table_data', ...table })
        return { reply }
      }

      const graph = new StateGraph(State)
        .addNode('model', state => callModel(state))
        .addNode('tools', toolNode)
        .addNode('summarize', state => callModel(state, true))
        .addNode('answer', answer)
        .addEdge(START, 'model')
        .addConditionalEdges('model', state => state.messages.at(-1).tool_calls?.length ? 'tools' : 'answer')
        .addConditionalEdges('tools', state => state.rounds >= maxToolRounds || state.stopTools ? 'summarize' : 'model')
        .addEdge('summarize', 'answer')
        .addEdge('answer', END)
        .compile()
      const result = await graph.invoke({
        messages: [{ role: 'system', content: systemPrompt }, ...trimHistory(conversationHistory), { role: 'user', content: userMessage }],
        rounds: 0,
      }, { recursionLimit: maxToolRounds * 2 + 5, signal: run.signal })
      const history = result.messages.slice(1)
      emit({ type: 'done', reply: result.reply, history })
      return { reply: result.reply, history }
    } catch (error) { failure = run.signal.aborted ? run.signal.reason : error; throw failure } finally { run.finish(failure) }
  }
}

module.exports = { createAgentRunner, trimHistory, parseTables }
