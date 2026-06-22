# WhenWhere 安装与配置指南

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
cd ww
npm install
```

安装过程中 `better-sqlite3` 会编译原生模块，如果遇到编译错误：

**Windows 用户**：
```powershell
# 安装 Windows 构建工具（管理员身份运行）
npm install --global windows-build-tools
```

### 3. 初始化数据库

首次运行需要初始化数据库，创建所有表结构：

```powershell
npm run init-db
```

数据库文件将创建在 `ww/db/whenwhere.db`。

### 4. 准备游戏数据

游戏需要题目数据才能游玩。有以下几种方式获取数据：

#### 方式 A：使用 HSD 维护系统添加
使用配套的 [HSD 维护系统](../hsd/SETUP.md) 手动添加题目。

#### 方式 B：导入现有数据
从 HSD 导出的 ZIP 包导入数据，操作步骤见 [HSD 数据导入](../hsd/FLOW.md#3-数据导入流程)。

#### 方式 C：使用示例数据
如果有示例数据库文件，直接复制到 `ww/db/whenwhere.db` 即可。

### 5. 启动服务

```powershell
npm start
```

服务启动后，在浏览器访问：`http://localhost:3000`

---

## 详细配置

### 端口配置

默认使用 3000 端口，如需修改：

**PowerShell:**
```powershell
$env:PORT = 8080
npm start
```

**CMD:**
```cmd
set PORT=8080 && npm start
```

**Linux/macOS:**
```bash
PORT=8080 npm start
```

或直接修改 `server/app.js`：
```javascript
const PORT = process.env.PORT || 3000;  // 修改默认端口
```

### 静态资源路径配置

默认情况下，静态资源（图片、瓦片、GeoJSON）存放在 `ww/static/` 目录下。

如需修改，编辑 `server/app.js`：
```javascript
const STATIC_PATH = path.join(__dirname, '..', 'static');
```

### 游戏参数配置

编辑 `server/config.js` 调整游戏参数：

```javascript
module.exports = {
  // 每局游戏时长（秒）
  GAME_DURATION: 30,
  
  // 精准位置判定阈值（km）
  PRECISE_DISTANCE_KM: 50,
  
  // 精准时间判定阈值（年）
  PRECISE_TIME_YEARS: 1,
  
  // 答案分析显示的最大记录数
  MAX_ANSWERS_FOR_ANALYSIS: 50,
  
  // Token 加密密钥（生产环境请修改）
  TOKEN_SECRET: 'your-secret-key-here'
};
```

**重要提示**：生产环境请务必修改 `TOKEN_SECRET` 为随机字符串。

### 数据库优化配置

数据库默认启用了以下优化（`server/db.js`）：

```javascript
// WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');

// 启用外键约束
db.pragma('foreign_keys = ON');

// 同步模式（可选，根据性能需求调整）
// db.pragma('synchronous = NORMAL');
```

如需更高性能，可添加：
```javascript
db.pragma('cache_size = -20000');  // 20MB 缓存
db.pragma('temp_store = MEMORY');   // 临时表存内存
```

---

## 数据库初始化详解

`npm run init-db` 会执行 `server/init-db.js`，创建以下表：

1. **users** - 用户表
2. **categories** - 分类表
3. **sub_categories** - 子分类表
4. **maps** - 地图配置表
5. **events** - 事件/题目表
6. **event_images** - 事件图片表
7. **game_stats** - 每日游戏统计表
8. **game_sessions** - 游戏会话表
9. **game_answers** - 答题记录表
10. **achievements** - 成就定义表
11. **user_achievements** - 用户成就表
12. **rank_history** - 段位历史表
13. **votes** - 投票表
14. **favorites** - 收藏表

同时创建必要的索引以提升查询性能。

### 重置数据库

如需清空所有数据重新开始：

```powershell
# 停止服务后执行
del db\whenwhere.db
del db\whenwhere.db-shm
del db\whenwhere.db-wal

# 重新初始化
npm run init-db
```

**警告**：这会删除所有用户数据、游戏记录和题目，请谨慎操作！

---

## 验证安装

### 1. 健康检查

启动服务后，访问：
```
http://localhost:3000/api/health
```

