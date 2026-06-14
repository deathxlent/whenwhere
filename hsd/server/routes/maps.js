const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const maps = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM sub_categories sc WHERE sc.map_id = m.id AND sc.is_active = 1) as bind_count
    FROM maps m
    WHERE m.is_active = 1
    ORDER BY m.sort_order, m.id
  `).all();

  maps.forEach(map => {
    const subs = db.prepare(`
      SELECT sc.id, sc.code, sc.name, sc.category_id, c.name as category_name, c.code as category_code
      FROM sub_categories sc
      JOIN categories c ON sc.category_id = c.id
      WHERE sc.map_id = ? AND sc.is_active = 1 AND c.is_active = 1
      ORDER BY c.sort_order, sc.sort_order
    `).all(map.id);
    map.bind_subs = subs;
  });

  res.json({ success: true, data: maps });
});

router.get('/all', (req, res) => {
  const maps = db.prepare(`
    SELECT * FROM maps WHERE is_active = 1 ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: maps });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const map = db.prepare('SELECT * FROM maps WHERE id = ? AND is_active = 1').get(id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
  }
  const bindCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE map_id = ?').get(id).count;
  res.json({ success: true, data: { ...map, bind_count: bindCount } });
});

router.post('/', (req, res) => {
  const {
    name, code, description, tile_type, tile_url,
    tile_subdomains, min_zoom, max_zoom, sort_order
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
      tile_subdomains, min_zoom, max_zoom, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, code, description || null, tile_type || 'hybrid',
    tile_url || null, tile_subdomains || null,
    min_zoom !== undefined ? min_zoom : 0,
    max_zoom !== undefined ? max_zoom : 18,
    sort_order || 0
  );

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: map, message: '添加成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, code, description, tile_type, tile_url,
    tile_subdomains, min_zoom, max_zoom, sort_order
  } = req.body;

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
  }

  const bindCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE map_id = ?').get(id).count;
  if (bindCount > 0) {
    return res.json({ success: false, message: '该地图已绑定到子类，无法修改' });
  }

  if (code && code !== map.code) {
    const exists = db.prepare('SELECT id FROM maps WHERE code = ? AND id != ?').get(code, id);
    if (exists) {
      return res.json({ success: false, message: '地图编码已存在' });
    }
  }

  db.prepare(`
    UPDATE maps SET
      name = COALESCE(?, name),
      code = COALESCE(?, code),
      description = ?,
      tile_type = COALESCE(?, tile_type),
      tile_url = ?,
      tile_subdomains = ?,
      min_zoom = COALESCE(?, min_zoom),
      max_zoom = COALESCE(?, max_zoom),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(
    name || null, code || null, description || null,
    tile_type || null, tile_url || null, tile_subdomains || null,
    min_zoom !== undefined ? min_zoom : null,
    max_zoom !== undefined ? max_zoom : null,
    sort_order !== undefined ? sort_order : null,
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

  db.prepare('UPDATE maps SET is_active = 0 WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
