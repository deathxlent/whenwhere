const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');
const { WW_STATIC_PATH, TILES_ROOT, IMAGES_ROOT } = require('../config');

function escapeSql(str) {
  if (str == null) return '';
  return String(str).replace(/'/g, "''").replace(/\\/g, '\\\\');
}

router.get('/events', (req, res) => {
  const categoryId = req.query.category_id;
  const subCategoryId = req.query.sub_category_id;

  let whereClause = 'e.is_active = 1 AND c.is_active = 1 AND sc.is_active = 1';
  const params = [];

  if (categoryId) {
    whereClause += ' AND e.category_id = ?';
    params.push(parseInt(categoryId));
  }
  if (subCategoryId) {
    whereClause += ' AND e.sub_category_id = ?';
    params.push(parseInt(subCategoryId));
  }

  const events = db.prepare(`
    SELECT e.id, e.title, e.location_name, e.start_ts, e.end_ts,
           c.id as category_id, c.code as category_code, c.name as category_name,
           sc.id as sub_category_id, sc.code as sub_category_code, sc.name as sub_category_name,
           m.id as map_id, m.code as map_code, m.name as map_name, m.tile_type
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE ${whereClause}
    ORDER BY c.sort_order, sc.sort_order, e.start_ts, e.id
  `).all(...params);

  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const subCategories = db.prepare(`
    SELECT sc.*, c.id as category_id
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    WHERE sc.is_active = 1 AND c.is_active = 1
    ORDER BY c.sort_order, sc.sort_order, sc.id
  `).all();

  res.json({ success: true, data: { events, categories, subCategories } });
});

router.post('/zip', (req, res) => {
  const eventIds = req.body.event_ids;

  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    return res.json({ success: false, message: '请选择要导出的事件' });
  }

  const placeholders = eventIds.map(() => '?').join(',');
  const events = db.prepare(`
    SELECT e.*, c.code as category_code, c.name as category_name,
           sc.code as sub_category_code, sc.name as sub_category_name,
           sc.map_id as map_id,
           m.code as map_code, m.tile_type, m.tile_url, m.tile_subdomains,
           m.min_zoom, m.max_zoom, m.crs_type, m.bounds_south, m.bounds_west,
           m.bounds_north, m.bounds_east, m.tile_ext, m.tile_size,
           m.center_lat, m.center_lng, m.default_zoom, m.sort_order as map_sort_order,
           m.name as map_name, m.description as map_description
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE e.id IN (${placeholders})
    ORDER BY c.sort_order, sc.sort_order, e.start_ts, e.id
  `).all(...eventIds);

  if (events.length === 0) {
    return res.json({ success: false, message: '没有找到要导出的事件' });
  }

  const categoryIds = [...new Set(events.map(e => e.category_id))];
  const subCategoryIds = [...new Set(events.map(e => e.sub_category_id))];
  const mapIds = [...new Set(events.map(e => e.map_id).filter(Boolean))];

  const categories = db.prepare(`SELECT * FROM categories WHERE id IN (${categoryIds.map(() => '?').join(',')}) ORDER BY sort_order, id`).all(...categoryIds);
  const subCategories = db.prepare(`SELECT * FROM sub_categories WHERE id IN (${subCategoryIds.map(() => '?').join(',')}) ORDER BY sort_order, id`).all(...subCategoryIds);
  const maps = mapIds.length > 0 ? db.prepare(`SELECT * FROM maps WHERE id IN (${mapIds.map(() => '?').join(',')}) ORDER BY sort_order, id`).all(...mapIds) : [];
  const eventImages = db.prepare(`
    SELECT ei.*, e.category_id, e.sub_category_id
    FROM event_images ei
    JOIN events e ON ei.event_id = e.id
    WHERE ei.event_id IN (${placeholders})
    ORDER BY ei.event_id, ei.sort_order, ei.id
  `).all(...eventIds);

  const jsonData = {
    version: '1.0',
    export_time: new Date().toISOString(),
    exported_event_count: events.length,
    maps: maps.map(m => ({
      name: m.name,
      code: m.code,
      description: m.description,
      tile_type: m.tile_type,
      tile_url: m.tile_url,
      tile_subdomains: m.tile_subdomains,
      min_zoom: m.min_zoom,
      max_zoom: m.max_zoom,
      sort_order: m.sort_order,
      crs_type: m.crs_type,
      bounds_south: m.bounds_south,
      bounds_west: m.bounds_west,
      bounds_north: m.bounds_north,
      bounds_east: m.bounds_east,
      tile_ext: m.tile_ext,
      tile_size: m.tile_size,
      center_lat: m.center_lat,
      center_lng: m.center_lng,
      default_zoom: m.default_zoom
    })),
    categories: categories.map(c => ({
      code: c.code,
      name: c.name,
      sort_order: c.sort_order
    })),
    sub_categories: subCategories.map(sc => ({
      category_code: categories.find(c => c.id === sc.category_id)?.code,
      code: sc.code,
      name: sc.name,
      sort_order: sc.sort_order,
      map_code: sc.map_id ? maps.find(m => m.id === sc.map_id)?.code : null,
      center_lat: sc.center_lat,
      center_lng: sc.center_lng,
      default_zoom: sc.default_zoom,
      min_zoom: sc.min_zoom,
      max_zoom: sc.max_zoom
    })),
    events: events.map(e => {
      const imgs = eventImages.filter(i => i.event_id === e.id);
      return {
        category_code: e.category_code,
        sub_category_code: e.sub_category_code,
        title: e.title,
        start_ts: e.start_ts,
        start_precision: e.start_precision,
        end_ts: e.end_ts,
        end_precision: e.end_precision,
        description: e.description,
        tips: e.tips,
        location_lat: e.location_lat,
        location_lng: e.location_lng,
        location_name: e.location_name,
        sort_order: e.sort_order,
        is_active: e.is_active,
        difficulty: e.difficulty,
        video_url: e.video_url,
        audio_url: e.audio_url,
        images: imgs.map(img => ({
          filename: img.filename,
          original_name: img.original_name,
          caption: img.caption,
          sort_order: img.sort_order
        }))
      };
    })
  };

  let sql = '-- =========================================\n';
  sql += '-- HSD 数据导出 - SQL格式\n';
  sql += `-- 导出事件数: ${events.length}\n`;
  sql += '-- 导出时间: ' + new Date().toLocaleString() + '\n';
  sql += '-- =========================================\n\n';
  sql += 'BEGIN TRANSACTION;\n\n';
  sql += '-- 地图数据\n';
  maps.forEach(m => {
    sql += `INSERT OR IGNORE INTO maps (name, code, description, tile_type, tile_url, tile_subdomains, min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west, bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng, default_zoom) VALUES (`;
    sql += `'${escapeSql(m.name)}', '${escapeSql(m.code)}', ${m.description ? `'${escapeSql(m.description)}'` : 'NULL'}, `;
    sql += `'${m.tile_type || 'custom'}', ${m.tile_url ? `'${escapeSql(m.tile_url)}'` : 'NULL'}, `;
    sql += `${m.tile_subdomains ? `'${escapeSql(m.tile_subdomains)}'` : 'NULL'}, `;
    sql += `${m.min_zoom || 0}, ${m.max_zoom || 18}, ${m.sort_order || 0}, `;
    sql += `'${m.crs_type || 'simple'}', ${m.bounds_south || 'NULL'}, ${m.bounds_west || 'NULL'}, `;
    sql += `${m.bounds_north || 'NULL'}, ${m.bounds_east || 'NULL'}, `;
    sql += `'${m.tile_ext || 'png'}', ${m.tile_size || 256}, ${m.center_lat || 'NULL'}, ${m.center_lng || 'NULL'}, ${m.default_zoom || 2}`;
    sql += `);\n`;
  });
  sql += '\n-- 分类数据\n';
  categories.forEach(c => {
    sql += `INSERT OR IGNORE INTO categories (code, name, sort_order) VALUES ('${escapeSql(c.code)}', '${escapeSql(c.name)}', ${c.sort_order || 0});\n`;
  });
  sql += '\n-- 子分类数据\n';
  subCategories.forEach(sc => {
    const catCode = categories.find(c => c.id === sc.category_id)?.code;
    const mapCode = sc.map_id ? maps.find(m => m.id === sc.map_id)?.code : null;
    sql += `-- 子分类: ${sc.name} (category_code: ${catCode}, map_code: ${mapCode || 'NULL'})\n`;
  });
  sql += '\n-- 事件数据\n';
  events.forEach(e => {
    sql += `-- 事件: ${e.title} (category_code: ${e.category_code}, sub_category_code: ${e.sub_category_code})\n`;
  });
  sql += '\nCOMMIT;\n';
  sql += '\n-- =========================================\n';
  sql += '-- 说明：\n';
  sql += '-- 1. 地图和分类可以直接导入（使用 INSERT OR IGNORE）\n';
  sql += '-- 2. 子分类和事件需要根据 code 查找对应 ID 后再导入\n';
  sql += '-- 3. 建议使用 JSON 格式导入，更加方便\n';
  sql += '-- 4. ZIP包中的 tiles/ 目录包含自定义地图瓦片，需复制到对应位置\n';
  sql += '-- 5. ZIP包中的 images/ 目录包含事件图片，需复制到对应位置\n';
  sql += '-- =========================================\n';

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `hsd_export_${timestamp}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on('error', (err) => {
    console.error('ZIP archive error:', err);
    res.status(500).end();
  });
  archive.pipe(res);

  archive.append(JSON.stringify(jsonData, null, 2), { name: 'adddata_export.json' });
  archive.append(sql, { name: 'adddata_export.sql' });

  const customMaps = maps.filter(m => m.tile_type === 'custom' && m.code);
  const imageFiles = [];

  for (const mapObj of customMaps) {
    const tileDir = path.join(TILES_ROOT, mapObj.code);
    if (fs.existsSync(tileDir)) {
      const addDirRecursive = (dirPath, archivePath) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relPath = archivePath ? `${archivePath}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            addDirRecursive(fullPath, relPath);
          } else if (entry.isFile()) {
            archive.file(fullPath, { name: `tiles/${mapObj.code}/${relPath}` });
          }
        }
      };
      addDirRecursive(tileDir, '');
    }
  }

  if (fs.existsSync(IMAGES_ROOT)) {
    for (const ev of events) {
      const catCode = ev.category_code;
      const subCode = ev.sub_category_code;
      const eventId = ev.id;
      const imgDir = path.join(IMAGES_ROOT, catCode, subCode, String(eventId));
      if (fs.existsSync(imgDir)) {
        const entries = fs.readdirSync(imgDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            const fullPath = path.join(imgDir, entry.name);
            archive.file(fullPath, { name: `images/${catCode}/${subCode}/${eventId}/${entry.name}` });
            imageFiles.push(`${catCode}/${subCode}/${eventId}/${entry.name}`);
          }
        }
      }
    }
  }

  const manifest = {
    created_at: new Date().toISOString(),
    exported_event_count: events.length,
    exported_event_ids: eventIds.map(Number),
    maps: customMaps.map(m => m.code),
    images: imageFiles,
    notes: [
      'tiles/ 目录包含自定义地图瓦片，需复制到 tiles/ 目录',
      'images/ 目录包含事件图片，需复制到 static/images/ 目录',
      'adddata_export.json 可以直接导入到 adddatatools 或 hsd 应用'
    ]
  };
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  archive.append(readme(), { name: 'README.txt' });

  archive.finalize();
});

