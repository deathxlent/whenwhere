# 开发日志 (devlog.md)

## [2.0.0] - 2026-06-12

### 本次版本变更总结

完成了类别和子类别体系的全面改造，新增地图管理模块，实现WW应用的动态Tab加载，完成HSD和WW两个应用之间的联动。核心改造包括：新增maps表实现可配置的地图资源、子类别强制绑定地图、独立配置每个子类的地图中心点和缩放参数、HSD新增地图管理导航页面、WW从API动态加载类别和子类（仅显示已绑地图+有事件的可用子类）、其余情况显示"建设中"。同时修复了之前的多个问题（排行榜显示、标签样式、国家名称、精准判断规则、字体统一等）。

---

### 新增内容

#### 1. 地图管理模块

**后端数据库 (`hsd/server/init-db.js`)**
- 新增 `maps` 表：存储地图配置信息
  - 字段：name, code(唯一), description, tile_type, tile_url, tile_subdomains, min_zoom, max_zoom, sort_order, is_active
  - 预置两条默认地图：「世界地图」(code:world)、「中国地图」(code:china)
  - 瓦片类型支持5种：hybrid(混合-本地OSM+高德街道)、osm(OpenStreetMap)、amap_street、amap_satellite、custom(自定义URL)
- `sub_categories` 表新增地图绑定相关字段
  - map_id(FK) → 关联到maps表
  - center_lat / center_lng → 地图中心点坐标
  - default_zoom → 默认缩放级别
  - min_zoom / max_zoom → 缩放上下限（与地图本身限制取交集）
- 为已有的「初中-中国史」绑定中国地图，「初中-世界史」绑定世界地图，并设置默认参数

**后端API (`hsd/server/routes/maps.js`)**
- `GET /api/maps` → 获取全部地图（附带绑定子类数量 bind_count）
- `GET /api/maps/:id` → 单张地图详情
- `POST /api/maps` → 新增地图
- `PUT /api/maps/:id` → 修改地图（**仅允许未绑定子类的地图**）
- `DELETE /api/maps/:id` → 删除地图（**仅允许未绑定子类的地图**，软删除 is_active=0）

**前端HSD页面 (`hsd/public/js/main.js`)**
- 新增顶部导航栏：🏠首页 / 📂类别管理 / 🗺️地图管理
- 地图管理页：
  - 卡片网格展示所有地图（名称、编码、瓦片类型、缩放范围、绑定子类数）
  - 已绑定子类的地图显示灰色锁定状态、不可编辑/删除，悬停提示
  - 未绑定的地图显示编辑、删除按钮
  - 新增/编辑地图弹窗表单（瓦片类型切换显示对应字段）

#### 2. 类别管理体系改造

**后端API (`hsd/server/routes/categories.js`)**
- 完整重写，提供大类和子类的CRUD全套接口
- 大类：`GET/POST/PUT/DELETE /api/categories` 及详情
- 子类：`GET/POST/PUT/DELETE /api/categories/:id/sub-categories`
- 子类创建/修改时必须带 map_id，可配置：
  - 地图选择（下拉）
  - 中心点经纬度（center_lat, center_lng）
  - 默认缩放（default_zoom）
  - 缩放上下限（min_zoom, max_zoom）
- 子类列表返回事件数 event_count、地图名称/编码/瓦片参数等完整信息
- 大类列表返回：子类总数 total_sub_count、可用子类数 available_sub_count（已绑地图+有事件）、事件总数

**前端HSD页面**
- 首页：显示各大类卡片，展示可用子类数/事件数
- 类别管理页：
  - 左侧大类列表（增删改查+排序）
  - 右侧子类别列表（增删改查）
  - 子类表单：地图下拉、经纬度输入、缩放参数输入
  - 每个子类显示绑定的地图名、事件数
  - 「进入维护」按钮进入事件列表

#### 3. WW应用动态Tab和地图参数

**后端API (`ww/server/routes/categories.js`)**
- 新增 `GET /api/categories`：返回所有大类 + 子类统计（可用子类数）
- 新增 `GET /api/categories/:id/sub-categories`：返回子类详情（含地图配置和事件数）

**前端WW改造 (`ww/public/js/app.js`)**
- 状态扩展：新增 categories、subCategoriesMap、currentSubConfigs 字段
- `renderMainPage()` → 先异步加载类别再初始化Tab
- `initTabs()` → 从API动态渲染大类Tab按钮，不再硬编码
- `renderTabContent(categoryId)` → 按以下规则渲染：
  - 大类 available_sub_count = 0 → 显示「🏗️ 建设中，敬请期待...」
  - 否则异步拉取子类列表，过滤掉「未绑地图 or 事件数=0」的
  - 过滤后为空 → 同样显示建设中
  - 有可用子类 → 渲染复选框（默认全选，显示事件数）+ 开始按钮
