const db = require('../../db');
const { tsToDisplay } = require('./utils');

function getEventAnswers(eventId, userId) {
  if (!eventId) {
    throw new Error('事件ID不能为空');
  }

  const event = db.prepare(`
    SELECT e.*,
      c.name as category_name,
      sc.name as sub_category_name, sc.code as sub_category_code,
      sc.center_lat, sc.center_lng, sc.default_zoom, sc.min_zoom, sc.max_zoom,
      m.tile_type as map_tile_type, m.tile_url as map_tile_url,
      m.tile_subdomains as map_tile_subdomains,
      m.crs_type as map_crs_type,
      m.bounds_south as map_bounds_south, m.bounds_west as map_bounds_west,
      m.bounds_north as map_bounds_north, m.bounds_east as map_bounds_east,
      m.tile_ext as map_tile_ext, m.tile_size as map_tile_size,
      m.center_lat as map_center_lat, m.center_lng as map_center_lng,
      m.default_zoom as map_default_zoom,
      m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom,
      m.distance_unit, m.distance_scale
    FROM events e
    JOIN categories c ON e.category_id = c.id
    JOIN sub_categories sc ON e.sub_category_id = sc.id
    LEFT JOIN maps m ON sc.map_id = m.id
    WHERE e.id = ?
  `).get(eventId);

  if (!event) {
    throw new Error('事件不存在');
  }

  const recentAnswers = db.prepare(`
    SELECT ga.*, u.username
    FROM game_answers ga
    JOIN users u ON ga.user_id = u.id
    WHERE ga.event_id = ? AND ga.guess_lat IS NOT NULL AND ga.guess_lng IS NOT NULL
    ORDER BY ga.created_at DESC
    LIMIT 50
  `).all(eventId);

  const otherAnswers = recentAnswers.map(a => ({
    id: a.id,
    username: a.username,
    user_id: a.user_id,
    guess_lat: a.guess_lat,
    guess_lng: a.guess_lng,
    guess_year: a.guess_year,
    guess_month: a.guess_month,
    guess_day: a.guess_day,
    distance_km: a.distance_km,
    time_diff_years: a.time_diff_years,
    precise_location: a.precise_location === 1,
    precise_time: a.precise_time === 1,
    timed_out: a.timed_out === 1,
    elapsed_seconds: a.elapsed_seconds,
    created_at: a.created_at
  }));

  let myAnswer = null;
  if (userId) {
    const mine = db.prepare(`
      SELECT * FROM game_answers
      WHERE user_id = ? AND event_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId, eventId);

    if (mine) {
      myAnswer = {
        id: mine.id,
        guess_lat: mine.guess_lat,
        guess_lng: mine.guess_lng,
        guess_year: mine.guess_year,
        guess_month: mine.guess_month,
        guess_day: mine.guess_day,
        distance_km: mine.distance_km,
        time_diff_years: mine.time_diff_years,
        precise_location: mine.precise_location === 1,
        precise_time: mine.precise_time === 1,
        timed_out: mine.timed_out === 1,
        elapsed_seconds: mine.elapsed_seconds,
        created_at: mine.created_at
      };
    }
  }

  const totalAnswerCount = db.prepare(
    'SELECT COUNT(*) as cnt FROM game_answers WHERE event_id = ?'
  ).get(eventId).cnt;

  const answerStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      AVG(distance_km) as avg_distance,
      AVG(ABS(time_diff_years)) as avg_time_diff,
      AVG(elapsed_seconds) as avg_elapsed,
      SUM(precise_location) as total_precise_location,
      SUM(precise_time) as total_precise_time
    FROM game_answers WHERE event_id = ?
  `).get(eventId);

  const images = db.prepare(`
    SELECT id, filename, file_path FROM event_images
    WHERE event_id = ? ORDER BY sort_order, id
  `).all(eventId);

  const imageData = images.map(img => {
    if (img.file_path && (img.file_path.startsWith('http://') || img.file_path.startsWith('https://'))) {
      return { id: img.id, url: img.file_path };
    }
    const catCode = (event.category_name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'misc';
    return {
      id: img.id,
      url: `/images/${catCode}/${event.sub_category_code || 'general'}/${event.id}/${img.filename}`
    };
  });

  return {
    event: {
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
      category_name: event.category_name,
      sub_category_name: event.sub_category_name,
      sub_category_code: event.sub_category_code,
      video_url: event.video_url,
      audio_url: event.audio_url,
      images: imageData
    },
    map_config: {
      center_lat: event.center_lat,
      center_lng: event.center_lng,
      default_zoom: event.default_zoom,
      min_zoom: event.min_zoom,
      max_zoom: event.max_zoom,
      tile_type: event.map_tile_type || 'hybrid',
      tile_url: event.map_tile_url || '',
      tile_subdomains: event.map_tile_subdomains || 'a,b,c',
      crs_type: event.map_crs_type || 'epsg3857',
      bounds_south: event.map_bounds_south,
      bounds_west: event.map_bounds_west,
      bounds_north: event.map_bounds_north,
      bounds_east: event.map_bounds_east,
      tile_size: event.map_tile_size ? parseInt(event.map_tile_size) : 256,
      distance_unit: event.distance_unit || 'km',
      distance_scale: event.distance_scale != null ? event.distance_scale : 1,
      map_min_zoom: event.map_min_zoom,
      map_max_zoom: event.map_max_zoom
    },
    stats: {
      total_answers: totalAnswerCount,
      avg_distance: answerStats.avg_distance != null ? Math.round(answerStats.avg_distance * 10) / 10 : null,
      avg_time_diff: answerStats.avg_time_diff != null ? Math.round(answerStats.avg_time_diff * 10) / 10 : null,
      avg_elapsed: answerStats.avg_elapsed != null ? Math.round(answerStats.avg_elapsed * 10) / 10 : null,
      total_precise_location: answerStats.total_precise_location || 0,
      total_precise_time: answerStats.total_precise_time || 0,
      precise_location_rate: totalAnswerCount > 0
        ? Math.round(((answerStats.total_precise_location || 0) / totalAnswerCount) * 1000) / 10
        : 0,
      precise_time_rate: totalAnswerCount > 0
        ? Math.round(((answerStats.total_precise_time || 0) / totalAnswerCount) * 1000) / 10
        : 0
    },
    other_answers: otherAnswers,
    my_answer: myAnswer
  };
}

module.exports = { getEventAnswers };