router.get('/json', (req, res) => {
  const maps = db.prepare('SELECT * FROM maps WHERE is_active = 1 ORDER BY sort_order, id').all();
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const subCategories = db.prepare(`
    SELECT sc.*, c.code as category_code, c.name as category_name
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    WHERE sc.is_active = 1 AND c.is_active = 1
    ORDER BY c.sort_order, sc.sort_order, sc.id
  `).all();
  const events = db.prepare(`
    SELECT e.*, c.code as category_code, sc.code as sub_category_code
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.is_active = 1
    ORDER BY e.start_ts ASC, e.id
  `).all();

  const exportData = {
    version: '1.0',
    export_time: new Date().toISOString(),
    maps: maps.map(m => ({
      name: m.name,
      code: m.code,
      description: m.description,
      tile_type: m.tile_type,
      tile_url: m.tile_url,
      tile_subdomains: m.tile_subdomains,
      min_zoom: m.min_zoom,
      max_zoom: m.max_zoom,
      sort_order: m.sort_order,
      crs_type: m.crs_type,
      bounds_south: m.bounds_south,
      bounds_west: m.bounds_west,
      bounds_north: m.bounds_north,
      bounds_east: m.bounds_east,
      tile_ext: m.tile_ext,
      tile_size: m.tile_size,
      center_lat: m.center_lat,
      center_lng: m.center_lng,
      default_zoom: m.default_zoom
    })),
    categories: categories.map(c => ({
      code: c.code,
      name: c.name,
      sort_order: c.sort_order
    })),
    sub_categories: subCategories.map(sc => ({
      category_code: sc.category_code,
      code: sc.code,
      name: sc.name,
      sort_order: sc.sort_order,
      map_code: sc.map_id ? maps.find(m => m.id === sc.map_id)?.code : null,
      center_lat: sc.center_lat,
      center_lng: sc.center_lng,
      default_zoom: sc.default_zoom,
      min_zoom: sc.min_zoom,
      max_zoom: sc.max_zoom
    })),
    events: events.map(e => ({
      category_code: e.category_code,
      sub_category_code: e.sub_category_code,
      title: e.title,
      start_ts: e.start_ts,
      start_precision: e.start_precision,
      end_ts: e.end_ts,
      end_precision: e.end_precision,
      description: e.description,
      tips: e.tips,
      location_lat: e.location_lat,
      location_lng: e.location_lng,
      location_name: e.location_name,
      sort_order: e.sort_order,
      difficulty: e.difficulty,
      video_url: e.video_url,
      audio_url: e.audio_url
    }))
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `hsd_export_${timestamp}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(exportData);
});

function readme() {
  return `HSD 数据导出包说明
==========================

导出内容:
  adddata_export.json  - JSON格式数据文件（推荐导入格式）
  adddata_export.sql   - SQL格式数据文件
  manifest.json        - 导出清单（包含了哪些地图和图片）
  README.txt           - 本说明文件
  tiles/               - 自定义地图瓦片（如果使用了自定义地图）
  images/              - 事件相关图片（如果有）

导入步骤:
  1. 打开 hsd 或 adddatatools 管理后台
  2. 进入"数据导入"页面
  3. 选择 ZIP 文件或 JSON 文件并导入
  4. 如果有 tiles/ 目录，将其内容复制到 tiles/ 目录下
  5. 如果有 images/ 目录，将其内容复制到 static/images/ 目录下

注意事项:
  - 导入时如果编码已存在会自动跳过，不会覆盖已有数据
  - 地图、分类使用 code 编码作为唯一标识
  - 子分类、事件通过 code 编码关联到父级

`;
}

module.exports = router;
