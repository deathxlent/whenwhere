const express = require('express');
const router = express.Router();
const db = require('../db');
const { RANK_CONFIG, getRankByScore, getCurrentMonthKey } = require('../achievement-helper');

router.get('/list', (req, res) => {
  const { user_id } = req.query;

  const achievements = db.prepare(`
    SELECT a.*,
      ua.current_value as user_current_value,
      ua.unlocked_at as user_unlocked_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
    ORDER BY a.tier, a.target_value
  `).all(user_id || 0);

  const data = achievements.map(a => ({
    id: a.id,
    code: a.code,
    name: a.name,
    description: a.description,
    type: a.type,
    target_value: a.target_value,
    tier: a.tier,
    icon: a.icon,
    current_value: a.user_current_value || 0,
    unlocked: !!a.user_unlocked_at,
    unlocked_at: a.user_unlocked_at,
    progress: Math.min(100, Math.round(((a.user_current_value || 0) / a.target_value) * 100))
  }));

  res.json({ success: true, data });
});

router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  const unlocked = db.prepare(`
    SELECT a.*, ua.current_value, ua.unlocked_at
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.id
    WHERE ua.user_id = ? AND ua.unlocked_at IS NOT NULL
    ORDER BY a.tier DESC, a.target_value DESC
  `).all(userId);

  const total = db.prepare('SELECT COUNT(*) as cnt FROM achievements').get().cnt;
  const unlockedCount = unlocked.length;

  const currentRank = getRankByScore(unlockedCount);
  const nextRank = RANK_CONFIG.find(r => r.level > currentRank.level);

  const monthlyStats = db.prepare(`
    SELECT
      SUM(gs.games_played) as total_games,
      SUM(gs.precise_location_count) as total_precise_location,
      SUM(gs.precise_time_count) as total_precise_time
    FROM game_stats gs
    WHERE gs.user_id = ? AND strftime('%Y-%m', gs.stat_date) = ?
  `).get(userId, getCurrentMonthKey());

  const allAchievements = db.prepare(`
    SELECT a.*,
      ua.current_value as user_current_value,
      ua.unlocked_at as user_unlocked_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
    ORDER BY a.tier, a.target_value
  `).all(userId);

  const achievementsWithProgress = allAchievements.map(a => ({
    id: a.id,
    code: a.code,
    name: a.name,
    description: a.description,
    type: a.type,
    target_value: a.target_value,
    tier: a.tier,
    icon: a.icon,
    current_value: a.user_current_value || 0,
    unlocked: !!a.user_unlocked_at,
    unlocked_at: a.user_unlocked_at,
    progress: Math.min(100, Math.round(((a.user_current_value || 0) / a.target_value) * 100))
  }));

  res.json({
    success: true,
    data: {
      unlocked_count: unlockedCount,
      total_count: total,
      unlocked_achievements: unlocked.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description,
        type: a.type,
        target_value: a.target_value,
        tier: a.tier,
        icon: a.icon,
        unlocked_at: a.unlocked_at
      })),
      all_achievements: achievementsWithProgress,
      current_rank: currentRank,
      next_rank: nextRank || null,
      monthly_stats: {
        total_games: monthlyStats.total_games || 0,
        total_precise_location: monthlyStats.total_precise_location || 0,
        total_precise_time: monthlyStats.total_precise_time || 0
      }
    }
  });
});

router.get('/rank-history/:userId', (req, res) => {
  const { userId } = req.params;

  const history = db.prepare(`
    SELECT * FROM user_rank_history
    WHERE user_id = ?
    ORDER BY rank_month DESC
  `).all(userId);

  const data = history.map(h => {
    const rankConfig = RANK_CONFIG.find(r => r.level === h.rank_level) || RANK_CONFIG[0];
    return {
      id: h.id,
      rank_month: h.rank_month,
      rank_level: h.rank_level,
      rank_name: h.rank_name,
      rank_icon: rankConfig.icon,
      rank_color: rankConfig.color,
      achievement_count: h.achievement_count,
      total_games: h.total_games,
      total_precise_location: h.total_precise_location,
      total_precise_time: h.total_precise_time,
      created_at: h.created_at
    };
  });

  res.json({ success: true, data });
});

module.exports = router;
