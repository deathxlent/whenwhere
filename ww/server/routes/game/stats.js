const db = require('../../db');
const { getDateRange } = require('./utils');

function formatNum(val, decimals = 0) {
  if (val === null || val === undefined || !isFinite(val)) return 0;
  const p = Math.pow(10, decimals);
  return Math.round(val * p) / p;
}

function getUserStats(userId, period = 'all') {
  const range = getDateRange(period);

  let whereClause = 'WHERE user_id = ?';
  const params = [userId];

  if (period !== 'all') {
    whereClause += ' AND stat_date >= ? AND stat_date <= ?';
    params.push(range.start, range.end);
  }

  const daily = db.prepare(`
    SELECT stat_date, games_played, total_distance, total_time_diff, total_elapsed,
           precise_location_count, precise_time_count
    FROM game_stats
    ${whereClause}
    ORDER BY stat_date DESC
    LIMIT 365
  `).all(...params);

  const totals = db.prepare(`
    SELECT
      SUM(games_played) as total_games,
      SUM(total_distance) as total_distance,
      SUM(total_time_diff) as total_time_diff,
      SUM(total_elapsed) as total_elapsed,
      SUM(precise_location_count) as total_precise_location,
      SUM(precise_time_count) as total_precise_time
    FROM game_stats
    ${whereClause}
  `).get(...params);

  const totalGames = totals.total_games || 0;
  const avgDistance = totalGames > 0 ? (totals.total_distance || 0) / totalGames : 0;
  const avgTimeDiff = totalGames > 0 ? (totals.total_time_diff || 0) / totalGames : 0;
  const avgElapsed = totalGames > 0 ? (totals.total_elapsed || 0) / totalGames : 0;
  const avgPreciseLocation = totalGames > 0 ? (totals.total_precise_location || 0) / totalGames : 0;
  const avgPreciseTime = totalGames > 0 ? (totals.total_precise_time || 0) / totalGames : 0;

  return {
    daily,
    totals: {
      total_games: totalGames,
      total_distance: Math.round(totals.total_distance || 0),
      total_time_diff: totals.total_time_diff || 0,
      total_elapsed: Math.round((totals.total_elapsed || 0) * 10) / 10,
      total_precise_location: totals.total_precise_location || 0,
      total_precise_time: totals.total_precise_time || 0,
      avg_distance: Math.round(avgDistance * 10) / 10,
      avg_time_diff: Math.round(avgTimeDiff * 10) / 10,
      avg_elapsed: Math.round(avgElapsed * 10) / 10,
      avg_precise_location: Math.round(avgPreciseLocation * 1000) / 1000,
      avg_precise_time: Math.round(avgPreciseTime * 1000) / 1000
    }
  };
}

function getLeaderboard(period = 'all') {
  const range = getDateRange(period);

  let whereClause = '';
  const params = [];

  if (period !== 'all') {
    whereClause = 'WHERE gs.stat_date >= ? AND gs.stat_date <= ?';
    params.push(range.start, range.end);
  }

  const baseQuery = `
    SELECT u.id as user_id, u.username,
      SUM(gs.games_played) as total_games,
      SUM(gs.total_distance) as total_distance,
      SUM(gs.total_time_diff) as total_time_diff,
      SUM(gs.total_elapsed) as total_elapsed,
      SUM(gs.precise_location_count) as total_precise_location,
      SUM(gs.precise_time_count) as total_precise_time
    FROM game_stats gs
    JOIN users u ON gs.user_id = u.id
    ${whereClause}
    GROUP BY u.id, u.username
  `;

  const rows = db.prepare(baseQuery).all(...params);

  const ranked = rows.map(r => {
    const totalGames = r.total_games || 0;
    return {
      user_id: r.user_id,
      username: r.username,
      total_games: totalGames,
      avg_distance: totalGames > 0 ? (r.total_distance || 0) / totalGames : 999999,
      avg_time_diff: totalGames > 0 ? (r.total_time_diff || 0) / totalGames : 999999,
      avg_elapsed: totalGames > 0 ? (r.total_elapsed || 0) / totalGames : 999999,
      avg_precise_location: totalGames > 0 ? (r.total_precise_location || 0) / totalGames : 0,
      avg_precise_time: totalGames > 0 ? (r.total_precise_time || 0) / totalGames : 0,
      total_precise_location: r.total_precise_location || 0,
      total_precise_time: r.total_precise_time || 0
    };
  });

  const byGames = [...ranked].sort((a, b) => b.total_games - a.total_games).slice(0, 10).map(r => ({
    username: r.username,
    user_id: r.user_id,
    value: r.total_games + ' 局'
  }));

  const byAvgDistance = [...ranked].filter(r => r.total_games > 0).sort((a, b) => a.avg_distance - b.avg_distance).slice(0, 10).map(r => ({
    username: r.username,
    user_id: r.user_id,
    value: formatNum(r.avg_distance, 1) + ' km'
  }));

  const byAvgTime = [...ranked].filter(r => r.total_games > 0).sort((a, b) => a.avg_time_diff - b.avg_time_diff).slice(0, 10).map(r => ({
    username: r.username,
    user_id: r.user_id,
    value: formatNum(r.avg_time_diff, 1) + ' 年'
  }));

  const byAvgElapsed = [...ranked].filter(r => r.total_games > 0).sort((a, b) => a.avg_elapsed - b.avg_elapsed).slice(0, 10).map(r => ({
    username: r.username,
    user_id: r.user_id,
    value: formatNum(r.avg_elapsed, 1) + ' 秒'
  }));

  const byPreciseLoc = [...ranked].sort((a, b) => b.avg_precise_location - a.avg_precise_location).slice(0, 10).map(r => ({
    username: r.username,
    user_id: r.user_id,
    value: formatNum(r.avg_precise_location * 100, 1) + '% (' + r.total_precise_location + ')'
  }));

  const byPreciseTime = [...ranked].sort((a, b) => b.avg_precise_time - a.avg_precise_time).slice(0, 10).map(r => ({
    username: r.username,
    user_id: r.user_id,
    value: formatNum(r.avg_precise_time * 100, 1) + '% (' + r.total_precise_time + ')'
  }));

  return {
    by_games: byGames,
    by_avg_distance: byAvgDistance,
    by_avg_time: byAvgTime,
    by_avg_elapsed: byAvgElapsed,
    by_precise_location: byPreciseLoc,
    by_precise_time: byPreciseTime
  };
}

module.exports = {
  getUserStats,
  getLeaderboard,
  formatNum
};
