function renderLoginPage() {
  appState.currentView = 'login';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="login-box">
        <div class="login-title">何时何地</div>
        <div class="login-subtitle">图片猜猜看</div>
        <div id="login-form-area">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" class="form-control" id="login-username" placeholder="请输入用户名" maxlength="20" autocomplete="off">
          </div>
          <div id="token-input-area" style="display:none;">
            <div class="form-group">
              <label class="form-label">Token（该用户名已存在，请输入您的token）</label>
              <input type="text" class="form-control" id="login-token" placeholder="请输入32位token" autocomplete="off">
            </div>
          </div>
          <button class="btn btn-primary" id="login-btn">进入</button>
        </div>
      </div>
    </div>
  `;

  const usernameInput = document.getElementById('login-username');
  const loginBtn = document.getElementById('login-btn');

  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) { alert('请输入用户名'); return; }

    const tokenArea = document.getElementById('token-input-area');
    const tokenInput = document.getElementById('login-token');
    const token = tokenInput ? tokenInput.value.trim() : '';

    loginBtn.disabled = true;
    loginBtn.textContent = '处理中...';

    if (!token) {
      const res = await API.post('/auth/register', { username });
      if (res.success) {
        setCookie(COOKIE_NAME, res.data.encrypted, COOKIE_EXPIRY);
        showTokenDialog(res.data.token, res.data.username, res.data.id);
      } else if (res.needToken) {
        tokenArea.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
        if (tokenInput) tokenInput.focus();
      } else {
        alert(res.message);
        loginBtn.disabled = false;
        loginBtn.textContent = '进入';
      }
    } else {
      const res = await API.post('/auth/login', { username, token });
      if (res.success) {
        setCookie(COOKIE_NAME, res.data.encrypted, COOKIE_EXPIRY);
        appState.user = { id: res.data.id, username: res.data.username };
        renderMainPage();
      } else {
        alert(res.message);
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
      }
    }
  });
}

function showTokenDialog(token, username, userId) {
  const formArea = document.getElementById('login-form-area');
  formArea.innerHTML = `
    <div class="token-display">
      <div style="font-size:14px;color:rgba(255,255,255,0.6);">用户 <strong style="color:#fff;">${username}</strong> 的Token：</div>
      <div class="token-value" id="token-text">${token}</div>
      <button class="btn btn-secondary" style="width:100%;margin-top:8px;font-size:13px;" id="copy-token-btn">复制Token</button>
      <div class="token-warning">
        ⚠️ <strong>请务必妥善保存此Token！</strong><br>
        如果您更换浏览器或清除Cookie，需要使用此Token重新登录。<br>
        Token只显示一次，请立即复制保存！
      </div>
    </div>
    <button class="btn btn-primary" id="token-confirm-btn">我已保存，进入游戏</button>
  `;

  document.getElementById('copy-token-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(token).then(() => {
      document.getElementById('copy-token-btn').textContent = '已复制！';
    }).catch(() => {
      const el = document.getElementById('token-text');
      const range = document.createRange();
      range.selectNodeContents(el);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    });
  });

  appState._pendingUserId = userId;

  document.getElementById('token-confirm-btn').addEventListener('click', () => {
    appState.user = { id: appState._pendingUserId, username };
    delete appState._pendingUserId;
    renderMainPage();
  });
}

async function renderMainPage() {
  appState.currentView = 'main';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="main-page">
      <div class="bg-map" id="bg-map"></div>
      <div class="user-menu">
        <button class="user-menu-btn" id="user-menu-btn">${appState.user.username} ▾</button>
        <div class="user-menu-dropdown" id="user-menu-dropdown">
          <div class="user-menu-item" id="menu-favorites">⭐ 我的收藏</div>
          <div class="user-menu-item" id="menu-stats">📊 个人统计</div>
          <div class="user-menu-item" id="menu-logout">🚪 退出</div>
        </div>
      </div>
      <div class="main-content">
        <div class="main-prompt">请选择你要猜的内容</div>
        <div class="tabs-container" id="main-tabs"><div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">加载中...</div></div>
        <div id="tab-content"></div>
        <div class="leaderboard-section" id="leaderboard-section">
          <div class="leaderboard-header">
            <div class="leaderboard-title">🏆 排行榜</div>
            <div class="leaderboard-period-tabs" id="leaderboard-period-tabs">
              <button class="period-tab ${appState.leaderboardPeriod === 'all' ? 'active' : ''}" data-period="all">全部</button>
              <button class="period-tab ${appState.leaderboardPeriod === 'week' ? 'active' : ''}" data-period="week">本周</button>
              <button class="period-tab ${appState.leaderboardPeriod === 'month' ? 'active' : ''}" data-period="month">本月</button>
              <button class="period-tab ${appState.leaderboardPeriod === 'year' ? 'active' : ''}" data-period="year">本年</button>
            </div>
          </div>
          <div class="leaderboard-tabs" id="leaderboard-tabs">
            <button class="lb-tab active" data-type="by_games">玩最多局</button>
            <button class="lb-tab" data-type="by_avg_distance">距离最近</button>
            <button class="lb-tab" data-type="by_avg_time">时间最准</button>
            <button class="lb-tab" data-type="by_avg_elapsed">耗时最少</button>
            <button class="lb-tab" data-type="by_precise_location">精准位置</button>
            <button class="lb-tab" data-type="by_precise_time">精准时间</button>
          </div>
          <div class="leaderboard-list" id="leaderboard-list">加载中...</div>
        </div>
      </div>
    </div>
  `;

  initBgMap();
  initUserMenu();
  initLeaderboard();
  loadCategoriesAndInitTabs();
}

