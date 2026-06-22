var SQL;
var db;
var DB_NAME = 'whenwhere.db';
var _initPromise = null;
var _initError = null;

async function initDatabase() {
  if (_initPromise) return _initPromise;

  _initPromise = _doInit();
  return _initPromise;
}

async function _doInit() {
  try {
    SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    const stored = localStorage.getItem('ww_db');
    if (stored) {
      const buf = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
      db = new SQL.Database(buf);
    } else {
      try {
        const resp = await fetch('/whenwhere.db');
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          db = new SQL.Database(new Uint8Array(arrayBuf));
        } else {
          db = new SQL.Database();
        }
      } catch (e) {
        db = new SQL.Database();
      }
      _initTables();
    }

    db.run('PRAGMA foreign_keys = ON');
    return db;
  } catch (e) {
    _initError = e;
    throw e;
  }
}

function _initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      token_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_game_answers_event ON game_answers(event_id);
    CREATE INDEX IF NOT EXISTS idx_game_answers_user ON game_answers(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_answers_user_event ON game_answers(user_id, event_id);

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
      UNIQUE(user_id, event_id)
    );

    CREATE INDEX IF NOT EXISTS idx_event_votes_event ON event_votes(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_votes_user ON event_votes(user_id);

    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, event_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_favorites_event ON user_favorites(event_id);

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      tier INTEGER NOT NULL DEFAULT 1,
      icon TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      current_value INTEGER DEFAULT 0,
      unlocked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

    CREATE TABLE IF NOT EXISTS user_rank_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      rank_month TEXT NOT NULL,
      rank_level INTEGER NOT NULL DEFAULT 0,
      rank_name TEXT NOT NULL,
      achievement_count INTEGER DEFAULT 0,
      total_games INTEGER DEFAULT 0,
      total_precise_location INTEGER DEFAULT 0,
      total_precise_time INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, rank_month)
    );

    CREATE INDEX IF NOT EXISTS idx_user_rank_history_user ON user_rank_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_rank_history_month ON user_rank_history(rank_month);

    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      precise_location INTEGER DEFAULT 0,
      precise_time INTEGER DEFAULT 0,
      precise_both INTEGER DEFAULT 0,
      neither_precise_streak INTEGER DEFAULT 0,
      max_neither_streak INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
  `);

  const cnt = _queryVal('SELECT COUNT(*) as cnt FROM achievements');
  if (cnt === 0) {
    const data = [
      { code: 'precise_location_10', name: '精确制导 I', description: '完成 10 次精准位置猜中', type: 'precise_location', target_value: 10, tier: 1, icon: '🎯' },
      { code: 'precise_location_50', name: '精确制导 II', description: '完成 50 次精准位置猜中', type: 'precise_location', target_value: 50, tier: 2, icon: '🎯' },
      { code: 'precise_location_100', name: '精确制导 III', description: '完成 100 次精准位置猜中', type: 'precise_location', target_value: 100, tier: 3, icon: '🎯' },
      { code: 'precise_location_500', name: '精确制导 IV', description: '完成 500 次精准位置猜中', type: 'precise_location', target_value: 500, tier: 4, icon: '🎯' },
      { code: 'precise_time_10', name: '时间旅人 I', description: '完成 10 次精准时间猜中', type: 'precise_time', target_value: 10, tier: 1, icon: '⏳' },
      { code: 'precise_time_50', name: '时间旅人 II', description: '完成 50 次精准时间猜中', type: 'precise_time', target_value: 50, tier: 2, icon: '⏳' },
      { code: 'precise_time_100', name: '时间旅人 III', description: '完成 100 次精准时间猜中', type: 'precise_time', target_value: 100, tier: 3, icon: '⏳' },
      { code: 'precise_time_500', name: '时间旅人 IV', description: '完成 500 次精准时间猜中', type: 'precise_time', target_value: 500, tier: 4, icon: '⏳' },
      { code: 'neither_precise_10', name: '百答不中 I', description: '连续 10 次既没猜中位置也没猜中时间', type: 'neither_precise_streak', target_value: 10, tier: 1, icon: '🤔' },
      { code: 'neither_precise_50', name: '百答不中 II', description: '连续 50 次既没猜中位置也没猜中时间', type: 'neither_precise_streak', target_value: 50, tier: 2, icon: '🤔' },
      { code: 'neither_precise_100', name: '百答不中 III', description: '连续 100 次既没猜中位置也没猜中时间', type: 'neither_precise_streak', target_value: 100, tier: 3, icon: '🤔' },
      { code: 'neither_precise_500', name: '百答不中 IV', description: '连续 500 次既没猜中位置也没猜中时间', type: 'neither_precise_streak', target_value: 500, tier: 4, icon: '🤔' },
      { code: 'games_played_100', name: '游戏达人 I', description: '累计完成 100 场游戏', type: 'games_played', target_value: 100, tier: 1, icon: '🎮' },
      { code: 'games_played_500', name: '游戏达人 II', description: '累计完成 500 场游戏', type: 'games_played', target_value: 500, tier: 2, icon: '🎮' },
      { code: 'games_played_1000', name: '游戏达人 III', description: '累计完成 1000 场游戏', type: 'games_played', target_value: 1000, tier: 3, icon: '🎮' }
    ];
    for (const a of data) {
      db.run(
        'INSERT INTO achievements (code, name, description, type, target_value, tier, icon) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [a.code, a.name, a.description, a.type, a.target_value, a.tier, a.icon]
      );
    }
  }

  saveDatabase();
}

async function waitForReady() {
  if (_initError) throw _initError;
  if (_initPromise) {
    await _initPromise;
    if (_initError) throw _initError;
  }
  return db;
}

function _queryVal(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row[Object.keys(row)[0]];
  }
  stmt.free();
  return null;
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
    localStorage.setItem('ww_db', base64);
  } catch (e) {
    console.warn('Failed to save database:', e);
  }
}

function prepare(sql) {
  return {
    _sql: sql,
    get(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    all(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    run(...params) {
      db.run(sql, params);
      const info = { changes: db.getRowsModified(), lastInsertRowid: _getLastInsertId() };
      saveDatabase();
      return info;
    }
  };
}

function _getLastInsertId() {
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  if (stmt.step()) {
    const id = stmt.getAsObject().id;
    stmt.free();
    return id;
  }
  stmt.free();
  return null;
}

function exec(sql) {
  db.run(sql);
  saveDatabase();
}

function transaction(fn) {
  db.run('BEGIN TRANSACTION');
  try {
    const result = fn();
    db.run('COMMIT');
    saveDatabase();
    return result;
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
}

var dbDriver = {
  initDatabase,
  waitForReady,
  prepare,
  exec,
  transaction,
  saveDatabase
};
window.dbDriver = dbDriver;
