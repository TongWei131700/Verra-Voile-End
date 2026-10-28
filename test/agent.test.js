const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createAgentRunner, trimHistory } = require('../src/agent/graph')
const tools = require('../src/agent/tools')
function mock(responses, executeTool = async () => ({ ok: true }), maxToolRounds = 8) {
  const requests = [], events = []
  const client = { chat: { completions: { create: async request => {
    requests.push(structuredClone(request))
    const response = responses.shift()
    if (response instanceof Error) throw response
    assert.ok(response, 'Unexpected model invocation')
    return (async function* () {
      for (const delta of response) yield { choices: [{ delta }] }
    })()
  } } } }
  return { run: createAgentRunner({ client, model: 'test', systemPrompt: 'test prompt', tools, executeTool, maxToolRounds }), requests, events }
}
function call(name, args, id = 'call_1') {
  return [{ content: '查询中', tool_calls: [{ index: 0, id, function: { name, arguments: JSON.stringify(args) } }] }]
}
const reply = text => [{ content: text }]

test('plain response preserves public reply/history and done/token events', async () => {
  const m = mock([reply('你好')])
  const result = await m.run('你好', [], e => m.events.push(e))
  assert.equal(result.reply, '你好')
  assert.deepEqual(result.history.map(x => x.role), ['user', 'assistant'])
  assert.equal(m.events.filter(x => x.type === 'token').map(x => x.content).join(''), '你好')
  assert.deepEqual(m.events.at(-1), { type: 'done', ...result })
})
test('fragmented tool arguments and multiple tool calls remain paired', async () => {
  const executed = []
  const m = mock([[
    { tool_calls: [{ index: 0, id: 'a', function: { name: 'calculate_budget', arguments: '{"total_' } }] },
    { tool_calls: [{ index: 1, id: 'b', function: { name: 'search_venues', arguments: '{"country":"italy"}' } }, { index: 0, function: { arguments: 'budget":50000}' } }] },
  ], reply('已找到')], async (name, args) => { executed.push([name, args]); return { ok: true } })
  await m.run('查询')
  assert.equal(executed.length, 2)
  assert.equal(executed[0][1].total_budget, 50000)
  assert.deepEqual(m.requests[1].messages.filter(x => x.role === 'tool').map(x => x.tool_call_id), ['a', 'b'])
})
test('TABLE marker split across chunks produces one table event', async () => {
  const m = mock([[{ content: '推荐[TA' }, { content: 'BLE]A | B' }, { content: '[/TABLE]结束' }]])
  const result = await m.run('方案', [], e => m.events.push(e))
  assert.equal(result.reply, '推荐[TABLE]A | B[/TABLE]结束')
  assert.equal(m.events.filter(e => e.type === 'token').map(e => e.content).join(''), '推荐[TABLE_1]结束')
  assert.deepEqual(m.events.find(e => e.type === 'table_data'), { type: 'table_data', index: 1, content: 'A | B' })
})
test('plan summary remains a structured frontend event', async () => {
  const items = [{ category: 'venue', category_cn: '场地', name: '场地A', description: '推荐', price_range: '€5000' }]
  const m = mock([call('generate_plan_summary', { items }), reply('方案')], async () => ({ _type: 'plan_summary', items }))
  await m.run('汇总', [], e => m.events.push(e))
  assert.deepEqual(m.events.find(e => e.type === 'plan_summary').items, items)
})
for (const [name, args] of [['calculate_budget', { total_budget: 'abc' }], ['calculate_budget', {}], ['unknown_tool', {}], ['generate_plan_summary', { items: [{}] }]]) {
  test(`invalid ${name} parameters never execute business tools: ${JSON.stringify(args)}`, async () => {
    let executed = false
    const m = mock([call(name, args), reply('请补充信息')], async () => { executed = true })
    await m.run('预算')
    assert.equal(executed, false)
    assert.ok(JSON.parse(m.requests[1].messages.at(-1).content).error)
  })
}
test('malformed JSON is returned as a recoverable tool result', async () => {
  const m = mock([[{ tool_calls: [{ index: 0, id: 'a', function: { name: 'search_venues', arguments: '{bad' } }] }], reply('请重试')])
  assert.equal((await m.run('查询')).reply, '请重试')
})
test('tool failures do not expose database details and model can recover', async () => {
  const m = mock([call('search_venues', {}), reply('暂时无法查询')], async () => { throw new Error('secret db host') })
  await m.run('查询')
  const result = m.requests[1].messages.at(-1).content
  assert.ok(JSON.parse(result).error)
  assert.ok(!result.includes('secret'))
})
test('tool round limit forces a final model call without tools', async () => {
  const m = mock([call('search_venues', {}, 'a'), call('search_venues', {}, 'b'), reply('总结')], undefined, 2)
  assert.equal((await m.run('查询')).reply, '总结')
  assert.equal(m.requests.length, 3)
  assert.ok(!('tools' in m.requests[2]))
  assert.deepEqual(m.requests[2].messages.filter(x => x.role === 'tool').map(x => x.tool_call_id), ['a', 'b'])
})
test('model error rejects without emitting a misleading done event', async () => {
  const m = mock([new Error('provider unavailable')])
  await assert.rejects(m.run('你好', [], e => m.events.push(e)), /provider unavailable/)
  assert.equal(m.events.length, 0)
})
test('history trimming never keeps orphaned tool messages or a system prompt', () => {
  const old = [{ role: 'system', content: 'untrusted' }, { role: 'user', content: 'a' }, { role: 'assistant', tool_calls: [{ id: 'x' }] }, { role: 'tool', tool_call_id: 'x' }, { role: 'assistant', content: 'a' }, { role: 'user', content: 'b' }, { role: 'assistant', content: 'b' }]
  assert.deepEqual(trimHistory(old, 4), old.slice(-2))
})
test('concurrent graph runs do not share messages or callbacks', async () => {
  const client = { chat: { completions: { create: async ({ messages }) => (async function* () { yield { choices: [{ delta: { content: messages.at(-1).content } }] } })() } } }
  const run = createAgentRunner({ client, model: 'test', systemPrompt: 'test', tools, executeTool: async () => ({}) })
  const firstEvents = [], secondEvents = []
  const [a, b] = await Promise.all([run('A', [], e => firstEvents.push(e)), run('B', [], e => secondEvents.push(e))])
  assert.equal(a.reply, 'A'); assert.equal(b.reply, 'B')
  assert.equal(firstEvents.at(-1).reply, 'A'); assert.equal(secondEvents.at(-1).reply, 'B')
})
