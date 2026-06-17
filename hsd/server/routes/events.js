const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

const IMAGES_ROOT = path.join(__dirname, '..', '..', '..', 'ww', 'static', 'images');

function tsToDisplay(ts, precision) {
  if (ts === null || ts === undefined) return '-';
  const absTs = Math.abs(ts);
  const sign = ts < 0 ? -1 : 1;
  let year, month, day;
  if (absTs >= 10000000) {
    day = absTs % 100;
    const rest = Math.floor(absTs / 100);
    month = rest % 100;
    year = Math.floor(rest / 100);
  } else {
    day = absTs % 100;
    const rest = Math.floor(absTs / 100);
    month = rest % 100;
    year = Math.floor(rest / 100);
  }
  if (sign < 0) year = -year;
  const prefix = year < 0 ? '公元前' : '';
  const absYear = Math.abs(year);
  if (precision === 0) return `${prefix}${absYear}年`;
  if (precision === 1) return `${prefix}${absYear}年${month}月`;
  return `${prefix}${absYear}年${month}月${day}日`;
}

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
    WHERE e.category_id = ? AND e.sub_category_id = ?
    ORDER BY e.start_ts ASC, e.id
  `).all(category_id, sub_category_id);

  const data = events.map(e => ({
    ...e,
    start_display: tsToDisplay(e.start_ts, e.start_precision),
    end_display: tsToDisplay(e.end_ts, e.end_precision)
  }));

  res.json({ success: true, data });
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

  event.start_display = tsToDisplay(event.start_ts, event.start_precision);
  event.end_display = tsToDisplay(event.end_ts, event.end_precision);

  res.json({ success: true, data: event });
});

router.post('/', (req, res) => {
  const {
    category_id, sub_category_id, title,
    start_ts, start_precision, end_ts, end_precision,
    description, tips, location_lat, location_lng, location_name, sort_order,
    location_lat2, location_lng2, location_only
  } = req.body;

  if (!category_id || !sub_category_id || !title) {
    return res.json({ success: false, message: '缺少必填参数' });
  }

  const result = db.prepare(`
    INSERT INTO events (category_id, sub_category_id, title,
      start_ts, start_precision, end_ts, end_precision,
      description, tips, location_lat, location_lng, location_name, sort_order,
      location_lat2, location_lng2, location_only)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id, sub_category_id, title,
    start_ts || null, start_precision !== undefined ? start_precision : 0,
    end_ts || null, end_precision !== undefined ? end_precision : 0,
    description || null, tips || null,
    location_lat || null, location_lng || null,
    location_name || null, sort_order || 0,
    location_lat2 || null, location_lng2 || null,
    location_only ? 1 : 0
  );

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  event.start_display = tsToDisplay(event.start_ts, event.start_precision);
  event.end_display = tsToDisplay(event.end_ts, event.end_precision);
  res.json({ success: true, data: event, message: '添加成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    title,
    start_ts, start_precision, end_ts, end_precision,
    description, tips, location_lat, location_lng, location_name, sort_order,
    location_lat2, location_lng2, location_only
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
      title = ?, start_ts = ?, start_precision = ?, end_ts = ?, end_precision = ?,
      description = ?, tips = ?, location_lat = ?, location_lng = ?, location_name = ?,
      sort_order = ?, location_lat2 = ?, location_lng2 = ?, location_only = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title,
    start_ts !== undefined ? start_ts : null,
    start_precision !== undefined ? start_precision : 0,
    end_ts !== undefined ? end_ts : null,
    end_precision !== undefined ? end_precision : 0,
    description || null, tips || null,
    location_lat || null, location_lng || null,
    location_name || null, sort_order || 0,
    location_lat2 || null, location_lng2 || null,
    location_only ? 1 : 0,
    id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  updated.start_display = tsToDisplay(updated.start_ts, updated.start_precision);
  updated.end_display = tsToDisplay(updated.end_ts, updated.end_precision);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const event = db.prepare(`
    SELECT e.*, c.code as category_code, sc.code as sub_category_code
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.id = ?
  `).get(id);

  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  const images = db.prepare('SELECT * FROM event_images WHERE event_id = ?').all(id);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM event_images WHERE event_id = ?').run(id);
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
  });
  tx();

  const eventDir = path.join(IMAGES_ROOT, event.category_code, event.sub_category_code, String(id));
  try {
    if (fs.existsSync(eventDir)) {
      images.forEach(img => {
        const filePath = path.join(IMAGES_ROOT, img.file_path);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      });
      try { fs.rmdirSync(eventDir, { recursive: true }); } catch (e) {}
    }
  } catch (e) {
    console.error('删除图片文件失败:', e);
  }

  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
