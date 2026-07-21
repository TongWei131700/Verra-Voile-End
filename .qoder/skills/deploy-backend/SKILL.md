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
- 打包状态
- 上传结果
- 健康检查 HTTP 响应
- PM2 进程状态
