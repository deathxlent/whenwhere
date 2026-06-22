const db = require('../../db');
const { tsToDisplay, tsToYear } = require('./utils');
const { expandBoundsByKm, haversineDistance, distanceToRectBounds } = require('./geography');
const { updateAchievements, updateUserRank } = require('./achievements');

function getRandomEvent(sub_codes) {
  if (!sub_codes) {
    throw new Error('请选择分类');
  }

  const codes = sub_codes.split(',').filter(Boolean);
  if (codes.length === 0) {
    throw new Error('至少选择一个分类');
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
    throw new Error('该分类下暂无数据');
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

  return {
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
    images: imageData,
    video_url: event.video_url,
    audio_url: event.audio_url
  };
}

function submitAnswer(user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, elapsed_seconds, timed_out) {
  if (!user_id || !event_id) {
    throw new Error('参数不完整');
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
    throw new Error('事件不存在');
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

  db.prepare(`
    INSERT INTO game_answers
      (user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day,
       distance_km, time_diff_years, precise_location, precise_time, timed_out, elapsed_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user_id, event_id,
    guess_lat != null ? parseFloat(guess_lat) : null,
    guess_lng != null ? parseFloat(guess_lng) : null,
    guess_year != null ? parseInt(guess_year) : null,
    guess_month != null ? parseInt(guess_month) : null,
    guess_day != null ? parseInt(guess_day) : null,
    rawDistanceKm != null ? Math.round(rawDistanceKm * distanceScale) : null,
    timeDiffYears,
    preciseLocation ? 1 : 0,
    preciseTime ? 1 : 0,
    timed_out ? 1 : 0,
    elapsed_seconds || 0
  );

  return {
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
    correct_video_url: event.video_url,
    correct_audio_url: event.audio_url,
    correct_start_display: tsToDisplay(event.start_ts, event.start_precision),
    correct_end_display: tsToDisplay(event.end_ts, event.end_precision),
    distance_unit: distanceUnit,
    distance_scale: distanceScale,
    new_achievements: newlyUnlockedAchievements
  };
}

module.exports = {
  getRandomEvent,
  submitAnswer
};
