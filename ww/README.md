# 何时何地 (WhenWhere) — 图片猜猜看

## 🎮 游戏简介

**何时何地 (WhenWhere)** 是一款基于地理位置和历史时间的图片猜谜游戏。玩家根据给出的图片提示，在交互地图上猜出拍摄/发生地点，并判断事件发生的时间，考验你的地理与历史知识储备！

### 核心玩法

每轮游戏限时 30 秒，玩家需要完成两个挑战：

1. **📍 猜地点** — 在交互式地图上点击你认为的正确位置
2. **📅 猜时间** — 输入你认为的事件发生年份（可精确到月/日）

部分题目为「仅位置」模式，只需猜测地点，无需判断时间。

### 游戏特色

| 特色 | 说明 |
|------|------|
| ⏱️ **渐进式提示** | 倒计时 20 秒揭示第二张图片，10 秒揭示第三张图片，越晚给出的提示越明显 |
| 🎯 **精准挑战** | 距离误差 ≤50km 获得「精准位置」，时间误差极小获得「精准时间」 |
| 🗺️ **多地图支持** | 世界地图、中国卫星图、甚至游戏地图（如堡垒之夜），不同题库不同地图 |
| 📊 **多维排行榜** | 6 个维度的排行榜，总有一个你能上榜 |
| 🏅 **成就系统** | 8 个段位 + 多级成就，从青铜到王者，见证你的成长 |
| ❤️ **收藏功能** | 收藏感兴趣的题目，随时复习查看 |
| 👥 **答案分析** | 查看其他玩家的答题记录，对比自己的答案 |
| 🗳️ **投票反馈** | 为题目点赞/点踩，帮助优化题库质量 |

---

## 🏆 游戏系统详解

### 1. 积分与段位系统

#### 积分规则

每次答题根据以下因素计算得分：

| 因素 | 计分方式 |
|------|---------|
| **距离误差** | 误差越小得分越高，使用半对数函数计算 |
| **时间误差** | 误差越小得分越高，按年数差计算 |
| **答题耗时** | 用时越短加成越高（最高 1.5 倍） |
| **精准奖励** | 精准位置 +5 分，精准时间 +5 分 |
| **难度系数** | 不同分类题目有不同的难度系数 |

#### 段位等级

| 段位 | 图标 | 颜色 | 所需积分 |
|------|------|------|---------|
| 未定级 | ⚪ | #9ca3af | 0 |
| 青铜 | 🥉 | #cd7f32 | 1 |
| 白银 | 🥈 | #c0c0c0 | 3 |
| 黄金 | 🥇 | #ffd700 | 6 |
| 铂金 | 💎 | #e5e4e2 | 10 |
| 钻石 | 💠 | #b9f2ff | 15 |
| 大师 | 🏆 | #ff4500 | 20 |
| 王者 | 👑 | #ff1493 | 30 |

### 2. 成就系统

成就分为三个类型，按等级（Tier）分级：

| 成就类型 | 说明 | 目标值示例 |
|----------|------|-----------|
| **精准位置** | 累计精准位置次数 | 1 / 5 / 20 / 50 / 100 |
| **精准时间** | 累计精准时间次数 | 1 / 5 / 20 / 50 / 100 |
| **游戏场次** | 累计完成游戏次数 | 10 / 50 / 200 / 500 / 1000 |
| **连续不精准** | 连续未获得精准的次数 | 10 / 20 / 50 |

每个成就有独特的图标、名称和描述，解锁后会在游戏结束时弹窗提示。

### 3. 排行榜系统

提供 **6 个维度** 的排行榜，支持按时间段筛选（全部/本周/本月/本年）：

| 排行榜 | 排序规则 | 说明 |
|--------|---------|------|
| **总局数** | 降序 | 谁玩得最多 |
| **平均距离** | 升序 | 谁地点猜得最准 |
| **平均时间差** | 升序 | 谁时间猜得最准 |
| **平均耗时** | 升序 | 谁答题最快 |
| **精准位置率** | 降序 | 谁最常获得精准位置 |
| **精准时间率** | 降序 | 谁最常获得精准时间 |

