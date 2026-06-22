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
