# WhenWhere 项目说明文档

## 项目概述

WhenWhere 是一个双应用架构的历史时空数据管理和交互游戏系统。包含两个独立的 B/S 应用：

- **HSD (heshidi)** - 历史数据维护应用（数据管理端）
- **WW (whenwhere)** - 时空猜谜游戏应用（用户交互端）

两个应用共享同一个 SQLite 数据库和图片存储库，彼此独立运行。

## 目录结构

```
whenwhere/
├── hsd/                          # 维护应用（heshidi）
│   ├── public/                   # 前端静态文件
│   │   ├── css/style.css         # 样式文件
│   │   ├── js/common.js          # 公共工具函数
│   │   ├── js/main.js            # 主页面逻辑
│   │   └── index.html            # 入口页面
│   ├── server/                   # Node.js 后端
│   │   ├── routes/
│   │   │   ├── categories.js     # 类别/子类别 CRUD
│   │   │   ├── events.js         # 事件 CRUD
│   │   │   ├── images.js         # 图片管理
│   │   │   └── maps.js           # 地图管理
│   │   ├── app.js                # 应用入口（端口3001）
│   │   ├── db.js                 # 数据库连接
│   │   └── init-db.js            # 数据库初始化脚本
│   └── package.json
├── ww/                           # 游戏应用（whenwhere）
│   ├── public/                   # 前端静态文件
│   │   ├── css/style.css         # 样式文件
│   │   ├── js/app.js             # 游戏主逻辑
│   │   ├── lib/leaflet/          # Leaflet地图库
│   │   ├── tiles/osm/            # 本地OSM瓦片
│   │   ├── geojson/              # GeoJSON数据
│   │   │   ├── china_provinces.json
│   │   │   └── world_admin1_labels.json
│   │   └── index.html            # 入口页面
│   ├── server/                   # Node.js 后端
│   │   ├── routes/
│   │   │   ├── auth.js           # 登录/注册
│   │   │   ├── game.js           # 游戏逻辑/统计
│   │   │   └── categories.js     # 类别/子类别查询
│   │   ├── app.js                # 应用入口（端口3002）
│   │   └── db.js                 # 数据库连接
│   ├── db/whenwhere.db           # SQLite 数据库（共享）
│   └── static/images/            # 图片存储（共享）
├── start-hsd.bat                 # HSD 一键启动
├── start-ww.bat                  # WW 一键启动
├── README.md                     # 项目说明
└── devlog.md                     # 开发日志
```

## 数据库设计

### 表结构

**maps（地图配置表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT | 地图名称 |
| code | TEXT UNIQUE | 地图编码 |
| description | TEXT | 描述 |
| tile_type | TEXT | 瓦片类型：hybrid/osm/amap_street/amap_satellite/custom |
| tile_url | TEXT | 自定义瓦片URL |
| tile_subdomains | TEXT | 瓦片子域名（逗号分隔） |
| min_zoom | INTEGER | 最小缩放 |
| max_zoom | INTEGER | 最大缩放 |
| sort_order | INTEGER | 排序 |
| is_active | INTEGER | 是否启用 |

**categories（类别表-大类）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| code | TEXT UNIQUE | 编码 |
| name | TEXT | 名称 |
| sort_order | INTEGER | 排序 |
| is_active | INTEGER | 是否启用 |

**sub_categories（子类别表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| category_id | INTEGER FK | 所属大类ID |
| code | TEXT | 编码 |
| name | TEXT | 名称 |
| sort_order | INTEGER | 排序 |
| is_active | INTEGER | 是否启用 |
| map_id | INTEGER FK | 绑定地图ID |
| center_lat | REAL | 中心点纬度 |
| center_lng | REAL | 中心点经度 |
| default_zoom | INTEGER | 默认缩放 |
| min_zoom | INTEGER | 子类最小缩放 |
| max_zoom | INTEGER | 子类最大缩放 |

**events（事件表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| category_id | INTEGER FK | 大类ID |
| sub_category_id | INTEGER FK | 子类别ID |
| title | TEXT | 事件名称 |
| start_ts / end_ts | INTEGER | 编码时间戳 |
| start_precision / end_precision | INTEGER | 时间精度 |
| description | TEXT | 说明 |
| location_lat / location_lng | REAL | 坐标 |
| location_name | TEXT | 地点名称 |
| image_count | INTEGER | 图片数 |
| is_active | INTEGER | 是否启用 |

**event_images（事件图片表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| event_id | INTEGER FK | 事件ID |
| filename / original_name / file_path | TEXT | 文件信息 |
| sort_order | INTEGER | 排序 |

**users（用户表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| username / password_hash / nickname | TEXT | 用户信息 |

**user_stats（用户统计表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| user_id | INTEGER FK | 用户ID |
| total_games / total_distance / total_time_diff | INTEGER/REAL | 统计值 |
| precise_location_count / precise_time_count | INTEGER | 精准次数 |

### 预置默认数据

- 地图：世界地图、中国地图
- 大类：初中、高中、人类、宇宙、虚拟
- 初中子类：中国史（绑定中国地图）、世界史（绑定世界地图）

## 核心业务规则

