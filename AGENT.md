# 婚礼 Agent：LangGraph 与运行 Harness

Node.js 20+。公共接口为 `runAgent(message, history, onEvent, { signal } = {})`。通义千问及现有 9 个业务工具保持不变。`DASHSCOPE_API_KEY` 是原有的模型凭据；本次没有引入额外外部服务。

## 代码入口

- `src/agent/graph.js`：LangGraph 节点、状态、条件路由、工具 Schema 和前端事件适配。
- `src/agent/harness.js`：有界执行、超时、取消、模型重试、工具缓存与熔断、并发限额和运行日志。
- `src/agent/sessions.js`：REST/Socket.IO 共用的内存会话与执行锁。
- `src/agent/index.js`：生产模型客户端与日志接入。
- `src/agent/tools.js` / `tool-executor.js`：原有工具定义与实现。

执行路径：`START → model → tools → model`；没有工具调用时进入 `answer → END`。达到工具轮数、总调用或重复查询限额时进入不携带工具的 `summarize → answer → END`。

## 默认运行限额

| 项目 | 默认值 |
| --- | --- |
| 单次请求总时限 | 120 秒 |
| 单次模型请求（包括读取响应流） | 45 秒 |
| 单工具调用时限 | 20 秒 |
| 模型瞬时错误重试 | 最多 2 次，指数退避 |
| 并发 Agent / 模型请求 | 各最多 8 个 |
| 仍在运行的底层工具任务 | 最多 8 个 |
| 工具轮数 / 每轮工具数 / 总调用数 | 8 / 8 / 24 |
| 同名同参工具查询 | 最多 3 次，成功结果在本次请求内复用 |
| 用户输入 / 上下文序列化长度 | 8,000 / 64,000 字符 |
| 模型回复 / 工具参数 / 工具结果长度 | 32,000 / 16,000 / 16,000 字符 |
| 单模型输出 token 限额 | 4,096 |
| 工具熔断 | 连续失败 3 次，暂停 30 秒 |
| 会话数量 / 会话锁数量 | 1,000 / 32 |
| 会话过期 | 30 分钟，不淘汰正在处理的会话 |

可通过 `createAgentRunner({ harnessOptions: {...} })` 调整默认值，支持的参数见 `harness.js` 的 DEFAULTS。长度限额不是精确 token 统计，也不是货币费用限额。

## 失败与恢复策略

- 仅重试模型的连接错误、429、服务端错误和模型超时。鉴权失败、无效工具调用、回复过长等确定性错误不重试，避免无效消耗。
- 业务工具不会被后台自动重试。工具失败以通用结果返回模型，允许其调整查询或说明无法获取数据，不暴露原始数据库异常。
- 只执行声明过的工具，拒绝额外参数、负价格、无效人数、过长参数及重复工具 ID。
- 工具结果超限时返回受控错误，避免直接截断 JSON 后导致模型误读。
- 对空回复、token 上限截断、输出超长和上下文超限均返回明确错误，不发送误导性的成功事件。
- 同一会话不并发执行两轮，冲突返回 SESSION_BUSY。HTTP 返回 409；同一忙碌 socket 再次提交则发出独立的 agent_busy，不打断正在生成的回复。
- HTTP 连接关闭、Socket.IO 断开或收到 cancel 事件时取消请求。取消后不推送迟到结果，也不更新会话。
- 发送给模型的调用支持 AbortSignal。但现有 MySQL 工具可能忽略取消，超时不等于数据库查询被终止。底层任务真正结束前仍占用工具限额。同样限制忽略取消的模型调用，防止超时任务无限堆积。

## 协议与可观测性

保留 `thinking`、`token`、`table_data`、`plan_summary`、`done` 和 `{reply, history}`。沿用 `[TABLE]` 转 `[TABLE_n]` 协议。模型回复先缓存后推送，避免工具规划文字及不完整表格流入最终回复。此次未改为实时 token 直通。

模型异常、超时或运行错误由 HTTP / WebSocket 外层发送错误结果。Socket.IO 会话编号在审计写库前返回，审计延迟不再持有执行锁。原有审计与通知逻辑保留；测试用替身验证，不发送邮件。

生产日志标记为 `[AgentHarness]`，含 runId、事件、耗时、工具名称、输出长度和错误代码。日志不记录输入、工具参数、工具结果原文或异常中的数据库凭据。每个 runId 可串联模型重试、工具开始/结束、缓存命中和最终结果。支持注入 onTrace；日志回调异常不会中断业务。

## 状态范围与边界

REST 与 WebSocket 在同一个 Node 进程中共用会话与锁，历史按完整用户轮次裁剪到最近 20 条范围，避免拆散工具调用及结果。

本次没有加入数据库检查点、跨进程锁、跨重启恢复或多实例协调。多进程部署前应换用共享状态和分布式限流。会话 ID 为不可预测的 UUID；会话认证/授权仍沿用现有应用机制，本次没有将前端传来的 userToken 改造成经过认证的用户身份。现有 agent_conversations 是业务审计记录，不等同于 LangGraph 检查点。

## 验证

`npm run test:agent` 运行无外网、无真实模型费用、无数据库写入和邮件的自动化测试。覆盖 LangGraph 工具流、表格和方案摘要，以及超时、取消、错误分类重试、缓存、预算、熔断、资源槽、输入输出、日志脱敏、REST/Socket.IO 上下文共享和并发控制。

参考：[LangGraph Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api)、[持久化说明](https://docs.langchain.com/oss/javascript/langgraph/persistence)。
