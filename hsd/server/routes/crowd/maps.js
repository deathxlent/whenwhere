const express = require('express');
const router = express.Router();
const db = require('../../crowd-db');

router.get('/', (req, res) => {
  const maps = db.prepare(`
    SELECT * FROM maps
    WHERE is_active = 1
    ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: maps });
});

router.get('/all', (req, res) => {
  const maps = db.prepare(`
    SELECT * FROM maps
    ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: maps });
});

router.get('/:id', (req, res) => {
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(req.params.id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
  }
  res.json({ success: true, data: map });
});

router.post('/', (req, res) => {
  const {
    name, code, description, tile_type = 'custom', tile_url, tile_subdomains,
    min_zoom = 0, max_zoom = 18, sort_order = 0,
    crs_type = 'simple', bounds_south, bounds_west, bounds_north, bounds_east,
    tile_ext = 'png', tile_size = 256, center_lat, center_lng, default_zoom = 2,
    distance_unit = 'km', distance_scale = 1
  } = req.body;

  if (!name || !code) {
    return res.json({ success: false, message: '名称和编码不能为空' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO maps (name, code, description, tile_type, tile_url, tile_subdomains,
        min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west,
        bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng,
        default_zoom, distance_unit, distance_scale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, code, description, tile_type, tile_url, tile_subdomains,
      min_zoom, max_zoom, sort_order, crs_type, bounds_south, bounds_west,
      bounds_north, bounds_east, tile_ext, tile_size, center_lat, center_lng,
      default_zoom, distance_unit, distance_scale
    );
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.put('/:id', (req, res) => {
  const {
    name, code, description, tile_type, tile_url, tile_subdomains,
    min_zoom, max_zoom, sort_order, is_active,
    crs_type, bounds_south, bounds_west, bounds_north, bounds_east,
    tile_ext, tile_size, center_lat, center_lng, default_zoom,
    distance_unit, distance_scale
  } = req.body;

  try {
    db.prepare(`
      UPDATE maps
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          description = COALESCE(?, description),
          tile_type = COALESCE(?, tile_type),
          tile_url = COALESCE(?, tile_url),
          tile_subdomains = COALESCE(?, tile_subdomains),
          min_zoom = COALESCE(?, min_zoom),
          max_zoom = COALESCE(?, max_zoom),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active),
          crs_type = COALESCE(?, crs_type),
          bounds_south = COALESCE(?, bounds_south),
          bounds_west = COALESCE(?, bounds_west),
          bounds_north = COALESCE(?, bounds_north),
          bounds_east = COALESCE(?, bounds_east),
          tile_ext = COALESCE(?, tile_ext),
          tile_size = COALESCE(?, tile_size),
          center_lat = COALESCE(?, center_lat),
          center_lng = COALESCE(?, center_lng),
          default_zoom = COALESCE(?, default_zoom),
          distance_unit = COALESCE(?, distance_unit),
          distance_scale = COALESCE(?, distance_scale)
      WHERE id = ?
    `).run(
      name, code, description, tile_type, tile_url, tile_subdomains,
      min_zoom, max_zoom, sort_order, is_active,
      crs_type, bounds_south, bounds_west, bounds_north, bounds_east,
      tile_ext, tile_size, center_lat, center_lng, default_zoom,
      distance_unit, distance_scale, req.params.id
    );
    res.json({ success: true, message: '更新成功' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const map = db.prepare('SELECT id FROM maps WHERE id = ?').get(req.params.id);
    if (!map) {
      return res.json({ success: false, message: '地图不存在' });
    }
    const subCount = db.prepare('SELECT COUNT(*) as cnt FROM sub_categories WHERE map_id = ?').get(req.params.id).cnt;
    if (subCount > 0) {
      return res.json({ success: false, message: '该地图下存在子分类，无法删除' });
    }
    db.prepare('DELETE FROM maps WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

module.exports = router;
