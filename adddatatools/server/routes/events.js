const express = require('express');
const router = express.Router();
const db = require('../db');

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
  const { category_id, sub_category_id, page = 1, page_size = 20 } = req.query;

  if (!category_id || !sub_category_id) {
    return res.json({ success: false, message: '缺少分类参数' });
  }

  const offset = (page - 1) * page_size;

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM events
    WHERE category_id = ? AND sub_category_id = ? AND is_active = 1
  `).get(category_id, sub_category_id).count;

  const events = db.prepare(`
    SELECT e.*,
      c.name as category_name, c.code as category_code,
      sc.name as sub_category_name, sc.code as sub_category_code
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.category_id = ? AND e.sub_category_id = ? AND e.is_active = 1
    ORDER BY e.start_ts ASC, e.id
    LIMIT ? OFFSET ?
  `).all(category_id, sub_category_id, parseInt(page_size), offset);

  const data = events.map(e => ({
    ...e,
    start_display: tsToDisplay(e.start_ts, e.start_precision),
    end_display: tsToDisplay(e.end_ts, e.end_precision)
  }));

  res.json({ success: true, data, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/all', (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      c.name as category_name, c.code as category_code,
      sc.name as sub_category_name, sc.code as sub_category_code
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.is_active = 1
    ORDER BY e.start_ts ASC, e.id
  `).all();

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
    description, tips, location_lat, location_lng, location_name, sort_order
  } = req.body;

  if (!category_id || !sub_category_id || !title) {
    return res.json({ success: false, message: '缺少必填参数' });
  }

  const result = db.prepare(`
    INSERT INTO events (category_id, sub_category_id, title,
      start_ts, start_precision, end_ts, end_precision,
      description, tips, location_lat, location_lng, location_name, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id, sub_category_id, title,
    start_ts || null, start_precision !== undefined ? start_precision : 0,
    end_ts || null, end_precision !== undefined ? end_precision : 0,
    description || null, tips || null,
    location_lat || null, location_lng || null,
    location_name || null, sort_order || 0
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
    description, tips, location_lat, location_lng, location_name, sort_order
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
      sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title,
    start_ts !== undefined ? start_ts : null,
    start_precision !== undefined ? start_precision : 0,
    end_ts !== undefined ? end_ts : null,
    end_precision !== undefined ? end_precision : 0,
    description || null, tips || null,
    location_lat || null, location_lng || null,
    location_name || null, sort_order || 0, id
  );

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  updated.start_display = tsToDisplay(updated.start_ts, updated.start_precision);
  updated.end_display = tsToDisplay(updated.end_ts, updated.end_precision);
  res.json({ success: true, data: updated, message: '修改成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

router.post('/batch', (req, res) => {
  const events = req.body.events;
  
  if (!Array.isArray(events) || events.length === 0) {
    return res.json({ success: false, message: '没有要添加的事件' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO events (category_id, sub_category_id, title,
      start_ts, start_precision, end_ts, end_precision,
      description, tips, location_lat, location_lng, location_name, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((eventList) => {
    for (const e of eventList) {
      insertStmt.run(
        e.category_id, e.sub_category_id, e.title,
        e.start_ts || null, e.start_precision !== undefined ? e.start_precision : 0,
        e.end_ts || null, e.end_precision !== undefined ? e.end_precision : 0,
        e.description || null, e.tips || null,
        e.location_lat || null, e.location_lng || null,
        e.location_name || null, e.sort_order || 0
      );
    }
  });

  try {
    insertMany(events);
    res.json({ success: true, message: `批量添加成功，共 ${events.length} 条` });
  } catch (e) {
    res.json({ success: false, message: '批量添加失败: ' + e.message });
  }
});

module.exports = router;
