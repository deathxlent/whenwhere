(function() {
var BL = window.BL;
var authCrypto = window.authCrypto;
var dbDriver = window.dbDriver;

var MobileAPI = {
  get: async function(url) {
    return this._dispatch('GET', url, null);
  },
  post: async function(url, data) {
    return this._dispatch('POST', url, data);
  },
  _dispatch: async function(method, url, data) {
    try {
      await dbDriver.waitForReady();
      var db = window._db || dbDriver;
      if (!db) return { success: false, message: '数据库未初始化' };

      var path = url.replace(/^\/api/, '');
      if (method === 'POST' && path === '/auth/register') return await this._authRegister(data);
      if (method === 'POST' && path === '/auth/login') return await this._authLogin(data);
      if (method === 'POST' && path === '/auth/verify') return await this._authVerify(data);

      if (method === 'GET' && path === '/categories') return this._getCategories();
      if (method === 'GET' && path.match(/^\/categories\/\d+\/sub-categories$/)) return this._getSubCategories(path);

      if (method === 'GET' && path.indexOf('/game/random-event') === 0) return this._getRandomEvent(path);
      if (method === 'POST' && path === '/game/submit') return this._submitAnswer(data);
      if (method === 'GET' && path.match(/^\/game\/stats\//)) return this._getUserStats(path);
      if (method === 'POST' && path === '/game/vote') return this._submitVote(data);
      if (method === 'GET' && path.match(/^\/game\/vote\//)) return this._getVoteStats(path);
      if (method === 'POST' && path === '/game/favorite') return this._toggleFavorite(data);
      if (method === 'GET' && path.match(/^\/game\/favorites\//)) return this._getFavorites(path);
      if (method === 'GET' && path.match(/^\/game\/favorite\/check\//)) return this._checkFavorite(path);
      if (method === 'GET' && path.indexOf('/game/leaderboard') === 0) return this._getLeaderboard(path);
      if (method === 'GET' && path.match(/^\/game\/event\//)) return this._getEventAnswers(path);

      if (method === 'GET' && path === '/achievements/list') return this._getAchievementsList(path);
      if (method === 'GET' && path.match(/^\/achievements\/user\//)) return this._getUserAchievements(path);
      if (method === 'GET' && path.match(/^\/achievements\/rank-history\//)) return this._getRankHistory(path);

      return { success: false, message: '未知接口: ' + path };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  _parseQuery: function(url) {
    var q = {};
    var idx = url.indexOf('?');
    if (idx < 0) return q;
    var pairs = url.substring(idx + 1).split('&');
    for (var i = 0; i < pairs.length; i++) {
      var p = pairs[i];
      var parts = p.split('=');
      var k = parts[0];
      var v = parts[1];
      q[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
    return q;
  },

  _authRegister: async function(data) {
    var db = window._db || dbDriver;
    var username = data.username;
    if (!username || username.trim().length === 0) return { success: false, message: '请输入用户名' };
    if (username.trim().length > 20) return { success: false, message: '用户名不能超过20个字符' };
    var name = username.trim();
    var existing = db.prepare('SELECT * FROM users WHERE username = ?').get(name);
    if (existing) return { success: false, message: '该用户名已存在，请输入您的token或选择其他用户名', needToken: true };
    var token = authCrypto.generateToken();
    var tokenHash = await authCrypto.hashToken(token);
    var encrypted = await authCrypto.encryptToken(token);
    var result = db.prepare('INSERT INTO users (username, token_hash) VALUES (?, ?)').run(name, tokenHash);
    return { success: true, data: { id: result.lastInsertRowid, username: name, token: token, encrypted: encrypted }, message: '注册成功' };
  },

  _authLogin: async function(data) {
    var db = window._db || dbDriver;
    var username = data.username;
    var token = data.token;
    if (!username || !token) return { success: false, message: '请输入用户名和token' };
    var name = username.trim();
    var user = db.prepare('SELECT * FROM users WHERE username = ?').get(name);
    if (!user) return { success: false, message: '用户不存在' };
    var tokenHash = await authCrypto.hashToken(token.trim());
    if (tokenHash !== user.token_hash) return { success: false, message: 'token不正确' };
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    var encrypted = await authCrypto.encryptToken(token.trim());
    return { success: true, data: { id: user.id, username: user.username, encrypted: encrypted }, message: '登录成功' };
  },

  _authVerify: async function(data) {
    var db = window._db || dbDriver;
    var encrypted = data.encrypted;
    if (!encrypted) return { success: false, message: '未提供凭证' };
    var token = await authCrypto.decryptToken(encrypted);
    if (!token) return { success: false, message: '凭证无效' };
    var tokenHash = await authCrypto.hashToken(token);
    var user = db.prepare('SELECT id, username FROM users WHERE token_hash = ?').get(tokenHash);
    if (!user) return { success: false, message: '用户不存在' };
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    return { success: true, data: { id: user.id, username: user.username } };
  },

  _getCategories: function() {
    var db = window._db || dbDriver;
    var categories = db.prepare(
      'SELECT c.*, ' +
      '  (SELECT COUNT(*) FROM sub_categories sc WHERE sc.category_id = c.id AND sc.is_active = 1) as total_sub_count, ' +
      '  (SELECT COUNT(*) FROM sub_categories sc ' +
      '    WHERE sc.category_id = c.id AND sc.is_active = 1 ' +
      '    AND sc.map_id IS NOT NULL ' +
      '    AND (SELECT COUNT(*) FROM events e WHERE e.sub_category_id = sc.id AND e.is_active = 1) > 0 ' +
      '  ) as available_sub_count, ' +
      '  (SELECT COUNT(*) FROM events e ' +
      '    JOIN sub_categories sc ON e.sub_category_id = sc.id ' +
      '    WHERE sc.category_id = c.id AND e.is_active = 1 ' +
      '  ) as total_event_count ' +
      'FROM categories c ' +
      'WHERE c.is_active = 1 ' +
      'ORDER BY c.sort_order, c.id'
    ).all();
    return { success: true, data: categories };
  },

  _getSubCategories: function(path) {
    var db = window._db || dbDriver;
    var idMatch = path.match(/\/categories\/(\d+)\/sub-categories/);
    var id = idMatch ? idMatch[1] : null;
    var subCategories = db.prepare(
      'SELECT sc.*, ' +
      '  m.name as map_name, m.code as map_code, ' +
      '  m.tile_type as map_tile_type, m.tile_url as map_tile_url, ' +
      '  m.tile_subdomains as map_tile_subdomains, ' +
      '  m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom, ' +
      '  m.crs_type as map_crs_type, ' +
      '  m.bounds_south as map_bounds_south, m.bounds_west as map_bounds_west, ' +
      '  m.bounds_north as map_bounds_north, m.bounds_east as map_bounds_east, ' +
      '  m.tile_ext as map_tile_ext, m.tile_size as map_tile_size, ' +
      '  (SELECT COUNT(*) FROM events e WHERE e.sub_category_id = sc.id AND e.is_active = 1) as event_count ' +
      'FROM sub_categories sc ' +
      'LEFT JOIN maps m ON sc.map_id = m.id ' +
      'WHERE sc.category_id = ? AND sc.is_active = 1 ' +
      'ORDER BY sc.sort_order, sc.id'
    ).all(id);
    return { success: true, data: subCategories };
  },

  _getRandomEvent: function(url) {
    var db = window._db || dbDriver;
    var query = this._parseQuery(url);
    var sub_codes = query.sub_codes;
    if (!sub_codes) throw new Error('请选择分类');
    var codes = sub_codes.split(',').filter(function(s) { return !!s; });
    if (codes.length === 0) throw new Error('至少选择一个分类');
    var placeholders = codes.map(function() { return '?'; }).join(',');
    var sql = 'SELECT e.*, c.code as category_code, c.name as category_name, ' +
      'sc.code as sub_category_code, sc.name as sub_category_name, ' +
      'm.distance_unit, m.distance_scale ' +
      'FROM events e ' +
      'JOIN categories c ON e.category_id = c.id ' +
      'JOIN sub_categories sc ON e.sub_category_id = sc.id ' +
      'LEFT JOIN maps m ON sc.map_id = m.id ' +
      'WHERE sc.code IN (' + placeholders + ') AND e.is_active = 1';

    var events = db.prepare(sql).all.apply(db.prepare(sql), codes);
    if (events.length === 0) throw new Error('该分类下暂无数据');
    var event = events[Math.floor(Math.random() * events.length)];
    var images = db.prepare('SELECT id, filename, file_path FROM event_images WHERE event_id = ? ORDER BY sort_order, id').all(event.id);
    var imageData = images.map(function(img) {
      if (img.file_path && (img.file_path.indexOf('http://') === 0 || img.file_path.indexOf('https://') === 0)) {
        return { id: img.id, url: img.file_path };
      }
      return { id: img.id, url: '/images/' + event.category_code + '/' + event.sub_category_code + '/' + event.id + '/' + img.filename };
    });
    return { success: true, data: {
      id: event.id, title: event.title, description: event.description, tips: event.tips,
      location_lat: event.location_lat, location_lng: event.location_lng,
      location_lat2: event.location_lat2, location_lng2: event.location_lng2,
      location_only: event.location_only ? true : false, location_name: event.location_name,
      start_ts: event.start_ts, start_precision: event.start_precision,
      end_ts: event.end_ts, end_precision: event.end_precision,
      start_display: BL.tsToDisplay(event.start_ts, event.start_precision),
      end_display: BL.tsToDisplay(event.end_ts, event.end_precision),
      sub_category_code: event.sub_category_code, sub_category_name: event.sub_category_name,
      distance_unit: event.distance_unit || 'km',
      distance_scale: event.distance_scale != null ? event.distance_scale : 1,
      images: imageData, video_url: event.video_url, audio_url: event.audio_url
    }};
  },

  _submitAnswer: function(data) {
    var db = window._db || dbDriver;
    var user_id = data.user_id;
    var event_id = data.event_id;
    var guess_lat = data.guess_lat;
    var guess_lng = data.guess_lng;
    var guess_year = data.guess_year;
    var guess_month = data.guess_month;
    var guess_day = data.guess_day;
    var elapsed_seconds = data.elapsed_seconds;
    var timed_out = data.timed_out;
    if (!user_id || !event_id) throw new Error('参数不完整');
    var event = db.prepare('SELECT e.*, sc.code as sub_category_code, m.distance_unit, m.distance_scale FROM events e JOIN sub_categories sc ON e.sub_category_id = sc.id LEFT JOIN maps m ON sc.map_id = m.id WHERE e.id = ?').get(event_id);
    if (!event) throw new Error('事件不存在');
    var distanceUnit = event.distance_unit || 'km';
    var distanceScale = event.distance_scale != null ? event.distance_scale : 1;
    var rawDistanceKm = null;
    var preciseLocation = false;

    if (event.location_lat && event.location_lng && guess_lat != null && guess_lng != null) {
      if (event.location_lat2 != null && event.location_lng2 != null) {
        var expanded = BL.expandBoundsByKm(event.location_lat, event.location_lng, event.location_lat2, event.location_lng2, 50);
        var guessLatNum = parseFloat(guess_lat);
        var guessLngNum = parseFloat(guess_lng);
        if (guessLatNum >= expanded.south && guessLatNum <= expanded.north && guessLngNum >= expanded.west && guessLngNum <= expanded.east) {
          preciseLocation = true;
        }
        rawDistanceKm = BL.distanceToRectBounds(guessLatNum, guessLngNum, event.location_lat, event.location_lng, event.location_lat2, event.location_lng2);
      } else {
        rawDistanceKm = BL.haversineDistance(parseFloat(guess_lat), parseFloat(guess_lng), event.location_lat, event.location_lng);
        preciseLocation = rawDistanceKm <= 50;
      }
    }
    var distanceKm = rawDistanceKm != null ? Math.round(rawDistanceKm * distanceScale) : null;

    var timeDiffYears = null;
    var timeIn = null;
    var preciseTime = false;
    if (!event.location_only && guess_year != null && event.start_ts != null) {
      var startYear = BL.tsToYear(event.start_ts);
      var endYear = event.end_ts ? BL.tsToYear(event.end_ts) : startYear;
      timeIn = guess_year >= startYear && guess_year <= endYear;
      var diffFromStart = startYear - guess_year;
      var diffFromEnd = endYear - guess_year;
      timeDiffYears = Math.abs(diffFromStart) <= Math.abs(diffFromEnd) ? diffFromStart : diffFromEnd;
      var Y = Math.abs(startYear - 2026);
      var preciseThreshold = Y * 0.01;
      preciseTime = preciseThreshold > 0 ? Math.abs(timeDiffYears) <= preciseThreshold : timeDiffYears === 0;
    }

    var today = new Date().toISOString().split('T')[0];
    var existing = db.prepare('SELECT * FROM game_stats WHERE user_id = ? AND stat_date = ?').get(user_id, today);
    var distanceForStats = preciseLocation ? 0 : (rawDistanceKm != null ? Math.round(rawDistanceKm) : 0);
    var timeForStats = preciseTime ? 0 : Math.abs(timeDiffYears || 0);
    var elapsedForStats = elapsed_seconds || 0;
    var preciseLocCount = preciseLocation ? 1 : 0;
    var preciseTimeCount = preciseTime ? 1 : 0;

    if (existing) {
      db.prepare('UPDATE game_stats SET games_played = games_played + 1, total_distance = total_distance + ?, total_time_diff = total_time_diff + ?, total_elapsed = total_elapsed + ?, precise_location_count = precise_location_count + ?, precise_time_count = precise_time_count + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND stat_date = ?')
        .run(distanceForStats, timeForStats, elapsedForStats, preciseLocCount, preciseTimeCount, user_id, today);
    } else {
      db.prepare('INSERT INTO game_stats (user_id, stat_date, games_played, total_distance, total_time_diff, total_elapsed, precise_location_count, precise_time_count) VALUES (?, ?, 1, ?, ?, ?, ?, ?)')
        .run(user_id, today, distanceForStats, timeForStats, elapsedForStats, preciseLocCount, preciseTimeCount);
    }

    var newlyUnlockedAchievements = BL.updateAchievements(user_id, preciseLocation, preciseTime, event.location_only);
    BL.updateUserRank(user_id);

    db.prepare('INSERT INTO game_answers (user_id, event_id, guess_lat, guess_lng, guess_year, guess_month, guess_day, distance_km, time_diff_years, precise_location, precise_time, timed_out, elapsed_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(user_id, event_id,
        guess_lat != null ? parseFloat(guess_lat) : null,
        guess_lng != null ? parseFloat(guess_lng) : null,
        guess_year != null ? parseInt(guess_year) : null,
        guess_month != null ? parseInt(guess_month) : null,
        guess_day != null ? parseInt(guess_day) : null,
        rawDistanceKm != null ? Math.round(rawDistanceKm * distanceScale) : null,
        timeDiffYears, preciseLocation ? 1 : 0, preciseTime ? 1 : 0, timed_out ? 1 : 0, elapsed_seconds || 0);

    return { success: true, data: {
      distance_km: distanceKm, time_diff_years: timeDiffYears, time_in_range: timeIn,
      precise_location: preciseLocation, precise_time: preciseTime, timed_out: !!timed_out,
      location_only: event.location_only ? true : false,
      correct_lat: event.location_lat, correct_lng: event.location_lng,
      correct_lat2: event.location_lat2, correct_lng2: event.location_lng2,
      correct_location_name: event.location_name, correct_title: event.title,
      correct_description: event.description, correct_tips: event.tips,
      correct_video_url: event.video_url, correct_audio_url: event.audio_url,
      correct_start_display: BL.tsToDisplay(event.start_ts, event.start_precision),
      correct_end_display: BL.tsToDisplay(event.end_ts, event.end_precision),
      distance_unit: distanceUnit, distance_scale: distanceScale,
      new_achievements: newlyUnlockedAchievements
    }};
  },

  _getUserStats: function(url) {
    var db = window._db || dbDriver;
    var match = url.match(/\/game\/stats\/(\d+)/);
    var userId = match ? parseInt(match[1]) : null;
    var query = this._parseQuery(url);
    var period = query.period || 'all';
    var range = BL.getDateRange(period);
    var whereClause = 'WHERE user_id = ?';
    var params = [userId];
    if (period !== 'all') { whereClause += ' AND stat_date >= ? AND stat_date <= ?'; params.push(range.start, range.end); }
    var daily = db.prepare('SELECT stat_date, games_played, total_distance, total_time_diff, total_elapsed, precise_location_count, precise_time_count FROM game_stats ' + whereClause + ' ORDER BY stat_date DESC LIMIT 365').all.apply(db.prepare('SELECT stat_date, games_played, total_distance, total_time_diff, total_elapsed, precise_location_count, precise_time_count FROM game_stats ' + whereClause + ' ORDER BY stat_date DESC LIMIT 365'), params);
    var totals = db.prepare('SELECT SUM(games_played) as total_games, SUM(total_distance) as total_distance, SUM(total_time_diff) as total_time_diff, SUM(total_elapsed) as total_elapsed, SUM(precise_location_count) as total_precise_location, SUM(precise_time_count) as total_precise_time FROM game_stats ' + whereClause).get.apply(db.prepare('SELECT SUM(games_played) as total_games, SUM(total_distance) as total_distance, SUM(total_time_diff) as total_time_diff, SUM(total_elapsed) as total_elapsed, SUM(precise_location_count) as total_precise_location, SUM(precise_time_count) as total_precise_time FROM game_stats ' + whereClause), params);
    var totalGames = totals.total_games || 0;
    return { success: true, data: { daily: daily, totals: {
      total_games: totalGames, total_distance: Math.round(totals.total_distance || 0), total_time_diff: totals.total_time_diff || 0,
      total_elapsed: Math.round((totals.total_elapsed || 0) * 10) / 10, total_precise_location: totals.total_precise_location || 0, total_precise_time: totals.total_precise_time || 0,
      avg_distance: Math.round((totalGames > 0 ? (totals.total_distance || 0) / totalGames : 0) * 10) / 10,
      avg_time_diff: Math.round((totalGames > 0 ? (totals.total_time_diff || 0) / totalGames : 0) * 10) / 10,
      avg_elapsed: Math.round((totalGames > 0 ? (totals.total_elapsed || 0) / totalGames : 0) * 10) / 10,
      avg_precise_location: Math.round((totalGames > 0 ? (totals.total_precise_location || 0) / totalGames : 0) * 1000) / 1000,
      avg_precise_time: Math.round((totalGames > 0 ? (totals.total_precise_time || 0) / totalGames : 0) * 1000) / 1000
    }}};
  },

  _submitVote: function(data) {
    var db = window._db || dbDriver;
    var user_id = data.user_id;
    var event_id = data.event_id;
    var vote_type = data.vote_type;
    if (!user_id || !event_id || vote_type === undefined) throw new Error('参数不完整');
    var voteTypeInt = parseInt(vote_type);
    if (voteTypeInt !== 1 && voteTypeInt !== -1) throw new Error('vote_type 只能是 1(赞) 或 -1(踩)');
    var existing = db.prepare('SELECT * FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, event_id);
    if (existing) {
      if (existing.vote_type === voteTypeInt) {
        db.prepare('DELETE FROM event_votes WHERE user_id = ? AND event_id = ?').run(user_id, event_id);
      } else {
        db.prepare('UPDATE event_votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND event_id = ?').run(voteTypeInt, user_id, event_id);
      }
    } else {
      db.prepare('INSERT INTO event_votes (user_id, event_id, vote_type) VALUES (?, ?, ?)').run(user_id, event_id, voteTypeInt);
    }
    return { success: true, data: this._getVoteStatsData(event_id, user_id) };
  },

  _getVoteStatsData: function(event_id, user_id) {
    var db = window._db || dbDriver;
    var stats = db.prepare('SELECT SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) as up_count, SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) as down_count FROM event_votes WHERE event_id = ?').get(event_id);
    var myVote = 0;
    if (user_id) {
      var current = db.prepare('SELECT vote_type FROM event_votes WHERE user_id = ? AND event_id = ?').get(user_id, event_id);
      myVote = current ? current.vote_type : 0;
    }
    return { up_count: stats.up_count || 0, down_count: stats.down_count || 0, my_vote: myVote };
  },

  _getVoteStats: function(url) {
    var match = url.match(/\/game\/vote\/(\d+)/);
    var eventId = match ? parseInt(match[1]) : null;
    var query = this._parseQuery(url);
    return { success: true, data: this._getVoteStatsData(eventId, query.user_id ? parseInt(query.user_id) : null) };
  },

  _toggleFavorite: function(data) {
    var db = window._db || dbDriver;
    var user_id = data.user_id;
    var event_id = data.event_id;
    if (!user_id || !event_id) throw new Error('参数不完整');
    var existing = db.prepare('SELECT * FROM user_favorites WHERE user_id = ? AND event_id = ?').get(user_id, event_id);
    if (existing) {
      db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND event_id = ?').run(user_id, event_id);
      return { success: true, data: { is_favorite: false }, message: '已取消收藏' };
    }
    db.prepare('INSERT INTO user_favorites (user_id, event_id) VALUES (?, ?)').run(user_id, event_id);
    return { success: true, data: { is_favorite: true }, message: '已收藏' };
  },

  _getFavorites: function(url) {
    var db = window._db || dbDriver;
    var match = url.match(/\/game\/favorites\/(\d+)/);
    var userId = match ? parseInt(match[1]) : null;
    var query = this._parseQuery(url);
    var keyword = query.keyword || '';
    var whereClause = 'WHERE uf.user_id = ?';
    var params = [userId];
    if (keyword && keyword.trim()) { whereClause += ' AND e.title LIKE ?'; params.push('%' + keyword.trim() + '%'); }
    var favorites = db.prepare('SELECT e.*, c.code as category_code, c.name as category_name, sc.code as sub_category_code, sc.name as sub_category_name, uf.created_at as favorited_at FROM user_favorites uf JOIN events e ON uf.event_id = e.id JOIN categories c ON e.category_id = c.id JOIN sub_categories sc ON e.sub_category_id = sc.id ' + whereClause + ' ORDER BY uf.created_at DESC').all.apply(db.prepare('SELECT e.*, c.code as category_code, c.name as category_name, sc.code as sub_category_code, sc.name as sub_category_name, uf.created_at as favorited_at FROM user_favorites uf JOIN events e ON uf.event_id = e.id JOIN categories c ON e.category_id = c.id JOIN sub_categories sc ON e.sub_category_id = sc.id ' + whereClause + ' ORDER BY uf.created_at DESC'), params);
    return { success: true, data: favorites.map(function(f) {
      return {
        id: f.id, title: f.title, description: f.description,
        category_name: f.category_name, sub_category_name: f.sub_category_name,
        start_display: BL.tsToDisplay(f.start_ts, f.start_precision),
        end_display: BL.tsToDisplay(f.end_ts, f.end_precision),
        location_name: f.location_name, favorited_at: f.favorited_at
      };
    })};
  },

  _checkFavorite: function(url) {
    var db = window._db || dbDriver;
    var match = url.match(/\/game\/favorite\/check\/(\d+)/);
    var eventId = match ? parseInt(match[1]) : null;
    var query = this._parseQuery(url);
    var userId = query.user_id ? parseInt(query.user_id) : null;
    if (!userId) return { success: true, data: { is_favorite: false } };
    var existing = db.prepare('SELECT * FROM user_favorites WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    return { success: true, data: { is_favorite: !!existing } };
  },

  _getLeaderboard: function(url) {
    var db = window._db || dbDriver;
    var query = this._parseQuery(url);
    var period = query.period || 'all';
    var range = BL.getDateRange(period);
    var whereClause = '';
    var params = [];
    if (period !== 'all') { whereClause = 'WHERE gs.stat_date >= ? AND gs.stat_date <= ?'; params.push(range.start, range.end); }
    var rows = db.prepare('SELECT u.id as user_id, u.username, SUM(gs.games_played) as total_games, SUM(gs.total_distance) as total_distance, SUM(gs.total_time_diff) as total_time_diff, SUM(gs.total_elapsed) as total_elapsed, SUM(gs.precise_location_count) as total_precise_location, SUM(gs.precise_time_count) as total_precise_time FROM game_stats gs JOIN users u ON gs.user_id = u.id ' + whereClause + ' GROUP BY u.id, u.username').all.apply(db.prepare('SELECT u.id as user_id, u.username, SUM(gs.games_played) as total_games, SUM(gs.total_distance) as total_distance, SUM(gs.total_time_diff) as total_time_diff, SUM(gs.total_elapsed) as total_elapsed, SUM(gs.precise_location_count) as total_precise_location, SUM(gs.precise_time_count) as total_precise_time FROM game_stats gs JOIN users u ON gs.user_id = u.id ' + whereClause + ' GROUP BY u.id, u.username'), params);
    var ranked = rows.map(function(r) {
      var tg = r.total_games || 0;
      return { user_id: r.user_id, username: r.username, total_games: tg,
        avg_distance: tg > 0 ? (r.total_distance || 0) / tg : 999999,
        avg_time_diff: tg > 0 ? (r.total_time_diff || 0) / tg : 999999,
        avg_elapsed: tg > 0 ? (r.total_elapsed || 0) / tg : 999999,
        avg_precise_location: tg > 0 ? (r.total_precise_location || 0) / tg : 0,
        avg_precise_time: tg > 0 ? (r.total_precise_time || 0) / tg : 0,
        total_precise_location: r.total_precise_location || 0, total_precise_time: r.total_precise_time || 0 };
    });
    var fmt = function(v, d) {
      if (d === undefined) d = 0;
      if (v === null || v === undefined || !isFinite(v)) return 0;
      var p = Math.pow(10, d);
      return Math.round(v * p) / p;
    };
    var byGames = ranked.slice().sort(function(a, b) { return b.total_games - a.total_games; }).slice(0, 10).map(function(r) { return { username: r.username, user_id: r.user_id, value: r.total_games + ' 局' }; });
    var byAvgDistance = ranked.filter(function(r) { return r.total_games > 0; }).sort(function(a, b) { return a.avg_distance - b.avg_distance; }).slice(0, 10).map(function(r) { return { username: r.username, user_id: r.user_id, value: fmt(r.avg_distance, 1) + ' km' }; });
    var byAvgTime = ranked.filter(function(r) { return r.total_games > 0; }).sort(function(a, b) { return a.avg_time_diff - b.avg_time_diff; }).slice(0, 10).map(function(r) { return { username: r.username, user_id: r.user_id, value: fmt(r.avg_time_diff, 1) + ' 年' }; });
    var byAvgElapsed = ranked.filter(function(r) { return r.total_games > 0; }).sort(function(a, b) { return a.avg_elapsed - b.avg_elapsed; }).slice(0, 10).map(function(r) { return { username: r.username, user_id: r.user_id, value: fmt(r.avg_elapsed, 1) + ' 秒' }; });
    var byPreciseLoc = ranked.slice().sort(function(a, b) { return b.avg_precise_location - a.avg_precise_location; }).slice(0, 10).map(function(r) { return { username: r.username, user_id: r.user_id, value: fmt(r.avg_precise_location * 100, 1) + '% (' + r.total_precise_location + ')' }; });
    var byPreciseTime = ranked.slice().sort(function(a, b) { return b.avg_precise_time - a.avg_precise_time; }).slice(0, 10).map(function(r) { return { username: r.username, user_id: r.user_id, value: fmt(r.avg_precise_time * 100, 1) + '% (' + r.total_precise_time + ')' }; });
    return { success: true, data: { by_games: byGames, by_avg_distance: byAvgDistance, by_avg_time: byAvgTime, by_avg_elapsed: byAvgElapsed, by_precise_location: byPreciseLoc, by_precise_time: byPreciseTime } };
  },

  _getEventAnswers: function(url) {
    var db = window._db || dbDriver;
    var match = url.match(/\/game\/event\/(\d+)\/answers/);
    var eventId = match ? parseInt(match[1]) : null;
    var query = this._parseQuery(url);
    var userId = query.user_id ? parseInt(query.user_id) : null;
    if (!eventId) throw new Error('事件ID不能为空');
    var event = db.prepare('SELECT e.*, c.code as category_code, c.name as category_name, sc.name as sub_category_name, sc.code as sub_category_code, sc.center_lat, sc.center_lng, sc.default_zoom, sc.min_zoom, sc.max_zoom, m.tile_type as map_tile_type, m.tile_url as map_tile_url, m.tile_subdomains as map_tile_subdomains, m.crs_type as map_crs_type, m.bounds_south as map_bounds_south, m.bounds_west as map_bounds_west, m.bounds_north as map_bounds_north, m.bounds_east as map_bounds_east, m.tile_ext as map_tile_ext, m.tile_size as map_tile_size, m.center_lat as map_center_lat, m.center_lng as map_center_lng, m.default_zoom as map_default_zoom, m.min_zoom as map_min_zoom, m.max_zoom as map_max_zoom, m.distance_unit, m.distance_scale FROM events e JOIN categories c ON e.category_id = c.id JOIN sub_categories sc ON e.sub_category_id = sc.id LEFT JOIN maps m ON sc.map_id = m.id WHERE e.id = ?').get(eventId);
    if (!event) throw new Error('事件不存在');
    var recentAnswers = db.prepare('SELECT ga.*, u.username FROM game_answers ga JOIN users u ON ga.user_id = u.id WHERE ga.event_id = ? AND ga.guess_lat IS NOT NULL AND ga.guess_lng IS NOT NULL ORDER BY ga.created_at DESC LIMIT 50').all(eventId);
    var otherAnswers = recentAnswers.map(function(a) { return { id: a.id, username: a.username, user_id: a.user_id, guess_lat: a.guess_lat, guess_lng: a.guess_lng, guess_year: a.guess_year, guess_month: a.guess_month, guess_day: a.guess_day, distance_km: a.distance_km, time_diff_years: a.time_diff_years, precise_location: a.precise_location === 1, precise_time: a.precise_time === 1, timed_out: a.timed_out === 1, elapsed_seconds: a.elapsed_seconds, created_at: a.created_at }; });
    var myAnswer = null;
    if (userId) {
      var mine = db.prepare('SELECT * FROM game_answers WHERE user_id = ? AND event_id = ? ORDER BY created_at DESC LIMIT 1').get(userId, eventId);
      if (mine) myAnswer = { id: mine.id, guess_lat: mine.guess_lat, guess_lng: mine.guess_lng, guess_year: mine.guess_year, guess_month: mine.guess_month, guess_day: mine.guess_day, distance_km: mine.distance_km, time_diff_years: mine.time_diff_years, precise_location: mine.precise_location === 1, precise_time: mine.precise_time === 1, timed_out: mine.timed_out === 1, elapsed_seconds: mine.elapsed_seconds, created_at: mine.created_at };
    }
    var totalAnswerCount = db.prepare('SELECT COUNT(*) as cnt FROM game_answers WHERE event_id = ?').get(eventId).cnt;
    var answerStats = db.prepare('SELECT COUNT(*) as total, AVG(distance_km) as avg_distance, AVG(ABS(time_diff_years)) as avg_time_diff, AVG(elapsed_seconds) as avg_elapsed, SUM(precise_location) as total_precise_location, SUM(precise_time) as total_precise_time FROM game_answers WHERE event_id = ?').get(eventId);
    var images = db.prepare('SELECT id, filename, file_path FROM event_images WHERE event_id = ? ORDER BY sort_order, id').all(eventId);
    var imageData = images.map(function(img) {
      if (img.file_path && (img.file_path.indexOf('http://') === 0 || img.file_path.indexOf('https://') === 0)) return { id: img.id, url: img.file_path };
      return { id: img.id, url: '/images/' + event.category_code + '/' + event.sub_category_code + '/' + event.id + '/' + img.filename };
    });
    return { success: true, data: {
      event: { id: event.id, title: event.title, description: event.description, tips: event.tips, location_lat: event.location_lat, location_lng: event.location_lng, location_lat2: event.location_lat2, location_lng2: event.location_lng2, location_only: event.location_only ? true : false, location_name: event.location_name, start_ts: event.start_ts, start_precision: event.start_precision, end_ts: event.end_ts, end_precision: event.end_precision, start_display: BL.tsToDisplay(event.start_ts, event.start_precision), end_display: BL.tsToDisplay(event.end_ts, event.end_precision), category_name: event.category_name, sub_category_name: event.sub_category_name, sub_category_code: event.sub_category_code, video_url: event.video_url, audio_url: event.audio_url, images: imageData },
      map_config: { center_lat: event.center_lat, center_lng: event.center_lng, default_zoom: event.default_zoom, min_zoom: event.min_zoom, max_zoom: event.max_zoom, tile_type: event.map_tile_type || 'hybrid', tile_url: event.map_tile_url || '', tile_subdomains: event.map_tile_subdomains || 'a,b,c', crs_type: event.map_crs_type || 'epsg3857', bounds_south: event.map_bounds_south, bounds_west: event.map_bounds_west, bounds_north: event.map_bounds_north, bounds_east: event.map_bounds_east, tile_size: event.map_tile_size ? parseInt(event.map_tile_size) : 256, distance_unit: event.distance_unit || 'km', distance_scale: event.distance_scale != null ? event.distance_scale : 1, map_min_zoom: event.map_min_zoom, map_max_zoom: event.map_max_zoom },
      stats: { total_answers: totalAnswerCount, avg_distance: answerStats.avg_distance != null ? Math.round(answerStats.avg_distance * 10) / 10 : null, avg_time_diff: answerStats.avg_time_diff != null ? Math.round(answerStats.avg_time_diff * 10) / 10 : null, avg_elapsed: answerStats.avg_elapsed != null ? Math.round(answerStats.avg_elapsed * 10) / 10 : null, total_precise_location: answerStats.total_precise_location || 0, total_precise_time: answerStats.total_precise_time || 0, precise_location_rate: totalAnswerCount > 0 ? Math.round(((answerStats.total_precise_location || 0) / totalAnswerCount) * 1000) / 10 : 0, precise_time_rate: totalAnswerCount > 0 ? Math.round(((answerStats.total_precise_time || 0) / totalAnswerCount) * 1000) / 10 : 0 },
      other_answers: otherAnswers, my_answer: myAnswer
    }};
  },

  _getAchievementsList: function(url) {
    var db = window._db || dbDriver;
    var query = this._parseQuery(url);
    var user_id = query.user_id ? parseInt(query.user_id) : 0;
    var achievements = db.prepare('SELECT a.*, ua.current_value as user_current_value, ua.unlocked_at as user_unlocked_at FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ? ORDER BY a.tier, a.target_value').all(user_id);
    return { success: true, data: achievements.map(function(a) {
      return { id: a.id, code: a.code, name: a.name, description: a.description, type: a.type, target_value: a.target_value, tier: a.tier, icon: a.icon, current_value: a.user_current_value || 0, unlocked: !!a.user_unlocked_at, unlocked_at: a.user_unlocked_at, progress: Math.min(100, Math.round(((a.user_current_value || 0) / a.target_value) * 100)) };
    }) };
  },

  _getUserAchievements: function(url) {
    var db = window._db || dbDriver;
    var match = url.match(/\/achievements\/user\/(\d+)/);
    var userId = match ? parseInt(match[1]) : null;
    var unlocked = db.prepare('SELECT a.*, ua.current_value, ua.unlocked_at FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = ? AND ua.unlocked_at IS NOT NULL ORDER BY a.tier DESC, a.target_value DESC').all(userId);
    var total = db.prepare('SELECT COUNT(*) as cnt FROM achievements').get().cnt;
    var unlockedCount = unlocked.length;
    var currentRank = BL.getRankByScore(unlockedCount);
    var nextRank = null;
    for (var i = 0; i < BL.RANK_CONFIG.length; i++) {
      var r = BL.RANK_CONFIG[i];
      if (r.level > currentRank.level) {
        nextRank = r;
        break;
      }
    }
    var monthlyStats = db.prepare("SELECT SUM(gs.games_played) as total_games, SUM(gs.precise_location_count) as total_precise_location, SUM(gs.precise_time_count) as total_precise_time FROM game_stats gs WHERE gs.user_id = ? AND strftime('%Y-%m', gs.stat_date) = ?").get(userId, BL.getCurrentMonthKey());
    var allAchievements = db.prepare('SELECT a.*, ua.current_value as user_current_value, ua.unlocked_at as user_unlocked_at FROM achievements a LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ? ORDER BY a.tier, a.target_value').all(userId);
    var achievementsWithProgress = allAchievements.map(function(a) {
      return { id: a.id, code: a.code, name: a.name, description: a.description, type: a.type, target_value: a.target_value, tier: a.tier, icon: a.icon, current_value: a.user_current_value || 0, unlocked: !!a.user_unlocked_at, unlocked_at: a.user_unlocked_at, progress: Math.min(100, Math.round(((a.user_current_value || 0) / a.target_value) * 100)) };
    });
    return { success: true, data: { unlocked_count: unlockedCount, total_count: total, unlocked_achievements: unlocked.map(function(a) { return { id: a.id, code: a.code, name: a.name, description: a.description, type: a.type, target_value: a.target_value, tier: a.tier, icon: a.icon, unlocked_at: a.unlocked_at }; }), all_achievements: achievementsWithProgress, current_rank: currentRank, next_rank: nextRank, monthly_stats: { total_games: monthlyStats.total_games || 0, total_precise_location: monthlyStats.total_precise_location || 0, total_precise_time: monthlyStats.total_precise_time || 0 } } };
  },

  _getRankHistory: function(url) {
    var db = window._db || dbDriver;
    var match = url.match(/\/achievements\/rank-history\/(\d+)/);
    var userId = match ? parseInt(match[1]) : null;
    var history = db.prepare('SELECT * FROM user_rank_history WHERE user_id = ? ORDER BY rank_month DESC').all(userId);
    return { success: true, data: history.map(function(h) {
      var rankConfig = null;
      for (var i = 0; i < BL.RANK_CONFIG.length; i++) {
        var r = BL.RANK_CONFIG[i];
        if (r.level === h.rank_level) {
          rankConfig = r;
          break;
        }
      }
      if (!rankConfig) rankConfig = BL.RANK_CONFIG[0];
      return { id: h.id, rank_month: h.rank_month, rank_level: h.rank_level, rank_name: h.rank_name, rank_icon: rankConfig.icon, rank_color: rankConfig.color, achievement_count: h.achievement_count, total_games: h.total_games, total_precise_location: h.total_precise_location, total_precise_time: h.total_precise_time, created_at: h.created_at };
    })};
  }
};

window.MobileAPI = MobileAPI;
window.__MOBILE_API__ = MobileAPI;

})();
