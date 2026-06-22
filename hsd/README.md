# HSD (Heshidi) — 历史数据维护系统

## 📖 系统简介

**HSD** 是 **WhenWhere** 游戏的配套数据维护与管理工具，提供完整的题库管理、数据导入导出、AI 智能提取和众筹出题功能。

### 核心功能

| 模块 | 功能说明 |
|------|---------|
| **主数据管理** | 管理游戏分类、子分类、地图配置、事件题目、图片资源 |
| **数据导出** | 将游戏数据导出为 JSON、ZIP、SQL 三种格式，支持按分类筛选 |
| **数据导入** | 从导出的 ZIP 包导入数据，支持冲突检测和合并策略 |
| **AI 智能提取** | 基于 LLM 从维基百科/百度百科 HTML 页面自动提取事件数据 |
| **众筹出题** | 独立数据库的众包出题系统，支持用户贡献题目、审核、导出 |

### 系统亮点

- 🎯 **一站式管理**：从出题、审核到导出，全流程覆盖
- 🤖 **AI 辅助**：集成大语言模型，自动从网页提取结构化事件数据
- 💾 **双数据库架构**：主数据库 + 众筹数据库分离，互不影响
- 📦 **多格式导出**：支持 JSON、ZIP、SQL 三种导出格式，满足不同场景
- 🔄 **增量导入**：智能冲突检测，支持覆盖、跳过、重命名三种策略
- 🗺️ **地图瓦片管理**：支持自定义瓦片上传、地图边界配置、多坐标系
- 📱 **响应式界面**：基于原生 JS + CSS，无需构建工具，开箱即用

---

## 🏗️ 技术架构

```
hsd/
├── server/                          # 后端服务 (Node.js + Express)
│   ├── app.js                      # Express 服务入口 (端口 3001)
│   ├── config.js                   # 全局配置（WW 静态资源路径等）
│   ├── db.js                       # 主游戏数据库连接 (whenwhere.db)
│   ├── crowd-db.js                 # 众筹数据库连接 (crowd.db)
│   ├── init-db.js                  # 数据库初始化脚本
│   ├── llm-config.js               # LLM 配置管理（API Key、模型参数）
│   ├── llm.js                      # LLM API 调用封装
│   ├── extractor.js                # AI 提取核心逻辑（HTML解析 + LLM调用）
│   └── routes/
│       ├── categories.js           # 主分类 CRUD API
│       ├── events.js               # 主事件 CRUD API
│       ├── maps.js                 # 主地图配置 API
│       ├── images.js               # 图片上传/管理 API
│       ├── export.js               # 主数据导出 API
│       ├── import.js               # 数据导入 API
│       ├── extract.js              # AI 提取 API
│       └── crowd/                  # 众筹出题模块
│           ├── categories.js       # 众筹分类 CRUD
│           ├── maps.js             # 众筹地图 CRUD
│           ├── events.js           # 众筹事件 CRUD
│           └── export.js           # 众筹数据导出 API
├── public/                          # 前端静态文件
│   ├── index.html                  # SPA 入口
│   ├── css/style.css               # 全局样式
│   └── js/
│       ├── main.js                 # 前端入口
│       ├── common.js               # 公共工具
│       └── modules/
│           ├── app.js              # 前端应用框架
│           ├── state.js            # 全局状态管理
│           ├── utils.js            # 工具函数
│           ├── map-core.js         # Leaflet 地图核心封装
│           ├── map-drawing.js      # 地图绘图工具（点、矩形、多边形）
│           ├── home-view.js        # 首页/概览视图
│           ├── categories-view.js  # 主分类管理视图
│           ├── maps-view.js        # 主地图管理视图
│           ├── event-list.js       # 主事件列表视图
│           ├── event-form.js       # 主事件编辑表单
│           ├── event-edit.js       # 主事件编辑（含地图标注）
│           ├── image-manager.js    # 图片管理器
│           ├── export-view.js      # 数据导出视图
│           ├── import-view.js      # 数据导入视图
│           ├── extract-view.js     # AI 提取视图
│           └── crowd-view.js       # 众筹出题完整视图（5个子页面）
├── db/                              # 数据库文件
│   └── crowd.db                    # 众筹独立数据库 (SQLite)
├── config.example.json              # LLM 配置示例
└── package.json
```

