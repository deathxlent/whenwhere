function renderResultPage(result, elapsedSeconds, isTimedOut) {
  appState.currentPage = 'result';

  const shownImages = appState.shownImageIndices.map(i => appState.currentImages[i]).filter(Boolean);
  const isPreciseLocation = result.precise_location === true;
  const isPreciseTime = result.precise_time === true;
  const isLocationOnly = result.location_only === true;

  const timeDiffSigned = result.time_diff_years;
  const timeColorClass = timeDiffSigned === null ? 'wrong' : (timeDiffSigned === 0 ? 'correct' : (timeDiffSigned > 0 ? 'time-positive' : 'time-negative'));
  const distanceColor = result.distance_km === null ? 'wrong' : (result.distance_km <= 500 ? 'correct' : 'wrong');
  const distanceText = result.distance_km === null ? '未作答' : `${Math.round(result.distance_km)} km`;
  const timeDiffAbs = timeDiffSigned === null ? null : Math.abs(timeDiffSigned);
  const timeDiffText = timeDiffSigned === null ? '未作答' : (timeDiffSigned === 0 ? '完全正确！' : `${timeDiffSigned > 0 ? '+' : ''}${timeDiffSigned} 年`);

  const titleText = isTimedOut ? '时间到！结果揭晓' : '结果揭晓';
  const eventId = appState.currentEvent ? appState.currentEvent.id : null;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="result-page-with-map">
      <div class="result-map-layer" id="result-map-layer">
        <div id="result-map"></div>
      </div>
      <div class="result-overlay" id="result-overlay">
        <div class="result-overlay-content">
          <div class="result-title">${titleText}</div>
          ${(isPreciseLocation || isPreciseTime ? `
            <div class="precise-banner">
              ${isPreciseLocation ? '<span class="precise-badge precise-location">🎯 精准位置猜中！</span>' : ''}
              ${isPreciseTime ? '<span class="precise-badge precise-time">⏱️ 精准时间猜中！</span>' : ''}
            </div>
          ` : '')}
          <div class="result-card">
            <h3>正确答案</h3>
            <div class="result-info">
              <div>
                <span class="label">事件：</span>
                <span class="value event-title-row">
                  <span class="event-title-text">${result.correct_title}</span>
                  <button class="icon-btn search-event-btn" title="用 Bing 搜索此事件" id="search-event-btn">🔍</button>
                </span>
              </div>
              ${result.correct_description ? `<div><span class="label">说明：</span><span class="value">${result.correct_description}</span></div>` : ''}
              ${result.correct_tips ? `<div><span class="label">小贴士：</span><span class="value">${result.correct_tips}</span></div>` : ''}
              ${result.correct_video_url ? `
                <div class="result-media-item">
                  <span class="label">视频：</span>
                  <div class="result-video-thumbnail" onclick="openVideoPlayer('${escapeHtml(result.correct_video_url)}')">
                    <span class="video-play-icon-small">▶</span>
                    <span class="result-video-url">${escapeHtml(result.correct_video_url)}</span>
                  </div>
                </div>
              ` : ''}
              ${result.correct_audio_url ? `
                <div class="result-media-item">
                  <span class="label">音频：</span>
                  ${(/\.mp3(\?.*)?$/i.test(result.correct_audio_url) ? `
                    <audio controls class="result-audio-player" src="${escapeHtml(result.correct_audio_url)}"></audio>
                  ` : `
                    <div class="result-audio-link" onclick="window.open('${escapeHtml(result.correct_audio_url)}', '_blank')">
                      🔗 在新窗口打开
                    </div>
                  `)}
                </div>
              ` : ''}
              ${!isLocationOnly ? `<div><span class="label">时间：</span><span class="value">${result.correct_start_display}${result.correct_end_display && result.correct_end_display !== result.correct_start_display ? ' ~ ' + result.correct_end_display : ''}</span></div>` : ''}
              <div><span class="label">地点：</span><span class="value">${result.correct_location_name || '未知'}</span></div>
            </div>
            <div class="event-actions-row" id="event-actions-row">
              <button class="vote-btn vote-up-btn" id="vote-up-btn" title="点赞">
                <span class="vote-icon">👍</span>
                <span class="vote-count" id="vote-up-count">0</span>
              </button>
              <button class="vote-btn vote-down-btn" id="vote-down-btn" title="踩">
                <span class="vote-icon">👎</span>
                <span class="vote-count" id="vote-down-count">0</span>
              </button>
              <button class="vote-btn favorite-btn" id="favorite-btn" title="收藏">
                <span class="vote-icon" id="favorite-icon">☆</span>
                <span class="vote-count">收藏</span>
              </button>
            </div>
          </div>
          <div class="result-card">
            <h3>得分</h3>
            <div class="result-score">
              <div class="score-item">
                <div class="score-value ${distanceColor}">${distanceText}</div>
                <div class="score-label">距离</div>
                ${isPreciseLocation ? '<div class="precise-tag">精准</div>' : ''}
              </div>
              ${!isLocationOnly ? `
              <div class="score-item">
                <div class="score-value ${timeColorClass}">${timeDiffText}</div>
                <div class="score-label">时间偏差</div>
                ${isPreciseTime ? '<div class="precise-tag">精准</div>' : ''}
              </div>
              ` : ''}
              <div class="score-item">
                <div class="score-value">${Math.round(elapsedSeconds)}</div>
                <div class="score-label">耗时（秒）</div>
              </div>
            </div>
          </div>
          <div class="result-actions">
            <button class="btn btn-success" id="play-again-btn">再来一局</button>
            <button class="btn btn-secondary" id="back-main-btn">返回主界面</button>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initResultMap(result);
  }, 50);

  updateStats(result, elapsedSeconds);

  document.getElementById('play-again-btn').addEventListener('click', () => {
    cleanupGame();
    startGame();
  });
  document.getElementById('back-main-btn').addEventListener('click', () => {
    cleanupGame();
    renderMainPage();
  });

  document.getElementById('search-event-btn').addEventListener('click', () => {
    const query = encodeURIComponent(result.correct_title);
    window.open(`https://www.bing.com/search?q=${query}`, '_blank');
  });

  if (eventId) {
    loadEventVotesAndFavorite(eventId);
    initVoteAndFavoriteHandlers(eventId);
  }
}