async function loadCategoriesAndInitTabs() {
  try {
    const res = await API.get('/categories');
    if (res.success) {
      appState.categories = res.data;
    }
  } catch (e) {
    console.warn('加载类别失败:', e);
    appState.categories = [];
  }
  initTabs();
}

async function initLeaderboard() {
  const periodTabs = document.getElementById('leaderboard-period-tabs');
  const typeTabs = document.getElementById('leaderboard-tabs');
  const listEl = document.getElementById('leaderboard-list');

  periodTabs.querySelectorAll('.period-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      periodTabs.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.leaderboardPeriod = btn.dataset.period;
      loadLeaderboard();
    });
  });

  typeTabs.querySelectorAll('.lb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      typeTabs.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState._leaderboardType = btn.dataset.type;
      renderLeaderboardList();
    });
  });

  appState._leaderboardType = 'by_games';
  await loadLeaderboard();
}

async function loadLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">加载中...</div>';

  const res = await API.get(`/game/leaderboard?period=${appState.leaderboardPeriod}`);
  if (res.success) {
    appState._leaderboardData = res.data;
    renderLeaderboardList();
  } else {
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">加载失败</div>';
  }
}

function renderLeaderboardList() {
  const listEl = document.getElementById('leaderboard-list');
  const type = appState._leaderboardType || 'by_games';
  const data = appState._leaderboardData || {};
  const list = data[type] || [];

  if (list.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.4);">暂无排行数据</div>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  listEl.innerHTML = list.map((item, idx) => `
    <div class="leaderboard-item">
      <div class="lb-rank">
        ${idx < 3 ? `<span class="lb-medal">${medals[idx]}</span>` : `<span>${idx + 1}</span>`}
      </div>
      <div class="lb-username">${escapeHtml(item.username)}</div>
      <div class="lb-value">${item.value}</div>
    </div>
  `).join('');
}

async function initTabs() {
  const categories = appState.categories || [];
  const tabsContainer = document.getElementById('main-tabs');

  if (categories.length === 0) {
    tabsContainer.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.5);">暂无可用类别</div>';
    document.getElementById('tab-content').innerHTML = '';
    return;
  }

  const firstAvailableId = categories[0].id;
  if (!appState.selectedTab || !categories.find(c => c.code === appState.selectedTab)) {
    appState.selectedTab = categories[0].code;
  }

  tabsContainer.innerHTML = categories.map(c =>
    `<button class="tab-btn ${c.code === appState.selectedTab ? 'active' : ''}" data-code="${c.code}" data-id="${c.id}">${escapeHtml(c.name)}</button>`
  ).join('');

  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.selectedTab = btn.dataset.code;
      renderTabContent(btn.dataset.id);
    });
  });

  const activeCat = categories.find(c => c.code === appState.selectedTab);
  renderTabContent(activeCat ? activeCat.id : firstAvailableId);
}

async function renderTabContent(categoryId) {
  const content = document.getElementById('tab-content');
  const category = appState.categories.find(c => c.id == categoryId);

  if (!category || (category.available_sub_count || 0) === 0) {
    content.innerHTML = '<div class="options-panel"><div class="construction-text">🏗️ 建设中，敬请期待...</div></div>';
    return;
  }

  let subCategories = appState.subCategoriesMap[categoryId];
  if (!subCategories) {
    content.innerHTML = '<div class="options-panel"><div style="color:rgba(255,255,255,0.6);padding:20px;text-align:center;">加载中...</div></div>';
    try {
      const res = await API.get(`/categories/${categoryId}/sub-categories`);
      if (res.success) {
        subCategories = res.data.filter(s => s.map_id != null && (s.event_count || 0) > 0);
        appState.subCategoriesMap[categoryId] = subCategories;
      }
    } catch (e) {
      subCategories = [];
    }
  }

  if (!subCategories || subCategories.length === 0) {
    content.innerHTML = '<div class="options-panel"><div class="construction-text">🏗️ 建设中，敬请期待...</div></div>';
    return;
  }

  appState.selectedSubCodes = [];
  appState.currentSubConfigs = subCategories;

  const checkboxesHtml = subCategories.map(s => `
    <div class="checkbox-item">
      <input type="checkbox" id="chk-${s.code}" checked>
      <label for="chk-${s.code}">${escapeHtml(s.name)} <span style="color:rgba(255,255,255,0.45);font-size:12px;">(${s.event_count}题)</span></label>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="options-panel">
      ${checkboxesHtml}
    </div>
    <button class="btn btn-primary" id="start-btn" style="min-width:200px;">开始</button>
  `;

  const checkboxes = content.querySelectorAll('input[type="checkbox"]');
  const startBtn = document.getElementById('start-btn');

  const updateStartBtn = () => {
    const codes = [];
    checkboxes.forEach(chk => {
      const code = chk.id.replace('chk-', '');
      if (chk.checked) codes.push(code);
    });
    appState.selectedSubCodes = codes;
    startBtn.disabled = codes.length === 0;
  };

  checkboxes.forEach(chk => chk.addEventListener('change', updateStartBtn));
  updateStartBtn();

  startBtn.addEventListener('click', () => {
    if (appState.selectedSubCodes.length === 0) return;
    startGame();
  });
}

function initUserMenu() {
  const btn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-menu-dropdown');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

  document.getElementById('menu-favorites').addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderFavoritesPage();
  });

  document.getElementById('menu-stats').addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderStatsPage();
  });

  document.getElementById('menu-logout').addEventListener('click', () => {
    dropdown.classList.remove('show');
    deleteCookie(COOKIE_NAME);
    cleanupGame();
    appState.user = null;
    renderLoginPage();
  });
}

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

function openImageViewer(src) {
  const existing = document.getElementById('image-viewer');
  if (existing) {
    existing.remove();
    return;
  }

  const viewer = document.createElement('div');
  viewer.id = 'image-viewer';
  viewer.className = 'image-viewer';
  viewer.innerHTML = `
    <div class="image-viewer-overlay"></div>
    <div class="image-viewer-container">
      <img src="${src}" class="image-viewer-img" alt="查看图片">
      <button class="image-viewer-close" onclick="document.getElementById('image-viewer').remove()">×</button>
    </div>
  `;
  document.body.appendChild(viewer);

  viewer.querySelector('.image-viewer-overlay').addEventListener('click', closeViewer);
  viewer.querySelector('.image-viewer-img').addEventListener('click', closeViewer);
}

function closeViewer() {
  const viewer = document.getElementById('image-viewer');
  if (viewer) viewer.remove();
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

function renderResultPage(result, elapsedSeconds, isTimedOut) {
  appState.currentView = 'result';

  const shownImages = appState.shownImageIndices.map(i => appState.currentImages[i]).filter(Boolean);
  const isPreciseLocation = result.precise_location === true;
  const isPreciseTime = result.precise_time === true;
  const distanceUnit = result.distance_unit || 'km';
  const isLocationOnly = result.location_only === true;

  const timeDiffSigned = result.time_diff_years;
  const timeColorClass = timeDiffSigned === null ? 'wrong' : (timeDiffSigned === 0 ? 'correct' : (timeDiffSigned > 0 ? 'time-positive' : 'time-negative'));
  const distanceColor = result.distance_km === null ? 'wrong' : (result.distance_km <= 500 ? 'correct' : 'wrong');
  const distanceText = result.distance_km === null ? '未作答' : `${result.distance_km} ${distanceUnit}`;
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
                <div class="score-value">${elapsedSeconds.toFixed(1)}</div>
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

  if (eventId && appState.user) {
    loadEventVotesAndFavorite(eventId);
    initVoteAndFavoriteHandlers(eventId);
  }
}

async function renderFavoritesPage() {
  cleanupGame();
  appState.currentView = 'favorites';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="favorites-page">
      <div class="page-header">
        <button class="btn btn-secondary" id="fav-back-btn">← 返回主界面</button>
        <h2>⭐ 我的收藏</h2>
        <div></div>
      </div>
      <div class="favorites-search-bar">
        <input type="text" id="fav-search-input" placeholder="搜索收藏的事件名称..." />
        <button class="btn btn-primary" id="fav-search-btn">搜索</button>
      </div>
      <div class="favorites-list" id="favorites-list">
        <div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">加载中...</div>
      </div>
    </div>
  `;

  document.getElementById('fav-back-btn').addEventListener('click', () => {
    renderMainPage();
  });

  let searchTimeout = null;
  const searchInput = document.getElementById('fav-search-input');
  const doSearch = () => {
    loadFavorites(searchInput.value.trim());
  };
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(doSearch, 300);
  });
  document.getElementById('fav-search-btn').addEventListener('click', doSearch);

  loadFavorites('');
}

