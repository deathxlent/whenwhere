const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'db', 'whenwhere.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS game_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    guess_lat REAL,
    guess_lng REAL,
    guess_year INTEGER,
    guess_month INTEGER,
    guess_day INTEGER,
    distance_km REAL,
    time_diff_years INTEGER,
    precise_location INTEGER DEFAULT 0,
    precise_time INTEGER DEFAULT 0,
    timed_out INTEGER DEFAULT 0,
    elapsed_seconds REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
  );
  CREATE INDEX IF NOT EXISTS idx_game_answers_event ON game_answers(event_id);
  CREATE INDEX IF NOT EXISTS idx_game_answers_user ON game_answers(user_id);
  CREATE INDEX IF NOT EXISTS idx_game_answers_user_event ON game_answers(user_id, event_id);
`);

module.exports = db;
