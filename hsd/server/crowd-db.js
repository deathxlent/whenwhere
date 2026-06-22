const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'db', 'crowd.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDb() {
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
      distance_unit TEXT DEFAULT 'km',
      distance_scale REAL DEFAULT 1,
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
      location_type TEXT DEFAULT 'point',
      location_box_south REAL,
      location_box_west REAL,
      location_box_north REAL,
      location_box_east REAL,
      image TEXT,
      media_type TEXT DEFAULT 'none',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      contributor TEXT,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category_id, sub_category_id);
    CREATE INDEX IF NOT EXISTS idx_sub_categories_map ON sub_categories(map_id);
  `);

  const worldMap = db.prepare('SELECT id FROM maps WHERE code = ?').get('world');
  if (!worldMap) {
    db.prepare(`
      INSERT INTO maps (name, code, description, tile_type, tile_url, tile_subdomains,
        min_zoom, max_zoom, sort_order, crs_type, tile_ext, tile_size, center_lat, center_lng, default_zoom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '世界地图', 'world', '标准世界地图（高德街道图）',
      'amap_street',
      'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      '1,2,3,4', 2, 18, 1, 'epsg3857', 'png', 256, 30, 120, 2
    );
    console.log('[crowd-db] 已添加默认世界地图');
  }
}

initDb();

module.exports = db;