function getVoteStorage() {
  try {
    return JSON.parse(localStorage.getItem('ww_votes') || '{}');
  } catch {
    return {};
  }
}

function setVoteStorage(data) {
  localStorage.setItem('ww_votes', JSON.stringify(data));
}

function getFavoriteStorage() {
  return getFavorites();
}

function setFavoriteStorage(favorites) {
  saveFavorites(favorites);
}

function loadEventVotesAndFavorite(eventId) {
  const votes = getVoteStorage();
  const favorites = getFavoriteStorage();

  const eventVotes = votes[eventId] || { up: 0, down: 0 };
  const isFavorite = favorites.includes(eventId);

  document.getElementById('vote-up-count').textContent = eventVotes.up;
  document.getElementById('vote-down-count').textContent = eventVotes.down;
  updateVoteButtons(null);
  updateFavoriteButton(isFavorite);
}

function updateVoteButtons(myVote) {
  const upBtn = document.getElementById('vote-up-btn');
  const downBtn = document.getElementById('vote-down-btn');
  if (!upBtn || !downBtn) return;

  upBtn.classList.remove('active');
  downBtn.classList.remove('active');
  if (myVote === 1) upBtn.classList.add('active');
  if (myVote === -1) downBtn.classList.add('active');
}

function updateFavoriteButton(isFavorite) {
  const icon = document.getElementById('favorite-icon');
  const btn = document.getElementById('favorite-btn');
  if (!icon || !btn) return;

  if (isFavorite) {
    icon.textContent = '★';
    btn.classList.add('active');
  } else {
    icon.textContent = '☆';
    btn.classList.remove('active');
  }
}

