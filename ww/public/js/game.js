function cleanupGame() {
  if (appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
  }
  if (appState.map) {
    appState.map.remove();
    appState.map = null;
  }
  if (appState.bgMap) {
    appState.bgMap.remove();
    appState.bgMap = null;
  }
  if (appState.answersMap) {
    appState.answersMap.remove();
    appState.answersMap = null;
  }
  appState.mapClickMarker = null;
  appState.admin1Labels = [];
  appState.provinceLayer = null;
  appState.timedOut = false;
}

async function startGame() {
  cleanupGame();

  const subCodes = appState.selectedSubCodes.join(',');
  const res = await API.get(`/game/random-event?sub_codes=${subCodes}`);

  if (!res.success) {
    alert(res.message);
    return;
  }

  appState.currentEvent = res.data;
  appState.currentImages = res.data.images || [];
  appState.shownImageIndices = [];
  appState.guessLat = null;
  appState.guessLng = null;
  appState.guessYear = null;
  appState.guessMonth = null;
  appState.guessDay = null;
  appState.imagesHidden = false;
  appState.spacePressed = false;

  if (appState.currentImages.length > 0) {
    const firstIdx = Math.floor(Math.random() * appState.currentImages.length);
    appState.shownImageIndices.push(firstIdx);
  }

  appState.startTime = Date.now();
  renderGamePage();
}

function startTimer() {
  appState.timerSeconds = 30;
  const timerText = document.getElementById('timer-text');
  const timerBarFill = document.getElementById('timer-bar-fill');

  if (appState.timerInterval) clearInterval(appState.timerInterval);

  appState.timerInterval = setInterval(() => {
    appState.timerSeconds--;
    if (timerText) timerText.textContent = appState.timerSeconds;
    if (timerBarFill) {
      const pct = (appState.timerSeconds / 30) * 100;
      timerBarFill.style.width = pct + '%';
      if (appState.timerSeconds <= 10) {
        timerBarFill.classList.add('warning');
        if (timerText) timerText.classList.add('warning');
      }
    }

    if (appState.timerSeconds === 20 && appState.currentImages.length > 1) {
      addNextImage();
    }
    if (appState.timerSeconds === 10 && appState.currentImages.length > 2) {
      addNextImage();
    }

    if (appState.timerSeconds <= 0) {
      clearInterval(appState.timerInterval);
      appState.timerInterval = null;
      onTimeUp();
    }
  }, 1000);
}

function onTimeUp() {
  const elapsedSeconds = 30;
  appState.guessLat = null;
  appState.guessLng = null;
  appState.guessYear = null;
  appState.guessMonth = null;
  appState.guessDay = null;
  appState.timedOut = true;
  renderFailedPage(elapsedSeconds);
}

function addNextImage() {
  const available = [];
  for (let i = 0; i < appState.currentImages.length; i++) {
    if (!appState.shownImageIndices.includes(i)) {
      available.push(i);
    }
  }
  if (available.length > 0) {
    const nextIdx = available[Math.floor(Math.random() * available.length)];
    appState.shownImageIndices.push(nextIdx);
    renderCurrentImages();
  }
}

async function submitGuess() {
  cleanupGame();

  const elapsedSeconds = (Date.now() - appState.startTime) / 1000;

  const res = await API.post('/game/submit', {
    user_id: appState.user.id,
    event_id: appState.currentEvent.id,
    guess_lat: appState.guessLat,
    guess_lng: appState.guessLng,
    guess_year: appState.guessYear,
    guess_month: appState.guessMonth,
    guess_day: appState.guessDay,
    elapsed_seconds: elapsedSeconds
  });

  if (!res.success) {
    alert(res.message);
    return;
  }

  renderResultPage(res.data, elapsedSeconds);
}

