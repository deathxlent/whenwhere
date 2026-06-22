const express = require('express');
const router = express.Router();
const db = require('../../crowd-db');

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT * FROM categories
    WHERE is_active = 1
    ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: categories });
});

router.get('/all', (req, res) => {
  const categories = db.prepare(`
    SELECT * FROM categories
    ORDER BY sort_order, id
  `).all();
  res.json({ success: true, data: categories });
});

router.get('/:id', (req, res) => {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!cat) {
    return res.json({ success: false, message: '分类不存在' });
  }

  const subCategories = db.prepare(`
    SELECT sc.*, m.name as map_name
    FROM sub_categories sc
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.category_id = ?
    ORDER BY sc.sort_order, sc.id
  `).all(cat.id);

  res.json({ success: true, data: { ...cat, sub_categories: subCategories } });
});

router.get('/sub-categories/all', (req, res) => {
  const subs = db.prepare(`
    SELECT sc.*, c.name as category_name, c.code as category_code, m.name as map_name
    FROM sub_categories sc
    JOIN categories c ON sc.category_id = c.id
    LEFT JOIN maps m ON sc.map_id = m.id
    ORDER BY c.sort_order, sc.sort_order, sc.id
  `).all();
  res.json({ success: true, data: subs });
});

router.get('/:id/sub-categories', (req, res) => {
  const subs = db.prepare(`
    SELECT sc.*, m.name as map_name
    FROM sub_categories sc
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE sc.category_id = ? AND sc.is_active = 1
    ORDER BY sc.sort_order, sc.id
  `).all(req.params.id);
  res.json({ success: true, data: subs });
});

router.post('/', (req, res) => {
  const { code, name, sort_order = 0 } = req.body;
  if (!code || !name) {
    return res.json({ success: false, message: '编码和名称不能为空' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO categories (code, name, sort_order)
      VALUES (?, ?, ?)
    `).run(code, name, sort_order);
    res.json({ success: true, data: { id: result.lastInsertRowid, code, name, sort_order } });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.put('/:id', (req, res) => {
  const { code, name, sort_order, is_active } = req.body;
  try {
    db.prepare(`
      UPDATE categories
      SET code = COALESCE(?, code),
          name = COALESCE(?, name),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(code, name, sort_order, is_active, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.post('/sub-category', (req, res) => {
  const { category_id, map_id, code, name, sort_order = 0,
          center_lat, center_lng, default_zoom, min_zoom, max_zoom } = req.body;
  if (!category_id || !code || !name) {
    return res.json({ success: false, message: '分类ID、编码和名称不能为空' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO sub_categories (category_id, map_id, code, name, sort_order,
        center_lat, center_lng, default_zoom, min_zoom, max_zoom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(category_id, map_id || null, code, name, sort_order,
           center_lat || null, center_lng || null,
           default_zoom || 2, min_zoom || 2, max_zoom || 8);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.put('/sub-category/:id', (req, res) => {
  const { map_id, name, sort_order, is_active,
          center_lat, center_lng, default_zoom, min_zoom, max_zoom } = req.body;
  try {
    db.prepare(`
      UPDATE sub_categories
      SET map_id = COALESCE(?, map_id),
          name = COALESCE(?, name),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active),
          center_lat = COALESCE(?, center_lat),
          center_lng = COALESCE(?, center_lng),
          default_zoom = COALESCE(?, default_zoom),
          min_zoom = COALESCE(?, min_zoom),
          max_zoom = COALESCE(?, max_zoom)
      WHERE id = ?
    `).run(map_id, name, sort_order, is_active,
           center_lat, center_lng, default_zoom, min_zoom, max_zoom, req.params.id);
    res.json({ success: true, message: '更新成功' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.delete('/sub-category/:id', (req, res) => {
  try {
    db.prepare('UPDATE sub_categories SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

module.exports = router;
