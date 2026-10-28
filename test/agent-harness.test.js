const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createHarness } = require('../src/agent/harness')
const { AgentSessions } = require('../src/agent/sessions')
const { createAgentRunner } = require('../src/agent/graph')
const tools = require('../src/agent/tools')
const pending = () => new Promise(() => {})
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const failure = code => error => error.code === code

test('invalid input is rejected before acquiring capacity', () => {
  const h = createHarness({ maxInputChars: 2 })
  for (const input of [null, {}, '', '   ', 'abc']) assert.throws(() => h.begin(input), failure('INVALID_INPUT'))
  const run = h.begin('ok'); run.finish()
})
test('capacity is bounded and finish is idempotent', () => {
  const h = createHarness({ maxConcurrentRuns: 1 }), r = h.begin('a')
  assert.throws(() => h.begin('b'), failure('BUSY'))
  r.finish(); r.finish(); const next = h.begin('c'); next.finish()
})
test('total deadline aborts a hung model', async () => {
  const h = createHarness({ runTimeoutMs: 20 }), r = h.begin('a')
  try { await assert.rejects(r.model(pending), failure('RUN_TIMEOUT')) } finally { r.finish() }
})
test('caller cancellation is propagated to provider task', async () => {
  const controller = new AbortController(), r = createHarness().begin('a', controller.signal)
  let providerSignal
  try {
    const p = r.model(signal => { providerSignal = signal; return pending() })
    await sleep(1); controller.abort()
    await assert.rejects(p, failure('CANCELLED')); assert.ok(providerSignal.aborted)
  } finally { r.finish() }
})
test('transient provider errors retry, authorization errors do not', async () => {
  const traces = [], r = createHarness({ retryDelayMs: 1 }, e => traces.push(e)).begin('a')
  let count = 0
  try {
    const value = await r.model(async () => { if (++count < 3) throw Object.assign(new Error('failure'), { status: 503 }); return 'ok' })
    assert.equal(value, 'ok'); assert.equal(count, 3)
    assert.equal(traces.filter(x => x.event === 'model_retry').length, 2)
    let auth = 0
    await assert.rejects(r.model(async () => { auth++; throw Object.assign(new Error('unauthorized'), { status: 401 }) }))
    assert.equal(auth, 1)
  } finally { r.finish() }
})
test('hung provider cannot free physical capacity and cause unlimited calls', async () => {
  const h = createHarness({ maxConcurrentRuns: 1, modelTimeoutMs: 10, modelRetries: 0 }), r = h.begin('a')
  await assert.rejects(r.model(pending), failure('MODEL_TIMEOUT')); r.finish()
  const next = h.begin('b')
  try { await assert.rejects(next.model(async () => 'never'), failure('BUSY')) } finally { next.finish() }
})
test('tool timeout returns safe result and retains physical tool slot', async () => {
  const h = createHarness({ toolTimeoutMs: 10, maxConcurrentTools: 1 }), r = h.begin('a')
  let resolve
  try {
    const result = await r.tool('search', {}, () => new Promise(r => { resolve = r }))
    assert.equal(result.code, 'TOOL_TIMEOUT')
    assert.equal((await r.tool('other', {}, async () => 'x')).code, 'TOOL_BUSY')
    resolve('late'); await sleep(1)
    assert.equal(await r.tool('other', {}, async () => 'ok'), 'ok')
  } finally { r.finish() }
})
test('identical normalized query caches results, then halts repetition', async () => {
  const r = createHarness({ maxRepeatedCalls: 2 }).begin('a'); let count = 0
  try {
    const task = async () => { count++; return { ok: true } }
    await r.tool('search', { a: 1, b: 2 }, task)
    await r.tool('search', { b: 2, a: 1 }, task)
    assert.equal(count, 1)
    assert.equal((await r.tool('search', { a: 1, b: 2 }, task)).code, 'REPEATED_TOOL')
  } finally { r.finish() }
})
test('cache is scoped to one request', async () => {
  const h = createHarness(); let count = 0
  for (let i = 0; i < 2; i++) { const r = h.begin('a'); await r.tool('search', {}, async () => ++count); r.finish() }
  assert.equal(count, 2)
})
test('total tool budget stops further execution', async () => {
  const r = createHarness({ maxToolCalls: 1 }).begin('a')
  try { await r.tool('a', {}, async () => true); assert.equal((await r.tool('b', {}, async () => true)).code, 'TOOL_BUDGET') } finally { r.finish() }
})
test('circuit breaker isolates repeated failures across requests and recovers', async () => {
  const h = createHarness({ circuitThreshold: 1, circuitCooldownMs: 10 })
  const r = h.begin('a')
  assert.equal((await r.tool('bad', {}, async () => { throw new Error('password=secret') })).code, 'TOOL_FAILED'); r.finish()
  const second = h.begin('b')
  try {
    assert.equal((await second.tool('bad', {}, async () => true)).code, 'CIRCUIT_OPEN')
    assert.equal(await second.tool('healthy', {}, async () => true), true)
    await sleep(15)
    assert.equal(await second.tool('bad', {}, async () => true), true)
  } finally { second.finish() }
})
test('oversized results are not forwarded or cached', async () => {
  const r = createHarness({ maxToolResultChars: 10 }).begin('a')
  try { assert.equal((await r.tool('a', {}, async () => 'x'.repeat(20))).code, 'TOOL_RESULT_LIMIT') } finally { r.finish() }
})
test('telemetry excludes prompt, arguments, result contents and exception details', async () => {
  const traces = [], r = createHarness({}, record => traces.push(record)).begin('private message')
  await r.tool('search', { token: 'private-token' }, async () => { throw new Error('private-password') }); r.finish()
  assert.ok(!JSON.stringify(traces).includes('private'))
  assert.ok(traces.every(x => typeof x.runId === 'string'))
})
test('broken telemetry cannot break business execution', async () => {
  const r = createHarness({}, () => { throw new Error('logger failure') }).begin('a')
  assert.equal(await r.tool('search', {}, async () => 1), 1); r.finish()
})
test('session lock prevents overlap, expiry and clearing of an active turn', () => {
  const store = new AgentSessions({ ttl: 10 }), unlock = store.acquire('a')
  store.set('a', { history: [1], lastActive: Date.now() - 100 })
  assert.deepEqual(store.get('a').history, [1])
  assert.throws(() => store.acquire('a'), failure('SESSION_BUSY'))
  assert.throws(() => store.clear('a'), failure('SESSION_BUSY'))
  unlock(); assert.equal(store.get('a'), undefined)
})
test('session storage capacity evicts oldest idle entry and rejects invalid ids', () => {
  const store = new AgentSessions({ maxSessions: 1 })
  store.set('a', { lastActive: Date.now() }); const unlock = store.acquire('b'); store.set('b', { lastActive: Date.now() }); unlock()
  assert.equal(store.get('a'), undefined); assert.equal(store.entries.size, 1)
  for (const id of [null, {}, '../bad', 'x'.repeat(129)]) assert.throws(() => store.acquire(id), failure('INVALID_SESSION'))
})
function runner(responses, harnessOptions = {}, executeTool = async () => ({ ok: true })) {
  const requests = [], events = []
  const client = { chat: { completions: { create: async req => {
    requests.push(req)
    const next = responses.shift()
    return (async function* () { if (next instanceof Error) throw next; for (const delta of next) yield { choices: [{ delta }] } })()
  } } } }
  return { run: createAgentRunner({ client, tools, executeTool, model: 'test', systemPrompt: 'system', harnessOptions }), requests, events }
}
const tool = (id, args = '{}') => [{ tool_calls: [{ index: 0, id, function: { name: 'search_venues', arguments: args } }] }]

