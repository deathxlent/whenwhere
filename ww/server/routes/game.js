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

  const imageData = images.map(img => ({
    id: img.id,
    url: `/images/${event.category_code}/${event.sub_category_code}/${event.id}/${img.filename}`
  }));

  res.json({
    success: true,
    data: {
      id: event.id,
      title: event.title,
      description: event.description,
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
  const { user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, elapsed_seconds } = req.body;

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
  let distanceKm = 0;
  if (event.location_lat && event.location_lng && guess_lat != null && guess_lng != null) {
    const dLat = (guess_lat - event.location_lat) * Math.PI / 180;
    const dLon = (guess_lng - event.location_lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(event.location_lat * Math.PI / 180) * Math.cos(guess_lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = Math.round(R * c);
  }

  let timeDiffYears = null;
  let timeIn = null;
  if (guess_year != null && event.start_ts != null) {
    const guessTs = guess_year * 10000 + (guess_month || 1) * 100 + (guess_day || 1);
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
  }

  const today = new Date().toISOString().split('T')[0];

  const existing = db.prepare('SELECT * FROM game_stats WHERE user_id = ? AND stat_date = ?').get(user_id, today);

  if (existing) {
    db.prepare(`
      UPDATE game_stats SET
        games_played = games_played + 1,
        total_distance = total_distance + ?,
        total_time_diff = total_time_diff + ?,
        total_elapsed = total_elapsed + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND stat_date = ?
    `).run(distanceKm, timeDiffYears || 0, elapsed_seconds || 0, user_id, today);
  } else {
    db.prepare(`
      INSERT INTO game_stats (user_id, stat_date, games_played, total_distance, total_time_diff, total_elapsed)
      VALUES (?, ?, 1, ?, ?, ?)
    `).run(user_id, today, distanceKm, timeDiffYears || 0, elapsed_seconds || 0);
  }

  res.json({
    success: true,
    data: {
      distance_km: distanceKm,
      time_diff_years: timeDiffYears,
      time_in_range: timeIn,
      correct_lat: event.location_lat,
      correct_lng: event.location_lng,
      correct_location_name: event.location_name,
      correct_title: event.title,
      correct_description: event.description,
      correct_start_display: tsToDisplay(event.start_ts, event.start_precision),
      correct_end_display: tsToDisplay(event.end_ts, event.end_precision)
    }
  });
});

router.get('/stats/:userId', (req, res) => {
  const { userId } = req.params;

  const stats = db.prepare(`
    SELECT stat_date, games_played, total_distance, total_time_diff, total_elapsed
    FROM game_stats
    WHERE user_id = ?
    ORDER BY stat_date DESC
    LIMIT 30
  `).all(userId);

  const totals = db.prepare(`
    SELECT
      SUM(games_played) as total_games,
      SUM(total_distance) as total_distance,
      SUM(total_time_diff) as total_time_diff,
      SUM(total_elapsed) as total_elapsed
    FROM game_stats
    WHERE user_id = ?
  `).get(userId);

  res.json({
    success: true,
    data: {
      daily: stats,
      totals: {
        total_games: totals.total_games || 0,
        total_distance: Math.round(totals.total_distance || 0),
        total_time_diff: totals.total_time_diff || 0,
        total_elapsed: Math.round((totals.total_elapsed || 0) * 10) / 10
      }
    }
  });
});

module.exports = router;
