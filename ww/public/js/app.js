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
  imagesHidden: false
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
    const res = await API.post('/auth/verify', { encrypted });
    if (res.success) {
      appState.user = res.data;
      renderMainPage();
      return;
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
          <div class="user-menu-item" id="menu-stats">📊 统计</div>
          <div class="user-menu-item" id="menu-logout">🚪 退出</div>
        </div>
      </div>
      <div class="main-content">
        <div class="main-prompt">请选择你要猜的内容</div>
        <div class="tabs-container" id="main-tabs"></div>
        <div id="tab-content"></div>
      </div>
    </div>
  `;

  initBgMap();
  initTabs();
  initUserMenu();
}

function initBgMap() {
  if (appState.bgMap) {
    appState.bgMap.remove();
    appState.bgMap = null;
  }
  const container = document.getElementById('bg-map');
  container.innerHTML = '<div id="bg-map-el" style="width:100%;height:100%;"></div>';

  const map = L.map('bg-map-el', {
    center: [25, 30],
    zoom: 3,
    minZoom: 1,
    maxZoom: 18,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false
  });

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 1,
    maxZoom: 18
  }).addTo(map);

  appState.bgMap = map;
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
  document.removeEventListener('keydown', handleSpaceKey);
  document.removeEventListener('keyup', handleSpaceKeyUp);
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
  const mapCenter = isChinaOnly ? [35, 105] : [25, 30];
  const mapZoom = isChinaOnly ? 5 : 4;

  app.innerHTML = `
    <div class="game-page">
      <div class="game-map">
        <div id="map"></div>
      </div>
      <div class="game-sidebar" id="game-sidebar">
        <div class="timer-bar"><div class="timer-bar-fill" id="timer-bar-fill" style="width:100%"></div></div>
        <div class="timer-text" id="timer-text">30</div>
        <div class="image-area" id="image-area"></div>
      </div>
      <div class="game-hint">按空格隐藏/显示图片</div>
    </div>
  `;

  appState.map = L.map('map', {
    center: mapCenter,
    zoom: mapZoom,
    minZoom: 1,
    maxZoom: 18,
    zoomControl: true,
    worldCopyJump: true
  });

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 1,
    maxZoom: 18
  }).addTo(appState.map);

  appState.admin1Labels = [];
  loadGameMapLabels();

  appState.map.on('click', onGameMapClick);

  renderCurrentImages();
  startTimer();

  document.addEventListener('keydown', handleSpaceKey);
  document.addEventListener('keyup', handleSpaceKeyUp);
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
      appState.admin1Labels.push(label);
      if (currentZoom >= 4) label.addTo(appState.map);
    });

    WORLD_COUNTRIES.forEach(country => {
      const label = L.marker([country.lat, country.lng], {
        icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
        interactive: false
      });
      appState.admin1Labels.push(label);
      if (currentZoom >= 4) label.addTo(appState.map);
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
        appState.admin1Labels.push(label);
        if (currentZoom >= 4) label.addTo(appState.map);
      });
    } catch (e) {}

    appState.map.on('zoomend', () => {
      const zoom = appState.map.getZoom();
      appState.admin1Labels.forEach(label => {
        if (zoom >= 4) {
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

  if (appState.imagesHidden) {
    area.innerHTML = '<div class="no-image">图片已隐藏</div>';
    return;
  }

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

function handleSpaceKey(e) {
  if (e.code === 'Space' && appState.currentView === 'game') {
    e.preventDefault();
    if (!appState.spacePressed) {
      appState.spacePressed = true;
      appState.imagesHidden = true;
      renderCurrentImages();
    }
  }
}

function handleSpaceKeyUp(e) {
  if (e.code === 'Space' && appState.currentView === 'game') {
    e.preventDefault();
    appState.spacePressed = false;
    appState.imagesHidden = false;
    renderCurrentImages();
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

function renderResultPage(result, elapsedSeconds) {
  appState.currentView = 'result';
  cleanupGame();

  const shownImages = appState.shownImageIndices.map(i => appState.currentImages[i]).filter(Boolean);
  const distanceColor = result.distance_km <= 500 ? 'correct' : 'wrong';
  const timeColor = result.time_in_range ? 'correct' : 'wrong';
  const timeDiffText = result.time_in_range ? '在时间范围内' : `差距 ${result.time_diff_years} 年`;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="result-page">
      <div class="result-container">
        <div class="result-title">结果揭晓</div>
        <div class="result-card">
          <h3>已显示的图片</h3>
          <div class="result-images">
            ${shownImages.map(img => `<img src="${img.url}" alt="图片">`).join('')}
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
              <div class="score-value ${distanceColor}">${result.distance_km}</div>
              <div class="score-label">距离（公里）</div>
            </div>
            <div class="score-item">
              <div class="score-value ${timeColor}">${timeDiffText}</div>
              <div class="score-label">时间</div>
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

  const res = await API.get(`/game/stats/${appState.user.id}`);
  if (!res.success) {
    alert(res.message);
    return;
  }

  const { daily, totals } = res.data;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="stats-page">
      <div class="stats-container">
        <div class="stats-title">统计数据</div>
        <div class="stats-summary">
          <div class="stats-card">
            <div class="num">${totals.total_games}</div>
            <div class="lbl">总局数</div>
          </div>
          <div class="stats-card">
            <div class="num">${totals.total_distance}</div>
            <div class="lbl">总距离(公里)</div>
          </div>
          <div class="stats-card">
            <div class="num">${totals.total_time_diff}</div>
            <div class="lbl">总时间差(年)</div>
          </div>
          <div class="stats-card">
            <div class="num">${totals.total_elapsed}</div>
            <div class="lbl">总耗时(秒)</div>
          </div>
        </div>
        ${daily.length > 0 ? `
          <table class="stats-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>局数</th>
                <th>距离(公里)</th>
                <th>时间差(年)</th>
                <th>耗时(秒)</th>
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
}

init();
