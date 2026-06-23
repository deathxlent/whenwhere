function renderFavoritesPage() {
  cleanupGame();
  appState.currentPage = 'favorites';

  const favorites = getFavorites();
  const events = favorites.map(id => getEventById(id)).filter(Boolean).map(event => {
    return {
      ...event,
      start_display: formatTimestamp(event.start_ts, event.start_precision),
      end_display: event.end_ts ? formatTimestamp(event.end_ts, event.end_precision) : null
    };
  });

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
    renderFavoritesList(events, searchInput.value.trim());
  };
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(doSearch, 300);
  });
  document.getElementById('fav-search-btn').addEventListener('click', doSearch);

  renderFavoritesList(events, '');
}

function renderFavoritesList(items, keyword) {
  const listEl = document.getElementById('favorites-list');
  if (!listEl) return;

  let filtered = items;
  if (keyword) {
    filtered = items.filter(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.5);">${keyword ? '没有找到匹配的收藏事件' : '还没有收藏任何事件'}</div>`;
    return;
  }

  listEl.innerHTML = filtered.map(item => `
    <div class="favorite-card" data-event-id="${item.id}">
      <div class="fav-main-info">
        <div class="fav-title-row">
          <h3 class="fav-title">${escapeHtml(item.title)}</h3>
          <button class="icon-btn search-event-btn" title="用 Bing 搜索" data-title="${escapeHtml(item.title)}">🔍</button>
        </div>
        <div class="fav-meta">
          <span class="fav-category">[${escapeHtml(item.categoryName)}${item.subCategoryName ? ' / ' + escapeHtml(item.subCategoryName) : ''}]</span>
          <span class="fav-time">${escapeHtml(item.start_display || '-')}${item.end_display && item.end_display !== item.start_display ? ' ~ ' + escapeHtml(item.end_display) : ''}</span>
          <span class="fav-location">📍 ${escapeHtml(item.location_name || '未知')}</span>
        </div>
        ${item.description ? `<div class="fav-description">${escapeHtml(item.description)}</div>` : ''}
      </div>
      <div class="fav-actions">
        <button class="btn btn-default fav-view-btn" data-event-id="${item.id}" title="查看大家怎么答">👥 查看答题</button>
        <button class="btn btn-danger fav-unfav-btn" data-event-id="${item.id}" title="取消收藏">★ 已收藏</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.fav-unfav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const eventId = parseInt(e.currentTarget.dataset.eventId);
      toggleFavorite(eventId);
      const keyword = document.getElementById('fav-search-input').value.trim();
      const favorites = getFavorites();
      const events = favorites.map(id => getEventById(id)).filter(Boolean).map(event => {
        return {
          ...event,
          start_display: formatTimestamp(event.start_ts, event.start_precision),
          end_display: event.end_ts ? formatTimestamp(event.end_ts, event.end_precision) : null
        };
      });
      renderFavoritesList(events, keyword);
    });
  });

  listEl.querySelectorAll('.fav-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const eventId = parseInt(e.currentTarget.dataset.eventId);
      renderAnswersPage(eventId);
    });
  });

  listEl.querySelectorAll('.search-event-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const title = e.currentTarget.dataset.title;
      const query = encodeURIComponent(title);
      window.open(`https://www.bing.com/search?q=${query}`, '_blank');
    });
  });
}

function formatTimestamp(ts, precision) {
  if (!ts) return '-';
  const date = new Date(ts);
  const year = Math.abs(date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const isBC = ts < 0;
  const prefix = isBC ? '前' : '';

  if (precision === 0) {
    return `${prefix}${year}年`;
  } else if (precision === 1) {
    return `${prefix}${year}年${month}月`;
  } else {
    return `${prefix}${year}年${month}月${day}日`;
  }
}
