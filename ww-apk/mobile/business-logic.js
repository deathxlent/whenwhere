(function() {
var RANK_CONFIG = [
  { level: 0, name: '未定级', icon: '⚪', color: '#9ca3af', minScore: 0 },
  { level: 1, name: '青铜', icon: '🥉', color: '#cd7f32', minScore: 1 },
  { level: 2, name: '白银', icon: '🥈', color: '#c0c0c0', minScore: 3 },
  { level: 3, name: '黄金', icon: '🥇', color: '#ffd700', minScore: 6 },
  { level: 4, name: '铂金', icon: '💎', color: '#e5e4e2', minScore: 10 },
  { level: 5, name: '钻石', icon: '💠', color: '#b9f2ff', minScore: 15 },
  { level: 6, name: '大师', icon: '🏆', color: '#ff4500', minScore: 20 },
  { level: 7, name: '王者', icon: '👑', color: '#ff1493', minScore: 30 }
];

function getRankByScore(score) {
  var currentRank = RANK_CONFIG[0];
  for (var i = 0; i < RANK_CONFIG.length; i++) {
    var rank = RANK_CONFIG[i];
    if (score >= rank.minScore) currentRank = rank;
  }
  return currentRank;
}

function getCurrentMonthKey() {
  var now = new Date();
  var m = String(now.getMonth() + 1);
  if (m.length < 2) m = '0' + m;
  return now.getFullYear() + '-' + m;
}

function tsToDisplay(ts, precision) {
  if (ts === null || ts === undefined) return '-';
  var absTs = Math.abs(ts);
  var sign = ts < 0 ? -1 : 1;
  var day = absTs % 100;
  var rest = Math.floor(absTs / 100);
  var month = rest % 100;
  var year = Math.floor(rest / 100) * sign;
  var prefix = year < 0 ? '公元前' : '';
  var absYear = Math.abs(year);
  if (precision === 0) return prefix + absYear + '年';
  if (precision === 1) return prefix + absYear + '年' + month + '月';
  return prefix + absYear + '年' + month + '月' + day + '日';
}

function tsToYear(ts) {
  if (ts === null || ts === undefined) return null;
  var sign = ts < 0 ? -1 : 1;
  var absTs = Math.abs(ts);
  var rest = Math.floor(absTs / 100);
  return Math.floor(rest / 100) * sign;
}

function getDateRange(period) {
  var now = new Date();
  var start;
  var end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (period === 'week') {
    var day = now.getDay() === 0 ? 7 : now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - (day - 1));
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(2000, 0, 1);
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

function expandBoundsByKm(lat1, lng1, lat2, lng2, km) {
  var R = 6371;
  var latDelta = (km / R) * (180 / Math.PI);
  var avgLat = (lat1 + lat2) / 2;
  var lngDelta = (km / (R * Math.cos(avgLat * Math.PI / 180))) * (180 / Math.PI);
  var north = Math.max(lat1, lat2) + latDelta;
  var south = Math.min(lat1, lat2) - latDelta;
  var east = Math.max(lng1, lng2) + lngDelta;
  var west = Math.min(lng1, lng2) - lngDelta;
  return { north: north, south: south, east: east, west: west };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lng2 - lng1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceToRectBounds(guessLat, guessLng, lat1, lng1, lat2, lng2) {
  var north = Math.max(lat1, lat2);
  var south = Math.min(lat1, lat2);
  var east = Math.max(lng1, lng2);
  var west = Math.min(lng1, lng2);
  if (guessLat >= south && guessLat <= north && guessLng >= west && guessLng <= east) {
    return Math.min(
      haversineDistance(guessLat, guessLng, north, guessLng),
      haversineDistance(guessLat, guessLng, south, guessLng),
      haversineDistance(guessLat, guessLng, guessLat, east),
      haversineDistance(guessLat, guessLng, guessLat, west)
    );
  }
  var closestLat = guessLat, closestLng = guessLng;
  if (guessLat < south) closestLat = south;
  else if (guessLat > north) closestLat = north;
  if (guessLng < west) closestLng = west;
  else if (guessLng > east) closestLng = east;
  return haversineDistance(guessLat, guessLng, closestLat, closestLng);
}

function updateAchievements(userId, preciseLocation, preciseTime, locationOnly) {
  var db = window._db;
  var newlyUnlocked = [];

  var session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(userId);
  if (!session) {
    db.prepare('INSERT INTO game_sessions (user_id) VALUES (?)').run(userId);
    session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(userId);
  }

  var newNeitherStreak = session.neither_precise_streak;
  if (preciseLocation || preciseTime) {
    newNeitherStreak = 0;
  } else {
    newNeitherStreak = session.neither_precise_streak + 1;
  }
  var newMaxNeither = Math.max(session.max_neither_streak, newNeitherStreak);
  var newPreciseLoc = session.precise_location + (preciseLocation ? 1 : 0);
  var newPreciseTime = session.precise_time + (preciseTime ? 1 : 0);
  var newPreciseBoth = session.precise_both + ((preciseLocation && preciseTime) ? 1 : 0);

  db.prepare('UPDATE game_sessions SET precise_location = ?, precise_time = ?, precise_both = ?, neither_precise_streak = ?, max_neither_streak = ? WHERE user_id = ?')
    .run(newPreciseLoc, newPreciseTime, newPreciseBoth, newNeitherStreak, newMaxNeither, userId);

  var totalStats = db.prepare('SELECT SUM(games_played) as total_games, SUM(precise_location_count) as total_precise_location, SUM(precise_time_count) as total_precise_time FROM game_stats WHERE user_id = ?').get(userId);

  var progressValues = {
    precise_location: totalStats.total_precise_location || 0,
    precise_time: totalStats.total_precise_time || 0,
    neither_precise_streak: newMaxNeither,
    games_played: totalStats.total_games || 0
  };

  var allAchievements = db.prepare('SELECT * FROM achievements ORDER BY tier, target_value').all();

  for (var i = 0; i < allAchievements.length; i++) {
    var achievement = allAchievements[i];
    var currentValue = progressValues[achievement.type] || 0;
    var existing = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achievement.id);

    if (currentValue >= achievement.target_value) {
      if (!existing) {
        db.prepare('INSERT INTO user_achievements (user_id, achievement_id, current_value, unlocked_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)').run(userId, achievement.id, currentValue);
        newlyUnlocked.push({ id: achievement.id, code: achievement.code, name: achievement.name, description: achievement.description, icon: achievement.icon, tier: achievement.tier });
      } else if (!existing.unlocked_at) {
        db.prepare('UPDATE user_achievements SET current_value = ?, unlocked_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentValue, existing.id);
        newlyUnlocked.push({ id: achievement.id, code: achievement.code, name: achievement.name, description: achievement.description, icon: achievement.icon, tier: achievement.tier });
      } else {
        db.prepare('UPDATE user_achievements SET current_value = ? WHERE id = ?').run(currentValue, existing.id);
      }
    } else {
      if (existing) {
        db.prepare('UPDATE user_achievements SET current_value = ? WHERE id = ?').run(currentValue, existing.id);
      }
    }
  }

  return newlyUnlocked;
}

function updateUserRank(userId) {
  var db = window._db;
  var unlockedCount = db.prepare('SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = ? AND unlocked_at IS NOT NULL').get(userId).cnt;
  var monthlyStats = db.prepare('SELECT SUM(gs.games_played) as total_games, SUM(gs.precise_location_count) as total_precise_location, SUM(gs.precise_time_count) as total_precise_time FROM game_stats gs WHERE gs.user_id = ? AND strftime(\'%Y-%m\', gs.stat_date) = ?').get(userId, getCurrentMonthKey());
  var rank = getRankByScore(unlockedCount);
  var existing = db.prepare('SELECT * FROM user_rank_history WHERE user_id = ? AND rank_month = ?').get(userId, getCurrentMonthKey());

  if (existing) {
    db.prepare('UPDATE user_rank_history SET rank_level = ?, rank_name = ?, achievement_count = ?, total_games = ?, total_precise_location = ?, total_precise_time = ? WHERE id = ?')
      .run(rank.level, rank.name, unlockedCount, monthlyStats.total_games || 0, monthlyStats.total_precise_location || 0, monthlyStats.total_precise_time || 0, existing.id);
  } else {
    db.prepare('INSERT INTO user_rank_history (user_id, rank_month, rank_level, rank_name, achievement_count, total_games, total_precise_location, total_precise_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(userId, getCurrentMonthKey(), rank.level, rank.name, unlockedCount, monthlyStats.total_games || 0, monthlyStats.total_precise_location || 0, monthlyStats.total_precise_time || 0);
  }
}

var BL = {
  RANK_CONFIG: RANK_CONFIG,
  getRankByScore: getRankByScore,
  getCurrentMonthKey: getCurrentMonthKey,
  tsToDisplay: tsToDisplay,
  tsToYear: tsToYear,
  getDateRange: getDateRange,
  expandBoundsByKm: expandBoundsByKm,
  haversineDistance: haversineDistance,
  distanceToRectBounds: distanceToRectBounds,
  updateAchievements: updateAchievements,
  updateUserRank: updateUserRank
};

window.BL = BL;
})();