async function loadEventVotesAndFavorite(eventId) {
  try {
    const voteRes = await API.get(`/game/vote/${eventId}?user_id=${appState.user.id}`);
    if (voteRes.success) {
      document.getElementById('vote-up-count').textContent = voteRes.data.up_count;
      document.getElementById('vote-down-count').textContent = voteRes.data.down_count;
      updateVoteButtons(voteRes.data.my_vote);
    }
  } catch (e) {
    console.warn('加载投票状态失败:', e);
  }

  try {
    const favRes = await API.get(`/game/favorite/check/${eventId}?user_id=${appState.user.id}`);
    if (favRes.success) {
      updateFavoriteButton(favRes.data.is_favorite);
    }
  } catch (e) {
    console.warn('加载收藏状态失败:', e);
  }
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
  document.getElementById('vote-up-btn').addEventListener('click', async () => {
    const res = await API.post('/game/vote', {
      user_id: appState.user.id,
      event_id: eventId,
      vote_type: 1
    });
    if (res.success) {
      document.getElementById('vote-up-count').textContent = res.data.up_count;
      document.getElementById('vote-down-count').textContent = res.data.down_count;
      updateVoteButtons(res.data.my_vote);
    }
  });

  document.getElementById('vote-down-btn').addEventListener('click', async () => {
    const res = await API.post('/game/vote', {
      user_id: appState.user.id,
      event_id: eventId,
      vote_type: -1
    });
    if (res.success) {
      document.getElementById('vote-up-count').textContent = res.data.up_count;
      document.getElementById('vote-down-count').textContent = res.data.down_count;
      updateVoteButtons(res.data.my_vote);
    }
  });

  document.getElementById('favorite-btn').addEventListener('click', async () => {
    const res = await API.post('/game/favorite', {
      user_id: appState.user.id,
      event_id: eventId
    });
    if (res.success) {
      updateFavoriteButton(res.data.is_favorite);
    }
  });
}

async function loadFavorites(keyword) {
  const listEl = document.getElementById('favorites-list');
  if (!listEl) return;

  if (!appState.user || !appState.user.id) {
    listEl.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">请先登录</div>';
    return;
  }

  listEl.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">加载中...</div>';

  try {
    const res = await API.get(`/game/favorites/${appState.user.id}?keyword=${encodeURIComponent(keyword || '')}`);
    if (res.success && res.data && res.data.length > 0) {
      renderFavoritesList(res.data);
    } else {
      listEl.innerHTML = `<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.5);">${keyword ? '没有找到匹配的收藏事件' : '还没有收藏任何事件'}</div>`;
    }
  } catch (e) {
    listEl.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">加载失败</div>';
  }
}

function renderFavoritesList(items) {
  const listEl = document.getElementById('favorites-list');
  if (!listEl) return;

  listEl.innerHTML = items.map(item => `
    <div class="favorite-card" data-event-id="${item.id}">
      <div class="fav-main-info">
        <div class="fav-title-row">
          <h3 class="fav-title">${escapeHtml(item.title)}</h3>
          <button class="icon-btn search-event-btn" title="用 Bing 搜索" onclick="window.open('https://www.bing.com/search?q=${encodeURIComponent(item.title)}', '_blank')">🔍</button>
        </div>
        <div class="fav-meta">
          <span class="fav-category">[${escapeHtml(item.category_name)}${item.sub_category_name ? ' / ' + escapeHtml(item.sub_category_name) : ''}]</span>
          <span class="fav-time">${escapeHtml(item.start_display || '-')}${item.end_display && item.end_display !== item.start_display ? ' ~ ' + escapeHtml(item.end_display) : ''}</span>
          <span class="fav-location">📍 ${escapeHtml(item.location_name || '未知')}</span>
        </div>
        ${item.description ? `<div class="fav-description">${escapeHtml(item.description)}</div>` : ''}
      </div>
      <div class="fav-actions">
        <button class="btn btn-default fav-view-btn" data-event-id="${item.id}" title="查看大家怎么答">👥 查看答题</button>
        <button class="btn btn-danger fav-unfav-btn" data-event-id="${item.id}" title="取消收藏">★ 已收藏</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.fav-unfav-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const eventId = e.currentTarget.dataset.eventId;
      const res = await API.post('/game/favorite', {
        user_id: appState.user.id,
        event_id: eventId
      });
      if (res.success && !res.data.is_favorite) {
        const keyword = document.getElementById('fav-search-input').value.trim();
        loadFavorites(keyword);
      }
    });
  });

  listEl.querySelectorAll('.fav-view-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const eventId = e.currentTarget.dataset.eventId;
      renderAnswersPage(eventId);
    });
  });
}
