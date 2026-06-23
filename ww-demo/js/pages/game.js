function renderGamePage() {
  appState.currentPage = 'game';
  const app = document.getElementById('app');

  let mapCenter = [30, 120];
  let mapZoom = 2;
  let minZoom = 2;
  let maxZoom = 8;
  let tileType = 'hybrid';
  let tileUrl = '';
  let tileSd = '';
  let crsType = 'epsg3857';
  let bounds = null;
  let tileSize = 256;

  const selectedSubs = appState.currentSubConfigs || [];
  const firstSelectedCode = appState.selectedSubCodes[0];
  const subConfig = selectedSubs.find(s => s.code === firstSelectedCode);

  if (subConfig) {
    if (subConfig.map_tile_size) tileSize = parseInt(subConfig.map_tile_size);
    if (subConfig.center_lat != null && subConfig.center_lng != null) {
      mapCenter = [parseFloat(subConfig.center_lat), parseFloat(subConfig.center_lng)];
    }
    if (subConfig.default_zoom != null) mapZoom = parseInt(subConfig.default_zoom);
    if (subConfig.min_zoom != null) minZoom = parseInt(subConfig.min_zoom);
    if (subConfig.max_zoom != null) maxZoom = parseInt(subConfig.max_zoom);
    if (subConfig.map_min_zoom != null) minZoom = Math.max(minZoom, parseInt(subConfig.map_min_zoom));
    if (subConfig.map_max_zoom != null) maxZoom = Math.min(maxZoom, parseInt(subConfig.map_max_zoom));
    tileType = subConfig.map_tile_type || 'hybrid';
    tileUrl = subConfig.map_tile_url || '';
    tileSd = subConfig.map_tile_subdomains || 'a,b,c';
    if (subConfig.map_crs_type) crsType = subConfig.map_crs_type;
    if (subConfig.map_bounds_south != null && subConfig.map_bounds_west != null && subConfig.map_bounds_north != null && subConfig.map_bounds_east != null) {
      bounds = [[parseFloat(subConfig.map_bounds_south), parseFloat(subConfig.map_bounds_west)], [parseFloat(subConfig.map_bounds_north), parseFloat(subConfig.map_bounds_east)]];
    }
  }

  if (crsType === 'simple' && bounds) {
    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
    mapCenter = [centerLat, centerLng];
    mapZoom = minZoom;
  }

  app.innerHTML = `
    <div class="game-page">
      <div class="game-map">
        <div id="map"></div>
      </div>
      <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" title="收起侧栏">›</button>
      <div class="game-sidebar" id="game-sidebar">
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-bar-fill" style="width:100%"></div></div>
        <div class="timer-text" id="timer-text">30</div>
        <div class="image-area" id="image-area"></div>
        <div class="video-area" id="video-area" style="display:none;"></div>
        <div class="audio-area" id="audio-area" style="display:none;"></div>
        <div class="tips-area" id="tips-area" style="display:none;"></div>
        <div class="game-actions">
          <button class="btn btn-warning" id="give-up-btn">放弃</button>
          <button class="btn btn-default" id="restart-game-btn">再来一局</button>
        </div>
      </div>
    </div>
  `;

  const mapOptions = {
    center: mapCenter,
    zoom: mapZoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    zoomControl: true,
    worldCopyJump: crsType !== 'simple',
    preferCanvas: crsType === 'simple'
  };
  if (crsType === 'simple') {
    mapOptions.crs = L.CRS.Simple;
    mapOptions.zoomSnap = 0;
  }

  appState.map = L.map('map', mapOptions);

  addTileLayersToMap(appState.map, tileType, tileUrl.replace(/^\//, './'), tileSd, minZoom, maxZoom, crsType, bounds, tileSize);

  appState.map.on('click', onGameMapClick);

  renderCurrentImages();
  renderVideo();
  renderAudio();
  renderTips();
  startTimer();

  document.getElementById('give-up-btn').addEventListener('click', () => {
    cleanupGame();
    renderMainPage();
  });

  document.getElementById('restart-game-btn').addEventListener('click', () => {
    cleanupGame();
    startGame();
  });

  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebar = document.getElementById('game-sidebar');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    if (sidebar.classList.contains('hidden')) {
      toggleBtn.textContent = '‹';
      toggleBtn.title = '展开侧栏';
      toggleBtn.classList.add('collapsed');
    } else {
      toggleBtn.textContent = '›';
      toggleBtn.title = '收起侧栏';
      toggleBtn.classList.remove('collapsed');
    }
    setTimeout(() => appState.map.invalidateSize(), 350);
  });
}

