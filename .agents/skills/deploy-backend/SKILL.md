---
name: deploy-backend
description: 将后端代码打包部署到远程服务器，包括上传代码、安装依赖、配置环境变量、PM2启动服务。当用户说"部署后端"、"发布服务端代码"、"deploy backend"时触发。
---

# 部署后端服务

## ⚠️⚠️⚠️ 部署前必读：Git 分支操作

**每次部署前后都必须执行 Git 分支操作，绝对不能忘记！**

部署流程中的 Git 步骤：
1. **部署前**：确认当前分支，确保所有改动已提交
2. **部署后**：提交改动 → 合并到 main → 创建下一版本分支

> 忘记做 Git 操作会导致代码版本混乱，下次部署时找不到正确的改动记录。

---

## 服务器信息

- **IP**: `47.99.138.250`
- **SSH用户**: `admin`（root 已禁止远程登录）
- **SSH认证**: **仅密钥认证**（服务器已禁用密码登录）。连接后需 `su -` 切换到 root 执行操作
- **SSH连接方式**: `ssh admin@47.99.138.250`，然后 `su -` 获取 root 权限
- **部署路径**: `/var/www/verra-voile-end`
- **服务端口**: `3000`（仅监听 127.0.0.1，外网不可直接访问，通过 Nginx 反代）
- **PM2进程名**: `verra-voile-api`

### 安全配置（2026-09-02 加固后）

- `PermitRootLogin no` — 禁止 root 直接 SSH
- `PasswordAuthentication no` — 仅允许密钥认证
- `MaxAuthTries 3` — 单次连接最多 3 次尝试
- `fail2ban` — SSH 3 次失败封 IP 24 小时
- `UFW 防火墙` — 仅开放 22/80/443 端口
- Node.js 绑定 `127.0.0.1` — 3000 端口不暴露到外网

### 服务器 SSH 受限时的备选方案

如果本机没有 admin 用户的 SSH 密钥导致无法连接，需通过**阿里云控制台 VNC** 登录服务器操作。

## 数据库配置

- **DB_HOST**: `127.0.0.1`
- **DB_PORT**: `3306`
- **DB_USER**: `root`
- **DB_PASSWORD**: （空，服务器 MySQL root 使用 mysql_native_password 无密码认证）
- **DB_NAME**: `verra_voile`

## 部署步骤

### 1. 确认部署

使用 `AskUserQuestion` 告知用户即将部署，确认继续。

### 2. 本地打包

排除 `node_modules`、`.git`、`uploads`、`.env` 目录（不要覆盖服务器环境配置）：

```bash
cd /Users/hongli/WorkSpace/Verra-Voile-End
tar --exclude='node_modules' --exclude='.git' --exclude='uploads' --exclude='.env' -czf /tmp/verra-voile-end.tar.gz -C . .
```

### 3. 上传到服务器

使用密钥认证直接上传（无需 expect）：

```bash
scp -o StrictHostKeyChecking=no /tmp/verra-voile-end.tar.gz admin@47.99.138.250:/tmp/
```

> 如果本机没有 admin 的 SSH 密钥，需先通过 VNC 将本机公钥添加到 `/home/admin/.ssh/authorized_keys`，或使用 VNC 手动执行后续步骤。

### 4. 服务器解压并安装依赖

```bash
ssh admin@47.99.138.250 "sudo bash -c 'cd /var/www/verra-voile-end && rm -rf src package.json package-lock.json && tar -xzf /tmp/verra-voile-end.tar.gz && npm install --production 2>&1 | tail -5 && echo DEPLOY_OK'"
```

### 5. 停止服务并释放端口

**必须先杀端口再重启**，否则旧进程占用端口 3000 会导致 EADDRINUSE 错误，服务陷入崩溃循环：

```bash
ssh admin@47.99.138.250 "sudo bash -c 'pm2 stop verra-voile-api && sleep 1 && fuser -k 3000/tcp 2>/dev/null; sleep 2 && echo PORT_CLEARED'"
```

### 6. 启动服务

端口释放后再启动，避免端口冲突：

