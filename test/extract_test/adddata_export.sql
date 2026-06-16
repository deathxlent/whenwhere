-- =========================================
-- 众筹出题器数据导出 - SQL格式
-- 导出事件数: 3
-- 导出时间: 2026/6/16 11:14:32
-- =========================================

BEGIN TRANSACTION;

-- 地图数据
INSERT OR IGNORE INTO maps (name, code, description, tile_type, tile_url, tile_subdomains, min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west, bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng, default_zoom) VALUES ('zelda', 'zeldamap', NULL, 'custom', '/tiles/zeldamap/tiles/{z}/{x}/{y}.png', NULL, 2, 5, 0, 'simple', -206.5, 34.75, -50.5, 221.5, 'png', 256, -128.5, 128.125, 2);

-- 分类数据
INSERT OR IGNORE INTO categories (code, name, sort_order) VALUES ('zelda', 'zelda', 0);

-- 子分类数据
-- 子分类: 野炊 (category_code: zelda, map_code: zeldamap)

-- 事件数据
-- 事件: 大灾变发生 (category_code: zelda, sub_category_code: wild)
-- 事件: 林克苏醒 (category_code: zelda, sub_category_code: wild)
-- 事件: 获得滑翔伞 (category_code: zelda, sub_category_code: wild)

COMMIT;

-- =========================================
-- 说明：
-- 1. 地图和分类可以直接导入（使用 INSERT OR IGNORE）
-- 2. 子分类和事件需要根据 code 查找对应 ID 后再导入
-- 3. 建议使用 JSON 格式导入，更加方便
-- 4. ZIP包中的 tiles/ 目录包含自定义地图瓦片，需复制到对应位置
-- 5. ZIP包中的 images/ 目录包含事件图片，需复制到对应位置
-- =========================================
