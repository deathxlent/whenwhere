# WhenWhere 项目说明文档

## 项目概述

WhenWhere 是一个双应用架构的历史时空数据管理系统。包含两个独立的 B/S 应用：

- **HSD (heshidi)** - 数据维护应用（已实现）
- **WW (whenwhere)** - 数据展示应用（待开发，仅预留目录结构）

两个应用共享同一个 SQLite 数据库和图片存储库，彼此独立运行。

## 目录结构

```
whenwhere/
├── hsd/                          # 维护应用（heshidi）
│   ├── public/                   # 前端静态文件
│   │   ├── css/
│   │   │   └── style.css         # 样式文件
│   │   ├── js/
│   │   │   ├── common.js         # 公共工具函数
│   │   │   └── main.js           # 主页面逻辑
│   │   └── index.html            # 入口页面
│   ├── server/                   # Node.js 后端
│   │   ├── routes/
│   │   │   ├── categories.js     # 分类路由
│   │   │   ├── events.js         # 事件路由
│   │   │   └── images.js         # 图片路由
│   │   ├── app.js                # 应用入口
│   │   ├── db.js                 # 数据库连接
│   │   └── init-db.js            # 数据库初始化脚本
│   ├── package.json              # 依赖配置
│   └── node_modules/             # 依赖包（自动生成）
├── ww/                           # 展示应用（whenwhere）
│   ├── db/
│   │   └── whenwhere.db          # SQLite 数据库文件（共享）
│   └── static/
│       └── images/               # 图片存储目录（共享）
│           └── junior/
│               ├── china/        # 初中/中国史
│               └── world/        # 初中/世界史
├── start-hsd.bat                 # HSD 一键启动脚本（Windows）
├── README.md                     # 项目说明
└── devlog.md                     # 开发日志
```

## 数据库设计

### 表结构

**categories（分类表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| code | TEXT UNIQUE | 分类编码（英文） |
| name | TEXT | 分类名称（中文） |
| sort_order | INTEGER | 排序 |
| is_active | INTEGER | 是否启用 |
| created_at | DATETIME | 创建时间 |

**sub_categories（子分类表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| category_id | INTEGER FK | 关联分类ID |
| code | TEXT | 子分类编码 |
| name | TEXT | 子分类名称 |
| sort_order | INTEGER | 排序 |
| is_active | INTEGER | 是否启用 |
| created_at | DATETIME | 创建时间 |

**events（事件表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| category_id | INTEGER FK | 分类ID |
| sub_category_id | INTEGER FK | 子分类ID |
| title | TEXT | 事件名称 |
| start_date | TEXT | 开始时间 |
| end_date | TEXT | 结束时间 |
| description | TEXT | 说明 |
| location_lat | REAL | 纬度 |
| location_lng | REAL | 经度 |
| location_name | TEXT | 地点名称 |
| image_count | INTEGER | 图片数量 |
| sort_order | INTEGER | 排序 |
| is_active | INTEGER | 是否启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**event_images（事件图片表）**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| event_id | INTEGER FK | 关联事件ID |
| filename | TEXT | 存储文件名 |
| original_name | TEXT | 原始文件名 |
| file_path | TEXT | 相对路径 |
| file_size | INTEGER | 文件大小（字节） |
| sort_order | INTEGER | 排序 |
| created_at | DATETIME | 创建时间 |

### 预置数据

| 分类 | 编码 | 子分类 |
|------|------|--------|
| 初中 | junior | 中国史 (china)、世界史 (world) |
| 高中 | senior | - |
| 人类 | human | - |
| 宇宙 | universe | - |
| 虚拟 | virtual | - |

## 图片存储规则

图片按照分类/子分类/事件ID的层级结构组织：

```
ww/static/images/
└── {category_code}/
    └── {sub_category_code}/
        └── {event_id}/
            ├── 1687123456_abc123.jpg
            ├── 1687123457_def456.png
            └── ...
```

文件名格式：`时间戳_随机数.扩展名`

## HSD 应用功能

### 已实现功能

1. **首页**
   - 5个Tab导航：初中、高中、人类、宇宙、虚拟
   - 高中/人类/宇宙/虚拟 Tab 显示"建设中"占位页

2. **初中模块**
   - 子分类单选：中国史 / 世界史
   - 必须选择子分类后才能进入列表页

3. **列表页**
   - 展示字段：事件、开始时间、结束时间、说明、地点坐标、地点名称、图片个数
   - 操作按钮：图片管理、修改、删除
   - 添加事件功能

4. **事件表单**
   - 事件名称（必填）
   - 开始时间 / 结束时间
   - 说明
   - 地点（纬度、经度、地点名称）
   - 排序

5. **图片管理**
   - 点击/拖拽上传（支持批量，最多20张）
   - 支持格式：JPG、PNG、GIF、WEBP、BMP
   - 单张最大：10MB
   - 图片预览和删除

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取分类列表 |
| GET | /api/categories/:id/sub-categories | 获取子分类列表 |
| GET | /api/events?category_id=&sub_category_id= | 获取事件列表 |
| GET | /api/events/:id | 获取事件详情 |
| POST | /api/events | 添加事件 |
| PUT | /api/events/:id | 修改事件 |
| DELETE | /api/events/:id | 删除事件（软删除） |
| GET | /api/images/event/:eventId | 获取事件图片列表 |
| POST | /api/images/upload | 上传图片 |
| DELETE | /api/images/:id | 删除图片 |
| POST | /api/images/sort | 更新图片排序 |

## 快速开始（HSD）

### 方式一：一键启动（Windows）

双击运行 `start-hsd.bat`，自动完成依赖安装、数据库初始化、启动服务。

### 方式二：手动启动

```bash
# 进入 hsd 目录
cd hsd

# 安装依赖
npm install

# 初始化数据库（首次运行）
npm run init-db

# 启动服务
npm start
```

启动后访问：http://localhost:3001

### 默认端口

- HSD: **3001**
- WW: 待配置

## 技术栈

### HSD 维护应用
- **前端**: 原生 HTML + CSS + JavaScript（无框架）
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **文件上传**: Multer
- **跨域**: CORS

## 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Windows 10/11（启动脚本）或任意支持 Node.js 的系统

## 注意事项

1. 数据库和图片存储在 `ww/` 目录下，是两个应用共享的资源
2. 删除事件为软删除（is_active=0），关联图片记录会被物理删除
3. 图片上传后文件名会重命名，避免冲突
4. 如需备份，复制 `ww/db/whenwhere.db` 和 `ww/static/images/` 即可

## WW 应用（待开发）

WW 目录目前只包含数据库和图片存储目录，前端代码待后续开发。
