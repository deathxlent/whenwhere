const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const TILES_DIR = path.join(__dirname, '..', '..', 'tiles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mapCode = req.params.mapCode || 'temp';
    const dir = path.join(TILES_DIR, mapCode);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/', (req, res) => {
  const maps = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM sub_categories sc WHERE sc.map_id = m.id AND sc.is_active = 1) as bind_count,
      (SELECT COUNT(*) FROM events e 
        JOIN sub_categories sc ON e.sub_category_id = sc.id 
        WHERE sc.map_id = m.id AND e.is_active = 1) as event_count
    FROM maps m
    WHERE m.is_active = 1
    ORDER BY m.sort_order, m.id
  `).all();
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
  res.json({ success: true, data: map });
});

router.post('/', (req, res) => {
  const {
    name, code, description, tile_type, tile_url,
    tile_subdomains, min_zoom, max_zoom, sort_order,
    crs_type, bounds_south, bounds_west, bounds_north, bounds_east,
    tile_ext, tile_size, center_lat, center_lng, default_zoom
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
      tile_ext, tile_size, center_lat, center_lng, default_zoom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, code, description || null, tile_type || 'custom',
    tile_url || null, tile_subdomains || null,
    min_zoom !== undefined ? min_zoom : 0,
    max_zoom !== undefined ? max_zoom : 18,
    sort_order || 0,
    crs_type || 'simple',
    bounds_south || null, bounds_west || null,
    bounds_north || null, bounds_east || null,
    tile_ext || 'png', tile_size || 256,
    center_lat || null, center_lng || null,
    default_zoom !== undefined ? default_zoom : 2
  );

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(result.lastInsertRowid);
  
  const mapTileDir = path.join(TILES_DIR, code);
  if (!fs.existsSync(mapTileDir)) {
    fs.mkdirSync(mapTileDir, { recursive: true });
  }

  res.json({ success: true, data: map, message: '添加成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, code, description, tile_type, tile_url,
    tile_subdomains, min_zoom, max_zoom, sort_order,
    crs_type, bounds_south, bounds_west, bounds_north, bounds_east,
    tile_ext, tile_size, center_lat, center_lng, default_zoom
  } = req.body;

  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(id);
  if (!map) {
    return res.json({ success: false, message: '地图不存在' });
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
      sort_order = COALESCE(?, sort_order),
      crs_type = COALESCE(?, crs_type),
      bounds_south = ?,
      bounds_west = ?,
      bounds_north = ?,
      bounds_east = ?,
      tile_ext = COALESCE(?, tile_ext),
      tile_size = COALESCE(?, tile_size),
      center_lat = ?,
      center_lng = ?,
      default_zoom = COALESCE(?, default_zoom)
    WHERE id = ?
  `).run(
    name || null, code || null, description || null,
    tile_type || null, tile_url || null, tile_subdomains || null,
    min_zoom !== undefined ? min_zoom : null,
    max_zoom !== undefined ? max_zoom : null,
    sort_order !== undefined ? sort_order : null,
    crs_type || null,
    bounds_south || null, bounds_west || null,
    bounds_north || null, bounds_east || null,
    tile_ext || null, tile_size !== undefined ? tile_size : null,
    center_lat || null, center_lng || null,
    default_zoom !== undefined ? default_zoom : null,
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
    return res.json({ success: false, message: '该地图已绑定到子分类，无法删除' });
  }

  db.prepare('UPDATE maps SET is_active = 0 WHERE id = ?').run(id);
  res.json({ success: true, message: '删除成功' });
});

router.post('/:mapCode/upload-tile', upload.single('tile'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '没有上传文件' });
  }
  res.json({ success: true, message: '瓦片上传成功', data: { filename: req.file.filename } });
});

module.exports = router;