每个排行榜显示 Top 10 玩家。

### 4. 个人统计系统

多维度统计你的游戏表现：

#### 汇总统计
- 总局数
- 平均距离误差（km）
- 平均时间误差（年）
- 平均耗时（秒）
- 总距离误差（km）
- 总时间误差（年）
- 总耗时
- 精准位置总次数 / 概率
- 精准时间总次数 / 概率

#### 每日明细
- 按日期展示最近 365 天的游戏数据
- 每日的局数、总距离、总时间差、总耗时
- 每日的精准位置次数、精准时间次数

#### 时间段筛选
- 全部
- 本周
- 本月
- 本年

### 5. 收藏与答案分析

#### 收藏功能
- 游戏结束时可收藏当前题目
- 收藏页支持关键词搜索
- 每个收藏题目显示：标题、图片、分类、正确地点/时间

#### 答案分析（核心亮点）

点击收藏题目的「查看别人怎么答」按钮，进入答案分析页面：

**地图展示**
- 🟢 **绿色标记**：正确答案（点或矩形区域）
- 🔵 **蓝色标记**：你自己的最新答案（如果有）
- 🔴 **红色标记**：其他 50 名玩家的答题记录，悬停显示用户名和误差

**可拖动浮动面板**
- 事件详情：标题、描述、分类、正确地点/时间
- 统计信息：平均距离误差、平均时间误差、精准位置率
- 你的答案对比：
  - 地点误差对比
  - 时间误差对比
  - 你的排名百分位

### 6. 投票系统

- 每道题目可点赞（👍）或点踩（👎）
- 投票后显示当前题目的投票统计
- 帮助系统识别优质/劣质题目

### 7. 题目分类系统

#### 分类层级
```
分类 (Category)
  └── 子分类 (Sub Category)
        ├── 地图配置
        │   ├── 瓦片类型
        │   ├── 缩放范围
        │   ├── 坐标系
        │   └── 边界限制
        └── 题目 (Events)
              ├── 图片（多张）
              ├── 时间戳
              ├── 位置坐标
              └── 精度设置
```

#### 支持的地图类型

| 地图类型 | 说明 | 坐标系 |
|---------|------|--------|
| **osm** | OpenStreetMap 标准瓦片 | EPSG3857 |
| **amap_street** | 高德矢量地图 | EPSG3857 |
| **amap_satellite** | 高德卫星混合图 | EPSG3857 |
| **hybrid** | 低缩放 OSM，高缩放高德（默认） | EPSG3857 |
| **custom** | 自定义瓦片（支持游戏地图等） | EPSG3857 或 Simple |

#### 特殊地图示例
- **堡垒之夜地图**：使用 CRS.Simple 平面坐标系，瓦片离线存储
- **中国省份边界**：GeoJSON 叠加显示省级行政区标签

### 8. 渐进式提示机制

```
30s ─────────────────────────── 0s
  │         │         │
  │         │         └── 10s：显示第 3 张图片（最明显的提示）
  │         │
  │         └── 20s：显示第 2 张图片
  │
  └── 开始：显示第 1 张图片 + 标题 + 描述
```

每张图片可设置独立的标题和描述，在对应时间点显示。

### 9. 时间戳编码

使用紧凑的整数编码存储时间：**`YYYYMMDD`** 格式

