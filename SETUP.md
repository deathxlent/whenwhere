# WhenWhere 整体安装指南

本文档包含整个 WhenWhere 项目（HSD + WW）的完整安装与配置流程。

---

## 目录

1. [前置准备](#1-前置准备)
2. [快速安装（一键脚本）](#2-快速安装一键脚本)
3. [手动安装](#3-手动安装)
4. [配置 HSD 维护系统](#4-配置-hsd-维护系统)
5. [配置 WW 游戏系统](#5-配置-ww-游戏系统)
6. [启动服务](#6-启动服务)
7. [验证安装](#7-验证安装)
8. [数据准备](#8-数据准备)
9. [生产环境部署](#9-生产环境部署)
10. [常见问题](#10-常见问题)

---

## 1. 前置准备

### 1.1 系统要求

| 系统 | 最低版本 |
|------|----------|
| Windows | Windows 10 21H2 / Windows 11 |
| macOS | macOS 10.15 (Catalina) |
| Linux | Ubuntu 20.04, CentOS 8, Debian 11 |

### 1.2 安装 Node.js

**Windows：**
1. 访问 https://nodejs.org/
2. 下载 LTS 版本（推荐 20.x 或更高）
3. 运行安装程序，勾选 "Automatically install the necessary tools"
4. 完成安装后重启命令行

**macOS（Homebrew）：**
```bash
brew install node@20
```

**Linux（Ubuntu/Debian）：**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**验证安装：**
```bash
node --version  # 应显示 v20.x.x
npm --version   # 应显示 9.x.x 或更高
```

### 1.3 安装 Windows 构建工具（仅 Windows）

编译 `better-sqlite3` 需要 C++ 构建工具：

**方法 1：安装时勾选（推荐）**
安装 Node.js 时勾选 "Automatically install the necessary tools"

**方法 2：手动安装**
以管理员身份运行 PowerShell：
```powershell
npm install --global windows-build-tools
npm install --global @vscode/vs-build-tools
```

---

## 2. 快速安装（一键脚本）

### Windows 用户

```powershell
# 进入项目根目录
cd whenwhere

# 运行一键安装脚本
.\setup.bat
```

### Linux/macOS 用户

```bash
cd whenwhere
chmod +x setup.sh
./setup.sh
```

一键脚本会自动完成：
1. 检测 Node.js 环境
2. 安装 HSD 依赖
3. 初始化 HSD 数据库
4. 安装 WW 依赖
5. 初始化 WW 数据库
6. 创建示例配置文件（如不存在）

---

## 3. 手动安装

如果一键脚本失败，可按以下步骤手动安装。

### 3.1 安装 HSD 依赖

```bash
cd hsd
npm install
```

**如果遇到 better-sqlite3 编译错误：**

Windows:
```powershell
# 确保已安装构建工具
npm install --global @vscode/vs-build-tools
npm rebuild better-sqlite3
```

Linux:
```bash
sudo apt-get install build-essential python3
npm rebuild better-sqlite3
```

### 3.2 初始化 HSD 数据库

```bash
npm run init-db
```

成功后应显示：
```
数据库初始化完成
数据库文件: hsd/db/hsd.db
```

### 3.3 安装 WW 依赖

```bash
cd ../ww
npm install
```

### 3.4 初始化 WW 数据库

```bash
npm run init-db
```

成功后应显示：
```
数据库初始化完成
数据库文件: ww/db/whenwhere.db
```

---

## 4. 配置 HSD 维护系统

### 4.1 创建配置文件

如果 `hsd/server/config.json` 不存在，创建它：

```json
{
  "server": {
    "port": 3001
  },
  "llm": {
    "apiKey": "your-api-key-here",
    "baseURL": "https://api.openai.com/v1",
    "model": "gpt-4o-mini",
    "maxTokens": 1000,
    "temperature": 0.3
  },
  "paths": {
    "images": "static/images/",
    "exports": "static/exports/"
  }
}
```

### 4.2 配置说明

| 配置项 | 说明 | 必填 |
|--------|------|------|
| `server.port` | HSD 服务端口，默认 3001 | 是 |
| `llm.apiKey` | LLM API 密钥，用于 AI 提取功能 | 否（AI 功能需要） |
| `llm.baseURL` | LLM API 基础地址 | 否 |
| `llm.model` | 使用的模型名称 | 否 |
| `paths.images` | 图片存储路径 | 是 |
| `paths.exports` | 导出文件存储路径 | 是 |

### 4.3 静态资源目录

创建必要的目录：

```powershell
# Windows
New-Item -ItemType Directory -Path hsd\static\images -Force
New-Item -ItemType Directory -Path hsd\static\exports -Force

# Linux/macOS
mkdir -p hsd/static/images
mkdir -p hsd/static/exports
```

---

## 5. 配置 WW 游戏系统

### 5.1 游戏参数配置

编辑 `ww/server/config.js` 调整游戏参数：

```javascript
module.exports = {
  GAME_DURATION: 30,           // 每局游戏时长（秒）
  PRECISE_DISTANCE_KM: 50,     // 精准位置判定阈值（km）
  PRECISE_TIME_YEARS: 1,       // 精准时间判定阈值（年）
  MAX_ANSWERS_FOR_ANALYSIS: 50, // 答案分析最大记录数
  TOKEN_SECRET: 'your-secret-key-here-change-in-production',
  ENABLE_HINT: true            // 启用渐进式提示
};
```

**重要**：生产环境请务必修改 `TOKEN_SECRET` 为随机字符串。

### 5.2 静态资源目录

创建必要的目录：

```powershell
# Windows
New-Item -ItemType Directory -Path ww\static\images -Force
New-Item -ItemType Directory -Path ww\static\tiles -Force
New-Item -ItemType Directory -Path ww\static\geojson -Force

# Linux/macOS
mkdir -p ww/static/images
mkdir -p ww/static/tiles
mkdir -p ww/static/geojson
```

### 5.3 端口配置

默认 WW 使用 3000 端口，HSD 使用 3001 端口。如需修改：

**临时修改：**
```powershell
# PowerShell
$env:PORT = 8080

# CMD
set PORT=8080

# Linux/macOS
export PORT=8080
```

**永久修改：**
编辑 `ww/server/app.js`：
```javascript
const PORT = process.env.PORT || 3000;  // 修改默认值
```

---

## 6. 启动服务

### 6.1 开发模式启动

#### 方式一：使用一键启动脚本

**Windows：**
```powershell
.\start.bat
```

**Linux/macOS：**
```bash
./start.sh
```

#### 方式二：分别启动

**启动 HSD（终端 1）：**
```bash
cd hsd
npm start
```

**启动 WW（终端 2）：**
```bash
cd ww
npm start
```

### 6.2 启动成功标志

HSD 启动成功：
```
HSD 服务器运行在 http://localhost:3001
数据库连接成功
```

WW 启动成功：
```
WW 服务器运行在 http://localhost:3000
数据库连接成功
静态资源路径: ww/static
```

---

## 7. 验证安装

### 7.1 验证 HSD

在浏览器访问：`http://localhost:3001`

应看到 HSD 登录页面。测试健康检查：
```
http://localhost:3001/api/health
```

应返回：
```json
{
  "success": true,
  "message": "HSD服务运行正常",
  "timestamp": "..."
}
```

### 7.2 验证 WW

在浏览器访问：`http://localhost:3000`

应看到 WW 登录页面。测试健康检查：
```
http://localhost:3000/api/health
```

应返回：
```json
{
  "success": true,
  "message": "WW服务运行正常",
  "timestamp": "..."
}
```

### 7.3 验证分类 API

```
http://localhost:3000/api/categories
```

应返回分类列表（初始为空数组）。

---

## 8. 数据准备

安装完成后，需要添加题目数据才能游玩。

### 8.1 使用 HSD 添加题目

1. 访问 `http://localhost:3001`
2. 登录（初始管理员账号需手动创建）
3. 进入「分类管理」添加分类和子分类
4. 进入「地图管理」配置地图
5. 进入「事件管理」添加题目

### 8.2 从 HSD 导出数据到 WW

在 HSD 中完成题目添加后：

1. 选择要导出的题目
2. 点击「导出」→ 选择「导出为 ZIP（含图片）」
3. 下载 ZIP 包

### 8.3 导入数据到 WW

有两种方式：

**方式 A：通过 HSD 同步（推荐）**
- HSD 和 WW 可以共享数据库（需配置）
- 或使用 HSD 的同步功能

**方式 B：手动导入**
1. 解压导出的 ZIP 包
2. 将图片复制到 `ww/static/images/`
3. 将数据导入 WW 数据库（使用 SQLite 工具或编写脚本）

### 8.4 添加地图瓦片（可选）

如需使用离线地图瓦片：

1. 将瓦片文件放入 `ww/static/tiles/{map_name}/`
2. 瓦片目录结构：`{z}/{x}/{y}.{ext}`
3. 在 HSD 的地图配置中设置瓦片 URL 为 `/tiles/{map_name}/{z}/{x}/{y}.webp`

---

## 9. 生产环境部署

### 9.1 使用 PM2 管理进程

```bash
# 全局安装 PM2
npm install -g pm2

# 启动 HSD
cd hsd
pm2 start server/app.js --name hsd

# 启动 WW
cd ../ww
pm2 start server/app.js --name ww

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 9.2 常用 PM2 命令

```bash
pm2 status              # 查看状态
pm2 logs hsd            # 查看 HSD 日志
pm2 logs ww             # 查看 WW 日志
pm2 restart hsd         # 重启 HSD
pm2 restart ww          # 重启 WW
pm2 stop hsd            # 停止 HSD
pm2 stop ww             # 停止 WW
```

### 9.3 Nginx 反向代理

推荐使用 Nginx 作为反向代理，配置示例见：
- [hsd/SETUP.md 生产环境部署](hsd/SETUP.md#生产环境部署)
- [ww/SETUP.md 生产环境部署](ww/SETUP.md#生产环境部署)

### 9.4 配置 HTTPS

使用 Let's Encrypt 免费证书：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d hsd.yourdomain.com
sudo certbot --nginx -d ww.yourdomain.com
```

### 9.5 安全建议

1. **修改默认 Token 密钥**：修改 `ww/server/config.js` 中的 `TOKEN_SECRET`
2. **配置防火墙**：只开放必要端口（80, 443）
3. **定期备份**：设置自动备份数据库
4. **限制访问**：HSD 管理后台建议限制 IP 访问
5. **更新依赖**：定期运行 `npm audit` 检查安全漏洞

---

## 10. 常见问题

### Q: Node.js 版本过低

安装或升级到 Node.js 20.x 或更高版本。

### Q: npm install 失败，提示网络错误

使用国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: better-sqlite3 编译失败

**Windows：**
```powershell
npm install --global @vscode/vs-build-tools
npm rebuild better-sqlite3
```

**Linux：**
```bash
sudo apt-get install build-essential python3
npm rebuild better-sqlite3
```

### Q: 端口被占用

```powershell
# 查找占用进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### Q: 地图瓦片加载失败

- 检查网络连接
- 中国境内建议使用高德地图瓦片
- 查看浏览器控制台（F12）的错误信息

### Q: 数据库文件被锁定

确保没有其他进程访问数据库，删除 WAL 文件后重试：
```powershell
del db\*.db-shm
del db\*.db-wal
```

### Q: 启动后无法访问

- 检查防火墙是否阻止了端口
- 确认服务正常启动（查看控制台输出）
- 尝试使用 `127.0.0.1` 替代 `localhost`

### Q: HSD AI 提取功能不工作

检查 `hsd/server/config.json` 中的 LLM 配置：
- API Key 是否正确
- Base URL 是否可访问
- 模型名称是否正确
- 网络是否可以访问 API 服务

---

## 更多文档

- [HSD 详细安装指南](hsd/SETUP.md)
- [WW 详细安装指南](ww/SETUP.md)
- [项目总览](README.md)
- [业务流程说明](FLOW.md)
