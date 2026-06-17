const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const maps = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM sub_categories sc WHERE sc.map_id = m.id) as bind_count
    FROM maps m
    ORDER BY m.sort_order, m.id
  `).all();

  maps.forEach(map => {
    const subs = db.prepare(`
      SELECT sc.id, sc.code, sc.name, sc.category_id, c.name as category_name, c.code as category_code
      FROM sub_categories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE sc.map_id = ?
      ORDER BY c.sort_order, sc.sort_order
    `).all(map.id);
    map.bind_subs = subs;
  });

  res.json({ success: true, data: maps });
});

router.get('/all', (req, res) => {
  const maps = db.prepare(`
    SELECT * FROM maps ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: maps });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
  }
  const bindCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE map_id = ?').get(id).count;
  res.json({ success: true, data: { ...map, bind_count: bindCount } });
});

router.post('/', (req, res) => {
  const {
    name, code, description, tile_type, tile_url,
    tile_subdomains, min_zoom, max_zoom, sort_order,
    distance_unit, distance_scale
  } = req.body;

  if (!name || !code) {
    return res.json({ success: false, message: '名称和编码不能为空' });
  }

  const exists = db.prepare('SELECT id FROM maps WHERE code = ?').get(code);
  if (exists) {
    return res.json({ success: false, message: '地图编码已存在' });
  }

  const result = db.prepare(`
    INSERT INTO maps (name, code, description, tile_type, tile_url,
      tile_subdomains, min_zoom, max_zoom, sort_order, crs_type,
      bounds_south, bounds_west, bounds_north, bounds_east,
      tile_ext, tile_size, distance_unit, distance_scale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, code, description || null, tile_type || 'hybrid',
    tile_url || null, tile_subdomains || null,
    min_zoom !== undefined ? min_zoom : 0,
    max_zoom !== undefined ? max_zoom : 18,
    sort_order || 0,
    'epsg3857',
    null, null, null, null,
    'png', 256,
    distance_unit || 'km',
    distance_scale !== undefined ? distance_scale : 1
  );

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: map, message: '添加成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, code, description, tile_type, tile_url,
    tile_subdomains, min_zoom, max_zoom, sort_order,
    crs_type, bounds_south, bounds_west, bounds_north, bounds_east,
    tile_ext, tile_size,
    distance_unit, distance_scale
  } = req.body;

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
  }

  const bindCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE map_id = ?').get(id).count;
  const isBound = bindCount > 0;

  let finalName = map.name;
  let finalCode = map.code;
  let finalTileType = map.tile_type;
  let finalTileUrl = map.tile_url;
  let finalTileSubdomains = map.tile_subdomains;
  let finalSortOrder = map.sort_order;
  let finalCrsType = map.crs_type;
  let finalBoundsSouth = map.bounds_south;
  let finalBoundsWest = map.bounds_west;
  let finalBoundsNorth = map.bounds_north;
  let finalBoundsEast = map.bounds_east;
  let finalTileExt = map.tile_ext;
  let finalTileSize = map.tile_size;

  if (!isBound) {
    if (code != null && code !== map.code) {
      const exists = db.prepare('SELECT id FROM maps WHERE code = ? AND id != ?').get(code, id);
      if (exists) {
        return res.json({ success: false, message: '地图编码已存在' });
      }
    }
    finalName = name != null ? (name || null) : map.name;
    finalCode = code != null ? (code || null) : map.code;
    finalTileType = tile_type != null ? (tile_type || null) : map.tile_type;
    finalTileUrl = tile_url != null ? (tile_url || null) : map.tile_url;
    finalTileSubdomains = tile_subdomains != null ? (tile_subdomains || null) : map.tile_subdomains;
    finalSortOrder = sort_order !== undefined ? (sort_order !== null ? sort_order : map.sort_order) : map.sort_order;
    finalCrsType = crs_type != null ? (crs_type || null) : map.crs_type;
    finalBoundsSouth = bounds_south !== undefined ? (bounds_south !== null ? bounds_south : null) : map.bounds_south;
    finalBoundsWest = bounds_west !== undefined ? (bounds_west !== null ? bounds_west : null) : map.bounds_west;
    finalBoundsNorth = bounds_north !== undefined ? (bounds_north !== null ? bounds_north : null) : map.bounds_north;
    finalBoundsEast = bounds_east !== undefined ? (bounds_east !== null ? bounds_east : null) : map.bounds_east;
    finalTileExt = tile_ext != null ? (tile_ext || null) : map.tile_ext;
    finalTileSize = tile_size !== undefined ? (tile_size !== null ? tile_size : map.tile_size) : map.tile_size;
  }

  const finalDescription = description != null ? (description || null) : map.description;
  const finalMinZoom = min_zoom !== undefined ? (min_zoom !== null ? min_zoom : map.min_zoom) : map.min_zoom;
  const finalMaxZoom = max_zoom !== undefined ? (max_zoom !== null ? max_zoom : map.max_zoom) : map.max_zoom;
  const finalDistanceUnit = distance_unit != null ? (distance_unit || null) : map.distance_unit;
  const finalDistanceScale = distance_scale !== undefined ? (distance_scale !== null ? distance_scale : map.distance_scale) : map.distance_scale;

  db.prepare(`
    UPDATE maps SET
      name = ?,
      code = ?,
      description = ?,
      tile_type = ?,
      tile_url = ?,
      tile_subdomains = ?,
      min_zoom = ?,
      max_zoom = ?,
      sort_order = ?,
      crs_type = ?,
      bounds_south = ?,
      bounds_west = ?,
      bounds_north = ?,
      bounds_east = ?,
      tile_ext = ?,
      tile_size = ?,
      distance_unit = ?,
      distance_scale = ?
    WHERE id = ?
  `).run(
    finalName, finalCode, finalDescription,
    finalTileType, finalTileUrl, finalTileSubdomains,
    finalMinZoom, finalMaxZoom,
    finalSortOrder,
    finalCrsType, finalBoundsSouth, finalBoundsWest, finalBoundsNorth, finalBoundsEast,
    finalTileExt, finalTileSize,
    finalDistanceUnit, finalDistanceScale,
    id
  );

  const updated = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
  }

  const bindCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE map_id = ?').get(id).count;
  if (bindCount > 0) {
    return res.json({ success: false, message: '该地图已绑定到子类，无法删除' });
  }

  db.prepare('DELETE FROM maps WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