function renderCurrentImages() {
  const area = document.getElementById('image-area');
  if (!area) return;

  const images = appState.shownImageIndices.map(i => appState.currentImages[i]).filter(Boolean);
  if (images.length === 0) {
    if (appState.currentEvent && appState.currentEvent.description) {
      area.innerHTML = `<div style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.8;text-align:center;padding:20px;">${appState.currentEvent.description}</div>`;
    } else {
      area.innerHTML = '<div class="no-image">加载中...</div>';
    }
    return;
  }

  area.innerHTML = images.map((img, idx) =>
    `<img src="${img.url}" alt="猜图" class="game-image" data-index="${idx}" style="cursor:zoom-in;">`
  ).join('');

  area.querySelectorAll('.game-image').forEach(img => {
    img.addEventListener('click', () => {
      openImageViewer(img.src);
    });
  });
}

function renderTips() {
  const tipsArea = document.getElementById('tips-area');
  if (!tipsArea || !appState.currentEvent) return;

  const tips = appState.currentEvent.tips;
  if (tips && tips.trim()) {
    tipsArea.style.display = 'block';
    tipsArea.innerHTML = `
      <div class="tips-label">💡 小贴士</div>
      <div class="tips-content">${tips}</div>
    `;
  } else {
    tipsArea.style.display = 'none';
  }
}

function renderVideo() {
  const videoArea = document.getElementById('video-area');
  if (!videoArea || !appState.currentEvent) return;

  const videoUrl = appState.currentEvent.video_url;
  if (videoUrl && videoUrl.trim()) {
    videoArea.style.display = 'block';
    videoArea.innerHTML = `
      <div class="media-label">▶️ 视频</div>
      <div class="video-thumbnail" onclick="openVideoPlayer('${videoUrl}')">
        <div class="video-play-icon">▶</div>
        <div class="video-url-text">${videoUrl}</div>
      </div>
    `;
  } else {
    videoArea.style.display = 'none';
  }
}

