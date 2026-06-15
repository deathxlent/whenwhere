const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

router.get('/all', (req, res) => {
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
      sort_order: e.sort_order
    }))
  };

  res.json({ success: true, data: exportData });
});

router.get('/sql', (req, res) => {
  const maps = db.prepare('SELECT * FROM maps WHERE is_active = 1 ORDER BY sort_order, id').all();
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const subCategories = db.prepare('SELECT * FROM sub_categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const events = db.prepare('SELECT * FROM events WHERE is_active = 1 ORDER BY start_ts ASC, id').all();

  let sql = '-- =========================================\n';
  sql += '-- 众筹出题器数据导出 - SQL格式\n';
  sql += '-- 导出时间: ' + new Date().toLocaleString() + '\n';
  sql += '-- =========================================\n\n';

  sql += '-- 地图数据\n';
  sql += 'BEGIN TRANSACTION;\n\n';

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
  const catIdMap = {};
  categories.forEach(c => {
    sql += `INSERT OR IGNORE INTO categories (code, name, sort_order) VALUES ('${escapeSql(c.code)}', '${escapeSql(c.name)}', ${c.sort_order || 0});\n`;
    catIdMap[c.id] = c.code;
  });

  sql += '\n-- 子分类数据\n';
  const subIdMap = {};
  
  subCategories.forEach(sc => {
    const catCode = catIdMap[sc.category_id];
    const mapCode = sc.map_id ? maps.find(m => m.id === sc.map_id)?.code : null;
    
    sql += `-- 子分类: ${sc.name}\n`;
    sql += `-- 注意: 导入时需要根据 category_code 和 map_code 查找对应 ID\n`;
    sql += `-- category_code: ${catCode}, map_code: ${mapCode || 'NULL'}\n`;
    
    subIdMap[sc.id] = {
      category_code: catCode,
      code: sc.code,
      map_code: mapCode
    };
  });

  sql += '\n-- 事件数据\n';
  events.forEach(e => {
    const subInfo = subIdMap[e.sub_category_id];
    if (subInfo) {
      sql += `-- 事件: ${e.title}\n`;
      sql += `-- category_code: ${subInfo.category_code}, sub_category_code: ${subInfo.code}\n`;
    }
  });

  sql += '\nCOMMIT;\n';
  sql += '\n-- =========================================\n';
  sql += '-- 说明：\n';
  sql += '-- 1. 地图和分类可以直接导入（使用 INSERT OR IGNORE）\n';
  sql += '-- 2. 子分类和事件需要根据 code 查找对应 ID 后再导入\n';
  sql += '-- 3. 建议使用 JSON 格式导入，更加方便\n';
  sql += '-- =========================================\n';

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="adddata_export.sql"');
  res.send(sql);
});

router.get('/json', (req, res) => {
  const maps = db.prepare('SELECT * FROM maps WHERE is_active = 1 ORDER BY sort_order, id').all();
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const subCategories = db.prepare(`
    SELECT sc.*, c.code as category_code
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
      sort_order: e.sort_order
    }))
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="adddata_export.json"');
  res.send(jsonStr);
});

router.get('/import-template', (req, res) => {
  const template = {
    version: '1.0',
    description: '众筹出题器导入模板',
    maps: [
      {
        name: '示例地图',
        code: 'example_map',
        description: '这是一个示例地图',
        tile_type: 'custom',
        tile_url: '/tiles/example/{z}/{x}/{y}.png',
        min_zoom: 2,
        max_zoom: 5,
        sort_order: 1,
        crs_type: 'simple',
        tile_ext: 'png',
        tile_size: 256,
        center_lat: 0,
        center_lng: 0,
        default_zoom: 2
      }
    ],
    categories: [
      {
        code: 'example_category',
        name: '示例分类',
        sort_order: 1
      }
    ],
    sub_categories: [
      {
        category_code: 'example_category',
        code: 'example_sub',
        name: '示例子分类',
        sort_order: 1,
        map_code: 'example_map',
        center_lat: 0,
        center_lng: 0,
        default_zoom: 2,
        min_zoom: 2,
        max_zoom: 5
      }
    ],
    events: [
      {
        category_code: 'example_category',
        sub_category_code: 'example_sub',
        title: '示例事件',
        start_ts: 20240101,
        start_precision: 2,
        end_ts: null,
        end_precision: 0,
        description: '这是一个示例事件的描述',
        tips: '提示信息',
        location_lat: 0,
        location_lng: 0,
        location_name: '示例地点',
        sort_order: 1
      }
    ]
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="import_template.json"');
  res.send(JSON.stringify(template, null, 2));
});

router.post('/import', (req, res) => {
  const importData = req.body;
  
  if (!importData || typeof importData !== 'object') {
    return res.json({ success: false, message: '导入数据格式错误' });
  }

  const results = {
    maps: { success: 0, failed: 0, errors: [] },
    categories: { success: 0, failed: 0, errors: [] },
    sub_categories: { success: 0, failed: 0, errors: [] },
    events: { success: 0, failed: 0, errors: [] }
  };

  const tx = db.transaction(() => {
    if (importData.maps && Array.isArray(importData.maps)) {
      for (const m of importData.maps) {
        try {
          const exists = db.prepare('SELECT id FROM maps WHERE code = ?').get(m.code);
          if (exists) {
            results.maps.failed++;
            results.maps.errors.push(`地图编码 ${m.code} 已存在`);
            continue;
          }
          
          db.prepare(`
            INSERT INTO maps (name, code, description, tile_type, tile_url, tile_subdomains,
              min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west,
              bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng, default_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            m.name, m.code, m.description || null, m.tile_type || 'custom',
            m.tile_url || null, m.tile_subdomains || null,
            m.min_zoom || 0, m.max_zoom || 18, m.sort_order || 0,
            m.crs_type || 'simple', m.bounds_south || null, m.bounds_west || null,
            m.bounds_north || null, m.bounds_east || null,
            m.tile_ext || 'png', m.tile_size || 256,
            m.center_lat || null, m.center_lng || null, m.default_zoom || 2
          );
          results.maps.success++;
        } catch (e) {
          results.maps.failed++;
          results.maps.errors.push(`地图 ${m.name || m.code}: ${e.message}`);
        }
      }
    }

    if (importData.categories && Array.isArray(importData.categories)) {
      for (const c of importData.categories) {
        try {
          const exists = db.prepare('SELECT id FROM categories WHERE code = ?').get(c.code);
          if (exists) {
            results.categories.failed++;
            results.categories.errors.push(`分类编码 ${c.code} 已存在`);
            continue;
          }
          
          db.prepare('INSERT INTO categories (code, name, sort_order) VALUES (?, ?, ?)')
            .run(c.code, c.name, c.sort_order || 0);
          results.categories.success++;
        } catch (e) {
          results.categories.failed++;
          results.categories.errors.push(`分类 ${c.name || c.code}: ${e.message}`);
        }
      }
    }

    if (importData.sub_categories && Array.isArray(importData.sub_categories)) {
      for (const sc of importData.sub_categories) {
        try {
          const cat = db.prepare('SELECT id FROM categories WHERE code = ?').get(sc.category_code);
          if (!cat) {
            results.sub_categories.failed++;
            results.sub_categories.errors.push(`子分类 ${sc.name || sc.code}: 分类 ${sc.category_code} 不存在`);
            continue;
          }

          const exists = db.prepare('SELECT id FROM sub_categories WHERE category_id = ? AND code = ?').get(cat.id, sc.code);
          if (exists) {
            results.sub_categories.failed++;
            results.sub_categories.errors.push(`子分类编码 ${sc.code} 在分类 ${sc.category_code} 下已存在`);
            continue;
          }

          let mapId = null;
          if (sc.map_code) {
            const map = db.prepare('SELECT id FROM maps WHERE code = ?').get(sc.map_code);
            mapId = map ? map.id : null;
          }

          db.prepare(`
            INSERT INTO sub_categories (category_id, code, name, sort_order, map_id,
              center_lat, center_lng, default_zoom, min_zoom, max_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            cat.id, sc.code, sc.name, sc.sort_order || 0, mapId,
            sc.center_lat || null, sc.center_lng || null,
            sc.default_zoom || 2, sc.min_zoom || 2, sc.max_zoom || 8
          );
          results.sub_categories.success++;
        } catch (e) {
          results.sub_categories.failed++;
          results.sub_categories.errors.push(`子分类 ${sc.name || sc.code}: ${e.message}`);
        }
      }
    }

    if (importData.events && Array.isArray(importData.events)) {
      for (const e of importData.events) {
        try {
          const cat = db.prepare('SELECT id FROM categories WHERE code = ?').get(e.category_code);
          if (!cat) {
            results.events.failed++;
            results.events.errors.push(`事件 ${e.title}: 分类 ${e.category_code} 不存在`);
            continue;
          }

          const sub = db.prepare('SELECT id FROM sub_categories WHERE category_id = ? AND code = ?').get(cat.id, e.sub_category_code);
          if (!sub) {
            results.events.failed++;
            results.events.errors.push(`事件 ${e.title}: 子分类 ${e.sub_category_code} 不存在`);
            continue;
          }

          db.prepare(`
            INSERT INTO events (category_id, sub_category_id, title,
              start_ts, start_precision, end_ts, end_precision,
              description, tips, location_lat, location_lng, location_name, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            cat.id, sub.id, e.title,
            e.start_ts || null, e.start_precision !== undefined ? e.start_precision : 0,
            e.end_ts || null, e.end_precision !== undefined ? e.end_precision : 0,
            e.description || null, e.tips || null,
            e.location_lat || null, e.location_lng || null,
            e.location_name || null, e.sort_order || 0
          );
          results.events.success++;
        } catch (err) {
          results.events.failed++;
          results.events.errors.push(`事件 ${e.title}: ${err.message}`);
        }
      }
    }
  });

  try {
    tx();
    res.json({ success: true, message: '导入完成', results });
  } catch (e) {
    res.json({ success: false, message: '导入失败: ' + e.message });
  }
});

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

module.exports = router;
