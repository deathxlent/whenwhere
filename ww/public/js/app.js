const API = {
  async get(url) {
    const res = await fetch(`/api${url}`);
    return await res.json();
  },
  async post(url, data) {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  }
};

const COOKIE_NAME = 'ww_token';
const COOKIE_EXPIRY = 3650;

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

let appState = {
  user: null,
  currentView: 'login',
  selectedTab: 'junior',
  selectedSubCodes: ['china', 'world'],
  currentEvent: null,
  currentImages: [],
  shownImageIndices: [],
  guessLat: null,
  guessLng: null,
  guessYear: null,
  guessMonth: null,
  guessDay: null,
  timerSeconds: 30,
  timerInterval: null,
  startTime: null,
  map: null,
  bgMap: null,
  admin1Labels: [],
  provinceLayer: null,
  mapClickMarker: null,
  spacePressed: false,
  imagesHidden: false,
  leaderboardPeriod: 'all',
  statsPeriod: 'all'
};

const COUNTRIES_WITH_ADMIN1 = new Set([
  '中国', '俄罗斯', '美国', '加拿大', '巴西', '澳大利亚', '印度', '阿根廷',
  '哈萨克斯坦', '阿尔及利亚', '刚果(金)', '沙特阿拉伯', '墨西哥', '印度尼西亚',
  '苏丹', '利比亚', '伊朗', '蒙古', '秘鲁', '乍得', '尼日尔', '安哥拉', '马里',
  '南非', '哥伦比亚', '埃塞俄比亚', '玻利维亚', '毛里塔尼亚', '埃及',
  '坦桑尼亚', '尼日利亚', '委内瑞拉', '纳米比亚', '莫桑比克', '巴基斯坦',
  '土耳其', '智利', '赞比亚', '缅甸', '阿富汗', '索马里', '中非', '乌克兰',
  '马达加斯加', '博茨瓦纳', '肯尼亚', '法国', '也门', '泰国', '西班牙',
  '土库曼斯坦', '喀麦隆', '巴布亚新几内亚', '瑞典', '乌兹别克斯坦', '摩洛哥',
  '伊拉克', '巴拉圭', '津巴布韦', '日本', '德国', '刚果(布)', '芬兰', '越南',
  '马来西亚', '挪威', '科特迪瓦', '波兰', '意大利', '菲律宾', '厄瓜多尔',
  '布基纳法索', '新西兰', '加蓬', '几内亚', '英国', '乌干达', '加纳', '罗马尼亚',
  '老挝', '圭亚那', '白俄罗斯', '吉尔吉斯斯坦', '塞内加尔', '叙利亚', '柬埔寨',
  '乌拉圭', '苏里南', '突尼斯', '孟加拉国', '尼泊尔', '塔吉克斯坦', '希腊',
  '尼加拉瓜', '厄立特里亚', '朝鲜', '韩国'
]);