```bash
ssh admin@47.99.138.250 "sudo bash -c 'pm2 restart verra-voile-api && sleep 3 && curl -s http://localhost:3000/health'"
```

### 7. 同步本地数据库到服务器（⚠️ 必选步骤，绝不可跳过！）

**数据库同步是每次部署的强制步骤，无论用户是否提及都必须执行！**

将本地 `verra_voile` 数据库的**全量业务表**导出并导入服务器，确保线上数据与本地一致。

**核心原则：使用动态查询获取表名，禁止硬编码！**

不同步的表（服务器产生的用户数据）：`users`, `reservations`, `verification_codes`, `messages`, `user_selected_products`, `snapshot_*`, `test_*`

```bash
# 1. 动态查询所有需要同步的表名（排除用户数据表）
TABLES=$(mysql -u root verra_voile -N -B -e "
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema='verra_voile' 
  AND table_name NOT IN ('users','reservations','verification_codes','messages','user_selected_products')
  AND table_name NOT LIKE 'snapshot_%'
  AND table_name NOT LIKE 'test_%'
  ORDER BY table_name;
" | tr '\n' ' ')
echo "同步表: $TABLES"

# 2. 本地导出
mysqldump -u root verra_voile $TABLES --skip-lock-tables > /tmp/full_business_tables.sql

# 3. 上传 SQL 到服务器
scp /tmp/full_business_tables.sql admin@47.99.138.250:/tmp/

# 4. 服务器导入（MySQL root 无密码）
ssh admin@47.99.138.250 "sudo bash -c 'mysql -u root verra_voile < /tmp/full_business_tables.sql && echo DB_SYNC_OK'"
```

**验证**：导入后对比关键表数量，如 `SELECT COUNT(*) FROM crawled_venues`，确保本地与服务器一致。

> **注意**：此步骤会全量覆盖业务表。用户数据（订单、注册等）不受影响。

### 8. 验证部署

健康检查 + 数据库验证（通过域名访问，3000 端口已不对外）：

```bash
# API 健康检查（通过域名）
curl -s https://www.europewedding.cn/api/products/crawled-venues | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'场地: {len(d.get(\"data\",[]))} 条')"
```

确认返回 200 且数据条数与本地一致。

### 9. Git 版本控制（⚠️ 必须执行，不可跳过！）

**这是部署流程的必要组成部分，不是可选步骤！** 每次部署后都必须执行以下 Git 操作：

部署成功后，将所有改动（包括部署过程中产生的新文件）提交并切换新分支：

```bash
cd /Users/hongli/WorkSpace/Verra-Voile-End

# 1. 提交所有改动
git add -A
git commit -m "feat: 部署更新"

# 2. 合并到 main
git checkout main
git merge <当前分支> --no-edit
git push origin main

# 3. 版本号递增（根据当前分支号 +1）
# 例如当前 daily/0.0.3 → 下一版本 daily/0.0.4
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
CURRENT_VERSION=$(echo "$CURRENT_BRANCH" | sed 's/daily\///')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
NEXT_BRANCH="daily/${MAJOR}.${MINOR}.$((PATCH + 1))"

# 4. 创建并切换到下一版本分支
git checkout -b $NEXT_BRANCH
git push origin $NEXT_BRANCH
```

**分支命名规范**: `daily/x.y.z`（不使用 be/ 或 fe/ 前缀）

## 首次部署（无PM2进程时）

如果 PM2 中没有 `verra-voile-api` 进程，改用以下命令启动：

```bash
cd /var/www/verra-voile-end && pm2 start src/index.js --name verra-voile-api && pm2 save
```

## Nginx 反向代理（已配置）

服务器 Nginx 已配置好以下代理规则，无需重复配置：

- `/api/` → `http://127.0.0.1:3000`
- `/uploads/` → `http://127.0.0.1:3000`
- `/` → 前端静态文件（`/var/www/verra-voile`）

## 输出

部署完成后报告：
- Git 分支操作结果（合并到 main、新建分支）
- 打包状态
- 上传结果
- 健康检查 HTTP 响应
- 数据库同步结果（记录条数对比）
- PM2 进程状态
