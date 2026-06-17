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
      tile_subdomains, min_zoom, max_zoom, sort_order, distance_unit, distance_scale)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, code, description || null, tile_type || 'hybrid',
    tile_url || null, tile_subdomains || null,
    min_zoom !== undefined ? min_zoom : 0,
    max_zoom !== undefined ? max_zoom : 18,
    sort_order || 0,
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

  if (isBound) {
    const restrictedChanged =
      (name != null && name !== map.name) ||
      (code != null && code !== map.code) ||
      (tile_type != null && tile_type !== map.tile_type) ||
      (tile_url != null && tile_url !== map.tile_url) ||
      (tile_subdomains != null && tile_subdomains !== map.tile_subdomains) ||
      (sort_order !== undefined && sort_order !== null && sort_order != map.sort_order);
    if (restrictedChanged) {
      return res.json({
        success: false,
        message: '该地图已绑定到子类，仅允许修改：描述、最小缩放、最大缩放、距离单位、距离倍率'
      });
    }
  } else {
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
      distance_unit = ?,
      distance_scale = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    finalName, finalCode, finalDescription,
    finalTileType, finalTileUrl, finalTileSubdomains,
    finalMinZoom, finalMaxZoom,
    finalSortOrder,
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
