const db = require('../../db');
const { mapsAreEqual, categoriesAreEqual, subCategoriesAreEqual } = require('./comparators');

function importMaps(maps, results, mapCodeToId) {
  if (!maps || !Array.isArray(maps)) return;

  for (const m of maps) {
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
          bounds_north, bounds_east, tile_ext, tile_size, distance_unit, distance_scale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        m.distance_unit || 'km',
        m.distance_scale !== undefined ? m.distance_scale : 1
      );
      mapCodeToId[m.code] = result.lastInsertRowid;
      results.maps.success++;
    } catch (e) {
      results.maps.failed++;
      results.maps.errors.push(`地图 ${m.name || m.code}: ${e.message}`);
    }
  }
}

function importCategories(categories, results, catCodeToId) {
  if (!categories || !Array.isArray(categories)) return;

  for (const c of categories) {
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

function importSubCategories(subCategories, results, catCodeToId, mapCodeToId, subCatCodeToId) {
  if (!subCategories || !Array.isArray(subCategories)) return;

  for (const sc of subCategories) {
    try {
      const catId = catCodeToId[sc.category_code];
      if (!catId) {
        results.sub_categories.failed++;
        results.sub_categories.errors.push(`子分类 ${sc.name || sc.code}: 分类 ${sc.category_code} 不存在`);
        continue;
      }

      let mapId = null;
      if (sc.map_code && mapCodeToId[sc.map_code]) {
        mapId = mapCodeToId[sc.map_code];
      }

      const existingByCode = db.prepare('SELECT * FROM sub_categories WHERE category_id = ? AND code = ?').get(catId, sc.code);
      if (existingByCode) {
        const needsUpdate = existingByCode.map_id !== mapId ||
          existingByCode.center_lat !== (sc.center_lat !== undefined ? sc.center_lat : null) ||
          existingByCode.center_lng !== (sc.center_lng !== undefined ? sc.center_lng : null) ||
          existingByCode.default_zoom !== (sc.default_zoom !== undefined ? sc.default_zoom : 2) ||
          existingByCode.min_zoom !== (sc.min_zoom !== undefined ? sc.min_zoom : 2) ||
          existingByCode.max_zoom !== (sc.max_zoom !== undefined ? sc.max_zoom : 8);

        if (needsUpdate && mapId !== null) {
          db.prepare(`
            UPDATE sub_categories SET
              map_id = ?,
              center_lat = ?,
              center_lng = ?,
              default_zoom = ?,
              min_zoom = ?,
              max_zoom = ?
            WHERE id = ?
          `).run(
            mapId,
            sc.center_lat !== undefined ? sc.center_lat : null,
            sc.center_lng !== undefined ? sc.center_lng : null,
            sc.default_zoom !== undefined ? sc.default_zoom : 2,
            sc.min_zoom !== undefined ? sc.min_zoom : 2,
            sc.max_zoom !== undefined ? sc.max_zoom : 8,
            existingByCode.id
          );
          results.sub_categories.success++;
          results.sub_categories.errors.push(`子分类 ${sc.name} (${sc.code}) 已存在，已更新地图关联`);
        } else if (subCategoriesAreEqual(existingByCode, sc)) {
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
        if (existingByName.map_id !== mapId && mapId !== null) {
          db.prepare(`
            UPDATE sub_categories SET
              map_id = ?,
              center_lat = ?,
              center_lng = ?,
              default_zoom = ?,
              min_zoom = ?,
              max_zoom = ?
            WHERE id = ?
          `).run(
            mapId,
            sc.center_lat !== undefined ? sc.center_lat : null,
            sc.center_lng !== undefined ? sc.center_lng : null,
            sc.default_zoom !== undefined ? sc.default_zoom : 2,
            sc.min_zoom !== undefined ? sc.min_zoom : 2,
            sc.max_zoom !== undefined ? sc.max_zoom : 8,
            existingByName.id
          );
          results.sub_categories.success++;
          results.sub_categories.errors.push(`子分类 ${sc.name} 已存在同名同配置，已更新地图关联`);
        } else {
          results.sub_categories.skipped++;
          results.sub_categories.errors.push(`子分类 ${sc.name} 已存在同名同配置，跳过`);
        }
        subCatCodeToId[`${sc.category_code}:${sc.code}`] = existingByName.id;
        continue;
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

function importEvents(events, results, catCodeToId, subCatCodeToId) {
  if (!events || !Array.isArray(events)) return;

  for (const e of events) {
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
          description, tips, location_lat, location_lng, location_name, sort_order,
          location_lat2, location_lng2, location_only)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        catId, subId, e.title,
        e.start_ts !== undefined ? e.start_ts : null,
        e.start_precision !== undefined ? e.start_precision : 0,
        e.end_ts !== undefined ? e.end_ts : null,
        e.end_precision !== undefined ? e.end_precision : 0,
        e.description || null, e.tips || null,
        e.location_lat !== undefined ? e.location_lat : null,
        e.location_lng !== undefined ? e.location_lng : null,
        e.location_name || null, e.sort_order || 0,
        e.location_lat2 !== undefined ? e.location_lat2 : null,
        e.location_lng2 !== undefined ? e.location_lng2 : null,
        e.location_only ? 1 : 0
      );
      results.events.success++;
    } catch (err) {
      results.events.failed++;
      results.events.errors.push(`事件 ${e.title}: ${err.message}`);
    }
  }
}

function importAllData(importData) {
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
    importMaps(importData.maps, results, mapCodeToId);
    importCategories(importData.categories, results, catCodeToId);
    importSubCategories(importData.sub_categories, results, catCodeToId, mapCodeToId, subCatCodeToId);
    importEvents(importData.events, results, catCodeToId, subCatCodeToId);
  });

  tx();

  return results;
}

module.exports = {
  importMaps,
  importCategories,
  importSubCategories,
  importEvents,
  importAllData
};
