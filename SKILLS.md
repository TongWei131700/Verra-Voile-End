# 项目技能目录

技能唯一来源为 `.agents/skills/<技能名>/SKILL.md`，`.qoder/skills` 是指向同一目录的兼容链接。新技能不再放入 `mySkills`，也不安装到全局。

布局参考 [OpenAI 官方说明](https://developers.openai.com/blog/skills-agents-sdk)。

| 技能 | 入口 |
| --- | --- |
| backend-db-troubleshooting | [SKILL.md](.agents/skills/backend-db-troubleshooting/SKILL.md) |
| crawl-bbr-wine | [SKILL.md](.agents/skills/crawl-bbr-wine/SKILL.md) |
| crawl-destination | [SKILL.md](.agents/skills/crawl-destination/SKILL.md) |
| crawl-dress-product | [SKILL.md](.agents/skills/crawl-dress-product/SKILL.md) |
| crawl-flower-products | [SKILL.md](.agents/skills/crawl-flower-products/SKILL.md) |
| crawl-junebug-photographer | [SKILL.md](.agents/skills/crawl-junebug-photographer/SKILL.md) |
| crawl-venue-product | [SKILL.md](.agents/skills/crawl-venue-product/SKILL.md) |
| crawl-wedding-team | [SKILL.md](.agents/skills/crawl-wedding-team/SKILL.md) |
| crawl-wedding-venues | [SKILL.md](.agents/skills/crawl-wedding-venues/SKILL.md) |
| database-safety | [SKILL.md](.agents/skills/database-safety/SKILL.md) |
| deploy-backend | [SKILL.md](.agents/skills/deploy-backend/SKILL.md) |
| setup-https | [SKILL.md](.agents/skills/setup-https/SKILL.md) |
| travel-photo-attraction | [SKILL.md](.agents/skills/travel-photo-attraction/SKILL.md) |
| websocket-troubleshooting | [SKILL.md](.agents/skills/websocket-troubleshooting/SKILL.md) |
| wedding-site-crawler | [SKILL.md](.agents/skills/wedding-site-crawler/SKILL.md) |

## 项目归属

- 前端页面及 SSG 部署：`../Verra-Voile/.agents/skills/`。
- 后端、数据采集、数据库及服务器：`../Verra-Voile-End/.agents/skills/`。
- 小红书全部技能：`../Xiaohongshu-Studio/.agents/skills/`，原项目不保留技能入口。

## 迁移记录

- 完整备份：`/private/tmp/verra-skills-20261023-222837/before.tar.gz`，仅本机保存。
- 重复的前端 deploy-backend 从活动目录移除，以后端版本为准；旧版保存在备份中。
- 补齐缺失的技能元数据，修正小红书迁移路径；没有重写原工作流程。
- 部署说明仍含历史配置，执行时需核对实际环境。本次未部署或操作数据库。