- `renderGamePage()` → 使用第一个选中子类的地图参数：
  - 中心点、默认缩放、最小/最大缩放（子类限制和地图限制取交集）
  - 瓦片类型和URL
- 新增 `addTileLayersToMap(map, tileType, url, sd, minZ, maxZ)` 通用瓦片加载函数
  - 支持 hybrid/osm/amap_street/amap_satellite/custom 五种模式

---

### 修复和优化的问题

#### 1. 精准判断规则调整 (`ww/server/routes/game.js`)
- **位置精准阈值**：30公里 → **50公里**（≤50km算精准）
- **精准时统计误差**：从记录实际值改为 **误差算0**
  - `preciseLocation`时 `distanceForStats = 0`
  - `preciseTime`时 `timeForStats = 0`
- **时间精准公式**：
  - Y = |事件年份 - 2026|
  - 精准阈值 = Y × 1%
  - |猜测 - 实际| ≤ 阈值即精准
  - 例：1926年(Y=100) → 100×1%=1年 → 1925~1927都精准

#### 2. 排行榜显示修复 (`ww/public/css/style.css`)
- 修复 `.leaderboard-list` 被设为 `display:none` 导致排行榜始终空白的问题
- 改为 `display:block`，正常渲染榜单内容

#### 3. 地图标签样式优化
- HSD+WW：地图标签从「白色+阴影」→ **黑色无阴影、不加粗**
- 文字拥挤：字体大小调整（国家12px、省份11px、大国一级9px）
- 最终字体：全部改用系统默认字体 `system-ui, sans-serif`，避免宋体兼容性问题

#### 4. 国家名称全显示 (`ww/public/js/app.js`)
- `WORLD_COUNTRIES` 数组扩展至约150个国家，不再仅显示≥日本面积的国家
- 所有国家在缩放≥2级时显示名称标签

#### 5. 全应用字体统一
- HSD和WW所有页面的 `font-family` 改为 `system-ui, sans-serif`
- 大小、粗体、位置等其他样式保留不变，仅字体族替换

#### 6. HSD启动报错修复
- `hsd/server/routes/images.js` 第12行语法错误：
  - 错误写法 `{ recursive: true }.recursive.;`
  - 修正为 `{ recursive: true }`

#### 7. 数据库初始化顺序修复
- 修复 maps表和sub_categories外键依赖顺序导致的 `no such column: map_id` 错误
- 执行顺序调整为：先建maps → 再建categories → 再建sub_categories（存在则添加map相关字段）→ 最后建events和event_images
- 避免重复添加列的代码执行两遍

#### 8. 路由注册遗漏修复
- `hsd/server/app.js` 补充 `app.use('/api/maps', require('./routes/maps'))`，原未注册导致地图API 404

---

### 修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `hsd/server/init-db.js` | 重写 | 新增maps表、sub_categories扩展字段、预置数据 |
| `hsd/server/routes/maps.js` | 新增 | 地图管理增删查API（绑子类的地图只读） |
| `hsd/server/routes/categories.js` | 重写 | 大类/子类完整CRUD，支持地图绑定和缩放配置 |
| `hsd/server/routes/images.js` | 修复 | 修复mkdirSync语法错误 |
| `hsd/server/app.js` | 修改 | 注册maps路由 |
| `hsd/public/index.html` | 修改 | 新增顶部导航栏（首页/类别管理/地图管理） |
| `hsd/public/css/style.css` | 修改 | 地图标签样式+系统字体+管理页布局样式 |
| `hsd/public/js/main.js` | 重写 | 三大视图+导航+地图管理+类别管理+事件维护 |
| `ww/server/routes/categories.js` | 新增 | WW端类别/子类查询API |
| `ww/server/routes/game.js` | 修改 | 精准规则(50km/Y×1%)+精准时误差算0 |
| `ww/server/app.js` | 修改 | 注册categories路由 |
| `ww/public/css/style.css` | 修改 | 修复排行榜+标签黑色无阴影+系统字体 |
| `ww/public/js/app.js` | 修改 | 动态Tab+动态子类渲染+子类地图参数配置+150国家 |
| `README.md` | 重写 | 全量更新最新功能（非更新日志形式） |
| `devlog.md` | 修改 | 新增本次版本2.0.0的完整变更说明 |

---

### 已验证功能清单

