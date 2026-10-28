const { randomUUID } = require('node:crypto')

class AgentError extends Error {
  constructor(code, message, status = 503) { super(message); this.name = 'AgentError'; this.code = code; this.status = status }
}
const DEFAULTS = Object.freeze({
  runTimeoutMs: 120000, modelTimeoutMs: 45000, toolTimeoutMs: 20000,
  modelRetries: 2, retryDelayMs: 200, maxConcurrentRuns: 8, maxConcurrentTools: 8,
  maxInputChars: 8000, maxContextChars: 64000, maxOutputChars: 32000,
  maxToolResultChars: 16000, maxToolArgumentChars: 16000, maxToolCalls: 24,
  maxCallsPerRound: 8, maxRepeatedCalls: 3, maxOutputTokens: 4096,
  circuitThreshold: 3, circuitCooldownMs: 30000,
})
function failIfAborted(signal) { if (signal.aborted) throw signal.reason || new AgentError('CANCELLED', '请求已取消', 499) }
function bounded(task, signal, timeoutMs, code) {
  const controller = new AbortController()
  return new Promise((resolve, reject) => {
    let timer
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', cancel) }
    const finish = (fn, value) => { cleanup(); fn(value) }
    const cancel = () => { const e = signal.reason || new AgentError('CANCELLED', '请求已取消', 499); controller.abort(e); finish(reject, e) }
    if (signal?.aborted) { cancel(); return }
    signal?.addEventListener('abort', cancel, { once: true })
    timer = setTimeout(() => { const e = new AgentError(code, code === 'TOOL_TIMEOUT' ? '工具执行超时' : '模型响应超时', 504); controller.abort(e); finish(reject, e) }, timeoutMs)
    Promise.resolve().then(() => { failIfAborted(controller.signal); return task(controller.signal) }).then(v => finish(resolve, v), e => finish(reject, e))
  })
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]))
  return value
}
function createHarness(options = {}, onTrace = () => {}) {
  const limits = { ...DEFAULTS, ...options }
  for (const [name, n] of Object.entries(limits)) if (!Number.isSafeInteger(n) || n < (name === 'modelRetries' ? 0 : 1)) throw new Error(`Invalid harness limit: ${name}`)
  let activeRuns = 0, activeTools = 0, activeModels = 0
  const circuits = new Map()
  function begin(message, externalSignal) {
    if (typeof message !== 'string' || !message.trim() || message.length > limits.maxInputChars) throw new AgentError('INVALID_INPUT', '消息为空或超过长度限制', 400)
    if (activeRuns >= limits.maxConcurrentRuns) throw new AgentError('BUSY', 'AI 正忙，请稍后重试', 429)
    activeRuns++
    const controller = new AbortController(), runId = randomUUID(), start = Date.now()
    const trace = (event, data = {}) => { try { onTrace({ runId, event, elapsedMs: Date.now() - start, ...data }) } catch {} }
    const cancel = () => controller.abort(new AgentError('CANCELLED', '请求已取消', 499))
    if (externalSignal?.aborted) cancel()
    else externalSignal?.addEventListener('abort', cancel, { once: true })
    const timer = setTimeout(() => controller.abort(new AgentError('RUN_TIMEOUT', '本次规划超时，请缩小需求后重试', 504)), limits.runTimeoutMs)
    const cache = new Map(), repeats = new Map()
    let toolCalls = 0, closed = false
    trace('run_start')
    return {
      runId, signal: controller.signal, limits, trace,
      check: () => failIfAborted(controller.signal),
      async model(task) {
        for (let attempt = 0; ; attempt++) {
          failIfAborted(controller.signal)
          let started = false
          if (activeModels >= limits.maxConcurrentRuns) throw new AgentError('BUSY', '模型请求繁忙，请稍后重试', 429)
          activeModels++
          try {
            return await bounded(async signal => {
              started = true
              try { return await task(signal) } finally { activeModels-- }
            }, controller.signal, limits.modelTimeoutMs, 'MODEL_TIMEOUT')
          }
          catch (e) {
            if (!started) activeModels--
            failIfAborted(controller.signal)
            const retryable = e.code === 'MODEL_TIMEOUT' || !(e instanceof AgentError) && (e.status === 429 || e.status >= 500 || ['APIConnectionError', 'APIConnectionTimeoutError'].includes(e.name))
            if (!retryable || attempt >= limits.modelRetries) throw e
            trace('model_retry', { attempt: attempt + 1, code: e.code || String(e.status || e.name) })
            await bounded(() => new Promise(resolve => setTimeout(resolve, limits.retryDelayMs * 2 ** attempt)), controller.signal, limits.modelTimeoutMs, 'MODEL_TIMEOUT')
          }
        }
      },
      async tool(name, args, task) {
        failIfAborted(controller.signal)
        toolCalls++
        if (toolCalls > limits.maxToolCalls) return { error: '工具调用预算已用尽，请根据已有信息总结。', code: 'TOOL_BUDGET' }
        const key = name + ':' + JSON.stringify(canonical(args)), count = (repeats.get(key) || 0) + 1
        repeats.set(key, count)
        if (count > limits.maxRepeatedCalls) return { error: '重复查询次数过多，请调整条件或总结。', code: 'REPEATED_TOOL' }
        if (cache.has(key)) { trace('tool_cache', { tool: name }); return cache.get(key) }
        const circuit = circuits.get(name) || { failures: 0, until: 0 }
        if (circuit.until > Date.now()) return { error: '该工具暂时不可用，请使用其他数据或说明限制。', code: 'CIRCUIT_OPEN' }
        if (activeTools >= limits.maxConcurrentTools) return { error: '工具繁忙，请稍后重试。', code: 'TOOL_BUSY' }
        activeTools++
        trace('tool_start', { tool: name })
        let started = false
        try {
          const result = await bounded(async signal => {
            started = true
            // Keep the physical tool slot occupied until the underlying task settles.
            // Promise timeout cannot cancel a MySQL query that ignores AbortSignal.
            try { return await task(signal) } finally { activeTools-- }
          }, controller.signal, limits.toolTimeoutMs, 'TOOL_TIMEOUT')
          const encoded = JSON.stringify(result ?? null)
          if (encoded.length > limits.maxToolResultChars) throw new AgentError('TOOL_RESULT_LIMIT', '工具结果过大')
          if (result?.error) throw new AgentError('TOOL_FAILED', '工具返回错误')
          circuits.delete(name)
          cache.set(key, result ?? null)
          trace('tool_end', { tool: name, resultChars: encoded.length })
          return result ?? null
        } catch (e) {
          if (!started) activeTools--
          failIfAborted(controller.signal)
          circuit.failures++
          if (circuit.failures >= limits.circuitThreshold) circuit.until = Date.now() + limits.circuitCooldownMs
          circuits.set(name, circuit)
          trace('tool_error', { tool: name, code: e.code || 'TOOL_FAILED' })
          return { error: '工具暂时执行失败，请调整查询或说明限制，不要编造结果。', code: e.code || 'TOOL_FAILED' }
        }
      },
      finish(error) {
        if (closed) return
        closed = true; clearTimeout(timer); externalSignal?.removeEventListener('abort', cancel); activeRuns--
        trace(error ? 'run_error' : 'run_end', { toolCalls, ...(error ? { code: error.code || 'AGENT_FAILED' } : {}) })
      },
    }
  }
  return { begin, limits }
}
module.exports = { createHarness, AgentError, bounded }
