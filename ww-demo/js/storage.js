const STORAGE_KEYS = {
  FAVORITES: 'ww_demo_favorites',
  STATS: 'ww_demo_stats',
  ACHIEVEMENTS: 'ww_demo_achievements',
  ANSWERS: 'ww_demo_answers'
};

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

function toggleFavorite(eventId) {
  const favorites = getFavorites();
  const index = favorites.indexOf(eventId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.push(eventId);
  }
  saveFavorites(favorites);
  return index < 0;
}

function isFavorite(eventId) {
  return getFavorites().includes(eventId);
}

function getStats() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS));
    if (!stored) {
      return {
        daily: [],
        totals: {
          total_games: 0,
          avg_distance: 0,
          avg_time_diff: 0,
          avg_elapsed: 0,
          total_distance: 0,
          total_time_diff: 0,
          total_elapsed: 0,
          total_precise_location: 0,
          total_precise_time: 0,
          avg_precise_location: 0,
          avg_precise_time: 0
        }
      };
    }
    // 确保数据结构完整
    return {
      daily: stored.daily || [],
      totals: {
        total_games: stored.totals?.total_games || 0,
        avg_distance: stored.totals?.avg_distance || 0,
        avg_time_diff: stored.totals?.avg_time_diff || 0,
        avg_elapsed: stored.totals?.avg_elapsed || 0,
        total_distance: stored.totals?.total_distance || 0,
        total_time_diff: stored.totals?.total_time_diff || 0,
        total_elapsed: stored.totals?.total_elapsed || 0,
        total_precise_location: stored.totals?.total_precise_location || 0,
        total_precise_time: stored.totals?.total_precise_time || 0,
        avg_precise_location: stored.totals?.avg_precise_location || 0,
        avg_precise_time: stored.totals?.avg_precise_time || 0
      }
    };
  } catch {
    return {
      daily: [],
      totals: {
        total_games: 0,
        avg_distance: 0,
        avg_time_diff: 0,
        avg_elapsed: 0,
        total_distance: 0,
        total_time_diff: 0,
        total_elapsed: 0,
        total_precise_location: 0,
        total_precise_time: 0,
        avg_precise_location: 0,
        avg_precise_time: 0
      }
    };
  }
}

function updateStats(result, elapsedSeconds) {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];

  let dayStats = stats.daily.find(d => d.stat_date === today);
  if (!dayStats) {
    dayStats = {
      stat_date: today,
      games_played: 0,
      total_distance: 0,
      total_time_diff: 0,
      total_elapsed: 0,
      precise_location_count: 0,
      precise_time_count: 0
    };
    stats.daily.unshift(dayStats);
  }

  dayStats.games_played++;
  if (result.distance_km !== null) {
    dayStats.total_distance += result.distance_km;
  }
  if (result.time_diff_years !== null) {
    dayStats.total_time_diff += Math.abs(result.time_diff_years);
  }
  dayStats.total_elapsed += elapsedSeconds;
  if (result.precise_location) {
    dayStats.precise_location_count++;
  }
  if (result.precise_time) {
    dayStats.precise_time_count++;
  }

  const totals = stats.totals;
  totals.total_games++;
  if (result.distance_km !== null) {
    totals.total_distance += result.distance_km;
    totals.avg_distance = Math.round((totals.total_distance / totals.total_games) * 10) / 10;
  }
  if (result.time_diff_years !== null) {
    totals.total_time_diff += Math.abs(result.time_diff_years);
    totals.avg_time_diff = Math.round((totals.total_time_diff / totals.total_games) * 10) / 10;
  }
  totals.total_elapsed += elapsedSeconds;
  totals.avg_elapsed = Math.round((totals.total_elapsed / totals.total_games) * 10) / 10;
  if (result.precise_location) {
    totals.total_precise_location++;
    totals.avg_precise_location = Math.round((totals.total_precise_location / totals.total_games) * 1000) / 10;
  }
  if (result.precise_time) {
    totals.total_precise_time++;
    totals.avg_precise_time = Math.round((totals.total_precise_time / totals.total_games) * 1000) / 10;
  }

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  return stats;
}

function getAchievements() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)) || {};
  } catch {
    return {};
  }
}

function unlockAchievement(achievementId) {
  const achievements = getAchievements();
  if (!achievements[achievementId]) {
    achievements[achievementId] = { unlockedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    return true;
  }
  return false;
}

function hasAchievement(achievementId) {
  return !!getAchievements()[achievementId];
}

function saveAnswer(eventId, answer) {
  const answers = getEventAnswers(eventId);
  answers.push({
    ...answer,
    created_at: new Date().toISOString()
  });
  localStorage.setItem(`${STORAGE_KEYS.ANSWERS}_${eventId}`, JSON.stringify(answers));
}

function getEventAnswers(eventId) {
  try {
    return JSON.parse(localStorage.getItem(`${STORAGE_KEYS.ANSWERS}_${eventId}`)) || [];
  } catch {
    return [];
  }
}

function getEventAnswerStats(eventId) {
  const answers = getEventAnswers(eventId);
  const validAnswers = answers.filter(a => a.guess_lat != null && a.guess_lng != null);
  
  const totalAnswers = validAnswers.length;
  let totalDistance = 0;
  let totalTimeDiff = 0;
  let totalElapsed = 0;
  let totalPreciseLocation = 0;
  let totalPreciseTime = 0;

  validAnswers.forEach(a => {
    if (a.distance_km != null) totalDistance += a.distance_km;
    if (a.time_diff_years != null) totalTimeDiff += Math.abs(a.time_diff_years);
    if (a.elapsed_seconds != null) totalElapsed += a.elapsed_seconds;
    if (a.precise_location) totalPreciseLocation++;
    if (a.precise_time) totalPreciseTime++;
  });

  return {
    total_answers: totalAnswers,
    avg_distance: totalAnswers > 0 ? Math.round((totalDistance / totalAnswers) * 10) / 10 : null,
    avg_time_diff: totalAnswers > 0 ? Math.round((totalTimeDiff / totalAnswers) * 10) / 10 : null,
    avg_elapsed: totalAnswers > 0 ? Math.round((totalElapsed / totalAnswers) * 10) / 10 : null,
    total_precise_location: totalPreciseLocation,
    total_precise_time: totalPreciseTime
  };
}
