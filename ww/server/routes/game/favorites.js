const db = require('../../db');
const { tsToDisplay } = require('./utils');

function toggleFavorite(user_id, event_id) {
  if (!user_id || !event_id) {
    throw new Error('参数不完整');
  }

  const existing = db.prepare('SELECT * FROM user_favorites WHERE user_id = ? AND event_id = ?').get(user_id, event_id);

  if (existing) {
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND event_id = ?').run(user_id, event_id);
    return { is_favorite: false, message: '已取消收藏' };
  } else {
    db.prepare('INSERT INTO user_favorites (user_id, event_id) VALUES (?, ?)').run(user_id, event_id);
    return { is_favorite: true, message: '已收藏' };
  }
}

function getFavorites(userId, keyword = '') {
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

  return favorites.map(f => ({
    id: f.id,
    title: f.title,
    description: f.description,
    category_name: f.category_name,
    sub_category_name: f.sub_category_name,
    start_display: tsToDisplay(f.start_ts, f.start_precision),
    end_display: tsToDisplay(f.end_ts, f.end_precision),
    location_name: f.location_name,
    favorited_at: f.favorited_at
  }));
}

function checkFavorite(user_id, event_id) {
  if (!user_id) {
    return { is_favorite: false };
  }
  const existing = db.prepare('SELECT * FROM user_favorites WHERE user_id = ? AND event_id = ?').get(user_id, event_id);
  return { is_favorite: !!existing };
}

module.exports = {
  toggleFavorite,
  getFavorites,
  checkFavorite
};
