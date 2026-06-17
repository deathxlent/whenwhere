const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM sub_categories sc WHERE sc.category_id = c.id) as total_sub_count,
      (SELECT COUNT(*) FROM sub_categories sc
        WHERE sc.category_id = c.id
        AND sc.map_id IS NOT NULL
        AND (SELECT COUNT(*) FROM events e WHERE e.sub_category_id = sc.id) > 0
      ) as available_sub_count,
      (SELECT COUNT(*) FROM events e
        JOIN sub_categories sc ON e.sub_category_id = sc.id
        WHERE sc.category_id = c.id
      ) as total_event_count
    FROM categories c
    ORDER BY c.sort_order, c.id
  `).all();
  res.json({ success: true, data: categories });
});

router.get('/all', (req, res) => {
  const categories = db.prepare(`
    SELECT * FROM categories ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: categories });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!category) {
    return res.json({ success: false, message: '分类不存在' });
  }
  res.json({ success: true, data: category });
});

router.post('/', (req, res) => {
  const { code, name, sort_order } = req.body;

  if (!code || !name) {
    return res.json({ success: false, message: '编码和名称不能为空' });
  }

  const exists = db.prepare('SELECT id FROM categories WHERE code = ?').get(code);
  if (exists) {
    return res.json({ success: false, message: '分类编码已存在' });
  }

  const result = db.prepare(`
    INSERT INTO categories (code, name, sort_order)
    VALUES (?, ?, ?)
  `).run(code, name, sort_order || 0);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: category, message: '添加成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, sort_order } = req.body;

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!category) {
    return res.json({ success: false, message: '分类不存在' });
  }

  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(name || null, sort_order !== undefined ? sort_order : null, id);

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!category) {
    return res.json({ success: false, message: '分类不存在' });
  }

  const subCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE category_id = ?').get(id).count;
  const eventCount = db.prepare(`
    SELECT COUNT(*) as count FROM events e
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE sc.category_id = ?
  `).get(id).count;

  if (eventCount > 0) {
    return res.json({ success: false, message: '该分类下存在事件，无法删除' });
  }
  if (subCount > 0) {
    return res.json({ success: false, message: '该分类下存在子分类，请先删除子分类' });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

router.get('/:id/sub-categories', (req, res) => {
  const { id } = req.params;
  const subCategories = db.prepare(`
    SELECT sc.*,
      m.name as map_name, m.code as map_code,
      m.tile_type as map_tile_type, m.tile_url as map_tile_url,
      m.tile_subdomains as map_tile_subdomains,
      m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom,
      m.crs_type as map_crs_type,
      m.bounds_south as map_bounds_south, m.bounds_west as map_bounds_west,
      m.bounds_north as map_bounds_north, m.bounds_east as map_bounds_east,
      m.tile_ext as map_tile_ext, m.tile_size as map_tile_size,
      m.distance_unit as map_distance_unit, m.distance_scale as map_distance_scale,
      (SELECT COUNT(*) FROM events e WHERE e.sub_category_id = sc.id) as event_count
    FROM sub_categories sc
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.category_id = ?
    ORDER BY sc.sort_order, sc.id
  `).all(id);
  res.json({ success: true, data: subCategories });
});

router.get('/sub-categories/all', (req, res) => {
  const subCategories = db.prepare(`
    SELECT sc.*,
      c.code as category_code, c.name as category_name,
      m.name as map_name, m.code as map_code
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN maps m ON sc.map_id = m.id
    ORDER BY c.sort_order, sc.sort_order, sc.id
  `).all();
  res.json({ success: true, data: subCategories });
});

router.get('/sub-categories/:id', (req, res) => {
  const { id } = req.params;
  const sub = db.prepare(`
    SELECT sc.*,
      c.code as category_code, c.name as category_name,
      m.name as map_name, m.code as map_code,
      m.tile_type as map_tile_type, m.tile_url as map_tile_url,
      m.tile_subdomains as map_tile_subdomains,
      m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom,
      m.crs_type as map_crs_type,
      m.bounds_south as map_bounds_south, m.bounds_west as map_bounds_west,
      m.bounds_north as map_bounds_north, m.bounds_east as map_bounds_east,
      m.tile_ext as map_tile_ext, m.tile_size as map_tile_size,
      m.distance_unit as map_distance_unit, m.distance_scale as map_distance_scale
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.id = ?
  `).get(id);
  if (!sub) {
    return res.json({ success: false, message: '子分类不存在' });
  }
  res.json({ success: true, data: sub });
});

router.post('/:id/sub-categories', (req, res) => {
  const { id } = req.params;
  const {
    code, name, sort_order, map_id,
    center_lat, center_lng, default_zoom, min_zoom, max_zoom
  } = req.body;

  if (!code || !name) {
    return res.json({ success: false, message: '编码和名称不能为空' });
  }

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!category) {
    return res.json({ success: false, message: '父分类不存在' });
  }

  const exists = db.prepare('SELECT id FROM sub_categories WHERE category_id = ? AND code = ?').get(id, code);
  if (exists) {
    return res.json({ success: false, message: '子分类编码在该分类下已存在' });
  }

  const result = db.prepare(`
    INSERT INTO sub_categories (category_id, code, name, sort_order, map_id,
      center_lat, center_lng, default_zoom, min_zoom, max_zoom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, code, name, sort_order || 0,
    map_id || null,
    center_lat !== undefined ? center_lat : null,
    center_lng !== undefined ? center_lng : null,
    default_zoom !== undefined ? default_zoom : 2,
    min_zoom !== undefined ? min_zoom : 2,
    max_zoom !== undefined ? max_zoom : 8
  );

  const sub = db.prepare('SELECT * FROM sub_categories WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: sub, message: '添加成功' });
});

router.put('/sub-categories/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, sort_order, map_id,
    center_lat, center_lng, default_zoom, min_zoom, max_zoom
  } = req.body;

  const sub = db.prepare('SELECT * FROM sub_categories WHERE id = ?').get(id);
  if (!sub) {
    return res.json({ success: false, message: '子分类不存在' });
  }

  db.prepare(`
    UPDATE sub_categories SET
      name = COALESCE(?, name),
      sort_order = COALESCE(?, sort_order),
      map_id = CASE WHEN ? = 1 THEN ? ELSE map_id END,
      center_lat = CASE WHEN ? = 1 THEN ? ELSE center_lat END,
      center_lng = CASE WHEN ? = 1 THEN ? ELSE center_lng END,
      default_zoom = COALESCE(?, default_zoom),
      min_zoom = COALESCE(?, min_zoom),
      max_zoom = COALESCE(?, max_zoom)
    WHERE id = ?
  `).run(
    name || null,
    sort_order !== undefined ? sort_order : null,
    map_id !== undefined ? 1 : 0,
    map_id !== undefined ? (map_id || null) : null,
    center_lat !== undefined ? 1 : 0,
    center_lat !== undefined ? (center_lat || null) : null,
    center_lng !== undefined ? 1 : 0,
    center_lng !== undefined ? (center_lng || null) : null,
    default_zoom !== undefined ? default_zoom : null,
    min_zoom !== undefined ? min_zoom : null,
    max_zoom !== undefined ? max_zoom : null,
    id
  );

  const updated = db.prepare(`
    SELECT sc.*, m.name as map_name, m.code as map_code
    FROM sub_categories sc LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.id = ?
  `).get(id);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/sub-categories/:id', (req, res) => {
  const { id } = req.params;

  const sub = db.prepare('SELECT * FROM sub_categories WHERE id = ?').get(id);
  if (!sub) {
    return res.json({ success: false, message: '子分类不存在' });
  }

  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE sub_category_id = ?').get(id).count;
  if (eventCount > 0) {
    return res.json({ success: false, message: '该子分类下存在事件，请先删除事件' });
  }

  db.prepare('DELETE FROM sub_categories WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

router.put('/:categoryId/sub-categories/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, sort_order, map_id,
    center_lat, center_lng, default_zoom, min_zoom, max_zoom
  } = req.body;

  const sub = db.prepare('SELECT * FROM sub_categories WHERE id = ?').get(id);
  if (!sub) {
    return res.json({ success: false, message: '子分类不存在' });
  }

  db.prepare(`
    UPDATE sub_categories SET
      name = COALESCE(?, name),
      sort_order = COALESCE(?, sort_order),
      map_id = CASE WHEN ? = 1 THEN ? ELSE map_id END,
      center_lat = CASE WHEN ? = 1 THEN ? ELSE center_lat END,
      center_lng = CASE WHEN ? = 1 THEN ? ELSE center_lng END,
      default_zoom = COALESCE(?, default_zoom),
      min_zoom = COALESCE(?, min_zoom),
      max_zoom = COALESCE(?, max_zoom)
    WHERE id = ?
  `).run(
    name || null,
    sort_order !== undefined ? sort_order : null,
    map_id !== undefined ? 1 : 0,
    map_id !== undefined ? (map_id || null) : null,
    center_lat !== undefined ? 1 : 0,
    center_lat !== undefined ? (center_lat || null) : null,
    center_lng !== undefined ? 1 : 0,
    center_lng !== undefined ? (center_lng || null) : null,
    default_zoom !== undefined ? default_zoom : null,
    min_zoom !== undefined ? min_zoom : null,
    max_zoom !== undefined ? max_zoom : null,
    id
  );

  const updated = db.prepare(`
    SELECT sc.*, m.name as map_name, m.code as map_code
    FROM sub_categories sc LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.id = ?
  `).get(id);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/:categoryId/sub-categories/:id', (req, res) => {
  const { id } = req.params;

  const sub = db.prepare('SELECT * FROM sub_categories WHERE id = ?').get(id);
  if (!sub) {
    return res.json({ success: false, message: '子分类不存在' });
  }

  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE sub_category_id = ?').get(id).count;
  if (eventCount > 0) {
    return res.json({ success: false, message: '该子分类下存在事件，请先删除事件' });
  }

  db.prepare('DELETE FROM sub_categories WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
