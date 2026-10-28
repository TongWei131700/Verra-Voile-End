const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { trimHistory } = require('../src/agent/graph')
const { sessions } = require('../src/agent/sessions')
let behavior, received = [], mailCount = 0
const stub = (name, exports) => { const id = require.resolve(name); require.cache[id] = { id, filename: id, loaded: true, exports } }
stub('../src/agent', { trimHistory, runAgent: async (...args) => { received.push(args); return behavior(...args) } })
stub('../src/db', { pool: { execute: async () => [[{ cnt: 2 }]] } })
stub('../src/routes/mailer', { sendMail: async () => { mailCount++ } })
const router = require('../src/routes/agent')
const { initAgentSocket } = require('../src/agent-socket')
const chat = router.stack.find(x => x.route?.path === '/chat').route.stack[0].handle
const clear = router.stack.find(x => x.route?.path === '/clear').route.stack[0].handle
function res() { const r = new EventEmitter(); r.statusCode = 200; r.status = n => { r.statusCode = n; return r }; r.json = v => { r.body = v; r.writableEnded = true; r.headersSent = true; return r }; return r }
function socket() {
  const handlers = {}, events = [], s = { data: {}, connected: true, handshake: { auth: { userToken: 'test-user' } }, on: (name, fn) => { handlers[name] = fn }, emit: (name, value) => events.push([name, value]) }
  initAgentSocket({ of: () => ({ on: (_, connect) => connect(s) }) })
  return { s, handlers, events }
}
function reset() {
  sessions.entries.clear(); sessions.locks.clear(); received = []; mailCount = 0
  behavior = async (message, history, emit) => { emit({ type: 'thinking', label: '查询', tool: 'search_venues', args: {} }); emit({ type: 'token', content: '回答' }); emit({ type: 'done', reply: '回答' }); return { reply: '回答', history: [...history, { role: 'user', content: message }, { role: 'assistant', content: '回答' }] } }
}
test('REST validates types and session ids without calling model', async () => {
  reset()
  for (const body of [{ message: {} }, { message: 'x'.repeat(8001) }, { message: 'x', sessionId: {} }]) {
    const r = res(); await chat({ body }, r); assert.equal(r.statusCode, 400)
  }
  assert.equal(received.length, 0)
})
test('REST response retains reply/session and collects only thinking events', async () => {
  reset(); const r = res(); await chat({ body: { message: 'x', sessionId: 'http' } }, r)
  assert.equal(r.body.reply, '回答'); assert.equal(r.body.thinking, '查询'); assert.equal(r.body.thinkingSteps.length, 1)
})
test('REST and Socket.IO share the same completed session context', async () => {
  reset(); await chat({ body: { message: 'first', sessionId: 'shared' } }, res())
  const s = socket(); await s.handlers.chat({ message: 'second', sessionId: 'shared' })
  assert.equal(received[1][1][0].content, 'first'); assert.equal(sessions.get('shared').history.length, 4)
  assert.equal(mailCount, 0)
})
test('overlapping turns and clear return 409 without overwriting history', async () => {
  reset(); let resolve
  behavior = async () => new Promise(r => { resolve = r })
  const first = chat({ body: { message: 'x', sessionId: 'busy' } }, res())
  const second = res(); await chat({ body: { message: 'y', sessionId: 'busy' } }, second)
  assert.equal(second.statusCode, 409)
  const clearing = res(); clear({ body: { sessionId: 'busy' } }, clearing); assert.equal(clearing.statusCode, 409)
  resolve({ reply: 'a', history: [{ role: 'user', content: 'x' }] }); await first
  assert.equal(sessions.locks.size, 0); assert.equal(received.length, 1)
})
test('HTTP connection close aborts and late response cannot update session', async () => {
  reset(); let resolve
  behavior = async () => new Promise(r => { resolve = r })
  const response = res(), pending = chat({ body: { message: 'x', sessionId: 'abort' } }, response)
  response.emit('close'); assert.ok(received[0][3].signal.aborted)
  resolve({ reply: 'late', history: [] }); await pending
  assert.equal(sessions.get('abort'), undefined); assert.equal(response.body, undefined); assert.equal(sessions.locks.size, 0)
})
test('socket disconnect aborts and suppresses late events and state writes', async () => {
  reset(); let resolve, emit
  behavior = async (m, h, e) => { emit = e; return new Promise(r => { resolve = r }) }
  const s = socket(), pending = s.handlers.chat({ message: 'x', sessionId: 'wsabort' })
  s.s.connected = false; s.handlers.disconnect(); emit({ type: 'done', reply: 'late' })
  assert.ok(received[0][3].signal.aborted)
  resolve({ reply: 'late', history: [] }); await pending
  assert.equal(s.events.length, 0); assert.equal(sessions.get('wsabort'), undefined); assert.equal(sessions.locks.size, 0)
})
test('second message on a busy socket does not emit an error that terminates the first reply', async () => {
  reset(); let resolve
  behavior = async () => new Promise(r => { resolve = r })
  const s = socket(), pending = s.handlers.chat({ message: 'x', sessionId: 'wsbusy' })
  await s.handlers.chat({ message: 'y' }); assert.equal(s.events[0][0], 'agent_busy'); assert.equal(received.length, 1)
  resolve({ reply: 'ok', history: [] }); await pending
  assert.equal(s.s.data.agentController, null)
})


test('socket echoes requestId on response events and session without replacing it', async () => {
  reset(); const s = socket()
  await s.handlers.chat({ message: 'flowers', sessionId: 'tagged', requestId: 'request-three' })
  const events = s.events.filter(([name]) => name === 'agent_event' || name === 'agent_session')
  assert.ok(events.length >= 3)
  assert.ok(events.every(([, data]) => data.requestId === 'request-three'))
})
