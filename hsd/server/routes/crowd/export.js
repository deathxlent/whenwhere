const express = require('express');
const router = express.Router();
const db = require('../../crowd-db');

router.get('/stats', (req, res) => {
  const maps = db.prepare('SELECT COUNT(*) as count FROM maps WHERE is_active = 1').get().count;
  const cats = db.prepare('SELECT COUNT(*) as count FROM categories WHERE is_active = 1').get().count;
  const subs = db.prepare('SELECT COUNT(*) as count FROM sub_categories WHERE is_active = 1').get().count;
  const events = db.prepare('SELECT COUNT(*) as count FROM events WHERE is_active = 1').get().count;

  const subDetail = db.prepare(`
    SELECT c.id as category_id, c.name as category_name, c.code as category_code,
      sc.id as sub_category_id, sc.name as sub_category_name, sc.code as sub_category_code,
      COUNT(e.id) as event_count
    FROM categories c
    JOIN sub_categories sc ON sc.category_id = c.id
    LEFT JOIN events e ON e.sub_category_id = sc.id AND e.is_active = 1
    WHERE c.is_active = 1 AND sc.is_active = 1
    GROUP BY sc.id
    ORDER BY c.sort_order, sc.sort_order
  `).all();

  res.json({ success: true, data: { maps, categories: cats, sub_categories: subs, events, sub_category_detail: subDetail } });
});

router.get('/events-list', (req, res) => {
  const events = db.prepare(`
    SELECT e.id, e.title, e.start_ts, e.end_ts, e.start_precision, e.end_precision,
      e.location_name, c.code as category_code, c.name as category_name,
      sc.code as sub_category_code, sc.name as sub_category_name,
      e.created_at, e.updated_at, e.contributor
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.is_active = 1
    ORDER BY e.created_at DESC
  `).all();

  res.json({ success: true, data: events });
});

router.get('/events-preview', (req, res) => {
  const events = db.prepare(`
    SELECT e.id, e.title, e.start_ts, e.end_ts, e.start_precision, e.end_precision,
      e.location_name, e.location_lat, e.location_lng,
      c.code as category_code, c.name as category_name,
      sc.code as sub_category_code, sc.name as sub_category_name
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.is_active = 1
    ORDER BY e.created_at DESC
    LIMIT 20
  `).all();

  res.json({ success: true, data: events });
});

router.get('/full', (req, res) => {
  const maps = db.prepare('SELECT * FROM maps WHERE is_active = 1 ORDER BY sort_order, id').all();
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const subCategories = db.prepare('SELECT * FROM sub_categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const events = db.prepare('SELECT * FROM events WHERE is_active = 1 ORDER BY start_ts, id').all();

  const data = {
    export_info: {
      version: '2.0',
      exported_at: new Date().toISOString(),
      source: 'crowd-crowdsourcing'
    },
    maps,
    categories,
    sub_categories: subCategories,
    events
  };

  res.json({ success: true, data });
});

router.get('/download', (req, res) => {
  const maps = db.prepare('SELECT * FROM maps WHERE is_active = 1 ORDER BY sort_order, id').all();
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const subCategories = db.prepare('SELECT * FROM sub_categories WHERE is_active = 1 ORDER BY sort_order, id').all();
  const events = db.prepare('SELECT * FROM events WHERE is_active = 1 ORDER BY start_ts, id').all();

  const data = {
    export_info: {
      version: '2.0',
      exported_at: new Date().toISOString(),
      source: 'crowd-crowdsourcing'
    },
    maps,
    categories,
    sub_categories: subCategories,
    events
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=crowd_data_${Date.now()}.json`);
  res.send(JSON.stringify(data, null, 2));
});

module.exports = router;
