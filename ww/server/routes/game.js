const express = require('express');
const router = express.Router();
const db = require('../db');

function tsToDisplay(ts, precision) {
  if (ts === null || ts === undefined) return '-';
  const absTs = Math.abs(ts);
  const sign = ts < 0 ? -1 : 1;
  const day = absTs % 100;
  const rest = Math.floor(absTs / 100);
  const month = rest % 100;
  const year = Math.floor(rest / 100) * sign;
  const prefix = year < 0 ? '公元前' : '';
  const absYear = Math.abs(year);
  if (precision === 0) return `${prefix}${absYear}年`;
  if (precision === 1) return `${prefix}${absYear}年${month}月`;
  return `${prefix}${absYear}年${month}月${day}日`;
}

function tsToYear(ts) {
  if (ts === null || ts === undefined) return null;
  const sign = ts < 0 ? -1 : 1;
  const absTs = Math.abs(ts);
  const rest = Math.floor(absTs / 100);
  const year = Math.floor(rest / 100) * sign;
  return year;
}

function getDateRange(period) {
  const now = new Date();
  let start;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === 'week') {
    const day = now.getDay() === 0 ? 7 : now.getDay();
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

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

router.get('/random-event', (req, res) => {
  const { sub_codes } = req.query;
  if (!sub_codes) {
    return res.json({ success: false, message: '请选择分类' });
  }

  const codes = sub_codes.split(',').filter(Boolean);
  if (codes.length === 0) {
    return res.json({ success: false, message: '至少选择一个分类' });
  }

  const placeholders = codes.map(() => '?').join(',');

  const events = db.prepare(`
    SELECT e.*,
      c.code as category_code, c.name as category_name,
      sc.code as sub_category_code, sc.name as sub_category_name
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE sc.code IN (${placeholders}) AND e.is_active = 1
  `).all(...codes);

  if (events.length === 0) {
    return res.json({ success: false, message: '该分类下暂无数据' });
  }

  const event = events[Math.floor(Math.random() * events.length)];

  const images = db.prepare(`
    SELECT id, filename, file_path FROM event_images
    WHERE event_id = ?
    ORDER BY sort_order, id
  `).all(event.id);

  const imageData = images.map(img => {
    if (img.file_path && (img.file_path.startsWith('http://') || img.file_path.startsWith('https://'))) {
      return { id: img.id, url: img.file_path };
    }
    return {
      id: img.id,
      url: `/images/${event.category_code}/${event.sub_category_code}/${event.id}/${img.filename}`
    };
  });

  res.json({
    success: true,
    data: {
      id: event.id,
      title: event.title,
      description: event.description,
      tips: event.tips,
      location_lat: event.location_lat,
      location_lng: event.location_lng,
      location_name: event.location_name,
      start_ts: event.start_ts,
      start_precision: event.start_precision,
      end_ts: event.end_ts,
      end_precision: event.end_precision,
      start_display: tsToDisplay(event.start_ts, event.start_precision),
      end_display: tsToDisplay(event.end_ts, event.end_precision),
      sub_category_code: event.sub_category_code,
      sub_category_name: event.sub_category_name,
      images: imageData
    }
  });
});

router.post('/submit', (req, res) => {
  const { user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, elapsed_seconds, timed_out } = req.body;

  if (!user_id || !event_id) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const event = db.prepare(`
    SELECT e.*, sc.code as sub_category_code
    FROM events e
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    WHERE e.id = ?
  `).get(event_id);

  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  const R = 6371;
  let distanceKm = null;
  let preciseLocation = false;
  if (event.location_lat && event.location_lng && guess_lat != null && guess_lng != null) {
    const dLat = (guess_lat - event.location_lat) * Math.PI / 180;
    const dLon = (guess_lng - event.location_lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(event.location_lat * Math.PI / 180) * Math.cos(guess_lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.round(R * c);
    preciseLocation = distanceKm <= 50;
  }

  let timeDiffYears = null;
  let timeIn = null;
  let preciseTime = false;
  if (guess_year != null && event.start_ts != null) {
    const startYear = tsToYear(event.start_ts);
    const endYear = event.end_ts ? tsToYear(event.end_ts) : startYear;
    const guessYearVal = guess_year;

    if (guessYearVal >= startYear && guessYearVal <= endYear) {
      timeIn = true;
      timeDiffYears = 0;
    } else {
      timeIn = false;
      if (guessYearVal < startYear) {
        timeDiffYears = Math.abs(startYear - guessYearVal);
      } else {
        timeDiffYears = Math.abs(guessYearVal - endYear);
      }
    }
    const Y = Math.abs(startYear - 2026);
    const preciseThreshold = Y * 0.01;
    preciseTime = preciseThreshold > 0 ? Math.abs(timeDiffYears) <= preciseThreshold : timeDiffYears === 0;
  }

  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT * FROM game_stats WHERE user_id = ? AND stat_date = ?').get(user_id, today);

  const distanceForStats = preciseLocation ? 0 : (distanceKm || 0);
  const timeForStats = preciseTime ? 0 : Math.abs(timeDiffYears || 0);
  const elapsedForStats = elapsed_seconds || 0;
  const preciseLocCount = preciseLocation ? 1 : 0;
  const preciseTimeCount = preciseTime ? 1 : 0;

  if (existing) {
    db.prepare(`
      UPDATE game_stats SET
        games_played = games_played + 1,
        total_distance = total_distance + ?,
        total_time_diff = total_time_diff + ?,
        total_elapsed = total_elapsed + ?,
        precise_location_count = precise_location_count + ?,
        precise_time_count = precise_time_count + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND stat_date = ?
    `).run(distanceForStats, timeForStats, elapsedForStats, preciseLocCount, preciseTimeCount, user_id, today);
  } else {
    db.prepare(`
      INSERT INTO game_stats (user_id, stat_date, games_played, total_distance, total_time_diff, total_elapsed, precise_location_count, precise_time_count)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?)
    `).run(user_id, today, distanceForStats, timeForStats, elapsedForStats, preciseLocCount, preciseTimeCount);
  }

  res.json({
    success: true,
    data: {
      distance_km: distanceKm,
      time_diff_years: timeDiffYears,
      time_in_range: timeIn,
      precise_location: preciseLocation,
      precise_time: preciseTime,
      timed_out: !!timed_out,
      correct_lat: event.location_lat,
      correct_lng: event.location_lng,
      correct_location_name: event.location_name,
      correct_title: event.title,
      correct_description: event.description,
      correct_tips: event.tips,
      correct_start_display: tsToDisplay(event.start_ts, event.start_precision),
      correct_end_display: tsToDisplay(event.end_ts, event.end_precision)
    }
  });
});

router.get('/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const { period = 'all' } = req.query;
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

  res.json({
    success: true,
    data: {
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
    }
  });
});

router.get('/leaderboard', (req, res) => {
  const { period = 'all' } = req.query;
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

  const formatNum = (val, decimals = 0) => {
    if (val === null || val === undefined || !isFinite(val)) return 0;
    const p = Math.pow(10, decimals);
    return Math.round(val * p) / p;
  };

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

  res.json({
    success: true,
    data: {
      by_games: byGames,
      by_avg_distance: byAvgDistance,
      by_avg_time: byAvgTime,
      by_avg_elapsed: byAvgElapsed,
      by_precise_location: byPreciseLoc,
      by_precise_time: byPreciseTime
    }
  });
});

module.exports = router;
