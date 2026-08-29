/**
 * 创建 agent_conversations 表
 * 存储 AI 助手的用户对话记录
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const mysql = require('mysql2/promise')

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'verra_voile',
  })

  console.log('正在创建 agent_conversations 表...')

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS agent_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(64) NOT NULL,
      user_token VARCHAR(64) NOT NULL DEFAULT 'anonymous',
      user_message TEXT NOT NULL,
      ai_reply TEXT NOT NULL,
      thinking_steps JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id),
      INDEX idx_user (user_token),
      INDEX idx_time (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  console.log('✓ agent_conversations 表创建成功')
  await conn.end()
}

main().catch(err => {
  console.error('创建失败:', err.message)
  process.exit(1)
})
