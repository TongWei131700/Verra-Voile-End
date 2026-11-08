const test = require('node:test')
const assert = require('node:assert/strict')
const { createConsultResponder } = require('../src/agent/consult')

const venue = {
  category: '目的地', slug: 'chateau-de-la-pascalette', name: 'Château de la Pascalette',
  translated: '拉斯卡莱特城堡', country: '法国', city: '拉隆德莱莫尔',
  address: 'Route Départementale 559, 83250', price: 3000, unit: '€', capacity: '80–120 人',
}
const photographer = {
  category: '摄影', slug: 'margot', name: 'Margot', translated: '玛戈',
  price: 250, unit: '€', country: '法国',
}
const user = content => ({ sender_type: 'user', content })
const admin = content => ({ sender_type: 'admin', content })

function setup({ history = [], catalog = [venue, photographer], modelReply = '可以先从地点和宾客人数开始。' } = {}) {
  const calls = []
  const pool = {
    async execute(sql, params) {
      if (sql.includes('FROM messages')) return [history]
      return [catalog.filter(row => params.includes(row.category) &&
        [row.slug, row.name, row.translated].some(name => name && params.includes(name)))]
    },
  }
  const reply = createConsultResponder({ pool, async runAgent(...args) {
    calls.push(args)
    return { reply: modelReply }
  } })
  return {
    calls,
    ask: (content, product, signal = new AbortController().signal) => reply(1, { id: 20, content }, product, signal),
  }
}

test('venue name and follow-up resolve even when the name had no reply', async () => {
  const { ask, calls } = setup({ history: [user('拉斯卡莱特城堡')] })
  assert.match(await ask('你好，这个城堡在哪'), /法国 · 拉隆德莱莫尔.*Route Départementale 559/)
  assert.equal(calls.length, 0)
})

test('look back across factual follow-ups and resolve linked products', async () => {
  const { ask } = setup({ history: [user('价格是多少'), user('拉斯卡莱特城堡')] })
  assert.match(await ask('最多能容纳多少人？'), /80–120 人/)
  assert.match(await ask('https://europewedding.cn/destinations/chateau-de-la-pascalette的地址'), /Route Départementale/)
})

test('exact names supersede the product card and references use verified catalog price', async () => {
  const { ask } = setup()
  const product = { type: '摄影', slug: 'margot', name: '玛戈', price: 1 }
  assert.match(await ask('价格是多少', product), /玛戈.*€250 起/)
  assert.match(await ask('拉斯卡莱特城堡多少钱', product), /拉斯卡莱特城堡.*€3,000 起/)
})

test('unknown or ambiguous named items get a clarification without recommendations', async () => {
  const { ask, calls } = setup({ catalog: [venue, { ...venue, slug: 'other' }] })
  assert.match(await ask('拉斯卡莱特城堡在哪'), /多个同名/)
  assert.match(await ask('不存在城堡在哪'), /详情页链接/)
  assert.equal(calls.length, 0)
})

test('identity, human handoff and availability avoid model claims', async () => {
  const { ask, calls } = setup()
  assert.match(await ask('你是婚礼策划吗'), /AI 婚礼规划助手/)
  assert.match(await ask('转人工'), /人工顾问可以在这个咨询窗口回复/)
  assert.match(await ask('这个城堡有档期吗', { type: '目的地', slug: venue.slug }), /人工顾问确认/)
  assert.equal(calls.length, 0)
})

test('missing price is explicit and broad budget questions still reach the agent', async () => {
  const { ask, calls } = setup({ catalog: [{ ...venue, price: null }] })
  assert.match(await ask('拉斯卡莱特城堡多少钱'), /暂未列出/)
  assert.match(await ask('法国婚礼多少钱'), /宾客人数/)
  assert.equal(calls.length, 1)
})

test('open-ended advice keeps completed turns and uses the consultation prompt', async () => {
  const { ask, calls } = setup({
    history: [user('我想去法国'), admin('页面参考价为 €250 起'), user('价格是多少')],
    modelReply: '**建议**先看[婚礼场地](/destinations)。',
  })
  assert.equal(await ask('如何安排户外仪式'), '建议先看婚礼场地。')
  const [message, history, , options] = calls[0]
  assert.match(message, /客户当前问题：如何安排户外仪式/)
  assert.deepEqual(history.map(entry => entry.content), ['价格是多少', '页面参考价为 €250 起'])
  assert.match(options.systemPromptOverride, /禁止 Markdown 表格/)
  assert.ok(!options.allowedTools.includes('generate_plan_summary'))
})

test('suppresses table markup and propagates provider errors for UI feedback', async () => {
  const { ask } = setup({ modelReply: '| 名称 | 价格 |\n|---|---|\n| 示例 | €250 |' })
  assert.match(await ask('推荐摄影师'), /你想先看/)
  const reply = createConsultResponder({ pool: { execute: async () => [[]] }, runAgent: async () => { throw Error('provider unavailable') } })
  await assert.rejects(reply(1, { id: 20, content: '推荐摄影师' }, null, new AbortController().signal), /provider unavailable/)
})

test('does not treat accommodation capacity as banquet capacity', async () => {
  const { ask } = setup({ catalog: [{ ...venue, capacity: '60 couchages' }] })
  const answer = await ask('拉斯卡莱特城堡最多能容纳多少人')
  assert.match(answer, /60 个住宿床位/)
  assert.match(answer, /宴会.*顾问.*确认/)
})

test('a superseded consult never starts a model request', async () => {
  const { ask, calls } = setup()
  await assert.rejects(ask('推荐法国婚礼场地', null, AbortSignal.abort()), { name: 'AbortError' })
  assert.equal(calls.length, 0)
})
