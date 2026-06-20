const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'db', 'whenwhere.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stat_date TEXT NOT NULL,
    games_played INTEGER DEFAULT 0,
    total_distance REAL DEFAULT 0,
    total_time_diff INTEGER DEFAULT 0,
    total_elapsed REAL DEFAULT 0,
    precise_location_count INTEGER DEFAULT 0,
    precise_time_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, stat_date)
  );

  CREATE INDEX IF NOT EXISTS idx_game_stats_user_date ON game_stats(user_id, stat_date);
  CREATE INDEX IF NOT EXISTS idx_game_stats_date ON game_stats(stat_date);

  CREATE TABLE IF NOT EXISTS event_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    vote_type INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  CREATE INDEX IF NOT EXISTS idx_event_votes_event ON event_votes(event_id);
  CREATE INDEX IF NOT EXISTS idx_event_votes_user ON event_votes(user_id);

  CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_favorites_event ON user_favorites(event_id);
`);

const tableInfo = db.pragma('table_info(game_stats)');
const hasPreciseLoc = tableInfo.some(c => c.name === 'precise_location_count');
const hasPreciseTime = tableInfo.some(c => c.name === 'precise_time_count');

if (!hasPreciseLoc) {
  try {
    db.exec('ALTER TABLE game_stats ADD COLUMN precise_location_count INTEGER DEFAULT 0');
    console.log('Added precise_location_count column');
  } catch(e) { console.warn('Add column failed:', e.message); }
}
if (!hasPreciseTime) {
  try {
    db.exec('ALTER TABLE game_stats ADD COLUMN precise_time_count INTEGER DEFAULT 0');
    console.log('Added precise_time_count column');
  } catch(e) { console.warn('Add column failed:', e.message); }
}

console.log('WW数据库初始化完成！');
db.close();