- [x] maps表创建成功，2条默认地图数据插入正常
- [x] sub_categories表字段扩展成功，中国史/世界史各自绑定对应地图
- [x] HSD地图管理：新增、编辑（仅未绑）、删除（仅未绑）功能正常
- [x] 已绑定子类的地图编辑/删除按钮正确禁用并提示
- [x] HSD类别管理：大类/子类CRUD正常，子类地图下拉和缩放参数保存正常
- [x] HSD事件维护：原有列表视图和地图添加视图均正常工作
- [x] WW首页：5个大类Tab从API动态渲染，非硬编码
- [x] WW初中Tab：显示中国史/世界史复选框（带事件数）可开始游戏
- [x] WW其他Tab（高中/人类/宇宙/虚拟）：正确显示「建设中」
- [x] WW游戏内地图：中国史默认居中中国+缩放4，世界史居中欧亚+缩放2
- [x] WW位置精准：50公里内标记绿色精准标签，统计距离=0
- [x] WW时间精准：按1%规则正确判定，统计时间差=0
- [x] 排行榜内容正常渲染，不再空白
- [x] 地图标签黑色不加粗，全应用系统字体生效
- [x] 150个国家名称正常显示（缩放≥2）
- [x] HSD启动无报错，images.js语法错误已修复

---

### 后续计划（TODO）

- [ ] WW多子类混玩时的地图切换策略（当前用第一个子类的配置）
- [ ] HSD子类中心点支持直接在地图上拾取而非手动输入经纬度
- [ ] 事件批量导入（Excel/CSV）和批量导出功能
- [ ] 子类图标/颜色自定义配置
- [ ] WW内猜完后可选择是否继续用同配置下一题
- [ ] 操作日志记录谁在何时增删改了哪条数据
- [ ] 数据搜索和高级筛选（按时间范围、地点范围、关键字）

---

## [1.1.0] - 2026-06-11

### 本次版本变更总结

实现了基于交互地图的事件添加功能，包括Leaflet地图集成、中国省份GeoJSON展示、大国行政区划标注、自定义时间选择器（支持公元/公元前、年/月/日精度）、地图点击选点添加事件、内嵌图片上传等核心功能。同时重构了时间存储方案，从文本日期改为编码时间戳+精度标记。

---

### 新增内容

#### 1. 地图交互视图
- **集成**: Leaflet.js + OpenStreetMap 开源瓦片
- 进入"初中→中国史/世界史"后点击"进入地图添加"打开全屏交互地图
- 点击地图任意位置放置标记点并弹出右侧添加面板

#### 2. 中国省份显示
- 省份边界虚线叠加层
- 省份名称标注（DivIcon，缩放≥4级显示）

#### 3. 大国一级行政区划标注
- 覆盖面积≥日本的约20+国家（俄罗斯、美国、加拿大、巴西等）
- 缩放≥5级时显示

#### 4. 自定义时间选择器
- 公元/公元前切换按钮
- 年/月/日三段式输入
- 精度选择：仅年/年月/年月日
- 编码方案：年×10000+月×100+日；公元前取负数

#### 5. 数据库Schema更新
- 删除start_date/end_date文本字段
- 新增start_ts/start_precision/end_ts/end_precision

---

### 修改文件清单

| 文件 | 修改类型 |
|------|----------|
| `hsd/server/init-db.js` | 修改 |
| `hsd/server/routes/events.js` | 重写 |
| `hsd/server/app.js` | 修改 |
| `hsd/public/index.html` | 修改 |
| `hsd/public/css/style.css` | 修改 |
| `hsd/public/js/main.js` | 重写 |
| `ww/static/lib/leaflet/*` | 新增 |
| `ww/static/geojson/china_provinces.json` | 新增 |
| `ww/static/geojson/world_admin1_labels.json` | 新增 |

---

## [1.0.0] - 2026-06-11

### 本次版本变更总结

完成了项目基础架构搭建和 HSD（heshidi）维护应用的首个可用版本。

---

### 新增内容

- 双应用独立目录结构：`hsd/`（维护应用）、`ww/`（展示应用）
- 数据库4张核心表：categories, sub_categories, events, event_images
- 预置5个大类+初中下2个子类
- HSD后端三大路由：分类/事件/图片 + Multer文件上传
- HSD前端页面：首页Tab、子分类单选、事件列表、事件表单、图片管理
- 公共组件库：API封装、Toast、Modal、确认对话框、工具函数
- Windows一键启动脚本 start-hsd.bat
- 完整文档 README.md 和 devlog.md

---

### 技术选型决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 前端框架 | 原生 JS | 需求简单，避免过度工程化 |
| 后端框架 | Express | Node.js 生态成熟，轻量灵活 |
| 数据库 | SQLite | 无需独立服务，文件型便于共享和迁移 |
| 数据库驱动 | better-sqlite3 | 同步API，性能优异，事务支持好 |
| 图片存储 | 文件系统 | 按分类层级目录组织，URL映射简单 |
| 删除策略 | 事件软删+图片硬删 | 事件保留数据追溯，图片节省空间 |