test('graph repeated-query budget routes directly to tool-free summary', async () => {
  let count = 0
  const m = runner([tool('a'), tool('b'), [{ content: '总结' }]], { maxRepeatedCalls: 1 }, async () => { count++; return [] })
  const result = await m.run('query')
  assert.equal(result.reply, '总结'); assert.equal(count, 1); assert.equal(m.requests[2].tools, undefined)
})
for (const args of ['{"unexpected":1}', '{"min_capacity":-1}', '{"max_budget":-100}']) {
  test('graph rejects unsafe tool arguments '+args, async () => {
    let calls = 0
    const m = runner([tool('a', args), [{ content: '调整条件' }]], {}, async () => { calls++ })
    await m.run('query'); assert.equal(calls, 0)
  })
}
test('graph rejects output overflow without partial token/done delivery', async () => {
  const m = runner([[{ content: 'too much output' }]], { maxOutputChars: 5 })
  await assert.rejects(m.run('x', [], e => m.events.push(e)), failure('OUTPUT_LIMIT'))
  assert.equal(m.events.length, 0)
})
test('graph rejects empty response without claiming success', async () => {
  const m = runner([[]])
  await assert.rejects(m.run('x'), failure('EMPTY_RESPONSE'))
})
test('graph rejects duplicate tool call ids before tool execution', async () => {
  const m = runner([[{ tool_calls: [0, 1].map(index => ({ index, id: 'same', function: { name: 'search_venues', arguments: '{}' } })) }]])
  await assert.rejects(m.run('x'), failure('INVALID_TOOL_CALL'))
})
test('graph rejects oversized context before provider request', async () => {
  const m = runner([], { maxContextChars: 30 })
  await assert.rejects(m.run('hello'), failure('CONTEXT_LIMIT')); assert.equal(m.requests.length, 0)
})
test('graph cancellation never emits done', async () => {
  const c = new AbortController(); c.abort()
  const m = runner([])
  await assert.rejects(m.run('x', [], e => m.events.push(e), { signal: c.signal }), failure('CANCELLED'))
  assert.equal(m.events.length, 0)
})