const WORLD_COUNTRIES = [
  {name:'中国',lat:35.8617,lng:104.1954},{name:'蒙古',lat:46.8625,lng:103.8467},
  {name:'朝鲜',lat:40.3399,lng:127.5101},{name:'韩国',lat:35.9078,lng:127.7669},
  {name:'日本',lat:36.2048,lng:138.2529},{name:'越南',lat:14.0583,lng:108.2772},
  {name:'老挝',lat:19.8563,lng:102.4955},{name:'柬埔寨',lat:12.5657,lng:104.9910},
  {name:'缅甸',lat:21.9162,lng:95.9562},{name:'泰国',lat:15.8700,lng:100.9925},
  {name:'马来西亚',lat:4.2105,lng:101.9758},{name:'新加坡',lat:1.3521,lng:103.8198},
  {name:'印度尼西亚',lat:-0.7893,lng:113.9213},{name:'菲律宾',lat:12.8797,lng:121.7740},
  {name:'印度',lat:20.5937,lng:78.9629},{name:'巴基斯坦',lat:30.3753,lng:69.3451},
  {name:'孟加拉国',lat:23.6850,lng:90.3563},{name:'尼泊尔',lat:28.3949,lng:84.1240},
  {name:'哈萨克斯坦',lat:48.0196,lng:66.9237},{name:'伊朗',lat:32.4279,lng:53.6880},
  {name:'伊拉克',lat:33.2232,lng:43.6793},{name:'沙特阿拉伯',lat:23.8859,lng:45.0792},
  {name:'土耳其',lat:38.9637,lng:35.2433},{name:'以色列',lat:31.0461,lng:34.8516},
  {name:'埃及',lat:26.8206,lng:30.8025},{name:'利比亚',lat:26.3351,lng:17.2283},
  {name:'阿尔及利亚',lat:28.0339,lng:1.6596},{name:'摩洛哥',lat:31.7917,lng:-7.0926},
  {name:'尼日利亚',lat:9.0820,lng:8.6753},{name:'埃塞俄比亚',lat:9.1450,lng:40.4897},
  {name:'肯尼亚',lat:-0.0236,lng:37.9062},{name:'南非',lat:-30.5595,lng:22.9375},
  {name:'英国',lat:55.3781,lng:-3.4360},{name:'法国',lat:46.2276,lng:2.2137},
  {name:'德国',lat:51.1657,lng:10.4515},{name:'意大利',lat:41.8719,lng:12.5674},
  {name:'西班牙',lat:40.4637,lng:-3.7492},{name:'葡萄牙',lat:39.3999,lng:-8.2245},
  {name:'希腊',lat:39.0742,lng:21.8243},{name:'挪威',lat:60.4720,lng:8.4689},
  {name:'瑞典',lat:60.1282,lng:18.6435},{name:'芬兰',lat:61.9241,lng:25.7482},
  {name:'波兰',lat:51.9194,lng:19.1451},{name:'乌克兰',lat:48.3794,lng:31.1656},
  {name:'俄罗斯',lat:61.5240,lng:105.3188},{name:'加拿大',lat:56.1304,lng:-106.3468},
  {name:'美国',lat:37.0902,lng:-95.7129},{name:'墨西哥',lat:23.6345,lng:-102.5528},
  {name:'巴西',lat:-14.2350,lng:-51.9253},{name:'阿根廷',lat:-38.4161,lng:-63.6167},
  {name:'智利',lat:-35.6751,lng:-71.5430},{name:'澳大利亚',lat:-25.2744,lng:133.7751},
  {name:'新西兰',lat:-40.9006,lng:174.8860},{name:'巴布亚新几内亚',lat:-6.3149,lng:143.9555}
];

async function init() {
  const encrypted = getCookie(COOKIE_NAME);
  if (encrypted) {
    try {
      const res = await API.post('/auth/verify', { encrypted });
      if (res.success) {
        appState.user = res.data;
        renderMainPage();
        return;
      }
    } catch (e) {
      console.warn('Token验证失败:', e);
    }
  }
  renderLoginPage();
}

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

function renderMainPage() {
  appState.currentView = 'main';
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="main-page">
      <div class="bg-map" id="bg-map"></div>
      <div class="user-menu">
        <button class="user-menu-btn" id="user-menu-btn">${appState.user.username} ▾</button>
        <div class="user-menu-dropdown" id="user-menu-dropdown">
          <div class="user-menu-item" id="menu-stats">📊 个人统计</div>
          <div class="user-menu-item" id="menu-logout">🚪 退出</div>
        </div>
      </div>
      <div class="main-content">
        <div class="main-prompt">请选择你要猜的内容</div>
        <div class="tabs-container" id="main-tabs"></div>
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
  initTabs();
  initUserMenu();
  initLeaderboard();
}

function initBgMap() {
  if (appState.bgMap) {
    appState.bgMap.remove();
    appState.bgMap = null;
  }
  const container = document.getElementById('bg-map');
  container.innerHTML = '<div id="bg-map-el" style="width:100%;height:100%;"></div>';

  const map = L.map('bg-map-el', {
    center: [30, 120],
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

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 2,
    maxZoom: 8,
    attribution: '&copy; 高德地图'
  }).addTo(map);

  WORLD_COUNTRIES.forEach(country => {
    L.marker([country.lat, country.lng], {
      icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
      interactive: false
    }).addTo(map);
  });

  appState.bgMap = map;
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

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initTabs() {
  const tabs = [
    { code: 'junior', name: '初中' },
    { code: 'senior', name: '高中' },
    { code: 'human', name: '人类' },
    { code: 'universe', name: '宇宙' },
    { code: 'virtual', name: '虚拟' }
  ];

  const tabsContainer = document.getElementById('main-tabs');
  tabsContainer.innerHTML = tabs.map(t =>
    `<button class="tab-btn ${t.code === appState.selectedTab ? 'active' : ''}" data-code="${t.code}">${t.name}</button>`
  ).join('');

  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.selectedTab = btn.dataset.code;
      renderTabContent();
    });
  });

  renderTabContent();
}

