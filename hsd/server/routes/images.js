const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const IMAGES_ROOT = path.join(__dirname, '..', '..', '..', 'ww', 'static', 'images');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }.recursive.;
  }
};

const getEventImageDir = (categoryCode, subCategoryCode, eventId) => {
  return path.join(IMAGES_ROOT, categoryCode, subCategoryCode, String(eventId));
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { event_id } = req.body;
    if (!event_id) {
      return cb(new Error('缺少事件ID'));
    }
    
    const event = db.prepare(`
      SELECT e.id, c.code as category_code, sc.code as sub_category_code
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN sub_categories sc ON e.sub_category_id = sc.id
      WHERE e.id = ?
    `).get(event_id);
    
    if (!event) {
      return cb(new Error('事件不存在'));
    }
    
    const dir = getEventImageDir(event.category_code, event.sub_category_code, event.id);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    cb(null, `${timestamp}_${random}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式'));
    }
  }
});

router.post('/upload', (req, res) => {
  upload.array('images', 20)(req, res, (err) => {
    if (err) {
      return res.json({ success: false, message: err.message });
    }
    
    const { event_id } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: '没有上传文件' });
    }
    
    const event = db.prepare(`
      SELECT e.id, c.code as category_code, sc.code as sub_category_code
      FROM events e
      JOIN categories c ON e.category_id = c.id
      JOIN sub_categories sc ON e.sub_category_id = sc.id
      WHERE e.id = ?
    `).get(event_id);
    
    const insertImage = db.prepare(`
      INSERT INTO event_images (event_id, filename, original_name, file_path, file_size)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const inserted = [];
    req.files.forEach((file, index) => {
      const relativePath = path.join(event.category_code, event.sub_category_code, event_id, file.filename);
      const result = insertImage.run(
        event_id, file.filename, file.originalname, relativePath.replace(/\\/g, '/'), file.size
      );
      inserted.push({
        id: result.lastInsertRowid,
        filename: file.filename,
        original_name: file.originalname,
        url: `/images/${event.category_code}/${event.sub_category_code}/${event_id}/${file.filename}`
      });
    });
    
    const count = db.prepare('SELECT COUNT(*) as cnt FROM event_images WHERE event_id = ?').get(event_id).cnt;
    db.prepare('UPDATE events SET image_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(count, event_id);
    
    res.json({ success: true, data: inserted, message: `上传成功 ${inserted.length} 张图片` });
  });
});

router.post('/add-url', (req, res) => {
  const { event_id, url, name } = req.body;

  if (!event_id || !url) {
    return res.json({ success: false, message: '参数不完整' });
  }

  if (!/^https?:\/\//i.test(url)) {
    return res.json({ success: false, message: 'URL必须以http://或https://开头' });
  }

  const event = db.prepare(`
    SELECT e.id, c.code as category_code, sc.code as sub_category_code
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.id = ?
  `).get(event_id);

  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  try {
    const urlObj = new URL(url);
    let filename = decodeURIComponent(urlObj.pathname.split('/').pop()) || `url_${Date.now()}.jpg`;
    if (!/\.[a-zA-Z0-9]{2,5}$/.test(filename)) {
      filename += '.jpg';
    }
    filename = filename.replace(/[^a-zA-Z0-9\.\-_]/g, '_');
    filename = `url_${Date.now()}_${filename}`;

    const insertImage = db.prepare(`
      INSERT INTO event_images (event_id, filename, original_name, file_path, file_size)
      VALUES (?, ?, ?, ?, 0)
    `);

    const result = insertImage.run(event_id, filename, name || '', url);

    const count = db.prepare('SELECT COUNT(*) as cnt FROM event_images WHERE event_id = ?').get(event_id).cnt;
    db.prepare('UPDATE events SET image_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(count, event_id);

    res.json({
      success: true,
      message: 'URL图片添加成功',
      data: [{
        id: result.lastInsertRowid,
        filename,
        original_name: name || '',
        url: url
      }]
    });
  } catch (e) {
    res.json({ success: false, message: 'URL格式错误: ' + e.message });
  }
});

router.get('/event/:eventId', (req, res) => {
  const { eventId } = req.params;
  
  const images = db.prepare(`
    SELECT * FROM event_images 
    WHERE event_id = ? 
    ORDER BY sort_order, id
  `).all(eventId);
  
  const event = db.prepare(`
    SELECT c.code as category_code, sc.code as sub_category_code
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.id = ?
  `).get(eventId);
  
  const data = images.map(img => {
    if (img.file_path && (img.file_path.startsWith('http://') || img.file_path.startsWith('https://'))) {
      return { ...img, url: img.file_path };
    }
    return {
      ...img,
      url: `/images/${event.category_code}/${event.sub_category_code}/${eventId}/${img.filename}`
    };
  });
  
  res.json({ success: true, data });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const image = db.prepare('SELECT * FROM event_images WHERE id = ?').get(id);
  if (!image) {
    return res.json({ success: false, message: '图片不存在' });
  }
  
  const count = db.prepare('SELECT COUNT(*) as cnt FROM event_images WHERE event_id = ?').get(image.event_id).cnt;
  if (count <= 1) {
    return res.json({ success: false, message: '至少需要保留一张图片' });
  }
  
  const fullPath = path.join(IMAGES_ROOT, image.file_path);
  
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM event_images WHERE id = ?').run(id);
    const newCount = db.prepare('SELECT COUNT(*) as cnt FROM event_images WHERE event_id = ?').get(image.event_id).cnt;
    db.prepare('UPDATE events SET image_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newCount, image.event_id);
  });
  tx();
  
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (e) {
    console.error('删除文件失败:', e);
  }
  
  res.json({ success: true, message: '删除成功' });
});

router.post('/sort', (req, res) => {
  const { images } = req.body;
  
  if (!Array.isArray(images)) {
    return res.json({ success: false, message: '参数错误' });
  }
  
  const updateStmt = db.prepare('UPDATE event_images SET sort_order = ? WHERE id = ?');
  const tx = db.transaction(() => {
    images.forEach((img, idx) => {
      updateStmt.run(idx, img.id);
    });
  });
  tx();
  
  res.json({ success: true, message: '排序更新成功' });
});

module.exports = router;
