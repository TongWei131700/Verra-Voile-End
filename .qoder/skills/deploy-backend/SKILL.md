---
name: deploy-backend
description: 将后端代码打包部署到远程服务器，包括上传代码、安装依赖、配置环境变量、PM2启动服务。当用户说"部署后端"、"发布服务端代码"、"deploy backend"时触发。
---

# 部署后端服务

## 服务器信息

- **IP**: `47.99.138.250`
- **SSH用户**: `root`
- **SSH密码**: `TongWei131700`
- **部署路径**: `/var/www/verra-voile-end`
- **服务端口**: `3000`
- **PM2进程名**: `verra-voile-api`

## 数据库配置

- **DB_HOST**: `127.0.0.1`
- **DB_PORT**: `13306`
- **DB_USER**: `root`
- **DB_PASSWORD**: `caoqiangiot@123`
- **DB_NAME**: `verra_voile`

## 部署步骤

### 0. Git 版本控制（必须先执行）

在部署前，必须先完成以下 git 操作：

```bash
cd /Users/hongli/WorkSpace/Verra-Voile-End

# 1. 提交所有改动
git add -A
git commit -m "feat: 部署更新"

# 2. 合并到 main
git checkout main
git merge <当前分支> --no-edit
git push origin main

# 3. 获取下一版本号（从线上 API 获取）
NEXT_VERSION=$(curl -s http://47.99.138.250/api/version/next?side=backend | grep -o '"version":"[^"]*"' | cut -d'"' -f4)

# 4. 创建并切换到下一版本分支
git checkout -b daily/${NEXT_VERSION}
git push origin daily/${NEXT_VERSION}
```

**分支命名规范**: `daily/x.y.z`（不使用 be/ 或 fe/ 前缀）

**注意**: 如果当前没有未提交改动，跳过 commit 步骤，但仍需执行合并 main 和创建新分支。

### 1. 确认部署

使用 `AskUserQuestion` 告知用户即将部署，确认继续。

### 2. 本地打包

排除 `node_modules`、`.git`、`uploads` 目录：

```bash
cd /Users/hongli/WorkSpace/Verra-Voile-End
tar --exclude='node_modules' --exclude='.git' --exclude='uploads' -czf /tmp/verra-voile-end.tar.gz -C . .
```

### 3. 上传到服务器

使用 `expect` 处理密码认证：

```bash
expect << 'EXPECT_EOF'
set timeout 60
spawn scp -o StrictHostKeyChecking=no /tmp/verra-voile-end.tar.gz root@47.99.138.250:/tmp/
expect {
    "password:" {
        send "TongWei131700\r"
        exp_continue
    }
    eof
}
EXPECT_EOF
```

### 4. 服务器解压并安装依赖

```bash
expect << 'EXPECT_EOF'
set timeout 120
spawn ssh -o StrictHostKeyChecking=no root@47.99.138.250 "cd /var/www/verra-voile-end && rm -rf src package.json package-lock.json && tar -xzf /tmp/verra-voile-end.tar.gz && npm install --production 2>&1 | tail -5 && echo DEPLOY_OK"
expect {
    "password:" {
        send "TongWei131700\r"
        exp_continue
    }
    eof
}
EXPECT_EOF
```

### 5. 配置 .env 并重启服务

```bash
expect << 'EXPECT_EOF'
set timeout 30
spawn ssh -o StrictHostKeyChecking=no root@47.99.138.250 "cat > /var/www/verra-voile-end/.env << 'EOF'
DB_HOST=127.0.0.1
DB_PORT=13306
DB_USER=root
DB_PASSWORD=caoqiangiot@123
DB_NAME=verra_voile
PORT=3000
EOF
pm2 restart verra-voile-api && sleep 2 && curl -s http://localhost:3000/health"
expect {
    "password:" {
        send "TongWei131700\r"
        exp_continue
    }
    eof
}
EXPECT_EOF
```

### 6. 验证部署

健康检查返回 `{"status":"ok",...}` 即部署成功。

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
- PM2 进程状态