应返回：
```json
{
  "success": true,
  "message": "WW服务运行正常",
  "timestamp": "2026-06-22T..."
}
```

### 2. 验证分类 API

```
http://localhost:3000/api/categories
```

### 3. 验证前端页面

访问 `http://localhost:3000`，应看到登录页面。

---

## 地图瓦片配置

### 使用在线地图瓦片

默认使用混合模式（低缩放 OSM，高缩放高德），无需额外配置。

### 使用离线地图瓦片

1. 将瓦片文件放入 `ww/static/tiles/{map_name}/` 目录
2. 瓦片命名格式：`{z}/{x}/{y}.{ext}`
3. 在 HSD 中配置地图，设置 `tile_type` 为 `custom`，并填入瓦片 URL 模板

示例瓦片 URL：`/tiles/fortnite/{z}/{x}/{y}.webp`

### 使用自定义平面坐标系地图

对于非地理地图（如游戏地图）：
1. 设置 `crs_type` 为 `simple`
2. 配置地图边界 `bounds_south/west/north/east`
3. 配置 `distance_unit` 和 `distance_scale`（可选）

---

## 生产环境部署

### 使用 PM2 管理进程

```powershell
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server/app.js --name ww

# 查看状态
pm2 status

# 查看日志
pm2 logs ww

# 重启服务
pm2 restart ww

# 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name whenwhere.example.com;

    # 静态资源直接由 Nginx 提供
    location /images/ {
        alias /path/to/ww/static/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /tiles/ {
        alias /path/to/ww/static/tiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /geojson/ {
        alias /path/to/ww/static/geojson/;
        expires 7d;
    }

    location /lib/ {
        alias /path/to/ww/static/lib/;
        expires 30d;
    }

    # 其他请求转发到 Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }
}
```

### 启用 HTTPS

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d whenwhere.example.com
```

---

## 备份与恢复

### 数据库备份

因为使用 SQLite，备份非常简单：

```powershell
# 停止服务后复制数据库文件
copy db\whenwhere.db backup\whenwhere_$(Get-Date -Format "yyyyMMdd_HHmmss").db
```

或在服务运行时使用 SQLite 命令备份：
```bash
sqlite3 db/whenwhere.db ".backup backup/whenwhere_backup.db"
```

### 定时备份脚本（Windows PowerShell）

```powershell
$backupDir = "C:\backups\whenwhere"
$sourceFile = "C:\ws\whenwhere\ww\db\whenwhere.db"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$destFile = Join-Path $backupDir "whenwhere_$timestamp.db"

# 创建备份目录
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# 复制文件
Copy-Item $sourceFile $destFile

# 删除超过 30 天的备份
Get-ChildItem $backupDir -Filter "*.db" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item

Write-Host "备份完成: $destFile"
```

保存为 `backup.ps1`，使用任务计划程序定期执行。

### 数据恢复

```powershell
# 停止服务
# 用备份文件覆盖当前数据库
copy backup\whenwhere_backup.db db\whenwhere.db
# 启动服务
```

---

## 常见安装问题

### Q: npm install 时 better-sqlite3 编译失败

**Windows 解决方案：**
```powershell
# 以管理员身份运行 PowerShell
npm install --global windows-build-tools
npm install --global @vscode/vs-build-tools

# 然后重新安装
npm install
```

**Linux 解决方案：**
```bash
sudo apt-get install build-essential python3
npm install
```

### Q: 启动时提示端口被占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### Q: 地图瓦片加载失败显示灰色

- 检查网络连接
- 如果在中国境内，建议使用高德地图瓦片
- 检查浏览器控制台（F12）是否有跨域或 404 错误

### Q: 图片无法显示

- 检查图片文件是否存在于 `ww/static/images/` 目录
- 检查文件路径和权限
- 检查浏览器控制台是否有 404 错误

### Q: 数据库文件被锁定

SQLite 是文件型数据库，确保：
- 没有其他进程正在访问数据库
- 数据库文件所在目录有写入权限
- 如果 WAL 模式文件损坏，删除 `-shm` 和 `-wal` 文件后重试

### Q: 登录后刷新页面显示未登录

- 检查浏览器是否禁用了 localStorage
- 检查 Token 是否已过期或失效
- 尝试清除浏览器缓存后重新登录