function renderTabContent() {
  const content = document.getElementById('tab-content');
  if (appState.selectedTab !== 'junior') {
    content.innerHTML = '<div class="options-panel"><div class="construction-text">🏗️ 建设中，敬请期待...</div></div>';
    return;
  }

  content.innerHTML = `
    <div class="options-panel">
      <div class="checkbox-item">
        <input type="checkbox" id="chk-china" ${appState.selectedSubCodes.includes('china') ? 'checked' : ''}>
        <label for="chk-china">中国史</label>
      </div>
      <div class="checkbox-item">
        <input type="checkbox" id="chk-world" ${appState.selectedSubCodes.includes('world') ? 'checked' : ''}>
        <label for="chk-world">世界史</label>
      </div>
    </div>
    <button class="btn btn-primary" id="start-btn" style="min-width:200px;">开始</button>
  `;

  const chkChina = document.getElementById('chk-china');
  const chkWorld = document.getElementById('chk-world');
  const startBtn = document.getElementById('start-btn');

  const updateStartBtn = () => {
    const codes = [];
    if (chkChina.checked) codes.push('china');
    if (chkWorld.checked) codes.push('world');
    appState.selectedSubCodes = codes;
    startBtn.disabled = codes.length === 0;
  };

  chkChina.addEventListener('change', updateStartBtn);
  chkWorld.addEventListener('change', updateStartBtn);
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

function renderGamePage() {
  appState.currentView = 'game';
  const app = document.getElementById('app');
  const isChinaOnly = appState.selectedSubCodes.length === 1 && appState.selectedSubCodes.includes('china');
  const mapCenter = isChinaOnly ? [35, 105] : [30, 120];
  const mapZoom = isChinaOnly ? 4 : 2;

  app.innerHTML = `
    <div class="game-page">
      <div class="game-map">
        <div id="map"></div>
      </div>
      <div class="game-sidebar" id="game-sidebar">
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-bar-fill" style="width:100%"></div></div>
        <div class="timer-text" id="timer-text">30</div>
        <div class="image-area" id="image-area"></div>
        <div class="game-actions">
          <button class="btn btn-warning" id="give-up-btn">放弃</button>
          <button class="btn btn-default" id="restart-game-btn">再来一局</button>
        </div>
      </div>
    </div>
  `;

  appState.map = L.map('map', {
    center: mapCenter,
    zoom: mapZoom,
    minZoom: 2,
    maxZoom: 8,
    zoomControl: true,
    worldCopyJump: true
  });

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 2,
    maxZoom: 8,
    attribution: '&copy; 高德地图'
  }).addTo(appState.map);

  appState.admin1Labels = [];
  loadGameMapLabels();

  appState.map.on('click', onGameMapClick);

  renderCurrentImages();
  startTimer();

  document.getElementById('give-up-btn').addEventListener('click', () => {
    cleanupGame();
    renderMainPage();
  });

  document.getElementById('restart-game-btn').addEventListener('click', () => {
    startGame();
  });
}

