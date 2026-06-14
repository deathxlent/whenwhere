const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'ww', 'db', 'whenwhere.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    tile_type TEXT NOT NULL DEFAULT 'osm',
    tile_url TEXT,
    tile_subdomains TEXT,
    min_zoom INTEGER DEFAULT 0,
    max_zoom INTEGER DEFAULT 18,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const subCatsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sub_categories'").get();
if (!subCatsTableExists) {
  db.exec(`
    CREATE TABLE sub_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      map_id INTEGER,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      center_lat REAL,
      center_lng REAL,
      default_zoom INTEGER DEFAULT 2,
      min_zoom INTEGER DEFAULT 2,
      max_zoom INTEGER DEFAULT 8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (map_id) REFERENCES maps(id),
      UNIQUE(category_id, code)
    );
  `);
} else {
  const subColInfo = db.pragma('table_info(sub_categories)');
  const subCols = subColInfo.map(c => c.name);
  const needCols = [
    { name: 'map_id', type: 'INTEGER' },
    { name: 'center_lat', type: 'REAL' },
    { name: 'center_lng', type: 'REAL' },
    { name: 'default_zoom', type: 'INTEGER DEFAULT 2' },
    { name: 'min_zoom', type: 'INTEGER DEFAULT 2' },
    { name: 'max_zoom', type: 'INTEGER DEFAULT 8' }
  ];
  needCols.forEach(col => {
    if (!subCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE sub_categories ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column sub_categories.${col.name}`);
      } catch(e) { console.warn(`Add column ${col.name} failed:`, e.message); }
    }
  });
}

db.exec(`
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
  CREATE INDEX IF NOT EXISTS idx_sub_categories_map ON sub_categories(map_id);
`);

const insertMap = db.prepare(
  'INSERT OR IGNORE INTO maps (name, code, description, tile_type, tile_url, tile_subdomains, min_zoom, max_zoom, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

const maps = [
  {
    name: '世界地图',
    code: 'world',
    description: '标准世界地图（本地OSM瓦片+高德街道图层）',
    tile_type: 'hybrid',
    tile_url: null,
    tile_subdomains: null,
    min_zoom: 2,
    max_zoom: 8,
    sort_order: 1
  },
  {
    name: '中国地图',
    code: 'china',
    description: '以中国为中心的地图（本地OSM瓦片+高德街道图层）',
    tile_type: 'hybrid',
    tile_url: null,
    tile_subdomains: null,
    min_zoom: 2,
    max_zoom: 8,
    sort_order: 2
  }
];

maps.forEach(m => {
  insertMap.run(m.name, m.code, m.description, m.tile_type, m.tile_url, m.tile_subdomains, m.min_zoom, m.max_zoom, m.sort_order);
});

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

let juniorId = null;
categories.forEach(cat => {
  const result = insertCategory.run(cat.code, cat.name, cat.sort_order);
  const categoryId = result.lastInsertRowid || db.prepare('SELECT id FROM categories WHERE code = ?').get(cat.code).id;
  if (cat.code === 'junior') juniorId = categoryId;

  if (cat.code === 'junior') {
    insertSubCategory.run(categoryId, 'china', '中国史', 1);
    insertSubCategory.run(categoryId, 'world', '世界史', 2);
  }
});

const seniorId = db.prepare('SELECT id FROM categories WHERE code = ?').get('senior')?.id;
if (seniorId) {
  db.prepare('UPDATE sub_categories SET is_active = 0 WHERE category_id = ? AND is_active = 1').run(seniorId);
}

const worldMapId = db.prepare('SELECT id FROM maps WHERE code = ?').get('world')?.id;
const chinaMapId = db.prepare('SELECT id FROM maps WHERE code = ?').get('china')?.id;

if (juniorId && chinaMapId) {
  const chinaSub = db.prepare('SELECT id FROM sub_categories WHERE category_id = ? AND code = ?').get(juniorId, 'china');
  if (chinaSub) {
    db.prepare(`UPDATE sub_categories SET map_id = ?, center_lat = 35, center_lng = 105, default_zoom = 4, min_zoom = 2, max_zoom = 8 WHERE id = ?`).run(chinaMapId, chinaSub.id);
  }
}
if (juniorId && worldMapId) {
  const worldSub = db.prepare('SELECT id FROM sub_categories WHERE category_id = ? AND code = ?').get(juniorId, 'world');
  if (worldSub) {
    db.prepare(`UPDATE sub_categories SET map_id = ?, center_lat = 30, center_lng = 120, default_zoom = 2, min_zoom = 2, max_zoom = 8 WHERE id = ?`).run(worldMapId, worldSub.id);
  }
}

console.log('数据库初始化完成！');
console.log('数据库路径:', DB_PATH);

const mapCount = db.prepare('SELECT COUNT(*) as count FROM maps').get().count;
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
const subCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories').get().count;
console.log(`地图数: ${mapCount}, 分类数: ${catCount}, 子分类数: ${subCount}`);

db.close();
