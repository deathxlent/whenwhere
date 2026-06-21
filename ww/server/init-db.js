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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

  CREATE TABLE IF NOT EXISTS user_achievement_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_code TEXT NOT NULL,
    current_value INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, achievement_code)
  );

  CREATE INDEX IF NOT EXISTS idx_user_achievement_progress_user ON user_achievement_progress(user_id);

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
    FOREIGN KEY (user_id) REFERENCES users(id),
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
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

const achievementsInfo = db.pragma("table_info(achievements)");
const achievementsHasCode = achievementsInfo.some(c => c.name === 'code');
if (achievementsInfo.length > 0 && !achievementsHasCode) {
  try {
    db.exec('DROP TABLE IF EXISTS achievements');
    db.exec('DROP TABLE IF EXISTS user_achievements');
    db.exec('DROP TABLE IF EXISTS user_achievement_progress');
    db.exec('DROP TABLE IF EXISTS user_rank_history');
    db.exec('DROP TABLE IF EXISTS game_sessions');
    console.log('已删除旧版成就相关表，准备重新创建');
  } catch(e) { console.warn('Drop old tables failed:', e.message); }
}

const achievementExists = db.prepare("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='achievements'").get().cnt;

if (achievementExists === 0) {
  db.exec(`
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
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (achievement_id) REFERENCES achievements(id),
      UNIQUE(user_id, achievement_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

    CREATE TABLE IF NOT EXISTS user_achievement_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_code TEXT NOT NULL,
      current_value INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, achievement_code)
    );

    CREATE INDEX IF NOT EXISTS idx_user_achievement_progress_user ON user_achievement_progress(user_id);

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
      FOREIGN KEY (user_id) REFERENCES users(id),
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
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
  `);
}

const achievementCount = db.prepare("SELECT COUNT(*) as cnt FROM achievements").get().cnt;

if (achievementCount === 0) {
  const achievementsData = [
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

  const insertAchievement = db.prepare(`
    INSERT INTO achievements (code, name, description, type, target_value, tier, icon)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertAchievement.run(row.code, row.name, row.description, row.type, row.target_value, row.tier, row.icon);
    }
  });

  insertMany(achievementsData);
  console.log('已初始化成就数据！');
}

console.log('WW数据库初始化完成！');
db.close();
