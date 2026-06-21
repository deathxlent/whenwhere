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

init();
