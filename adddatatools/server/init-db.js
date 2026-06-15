const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'db', 'adddata.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    tile_type TEXT NOT NULL DEFAULT 'custom',
    tile_url TEXT,
    tile_subdomains TEXT,
    min_zoom INTEGER DEFAULT 0,
    max_zoom INTEGER DEFAULT 18,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    crs_type TEXT DEFAULT 'simple',
    bounds_south REAL,
    bounds_west REAL,
    bounds_north REAL,
    bounds_east REAL,
    tile_ext TEXT DEFAULT 'png',
    tile_size INTEGER DEFAULT 256,
    center_lat REAL,
    center_lng REAL,
    default_zoom INTEGER DEFAULT 2,
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

  CREATE TABLE IF NOT EXISTS sub_categories (
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
    tips TEXT,
    location_lat REAL,
    location_lng REAL,
    location_name TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
  );

  CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id, sub_category_id);
  CREATE INDEX IF NOT EXISTS idx_sub_categories_map ON sub_categories(map_id);
`);

const worldMap = {
  name: '世界地图',
  code: 'world',
  description: '标准世界地图（高德街道图）',
  tile_type: 'amap_street',
  tile_url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
  tile_subdomains: '1,2,3,4',
  min_zoom: 2,
  max_zoom: 18,
  sort_order: 1,
  crs_type: 'epsg3857',
  tile_ext: 'png',
  tile_size: 256,
  center_lat: 30,
  center_lng: 120,
  default_zoom: 2
};

const existingMap = db.prepare('SELECT id FROM maps WHERE code = ?').get(worldMap.code);
if (!existingMap) {
  db.prepare(`
    INSERT INTO maps (name, code, description, tile_type, tile_url, tile_subdomains,
      min_zoom, max_zoom, sort_order, crs_type, tile_ext, tile_size, center_lat, center_lng, default_zoom)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    worldMap.name, worldMap.code, worldMap.description, worldMap.tile_type,
    worldMap.tile_url, worldMap.tile_subdomains, worldMap.min_zoom, worldMap.max_zoom,
    worldMap.sort_order, worldMap.crs_type, worldMap.tile_ext, worldMap.tile_size,
    worldMap.center_lat, worldMap.center_lng, worldMap.default_zoom
  );
  console.log('已添加默认世界地图');
}

console.log('数据库初始化完成！');
console.log('数据库路径:', DB_PATH);

const mapCount = db.prepare('SELECT COUNT(*) as count FROM maps').get().count;
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
const subCount = db.prepare('SELECT COUNT(*) as count FROM sub_categories').get().count;
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
console.log(`地图数: ${mapCount}, 分类数: ${catCount}, 子分类数: ${subCount}, 事件数: ${eventCount}`);

db.close();
