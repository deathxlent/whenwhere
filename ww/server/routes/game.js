const express = require('express');
const router = express.Router();
const db = require('../db');
const { getRankByScore, getCurrentMonthKey } = require('../achievement-helper');

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
      sc.code as sub_category_code, sc.name as sub_category_name,
      m.distance_unit, m.distance_scale
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    LEFT JOIN maps m ON sc.map_id = m.id
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
      location_lat2: event.location_lat2,
      location_lng2: event.location_lng2,
      location_only: event.location_only ? true : false,
      location_name: event.location_name,
      start_ts: event.start_ts,
      start_precision: event.start_precision,
      end_ts: event.end_ts,
      end_precision: event.end_precision,
      start_display: tsToDisplay(event.start_ts, event.start_precision),
      end_display: tsToDisplay(event.end_ts, event.end_precision),
      sub_category_code: event.sub_category_code,
      sub_category_name: event.sub_category_name,
      distance_unit: event.distance_unit || 'km',
      distance_scale: event.distance_scale != null ? event.distance_scale : 1,
      images: imageData
    }
  });
});

function expandBoundsByKm(lat1, lng1, lat2, lng2, km) {
  const R = 6371;
  const latDelta = (km / R) * (180 / Math.PI);
  const avgLat = (lat1 + lat2) / 2;
  const lngDelta = (km / (R * Math.cos(avgLat * Math.PI / 180))) * (180 / Math.PI);

  const north = Math.max(lat1, lat2) + latDelta;
  const south = Math.min(lat1, lat2) - latDelta;
  const east = Math.max(lng1, lng2) + lngDelta;
  const west = Math.min(lng1, lng2) - lngDelta;

  return { north, south, east, west };
}

