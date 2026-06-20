# 何时何地 (WhenWhere) — 图片猜猜看

一款基于地理位置的图片猜谜游戏。玩家根据图片提示，在地图上猜出拍摄地点，并判断拍摄时间。

## 游戏介绍

**何时何地** 是一款考验地理与历史知识的猜图游戏。每轮游戏会展示一张（或多张）图片，您需要在 30 秒内：

1. **猜地点** — 在交互地图上点击你认为的拍摄位置
2. **猜时间** — 输入你认为的拍摄年份（可精确到月/日）
3. **得分** — 系统根据你猜的地点距离正确答案有多远、时间偏差有多大来评分

部分题目仅需猜地点（"仅位置"模式），无需猜时间。

### 特色机制

- **渐进式提示**：倒计时 20 秒时揭示第二张图片，10 秒时揭示第三张图片
- **多类别题库**：支持多个分类和子分类，可自由组合选题
- **自定义地图**：不同子分类可使用不同地图（世界地图、高德卫星图、甚至非地理地图如游戏地图）
- **精准挑战**：距离误差 ≤50km 获"精准位置"成就，时间误差极小获"精准时间"成就
- **排行榜**：按总局数、平均距离、平均时间偏差、平均耗时、精准位置率、精准时间率排名

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 JavaScript（ES6+）、HTML5、CSS3 |
| 地图引擎 | [Leaflet.js](https://leafletjs.com/) v1.9.4 |
| 地图瓦片 | OpenStreetMap、高德地图（矢量/卫星）、自定义瓦片 |
| 后端 | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) |
| 数据库 | [SQLite](https://www.sqlite.org/)（via better-sqlite3） |
| 认证 | AES-256-CBC 加密 Token + SHA-256 哈希 |

## 项目结构

```
ww/
├── server/                  # 后端
│   ├── app.js              # Express 服务入口
│   ├── db.js               # 数据库连接
│   ├── init-db.js          # 数据库初始化脚本
│   └── routes/
│       ├── auth.js         # 注册/登录/Token 验证
│       ├── categories.js   # 分类与子分类 API
│       └── game.js         # 游戏核心逻辑（随机出题、提交答案、统计、排行榜）
├── public/                  # 前端静态文件
│   ├── index.html          # 入口页面
│   ├── js/app.js           # 前端应用（约 1660 行）
│   └── css/style.css       # 样式（暗色主题，响应式）
├── static/                  # 静态资源
│   ├── images/             # 游戏图片（按分类/事件组织）
│   ├── tiles/              # 离线地图瓦片（OSM、自定义地图如 Zelda 地图）
│   ├── geojson/            # GeoJSON 数据（中国省份边界、世界一级行政区标签）
│   └── lib/leaflet/        # Leaflet 库及 TopoJSON 工具
├── db/                      # 数据库
│   └── whenwhere.db        # SQLite 数据库文件
└── package.json
```

## 数据库设计

| 表名 | 说明 |
|------|------|
| `users` | 用户（用户名、Token 哈希、注册/登录时间） |
| `categories` | 游戏分类（如"初级"、"虚拟"等） |
| `sub_categories` | 子分类，关联地图配置（瓦片 URL、缩放范围、CRS 类型等） |
| `events` | 事件/题目（标题、描述、提示、位置坐标、时间戳、是否仅位置） |
| `event_images` | 事件的图片资源 |
| `maps` | 地图配置（瓦片类型、URL、子域名、CRS、边界、缩放范围） |
| `game_stats` | 每日游戏统计（局数、总距离、总时间差、总耗时、精准次数） |

### 时间戳编码

游戏使用紧凑的整数编码存储时间：`YYYYMMDD` 格式。例如 `19491001` 表示 1949 年 10 月 1 日。公元前用负数表示。

## 快速开始

### 前提

- Node.js >= 16

### 安装与运行

```bash
# 安装依赖
npm install

# 初始化数据库（创建表结构）
npm run init-db

# 启动服务
npm start
```

服务启动后访问 `http://localhost:3000`。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册新用户 |
| POST | `/api/auth/login` | 使用 Token 登录 |
| POST | `/api/auth/verify` | 验证加密 Token |
| GET | `/api/categories` | 获取所有可用分类 |
| GET | `/api/categories/:id/sub-categories` | 获取子分类（含地图配置） |
| GET | `/api/game/random-event?sub_codes=...` | 随机获取一道题目 |
| POST | `/api/game/submit` | 提交答案 |
| GET | `/api/game/stats/:userId` | 查看个人统计 |
| GET | `/api/game/leaderboard` | 查看排行榜 |
| GET | `/api/health` | 健康检查 |

## 地图系统

游戏支持多种地图类型，子分类可配置不同的地图：

- **osm** — OpenStreetMap 标准瓦片
- **amap_street** — 高德矢量地图
- **amap_satellite** — 高德卫星混合图
- **custom** — 自定义瓦片 URL（支持 CRS.Simple 平面坐标系，用于非地理地图如游戏地图）
- **hybrid**（默认）— 低缩放使用 OSM，高缩放使用高德矢量

非地理地图（如 Zelda 地图）使用 Leaflet 的 `CRS.Simple` 平面坐标系，并支持边界限制。
