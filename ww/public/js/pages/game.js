function renderGamePage() {
  appState.currentView = 'game';
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

  appState.mapConfig = { tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds, tileSize };

  addTileLayersToMap(appState.map, tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds, tileSize);

  appState.admin1Labels = [];
  if (crsType !== 'simple') {
    loadGameMapLabels();
  }

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
      const src = img.src;
      openImageViewer(src);
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
      <div class="video-thumbnail" onclick="openVideoPlayer('${escapeHtml(videoUrl)}')">
        <div class="video-play-icon">▶</div>
        <div class="video-url-text">${escapeHtml(videoUrl)}</div>
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
        <audio controls class="audio-player" src="${escapeHtml(audioUrl)}"></audio>
      `;
    } else {
      audioContent = `
        <div class="media-label">🎵 音频</div>
        <div class="audio-link" onclick="window.open('${escapeHtml(audioUrl)}', '_blank')">
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

  document.getElementById('failed-view-answer').addEventListener('click', async () => {
    overlay.remove();
    const res = await API.post('/game/submit', {
      user_id: appState.user.id,
      event_id: appState.currentEvent.id,
      guess_lat: null,
      guess_lng: null,
      guess_year: null,
      guess_month: null,
      guess_day: null,
      elapsed_seconds: elapsedSeconds,
      timed_out: true
    });
    if (res.success) {
      cleanupGame();
      renderResultPage(res.data, elapsedSeconds, true);
    }
  });

  document.getElementById('failed-restart').addEventListener('click', () => {
    overlay.remove();
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