### 子类别与地图绑定
- **子类必须绑定地图**才能在WW中显示并游玩
- **大类有地图时**，可添加维护子类别和事件（与原有初中模块一致）
- **子类有事件 + 绑地图** → WW对应Tab显示可玩
- **子类无事件或无地图** → WW显示"建设中"

### 地图管理规则
- 可新增、删除地图
- **已绑定子类的地图不可修改/删除**（防止数据异常）
- 地图可配置：瓦片类型、URL、子域名、缩放范围

### 子类别地图配置
每个子类别可独立配置地图参数：
- 中心点经纬度（默认视图中心）
- 默认缩放级别
- 最小/最大缩放限制（与地图本身限制取交集）

### 精准判断规则
- **位置精准**：猜测点距离事件点 ≤ 50公里，统计时距离误差算0
- **时间精准**：|猜测时间 - 事件时间| ≤ Y × 1%，Y = |事件时间 - 2026|
  - 例：事件1926年，Y=100年 → 100×1%=1年 → 1925~1927都算精准

## HSD 应用功能（端口3001）

### 导航结构
- 🏠 首页 → 各类别入口卡片（显示可用子类数/事件数）
- 📂 类别管理 → 大类列表 → 子类CRUD → 事件维护
- 🗺️ 地图管理 → 地图增删（已绑子类的地图只读）

### 类别管理
- **大类**：增删改查，配置排序
- **子类**：增删改查，必须绑定地图，配置中心点/缩放参数
- **事件维护**：进入子类后，列表视图 + 地图添加视图
  - 地图添加：点击地图选点，弹窗填表单，支持图片上传
  - 列表页：展示全部字段，修改/删除/图片管理

### 地图管理
- 新增地图：名称、编码、瓦片类型、URL、缩放范围等
- 删除地图：仅未绑定子类的可删
- 已绑定地图：灰色锁定状态，不可编辑

## WW 应用功能（端口3002）

### 用户系统
- 注册/登录（默认测试账号：admin/123456, user1/123456, user2/123456）
- 个人统计：局数、平均距离、平均时间误差、精准率

### 游戏流程
1. **主页面Tab动态加载**：从API获取大类，只有有可用子类的大类才显示或可玩
2. **子类别多选**：勾选要玩的子类（默认全选，显示事件数量）
3. **开始游戏**：30秒倒计时，侧边栏显示图片（可按E隐藏，空格下一张）
4. **地图交互**：点击地图选点，时间输入（年/月/日精度）
5. **提交结果**：
   - 地图连线显示猜测点→事件点
   - 距离、时间差、耗时
   - 精准位置/精准时间判定（绿色标签）
   - 事件名称、时间、地点、说明、全图

### 排行榜
- 6种排行：玩最多局、距离最近、时间最准、耗时最少、精准位置、精准时间
- 4种周期：全部、本周、本月、本年

### 动态Tab规则
- 大类下有「已绑地图 + 有事件」的子类 → 正常显示并可玩
- 其他所有情况 → 显示「🏗️ 建设中，敬请期待...」

## API 接口总览

### HSD API (3001)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | /api/categories | 大类CRUD |
| GET/POST/PUT/DELETE | /api/categories/:id/sub-categories | 子类CRUD |
| GET | /api/maps | 地图列表（含绑定数量） |
| POST | /api/maps | 新增地图 |
| PUT | /api/maps/:id | 修改地图（仅未绑子类） |
| DELETE | /api/maps/:id | 删除地图（仅未绑子类） |
| GET/POST/PUT/DELETE | /api/events | 事件CRUD |
| GET/POST/DELETE | /api/images | 图片管理 |

### WW API (3002)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register, /api/auth/login | 账号 |
| GET | /api/categories, /api/categories/:id/sub-categories | 类别查询 |
| GET | /api/game/random-event | 随机事件 |
| POST | /api/game/submit-answer | 提交答案（返回评分） |
| GET | /api/stats/leaderboard, /api/stats/personal | 统计排行 |

## 快速开始

### HSD 启动

```bash
cd hsd && npm install && npm run init-db && npm start
```
或双击 `start-hsd.bat`
访问：http://localhost:3001

### WW 启动

```bash
cd ww && npm install && npm start
```
或双击 `start-ww.bat`
访问：http://localhost:3002

### 默认端口
- HSD: **3001**
- WW: **3002**

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端 | 原生 HTML + CSS + JavaScript（无框架） |
| 地图 | Leaflet.js + OSM/高德瓦片 + 本地瓦片 |
| 后端 | Node.js + Express |
| 数据库 | SQLite (better-sqlite3) |
| 文件上传 | Multer |
| 样式 | 统一系统字体（system-ui, sans-serif） |

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Windows 10/11 或任意支持 Node.js 的系统

## 注意事项

1. 数据库和图片存储在 `ww/` 目录下，两应用共享
2. 删除事件为软删除（is_active=0），图片为硬删除
3. 地图一旦被子类绑定不可修改或删除，保证数据一致性
4. 备份：复制 `ww/db/whenwhere.db` 和 `ww/static/images/`
5. WW的Tab完全动态，新增子类有事件后无需改代码自动出现