| 时间 | 编码 | 精度 |
|------|------|------|
| 1949年 | 19490000 | 年 |
| 1949年10月 | 19491000 | 年月 |
| 1949年10月1日 | 19491001 | 年月日 |
| 公元前221年 | -2210000 | 年（负数表示公元前） |

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端** | 原生 JavaScript (ES6+) | - |
| **UI 框架** | HTML5 + CSS3（无框架） | - |
| **地图引擎** | [Leaflet.js](https://leafletjs.com/) | 1.9.4 |
| **瓦片源** | OpenStreetMap / 高德地图 / 自定义瓦片 | - |
| **后端** | [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) | Express 4.18.2 |
| **数据库** | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | better-sqlite3 11.x |
| **认证** | AES-256-CBC 加密 Token + SHA-256 哈希 | - |
| **包管理** | npm | - |

### 项目结构

```
ww/
├── server/                          # 后端服务
│   ├── app.js                      # Express 服务入口 (端口 3000)
│   ├── db.js                       # 数据库连接 + game_answers 表
│   ├── init-db.js                  # 数据库初始化脚本
│   ├── config.js                   # 配置文件
│   ├── achievement-helper.js       # 段位配置 + 辅助函数
│   └── routes/
│       ├── app.js                  # 总路由入口
│       ├── auth.js                 # 认证（注册/登录/Token验证）
│       ├── categories.js           # 分类与子分类 API
│       ├── achievements.js         # 成就系统 API
│       └── game/                   # 游戏核心逻辑（模块化拆分）
│           ├── utils.js            # 时间工具函数
│           ├── geography.js        # 地理计算（Haversine、边界扩展）
│           ├── achievements.js     # 成就检查与更新
│           ├── stats.js            # 用户统计 + 排行榜
│           ├── votes.js            # 投票功能
│           ├── favorites.js        # 收藏功能
│           ├── events.js           # 核心游戏逻辑（随机出题、答案提交）
│           ├── answers.js          # 答案记录查询
│           └── game.js             # 路由入口（9个API端点）
├── public/                          # 前端静态文件
│   ├── index.html                  # 入口页面（模块化加载）
│   ├── css/style.css               # 全局样式（暗色主题）
│   └── js/
│       ├── app.js                  # 前端应用入口
│       ├── config.js               # 前端配置
│       ├── state.js                # 全局状态管理
│       ├── utils.js                # 工具函数
│       ├── map.js                  # 地图初始化与瓦片加载
│       ├── game.js                 # 游戏状态与通用函数
│       ├── ui.js                   # UI 入口（模块化拆分后仅存骨架）
│       ├── common.js               # 通用 UI 工具（模态框、媒体播放）
│       └── pages/                  # 页面模块（按功能拆分）
│           ├── login.js            # 登录/注册页面
│           ├── main.js             # 主页面（排行榜+分类选择+用户菜单）
│           ├── game.js             # 游戏页面（地图+计时器+图片展示）
│           ├── result.js           # 结果页面（得分+成就+地图展示）
│           ├── favorites.js        # 收藏页面（搜索+列表+查看答案）
│           ├── answers.js          # 答案分析页面（地图+浮动面板）
│           ├── stats.js            # 个人统计页面（多维度数据）
│           └── achievements.js     # 成就系统页面（段位+成就列表+历史）
├── static/                          # 静态资源（与 HSD 共享）
│   ├── images/                     # 游戏图片（按分类/事件组织）
│   │   ├── category_1/
│   │   │   ├── event_123/
│   │   │   │   ├── 1.jpg
│   │   │   │   ├── 2.jpg
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── ...
│   ├── tiles/                      # 离线地图瓦片
│   │   ├── fortnite/              # 堡垒之夜地图瓦片
│   │   │   ├── 1/                 # zoom level 1
│   │   │   ├── 2/
│   │   │   └── ...
│   │   └── ...
│   ├── geojson/                    # GeoJSON 数据
│   │   └── china_provinces.json   # 中国省份边界
│   └── lib/leaflet/               # Leaflet 库及插件
│       ├── leaflet.js
│       ├── leaflet.css
│       └── topojson.js
├── db/
│   └── whenwhere.db               # SQLite 数据库（WAL 模式）
├── package.json
├── README.md                       # 本文档
├── SETUP.md                        # 安装配置指南
└── FLOW.md                         # 业务流程说明
```

### 前端模块加载流程

```
index.html
  ├── /lib/leaflet/leaflet.css
  ├── /css/style.css
  ├── /lib/leaflet/leaflet.js
  ├── /js/config.js
  ├── /js/utils.js
  ├── /js/state.js
  ├── /js/map.js
  ├── /js/game.js
  ├── /js/pages/common.js
  ├── /js/pages/login.js
  ├── /js/pages/main.js
  ├── /js/pages/game.js
  ├── /js/pages/result.js
  ├── /js/pages/favorites.js
  ├── /js/pages/answers.js
  ├── /js/pages/stats.js
  ├── /js/pages/achievements.js
  ├── /js/ui.js
  └── /js/app.js
```

### 后端 API 架构

```
Express App (port 3000)
  ├── 静态文件服务
  │   ├── / → public/
  │   ├── /images → static/images/
  │   ├── /geojson → static/geojson/
  │   ├── /tiles → static/tiles/
  │   └── /lib → static/lib/
  │
  └── API 路由
      ├── /api/auth/*
      │   ├── POST /register        # 注册新用户
      │   ├── POST /login           # Token 登录
      │   └── POST /verify          # 验证加密 Token
      │
      ├── /api/categories/*
      │   ├── GET /                 # 获取所有分类
      │   └── GET /:id/sub-categories  # 获取子分类（含地图配置）
      │
      ├── /api/achievements/*
      │   ├── GET /list             # 成就列表
      │   ├── GET /user/:userId     # 用户成就
      │   └── GET /history/:userId  # 段位历史
      │
      └── /api/game/*
          ├── GET /random-event     # 随机获取题目
          ├── POST /submit          # 提交答案
          ├── GET /stats/:userId    # 个人统计
          ├── GET /leaderboard      # 排行榜
          ├── POST /vote            # 提交投票
          ├── GET /vote/:eventId    # 获取投票统计
          ├── POST /favorite        # 切换收藏
          ├── GET /favorites/:userId  # 获取收藏列表
          ├── GET /favorite/check/:eventId  # 检查收藏状态
          └── GET /event/:eventId/answers   # 获取答案记录
```

### 数据库设计

#### 核心表结构

| 表名 | 主要字段 | 说明 |
|------|---------|------|
| **users** | id, username, token_hash, registered_at, last_login_at | 用户表 |
| **categories** | id, code, name, sort_order | 分类表 |
| **sub_categories** | id, category_id, map_id, code, name, center_lat, center_lng, default_zoom, min_zoom, max_zoom | 子分类表 |
| **maps** | id, code, name, tile_type, tile_url, tile_subdomains, crs_type, bounds_*, tile_size, min_zoom, max_zoom, distance_unit, distance_scale | 地图配置表 |
| **events** | id, category_id, sub_category_id, title, description, start_ts, start_precision, location_lat, location_lng, location_north, location_south, location_east, location_west, location_name, location_type, location_only, sort_order, created_at | 事件/题目表 |
| **event_images** | id, event_id, url, title, description, display_order, reveal_seconds | 事件图片表 |
| **game_stats** | id, user_id, stat_date, games_played, total_distance, total_time_diff, total_elapsed, precise_location_count, precise_time_count | 每日游戏统计表 |
| **game_sessions** | user_id, precise_location, precise_time, precise_both, neither_precise_streak, max_neither_streak | 游戏会话表（成就进度） |
| **game_answers** | id, user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, distance_km, time_diff_years, precise_location, precise_time, timed_out, elapsed_seconds, created_at | 答题记录表 |
| **achievements** | id, code, name, description, icon, tier, type, target_value | 成就定义表 |
| **user_achievements** | id, user_id, achievement_id, current_value, unlocked_at | 用户成就表 |
| **rank_history** | id, user_id, rank_level, score, month_key, achieved_at | 段位历史表 |
| **votes** | id, user_id, event_id, vote_type, created_at | 投票表 |
| **favorites** | id, user_id, event_id, created_at | 收藏表 |

#### 关键索引

```sql
-- 答题记录
CREATE INDEX idx_game_answers_event ON game_answers(event_id);
CREATE INDEX idx_game_answers_user ON game_answers(user_id);
CREATE INDEX idx_game_answers_user_event ON game_answers(user_id, event_id);

-- 游戏统计
CREATE INDEX idx_game_stats_user_date ON game_stats(user_id, stat_date);

-- 投票
CREATE UNIQUE INDEX idx_votes_user_event ON votes(user_id, event_id);

-- 收藏
CREATE UNIQUE INDEX idx_favorites_user_event ON favorites(user_id, event_id);
```

### 核心算法

#### 1. Haversine 距离计算

计算两点间的球面距离（单位：km）：

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;  // 地球半径 km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

#### 2. 点到矩形边界的距离

用于判断点选在矩形区域内还是区域外，以及计算距离：

```javascript
function distanceToRectBounds(guessLat, guessLng, lat1, lng1, lat2, lng2) {
  // 计算矩形边界
  const north = Math.max(lat1, lat2);
  const south = Math.min(lat1, lat2);
  const east = Math.max(lng1, lng2);
  const west = Math.min(lng1, lng2);

  // 如果点在矩形内，计算到最近边的距离
  if (guessLat >= south && guessLat <= north && guessLng >= west && guessLng <= east) {
    const distToNorth = haversineDistance(guessLat, guessLng, north, guessLng);
    const distToSouth = haversineDistance(guessLat, guessLng, south, guessLng);
    const distToEast = haversineDistance(guessLat, guessLng, guessLat, east);
    const distToWest = haversineDistance(guessLat, guessLng, guessLat, west);
    return Math.min(distToNorth, distToSouth, distToEast, distToWest);
  }

  // 如果点在矩形外，计算到最近顶点/边的距离
  let closestLat = guessLat;
  let closestLng = guessLng;
  if (guessLat < south) closestLat = south;
  else if (guessLat > north) closestLat = north;
  if (guessLng < west) closestLng = west;
  else if (guessLng > east) closestLng = east;

  return haversineDistance(guessLat, guessLng, closestLat, closestLng);
}
```

#### 3. 得分计算

综合距离误差、时间误差、耗时计算最终得分：

```javascript
function calculateScore(distanceKm, timeDiffYears, elapsedSeconds, isLocationOnly) {
  let score = 0;
  
  // 距离得分：半对数函数，0km得50分，500km得0分
  const distanceScore = Math.max(0, 50 * (1 - Math.log10(distanceKm + 1) / Math.log10(501)));
  
  // 时间得分（如果不是仅位置模式）
  let timeScore = 0;
  if (!isLocationOnly) {
    // 0年差得50分，50年差得0分
    timeScore = Math.max(0, 50 * (1 - Math.log10(timeDiffYears + 1) / Math.log10(51)));
  } else {
    // 仅位置模式满分100分都来自距离
    const distanceScore = Math.max(0, 100 * (1 - Math.log10(distanceKm + 1) / Math.log10(501)));
  }
  
  // 耗时加成：30秒用完1.0倍，0秒1.5倍
  const timeMultiplier = 1 + (30 - Math.min(elapsedSeconds, 30)) / 30 * 0.5;
  
  score = (distanceScore + timeScore) * timeMultiplier;
  return Math.round(score);
}
```

---

## 🎯 游戏页面功能详解

### 登录页面
- 用户名 + Token 登录
- 新用户自动注册
- Token 自动保存到 localStorage
- 支持 Token 复制

### 主页面

**顶部导航**
- 用户名与当前段位显示
- 下拉菜单：我的统计、成就系统、我的收藏、退出登录

**分类选择**
- 展示所有可用分类
- 点击展开/收起子分类
- 多子分类可复选，支持组合出题
- 每个子分类显示对应的地图预览图标

**排行榜 Tab**
- 6 个维度排行榜切换
- 时间段筛选（全部/本周/本月/本年）
- 前三名高亮显示

**开始游戏按钮**
- 至少选择一个子分类才能开始
- 显示已选子分类数量

### 游戏页面

**左侧地图区域**
- 自适应大小的 Leaflet 地图
- 根据子分类配置自动切换瓦片源
- 支持省级行政区标签叠加
- 点击地图放置猜测标记
- 可拖拽、缩放

**右侧边栏**
- **计时器**：30秒倒计时进度条 + 数字显示
- **媒体展示**：
  - 图片自动轮播（按 reveal_seconds 配置）
  - 视频自动播放（如果有）
  - 音频播放（如果有）
  - 文字提示（按时间点显示）
- **时间输入**：年份输入框（精确到年/月/日取决于题目精度）
- **操作按钮**：放弃、再来一局
- **可折叠侧栏**：点击箭头展开/收起

### 结果页面

**得分展示**
- 总得分（大号字体）
- 距离得分 + 时间得分明细
- 耗时加成显示
- 精准奖励（如果有）

**成就解锁弹窗**
- 本轮新解锁的成就列表
- 成就图标、名称、描述
- 可关闭

**地图展示**
- 显示正确位置（绿色）和你的猜测位置（红色）
- 两点间连线显示
- 显示距离误差数值

**统计对比**
- 距离误差对比
- 时间误差对比
- 你的耗时

**操作按钮**
- 再来一局
- 收藏题目
- 查看别人怎么答
- 返回主页

### 收藏页面

**搜索栏**
- 关键词实时搜索（300ms 防抖）
- 搜索标题、描述、地点名称

**列表展示**
- 卡片式布局
- 显示题目缩略图、标题、分类
- 显示正确地点和时间
- 每个卡片操作按钮：
  - 开始游戏（从收藏的题目开始）
  - 查看别人怎么答
  - 取消收藏

### 答案分析页面

**全幅地图**
- 显示正确答案区域（绿色）
- 显示你的最新答案（蓝色标记）
- 显示其他 50 名玩家的答案（红色标记）
- 悬停标记显示详情：用户名、距离误差、时间误差

**可拖动浮动面板**
- 标题栏可拖动，放在任意位置
- 内容包括：
  - 事件详情（标题、描述、图片）
  - 正确答案（地点、时间）
  - 统计信息（平均误差、精准率）
  - 你的答案对比（距离、时间、排名百分位）
- 可关闭面板

### 个人统计页面

**时间段 Tab**
- 全部 / 本周 / 本月 / 本年

**统计卡片**
- 第一行（4项）：总局数、平均距离、平均时间差、平均耗时
- 第二行（7项）：总距离、总时间差、总耗时、精准位置总次数、精准位置率、精准时间总次数、精准时间率

**每日明细列表**
- 按日期倒序排列
- 每天的局数、平均距离、平均时间差、精准次数

### 成就系统页面

**顶部统计**
- 已解锁成就数 / 总成就数
- 当前段位（图标 + 名称 + 颜色）
- 本月精准位置次数
- 本月精准时间次数

**下一段位进度**
- 下一段位名称和所需积分
- 进度条显示当前进度
- 距离下一段位还差多少分

**成就列表**
- 按类型分组（精准位置、精准时间、游戏场次）
- 每个成就显示：图标、名称、描述、等级
- 已解锁成就高亮
- 未解锁成就显示当前进度和目标值

**段位历史**
- 按月展示段位变化
- 每月的段位、积分、获得时间

---

## ⚙️ 系统需求

### 服务器端

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| **操作系统** | Windows 10 / macOS 11 / Linux (Ubuntu 20.04) | 同最低要求 |
| **Node.js** | >= 16.x | >= 20.x LTS |
| **内存** | >= 256MB | >= 1GB |
| **磁盘空间** | >= 50MB（不含图片和瓦片） | >= 500MB |
| **网络** | 如需访问在线瓦片地图需要外网 | 同最低要求 |

### 客户端

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| **浏览器** | Chrome 90+ / Firefox 88+ / Edge 90+ / Safari 14+ | 最新版 Chrome/Edge |
| **屏幕分辨率** | >= 1024 x 768 | >= 1920 x 1080 |
| **内存** | >= 512MB | >= 2GB |
| **网络** | 加载地图瓦片需要稳定网络 | 宽带/4G+ |

### 外部依赖

| 依赖 | 版本 | 用途 | 许可证 |
|------|------|------|--------|
| [express](https://expressjs.com/) | ^4.18.2 | Web 框架 | MIT |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | ^11.0.0 | SQLite 数据库 | MIT |
| [cookie-parser](https://github.com/expressjs/cookie-parser) | ^1.4.6 | Cookie 解析 | MIT |
| [cors](https://github.com/expressjs/cors) | ^2.8.5 | 跨域支持 | MIT |
| [crypto](https://nodejs.org/api/crypto.html) | 内置 | 加密解密 | Node.js |
| [Leaflet.js](https://leafletjs.com/) | ^1.9.4 | 交互式地图 | BSD-2-Clause |

#### 地图瓦片服务（可选，在线使用时需要）

| 服务 | 用途 | 备注 |
|------|------|------|
| **OpenStreetMap** | 标准地图瓦片 | 免费，需遵守 [使用政策](https://operations.osmfoundation.org/policies/tiles/) |
| **高德地图** | 中国地区矢量/卫星图 | 免费公共服务，需注意使用限制 |

---

## 🚀 快速开始

### 1. 安装 Node.js

从 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本（推荐 20.x 或更高）。

验证安装：
```bash
node --version
npm --version
```

### 2. 安装依赖

```bash
cd ww
npm install
```

### 3. 初始化数据库

```bash
npm run init-db
```

这会创建 `db/whenwhere.db` 并初始化所有表结构。

### 4. 准备游戏数据

使用配套的 [HSD 维护系统](../hsd/README.md) 添加题目数据，或从现有导出包导入。

### 5. 启动服务

```bash
npm start
```

服务启动后，在浏览器访问：`http://localhost:3000`

### 6. 开始游戏

1. 输入用户名，点击「登录/注册」
2. 选择感兴趣的分类和子分类
3. 点击「开始游戏」
4. 根据图片提示，在地图上点击猜测位置，输入年份
5. 查看得分和结果，继续下一局

---

## 🔌 API 接口文档

### 认证 API

#### POST `/api/auth/register`

注册新用户。

**请求体：**
```json
{
  "username": "player1"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "username": "player1",
    "token": "encrypted_token_string"
  }
}
```

#### POST `/api/auth/login`

使用 Token 登录。

**请求体：**
```json
{
  "token": "encrypted_token_string"
}
```

#### POST `/api/auth/verify`

验证 Token 有效性。

### 分类 API

#### GET `/api/categories`

获取所有分类及子分类。

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "china_history",
      "name": "中国历史",
      "sort_order": 1,
      "sub_categories": [
        {
          "id": 1,
          "code": "ancient",
          "name": "古代史",
          "map_config": { ... }
        }
      ]
    }
  ]
}
```

#### GET `/api/categories/:id/sub-categories`

获取指定分类的子分类。

### 游戏核心 API

#### GET `/api/game/random-event?sub_codes=code1,code2`

随机获取一道题目。

**查询参数：**
- `sub_codes`：可选，子分类编码，逗号分隔，不传则从所有子分类随机

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "中华人民共和国成立",
    "description": "...",
    "category_id": 1,
    "sub_category_id": 1,
    "start_ts": 19491001,
    "start_precision": 2,
    "location_lat": 39.9042,
    "location_lng": 116.4074,
    "location_name": "北京天安门",
    "location_only": 0,
    "images": [
      {
        "id": 1,
        "url": "/images/category_1/event_123/1.jpg",
        "title": "开国大典",
        "display_order": 1,
        "reveal_seconds": 30
      }
    ],
    "map_config": { ... }
  }
}
```

#### POST `/api/game/submit`

提交答案。

**请求体：**
```json
{
  "user_id": 1,
  "event_id": 123,
  "guess_lat": 39.9,
  "guess_lng": 116.4,
  "guess_year": 1949,
  "guess_month": 10,
  "guess_day": 1,
  "elapsed_seconds": 15.5,
  "timed_out": 0
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "distance_km": 2.5,
    "time_diff_years": 0,
    "precise_location": true,
    "precise_time": true,
    "new_achievements": [ ... ],
    "new_rank": { ... },
    "correct_location": { "lat": 39.9042, "lng": 116.4074 },
    "correct_time": { "year": 1949, "month": 10, "day": 1 }
  }
}
```

### 统计 API

#### GET `/api/game/stats/:userId?period=all`

获取个人统计。

**查询参数：**
- `period`：`all` / `week` / `month` / `year`

#### GET `/api/game/leaderboard?period=all`

获取排行榜。

### 投票 API

#### POST `/api/game/vote`

提交投票。

**请求体：**
```json
{
  "user_id": 1,
  "event_id": 123,
  "vote_type": "up"  // "up" 或 "down"
}
```

#### GET `/api/game/vote/:eventId?user_id=1`

获取投票统计。

### 收藏 API

#### POST `/api/game/favorite`

切换收藏状态。

**请求体：**
```json
{
  "user_id": 1,
  "event_id": 123
}
```

#### GET `/api/game/favorites/:userId?keyword=xxx`

获取收藏列表，支持关键词搜索。

#### GET `/api/game/favorite/check/:eventId?user_id=1`

检查用户是否收藏了某事件。

### 答案分析 API

#### GET `/api/game/event/:eventId/answers?user_id=1`

获取某事件的答题记录。

**响应：**
```json
{
  "success": true,
  "data": {
    "event": { ... },
    "correct_answer": { ... },
    "other_answers": [
      {
        "id": 1,
        "username": "player1",
        "guess_lat": 39.9,
        "guess_lng": 116.4,
        "distance_km": 2.5,
        "time_diff_years": 0,
        ...
      }
    ],
    "my_answer": { ... },
    "statistics": {
      "avg_distance": 125.6,
      "avg_time_diff": 8.3,
      "precise_location_rate": 0.15
    }
  }
}
```

---

## 🔧 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3000 | 服务监听端口 |

### 数据库配置

数据库使用 WAL 模式提升性能：
```javascript
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
```

### 游戏参数配置

可在 `server/config.js` 中调整：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `GAME_DURATION` | 30 | 每局游戏时长（秒） |
| `PRECISE_DISTANCE_KM` | 50 | 精准位置判定阈值（km） |
| `PRECISE_TIME_YEARS` | 1 | 精准时间判定阈值（年） |
| `MAX_ANSWERS_FOR_ANALYSIS` | 50 | 答案分析显示的最大记录数 |

---

## 🐛 常见问题

### Q: 地图瓦片加载不出来？

A: 检查网络连接。如果是在中国境内，高德地图瓦片可能加载更快，可在子分类配置中选择使用 `amap_satellite` 或 `amap_street`。

### Q: 如何添加新题目？

A: 使用配套的 [HSD 维护系统](../hsd/README.md)，提供完整的题目管理界面。

### Q: 如何备份数据？

A: 直接复制 `db/whenwhere.db` 文件即可。建议定期备份。

### Q: 能否离线运行？

A: 可以，但需要：
1. 使用离线瓦片（如堡垒之夜地图）
2. 所有图片资源都在本地
3. 不依赖在线 API

### Q: 如何重置用户密码/Token？

A: Token 是自动生成的，如果丢失，可以重新注册一个同名用户会生成新 Token。

---

## 🔗 相关项目

- **[HSD 维护系统](../hsd/README.md)** — WhenWhere 的配套数据管理工具，支持题目编辑、数据导入导出、AI 智能提取、众筹出题等功能。

---

## 📄 许可证

MIT License - 详见根目录 [LICENSE](../LICENSE) 文件。
