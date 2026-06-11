const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { category_id, sub_category_id } = req.query;
  
  if (!category_id || !sub_category_id) {
    return res.json({ success: false, message: '缺少分类参数' });
  }

  const events = db.prepare(`
    SELECT e.*, 
      c.name as category_name, c.code as category_code,
      sc.name as sub_category_name, sc.code as sub_category_code,
      (SELECT COUNT(*) FROM event_images ei WHERE ei.event_id = e.id) as image_count
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.category_id = ? AND e.sub_category_id = ? AND e.is_active = 1
    ORDER BY e.sort_order, e.start_date, e.id
  `).all(category_id, sub_category_id);

  res.json({ success: true, data: events });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const event = db.prepare(`
    SELECT e.*, 
      c.name as category_name, c.code as category_code,
      sc.name as sub_category_name, sc.code as sub_category_code
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.id = ?
  `).get(id);

  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  res.json({ success: true, data: event });
});

router.post('/', (req, res) => {
  const {
    category_id, sub_category_id, title, start_date, end_date,
    description, location_lat, location_lng, location_name, sort_order
  } = req.body;

  if (!category_id || !sub_category_id || !title) {
    return res.json({ success: false, message: '缺少必填参数' });
  }

  const result = db.prepare(`
    INSERT INTO events (category_id, sub_category_id, title, start_date, end_date, 
      description, location_lat, location_lng, location_name, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id, sub_category_id, title, start_date || null, end_date || null,
    description || null, location_lat || null, location_lng || null,
    location_name || null, sort_order || 0
  );

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: event, message: '添加成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title, start_date, end_date, description,
    location_lat, location_lng, location_name, sort_order
  } = req.body;

  if (!title) {
    return res.json({ success: false, message: '缺少必填参数' });
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  db.prepare(`
    UPDATE events SET 
      title = ?, start_date = ?, end_date = ?, description = ?,
      location_lat = ?, location_lng = ?, location_name = ?,
      sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title, start_date || null, end_date || null, description || null,
    location_lat || null, location_lng || null, location_name || null,
    sort_order || 0, id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM event_images WHERE event_id = ?').run(id);
    db.prepare('UPDATE events SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  });
  tx();

  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