function distanceToRectBounds(guessLat, guessLng, lat1, lng1, lat2, lng2) {
  const R = 6371;

  const north = Math.max(lat1, lat2);
  const south = Math.min(lat1, lat2);
  const east = Math.max(lng1, lng2);
  const west = Math.min(lng1, lng2);

  if (guessLat >= south && guessLat <= north && guessLng >= west && guessLng <= east) {
    const distToNorth = haversineDistance(guessLat, guessLng, north, guessLng);
    const distToSouth = haversineDistance(guessLat, guessLng, south, guessLng);
    const distToEast = haversineDistance(guessLat, guessLng, guessLat, east);
    const distToWest = haversineDistance(guessLat, guessLng, guessLat, west);
    return Math.min(distToNorth, distToSouth, distToEast, distToWest);
  }

  let closestLat = guessLat;
  let closestLng = guessLng;

  if (guessLat < south) closestLat = south;
  else if (guessLat > north) closestLat = north;

  if (guessLng < west) closestLng = west;
  else if (guessLng > east) closestLng = east;

  return haversineDistance(guessLat, guessLng, closestLat, closestLng);
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.post('/submit', (req, res) => {
  const { user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, elapsed_seconds, timed_out } = req.body;

  if (!user_id || !event_id) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const event = db.prepare(`
    SELECT e.*, sc.code as sub_category_code,
      m.distance_unit, m.distance_scale
    FROM events e
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE e.id = ?
  `).get(event_id);

  if (!event) {
    return res.json({ success: false, message: '事件不存在' });
  }

  const distanceUnit = event.distance_unit || 'km';
  const distanceScale = event.distance_scale != null ? event.distance_scale : 1;
  let rawDistanceKm = null;
  let preciseLocation = false;

  if (event.location_lat && event.location_lng && guess_lat != null && guess_lng != null) {
    if (event.location_lat2 != null && event.location_lng2 != null) {
      const expanded = expandBoundsByKm(event.location_lat, event.location_lng, event.location_lat2, event.location_lng2, 50);
      const guessLatNum = parseFloat(guess_lat);
      const guessLngNum = parseFloat(guess_lng);

      if (guessLatNum >= expanded.south && guessLatNum <= expanded.north &&
          guessLngNum >= expanded.west && guessLngNum <= expanded.east) {
        preciseLocation = true;
      }

      rawDistanceKm = distanceToRectBounds(guessLatNum, guessLngNum,
        event.location_lat, event.location_lng,
        event.location_lat2, event.location_lng2);
    } else {
      rawDistanceKm = haversineDistance(
        parseFloat(guess_lat), parseFloat(guess_lng),
        event.location_lat, event.location_lng
      );
      preciseLocation = rawDistanceKm <= 50;
    }
  }

  const distanceKm = rawDistanceKm != null ? Math.round(rawDistanceKm * distanceScale) : null;

  let timeDiffYears = null;
  let timeIn = null;
  let preciseTime = false;
  if (!event.location_only && guess_year != null && event.start_ts != null) {
    const startYear = tsToYear(event.start_ts);
    const endYear = event.end_ts ? tsToYear(event.end_ts) : startYear;
    const guessYearVal = guess_year;

    timeIn = guessYearVal >= startYear && guessYearVal <= endYear;

    const diffFromStart = startYear - guessYearVal;
    const diffFromEnd = endYear - guessYearVal;

    if (Math.abs(diffFromStart) <= Math.abs(diffFromEnd)) {
      timeDiffYears = diffFromStart;
    } else {
      timeDiffYears = diffFromEnd;
    }

    const Y = Math.abs(startYear - 2026);
    const preciseThreshold = Y * 0.01;
    preciseTime = preciseThreshold > 0 ? Math.abs(timeDiffYears) <= preciseThreshold : timeDiffYears === 0;
  }

  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT * FROM game_stats WHERE user_id = ? AND stat_date = ?').get(user_id, today);

  const distanceForStats = preciseLocation ? 0 : (rawDistanceKm != null ? Math.round(rawDistanceKm) : 0);
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

  const newlyUnlockedAchievements = updateAchievements(user_id, preciseLocation, preciseTime, event.location_only);
  updateUserRank(user_id);

  res.json({
    success: true,
    data: {
      distance_km: distanceKm,
      time_diff_years: timeDiffYears,
      time_in_range: timeIn,
      precise_location: preciseLocation,
      precise_time: preciseTime,
      timed_out: !!timed_out,
      location_only: event.location_only ? true : false,
      correct_lat: event.location_lat,
      correct_lng: event.location_lng,
      correct_lat2: event.location_lat2,
      correct_lng2: event.location_lng2,
      correct_location_name: event.location_name,
      correct_title: event.title,
      correct_description: event.description,
      correct_tips: event.tips,
      correct_start_display: tsToDisplay(event.start_ts, event.start_precision),
      correct_end_display: tsToDisplay(event.end_ts, event.end_precision),
      distance_unit: distanceUnit,
      distance_scale: distanceScale,
      new_achievements: newlyUnlockedAchievements
    }
  });
});

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

router.post('/vote', (req, res) => {
  const { user_id, event_id, vote_type } = req.body;

  if (!user_id || !event_id || vote_type === undefined) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const voteTypeInt = parseInt(vote_type);
  if (voteTypeInt !== 1 && voteTypeInt !== -1) {
    return res.json({ success: false, message: 'vote_type 只能是 1(赞) 或 -1(踩)' });
  }

  const existing = db.prepare('SELECT * FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, event_id);

  if (existing) {
    if (existing.vote_type === voteTypeInt) {
      db.prepare('DELETE FROM event_votes WHERE user_id = ? AND event_id = ?').run(user_id, event_id);
    } else {
      db.prepare('UPDATE event_votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND event_id = ?').run(voteTypeInt, user_id, event_id);
    }
  } else {
    db.prepare('INSERT INTO event_votes (user_id, event_id, vote_type) VALUES (?, ?, ?)').run(user_id, event_id, voteTypeInt);
  }

  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) as down_count
    FROM event_votes WHERE event_id = ?
  `).get(event_id);

  const current = db.prepare('SELECT vote_type FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, event_id);

  res.json({
    success: true,
    data: {
      up_count: stats.up_count || 0,
      down_count: stats.down_count || 0,
      my_vote: current ? current.vote_type : 0
    }
  });
});

router.get('/vote/:eventId', (req, res) => {
  const { eventId } = req.params;
  const { user_id } = req.query;

  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) as up_count,
      SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) as down_count
    FROM event_votes WHERE event_id = ?
  `).get(eventId);

  let myVote = 0;
  if (user_id) {
    const current = db.prepare('SELECT vote_type FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, eventId);
    myVote = current ? current.vote_type : 0;
  }

  res.json({
    success: true,
    data: {
      up_count: stats.up_count || 0,
      down_count: stats.down_count || 0,
      my_vote: myVote
    }
  });
});

router.post('/favorite', (req, res) => {
  const { user_id, event_id } = req.body;

  if (!user_id || !event_id) {
    return res.json({ success: false, message: '参数不完整' });
  }

  const existing = db.prepare('SELECT * FROM user_favorites WHERE user_id = ? AND event_id = ?').get(user_id, event_id);

  if (existing) {
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND event_id = ?').run(user_id, event_id);
    res.json({ success: true, data: { is_favorite: false }, message: '已取消收藏' });
  } else {
    db.prepare('INSERT INTO user_favorites (user_id, event_id) VALUES (?, ?)').run(user_id, event_id);
    res.json({ success: true, data: { is_favorite: true }, message: '已收藏' });
  }
});

router.get('/favorites/:userId', (req, res) => {
  const { userId } = req.params;
  const { keyword = '' } = req.query;

  let whereClause = 'WHERE uf.user_id = ?';
  const params = [userId];

  if (keyword && keyword.trim()) {
    whereClause += ' AND e.title LIKE ?';
    params.push('%' + keyword.trim() + '%');
  }

  const favorites = db.prepare(`
    SELECT e.*,
      c.code as category_code, c.name as category_name,
      sc.code as sub_category_code, sc.name as sub_category_name,
      uf.created_at as favorited_at
    FROM user_favorites uf
    JOIN events e ON uf.event_id = e.id
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    ${whereClause}
    ORDER BY uf.created_at DESC
  `).all(...params);

  const data = favorites.map(f => {
    let startDisplay = '-';
    let endDisplay = '-';
    if (f.start_ts !== null && f.start_ts !== undefined) {
      const absTs = Math.abs(f.start_ts);
      const sign = f.start_ts < 0 ? -1 : 1;
      const day = absTs % 100;
      const rest = Math.floor(absTs / 100);
      const month = rest % 100;
      const year = Math.floor(rest / 100) * sign;
      const prefix = year < 0 ? '公元前' : '';
      const absYear = Math.abs(year);
      if (f.start_precision === 0) startDisplay = `${prefix}${absYear}年`;
      else if (f.start_precision === 1) startDisplay = `${prefix}${absYear}年${month}月`;
      else startDisplay = `${prefix}${absYear}年${month}月${day}日`;
    }
    if (f.end_ts !== null && f.end_ts !== undefined) {
      const absTs = Math.abs(f.end_ts);
      const sign = f.end_ts < 0 ? -1 : 1;
      const day = absTs % 100;
      const rest = Math.floor(absTs / 100);
      const month = rest % 100;
      const year = Math.floor(rest / 100) * sign;
      const prefix = year < 0 ? '公元前' : '';
      const absYear = Math.abs(year);
      if (f.end_precision === 0) endDisplay = `${prefix}${absYear}年`;
      else if (f.end_precision === 1) endDisplay = `${prefix}${absYear}年${month}月`;
      else endDisplay = `${prefix}${absYear}年${month}月${day}日`;
    }
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      category_name: f.category_name,
      sub_category_name: f.sub_category_name,
      start_display: startDisplay,
      end_display: endDisplay,
      location_name: f.location_name,
      favorited_at: f.favorited_at
    };
  });

  res.json({ success: true, data });
});

router.get('/favorite/check/:eventId', (req, res) => {
  const { eventId } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.json({ success: true, data: { is_favorite: false } });
  }

  const existing = db.prepare('SELECT * FROM user_favorites WHERE user_id = ? AND event_id = ?').get(user_id, eventId);
  res.json({ success: true, data: { is_favorite: !!existing } });
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
