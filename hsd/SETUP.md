# HSD 安装与配置指南

## 快速安装（Windows）

### 1. 安装 Node.js

如果尚未安装 Node.js，请从 [官网](https://nodejs.org/) 下载并安装 LTS 版本（推荐 20.x 或更高）。

验证安装：
```powershell
node --version
npm --version
```

### 2. 安装项目依赖

```powershell
cd hsd
npm install
```

### 3. 配置 LLM（可选，AI 提取功能需要）

```powershell
# 复制配置模板
copy config.example.json config.json

# 编辑配置文件
notepad config.json
```

填入你的 API Key：
```json
{
  "provider": "openai",
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxx",
  "baseURL": "https://api.openai.com/v1",
  "model": "gpt-4o-mini",
  "temperature": 0.1,
  "maxTokens": 2048,
  "rateLimit": {
    "requestsPerMinute": 10,
    "concurrency": 2
  }
}
```

### 4. 初始化数据库

首次运行需要初始化数据库：
```powershell
npm run init-db
```

**注意**：数据库文件会自动创建在 `hsd/db/crowd.db`（众筹数据库）和 `ww/db/whenwhere.db`（主游戏数据库）。

### 5. 启动服务

```powershell
npm start
```

服务启动后访问：`http://localhost:3001`

---

## 详细配置

### 端口配置

默认使用 3001 端口，如需修改：

```powershell
# Windows (PowerShell)
$env:PORT = 8080
npm start
```

或直接修改 `server/app.js`：
```javascript
const PORT = process.env.PORT || 3001;  // 修改默认端口
```

### WW 静态资源路径配置

HSD 需要访问 WW 的静态资源（图片、瓦片等）。默认路径为 `../ww/static`。

如需修改，编辑 `server/config.js`：
```javascript
const WW_STATIC_PATH = process.env.WW_STATIC_PATH || 
  path.join(__dirname, '..', '..', 'ww', 'static');
```

### 上传文件大小限制

默认 JSON 请求体限制为 50MB，如需调整，修改 `server/app.js`：
```javascript
app.use(express.json({ limit: '50mb' }));
```

文件上传大小限制在 `server/routes/images.js`：
```javascript
const storage = multer.diskStorage({ ... });
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }  // 10MB
});
```

---

## 数据库初始化

### 主游戏数据库

主数据库文件位置：`ww/db/whenwhere.db`

首次访问时自动创建所有表结构。如需手动初始化：

```powershell
cd ../ww
npm run init-db
```

### 众筹数据库

众筹数据库文件位置：`hsd/db/crowd.db`

首次访问时自动创建。初始化包含以下表：
- `categories` - 分类
- `sub_categories` - 子分类
- `maps` - 地图配置
- `events` - 事件
- `event_images` - 事件图片

### 清空并重置数据库

如需重置所有数据：

```powershell
# 停止服务后执行
del hsd\db\crowd.db
del ww\db\whenwhere.db

# 重新初始化
cd ww
npm run init-db
cd ../hsd
npm run init-db
```

---

## 验证安装

### 1. 健康检查

启动服务后，访问：
```
http://localhost:3001/api/health
```

应返回：
```json
{
  "success": true,
  "message": "HSD服务运行正常",
  "timestamp": "2026-06-22T..."
}
```

### 2. 验证主数据 API

```
http://localhost:3001/api/categories
```

### 3. 验证 AI 提取状态

```
http://localhost:3001/api/extract/status
```

如已配置 LLM，应返回 `configured: true`。

### 4. 验证众筹 API

```
http://localhost:3001/api/crowd/events/stats
```

---

## 生产环境部署

### 使用 PM2 管理进程

```powershell
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server/app.js --name hsd

# 查看状态
pm2 status

# 查看日志
pm2 logs hsd

# 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name hsd.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 100M;
    }
}
```

---

## 常见安装问题

### Q: npm install 失败（better-sqlite3 编译错误）

**原因**：缺少 C++ 编译工具

**解决**（Windows）：
```powershell
# 安装 Windows 构建工具
npm install --global windows-build-tools

# 或使用微软官方工具
npm install --global @vscode/vs-build-tools
```

### Q: 启动时提示端口被占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3001

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### Q: 图片/瓦片无法访问

检查 `WW_STATIC_PATH` 配置，确保目录存在且包含相应文件。

### Q: LLM API 调用失败

检查网络连接是否可访问 API 服务，确认 API Key 正确，检查账户余额。
