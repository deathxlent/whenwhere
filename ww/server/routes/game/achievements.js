const db = require('../../db');
const { getRankByScore, getCurrentMonthKey } = require('../../achievement-helper');

function updateAchievements(userId, preciseLocation, preciseTime, locationOnly) {
  const newlyUnlocked = [];

  let session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(userId);
  if (!session) {
    db.prepare('INSERT INTO game_sessions (user_id) VALUES (?)').run(userId);
    session = db.prepare('SELECT * FROM game_sessions WHERE user_id = ?').get(userId);
  }

  let newNeitherStreak = session.neither_precise_streak;
  if (preciseLocation || preciseTime) {
    newNeitherStreak = 0;
  } else {
    newNeitherStreak = session.neither_precise_streak + 1;
  }
  const newMaxNeither = Math.max(session.max_neither_streak, newNeitherStreak);

  const newPreciseLoc = session.precise_location + (preciseLocation ? 1 : 0);
  const newPreciseTime = session.precise_time + (preciseTime ? 1 : 0);
  const newPreciseBoth = session.precise_both + ((preciseLocation && preciseTime) ? 1 : 0);

  db.prepare(`
    UPDATE game_sessions SET
      precise_location = ?,
      precise_time = ?,
      precise_both = ?,
      neither_precise_streak = ?,
      max_neither_streak = ?
    WHERE user_id = ?
  `).run(newPreciseLoc, newPreciseTime, newPreciseBoth, newNeitherStreak, newMaxNeither, userId);

  const totalStats = db.prepare(`
    SELECT
      SUM(games_played) as total_games,
      SUM(precise_location_count) as total_precise_location,
      SUM(precise_time_count) as total_precise_time
    FROM game_stats WHERE user_id = ?
  `).get(userId);

  const progressValues = {
    precise_location: totalStats.total_precise_location || 0,
    precise_time: totalStats.total_precise_time || 0,
    neither_precise_streak: newMaxNeither,
    games_played: totalStats.total_games || 0
  };

  const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY tier, target_value').all();

  for (const achievement of allAchievements) {
    const currentValue = progressValues[achievement.type] || 0;
    const existing = db.prepare('SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?').get(userId, achievement.id);

    if (currentValue >= achievement.target_value) {
      if (!existing) {
        db.prepare(`
          INSERT INTO user_achievements (user_id, achievement_id, current_value, unlocked_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(userId, achievement.id, currentValue);
        newlyUnlocked.push({
          id: achievement.id,
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier
        });
      } else if (!existing.unlocked_at) {
        db.prepare(`
          UPDATE user_achievements SET current_value = ?, unlocked_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(currentValue, existing.id);
        newlyUnlocked.push({
          id: achievement.id,
          code: achievement.code,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier
        });
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
  const unlockedCount = db.prepare('SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = ? AND unlocked_at IS NOT NULL').get(userId).cnt;

  const monthlyStats = db.prepare(`
    SELECT
      SUM(gs.games_played) as total_games,
      SUM(gs.precise_location_count) as total_precise_location,
      SUM(gs.precise_time_count) as total_precise_time
    FROM game_stats gs
    WHERE gs.user_id = ? AND strftime('%Y-%m', gs.stat_date) = ?
  `).get(userId, getCurrentMonthKey());

  const rank = getRankByScore(unlockedCount);

  const existing = db.prepare('SELECT * FROM user_rank_history WHERE user_id = ? AND rank_month = ?').get(userId, getCurrentMonthKey());
  if (existing) {
    db.prepare(`
      UPDATE user_rank_history SET
        rank_level = ?,
        rank_name = ?,
        achievement_count = ?,
        total_games = ?,
        total_precise_location = ?,
        total_precise_time = ?
      WHERE id = ?
    `).run(
      rank.level,
      rank.name,
      unlockedCount,
      monthlyStats.total_games || 0,
      monthlyStats.total_precise_location || 0,
      monthlyStats.total_precise_time || 0,
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO user_rank_history (user_id, rank_month, rank_level, rank_name, achievement_count, total_games, total_precise_location, total_precise_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      getCurrentMonthKey(),
      rank.level,
      rank.name,
      unlockedCount,
      monthlyStats.total_games || 0,
      monthlyStats.total_precise_location || 0,
      monthlyStats.total_precise_time || 0
    );
  }
}

module.exports = {
  updateAchievements,
  updateUserRank
};