function initVoteAndFavoriteHandlers(eventId) {
  const votes = getVoteStorage();
  const eventVotes = votes[eventId] || { up: 0, down: 0 };
  const myVote = eventVotes.myVote || 0;

  document.getElementById('vote-up-btn').addEventListener('click', () => {
    const votes = getVoteStorage();
    const eventVotes = votes[eventId] || { up: 0, down: 0, myVote: 0 };

    if (eventVotes.myVote === 1) {
      eventVotes.up = Math.max(0, eventVotes.up - 1);
      eventVotes.myVote = 0;
    } else {
      if (eventVotes.myVote === -1) eventVotes.down = Math.max(0, eventVotes.down - 1);
      eventVotes.up++;
      eventVotes.myVote = 1;
    }

    votes[eventId] = eventVotes;
    setVoteStorage(votes);

    document.getElementById('vote-up-count').textContent = eventVotes.up;
    document.getElementById('vote-down-count').textContent = eventVotes.down;
    updateVoteButtons(eventVotes.myVote);
  });

  document.getElementById('vote-down-btn').addEventListener('click', () => {
    const votes = getVoteStorage();
    const eventVotes = votes[eventId] || { up: 0, down: 0, myVote: 0 };

    if (eventVotes.myVote === -1) {
      eventVotes.down = Math.max(0, eventVotes.down - 1);
      eventVotes.myVote = 0;
    } else {
      if (eventVotes.myVote === 1) eventVotes.up = Math.max(0, eventVotes.up - 1);
      eventVotes.down++;
      eventVotes.myVote = -1;
    }

    votes[eventId] = eventVotes;
    setVoteStorage(votes);

    document.getElementById('vote-up-count').textContent = eventVotes.up;
    document.getElementById('vote-down-count').textContent = eventVotes.down;
    updateVoteButtons(eventVotes.myVote);
  });

  document.getElementById('favorite-btn').addEventListener('click', () => {
    const favorites = getFavoriteStorage();
    const index = favorites.indexOf(eventId);
    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(eventId);
    }
    setFavoriteStorage(favorites);
    updateFavoriteButton(favorites.includes(eventId));
  });
}

function initResultMap(result) {
  const subCategory = appState.currentSubCategory;
  const tileType = subCategory.map_tile_type || 'hybrid';
  const customUrl = subCategory.map_tile_url ? subCategory.map_tile_url.replace(/^\//, './') : '';
  const customSd = subCategory.map_tile_subdomains || 'a,b,c';
  const minZoom = subCategory.map_min_zoom || 2;
  const maxZoom = subCategory.map_max_zoom || 8;
  const crsType = subCategory.map_crs_type || 'epsg3857';
  const tileSize = subCategory.map_tile_size || 256;

  let bounds = null;
  if (subCategory.map_bounds_south != null) {
    bounds = [
      [subCategory.map_bounds_south, subCategory.map_bounds_west],
      [subCategory.map_bounds_north, subCategory.map_bounds_east]
    ];
  }

  let centerLat = subCategory.center_lat || 35;
  let centerLng = subCategory.center_lng || 105;
  let defaultZoom = subCategory.default_zoom || 4;

  const mapOptions = {
    center: [centerLat, centerLng],
    zoom: defaultZoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    zoomControl: true,
    attributionControl: true
  };

  if (crsType === 'simple') {
    mapOptions.crs = L.CRS.Simple;
    mapOptions.zoomSnap = 0;
    if (bounds) {
      mapOptions.center = [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2
      ];
    }
  }

  const resultMap = L.map('result-map', mapOptions);

  addTileLayersToMap(resultMap, tileType, customUrl, customSd, minZoom, maxZoom, crsType, bounds, tileSize);

  const correctLat = result.correct_lat;
  const correctLng = result.correct_lng;
  const guessLat = result.guess_lat;
  const guessLng = result.guess_lng;

  if (correctLat != null && correctLng != null) {
    L.marker([correctLat, correctLng], {
      icon: L.divIcon({
        className: 'correct-pin',
        html: '<div class="pin-inner">✓</div>',
        iconSize: [36, 48],
        iconAnchor: [18, 48]
      })
    }).addTo(resultMap);
  }

  if (guessLat != null && guessLng != null) {
    L.marker([guessLat, guessLng], {
      icon: L.divIcon({
        className: 'guess-pin',
        html: '<div class="pin-inner">✗</div>',
        iconSize: [36, 48],
        iconAnchor: [18, 48]
      })
    }).addTo(resultMap);

    if (correctLat != null && correctLng != null) {
      L.polyline(
        [[guessLat, guessLng], [correctLat, correctLng]],
        { color: '#FF9800', weight: 3, dashArray: '10, 10' }
      ).addTo(resultMap);
    }
  }

  if (guessLat != null && guessLng != null && correctLat != null && correctLng != null) {
    resultMap.fitBounds(L.latLngBounds([[guessLat, guessLng], [correctLat, correctLng]]).pad(0.2));
  }

  setTimeout(() => resultMap.invalidateSize(), 100);
}
