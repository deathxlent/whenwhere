const express = require('express');
const router = express.Router();
const db = require('../../crowd-db');

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

router.get('/stats', (req, res) => {
  const maps = db.prepare('SELECT COUNT(*) as count FROM maps').get().count;
  const cats = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  const subs = db.prepare('SELECT COUNT(*) as count FROM sub_categories').get().count;
  const events = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  res.json({ success: true, data: { maps, categories: cats, sub_categories: subs, events } });
});

router.get('/recent', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const events = db.prepare(`
    SELECT e.*,
      c.name as category_name, c.code as category_code,
      sc.name as sub_category_name, sc.code as sub_category_code
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.is_active = 1
    ORDER BY e.created_at DESC
    LIMIT ?
  `).all(limit);

  const data = events.map(e => ({
    ...e,
    start_display: tsToDisplay(e.start_ts, e.start_precision),
    end_display: tsToDisplay(e.end_ts, e.end_precision)
  }));
  res.json({ success: true, data });
});

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
  const event = db.prepare(`
    SELECT e.*,
      c.name as category_name, c.code as category_code,
      sc.name as sub_category_name, sc.code as sub_category_code,
      sc.center_lat, sc.center_lng, sc.default_zoom, sc.min_zoom, sc.max_zoom,
      sc.map_id, m.tile_type, m.tile_url, m.tile_subdomains, m.crs_type,
      m.bounds_south, m.bounds_west, m.bounds_north, m.bounds_east,
      m.tile_size, m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom,
      m.distance_unit, m.distance_scale
    FROM events e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN sub_categories sc ON e.sub_category_id = sc.id
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  event.start_display = tsToDisplay(event.start_ts, event.start_precision);
  event.end_display = tsToDisplay(event.end_ts, event.end_precision);
  res.json({ success: true, data: event });
});

router.post('/', (req, res) => {
  const {
    category_id, sub_category_id, title, start_ts, start_precision = 0,
    end_ts, end_precision = 0, description, tips,
    location_lat, location_lng, location_name, location_type = 'point',
    location_box_south, location_box_west, location_box_north, location_box_east,
    image, media_type = 'none', sort_order = 0, contributor, source
  } = req.body;

  if (!category_id || !sub_category_id || !title) {
    return res.json({ success: false, message: '分类和标题不能为空' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO events (
        category_id, sub_category_id, title, start_ts, start_precision,
        end_ts, end_precision, description, tips,
        location_lat, location_lng, location_name, location_type,
        location_box_south, location_box_west, location_box_north, location_box_east,
        image, media_type, sort_order, contributor, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      category_id, sub_category_id, title, start_ts ?? null, start_precision,
      end_ts ?? null, end_precision, description || null, tips || null,
      location_lat ?? null, location_lng ?? null, location_name || null, location_type,
      location_box_south ?? null, location_box_west ?? null,
      location_box_north ?? null, location_box_east ?? null,
      image || null, media_type, sort_order, contributor || null, source || null
    );
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.put('/:id', (req, res) => {
  const {
    title, start_ts, start_precision, end_ts, end_precision,
    description, tips, location_lat, location_lng, location_name, location_type,
    location_box_south, location_box_west, location_box_north, location_box_east,
    image, media_type, sort_order, is_active, contributor, source
  } = req.body;

  try {
    db.prepare(`
      UPDATE events
      SET title = COALESCE(?, title),
          start_ts = COALESCE(?, start_ts),
          start_precision = COALESCE(?, start_precision),
          end_ts = COALESCE(?, end_ts),
          end_precision = COALESCE(?, end_precision),
          description = COALESCE(?, description),
          tips = COALESCE(?, tips),
          location_lat = COALESCE(?, location_lat),
          location_lng = COALESCE(?, location_lng),
          location_name = COALESCE(?, location_name),
          location_type = COALESCE(?, location_type),
          location_box_south = COALESCE(?, location_box_south),
          location_box_west = COALESCE(?, location_box_west),
          location_box_north = COALESCE(?, location_box_north),
          location_box_east = COALESCE(?, location_box_east),
          image = COALESCE(?, image),
          media_type = COALESCE(?, media_type),
          sort_order = COALESCE(?, sort_order),
          is_active = COALESCE(?, is_active),
          contributor = COALESCE(?, contributor),
          source = COALESCE(?, source),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, start_ts, start_precision, end_ts, end_precision,
      description, tips, location_lat, location_lng, location_name, location_type,
      location_box_south, location_box_west, location_box_north, location_box_east,
      image, media_type, sort_order, is_active, contributor, source, req.params.id
    );
    res.json({ success: true, message: '更新成功' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);
    if (!event) {
      return res.json({ success: false, message: '事件不存在' });
    }
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

module.exports = router;