### 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                     HSD 前端 (SPA)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  主数据  │  │  数据导出 │  │ AI提取  │  │  众筹出题 │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP API
┌──────────────────────┴──────────────────────────────────────┐
│                     Express 服务端                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  主数据库    │  │  众筹数据库  │  │  LLM API     │          │
│  │ whenwhere.db│  │  crowd.db   │  │  (OpenAI)    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────┬──────────────────────────────────────┘
                       │ 文件系统
┌──────────────────────┴──────────────────────────────────────┐
│                   WW 静态资源共享                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  images/    │  │  tiles/     │  │  geojson/   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 系统需求

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| **操作系统** | Windows 10 / macOS 11 / Linux (Ubuntu 20.04) | 同最低要求 |
| **Node.js** | >= 16.x | >= 20.x LTS |
| **内存** | >= 512MB | >= 2GB |
| **磁盘空间** | >= 100MB（不含图片和瓦片） | >= 1GB |
| **浏览器** | Chrome 90+ / Firefox 88+ / Edge 90+ / Safari 14+ | 最新版 Chrome/Edge |
| **网络** | AI 提取功能需要可访问 LLM API 的网络 | 同最低要求 |

### 外部依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| [express](https://expressjs.com/) | ^4.18.2 | Web 框架 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | ^11.0.0 | SQLite 数据库驱动 |
| [archiver](https://github.com/archiverjs/node-archiver) | ^8.0.0 | ZIP 压缩导出 |
| [unzipper](https://github.com/ZJONSSON/node-unzipper) | ^0.12.3 | ZIP 解压导入 |
| [cheerio](https://cheerio.js.org/) | ^1.2.0 | HTML 解析（AI 提取） |
| [multer](https://github.com/expressjs/multer) | ^1.4.5-lts.1 | 文件上传 |
| [cors](https://github.com/expressjs/cors) | ^2.8.5 | 跨域支持 |
| [Leaflet.js](https://leafletjs.com/) | ^1.9.4 | 交互式地图（前端） |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd hsd
npm install
```

### 2. 配置 LLM（可选，用于 AI 提取功能）

```bash
# 复制配置示例
copy config.example.json config.json

# 编辑 config.json，填入你的 API Key
notepad config.json
```

配置说明：

```json
{
  "provider": "openai",
  "apiKey": "sk-your-api-key-here",
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

### 3. 初始化数据库

```bash
# 初始化主数据库连接（无需手动建表，首次访问自动创建）
npm run init-db
```

### 4. 启动服务

```bash
npm start
```

服务启动后访问：`http://localhost:3001`

---

## 📚 功能模块详解

### 📊 主数据管理

**分类管理**
- 创建、编辑、删除游戏分类
- 每个分类下可管理多个子分类
- 子分类关联地图配置，支持自定义瓦片、缩放范围、坐标系

**地图管理**
- 5 种地图类型：OSM、高德矢量、高德卫星、混合、自定义瓦片
- 支持 EPSG3857（标准地理）和 CRS.Simple（平面坐标系）
- 可配置地图边界、瓦片大小、距离单位和缩放系数
- 支持瓦片 ZIP 包上传，自动解压到指定目录

**事件管理**
- 完整的 CRUD 操作：创建、编辑、删除、查询
- 交互式地图标注：点击选点、绘制矩形/多边形区域
- 多图片支持：每张图片可设置标题、描述、显示顺序
- 时间精度：仅年份 / 年月 / 年月日三级精度
- 支持「仅位置」模式（无需猜时间）

**图片管理**
- 拖拽上传，支持批量上传
- 自动生成缩略图
- 按分类/事件组织目录结构

---

### 📦 数据导出

**导出格式**

| 格式 | 说明 | 适用场景 |
|------|------|---------|
| **JSON** | 完整数据结构，含事件、分类、地图、图片元数据 | 数据备份、程序处理 |
| **ZIP** | JSON + 图片文件 + 瓦片文件 + manifest | 离线部署、数据分享 |
| **SQL** | SQLite 兼容的 SQL 语句 | 数据库迁移 |

**导出筛选**
- 按分类筛选
- 按子分类筛选
- 选择是否包含图片
- 选择是否包含瓦片

**导出流程**
```
选择分类 → 选择子分类 → 选择导出格式 → 选择包含内容 → 生成导出文件
                                                          ↓
                                               下载到本地
```

---

### 🤖 AI 智能提取

**功能特点**
- 支持从维基百科、百度百科等网站的 HTML 页面提取事件
- 自动解析页面内容，结合 LLM 生成结构化事件数据
- 支持批量处理，可一次上传多个 HTML 文件
- 内置限流机制，避免触发 API 速率限制
- 支持预览提取结果，确认后再入库

**提取字段**
- 事件标题
- 事件描述
- 发生时间（年/月/日 + 精度）
- 发生地点（坐标 + 地点名称）
- 分类建议

**工作流程**
```
上传 HTML 文件 → 选择目标分类 → 开始提取
       ↓
  Cheerio 解析页面内容（提取标题、正文、信息框）
       ↓
  构造 Prompt 调用 LLM
       ↓
  解析 LLM 返回的 JSON 结果
       ↓
  预览提取结果 → 人工确认/编辑 → 保存到数据库
```

**配置要求**
- 需要配置 `config.json` 中的 LLM API Key
- 建议使用 GPT-4o-mini 或以上模型以保证提取质量
- 网络需能访问 LLM API 服务

---

### 📝 众筹出题

**独立数据库设计**
- 众筹数据存储在独立的 `crowd.db` 中
- 与主游戏数据库完全隔离，保证数据安全
- 表结构与主库一致，便于审核后导入

**5 个子页面**

| 页面 | 功能 |
|------|------|
| **概览** | 统计信息展示（分类数、地图数、事件数、子分类数） |
| **出题** | 交互式地图标注出题，支持选点、画框、添加图片 |
| **分类管理** | 分类和子分类的 CRUD |
| **地图管理** | 地图配置和瓦片管理 |
| **数据导出** | 众筹数据导出，审核后可导入主库 |

**审核流程（可扩展）**
```
用户出题 → 保存到众筹库 → 管理员审核 → 导入主游戏库
```

---

### 📥 数据导入

**支持格式**
- HSD 导出的 ZIP 包（含 manifest.json）
- 单个 JSON 文件

**冲突处理策略**
1. **覆盖**：已有数据时，用新数据覆盖
2. **跳过**：已有数据时，保留原有数据
3. **重命名**：已有数据时，新数据添加后缀

**导入流程**
```
选择导入文件 → 解析文件 → 预览导入数据 → 选择冲突策略 → 执行导入
                                                          ↓
                                                显示导入结果
```

---

## 🔌 API 接口总览

### 主数据 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/categories` | 获取所有分类 |
| POST | `/api/categories` | 创建分类 |
| PUT | `/api/categories/:id` | 更新分类 |
| DELETE | `/api/categories/:id` | 删除分类 |
| POST | `/api/categories/sub-category` | 创建子分类 |
| PUT | `/api/categories/sub-category/:id` | 更新子分类 |
| DELETE | `/api/categories/sub-category/:id` | 删除子分类 |
| GET | `/api/maps` | 获取所有地图 |
| POST | `/api/maps` | 创建地图 |
| PUT | `/api/maps/:id` | 更新地图 |
| DELETE | `/api/maps/:id` | 删除地图 |
| GET | `/api/events` | 获取事件列表（支持筛选） |
| POST | `/api/events` | 创建事件 |
| PUT | `/api/events/:id` | 更新事件 |
| DELETE | `/api/events/:id` | 删除事件 |
| POST | `/api/events/batch` | 批量创建事件 |

### 导出/导入 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/export/events` | 获取可导出事件列表 |
| GET | `/api/export/json` | 导出 JSON 格式 |
| GET | `/api/export/zip` | 导出 ZIP 格式 |
| GET | `/api/export/sql` | 导出 SQL 格式 |
| POST | `/api/import/upload` | 上传导入文件 |
| POST | `/api/import/preview` | 预览导入数据 |
| POST | `/api/import/execute` | 执行导入 |

### AI 提取 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/extract/status` | 获取 LLM 配置状态 |
| POST | `/api/extract/preview` | 预览提取结果（单文件） |
| POST | `/api/extract/extract` | 执行提取并保存 |
| POST | `/api/extract/reload-config` | 重载 LLM 配置 |

### 众筹出题 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/crowd/events/stats` | 获取众筹统计 |
| GET | `/api/crowd/events` | 获取事件列表 |
| POST | `/api/crowd/events` | 创建事件 |
| PUT | `/api/crowd/events/:id` | 更新事件 |
| DELETE | `/api/crowd/events/:id` | 删除事件 |
| GET | `/api/crowd/categories` | 获取分类列表 |
| POST | `/api/crowd/categories` | 创建分类 |
| PUT | `/api/crowd/categories/:id` | 更新分类 |
| DELETE | `/api/crowd/categories/:id` | 删除分类 |
| GET | `/api/crowd/maps` | 获取地图列表 |
| POST | `/api/crowd/maps` | 创建地图 |
| PUT | `/api/crowd/maps/:id` | 更新地图 |
| DELETE | `/api/crowd/maps/:id` | 删除地图 |
| GET | `/api/crowd/export/stats` | 获取导出统计 |
| GET | `/api/crowd/export/events-list` | 获取可导出事件列表 |
| GET | `/api/crowd/export/json` | 导出 JSON |
| GET | `/api/crowd/export/zip` | 导出 ZIP |
| GET | `/api/crowd/export/sql` | 导出 SQL |

---

## 🔧 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务监听端口 |
| `WW_STATIC_PATH` | `../ww/static` | WW 静态资源目录路径 |

### config.json（LLM 配置）

| 字段 | 类型 | 说明 |
|------|------|------|
| `provider` | string | LLM 提供商，目前仅支持 `openai` |
| `apiKey` | string | API Key |
| `baseURL` | string | API 基础 URL |
| `model` | string | 模型名称，如 `gpt-4o-mini` |
| `temperature` | number | 采样温度，0-1，建议 0.1 |
| `maxTokens` | number | 最大输出 Token 数 |
| `rateLimit.requestsPerMinute` | number | 每分钟请求数限制 |
| `rateLimit.concurrency` | number | 并发请求数限制 |

---

## 🐛 常见问题

### Q: 启动时提示找不到 WW 静态资源？

A: 检查 `server/config.js` 中的 `WW_STATIC_PATH` 配置，确保指向正确的 WW static 目录。

### Q: AI 提取功能不可用？

A: 检查 `/api/extract/status` 接口，确认 `configured` 为 `true`。如为 `false`，请创建 `config.json` 并配置正确的 LLM API Key。

### Q: 上传大文件失败？

A: 检查 `server/app.js` 中的 `express.json({ limit: '50mb' })` 配置，根据需要调整。

### Q: 图片无法显示？

A: 确保 WW 静态资源路径配置正确，且图片文件存在于 `WW_STATIC_PATH/images/` 目录下。

---

## 📄 许可证

MIT License - 详见根目录 [LICENSE](../LICENSE) 文件。
