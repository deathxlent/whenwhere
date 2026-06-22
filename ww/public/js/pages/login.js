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
