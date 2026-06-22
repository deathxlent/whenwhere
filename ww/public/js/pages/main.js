async function renderMainPage() {
  appState.currentView = 'main';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="main-page">
      <div class="bg-map" id="bg-map"></div>
      <div class="user-menu">
        <button class="user-menu-btn" id="user-menu-btn">${appState.user.username} ▾</button>
        <div class="user-menu-dropdown" id="user-menu-dropdown">
          <div class="user-menu-item" id="menu-achievements">🏅 成就系统</div>
          <div class="user-menu-item" id="menu-rank-history">📜 段位历史</div>
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

  document.getElementById('menu-achievements').addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderAchievementsPage();
  });

  document.getElementById('menu-rank-history').addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderRankHistoryPage();
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
