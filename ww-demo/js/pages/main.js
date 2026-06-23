function renderMainPage() {
  appState.currentPage = 'main';
  appState.selectedSubCodes = [];
  appState.currentSubCategory = null;
  
  const app = document.getElementById('app');
  
  const tabsHtml = DEMO_DATA.categories.map((cat, idx) => `
    <button class="tab-btn ${idx === 0 ? 'active' : ''}" data-code="${cat.code}">${cat.name}</button>
  `).join('');
  
  const leaderboardHtml = DEMO_DATA.leaderboard.by_games.slice(0, 10).map((item, idx) => {
    const medals = ['🥇', '🥈', '🥉'];
    const rank = idx < 3 ? medals[idx] : `${idx + 1}`;
    return `
      <div class="leaderboard-item">
        <div class="lb-rank">${rank}</div>
        <div class="lb-username">${item.username}</div>
        <div class="lb-value">${item.value}</div>
      </div>
    `;
  }).join('');
  
  app.innerHTML = `
    <div class="main-page">
      <div class="bg-map" id="bg-map"></div>
      <div class="user-menu">
        <button class="user-menu-btn" id="user-menu-btn">${appState.user.username} ▾</button>
        <div class="user-menu-dropdown" id="user-menu-dropdown">
          <div class="user-menu-item" id="menu-favorites">⭐ 我的收藏</div>
          <div class="user-menu-item" id="menu-stats">📊 个人统计</div>
          <div class="user-menu-item" id="menu-achievements">🏅 成就系统</div>
        </div>
      </div>
      <div class="main-content">
        <div class="main-prompt">请选择你要猜的内容</div>
        <div class="tabs-container" id="main-tabs">
          ${tabsHtml}
        </div>
        <div id="tab-content"></div>
        <div class="leaderboard-section">
          <div class="leaderboard-header">
            <div class="leaderboard-title">🏆 排行榜（静态展示）</div>
          </div>
          <div class="leaderboard-list">
            ${leaderboardHtml}
          </div>
        </div>
      </div>
      ${createBottomNav('main')}
    </div>
  `;
  
  initBgMap();
  initUserMenu();
  initBottomNav();
  initTabs();
}

function initTabs() {
  const tabsContainer = document.getElementById('main-tabs');
  if (!tabsContainer) return;
  
  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTabContent(btn.dataset.code);
    });
  });
  
  const firstTab = tabsContainer.querySelector('.tab-btn');
  if (firstTab) {
    renderTabContent(firstTab.dataset.code);
  }
}

function renderTabContent(categoryCode) {
  const category = getCategoryByCode(categoryCode);
  if (!category || category.subCategories.length === 0) {
    document.getElementById('tab-content').innerHTML = '<div class="options-panel"><div class="construction-text">🏗️ 建设中，敬请期待...</div></div>';
    return;
  }
  
  appState.selectedSubCodes = category.subCategories.map(s => s.code);
  appState.currentSubConfigs = category.subCategories;
  
  const checkboxesHtml = category.subCategories.map(sub => `
    <div class="checkbox-item">
      <input type="checkbox" id="chk-${sub.code}" checked>
      <label for="chk-${sub.code}">${sub.name} <span style="color:rgba(255,255,255,0.45);font-size:12px;">(${sub.events.length}题)</span></label>
    </div>
  `).join('');
  
  document.getElementById('tab-content').innerHTML = `
    <div class="options-panel">
      ${checkboxesHtml}
    </div>
    <button class="btn btn-primary" id="start-btn" style="min-width:200px;">开始</button>
  `;
  
  const checkboxes = document.querySelectorAll('#tab-content input[type="checkbox"]');
  const startBtn = document.getElementById('start-btn');
  
  const updateStartBtn = () => {
    const codes = [];
    checkboxes.forEach(chk => {
      const code = chk.id.replace('chk-', '');
      if (chk.checked) codes.push(code);
    });
    appState.selectedSubCodes = codes;
    startBtn.disabled = codes.length === 0;
    if (codes.length === 0) {
      startBtn.classList.add('disabled');
    } else {
      startBtn.classList.remove('disabled');
    }
  };
  
  checkboxes.forEach(chk => chk.addEventListener('change', updateStartBtn));
  updateStartBtn();
  
  startBtn.addEventListener('click', () => {
    if (appState.selectedSubCodes.length === 0) return;
    startGame();
  });
}

function startGame() {
  const allEvents = [];
  for (const subCode of appState.selectedSubCodes) {
    const sub = appState.currentSubConfigs.find(s => s.code === subCode);
    if (sub && sub.events.length > 0) {
      for (const event of sub.events) {
        allEvents.push({ ...event, subCategory: sub });
      }
    }
  }
  
  if (allEvents.length === 0) {
    alert('选中的分类暂无题目');
    return;
  }
  
  const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
  const category = getCategoryByCode(DEMO_DATA.categories.find(c => c.id === appState.currentSubConfigs[0].category_id)?.code);
  
  appState.currentCategory = category;
  appState.currentSubCategory = randomEvent.subCategory;
  appState.currentEvent = randomEvent;
  appState.currentImages = randomEvent.images || [];
  appState.shownImageIndices = [];
  appState.guessMonth = null;
  appState.guessDay = null;
  appState.imagesHidden = false;
  appState.spacePressed = false;
  appState.gameStartTime = Date.now();
  appState.guessLat = null;
  appState.guessLng = null;
  appState.guessYear = null;
  
  if (appState.currentImages.length > 0) {
    const firstIdx = Math.floor(Math.random() * appState.currentImages.length);
    appState.shownImageIndices.push(firstIdx);
  }
  
  renderGamePage();
}

function initBgMap() {
  const bgMapEl = document.getElementById('bg-map');
  if (!bgMapEl) return;
  
  const bgMap = L.map(bgMapEl, {
    center: [35, 105],
    zoom: 2,
    minZoom: 2,
    maxZoom: 8,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false
  });
  
  L.tileLayer('./tiles/osm/{z}/{x}/{y}.png', {
    minZoom: 2,
    maxZoom: 2
  }).addTo(bgMap);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 3,
    maxZoom: 8
  }).addTo(bgMap);

  WORLD_COUNTRIES.forEach(country => {
    L.marker([country.lat, country.lng], {
      icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
      interactive: false
    }).addTo(bgMap);
  });
}

function initUserMenu() {
  const btn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-menu-dropdown');
  
  if (!btn || !dropdown) return;
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });
  
  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });
  
  document.getElementById('menu-favorites')?.addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderFavoritesPage();
  });

  document.getElementById('menu-stats')?.addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderStatsPage();
  });
  
  document.getElementById('menu-achievements')?.addEventListener('click', () => {
    dropdown.classList.remove('show');
    renderAchievementsPage();
  });
}
