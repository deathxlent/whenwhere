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
  categories: [],
  subCategoriesMap: {},
  selectedTab: 'junior',
  selectedSubCodes: [],
  currentSubConfigs: [],
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
  {name:'文莱',lat:4.5353,lng:114.7277},{name:'东帝汶',lat:-8.8749,lng:125.7275},
  {name:'印度',lat:20.5937,lng:78.9629},{name:'巴基斯坦',lat:30.3753,lng:69.3451},
  {name:'孟加拉国',lat:23.6850,lng:90.3563},{name:'尼泊尔',lat:28.3949,lng:84.1240},
  {name:'斯里兰卡',lat:7.8731,lng:80.7718},{name:'不丹',lat:27.5142,lng:90.4336},
  {name:'马尔代夫',lat:3.2028,lng:73.2207},
  {name:'哈萨克斯坦',lat:48.0196,lng:66.9237},{name:'乌兹别克斯坦',lat:41.3775,lng:64.5853},
  {name:'土库曼斯坦',lat:38.9697,lng:59.5563},{name:'塔吉克斯坦',lat:38.8610,lng:71.2761},
  {name:'吉尔吉斯斯坦',lat:41.2044,lng:74.7661},
  {name:'伊朗',lat:32.4279,lng:53.6880},{name:'伊拉克',lat:33.2232,lng:43.6793},
  {name:'沙特阿拉伯',lat:23.8859,lng:45.0792},{name:'土耳其',lat:38.9637,lng:35.2433},
  {name:'以色列',lat:31.0461,lng:34.8516},{name:'阿联酋',lat:23.4241,lng:53.8478},
  {name:'科威特',lat:29.3759,lng:47.9774},{name:'卡塔尔',lat:25.3548,lng:51.1839},
  {name:'巴林',lat:26.0667,lng:50.5577},{name:'阿曼',lat:21.4735,lng:55.9754},
  {name:'也门',lat:15.5527,lng:48.5164},{name:'约旦',lat:30.5852,lng:36.2384},
  {name:'黎巴嫩',lat:33.8547,lng:35.8623},{name:'叙利亚',lat:34.8021,lng:38.9968},
  {name:'塞浦路斯',lat:35.1264,lng:33.4299},{name:'格鲁吉亚',lat:42.3154,lng:43.3569},
  {name:'亚美尼亚',lat:40.0691,lng:45.0382},{name:'阿塞拜疆',lat:40.1431,lng:47.5769},
  {name:'埃及',lat:26.8206,lng:30.8025},{name:'利比亚',lat:26.3351,lng:17.2283},
  {name:'阿尔及利亚',lat:28.0339,lng:1.6596},{name:'摩洛哥',lat:31.7917,lng:-7.0926},
  {name:'突尼斯',lat:33.8869,lng:9.5375},{name:'苏丹',lat:12.8628,lng:30.2176},
  {name:'南苏丹',lat:6.8770,lng:31.3077},{name:'乍得',lat:15.4542,lng:18.7322},
  {name:'尼日尔',lat:17.6078,lng:8.0817},{name:'马里',lat:17.5707,lng:-3.9962},
  {name:'毛里塔尼亚',lat:21.0079,lng:-10.9408},{name:'塞内加尔',lat:14.4974,lng:-14.4524},
  {name:'冈比亚',lat:13.4431,lng:-15.3101},{name:'几内亚比绍',lat:11.8037,lng:-15.1804},
  {name:'几内亚',lat:9.9456,lng:-9.6966},{name:'塞拉利昂',lat:8.4606,lng:-11.7799},
  {name:'利比里亚',lat:6.4281,lng:-9.4295},{name:'科特迪瓦',lat:7.5400,lng:-5.5471},
  {name:'加纳',lat:7.9465,lng:-1.0232},{name:'多哥',lat:8.6195,lng:0.8248},
  {name:'贝宁',lat:9.3077,lng:2.3158},{name:'布基纳法索',lat:12.2383,lng:-1.5616},
  {name:'尼日利亚',lat:9.0820,lng:8.6753},{name:'喀麦隆',lat:7.3697,lng:12.3547},
  {name:'赤道几内亚',lat:1.6508,lng:10.2679},{name:'加蓬',lat:-0.8037,lng:11.6094},
  {name:'刚果(布)',lat:-0.2280,lng:15.8277},{name:'刚果(金)',lat:-4.0383,lng:21.7587},
  {name:'圣多美和普林西比',lat:0.1864,lng:6.6131},{name:'中非',lat:6.6111,lng:20.9394},
  {name:'厄立特里亚',lat:15.1794,lng:39.7823},{name:'埃塞俄比亚',lat:9.1450,lng:40.4897},
  {name:'索马里',lat:5.1521,lng:46.1996},{name:'吉布提',lat:11.8251,lng:42.5903},
  {name:'肯尼亚',lat:-0.0236,lng:37.9062},{name:'乌干达',lat:1.3733,lng:32.2903},
  {name:'卢旺达',lat:-1.9403,lng:29.8739},{name:'布隆迪',lat:-3.3731,lng:29.9189},
  {name:'坦桑尼亚',lat:-6.3690,lng:34.8888},{name:'安哥拉',lat:-11.2027,lng:17.8739},
  {name:'赞比亚',lat:-13.1339,lng:27.8493},{name:'马拉维',lat:-13.2543,lng:34.3015},
  {name:'莫桑比克',lat:-18.6657,lng:35.5296},{name:'津巴布韦',lat:-19.0154,lng:29.1549},
  {name:'博茨瓦纳',lat:-22.3285,lng:24.6849},{name:'纳米比亚',lat:-22.9576,lng:18.4904},
  {name:'南非',lat:-30.5595,lng:22.9375},{name:'斯威士兰',lat:-26.5225,lng:31.4659},
  {name:'莱索托',lat:-29.6099,lng:28.2336},{name:'马达加斯加',lat:-18.7669,lng:46.8691},
  {name:'毛里求斯',lat:-20.3484,lng:57.5522},{name:'科摩罗',lat:-11.8750,lng:43.8722},
  {name:'佛得角',lat:16.0021,lng:-24.0132},
  {name:'英国',lat:55.3781,lng:-3.4360},{name:'法国',lat:46.2276,lng:2.2137},
  {name:'德国',lat:51.1657,lng:10.4515},{name:'意大利',lat:41.8719,lng:12.5674},
  {name:'西班牙',lat:40.4637,lng:-3.7492},{name:'葡萄牙',lat:39.3999,lng:-8.2245},
  {name:'希腊',lat:39.0742,lng:21.8243},{name:'挪威',lat:60.4720,lng:8.4689},
  {name:'瑞典',lat:60.1282,lng:18.6435},{name:'芬兰',lat:61.9241,lng:25.7482},
  {name:'波兰',lat:51.9194,lng:19.1451},{name:'乌克兰',lat:48.3794,lng:31.1656},
  {name:'俄罗斯',lat:61.5240,lng:105.3188},{name:'荷兰',lat:52.1326,lng:5.2913},
  {name:'比利时',lat:50.5039,lng:4.4699},{name:'卢森堡',lat:49.8153,lng:6.1296},
  {name:'瑞士',lat:46.8182,lng:8.2275},{name:'奥地利',lat:47.5162,lng:14.5501},
  {name:'匈牙利',lat:47.1625,lng:19.5033},{name:'捷克',lat:49.8175,lng:15.4730},
  {name:'斯洛伐克',lat:48.6690,lng:19.6990},{name:'罗马尼亚',lat:45.9432,lng:24.9668},
  {name:'保加利亚',lat:42.7339,lng:25.4858},{name:'塞尔维亚',lat:44.0165,lng:21.0059},
  {name:'克罗地亚',lat:45.1000,lng:15.2000},{name:'斯洛文尼亚',lat:46.1512,lng:14.9955},
  {name:'波黑',lat:43.9159,lng:17.6791},{name:'北马其顿',lat:41.6086,lng:21.7453},
  {name:'阿尔巴尼亚',lat:41.1533,lng:20.1683},{name:'黑山',lat:42.7087,lng:19.3744},
  {name:'科索沃',lat:42.6026,lng:20.9030},{name:'摩尔多瓦',lat:47.4116,lng:28.3699},
  {name:'立陶宛',lat:55.1694,lng:23.8813},{name:'拉脱维亚',lat:56.8796,lng:24.6032},
  {name:'爱沙尼亚',lat:58.5953,lng:25.0136},{name:'白俄罗斯',lat:53.7098,lng:27.9534},
  {name:'冰岛',lat:64.9631,lng:-19.0208},{name:'爱尔兰',lat:53.1424,lng:-7.6921},
  {name:'丹麦',lat:56.2639,lng:9.5018},{name:'马耳他',lat:35.9375,lng:14.3754},
  {name:'摩纳哥',lat:43.7500,lng:7.4167},{name:'安道尔',lat:42.5462,lng:1.6016},
  {name:'列支敦士登',lat:47.1660,lng:9.5554},{name:'圣马力诺',lat:43.9424,lng:12.4578},
  {name:'梵蒂冈',lat:41.9029,lng:12.4534},
  {name:'加拿大',lat:56.1304,lng:-106.3468},{name:'美国',lat:37.0902,lng:-95.7129},
  {name:'墨西哥',lat:23.6345,lng:-102.5528},{name:'危地马拉',lat:15.7835,lng:-90.2308},
  {name:'伯利兹',lat:17.1899,lng:-88.4976},{name:'洪都拉斯',lat:15.2000,lng:-86.2419},
  {name:'萨尔瓦多',lat:13.7942,lng:-88.8965},{name:'尼加拉瓜',lat:12.8654,lng:-85.2072},
  {name:'哥斯达黎加',lat:9.7489,lng:-83.7534},{name:'巴拿马',lat:8.5380,lng:-80.7822},
  {name:'古巴',lat:21.5218,lng:-77.7812},{name:'牙买加',lat:18.1096,lng:-77.2975},
  {name:'海地',lat:18.9712,lng:-72.2852},{name:'多米尼加',lat:18.7357,lng:-70.1627},
  {name:'特立尼达和多巴哥',lat:10.6918,lng:-61.2225},{name:'巴巴多斯',lat:13.1939,lng:-59.5432},
  {name:'巴哈马',lat:25.0343,lng:-77.3963},{name:'安提瓜和巴布达',lat:17.0608,lng:-61.7964},
  {name:'圣卢西亚',lat:13.9094,lng:-60.9789},{name:'格林纳达',lat:12.1165,lng:-61.6790},
  {name:'圣文森特和格林纳丁斯',lat:12.9843,lng:-61.2872},{name:'多米尼克',lat:15.4150,lng:-61.3710},
  {name:'圣基茨和尼维斯',lat:17.3578,lng:-62.7830},
  {name:'哥伦比亚',lat:4.5709,lng:-74.2973},{name:'委内瑞拉',lat:6.4238,lng:-66.5897},
  {name:'圭亚那',lat:4.8604,lng:-58.9302},{name:'苏里南',lat:3.9193,lng:-56.0278},
  {name:'厄瓜多尔',lat:-1.8312,lng:-78.1834},{name:'秘鲁',lat:-9.1900,lng:-75.0152},
  {name:'巴西',lat:-14.2350,lng:-51.9253},{name:'玻利维亚',lat:-16.2902,lng:-63.5887},
  {name:'巴拉圭',lat:-23.4425,lng:-58.4438},{name:'智利',lat:-35.6751,lng:-71.5430},
  {name:'阿根廷',lat:-38.4161,lng:-63.6167},{name:'乌拉圭',lat:-32.5228,lng:-55.7658},
  {name:'澳大利亚',lat:-25.2744,lng:133.7751},{name:'新西兰',lat:-40.9006,lng:174.8860},
  {name:'巴布亚新几内亚',lat:-6.3149,lng:143.9555},{name:'斐济',lat:-17.7134,lng:178.0650},
  {name:'所罗门群岛',lat:-9.6457,lng:160.1562},{name:'瓦努阿图',lat:-15.3767,lng:166.9592},
  {name:'萨摩亚',lat:-13.7590,lng:-172.1046},{name:'汤加',lat:-21.1787,lng:-175.1982},
  {name:'基里巴斯',lat:1.8707,lng:173.0171},{name:'图瓦卢',lat:-7.1095,lng:177.6493},
  {name:'瑙鲁',lat:-0.5228,lng:166.9315},{name:'帕劳',lat:7.5149,lng:134.5825},
  {name:'密克罗尼西亚',lat:6.8874,lng:158.2151},{name:'马绍尔群岛',lat:7.1315,lng:171.1845}
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