async function renderStatsPage() {
  cleanupGame();
  if (!appState.user || !appState.user.id) {
    alert('请先登录');
    return;
  }

  const res = await API.get(`/game/stats/${appState.user.id}?period=${appState.statsPeriod}`);
  if (!res.success) {
    alert(res.message);
    return;
  }

  const { daily, totals } = res.data;
  const periodName = { all: '全部', week: '本周', month: '本月', year: '本年' }[appState.statsPeriod] || '全部';

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stats-page">
      <div class="stats-container">
        <div class="stats-title">个人统计</div>
        <div class="stats-period-tabs" id="stats-period-tabs">
          <button class="period-tab ${appState.statsPeriod === 'all' ? 'active' : ''}" data-period="all">全部</button>
          <button class="period-tab ${appState.statsPeriod === 'week' ? 'active' : ''}" data-period="week">本周</button>
          <button class="period-tab ${appState.statsPeriod === 'month' ? 'active' : ''}" data-period="month">本月</button>
          <button class="period-tab ${appState.statsPeriod === 'year' ? 'active' : ''}" data-period="year">本年</button>
        </div>
        <div class="stats-subtitle" style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:16px;text-align:center;">当前范围：${periodName}</div>
        <div class="stats-summary">
          <div class="stats-card">
            <div class="num">${totals.total_games}</div>
            <div class="lbl">总局数</div>
          </div>
          <div class="stats-card">
            <div class="num">${totals.avg_distance ?? 0}</div>
            <div class="lbl">平均距离</div>
          </div>
          <div class="stats-card">
            <div class="num">${totals.avg_time_diff ?? 0}</div>
            <div class="lbl">平均时间差(年)</div>
          </div>
          <div class="stats-card">
            <div class="num">${totals.avg_elapsed ?? 0}</div>
            <div class="lbl">平均耗时(秒)</div>
          </div>
        </div>
        <div class="stats-summary" style="grid-template-columns:repeat(7,1fr);margin-top:12px;">
          <div class="stats-card small">
            <div class="num">${totals.total_distance ?? 0}</div>
            <div class="lbl">总距离</div>
          </div>
          <div class="stats-card small">
            <div class="num">${totals.total_time_diff ?? 0}</div>
            <div class="lbl">总时间差(年)</div>
          </div>
          <div class="stats-card small">
            <div class="num">${totals.total_elapsed ?? 0}</div>
            <div class="lbl">总耗时(秒)</div>
          </div>
          <div class="stats-card small precise-location-card">
            <div class="num">${totals.total_precise_location ?? 0}</div>
            <div class="lbl">精准位置数</div>
          </div>
          <div class="stats-card small precise-time-card">
            <div class="num">${totals.total_precise_time ?? 0}</div>
            <div class="lbl">精准时间数</div>
          </div>
          <div class="stats-card small precise-location-card">
            <div class="num">${Math.round((totals.avg_precise_location ?? 0) * 1000) / 10}</div>
            <div class="lbl">精准位置率(%)</div>
          </div>
          <div class="stats-card small precise-time-card">
            <div class="num">${Math.round((totals.avg_precise_time ?? 0) * 1000) / 10}</div>
            <div class="lbl">精准时间率(%)</div>
          </div>
        </div>
        ${daily.length > 0 ? `
          <table class="stats-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>局数</th>
                <th>距离</th>
                <th>时间差(年)</th>
                <th>耗时(秒)</th>
                <th>精准位置</th>
                <th>精准时间</th>
              </tr>
            </thead>
            <tbody>
              ${daily.map(d => `
                <tr>
                  <td>${d.stat_date}</td>
                  <td>${d.games_played}</td>
                  <td>${Math.round(d.total_distance)}</td>
                  <td>${d.total_time_diff}</td>
                  <td>${Math.round(d.total_elapsed * 10) / 10}</td>
                  <td>${d.precise_location_count || 0}</td>
                  <td>${d.precise_time_count || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div style="text-align:center;color:rgba(255,255,255,0.4);padding:40px;">暂无游戏记录</div>'}
        <div class="stats-back">
          <button class="btn btn-secondary" id="stats-back-btn">返回</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('stats-back-btn').addEventListener('click', renderMainPage);

  document.getElementById('stats-period-tabs').querySelectorAll('.period-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.statsPeriod = btn.dataset.period;
      renderStatsPage();
    });
  });
}
