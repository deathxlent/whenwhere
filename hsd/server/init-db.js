const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'ww', 'db', 'whenwhere.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sub_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    UNIQUE(category_id, code)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    sub_category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    start_ts INTEGER,
    start_precision INTEGER DEFAULT 0,
    end_ts INTEGER,
    end_precision INTEGER DEFAULT 0,
    description TEXT,
    location_lat REAL,
    location_lng REAL,
    location_name TEXT,
    image_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
  );

  CREATE TABLE IF NOT EXISTS event_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
  );

  CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id, sub_category_id);
  CREATE INDEX IF NOT EXISTS idx_event_images_event ON event_images(event_id);
`);

const insertCategory = db.prepare(
  'INSERT OR IGNORE INTO categories (code, name, sort_order) VALUES (?, ?, ?)'
);
const insertSubCategory = db.prepare(
  'INSERT OR IGNORE INTO sub_categories (category_id, code, name, sort_order) VALUES (?, ?, ?, ?)'
);

const categories = [
  { code: 'junior', name: '初中', sort_order: 1 },
  { code: 'senior', name: '高中', sort_order: 2 },
  { code: 'human', name: '人类', sort_order: 3 },
  { code: 'universe', name: '宇宙', sort_order: 4 },
  { code: 'virtual', name: '虚拟', sort_order: 5 }
];

categories.forEach(cat => {
  const result = insertCategory.run(cat.code, cat.name, cat.sort_order);
  const categoryId = result.lastInsertRowid || db.prepare('SELECT id FROM categories WHERE code = ?').get(cat.code).id;
  
  if (cat.code === 'junior') {
    insertSubCategory.run(categoryId, 'china', '中国史', 1);
    insertSubCategory.run(categoryId, 'world', '世界史', 2);
  }
});

console.log('数据库初始化完成！');
console.log('数据库路径:', DB_PATH);

const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
const subCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories').get().count;
console.log(`分类数: ${catCount}, 子分类数: ${subCount}`);

db.close();
