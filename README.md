# WhenWhere 项目总览

> 一个基于地理和时间猜测的教育类游戏平台，包含完整的游戏系统和配套的题目维护工具。

---

## 📋 目录

- [项目简介](#项目简介)
- [核心功能亮点](#核心功能亮点)
- [项目结构](#项目结构)
- [系统需求](#系统需求)
- [快速开始](#快速开始)
- [子项目说明](#子项目说明)
- [技术栈](#技术栈)
- [外部依赖](#外部依赖)
- [文档索引](#文档索引)
- [许可证](#许可证)

---

## 项目简介

WhenWhere 是一个综合性的「地点 + 时间」猜测游戏平台，灵感来源于 GeoGuessr，但扩展了时间维度的玩法。玩家需要根据图片线索，猜出事件发生的**地点**和**时间**，系统会根据距离和时间误差计算得分。

本项目包含两个独立但配套的子系统：

### 🎮 WW (WhenWhere Game) - 游戏前端
玩家可以：
- 选择不同主题分类（中国历史、世界地理、游戏地图等）
- 在地图上猜测事件发生地点、输入事件发生年份
- 查看全国/全球玩家排行榜
- 收集成就、提升段位
- 收藏题目并分析其他玩家的答题记录
- 对题目进行投票反馈

### 🛠 HSD (History Spatio-temporal Data) - 数据维护系统
管理员可以：
- 管理分类、子分类和地图配置
- 添加、编辑、导入导出题目（事件）
- 使用 AI 智能提取信息
- 众包审核题目质量
- 管理投票和反馈

---

## 核心功能亮点

### 🌟 游戏特色

| 特色 | 说明 |
|------|------|
| **双维度猜测** | 同时猜测地点和时间，比传统 GeoGuessr 更具挑战性 |
| **渐进式提示** | 随时间推移逐步展示更多图片，平衡难度与体验 |
| **精准判定** | 位置误差 ≤ 50km 视为精准位置，时间误差 ≤ 1 年视为精准时间 |
| **成就系统** | 9 种成就类型，按 Tier 1-3 阶梯式解锁 |
| **段位系统** | 8 个段位等级（青铜→王者），精准次数累计升级 |
| **答案分析** | 收藏后可查看所有玩家的答题记录分布，地图可视化呈现 |
| **多地图支持** | 支持真实地理地图和虚拟平面坐标系地图（如游戏地图） |
| **离线瓦片** | 支持加载本地地图瓦片，无需依赖网络 |
| **自定义坐标系** | 支持简单平面坐标系，适配任意类型的地图 |

### 🔧 维护系统特色

| 特色 | 说明 |
|------|------|
| **可视化编辑** | 地图上直接拖拽选择点或绘制矩形区域 |
| **智能分类** | 自动根据子分类匹配默认地图配置 |
| **AI 提取** | 调用 LLM API 自动从文本中提取地点和时间信息 |
| **批量操作** | 支持 Excel 批量导入，支持 JSON 批量导出 |
| **版本管理** | 完整的审核状态流转（草稿→待审核→已发布） |
| **众包审核** | 支持多人投票审核，通过后自动发布 |
| **数据备份** | 一键导出完整数据包（图片+数据+附件） |

---

## 项目结构

```
whenwhere/
├── LICENSE                  # MIT 许可证
├── README.md                # 本文件（项目总览）
├── SETUP.md                 # 整体安装指南
├── FLOW.md                  # 整体业务流程
├── start.bat                # Windows 一键启动脚本
├── start.sh                 # Linux/macOS 启动脚本
├── setup.bat                # Windows 一键安装脚本
├── setup.sh                 # Linux/macOS 安装脚本
├── hsd/                     # 🛠 数据维护系统
│   ├── README.md            # HSD 详细文档
│   ├── SETUP.md             # HSD 安装指南
│   ├── FLOW.md              # HSD 业务流程
│   ├── server/              # Express.js 后端
│   │   ├── app.js           # 入口文件
│   │   ├── db.js            # SQLite 数据库连接
│   │   ├── config.json      # 配置文件（LLM API 等）
│   │   ├── routes/          # 路由模块
│   │   ├── utils/           # 工具函数
│   │   └── init-db.js       # 数据库初始化脚本
│   ├── public/              # 前端静态文件
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   ├── db/                  # 数据库文件
│   │   └── hsd.db
│   ├── package.json
│   └── ...
└── ww/                      # 🎮 游戏系统
    ├── README.md            # WW 详细文档
    ├── SETUP.md             # WW 安装指南
    ├── FLOW.md              # WW 业务流程
    ├── server/              # Express.js 后端
    │   ├── app.js           # 入口文件
    │   ├── db.js            # SQLite 数据库连接
    │   ├── config.js        # 游戏参数配置
    │   ├── routes/          # 路由模块
    │   │   ├── game/        # 游戏核心逻辑（模块化）
    │   │   ├── auth.js
    │   │   ├── stats.js
    │   │   └── ...
    │   ├── init-db.js       # 数据库初始化脚本
    │   └── ...
    ├── public/              # 前端静态文件
    │   ├── index.html
    │   ├── css/
    │   └── js/
    │       └── pages/       # 页面模块（按功能拆分）
    ├── static/              # 游戏资源
    │   ├── images/          # 题目图片
    │   ├── tiles/           # 地图瓦片
    │   ├── geojson/         # GeoJSON 数据
    │   └── lib/             # 第三方库
    ├── db/                  # 数据库文件
    │   └── whenwhere.db
    ├── package.json
    └── ...
```

---

## 系统需求

### 硬件需求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 双核 2.0 GHz | 四核 3.0 GHz 以上 |
| 内存 | 4 GB RAM | 8 GB RAM 以上 |
| 磁盘空间 | 5 GB | 20 GB 以上（取决于地图瓦片大小） |
| 网络 | 可选（用于在线地图瓦片） | 宽带网络 |

### 软件需求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | 20.x 或更高 | LTS 版本推荐 |
| npm | 9.x 或更高 | 随 Node.js 安装 |
| 操作系统 | Windows 10+/macOS 10.15+/Linux | 跨平台支持 |
| 浏览器 | Chrome 90+ / Firefox 88+ / Edge 90+ | 现代浏览器 |
| 数据库 | SQLite 3 | 无需单独安装（better-sqlite3 自带） |

### 可选依赖

- **C/C++ 编译器** - Windows 下用于编译 better-sqlite3 原生模块
- **PM2** - 生产环境进程管理
- **Nginx** - 生产环境反向代理
- **LLM API Key** - 用于 HSD AI 智能提取功能

---

## 快速开始

### 方式一：一键安装（推荐 Windows 用户）

```powershell
# 1. 克隆或下载项目
cd whenwhere

# 2. 运行一键安装脚本
setup.bat
```

### 方式二：手动安装

#### 1. 安装 Node.js

从 [Node.js 官网](https://nodejs.org/) 下载安装 LTS 版本。

验证安装：
```bash
node --version  # v20.x
npm --version   # 9.x
```

#### 2. 安装 HSD（维护系统）

```bash
cd hsd
npm install
npm run init-db
```

#### 3. 安装 WW（游戏系统）

```bash
cd ../ww
npm install
npm run init-db
```

#### 4. 启动服务

**启动 HSD（端口 3001）：**
```bash
cd hsd
npm start
```

**启动 WW（端口 3000）：**
```bash
cd ww
npm start
```

#### 5. 访问应用

- HSD 维护系统：`http://localhost:3001`
- WW 游戏系统：`http://localhost:3000`

---

## 子项目说明

### 🎮 WW (WhenWhere Game)

**核心玩法**：
1. 选择感兴趣的主题分类
2. 根据图片线索在地图上点击猜测地点
3. 输入事件发生的年份
4. 30秒内提交答案，或时间到自动提交
5. 系统根据距离误差和时间误差计算得分
6. 查看结果、解锁成就、提升段位

**游戏机制**：
- **得分公式**：距离得分(0-50) + 时间得分(0-50) + 精准奖励(+10) + 耗时加成(1.0~1.5x)
- **精准判定**：距离 ≤ 50km，时间 ≤ 1年
- **段位提升**：累计精准位置数 + 精准时间数
- **成就解锁**：完成特定挑战（如连续精准、累计次数等）

### 🛠 HSD (History Spatio-temporal Data)

**主要功能**：
1. **数据管理**：分类、子分类、地图配置、事件的增删改查
2. **可视化编辑**：地图上直接设置地点、绘制区域
3. **数据导入导出**：支持 Excel 导入、JSON/ZIP 导出
4. **AI 提取**：调用大语言模型自动提取时间地点
5. **众包审核**：题目提交后需多人投票通过才会发布
6. **操作日志**：完整的变更记录，支持审计

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式设计 |
| JavaScript (ES6+) | - | 交互逻辑 |
| [Leaflet.js](https://leafletjs.com/) | 1.9.x | 地图渲染与交互 |
| [FileSaver.js](https://github.com/eligrey/FileSaver.js) | 2.x | 文件下载 |
| [JSZip](https://stuk.github.io/jszip/) | 3.x | ZIP 压缩 |
| [SheetJS](https://sheetjs.com/) | 0.19.x | Excel 处理 |
| [Tailwind CSS](https://tailwindcss.com/) | - | 样式框架（HSD） |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Node.js](https://nodejs.org/) | 20.x | 运行时环境 |
| [Express.js](https://expressjs.com/) | 4.x | Web 框架 |
| [SQLite](https://www.sqlite.org/) | 3.x | 嵌入式数据库 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 11.x | SQLite 高性能驱动 |
| [crypto](https://nodejs.org/api/crypto.html) | - | 加密模块（Token、哈希） |
| [multer](https://github.com/expressjs/multer) | 1.x | 文件上传处理 |

### 数据库设计

**SQLite 数据库**：
- HSD：`hsd/db/hsd.db`
- WW：`ww/db/whenwhere.db`

**核心特点**：
- 零配置，无需单独安装数据库服务
- 支持 WAL 模式，并发性能优异
- 单文件数据库，备份迁移简单
- 支持完整的 ACID 事务
- 支持外键约束、索引优化

---

## 外部依赖

### 前端外部库

WW 项目使用以下第三方库，已包含在 `ww/static/lib/` 目录中：

| 库 | 文件名 | 用途 |
|----|--------|------|
| Leaflet | `leaflet/leaflet.js`, `leaflet/leaflet.css` | 地图渲染 |
| FileSaver | `FileSaver.min.js` | 文件保存 |
| JSZip | `jszip.min.js` | ZIP 压缩 |

### 地图瓦片服务

游戏默认使用在线地图瓦片，也支持自定义瓦片：

| 服务 | URL 模板 | 说明 |
|------|----------|------|
| OpenStreetMap | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | 低缩放使用 |
| 高德地图 | `https://webrd0{s}.is.autonavi.com/appmaptile?...` | 高缩放使用（中国境内推荐） |
| 自定义瓦片 | `/tiles/{map_name}/{z}/{x}/{y}.{ext}` | 放置在 `ww/static/tiles/` 目录 |

### LLM API (HSD AI 功能可选)

HSD 支持使用大语言模型进行智能信息提取，需要配置：

- **OpenAI 兼容 API**：任何兼容 OpenAI API 格式的服务
- **配置文件**：`hsd/server/config.json`

```json
{
  "llm": {
    "apiKey": "your-api-key",
    "baseURL": "https://api.openai.com/v1",
    "model": "gpt-4o-mini"
  }
}
```

---

## 文档索引

### 项目总览（根目录）
- [README.md](README.md) - 本文件，项目总览
- [SETUP.md](SETUP.md) - 整体安装与配置指南
- [FLOW.md](FLOW.md) - 整体业务流程说明
- [LICENSE](LICENSE) - MIT 许可证

### HSD 维护系统
- [hsd/README.md](hsd/README.md) - HSD 功能与技术架构详解
- [hsd/SETUP.md](hsd/SETUP.md) - HSD 安装与配置指南
- [hsd/FLOW.md](hsd/FLOW.md) - HSD 业务流程说明

### WW 游戏系统
- [ww/README.md](ww/README.md) - WW 游戏玩法与技术架构详解
- [ww/SETUP.md](ww/SETUP.md) - WW 安装与配置指南
- [ww/FLOW.md](ww/FLOW.md) - WW 业务流程说明

---

## 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

```
MIT License

Copyright (c) 2026 WhenWhere Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 快速导航

| 操作 | 链接 |
|------|------|
| 🎮 开始游戏 | 启动 WW 服务 → `http://localhost:3000` |
| 🛠 管理题目 | 启动 HSD 服务 → `http://localhost:3001` |
| 📖 游戏玩法 | [ww/README.md](ww/README.md) |
| 🔧 安装配置 | [SETUP.md](SETUP.md) |
| 📊 业务流程 | [FLOW.md](FLOW.md) |

---

**Made with ❤️ by WhenWhere Team**