test('a cancelled graph cannot deliver late stream data or invoke tools', async () => {
  const controller = new AbortController(), events = []
  let release, providerSignal, executed = 0
  const client = { chat: { completions: { create: async (_, opts) => {
    providerSignal = opts.signal
    return (async function* () {
      await new Promise(resolve => { release = resolve })
      yield { choices: [{ delta: { content: 'late' } }] }
    })()
  } } } }
  const run = createAgentRunner({ client, tools, executeTool: async () => { executed++ }, model: 'test', systemPrompt: 'system' })
  const pending = run('x', [], e => events.push(e), { signal: controller.signal })
  while (!release) await sleep(1)
  controller.abort()
  await assert.rejects(pending, failure('CANCELLED'))
  assert.ok(providerSignal.aborted)
  release(); await sleep(5)
  assert.equal(events.length, 0); assert.equal(executed, 0)
})
test('provider length truncation does not reach the frontend as a complete answer', async () => {
  const client = { chat: { completions: { create: async () => (async function* () {
    yield { choices: [{ delta: { content: '[TABLE]unfinished' }, finish_reason: 'length' }] }
  })() } } }
  const run = createAgentRunner({ client, tools, executeTool: async () => null, model: 'test', systemPrompt: 'system' })
  const events = []
  await assert.rejects(run('x', [], e => events.push(e)), failure('OUTPUT_LIMIT'))
  assert.equal(events.length, 0)
})
test('provider exceeding per-round tool cap fails before executing any tool', async () => {
  const m = runner([[{ tool_calls: [0, 1].map(index => ({ index, id: 'id'+index, function: { name: 'search_venues', arguments: '{}' } })) }]], { maxCallsPerRound: 1 })
  await assert.rejects(m.run('x'), failure('TOOL_CALL_LIMIT'))
})
