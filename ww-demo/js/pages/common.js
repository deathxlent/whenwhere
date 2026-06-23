function createHeader(title, showBack = false, backAction = null) {
  const backBtn = showBack ? `<button class="back-btn" id="back-btn">← 返回</button>` : '';
  return `
    <div class="page-header">
      ${backBtn}
      <div class="page-title">${title}</div>
    </div>
  `;
}

function createBottomNav(currentPage = 'main') {
  const items = [
    { id: 'nav-main', icon: '🏠', label: '首页', page: 'main' },
    { id: 'nav-favorites', icon: '⭐', label: '收藏', page: 'favorites' },
    { id: 'nav-stats', icon: '📊', label: '统计', page: 'stats' },
    { id: 'nav-achievements', icon: '🏅', label: '成就', page: 'achievements' }
  ];
  
  return `
    <div class="bottom-nav">
      ${items.map(item => `
        <div class="nav-item ${currentPage === item.page ? 'active' : ''}" data-page="${item.page}">
          <div class="nav-icon">${item.icon}</div>
          <div class="nav-label">${item.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function initBottomNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateTo(page);
    });
  });
}

function navigateTo(page) {
  switch (page) {
    case 'main':
      renderMainPage();
      break;
    case 'favorites':
      renderFavoritesPage();
      break;
    case 'stats':
      renderStatsPage();
      break;
    case 'achievements':
      renderAchievementsPage();
      break;
  }
}

function showLoading() {
  return '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">加载中...</div>';
}

function showEmpty(message = '暂无数据') {
  return `<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.4);">${message}</div>`;
}