async function renderMainPage() {
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
  await loadCategoriesAndInitTabs();
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

  L.tileLayer('/tiles/osm/{z}/{x}/{y}.png', {
    minZoom: 2,
    maxZoom: 2
  }).addTo(map);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 3,
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

  let mapCenter = [30, 120];
  let mapZoom = 2;
  let minZoom = 2;
  let maxZoom = 8;
  let tileType = 'hybrid';
  let tileUrl = '';
  let tileSd = '';
  let crsType = 'epsg3857';
  let bounds = null;

  const selectedSubs = appState.currentSubConfigs || [];
  const firstSelectedCode = appState.selectedSubCodes[0];
  const subConfig = selectedSubs.find(s => s.code === firstSelectedCode);

  if (subConfig) {
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
    worldCopyJump: crsType !== 'simple'
  };
  if (crsType === 'simple') {
    mapOptions.crs = L.CRS.Simple;
  }

  appState.map = L.map('map', mapOptions);

  addTileLayersToMap(appState.map, tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds);

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

function addTileLayersToMap(map, tileType = 'hybrid', customUrl = '', customSd = 'a,b,c', minZoom = 2, maxZoom = 8, crsType = 'epsg3857', bounds = null) {
  const sdArr = customSd ? customSd.split(',').map(s => s.trim()).filter(Boolean) : ['1','2','3','4'];

  if (crsType === 'simple' && bounds) {
    try {
      map.setMaxBounds(bounds);
    } catch(e) {}
  }

  if (tileType === 'custom' && customUrl) {
    const tileOptions = {
      subdomains: sdArr.length > 0 ? sdArr : undefined,
      minZoom: minZoom,
      maxZoom: maxZoom,
      noWrap: true
    };
    if (bounds) {
      tileOptions.bounds = bounds;
    }
    L.tileLayer(customUrl, tileOptions).addTo(map);
    if (bounds && crsType === 'simple') {
      try {
        map.fitBounds(bounds, { animate: false });
      } catch(e) {}
    }
    return;
  }

  if (tileType === 'osm') {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: ['a','b','c'],
      minZoom: minZoom,
      maxZoom: maxZoom,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    return;
  }

  if (tileType === 'amap_street') {
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: minZoom,
      maxZoom: maxZoom,
      attribution: '&copy; 高德地图'
    }).addTo(map);
    return;
  }

  if (tileType === 'amap_satellite') {
    L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: minZoom,
      maxZoom: maxZoom,
      attribution: '&copy; 高德卫星'
    }).addTo(map);
    L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: Math.max(minZoom, 3),
      maxZoom: maxZoom
    }).addTo(map);
    return;
  }

  L.tileLayer('/tiles/osm/{z}/{x}/{y}.png', {
    minZoom: minZoom,
    maxZoom: Math.min(maxZoom, 2)
  }).addTo(map);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: Math.max(minZoom, 3),
    maxZoom: maxZoom,
    attribution: '&copy; 高德地图'
  }).addTo(map);
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
    <img src="${src}" class="image-viewer-img" alt="放大查看">
    <div class="image-viewer-hint">点击图片关闭</div>
  `;
  document.body.appendChild(viewer);

  const closeViewer = () => {
    viewer.classList.add('fade-out');
    setTimeout(() => viewer.remove(), 200);
  };

  viewer.querySelector('.image-viewer-overlay').addEventListener('click', closeViewer);
  viewer.querySelector('.image-viewer-img').addEventListener('click', closeViewer);
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
  const isPreciseLocation = result.precise_location === true;
  const isPreciseTime = result.precise_time === true;

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
            ${result.correct_tips ? `<div><span class="label">小贴士：</span><span class="value">${result.correct_tips}</span></div>` : ''}
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
