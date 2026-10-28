/** Shared process-local session coordination for REST and WebSocket. */
const { AgentError } = require('./harness')
class AgentSessions {
  constructor({ ttl = 30 * 60 * 1000, maxSessions = 1000 } = {}) {
    this.ttl = ttl; this.maxSessions = maxSessions; this.entries = new Map(); this.locks = new Set()
  }
  validate(id) {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new AgentError('INVALID_SESSION', '会话编号无效', 400)
  }
  prune() {
    for (const [id, value] of this.entries) if (Date.now() - value.lastActive > this.ttl && !this.locks.has(id)) this.entries.delete(id)
  }
  acquire(id) {
    this.validate(id); this.prune()
    if (this.locks.has(id)) throw new AgentError('SESSION_BUSY', '当前会话正在处理上一条消息', 409)
    if (this.locks.size >= 32) throw new AgentError('BUSY', 'AI 正忙，请稍后重试', 429)
    if (!this.entries.has(id) && this.entries.size >= this.maxSessions) {
      const oldest = [...this.entries.keys()].find(key => !this.locks.has(key))
      if (!oldest) throw new AgentError('BUSY', '会话繁忙，请稍后重试', 429)
      this.entries.delete(oldest)
    }
    this.locks.add(id)
    return () => this.locks.delete(id)
  }
  get(id) { this.prune(); return this.entries.get(id) }
  set(id, value) {
    this.entries.delete(id)
    if (this.entries.size >= this.maxSessions) {
      const oldest = [...this.entries.keys()].find(key => !this.locks.has(key))
      if (!oldest) throw new AgentError('BUSY', '会话繁忙，请稍后重试', 429)
      this.entries.delete(oldest)
    }
    this.entries.set(id, value)
  }
  clear(id) {
    this.validate(id)
    if (this.locks.has(id)) throw new AgentError('SESSION_BUSY', '请先等待或取消当前请求', 409)
    this.entries.delete(id)
  }
}
const sessions = new AgentSessions()
module.exports = { sessions, AgentSessions }
