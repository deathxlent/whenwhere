const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const multer = require('multer');

const WW_STATIC_PATH = path.join(__dirname, '..', '..', '..', 'ww', 'static');
const TILES_ROOT = path.join(WW_STATIC_PATH, 'tiles');
const IMAGES_ROOT = path.join(WW_STATIC_PATH, 'images');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});

function ensureTableColumns(tableName, columns) {
  const existingCols = db.pragma(`table_info(${tableName})`).map(c => c.name);
  for (const col of columns) {
    if (!existingCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column ${tableName}.${col.name}`);
      } catch (e) {
        console.warn(`Add column ${tableName}.${col.name} failed:`, e.message);
      }
    }
  }
}

function initDbSchema() {
  ensureTableColumns('maps', [
    { name: 'center_lat', type: 'REAL' },
    { name: 'center_lng', type: 'REAL' },
    { name: 'default_zoom', type: 'INTEGER DEFAULT 2' }
  ]);
  ensureTableColumns('events', [
    { name: 'tips', type: 'TEXT' }
  ]);
  ensureTableColumns('sub_categories', [
    { name: 'map_id', type: 'INTEGER' },
    { name: 'center_lat', type: 'REAL' },
    { name: 'center_lng', type: 'REAL' },
    { name: 'default_zoom', type: 'INTEGER DEFAULT 2' },
    { name: 'min_zoom', type: 'INTEGER DEFAULT 2' },
    { name: 'max_zoom', type: 'INTEGER DEFAULT 8' }
  ]);
}

initDbSchema();

function mapsAreEqual(m1, m2) {
  const keys = ['name', 'tile_type', 'tile_url', 'tile_subdomains',
    'min_zoom', 'max_zoom', 'crs_type', 'bounds_south', 'bounds_west',
    'bounds_north', 'bounds_east', 'tile_ext', 'tile_size',
    'center_lat', 'center_lng', 'default_zoom'];
  for (const key of keys) {
    const v1 = m1[key];
    const v2 = m2[key];
    if ((v1 === null || v1 === undefined) && (v2 === null || v2 === undefined)) continue;
    if (v1 === null || v2 === null) {
      if (v1 !== null || v2 !== null) return false;
    } else if (v1 !== v2) {
      return false;
    }
  }
  return true;
}

function categoriesAreEqual(c1, c2) {
  return c1.name === c2.name && c1.sort_order === c2.sort_order;
}

function subCategoriesAreEqual(sc1, sc2) {
  const keys = ['name', 'sort_order', 'center_lat', 'center_lng',
    'default_zoom', 'min_zoom', 'max_zoom'];
  for (const key of keys) {
    const v1 = sc1[key];
    const v2 = sc2[key];
    if ((v1 === null || v1 === undefined) && (v2 === null || v2 === undefined)) continue;
    if (v1 === null || v2 === null) {
      if (v1 !== null || v2 !== null) return false;
    } else if (v1 !== v2) {
      return false;
    }
  }
  return true;
}

router.post('/zip', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '请上传ZIP文件' });
  }

  const results = {
    maps: { success: 0, skipped: 0, failed: 0, errors: [] },
    categories: { success: 0, skipped: 0, failed: 0, errors: [] },
    sub_categories: { success: 0, skipped: 0, failed: 0, errors: [] },
    events: { success: 0, failed: 0, errors: [] },
    tiles: { copied: 0, skipped: 0 },
    images: { copied: 0, skipped: 0 }
  };

  let importData = null;
  const tileFiles = [];
  const imageFiles = [];

  try {
    const directory = await unzipper.Open.buffer(req.file.buffer);
    
    const jsonEntry = directory.files.find(f => f.path === 'adddata_export.json');
    if (!jsonEntry) {
      return res.json({ success: false, message: 'ZIP文件中未找到 adddata_export.json' });
    }

    const jsonContent = await jsonEntry.buffer();
    importData = JSON.parse(jsonContent.toString('utf8'));

    for (const file of directory.files) {
      if (file.path.startsWith('tiles/') && !file.path.endsWith('/')) {
        tileFiles.push(file);
      }
      if (file.path.startsWith('images/') && !file.path.endsWith('/')) {
        imageFiles.push(file);
      }
    }
  } catch (e) {
    return res.json({ success: false, message: '解析ZIP文件失败: ' + e.message });
  }

  const mapCodeToId = {};
  const catCodeToId = {};
  const subCatCodeToId = {};

  const tx = db.transaction(() => {
    if (importData.maps && Array.isArray(importData.maps)) {
      for (const m of importData.maps) {
        try {
          const existingByCode = db.prepare('SELECT * FROM maps WHERE code = ?').get(m.code);
          if (existingByCode) {
            if (mapsAreEqual(existingByCode, m)) {
              results.maps.skipped++;
              results.maps.errors.push(`地图 ${m.name} (${m.code}) 已存在且配置相同，跳过`);
            } else {
              results.maps.skipped++;
              results.maps.errors.push(`地图编码 ${m.code} 已存在但配置不同，跳过（不覆盖）`);
            }
            mapCodeToId[m.code] = existingByCode.id;
            continue;
          }

          const existingByName = db.prepare('SELECT * FROM maps WHERE name = ?').get(m.name);
          if (existingByName && mapsAreEqual(existingByName, m)) {
            results.maps.skipped++;
            results.maps.errors.push(`地图 ${m.name} 已存在同名同配置，跳过`);
            mapCodeToId[m.code] = existingByName.id;
            continue;
          }

          const result = db.prepare(`
            INSERT INTO maps (name, code, description, tile_type, tile_url, tile_subdomains,
              min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west,
              bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng, default_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            m.name, m.code, m.description || null, m.tile_type || 'custom',
            m.tile_url || null, m.tile_subdomains || null,
            m.min_zoom !== undefined ? m.min_zoom : 0,
            m.max_zoom !== undefined ? m.max_zoom : 18,
            m.sort_order || 0,
            m.crs_type || 'simple',
            m.bounds_south !== undefined ? m.bounds_south : null,
            m.bounds_west !== undefined ? m.bounds_west : null,
            m.bounds_north !== undefined ? m.bounds_north : null,
            m.bounds_east !== undefined ? m.bounds_east : null,
            m.tile_ext || 'png',
            m.tile_size || 256,
            m.center_lat !== undefined ? m.center_lat : null,
            m.center_lng !== undefined ? m.center_lng : null,
            m.default_zoom !== undefined ? m.default_zoom : 2
          );
          mapCodeToId[m.code] = result.lastInsertRowid;
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
          const existingByCode = db.prepare('SELECT * FROM categories WHERE code = ?').get(c.code);
          if (existingByCode) {
            if (categoriesAreEqual(existingByCode, c)) {
              results.categories.skipped++;
              results.categories.errors.push(`分类 ${c.name} (${c.code}) 已存在且配置相同，跳过`);
            } else {
              results.categories.skipped++;
              results.categories.errors.push(`分类编码 ${c.code} 已存在但配置不同，跳过（不覆盖）`);
            }
            catCodeToId[c.code] = existingByCode.id;
            continue;
          }

          const existingByName = db.prepare('SELECT * FROM categories WHERE name = ?').get(c.name);
          if (existingByName && categoriesAreEqual(existingByName, c)) {
            results.categories.skipped++;
            results.categories.errors.push(`分类 ${c.name} 已存在同名同配置，跳过`);
            catCodeToId[c.code] = existingByName.id;
            continue;
          }

          const result = db.prepare('INSERT INTO categories (code, name, sort_order) VALUES (?, ?, ?)')
            .run(c.code, c.name, c.sort_order || 0);
          catCodeToId[c.code] = result.lastInsertRowid;
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
          const catId = catCodeToId[sc.category_code];
          if (!catId) {
            results.sub_categories.failed++;
            results.sub_categories.errors.push(`子分类 ${sc.name || sc.code}: 分类 ${sc.category_code} 不存在`);
            continue;
          }

          const existingByCode = db.prepare('SELECT * FROM sub_categories WHERE category_id = ? AND code = ?').get(catId, sc.code);
          if (existingByCode) {
            if (subCategoriesAreEqual(existingByCode, sc)) {
              results.sub_categories.skipped++;
              results.sub_categories.errors.push(`子分类 ${sc.name} (${sc.code}) 已存在且配置相同，跳过`);
            } else {
              results.sub_categories.skipped++;
              results.sub_categories.errors.push(`子分类编码 ${sc.code} 已存在但配置不同，跳过（不覆盖）`);
            }
            subCatCodeToId[`${sc.category_code}:${sc.code}`] = existingByCode.id;
            continue;
          }

          const existingByName = db.prepare('SELECT * FROM sub_categories WHERE category_id = ? AND name = ?').get(catId, sc.name);
          if (existingByName && subCategoriesAreEqual(existingByName, sc)) {
            results.sub_categories.skipped++;
            results.sub_categories.errors.push(`子分类 ${sc.name} 已存在同名同配置，跳过`);
            subCatCodeToId[`${sc.category_code}:${sc.code}`] = existingByName.id;
            continue;
          }

          let mapId = null;
          if (sc.map_code && mapCodeToId[sc.map_code]) {
            mapId = mapCodeToId[sc.map_code];
          }

          const result = db.prepare(`
            INSERT INTO sub_categories (category_id, code, name, sort_order, map_id,
              center_lat, center_lng, default_zoom, min_zoom, max_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            catId, sc.code, sc.name, sc.sort_order || 0, mapId,
            sc.center_lat !== undefined ? sc.center_lat : null,
            sc.center_lng !== undefined ? sc.center_lng : null,
            sc.default_zoom !== undefined ? sc.default_zoom : 2,
            sc.min_zoom !== undefined ? sc.min_zoom : 2,
            sc.max_zoom !== undefined ? sc.max_zoom : 8
          );
          subCatCodeToId[`${sc.category_code}:${sc.code}`] = result.lastInsertRowid;
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
          const catId = catCodeToId[e.category_code];
          if (!catId) {
            results.events.failed++;
            results.events.errors.push(`事件 ${e.title}: 分类 ${e.category_code} 不存在`);
            continue;
          }

          const subId = subCatCodeToId[`${e.category_code}:${e.sub_category_code}`];
          if (!subId) {
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
            catId, subId, e.title,
            e.start_ts !== undefined ? e.start_ts : null,
            e.start_precision !== undefined ? e.start_precision : 0,
            e.end_ts !== undefined ? e.end_ts : null,
            e.end_precision !== undefined ? e.end_precision : 0,
            e.description || null, e.tips || null,
            e.location_lat !== undefined ? e.location_lat : null,
            e.location_lng !== undefined ? e.location_lng : null,
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
  } catch (e) {
    return res.json({ success: false, message: '导入数据失败: ' + e.message });
  }

  try {
    for (const file of tileFiles) {
      const relPath = file.path.replace(/^tiles\//, '');
      const destPath = path.join(TILES_ROOT, relPath);
      const destDir = path.dirname(destPath);

      if (fs.existsSync(destPath)) {
        results.tiles.skipped++;
        continue;
      }

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const content = await file.buffer();
      fs.writeFileSync(destPath, content);
      results.tiles.copied++;
    }
  } catch (e) {
    console.error('复制瓦片文件失败:', e);
  }

  try {
    for (const file of imageFiles) {
      const relPath = file.path.replace(/^images\//, '');
      const destPath = path.join(IMAGES_ROOT, relPath);
      const destDir = path.dirname(destPath);

      if (fs.existsSync(destPath)) {
        results.images.skipped++;
        continue;
      }

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const content = await file.buffer();
      fs.writeFileSync(destPath, content);
      results.images.copied++;
    }
  } catch (e) {
    console.error('复制图片文件失败:', e);
  }

  res.json({ success: true, message: '导入完成', results });
});

router.post('/json', (req, res) => {
  const importData = req.body;

  if (!importData || typeof importData !== 'object') {
    return res.json({ success: false, message: '导入数据格式错误' });
  }

  const results = {
    maps: { success: 0, skipped: 0, failed: 0, errors: [] },
    categories: { success: 0, skipped: 0, failed: 0, errors: [] },
    sub_categories: { success: 0, skipped: 0, failed: 0, errors: [] },
    events: { success: 0, failed: 0, errors: [] }
  };

  const mapCodeToId = {};
  const catCodeToId = {};
  const subCatCodeToId = {};

  const tx = db.transaction(() => {
    if (importData.maps && Array.isArray(importData.maps)) {
      for (const m of importData.maps) {
        try {
          const existingByCode = db.prepare('SELECT * FROM maps WHERE code = ?').get(m.code);
          if (existingByCode) {
            if (mapsAreEqual(existingByCode, m)) {
              results.maps.skipped++;
              results.maps.errors.push(`地图 ${m.name} (${m.code}) 已存在且配置相同，跳过`);
            } else {
              results.maps.skipped++;
              results.maps.errors.push(`地图编码 ${m.code} 已存在但配置不同，跳过（不覆盖）`);
            }
            mapCodeToId[m.code] = existingByCode.id;
            continue;
          }

          const existingByName = db.prepare('SELECT * FROM maps WHERE name = ?').get(m.name);
          if (existingByName && mapsAreEqual(existingByName, m)) {
            results.maps.skipped++;
            results.maps.errors.push(`地图 ${m.name} 已存在同名同配置，跳过`);
            mapCodeToId[m.code] = existingByName.id;
            continue;
          }

          const result = db.prepare(`
            INSERT INTO maps (name, code, description, tile_type, tile_url, tile_subdomains,
              min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west,
              bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng, default_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            m.name, m.code, m.description || null, m.tile_type || 'custom',
            m.tile_url || null, m.tile_subdomains || null,
            m.min_zoom !== undefined ? m.min_zoom : 0,
            m.max_zoom !== undefined ? m.max_zoom : 18,
            m.sort_order || 0,
            m.crs_type || 'simple',
            m.bounds_south !== undefined ? m.bounds_south : null,
            m.bounds_west !== undefined ? m.bounds_west : null,
            m.bounds_north !== undefined ? m.bounds_north : null,
            m.bounds_east !== undefined ? m.bounds_east : null,
            m.tile_ext || 'png',
            m.tile_size || 256,
            m.center_lat !== undefined ? m.center_lat : null,
            m.center_lng !== undefined ? m.center_lng : null,
            m.default_zoom !== undefined ? m.default_zoom : 2
          );
          mapCodeToId[m.code] = result.lastInsertRowid;
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
          const existingByCode = db.prepare('SELECT * FROM categories WHERE code = ?').get(c.code);
          if (existingByCode) {
            if (categoriesAreEqual(existingByCode, c)) {
              results.categories.skipped++;
              results.categories.errors.push(`分类 ${c.name} (${c.code}) 已存在且配置相同，跳过`);
            } else {
              results.categories.skipped++;
              results.categories.errors.push(`分类编码 ${c.code} 已存在但配置不同，跳过（不覆盖）`);
            }
            catCodeToId[c.code] = existingByCode.id;
            continue;
          }

          const existingByName = db.prepare('SELECT * FROM categories WHERE name = ?').get(c.name);
          if (existingByName && categoriesAreEqual(existingByName, c)) {
            results.categories.skipped++;
            results.categories.errors.push(`分类 ${c.name} 已存在同名同配置，跳过`);
            catCodeToId[c.code] = existingByName.id;
            continue;
          }

          const result = db.prepare('INSERT INTO categories (code, name, sort_order) VALUES (?, ?, ?)')
            .run(c.code, c.name, c.sort_order || 0);
          catCodeToId[c.code] = result.lastInsertRowid;
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
          const catId = catCodeToId[sc.category_code];
          if (!catId) {
            results.sub_categories.failed++;
            results.sub_categories.errors.push(`子分类 ${sc.name || sc.code}: 分类 ${sc.category_code} 不存在`);
            continue;
          }

          const existingByCode = db.prepare('SELECT * FROM sub_categories WHERE category_id = ? AND code = ?').get(catId, sc.code);
          if (existingByCode) {
            if (subCategoriesAreEqual(existingByCode, sc)) {
              results.sub_categories.skipped++;
              results.sub_categories.errors.push(`子分类 ${sc.name} (${sc.code}) 已存在且配置相同，跳过`);
            } else {
              results.sub_categories.skipped++;
              results.sub_categories.errors.push(`子分类编码 ${sc.code} 已存在但配置不同，跳过（不覆盖）`);
            }
            subCatCodeToId[`${sc.category_code}:${sc.code}`] = existingByCode.id;
            continue;
          }

          const existingByName = db.prepare('SELECT * FROM sub_categories WHERE category_id = ? AND name = ?').get(catId, sc.name);
          if (existingByName && subCategoriesAreEqual(existingByName, sc)) {
            results.sub_categories.skipped++;
            results.sub_categories.errors.push(`子分类 ${sc.name} 已存在同名同配置，跳过`);
            subCatCodeToId[`${sc.category_code}:${sc.code}`] = existingByName.id;
            continue;
          }

          let mapId = null;
          if (sc.map_code && mapCodeToId[sc.map_code]) {
            mapId = mapCodeToId[sc.map_code];
          }

          const result = db.prepare(`
            INSERT INTO sub_categories (category_id, code, name, sort_order, map_id,
              center_lat, center_lng, default_zoom, min_zoom, max_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            catId, sc.code, sc.name, sc.sort_order || 0, mapId,
            sc.center_lat !== undefined ? sc.center_lat : null,
            sc.center_lng !== undefined ? sc.center_lng : null,
            sc.default_zoom !== undefined ? sc.default_zoom : 2,
            sc.min_zoom !== undefined ? sc.min_zoom : 2,
            sc.max_zoom !== undefined ? sc.max_zoom : 8
          );
          subCatCodeToId[`${sc.category_code}:${sc.code}`] = result.lastInsertRowid;
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
          const catId = catCodeToId[e.category_code];
          if (!catId) {
            results.events.failed++;
            results.events.errors.push(`事件 ${e.title}: 分类 ${e.category_code} 不存在`);
            continue;
          }

          const subId = subCatCodeToId[`${e.category_code}:${e.sub_category_code}`];
          if (!subId) {
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
            catId, subId, e.title,
            e.start_ts !== undefined ? e.start_ts : null,
            e.start_precision !== undefined ? e.start_precision : 0,
            e.end_ts !== undefined ? e.end_ts : null,
            e.end_precision !== undefined ? e.end_precision : 0,
            e.description || null, e.tips || null,
            e.location_lat !== undefined ? e.location_lat : null,
            e.location_lng !== undefined ? e.location_lng : null,
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

module.exports = router;
