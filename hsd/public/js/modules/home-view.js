window.HSD = window.HSD || {};

HSD.homeView = {
  async render(container) {
    const breadcrumb = document.getElementById('breadcrumb-text');
    if (breadcrumb) breadcrumb.textContent = '首页';
    HSD.mapCore.restoreLayout();

    const res = await API.get('/categories');
    if (res.success) HSD.state.categories = res.data;

    const cardsHtml = HSD.state.categories.map(cat => {
      const hasAvailable = (cat.available_sub_count || 0) > 0;
      return `
      <div class="home-category-card ${hasAvailable ? '' : 'inactive'}" data-id="${cat.id}" data-code="${cat.code}">
        <div class="home-category-card-header">
          <div>
            <div class="home-category-name">${escapeHtml(cat.name)}</div>
            <div style="font-size:12px;color:#718096;margin-top:4px;">${escapeHtml(cat.code)}</div>
          </div>
          <div class="home-category-icon">${HSD.homeView.getCategoryIcon(cat.code)}</div>
        </div>
        <div class="home-category-desc">${escapeHtml(cat.description || '暂无描述')}</div>
        <div class="home-category-stats">
          <div class="home-stat">
            <div class="home-stat-value">${cat.total_sub_count || 0}</div>
            <div class="home-stat-label">子类别数</div>
          </div>
          <div class="home-stat">
            <div class="home-stat-value" style="color:#38a169;">${cat.available_sub_count || 0}</div>
            <div class="home-stat-label">可用子类</div>
          </div>
          <div class="home-stat">
            <div class="home-stat-value" style="color:#718096;">${cat.total_event_count || 0}</div>
            <div class="home-stat-label">事件总数</div>
          </div>
        </div>
      </div>
    `}).join('');

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">📂 选择类别</h2>
        <div style="font-size:13px;color:#718096;">
          可用子类 = 已绑定地图 + 已有事件
        </div>
      </div>
      <div class="home-category-grid">${cardsHtml}</div>
    `;

    container.querySelectorAll('.home-category-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = HSD.state.categories.find(c => c.id == card.dataset.id);
        HSD.state.currentCategory = cat;
        if ((cat.available_sub_count || 0) > 0) {
          HSD.categoriesView.openForEditing(cat);
        } else {
          toast('该类别下暂无可用子类，请先在「类别管理」中绑定地图并添加事件', 'warning');
        }
      });
    });
  },

  getCategoryIcon(code) {
    const icons = {
      junior: '🏫',
      senior: '🎓',
      university: '🏛️',
      world: '🌍',
      china: '🇨🇳',
      ancient: '📜',
      modern: '🏭',
      war: '⚔️',
      culture: '🎨',
      science: '🔬',
      tech: '💻'
    };
    return icons[code] || '📁';
  }
};