async function loadGameMapLabels() {
  try {
    const res = await fetch('/geojson/china_provinces.json');
    const data = await res.json();

    appState.provinceLayer = L.geoJSON(data, {
      style: { color: '#4a90d9', weight: 1, fillColor: '#a8d0f0', fillOpacity: 0.1, dashArray: '4' },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name;
        if (name) {
          layer.bindTooltip(name, { permanent: false, direction: 'center', className: 'province-label' });
        }
      }
    }).addTo(appState.map);

    const currentZoom = appState.map.getZoom();
    data.features.forEach(feature => {
      const name = feature.properties.name;
      if (!name) return;
      const bounds = L.geoJSON(feature).getBounds();
      const center = bounds.getCenter();
      const label = L.marker(center, {
        icon: L.divIcon({ className: 'province-label', html: name, iconSize: [0, 0] }),
        interactive: false
      });
      label._isCountryLabel = false;
      label._isProvinceLabel = true;
      appState.admin1Labels.push(label);
      if (currentZoom >= 4) label.addTo(appState.map);
    });

    WORLD_COUNTRIES.forEach(country => {
      const label = L.marker([country.lat, country.lng], {
        icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
        interactive: false
      });
      label._isCountryLabel = true;
      label._isProvinceLabel = false;
      appState.admin1Labels.push(label);
      if (currentZoom >= 2) label.addTo(appState.map);
    });

    try {
      const adminRes = await fetch('/geojson/world_admin1_labels.json');
      const adminData = await adminRes.json();
      adminData.features.forEach(feature => {
        const name = feature.properties.name;
        const coords = feature.geometry.coordinates;
        const country = feature.properties.country;
        if (!name || !coords) return;
        if (!COUNTRIES_WITH_ADMIN1.has(country)) return;
        const label = L.marker([coords[1], coords[0]], {
          icon: L.divIcon({ className: 'admin1-label', html: name, iconSize: [0, 0] }),
          interactive: false
        });
        label._isCountryLabel = false;
        label._isProvinceLabel = false;
        appState.admin1Labels.push(label);
        if (currentZoom >= 4) label.addTo(appState.map);
      });
    } catch (e) {}

    appState.map.on('zoomend', () => {
      const zoom = appState.map.getZoom();
      appState.admin1Labels.forEach(label => {
        const minZoom = label._isCountryLabel ? 2 : 4;
        if (zoom >= minZoom) {
          if (!appState.map.hasLayer(label)) appState.map.addLayer(label);
        } else {
          if (appState.map.hasLayer(label)) appState.map.removeLayer(label);
        }
      });
    });
  } catch (e) {
    console.warn('加载地图标签失败:', e);
  }
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

  showTimePicker();
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

  area.innerHTML = images.map(img =>
    `<img src="${img.url}" alt="猜图">`
  ).join('');
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

function renderResultPage(result, elapsedSeconds, isTimedOut) {
  appState.currentView = 'result';
  cleanupGame();

  const shownImages = appState.shownImageIndices.map(i => appState.currentImages[i]).filter(Boolean);
  const distanceColor = result.distance_km === null ? 'wrong' : (result.distance_km <= 500 ? 'correct' : 'wrong');
  const isPreciseLocation = result.distance_km !== null && result.distance_km <= 30;
  const isPreciseTime = result.time_diff_years !== null && Math.abs(result.time_diff_years) <= 5;

  const timeColor = result.time_diff_years === null ? 'wrong' : (result.time_in_range ? 'correct' : 'wrong');
  const distanceText = result.distance_km === null ? '未作答' : `${result.distance_km} 公里`;
  const timeDiffText = result.time_diff_years === null ? '未作答' : (result.time_in_range ? '在时间范围内' : `差距 ${Math.abs(result.time_diff_years)} 年`);

  const titleText = isTimedOut ? '时间到！结果揭晓' : '结果揭晓';

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="result-page">
      <div class="result-container">
        <div class="result-title">${titleText}</div>
        ${(isPreciseLocation || isPreciseTime ? `
          <div class="precise-banner">
            ${isPreciseLocation ? '<span class="precise-badge precise-location">🎯 精准位置猜中！</span>' : ''}
            ${isPreciseTime ? '<span class="precise-badge precise-time">⏱️ 精准时间猜中！</span>' : ''}
          </div>
        ` : '')}
        <div class="result-card">
          <h3>已显示的图片</h3>
          <div class="result-images">
            ${shownImages.length > 0 ? shownImages.map(img => `<img src="${img.url}" alt="图片">`).join('') : '<div style="color:rgba(255,255,255,0.5);text-align:center;padding:20px;">暂无图片</div>'}
          </div>
        </div>
        <div class="result-card">
          <h3>正确答案</h3>
          <div class="result-info">
            <div><span class="label">事件：</span><span class="value">${result.correct_title}</span></div>
            ${result.correct_description ? `<div><span class="label">说明：</span><span class="value">${result.correct_description}</span></div>` : ''}
            <div><span class="label">时间：</span><span class="value">${result.correct_start_display}${result.correct_end_display && result.correct_end_display !== result.correct_start_display ? ' ~ ' + result.correct_end_display : ''}</span></div>
            <div><span class="label">地点：</span><span class="value">${result.correct_location_name || '未知'}</span></div>
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
            <div class="score-item">
              <div class="score-value ${timeColor}">${timeDiffText}</div>
              <div class="score-label">时间</div>
              ${isPreciseTime ? '<div class="precise-tag">精准</div>' : ''}
            </div>
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
  `;

  document.getElementById('play-again-btn').addEventListener('click', startGame);
  document.getElementById('back-main-btn').addEventListener('click', renderMainPage);
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
            <div class="lbl">平均距离(km)</div>
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
            <div class="lbl">总距离(km)</div>
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
                <th>距离(km)</th>
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

init();