function renderAudio() {
  const audioArea = document.getElementById('audio-area');
  if (!audioArea || !appState.currentEvent) return;

  const audioUrl = appState.currentEvent.audio_url;
  if (audioUrl && audioUrl.trim()) {
    audioArea.style.display = 'block';
    const isMp3 = /\.mp3(\?.*)?$/i.test(audioUrl);
    let audioContent = '';
    if (isMp3) {
      audioContent = `
        <div class="media-label">🎵 音频</div>
        <audio controls class="audio-player" src="${audioUrl}"></audio>
      `;
    } else {
      audioContent = `
        <div class="media-label">🎵 音频</div>
        <div class="audio-link" onclick="window.open('${audioUrl}', '_blank')">
          <span class="audio-link-icon">🔗</span>
          <span class="audio-link-text">在新窗口打开</span>
        </div>
      `;
    }
    audioArea.innerHTML = audioContent;
  } else {
    audioArea.style.display = 'none';
  }
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

function onTimeUp() {
  const elapsedSeconds = 30;
  appState.guessLat = null;
  appState.guessLng = null;
  appState.guessYear = null;
  appState.timedOut = true;
  renderFailedPage(elapsedSeconds);
}

function renderFailedPage(elapsedSeconds) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'failed-overlay';
  overlay.innerHTML = `
    <div class="modal-content result-modal">
      <div style="text-align:center;">
        <div class="result-failed-icon">⏰</div>
        <h2 class="result-title">时间到！本轮竞猜失败</h2>
        <p class="result-subtitle">别灰心，再来一局试试吧</p>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary" id="failed-view-answer">查看答案</button>
        <button class="btn btn-default" id="failed-restart">再来一局</button>
        <button class="btn btn-secondary" id="failed-home">返回主页</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('failed-view-answer').addEventListener('click', () => {
    overlay.remove();
    const result = calculateResult(null, null, null, elapsedSeconds);
    cleanupGame();
    renderResultPage(result, elapsedSeconds, true);
  });

  document.getElementById('failed-restart').addEventListener('click', () => {
    overlay.remove();
    cleanupGame();
    startGame();
  });

  document.getElementById('failed-home').addEventListener('click', () => {
    overlay.remove();
    cleanupGame();
    renderMainPage();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function onGameMapClick(e) {
  const { lat, lng } = e.latlng;
  appState.guessLat = lat;
  appState.guessLng = lng;

  if (appState.mapClickMarker) {
    appState.mapClickMarker.setLatLng([lat, lng]);
  } else {
    appState.mapClickMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'guess-marker',
        html: '<div style="width:20px;height:20px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(appState.map);
  }

  if (appState.currentEvent && appState.currentEvent.location_only) {
    showLocationConfirm();
  } else {
    showTimePicker();
  }
}

function showLocationConfirm() {
  if (document.getElementById('location-confirm-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'time-picker-overlay';
  overlay.id = 'location-confirm-overlay';
  overlay.innerHTML = `
    <div class="time-picker-panel">
      <div class="time-picker-title">确认位置</div>
      <div style="padding:20px;text-align:center;color:rgba(255,255,255,0.85);">
        已选择位置，确定提交吗？
      </div>
      <div class="time-picker-actions">
        <button class="btn btn-secondary" id="lc-cancel">取消</button>
        <button class="btn btn-primary" id="lc-confirm">确定提交</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('lc-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('lc-confirm').addEventListener('click', () => {
    overlay.remove();
    submitGuess();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function showTimePicker() {
  if (document.getElementById('time-picker-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'time-picker-overlay';
  overlay.id = 'time-picker-overlay';
  overlay.innerHTML = `
    <div class="time-picker-panel">
      <div class="time-picker-title">选择时间</div>
      <div class="precision-row">
        <button class="precision-btn active" data-precision="0">仅年</button>
        <button class="precision-btn" data-precision="1">年月</button>
        <button class="precision-btn" data-precision="2">年月日</button>
      </div>
      <div class="time-picker-row">
        <div class="form-group">
          <label class="form-label">年</label>
          <input type="number" class="form-control" id="tp-year" placeholder="如：1949">
        </div>
        <div class="form-group" id="tp-month-group" style="display:none;">
          <label class="form-label">月</label>
          <input type="number" class="form-control" id="tp-month" placeholder="1-12" min="1" max="12">
        </div>
        <div class="form-group" id="tp-day-group" style="display:none;">
          <label class="form-label">日</label>
          <input type="number" class="form-control" id="tp-day" placeholder="1-31" min="1" max="31">
        </div>
      </div>
      <div class="time-picker-actions">
        <button class="btn btn-secondary" id="tp-cancel">取消</button>
        <button class="btn btn-primary" id="tp-confirm">确定</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let precision = 0;
  overlay.querySelectorAll('.precision-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.precision-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      precision = parseInt(btn.dataset.precision);
      document.getElementById('tp-month-group').style.display = precision >= 1 ? '' : 'none';
      document.getElementById('tp-day-group').style.display = precision >= 2 ? '' : 'none';
    });
  });

  document.getElementById('tp-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('tp-confirm').addEventListener('click', () => {
    const year = parseInt(document.getElementById('tp-year').value);
    if (!year || isNaN(year)) { alert('请输入年份'); return; }

    appState.guessYear = year;
    appState.guessMonth = precision >= 1 ? (parseInt(document.getElementById('tp-month').value) || null) : null;
    appState.guessDay = precision >= 2 ? (parseInt(document.getElementById('tp-day').value) || null) : null;

    overlay.remove();
    submitGuess();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('tp-year').focus();
}

function submitGuess() {
  cleanupGame();

  const elapsedSeconds = (Date.now() - appState.gameStartTime) / 1000;
  const result = calculateResult(appState.guessLat, appState.guessLng, appState.guessYear, elapsedSeconds);
  
  saveAnswer(appState.currentEvent.id, {
    user_id: 'demo_user',
    username: '我',
    event_id: appState.currentEvent.id,
    guess_lat: appState.guessLat,
    guess_lng: appState.guessLng,
    guess_year: appState.guessYear,
    guess_month: appState.guessMonth,
    guess_day: appState.guessDay,
    distance_km: result.distance_km,
    time_diff_years: result.time_diff_years,
    precise_location: result.precise_location,
    precise_time: result.precise_time,
    timed_out: false,
    elapsed_seconds: elapsedSeconds
  });

  renderResultPage(result, elapsedSeconds, false);
}

function cleanupGame() {
  if (appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
  }
  if (appState.map) {
    appState.map.remove();
    appState.map = null;
  }
  appState.mapClickMarker = null;
  appState.timedOut = false;
}
