let state = {
  categories: [],
  maps: [],
  currentCategory: null,
  currentSubCategory: null,
  currentEvents: [],
  map: null,
  mapClickMarker: null,
  provinceLayer: null,
  admin1Labels: [],
  pendingImages: [],
  currentView: 'home'
};

function dateToTs(year, month, day, isBce) {
  let y = parseInt(year) || 0;
  if (isBce && y > 0) y = -y;
  const m = parseInt(month) || 1;
  const d = parseInt(day) || 1;
  if (y >= 0) {
    return y * 10000 + m * 100 + d;
  } else {
    return y * 10000 - m * 100 - d;
  }
}

function tsToYearMonthDay(ts) {
  if (ts === null || ts === undefined) return { year: '', month: '', day: '', isBce: false };
  const sign = ts < 0 ? -1 : 1;
  const absTs = Math.abs(ts);
  const day = absTs % 100;
  const rest = Math.floor(absTs / 100);
  const month = rest % 100;
  const year = Math.floor(rest / 100) * sign;
  return { year: Math.abs(year).toString(), month: month.toString(), day: day.toString(), isBce: year < 0 };
}

async function init() {
  try {
    const [catRes, mapRes] = await Promise.all([
      API.get('/categories'),
      API.get('/maps')
    ]);
    if (catRes.success) state.categories = catRes.data;
    if (mapRes.success) state.maps = mapRes.data;
    bindNavLinks();
    renderView('home');
  } catch (e) {
    toast('加载数据失败: ' + e.message, 'error');
  }
}

function bindNavLinks() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const view = link.dataset.view;
      if (state.map) { state.map.remove(); state.map = null; }
      renderView(view);
    });
  });
}

function renderView(view) {
  state.currentView = view;
  restoreLayout();
  if (view === 'home') renderHomeView();
  else if (view === 'categories') renderCategoriesView();
  else if (view === 'maps') renderMapsView();
}

async function renderHomeView() {
  setBreadcrumb('首页');
  const res = await API.get('/categories');
  if (res.success) state.categories = res.data;

  const cardsHtml = state.categories.map(cat => {
    const hasAvailable = (cat.available_sub_count || 0) > 0;
    return `
    <div class="home-category-card ${hasAvailable ? '' : 'inactive'}" data-id="${cat.id}" data-code="${cat.code}">
      <div class="home-category-card-header">
        <div>
          <div class="home-category-name">${escapeHtml(cat.name)}</div>
          <div style="font-size:12px;color:#718096;margin-top:4px;">${escapeHtml(cat.code)}</div>
        </div>
        <div class="home-category-icon">${getCategoryIcon(cat.code)}</div>
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

  document.getElementById('main-view').innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📂 选择类别</h2>
      <div style="font-size:13px;color:#718096;">
        可用子类 = 已绑定地图 + 已有事件
      </div>
    </div>
    <div class="home-category-grid">${cardsHtml}</div>
  `;

  document.querySelectorAll('.home-category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = state.categories.find(c => c.id == card.dataset.id);
      state.currentCategory = cat;
      if ((cat.available_sub_count || 0) > 0) {
        openCategoryForEditing(cat);
      } else {
        toast('该类别下暂无可用子类，请先在「类别管理」中绑定地图并添加事件', 'warning');
      }
    });
  });
}

function getCategoryIcon(code) {
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

function openCategoryForEditing(category) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('.nav-link[data-view="categories"]').classList.add('active');
  renderCategoriesView(category.id);
}

async function renderCategoriesView(selectedCategoryId = null) {
  setBreadcrumb('类别管理');

  const [catRes, mapRes] = await Promise.all([
    API.get('/categories'),
    API.get('/maps')
  ]);
  if (catRes.success) state.categories = catRes.data;
  if (mapRes.success) state.maps = mapRes.data;

  const listHtml = state.categories.map(cat => `
    <div class="category-list-item ${selectedCategoryId == cat.id ? 'selected' : ''}" data-id="${cat.id}">
      <div class="category-list-name">
        <span style="margin-right:8px;">${getCategoryIcon(cat.code)}</span>
        ${escapeHtml(cat.name)}
      </div>
      <div class="category-list-meta">${escapeHtml(cat.code)}</div>
      <div class="stats-row">
        <span class="stat-badge blue">${cat.total_sub_count || 0} 子类</span>
        <span class="stat-badge green">${cat.available_sub_count || 0} 可用</span>
        <span class="stat-badge gray">${cat.total_event_count || 0} 事件</span>
      </div>
    </div>
  `).join('');

  document.getElementById('main-view').innerHTML = `
    <div class="management-layout">
      <div class="sidebar-panel">
        <div class="panel-title">
          <span>大类别列表</span>
          <button class="btn btn-primary btn-sm" id="add-category-btn">+ 新增</button>
        </div>
        <div id="category-list-container">${listHtml}</div>
      </div>
      <div class="main-panel">
        <div id="category-detail-panel">
          ${selectedCategoryId ? '<div style="text-align:center;padding:40px;color:#718096;">加载中...</div>' :
            '<div style="text-align:center;padding:80px 20px;color:#a0aec0;"><div style="font-size:48px;margin-bottom:16px;">👈</div>请从左侧选择一个大类别</div>'}
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.category-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const cat = state.categories.find(c => c.id == item.dataset.id);
      state.currentCategory = cat;
      document.querySelectorAll('.category-list-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      loadCategoryDetail(cat);
    });
  });

  document.getElementById('add-category-btn').addEventListener('click', openAddCategoryModal);

  if (selectedCategoryId) {
    const cat = state.categories.find(c => c.id == selectedCategoryId);
    if (cat) loadCategoryDetail(cat);
  }
}

async function loadCategoryDetail(category) {
  const panel = document.getElementById('category-detail-panel');
  panel.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">加载中...</div>';

  const res = await API.get(`/categories/${category.id}/sub-categories`);
  if (!res.success) {
    panel.innerHTML = '<div style="text-align:center;padding:40px;color:#e53e3e;">加载失败</div>';
    return;
  }

  const subs = res.data;
  const subCards = subs.map(sub => {
    const hasMap = sub.map_id != null;
    const hasEvents = (sub.event_count || 0) > 0;
    const isAvailable = hasMap && hasEvents;
    const borderClass = hasMap ? (hasEvents ? 'has-events' : 'has-map') : '';

    return `
    <div class="subcategory-card ${borderClass}" data-id="${sub.id}">
      <div class="subcategory-header">
        <div>
          <div class="subcategory-name">
            ${isAvailable ? '<span class="status-dot green"></span>' : '<span class="status-dot gray"></span>'}
            ${escapeHtml(sub.name)}
            <span style="font-size:12px;color:#718096;font-weight:normal;margin-left:8px;">(${escapeHtml(sub.code)})</span>
          </div>
          <div style="margin-top:4px;font-size:12px;color:#718096;">
            ${hasMap ? `🗺️ ${escapeHtml(sub.map_name || '未知地图')}` : '⚠️ 未绑定地图'}
            &nbsp;|&nbsp;
            ${hasEvents ? `📋 ${sub.event_count} 个事件` : '⚠️ 暂无事件'}
          </div>
        </div>
        <div class="subcategory-actions">
          ${hasMap ? `<button class="btn btn-default btn-sm" data-action="events" data-id="${sub.id}">📋 事件</button>` : ''}
          <button class="btn btn-default btn-sm" data-action="edit" data-id="${sub.id}">✏️ 编辑</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${sub.id}">🗑️</button>
        </div>
      </div>
      ${hasMap ? `
        <div class="subcategory-info">
          <div class="info-item">
            <span class="info-label">中心点:</span>
            <span class="info-value">(${Number(sub.center_lat || 0).toFixed(4)}, ${Number(sub.center_lng || 0).toFixed(4)})</span>
          </div>
          <div class="info-item">
            <span class="info-label">瓦片类型:</span>
            <span class="info-value">${getTileTypeName(sub.map_tile_type)}</span>
          </div>
        </div>
        <div class="zoom-info">
          缩放: 默认 ${sub.default_zoom || 2} &nbsp;|&nbsp; 范围 ${sub.min_zoom || 0} - ${sub.max_zoom || 18}
        </div>
      ` : ''}
    </div>
  `}).join('');

  panel.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">${escapeHtml(category.name)} <span style="font-size:14px;color:#718096;font-weight:normal;">(${escapeHtml(category.code)})</span></h2>
        <p style="color:#718096;margin-top:8px;font-size:13px;">${escapeHtml(category.description || '暂无描述')}</p>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-default" id="edit-cat-btn">✏️ 编辑类别</button>
        <button class="btn btn-danger" id="delete-cat-btn" title="删除整个大类别（包括所有子类和事件）">⚠️ 删除大类</button>
        <button class="btn btn-primary" id="add-sub-btn">+ 添加子类别</button>
      </div>
    </div>
    <div id="subcategory-container">
      ${subs.length === 0 ?
        `<div class="empty-subs">
          <div style="font-size:40px;margin-bottom:12px;">📂</div>
          <h3>暂无子类别</h3>
          <p style="margin-top:8px;font-size:13px;">点击右上角「+ 添加子类别」来创建</p>
        </div>` : subCards}
    </div>
  `;

  document.getElementById('add-sub-btn').addEventListener('click', () => openSubCategoryModal(null, category.id));
  document.getElementById('edit-cat-btn').addEventListener('click', () => openCategoryModal(category));
  document.getElementById('delete-cat-btn').addEventListener('click', () => confirmDeleteCategory(category));

  panel.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = subs.find(s => s.id == btn.dataset.id);
      if (sub) openSubCategoryModal(sub, category.id);
    });
  });

  panel.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = subs.find(s => s.id == btn.dataset.id);
      if (sub) confirmDeleteSubCategory(sub, category);
    });
  });

  panel.querySelectorAll('[data-action="events"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = subs.find(s => s.id == btn.dataset.id);
      if (sub) {
        state.currentSubCategory = sub;
        setBreadcrumb(`类别管理 / ${category.name} / ${sub.name} / 事件列表`);
        renderEventList();
      }
    });
  });
}

function getTileTypeName(type) {
  const map = {
    osm: 'OSM标准',
    amap_street: '高德街道',
    amap_satellite: '高德卫星',
    hybrid: '混合图层',
    custom: '自定义'
  };
  return map[type] || (type || '未知');
}

function openAddCategoryModal() {
  openCategoryModal(null);
}

function openCategoryModal(category = null) {
  const isEdit = category != null;
  const html = `
    <div class="modal-overlay" id="cat-modal">
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <div class="modal-title">${isEdit ? '编辑' : '添加'}大类别</div>
          <button class="modal-close" onclick="document.getElementById('cat-modal').remove();">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div>
              <label class="form-label">类别名称 *</label>
              <input class="form-control" id="cat-name" value="${isEdit ? escapeHtml(category.name) : ''}" placeholder="如：初中历史">
            </div>
            <div>
              <label class="form-label">类别代码 *</label>
              <input class="form-control" id="cat-code" value="${isEdit ? escapeHtml(category.code) : ''}" placeholder="如：junior（英文唯一标识）" ${isEdit ? 'readonly' : ''}>
            </div>
          </div>
          <div class="form-grid" style="margin-top:14px;">
            <div style="grid-column:span 2;">
              <label class="form-label">描述</label>
              <textarea class="form-control" id="cat-desc" rows="2" placeholder="简短描述">${isEdit ? escapeHtml(category.description || '') : ''}</textarea>
            </div>
            <div>
              <label class="form-label">排序</label>
              <input class="form-control" type="number" id="cat-sort" value="${isEdit ? (category.sort_order || 0) : 0}">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" onclick="document.getElementById('cat-modal').remove();">取消</button>
          <button class="btn btn-primary" id="save-cat-btn">保存</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('save-cat-btn').addEventListener('click', async () => {
    const name = document.getElementById('cat-name').value.trim();
    const code = document.getElementById('cat-code').value.trim();
    const description = document.getElementById('cat-desc').value.trim() || null;
    const sort_order = parseInt(document.getElementById('cat-sort').value) || 0;

    if (!name || !code) { toast('请填写名称和代码', 'error'); return; }

    let res;
    if (isEdit) {
      res = await API.put(`/categories/${category.id}`, { name, description, sort_order });
    } else {
      res = await API.post('/categories', { name, code, description, sort_order });
    }

    if (res.success) {
      toast(res.message, 'success');
      document.getElementById('cat-modal').remove();
      renderCategoriesView(isEdit ? category.id : res.data?.id);
    } else {
      toast(res.message, 'error');
    }
  });
}

function confirmDeleteCategory(category) {
  confirmDialog(`⚠️ 确定要删除大类别「${category.name}」吗？`, async () => {
    const res = await API.delete(`/categories/${category.id}`);
    if (res.success) {
      toast(res.message, 'success');
      renderCategoriesView();
    } else {
      toast(res.message, 'error');
    }
  }, '此操作是【删除整个大类别】，同时会禁用该大类下所有关联的子类别和事件，数据不可恢复，请谨慎操作！');
}

function confirmDeleteSubCategory(sub, category) {
  confirmDialog(`确定要删除子类别「${sub.name}」吗？`, async () => {
    const res = await API.delete(`/categories/${category.id}/sub-categories/${sub.id}`);
    if (res.success) {
      toast(res.message, 'success');
      loadCategoryDetail(category);
    } else {
      toast(res.message, 'error');
    }
  }, '该操作将同时删除所有关联的事件，无法撤销');
}

async function openSubCategoryModal(sub = null, categoryId) {
  const isEdit = sub != null;
  const mapOptions = state.maps.map(m =>
    `<option value="${m.id}" ${(sub?.map_id || '') == m.id ? 'selected' : ''}>
      ${escapeHtml(m.name)} (${escapeHtml(m.code)}) - 缩放:${m.min_zoom || 0}-${m.max_zoom || 18}
    </option>`
  ).join('');

  const html = `
    <div class="modal-overlay" id="sub-modal">
      <div class="modal" style="max-width:650px;max-height:90vh;overflow-y:auto;">
        <div class="modal-header">
          <div class="modal-title">${isEdit ? '编辑' : '添加'}子类别</div>
          <button class="modal-close" onclick="document.getElementById('sub-modal').remove();">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div>
              <label class="form-label">子类别名称 *</label>
              <input class="form-control" id="sub-name" value="${isEdit ? escapeHtml(sub.name) : ''}" placeholder="如：中国古代史">
            </div>
            <div>
              <label class="form-label">子类别代码 *</label>
              <input class="form-control" id="sub-code" value="${isEdit ? escapeHtml(sub.code) : ''}" placeholder="如：ancient_china（英文唯一）" ${isEdit ? 'readonly' : ''}>
            </div>
          </div>
          <div style="margin-top:14px;">
            <label class="form-label">绑定地图 *</label>
            <div class="select-wrapper">
              <select class="form-control" id="sub-map-id">
                <option value="">-- 请选择地图 --</option>
                ${mapOptions}
              </select>
            </div>
            <div style="font-size:12px;color:#718096;margin-top:4px;">⚠️ 子类别必须绑定地图才能使用</div>
          </div>
          <div style="margin-top:14px;padding:14px;background:#f7fafc;border-radius:8px;">
            <div style="font-weight:600;color:#2d3748;margin-bottom:10px;">📍 显示设置（ww中默认）</div>
            <div class="form-grid">
              <div>
                <label class="form-label">中心点 纬度</label>
                <input class="form-control" type="number" step="0.000001" id="sub-center-lat" value="${isEdit && sub.center_lat != null ? sub.center_lat : 0}">
              </div>
              <div>
                <label class="form-label">中心点 经度</label>
                <input class="form-control" type="number" step="0.000001" id="sub-center-lng" value="${isEdit && sub.center_lng != null ? sub.center_lng : 0}">
              </div>
              <div>
                <label class="form-label">默认缩放</label>
                <input class="form-control" type="number" min="0" max="18" id="sub-default-zoom" value="${isEdit && sub.default_zoom != null ? sub.default_zoom : 2}">
              </div>
              <div>
                <label class="form-label">最小缩放</label>
                <input class="form-control" type="number" min="0" max="18" id="sub-min-zoom" value="${isEdit && sub.min_zoom != null ? sub.min_zoom : 2}">
              </div>
              <div>
                <label class="form-label">最大缩放</label>
                <input class="form-control" type="number" min="0" max="18" id="sub-max-zoom" value="${isEdit && sub.max_zoom != null ? sub.max_zoom : 8}">
              </div>
              <div>
                <label class="form-label">排序</label>
                <input class="form-control" type="number" id="sub-sort" value="${isEdit ? (sub.sort_order || 0) : 0}">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" onclick="document.getElementById('sub-modal').remove();">取消</button>
          <button class="btn btn-primary" id="save-sub-btn">保存</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  document.getElementById('save-sub-btn').addEventListener('click', async () => {
    const name = document.getElementById('sub-name').value.trim();
    const code = document.getElementById('sub-code').value.trim();
    const map_id = document.getElementById('sub-map-id').value || null;
    const center_lat = parseFloat(document.getElementById('sub-center-lat').value);
    const center_lng = parseFloat(document.getElementById('sub-center-lng').value);
    const default_zoom = parseInt(document.getElementById('sub-default-zoom').value);
    const min_zoom = parseInt(document.getElementById('sub-min-zoom').value);
    const max_zoom = parseInt(document.getElementById('sub-max-zoom').value);
    const sort_order = parseInt(document.getElementById('sub-sort').value) || 0;

    if (!name || !code) { toast('请填写名称和代码', 'error'); return; }
    if (!map_id) { toast('请选择绑定的地图', 'error'); return; }
    if (isNaN(center_lat) || isNaN(center_lng)) { toast('中心点格式错误', 'error'); return; }

    const data = {
      name, code, map_id: parseInt(map_id),
      center_lat, center_lng, default_zoom, min_zoom, max_zoom, sort_order
    };

    let res;
    if (isEdit) {
      res = await API.put(`/categories/${categoryId}/sub-categories/${sub.id}`, data);
    } else {
      res = await API.post(`/categories/${categoryId}/sub-categories`, data);
    }

    if (res.success) {
      toast(res.message, 'success');
      document.getElementById('sub-modal').remove();
      loadCategoryDetail(state.categories.find(c => c.id == categoryId));
    } else {
      toast(res.message, 'error');
    }
  });
}

async function renderMapsView() {
  setBreadcrumb('地图管理');
  restoreLayout();

  const res = await API.get('/maps');
  if (res.success) state.maps = res.data;

  const cardsHtml = state.maps.map(map => {
    const isBound = (map.bind_count || 0) > 0;
    const bindSubsHtml = (map.bind_subs && map.bind_subs.length > 0) ?
      `<div class="map-bind-subs">
        <div class="bind-subs-title">🔗 已绑定的子类：</div>
        <div class="bind-subs-list">
          ${map.bind_subs.map(s => `<span class="bind-sub-tag">${escapeHtml(s.category_name)} / ${escapeHtml(s.name)}</span>`).join('')}
        </div>
      </div>` : '';

    return `
    <div class="map-card ${isBound ? 'map-card-bound' : ''}" data-id="${map.id}">
      <div class="map-preview">🗺️</div>
      <div class="map-card-header">
        <div>
          <div class="map-card-name">${escapeHtml(map.name)}</div>
          <div style="margin-top:4px;"><span class="map-card-code">${escapeHtml(map.code)}</span></div>
        </div>
        ${isBound ? '<span class="bound-tag">🔒 已绑定</span>' : '<span class="free-tag">✓ 可编辑</span>'}
      </div>
      <div class="map-card-desc">${escapeHtml(map.description || '暂无描述')}</div>
      <div class="map-card-meta">
        <span>🧩 ${getTileTypeName(map.tile_type)}</span>
        <span>🔍 缩放:${map.min_zoom || 0}-${map.max_zoom || 18}</span>
        <span>🔗 绑定:${map.bind_count || 0} 个子类</span>
      </div>
      ${bindSubsHtml}
      <div class="map-card-actions">
        <button class="btn btn-default btn-sm" data-action="view" data-id="${map.id}">👁️ 查看</button>
        <button class="btn btn-default btn-sm" data-action="edit" data-id="${map.id}" ${isBound ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>✏️ 编辑</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${map.id}" ${isBound ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>🗑️</button>
      </div>
    </div>
  `}).join('');

  document.getElementById('main-view').innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🗺️ 地图管理</h2>
      <button class="btn btn-primary" id="add-map-btn">+ 新增地图</button>
    </div>
    <div class="info-panel" style="margin-bottom:16px;background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:16px;">
      <div style="font-weight:600;color:#2c5282;margin-bottom:10px;">📖 地图配置规范与说明</div>
      <div style="color:#2d3748;font-size:13px;line-height:1.8;">
        <div><strong>一、瓦片类型说明：</strong></div>
        <div>• <strong>🌐 OSM标准</strong>：开源地图，需外网访问</div>
        <div>• <strong>🛣️ 高德街道</strong>：国内常用街道图，需外网访问高德API</div>
        <div>• <strong>🛰️ 高德卫星</strong>：卫星影像图，需外网访问高德API</div>
        <div>• <strong>🎯 混合(推荐)</strong>：本地OSM瓦片(缩放2-3) + 高德街道(缩放4+)，兼顾离线可用和清晰度</div>
        <div>• <strong>⚙️ 自定义</strong>：自定义瓦片URL，适合特殊历史地图、中东史等定制地图</div>
        <div style="margin-top:10px;"><strong>二、如何添加「中东史」等自定义地图：</strong></div>
        <div>1. 点击右上角「+ 新增地图」按钮</div>
        <div>2. 填写地图代码（如：middle_east）、名称（如：中东地图）</div>
        <div>3. 选择瓦片类型：推荐「🎯 混合」用于通用区域地图</div>
        <div>4. 如需特定历史地图瓦片，选择「⚙️ 自定义」并填写瓦片URL模板（格式：https://{s}.domain.com/{z}/{x}/{y}.png）</div>
        <div>5. 设置合适的缩放范围（建议min=2, max=8~12）和排序</div>
        <div>6. 保存后，到「类别管理」中给对应子类绑定此新地图</div>
        <div style="margin-top:10px;"><strong>三、注意事项：</strong></div>
        <div>• 地图一旦被子类绑定则无法直接编辑/删除，需先解除所有子类的绑定才能修改</div>
        <div>• 建议设置合理的中心点（经纬度）和默认缩放级别，提升用户体验</div>
        <div>• 自定义瓦片服务需确保CORS跨域配置正确</div>
      </div>
    </div>
    <div style="margin-bottom:20px;padding:14px;background:#fff5f5;border-radius:8px;color:#742a2a;font-size:13px;">
      ⚠️ <strong>注意：</strong>已有子类别绑定的地图无法编辑和删除，需要先解除绑定才能操作。
    </div>
    <div class="three-col-grid">${cardsHtml || '<div style="grid-column:span 3;text-align:center;padding:60px;color:#a0aec0;"><div style="font-size:48px;margin-bottom:16px;">🗺️</div>暂无地图，点击右上角「+ 新增地图」</div>'}</div>
  `;

  document.getElementById('add-map-btn').addEventListener('click', () => openMapModal(null));

  document.querySelectorAll('[data-action="view"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = state.maps.find(x => x.id == btn.dataset.id);
      if (m) openMapModal(m, true);
    });
  });

  document.querySelectorAll('[data-action="edit"]').forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => {
      const m = state.maps.find(x => x.id == btn.dataset.id);
      if (m) openMapModal(m, false);
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    if (btn.disabled) return;
    btn.addEventListener('click', () => {
      const m = state.maps.find(x => x.id == btn.dataset.id);
      if (m) confirmDeleteMap(m);
    });
  });
}

function confirmDeleteMap(map) {
  confirmDialog(`确定要删除地图「${map.name}」吗？`, async () => {
    const res = await API.delete(`/maps/${map.id}`);
    if (res.success) {
      toast(res.message, 'success');
      renderMapsView();
    } else {
      toast(res.message, 'error');
    }
  });
}

function openMapModal(map = null, isViewOnly = false) {
  const isEdit = map != null && !isViewOnly;
  const mode = isViewOnly ? '查看' : (isEdit ? '编辑' : '添加');
  const disabled = isViewOnly ? 'disabled' : '';
  const tileType = map?.tile_type || 'hybrid';

  const html = `
    <div class="modal-overlay" id="map-modal">
      <div class="modal" style="max-width:650px;max-height:90vh;overflow-y:auto;">
        <div class="modal-header">
          <div class="modal-title">${mode}地图</div>
          <button class="modal-close" onclick="document.getElementById('map-modal').remove();">&times;</button>
        </div>
        <div class="modal-body">
          ${(map && (map.bind_count || 0) > 0 && !isViewOnly) ?
            `<div class="disabled-hint">⚠️ 该地图已绑定 ${map.bind_count} 个子类别，只能编辑名称、描述、排序，其他字段无法修改</div>` : ''}
          ${isViewOnly ? `<div class="disabled-hint" style="background:#ebf8ff;color:#2c5282;">🔍 查看模式，内容不可编辑</div>` : ''}
          <div class="form-grid">
            <div>
              <label class="form-label">地图名称 *</label>
              <input class="form-control" id="map-name" value="${map ? escapeHtml(map.name) : ''}" placeholder="如：世界地图" ${disabled}>
            </div>
            <div>
              <label class="form-label">地图代码 *</label>
              <input class="form-control" id="map-code" value="${map ? escapeHtml(map.code) : ''}" placeholder="如：world（英文唯一）" ${isEdit || isViewOnly ? 'readonly' : ''}>
            </div>
          </div>
          <div style="margin-top:14px;">
            <label class="form-label">描述</label>
            <textarea class="form-control" id="map-desc" rows="2" ${disabled}>${map ? escapeHtml(map.description || '') : ''}</textarea>
          </div>
          <div style="margin-top:14px;">
            <label class="form-label">瓦片类型</label>
            <div class="tile-type-options" id="tile-type-options">
              <div class="tile-type-option ${tileType === 'osm' ? 'selected' : ''}" data-type="osm">🌐 OSM标准</div>
              <div class="tile-type-option ${tileType === 'amap_street' ? 'selected' : ''}" data-type="amap_street">🛣️ 高德街道</div>
              <div class="tile-type-option ${tileType === 'amap_satellite' ? 'selected' : ''}" data-type="amap_satellite">🛰️ 高德卫星</div>
              <div class="tile-type-option ${tileType === 'hybrid' ? 'selected' : ''}" data-type="hybrid">🎯 混合(推荐)</div>
              <div class="tile-type-option ${tileType === 'custom' ? 'selected' : ''}" data-type="custom">⚙️ 自定义</div>
            </div>
          </div>
          <div class="form-grid" style="margin-top:14px;">
            <div>
              <label class="form-label">最小缩放</label>
              <input class="form-control" type="number" min="0" max="18" id="map-min-zoom" value="${map ? (map.min_zoom || 0) : 2}" ${disabled}>
            </div>
            <div>
              <label class="form-label">最大缩放</label>
              <input class="form-control" type="number" min="0" max="18" id="map-max-zoom" value="${map ? (map.max_zoom || 18) : 8}" ${disabled}>
            </div>
            <div>
              <label class="form-label">排序</label>
              <input class="form-control" type="number" id="map-sort" value="${map ? (map.sort_order || 0) : 0}">
            </div>
          </div>
          <div id="custom-tile-fields" style="margin-top:14px;display:${tileType === 'custom' ? '' : 'none'};">
            <div style="font-weight:600;color:#2d3748;margin-bottom:8px;">⚙️ 自定义瓦片配置</div>
            <div class="form-grid">
              <div style="grid-column:span 2;">
                <label class="form-label">瓦片URL模板</label>
                <input class="form-control" id="map-tile-url" value="${map && map.tile_url ? escapeHtml(map.tile_url) : ''}" placeholder="https://{s}.tile.example.com/{z}/{x}/{y}.png" ${disabled}>
              </div>
              <div>
                <label class="form-label">子域名（逗号分隔）</label>
                <input class="form-control" id="map-tile-sd" value="${map && map.tile_subdomains ? escapeHtml(map.tile_subdomains) : 'a,b,c'}" placeholder="a,b,c" ${disabled}>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" onclick="document.getElementById('map-modal').remove();">关闭</button>
          ${!isViewOnly ? '<button class="btn btn-primary" id="save-map-btn">保存</button>' : ''}
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  let selectedTileType = tileType;
  document.querySelectorAll('#tile-type-options .tile-type-option').forEach(opt => {
    if (isViewOnly || (map && (map.bind_count || 0) > 0)) return;
    opt.addEventListener('click', () => {
      document.querySelectorAll('#tile-type-options .tile-type-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedTileType = opt.dataset.type;
      document.getElementById('custom-tile-fields').style.display = selectedTileType === 'custom' ? '' : 'none';
    });
  });

  const saveBtn = document.getElementById('save-map-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const name = document.getElementById('map-name').value.trim();
      const code = document.getElementById('map-code').value.trim();
      const description = document.getElementById('map-desc').value.trim() || null;
      const min_zoom = parseInt(document.getElementById('map-min-zoom').value) || 0;
      const max_zoom = parseInt(document.getElementById('map-max-zoom').value) || 18;
      const sort_order = parseInt(document.getElementById('map-sort').value) || 0;
      let tile_url = document.getElementById('map-tile-url').value.trim() || null;
      let tile_subdomains = document.getElementById('map-tile-sd').value.trim() || null;

      if (!name || !code) { toast('请填写名称和代码', 'error'); return; }

      const data = { name, code, description, tile_type: selectedTileType, min_zoom, max_zoom, sort_order };
      if (selectedTileType === 'custom') {
        data.tile_url = tile_url;
        data.tile_subdomains = tile_subdomains;
      }

      let res;
      if (isEdit) {
        res = await API.put(`/maps/${map.id}`, data);
      } else {
        res = await API.post('/maps', data);
      }

      if (res.success) {
        toast(res.message, 'success');
        document.getElementById('map-modal').remove();
        renderMapsView();
      } else {
        toast(res.message, 'error');
      }
    });
  }
}

function renderMainView() {
  state.currentView = 'home';
  setBreadcrumb('首页');
  restoreLayout();

  const tabsHtml = state.categories.map((cat, idx) => `
    <div class="tab-item ${idx === 0 ? 'active' : ''}" data-id="${cat.id}" data-code="${cat.code}">${cat.name}</div>
  `).join('');

  document.getElementById('main-view').innerHTML = `
    <div class="tabs-container">
      <div class="tabs-nav">${tabsHtml}</div>
      <div class="tab-content" id="tab-content"></div>
    </div>
  `;

  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = state.categories.find(c => c.id == tab.dataset.id);
      state.currentCategory = cat;
      renderTabContent(cat);
    });
  });

  if (state.categories.length > 0) {
    state.currentCategory = state.categories[0];
    renderTabContent(state.categories[0]);
  }
}

function renderTabContent(category) {
  const content = document.getElementById('tab-content');

  if (category.code !== 'junior') {
    content.innerHTML = `
      <div class="construction">
        <div class="construction-icon">🏗️</div>
        <h3>${category.name} - 建设中</h3>
        <p>此模块正在紧张开发中，敬请期待...</p>
      </div>
    `;
    return;
  }

  loadSubCategories(category.id);
}

async function loadSubCategories(categoryId) {
  const content = document.getElementById('tab-content');
  content.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">加载中...</div>';

  const res = await API.get(`/categories/${categoryId}/sub-categories`);
  if (!res.success) {
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#e53e3e;">加载失败</div>';
    return;
  }

  const subs = res.data;
  state.currentSubCategory = null;

  const radioHtml = subs.map((sub, idx) => `
    <div class="radio-item" data-id="${sub.id}" data-code="${sub.code}">
      <input type="radio" name="sub-category" id="sub-${sub.id}" value="${sub.id}">
      <label for="sub-${sub.id}">${sub.name}</label>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="sub-section">
      <div class="sub-title">选择子分类</div>
      <div class="radio-group">${radioHtml}</div>
      <div class="action-bar" style="display:flex;gap:12px;justify-content:center;">
        <button class="btn btn-primary" id="enter-map-btn" disabled>🗺️ 进入地图添加</button>
        <button class="btn btn-success" id="enter-list-btn" disabled>📋 进入列表管理</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.radio-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.radio-item').forEach(r => {
        r.classList.remove('selected');
        r.querySelector('input').checked = false;
      });
      item.classList.add('selected');
      item.querySelector('input').checked = true;
      const sub = subs.find(s => s.id == item.dataset.id);
      state.currentSubCategory = sub;
      document.getElementById('enter-map-btn').disabled = false;
      document.getElementById('enter-list-btn').disabled = false;
    });
  });

  document.getElementById('enter-map-btn').addEventListener('click', () => {
    if (state.currentSubCategory) {
      renderMapView();
    }
  });

  document.getElementById('enter-list-btn').addEventListener('click', () => {
    if (state.currentSubCategory) {
      renderEventList();
    }
  });
}

function enterMapMode() {
  const appMain = document.getElementById('app-main');
  appMain.classList.add('map-mode');
  const header = document.querySelector('.app-header');
  header.classList.add('compact');
  const breadcrumb = document.querySelector('.breadcrumb');
  breadcrumb.classList.add('compact');
}

function restoreLayout() {
  const appMain = document.getElementById('app-main');
  appMain.classList.remove('map-mode');
  const header = document.querySelector('.app-header');
  header.classList.remove('compact');
  const breadcrumb = document.querySelector('.breadcrumb');
  breadcrumb.classList.remove('compact');
}

async function renderMapView() {
  state.currentView = 'map';
  const cat = state.currentCategory;
  const sub = state.currentSubCategory;
  setBreadcrumb(`首页 / ${cat.name} / ${sub.name} / 地图添加`);
  enterMapMode();

  document.getElementById('main-view').innerHTML = `
    <div class="map-view-container">
      <div class="map-container">
        <div id="map"></div>
        <div class="map-toolbar">
          <button class="btn btn-default btn-sm" id="back-home-btn">← 返回</button>
          <button class="btn btn-default btn-sm" id="view-list-btn">列表视图</button>
        </div>
        <div class="map-hint" id="map-hint">点击地图任意位置来添加事件</div>
      </div>
      <div class="add-panel" id="add-panel">
        <div class="add-panel-header">
          <div class="add-panel-title">添加事件</div>
          <button class="modal-close" id="close-panel-btn">&times;</button>
        </div>
        <div class="add-panel-body">
          <form id="add-form">
            <div class="coordinate-display" id="coord-display">
              纬度: <span id="disp-lat">-</span> &nbsp; 经度: <span id="disp-lng">-</span>
            </div>
            <div class="form-group">
              <label class="form-label required">事件名称</label>
              <input type="text" class="form-control" id="f-title" placeholder="请输入事件名称" required>
            </div>
            <div class="form-group">
              <label class="form-label">地点名称</label>
              <input type="text" class="form-control" id="f-locname" placeholder="如：北京天安门">
            </div>
            <div class="form-group">
              <label class="form-label">开始时间</label>
              <div class="era-toggle" id="start-era">
                <button type="button" class="era-toggle-btn active" data-era="ce">公元</button>
                <button type="button" class="era-toggle-btn" data-era="bce">公元前</button>
              </div>
              <div class="date-picker-group">
                <div class="form-group year-field">
                  <input type="number" class="form-control" id="f-start-year" placeholder="年" min="1">
                </div>
                <div class="form-group" id="start-month-group">
                  <input type="number" class="form-control" id="f-start-month" placeholder="月" min="1" max="12">
                </div>
                <div class="form-group" id="start-day-group">
                  <input type="number" class="form-control" id="f-start-day" placeholder="日" min="1" max="31">
                </div>
              </div>
              <div class="date-precision-row" id="start-precision-row">
                <button type="button" class="date-precision-btn" data-precision="0">仅年</button>
                <button type="button" class="date-precision-btn" data-precision="1">年月</button>
                <button type="button" class="date-precision-btn active" data-precision="2">年月日</button>
              </div>
            </div>
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">结束时间</label>
                <button type="button" class="sync-btn" id="sync-end-btn">⟳ 同步开始</button>
              </div>
              <div class="era-toggle" id="end-era">
                <button type="button" class="era-toggle-btn active" data-era="ce">公元</button>
                <button type="button" class="era-toggle-btn" data-era="bce">公元前</button>
              </div>
              <div class="date-picker-group">
                <div class="form-group year-field">
                  <input type="number" class="form-control" id="f-end-year" placeholder="年" min="1">
                </div>
                <div class="form-group" id="end-month-group">
                  <input type="number" class="form-control" id="f-end-month" placeholder="月" min="1" max="12">
                </div>
                <div class="form-group" id="end-day-group">
                  <input type="number" class="form-control" id="f-end-day" placeholder="日" min="1" max="31">
                </div>
              </div>
              <div class="date-precision-row" id="end-precision-row">
                <button type="button" class="date-precision-btn" data-precision="0">仅年</button>
                <button type="button" class="date-precision-btn" data-precision="1">年月</button>
                <button type="button" class="date-precision-btn active" data-precision="2">年月日</button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">说明</label>
              <textarea class="form-control" id="f-desc" placeholder="事件详细说明..." rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label required">图片（至少1张）</label>
              <div class="image-add-tabs">
                <button type="button" class="image-add-tab active" data-tab="upload">📤 上传图片</button>
                <button type="button" class="image-add-tab" data-tab="url">🔗 添加URL</button>
              </div>
              <div class="image-tab-panel" id="tab-upload">
                <div class="add-image-area" id="add-image-area">
                  <div style="font-size:28px;">📤</div>
                  <p>点击或拖拽上传图片</p>
                </div>
                <input type="file" id="f-images" accept="image/*" multiple style="display:none;">
              </div>
              <div class="image-tab-panel" id="tab-url" style="display:none;">
                <div class="url-input-group">
                  <input type="url" class="form-control" id="f-image-url" placeholder="粘贴图片URL (http://或https://开头)">
                  <input type="text" class="form-control" id="f-image-name" placeholder="图片名称（可选）" style="margin-top:8px;">
                  <button type="button" class="btn btn-primary" id="add-url-btn" style="margin-top:8px;width:100%;">+ 添加URL图片</button>
                </div>
              </div>
              <div class="add-image-previews" id="image-previews"></div>
            </div>
          </form>
        </div>
        <div class="add-panel-footer">
          <button class="btn btn-default" id="cancel-add-btn">取消</button>
          <button class="btn btn-primary" id="submit-add-btn">添加</button>
        </div>
      </div>
    </div>
  `;

  initMap();
  initAddPanel();
}

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

function addTileLayersToMap(map, tileType, customUrl, customSd, minZoom, maxZoom) {
  const sdArr = customSd ? customSd.split(',').map(s => s.trim()).filter(Boolean) : ['1','2','3','4'];

  if (tileType === 'custom' && customUrl) {
    L.tileLayer(customUrl, {
      subdomains: sdArr.length > 0 ? sdArr : undefined,
      minZoom: minZoom,
      maxZoom: maxZoom
    }).addTo(map);
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

  L.tileLayer('/shared/tiles/osm/{z}/{x}/{y}.png', {
    minZoom: minZoom,
    maxZoom: Math.min(maxZoom, 2)
  }).addTo(map);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1','2','3','4'],
    minZoom: Math.max(minZoom, 3),
    maxZoom: maxZoom,
    attribution: '&copy; 高德地图'
  }).addTo(map);
}

function initMap() {
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  const sub = state.currentSubCategory;
  let center, zoom, minZoom, maxZoom;
  let tileType = 'hybrid';
  let tileUrl = '';
  let tileSd = 'a,b,c';

  if (sub) {
    if (sub.center_lat != null && sub.center_lng != null) {
      center = [parseFloat(sub.center_lat), parseFloat(sub.center_lng)];
    }
    if (sub.default_zoom != null) zoom = parseInt(sub.default_zoom);
    if (sub.map_min_zoom != null) minZoom = parseInt(sub.map_min_zoom);
    if (sub.map_max_zoom != null) maxZoom = parseInt(sub.map_max_zoom);
    if (sub.map_tile_type) tileType = sub.map_tile_type;
    if (sub.map_tile_url) tileUrl = sub.map_tile_url;
    if (sub.map_tile_subdomains) tileSd = sub.map_tile_subdomains;
  }

  if (!center) {
    const subCode = sub?.code || '';
    if (subCode === 'china') {
      center = [35, 105];
    } else {
      center = [30, 120];
    }
  }
  if (zoom == null) zoom = (sub?.code === 'china') ? 4 : 2;
  if (minZoom == null) minZoom = 2;
  if (maxZoom == null) maxZoom = 8;

  state.map = L.map('map', {
    center: center,
    zoom: zoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    zoomControl: true,
    worldCopyJump: true
  });

  addTileLayersToMap(state.map, tileType, tileUrl, tileSd, minZoom, maxZoom);

  loadChinaProvinces();
  loadWorldAdmin1Labels();

  state.map.on('click', onMapClick);

  document.getElementById('back-home-btn').addEventListener('click', () => {
    if (state.map) { state.map.remove(); state.map = null; }
    renderMainView();
  });

  document.getElementById('view-list-btn').addEventListener('click', () => {
    if (state.map) { state.map.remove(); state.map = null; }
    renderEventList();
  });
}

async function loadChinaProvinces() {
  try {
    const res = await fetch('/shared/geojson/china_provinces.json');
    const data = await res.json();

    state.provinceLayer = L.geoJSON(data, {
      style: {
        color: '#4a90d9',
        weight: 1,
        fillColor: '#a8d0f0',
        fillOpacity: 0.1,
        dashArray: '4'
      },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name;
        if (name) {
          layer.bindTooltip(name, {
            permanent: false,
            direction: 'center',
            className: 'province-label'
          });
        }
      }
    }).addTo(state.map);

    addProvinceLabels(data);
  } catch (e) {
    console.warn('加载中国省份数据失败:', e);
  }
}

function addProvinceLabels(data) {
  const currentZoom = state.map.getZoom();
  data.features.forEach(feature => {
    const name = feature.properties.name;
    if (!name) return;

    const bounds = L.geoJSON(feature).getBounds();
    const center = bounds.getCenter();

    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'province-label',
        html: name,
        iconSize: [0, 0]
      }),
      interactive: false
    });
    label._isCountryLabel = false;
    state.admin1Labels.push(label);
    if (currentZoom >= 4) {
      label.addTo(state.map);
    }
  });
}

const WORLD_COUNTRIES = [
  { name: '中国', lat: 35.8617, lng: 104.1954 },
  { name: '蒙古', lat: 46.8625, lng: 103.8467 },
  { name: '朝鲜', lat: 40.3399, lng: 127.5101 },
  { name: '韩国', lat: 35.9078, lng: 127.7669 },
  { name: '日本', lat: 36.2048, lng: 138.2529 },
  { name: '越南', lat: 14.0583, lng: 108.2772 },
  { name: '老挝', lat: 19.8563, lng: 102.4955 },
  { name: '柬埔寨', lat: 12.5657, lng: 104.9910 },
  { name: '缅甸', lat: 21.9162, lng: 95.9562 },
  { name: '泰国', lat: 15.8700, lng: 100.9925 },
  { name: '马来西亚', lat: 4.2105, lng: 101.9758 },
  { name: '新加坡', lat: 1.3521, lng: 103.8198 },
  { name: '印度尼西亚', lat: -0.7893, lng: 113.9213 },
  { name: '菲律宾', lat: 12.8797, lng: 121.7740 },
  { name: '印度', lat: 20.5937, lng: 78.9629 },
  { name: '巴基斯坦', lat: 30.3753, lng: 69.3451 },
  { name: '孟加拉国', lat: 23.6850, lng: 90.3563 },
  { name: '尼泊尔', lat: 28.3949, lng: 84.1240 },
  { name: '斯里兰卡', lat: 7.8731, lng: 80.7718 },
  { name: '哈萨克斯坦', lat: 48.0196, lng: 66.9237 },
  { name: '乌兹别克斯坦', lat: 41.3775, lng: 64.5853 },
  { name: '阿富汗', lat: 33.9391, lng: 67.7100 },
  { name: '伊朗', lat: 32.4279, lng: 53.6880 },
  { name: '伊拉克', lat: 33.2232, lng: 43.6793 },
  { name: '沙特阿拉伯', lat: 23.8859, lng: 45.0792 },
  { name: '土耳其', lat: 38.9637, lng: 35.2433 },
  { name: '叙利亚', lat: 34.8021, lng: 38.9968 },
  { name: '以色列', lat: 31.0461, lng: 34.8516 },
  { name: '埃及', lat: 26.8206, lng: 30.8025 },
  { name: '利比亚', lat: 26.3351, lng: 17.2283 },
  { name: '阿尔及利亚', lat: 28.0339, lng: 1.6596 },
  { name: '摩洛哥', lat: 31.7917, lng: -7.0926 },
  { name: '尼日利亚', lat: 9.0820, lng: 8.6753 },
  { name: '埃塞俄比亚', lat: 9.1450, lng: 40.4897 },
  { name: '肯尼亚', lat: -0.0236, lng: 37.9062 },
  { name: '南非', lat: -30.5595, lng: 22.9375 },
  { name: '英国', lat: 55.3781, lng: -3.4360 },
  { name: '爱尔兰', lat: 53.1424, lng: -7.6921 },
  { name: '法国', lat: 46.2276, lng: 2.2137 },
  { name: '德国', lat: 51.1657, lng: 10.4515 },
  { name: '荷兰', lat: 52.1326, lng: 5.2913 },
  { name: '比利时', lat: 50.5039, lng: 4.4699 },
  { name: '卢森堡', lat: 49.8153, lng: 6.1296 },
  { name: '瑞士', lat: 46.8182, lng: 8.2275 },
  { name: '奥地利', lat: 47.5162, lng: 14.5501 },
  { name: '意大利', lat: 41.8719, lng: 12.5674 },
  { name: '西班牙', lat: 40.4637, lng: -3.7492 },
  { name: '葡萄牙', lat: 39.3999, lng: -8.2245 },
  { name: '希腊', lat: 39.0742, lng: 21.8243 },
  { name: '丹麦', lat: 56.2639, lng: 9.5018 },
  { name: '挪威', lat: 60.4720, lng: 8.4689 },
  { name: '瑞典', lat: 60.1282, lng: 18.6435 },
  { name: '芬兰', lat: 61.9241, lng: 25.7482 },
  { name: '波兰', lat: 51.9194, lng: 19.1451 },
  { name: '捷克', lat: 49.8175, lng: 15.4730 },
  { name: '斯洛伐克', lat: 48.6690, lng: 19.6990 },
  { name: '匈牙利', lat: 47.1625, lng: 19.5033 },
  { name: '罗马尼亚', lat: 45.9432, lng: 24.9668 },
  { name: '保加利亚', lat: 42.7339, lng: 25.4858 },
  { name: '塞尔维亚', lat: 44.0165, lng: 21.0059 },
  { name: '克罗地亚', lat: 45.1000, lng: 15.2000 },
  { name: '波黑', lat: 43.9159, lng: 17.6791 },
  { name: '黑山', lat: 42.7087, lng: 19.3744 },
  { name: '马其顿', lat: 41.6086, lng: 21.7453 },
  { name: '阿尔巴尼亚', lat: 41.1533, lng: 20.1683 },
  { name: '立陶宛', lat: 55.1694, lng: 23.8813 },
  { name: '拉脱维亚', lat: 56.8796, lng: 24.6032 },
  { name: '爱沙尼亚', lat: 58.5953, lng: 25.0136 },
  { name: '俄罗斯', lat: 61.5240, lng: 105.3188 },
  { name: '乌克兰', lat: 48.3794, lng: 31.1656 },
  { name: '白俄罗斯', lat: 53.7098, lng: 27.9534 },
  { name: '摩尔多瓦', lat: 47.4116, lng: 28.3699 },
  { name: '格鲁吉亚', lat: 42.3154, lng: 43.3569 },
  { name: '亚美尼亚', lat: 40.0691, lng: 45.0382 },
  { name: '阿塞拜疆', lat: 40.1431, lng: 47.5769 },
  { name: '加拿大', lat: 56.1304, lng: -106.3468 },
  { name: '美国', lat: 37.0902, lng: -95.7129 },
  { name: '墨西哥', lat: 23.6345, lng: -102.5528 },
  { name: '危地马拉', lat: 15.7835, lng: -90.2308 },
  { name: '古巴', lat: 21.5218, lng: -77.7812 },
  { name: '巴拿马', lat: 8.5380, lng: -80.7821 },
  { name: '哥伦比亚', lat: 4.5709, lng: -74.2973 },
  { name: '委内瑞拉', lat: 6.4238, lng: -66.5897 },
  { name: '秘鲁', lat: -9.1900, lng: -75.0152 },
  { name: '厄瓜多尔', lat: -1.8312, lng: -78.1834 },
  { name: '巴西', lat: -14.2350, lng: -51.9253 },
  { name: '玻利维亚', lat: -16.2902, lng: -63.5887 },
  { name: '智利', lat: -35.6751, lng: -71.5430 },
  { name: '阿根廷', lat: -38.4161, lng: -63.6167 },
  { name: '乌拉圭', lat: -32.5228, lng: -55.7658 },
  { name: '巴拉圭', lat: -23.4425, lng: -58.4438 },
  { name: '澳大利亚', lat: -25.2744, lng: 133.7751 },
  { name: '新西兰', lat: -40.9006, lng: 174.8860 },
  { name: '巴布亚新几内亚', lat: -6.3149, lng: 143.9555 }
];

async function loadWorldAdmin1Labels() {
  try {
    const res = await fetch('/shared/geojson/world_admin1_labels.json');
    const data = await res.json();
    const currentZoom = state.map.getZoom();

    WORLD_COUNTRIES.forEach(country => {
      const label = L.marker([country.lat, country.lng], {
        icon: L.divIcon({
          className: 'country-label',
          html: country.name,
          iconSize: [0, 0]
        }),
        interactive: false
      });
      label._isCountryLabel = true;
      state.admin1Labels.push(label);
      if (currentZoom >= 2) {
        label.addTo(state.map);
      }
    });

    data.features.forEach(feature => {
      const name = feature.properties.name;
      const coords = feature.geometry.coordinates;
      const country = feature.properties.country;
      if (!name || !coords) return;
      if (!COUNTRIES_WITH_ADMIN1.has(country)) return;

      const label = L.marker([coords[1], coords[0]], {
        icon: L.divIcon({
          className: 'admin1-label',
          html: name,
          iconSize: [0, 0]
        }),
        interactive: false
      });
      label._isCountryLabel = false;
      state.admin1Labels.push(label);
      if (currentZoom >= 4) {
        label.addTo(state.map);
      }
    });

    state.map.on('zoomend', updateLabelVisibility);
  } catch (e) {
    console.warn('加载世界行政区划标注失败:', e);
  }
}

function updateLabelVisibility() {
  if (!state.map) return;
  const zoom = state.map.getZoom();

  state.admin1Labels.forEach(label => {
    const minZoom = label._isCountryLabel ? 2 : 4;
    if (zoom >= minZoom) {
      if (!state.map.hasLayer(label)) state.map.addLayer(label);
    } else {
      if (state.map.hasLayer(label)) state.map.removeLayer(label);
    }
  });
}

function onMapClick(e) {
  const { lat, lng } = e.latlng;

  if (state.mapClickMarker) {
    state.mapClickMarker.setLatLng([lat, lng]);
  } else {
    state.mapClickMarker = L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: '/shared/lib/leaflet/images/marker-icon.png',
        shadowUrl: '/shared/lib/leaflet/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).addTo(state.map);
  }

  document.getElementById('disp-lat').textContent = lat.toFixed(6);
  document.getElementById('disp-lng').textContent = lng.toFixed(6);
  document.getElementById('f-locname').focus();

  const panel = document.getElementById('add-panel');
  if (!panel.classList.contains('open')) {
    panel.classList.add('open');
  }

  const hint = document.getElementById('map-hint');
  if (hint) hint.style.opacity = '0';
}

function initAddPanel() {
  state.pendingImages = [];

  document.getElementById('close-panel-btn').addEventListener('click', closeAddPanel);
  document.getElementById('cancel-add-btn').addEventListener('click', closeAddPanel);
  document.getElementById('submit-add-btn').addEventListener('click', submitEvent);

  initEraToggle('start-era');
  initEraToggle('end-era');
  initPrecisionRow('start');
  initPrecisionRow('end');
  bindDateFieldBounds('f-start-month', 'f-start-day');
  bindDateFieldBounds('f-end-month', 'f-end-day');

  document.getElementById('sync-end-btn').addEventListener('click', () => {
    syncEndFromStart({
      startYearId: 'f-start-year',
      startMonthId: 'f-start-month',
      startDayId: 'f-start-day',
      startEraId: 'start-era',
      startPrecisionRowId: 'start-precision-row',
      endYearId: 'f-end-year',
      endMonthId: 'f-end-month',
      endDayId: 'f-end-day',
      endEraId: 'end-era',
      endPrecisionRowId: 'end-precision-row',
      endMonthGroupId: 'end-month-group',
      endDayGroupId: 'end-day-group'
    });
  });

  document.querySelectorAll('.image-add-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.image-add-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('tab-upload').style.display = tabName === 'upload' ? '' : 'none';
      document.getElementById('tab-url').style.display = tabName === 'url' ? '' : 'none';
    });
  });

  const imageArea = document.getElementById('add-image-area');
  const fileInput = document.getElementById('f-images');

  imageArea.addEventListener('click', () => fileInput.click());
  imageArea.addEventListener('dragover', (e) => { e.preventDefault(); imageArea.classList.add('dragover'); });
  imageArea.addEventListener('dragleave', () => imageArea.classList.remove('dragover'));
  imageArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageArea.classList.remove('dragover');
    addPendingImages(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => {
    addPendingImages(e.target.files);
    e.target.value = '';
  });

  document.getElementById('add-url-btn').addEventListener('click', () => {
    const urlInput = document.getElementById('f-image-url');
    const nameInput = document.getElementById('f-image-name');
    const url = urlInput.value.trim();
    const name = nameInput.value.trim();

    if (!url) { toast('请输入图片URL', 'error'); return; }
    if (!/^https?:\/\//i.test(url)) { toast('URL必须以http://或https://开头', 'error'); return; }

    addPendingUrlImage(url, name);
    urlInput.value = '';
    nameInput.value = '';
  });
}

function addPendingUrlImage(url, name) {
  if (state.pendingImages.length >= 20) { toast('最多添加20张图片', 'warning'); return; }

  state.pendingImages.push({
    type: 'url',
    url: url,
    dataUrl: url,
    name: name || url
  });
  renderImagePreviews();
  toast('URL图片已添加', 'success');
}

function initEraToggle(groupId) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.era-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.era-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function bindDateFieldBounds(monthId, dayId) {
  const monthInput = document.getElementById(monthId);
  const dayInput = document.getElementById(dayId);

  if (monthInput) {
    const enforce = () => {
      let v = parseInt(monthInput.value);
      if (isNaN(v) || v === '') return;
      if (v < 1) monthInput.value = 1;
      else if (v > 12) monthInput.value = 12;
    };
    monthInput.addEventListener('change', enforce);
    monthInput.addEventListener('blur', enforce);
    monthInput.addEventListener('input', () => {
      let v = parseInt(monthInput.value);
      if (!isNaN(v) && v > 12) monthInput.value = 12;
    });
  }

  if (dayInput) {
    const enforce = () => {
      let v = parseInt(dayInput.value);
      if (isNaN(v) || v === '') return;
      if (v < 1) dayInput.value = 1;
      else if (v > 31) dayInput.value = 31;
    };
    dayInput.addEventListener('change', enforce);
    dayInput.addEventListener('blur', enforce);
    dayInput.addEventListener('input', () => {
      let v = parseInt(dayInput.value);
      if (!isNaN(v) && v > 31) dayInput.value = 31;
    });
  }
}

function syncEndFromStart(options) {
  const {
    startYearId, startMonthId, startDayId,
    startEraId, startPrecisionRowId,
    endYearId, endMonthId, endDayId,
    endEraId, endPrecisionRowId,
    endMonthGroupId, endDayGroupId
  } = options;

  const startYear = document.getElementById(startYearId).value;
  if (!startYear) return;

  const startEra = document.querySelector(`#${startEraId} .era-toggle-btn.active`).dataset.era;
  const startPrecision = parseInt(document.querySelector(`#${startPrecisionRowId} .date-precision-btn.active`).dataset.precision);
  const startMonth = document.getElementById(startMonthId).value;
  const startDay = document.getElementById(startDayId).value;

  const endYearInput = document.getElementById(endYearId);
  const endMonthInput = document.getElementById(endMonthId);
  const endDayInput = document.getElementById(endDayId);
  const endMonthGroup = document.getElementById(endMonthGroupId);
  const endDayGroup = document.getElementById(endDayGroupId);
  const endPrecisionRow = document.getElementById(endPrecisionRowId);

  endYearInput.value = startYear;

  const endEraBtns = document.querySelectorAll(`#${endEraId} .era-toggle-btn`);
  endEraBtns.forEach(b => b.classList.remove('active'));
  endEraBtns.forEach(b => {
    if (b.dataset.era === startEra) b.classList.add('active');
  });

  endPrecisionRow.querySelectorAll('.date-precision-btn').forEach(b => b.classList.remove('active'));
  endPrecisionRow.querySelector(`[data-precision="${startPrecision}"]`).classList.add('active');

  if (startPrecision === 0) {
    endMonthGroup.style.display = 'none';
    endDayGroup.style.display = 'none';
    endMonthInput.value = '';
    endDayInput.value = '';
  } else if (startPrecision === 1) {
    endMonthGroup.style.display = '';
    endDayGroup.style.display = 'none';
    endMonthInput.value = startMonth || '';
    endDayInput.value = '';
  } else {
    endMonthGroup.style.display = '';
    endDayGroup.style.display = '';
    endMonthInput.value = startMonth || '';
    endDayInput.value = startDay || '';
  }
}

function initPrecisionRow(prefix) {
  const row = document.getElementById(`${prefix}-precision-row`);
  row.querySelectorAll('.date-precision-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.date-precision-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const precision = parseInt(btn.dataset.precision);
      const monthGroup = document.getElementById(`${prefix}-month-group`);
      const dayGroup = document.getElementById(`${prefix}-day-group`);
      const monthInput = document.getElementById(`f-${prefix}-month`);
      const dayInput = document.getElementById(`f-${prefix}-day`);

      if (precision === 0) {
        monthGroup.style.display = 'none';
        dayGroup.style.display = 'none';
        monthInput.value = '';
        dayInput.value = '';
      } else if (precision === 1) {
        monthGroup.style.display = '';
        dayGroup.style.display = 'none';
        dayInput.value = '';
      } else {
        monthGroup.style.display = '';
        dayGroup.style.display = '';
      }
    });
  });
}

function addPendingImages(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (state.pendingImages.length >= 20) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      state.pendingImages.push({
        type: 'file',
        file: file,
        dataUrl: e.target.result,
        name: file.name
      });
      renderImagePreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderImagePreviews() {
  const container = document.getElementById('image-previews');
  container.innerHTML = state.pendingImages.map((img, idx) => `
    <div class="add-image-preview">
      <img src="${img.dataUrl}" alt="${escapeHtml(img.name)}">
      ${img.type === 'url' ? '<div class="url-image-tag">URL</div>' : ''}
      <button type="button" class="add-image-preview-remove" data-idx="${idx}">×</button>
    </div>
  `).join('');

  container.querySelectorAll('.add-image-preview-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      state.pendingImages.splice(idx, 1);
      renderImagePreviews();
    });
  });
}

function closeAddPanel() {
  const panel = document.getElementById('add-panel');
  panel.classList.remove('open');

  if (state.mapClickMarker) {
    state.map.removeLayer(state.mapClickMarker);
    state.mapClickMarker = null;
  }

  resetAddForm();
  state.pendingImages = [];

  const hint = document.getElementById('map-hint');
  if (hint) hint.style.opacity = '1';
}

function resetAddForm() {
  document.getElementById('f-title').value = '';
  document.getElementById('f-locname').value = '';
  document.getElementById('f-start-year').value = '';
  document.getElementById('f-start-month').value = '';
  document.getElementById('f-start-day').value = '';
  document.getElementById('f-end-year').value = '';
  document.getElementById('f-end-month').value = '';
  document.getElementById('f-end-day').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('image-previews').innerHTML = '';
  document.getElementById('disp-lat').textContent = '-';
  document.getElementById('disp-lng').textContent = '-';

  document.querySelectorAll('.era-toggle-btn[data-era="ce"]').forEach(b => {
    b.classList.add('active');
  });
  document.querySelectorAll('.era-toggle-btn[data-era="bce"]').forEach(b => {
    b.classList.remove('active');
  });

  document.querySelectorAll('.date-precision-btn[data-precision="2"]').forEach(b => {
    b.classList.add('active');
  });
  document.querySelectorAll('.date-precision-btn[data-precision="0"], .date-precision-btn[data-precision="1"]').forEach(b => {
    b.classList.remove('active');
  });

  ['start', 'end'].forEach(prefix => {
    document.getElementById(`${prefix}-month-group`).style.display = '';
    document.getElementById(`${prefix}-day-group`).style.display = '';
  });
}

async function submitEvent() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { toast('请输入事件名称', 'error'); return; }

  const lat = document.getElementById('disp-lat').textContent;
  const lng = document.getElementById('disp-lng').textContent;
  if (lat === '-' || lng === '-') { toast('请在地图上点击选择位置', 'error'); return; }

  const urlInput = document.getElementById('f-image-url');
  const urlNameInput = document.getElementById('f-image-name');
  if (urlInput && urlInput.value.trim()) {
    const url = urlInput.value.trim();
    const name = urlNameInput ? urlNameInput.value.trim() : '';
    if (/^https?:\/\//i.test(url)) {
      addPendingUrlImage(url, name || url);
      urlInput.value = '';
      if (urlNameInput) urlNameInput.value = '';
    }
  }

  if (state.pendingImages.length === 0) { toast('请至少添加一张图片（上传或URL）', 'error'); return; }

  const startYear = document.getElementById('f-start-year').value;
  if (!startYear) { toast('请输入开始时间的年份', 'error'); return; }

  const startEra = document.querySelector('#start-era .era-toggle-btn.active').dataset.era;
  const startPrecision = parseInt(document.querySelector('#start-precision-row .date-precision-btn.active').dataset.precision);
  const startMonth = document.getElementById('f-start-month').value;
  const startDay = document.getElementById('f-start-day').value;

  let startTs = dateToTs(startYear, startMonth || null, startDay || null, startEra === 'bce');
  if (startPrecision === 0) startTs = dateToTs(startYear, 1, 1, startEra === 'bce');
  else if (startPrecision === 1) startTs = dateToTs(startYear, startMonth || 1, 1, startEra === 'bce');

  let endTs = null;
  let endPrecision = 0;
  const endYear = document.getElementById('f-end-year').value;
  if (endYear) {
    const endEra = document.querySelector('#end-era .era-toggle-btn.active').dataset.era;
    endPrecision = parseInt(document.querySelector('#end-precision-row .date-precision-btn.active').dataset.precision);
    const endMonth = document.getElementById('f-end-month').value;
    const endDay = document.getElementById('f-end-day').value;

    if (endPrecision === 0) endTs = dateToTs(endYear, 1, 1, endEra === 'bce');
    else if (endPrecision === 1) endTs = dateToTs(endYear, endMonth || 1, 1, endEra === 'bce');
    else endTs = dateToTs(endYear, endMonth || 1, endDay || 1, endEra === 'bce');
  }

  const submitBtn = document.getElementById('submit-add-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '添加中...';

  try {
    const eventData = {
      category_id: state.currentCategory.id,
      sub_category_id: state.currentSubCategory.id,
      title: title,
      start_ts: startTs,
      start_precision: startPrecision,
      end_ts: endTs,
      end_precision: endPrecision,
      description: document.getElementById('f-desc').value.trim() || null,
      location_lat: parseFloat(lat),
      location_lng: parseFloat(lng),
      location_name: document.getElementById('f-locname').value.trim() || null
    };

    const res = await API.post('/events', eventData);

    if (!res.success) {
      toast(res.message || '添加失败', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '添加';
      return;
    }

    const eventId = res.data.id;
    const catCode = state.currentCategory.code;
    const subCode = state.currentSubCategory.code;

    const fileImages = state.pendingImages.filter(img => img.type === 'file');
    const urlImages = state.pendingImages.filter(img => img.type === 'url');

    let allSuccess = true;
    let failMessages = [];

    if (fileImages.length > 0) {
      const formData = new FormData();
      formData.append('event_id', eventId);
      formData.append('category_code', catCode);
      formData.append('sub_category_code', subCode);
      formData.append('event_title', title);
      fileImages.forEach(img => {
        formData.append('images', img.file);
      });

      const imgRes = await API.upload('/images/upload', formData);
      if (!imgRes.success) {
        allSuccess = false;
        failMessages.push(imgRes.message || '文件图片上传失败');
      }
    }

    if (urlImages.length > 0) {
      for (const img of urlImages) {
        const urlRes = await API.post('/images/add-url', {
          event_id: eventId,
          url: img.url,
          name: img.name
        });
        if (!urlRes.success) {
          allSuccess = false;
          failMessages.push(urlRes.message || `URL图片添加失败: ${img.name}`);
        }
      }
    }

    if (!allSuccess) {
      toast('事件已添加但部分图片处理失败: ' + failMessages.join('; '), 'error');
    } else {
      toast('添加成功！', 'success');
    }

    closeAddPanel();
  } catch (e) {
    toast('添加失败: ' + e.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '添加';
  }
}

async function renderEventList() {
  state.currentView = 'list';
  const cat = state.currentCategory;
  const sub = state.currentSubCategory;
  setBreadcrumb(`首页 / ${cat.name} / ${sub.name} / 列表`);
  restoreLayout();

  document.getElementById('main-view').innerHTML = `
    <div class="page-header">
      <div>
        <span class="back-link" id="back-btn">← 返回首页</span>
        <h2 class="page-title" style="margin-top:8px;">${cat.name} - ${sub.name}</h2>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-primary" id="add-map-btn">🗺️ 地图添加</button>
      </div>
    </div>
    <div class="table-container" id="list-container">
      <div style="text-align:center;padding:40px;color:#718096;">加载中...</div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', renderMainView);
  document.getElementById('add-map-btn').addEventListener('click', renderMapView);

  await loadEvents();
}

async function loadEvents() {
  const res = await API.get(`/events?category_id=${state.currentCategory.id}&sub_category_id=${state.currentSubCategory.id}`);
  const container = document.getElementById('list-container');

  if (!res.success) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#e53e3e;">加载失败: ${res.message}</div>`;
    return;
  }

  state.currentEvents = res.data;

  if (res.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>暂无数据</h3>
        <p>点击"地图添加"按钮在地图上添加事件</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>事件</th>
          <th>开始时间</th>
          <th>结束时间</th>
          <th>说明</th>
          <th>地点</th>
          <th>图片</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${res.data.map(event => `
          <tr>
            <td><strong>${escapeHtml(event.title)}</strong></td>
            <td>${escapeHtml(event.start_display || '-')}</td>
            <td>${escapeHtml(event.end_display || '-')}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(event.description || '')}">${escapeHtml(event.description || '-')}</td>
            <td>
              ${event.location_name ? escapeHtml(event.location_name) : ''}
              ${event.location_lat && event.location_lng 
                ? `<br><span class="badge badge-info">${Number(event.location_lat).toFixed(2)}, ${Number(event.location_lng).toFixed(2)}</span>`
                : ''}
            </td>
            <td><span class="badge ${event.image_count > 0 ? 'badge-info' : 'badge-gray'}">${event.image_count} 张</span></td>
            <td class="actions">
              <button class="btn btn-sm btn-warning" data-action="images" data-id="${event.id}">图片</button>
              <button class="btn btn-sm btn-primary" data-action="edit" data-id="${event.id}">修改</button>
              <button class="btn btn-sm btn-danger" data-action="delete" data-id="${event.id}">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id);
      const event = state.currentEvents.find(e => e.id === id);
      if (action === 'edit') openEditMapView(event);
      else if (action === 'delete') deleteEvent(event);
      else if (action === 'images') openImageManager(event);
    });
  });
}

function showEventForm(event = null) {
  const isEdit = !!event;
  const title = isEdit ? '修改事件' : '添加事件';

  const startParts = isEdit && event.start_ts ? tsToYearMonthDay(event.start_ts) : { year: '', month: '', day: '', isBce: false };
  const endParts = isEdit && event.end_ts ? tsToYearMonthDay(event.end_ts) : { year: '', month: '', day: '', isBce: false };

  showModal(`
    <div class="modal-header">
      <div class="modal-title">${title}</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <form id="event-form">
        <div class="form-group">
          <label class="form-label required">事件名称</label>
          <input type="text" class="form-control" id="f-title" value="${escapeHtml(event?.title || '')}" placeholder="请输入事件名称" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">开始时间</label>
            <div class="era-toggle" id="modal-start-era">
              <button type="button" class="era-toggle-btn ${!startParts.isBce ? 'active' : ''}" data-era="ce">公元</button>
              <button type="button" class="era-toggle-btn ${startParts.isBce ? 'active' : ''}" data-era="bce">公元前</button>
            </div>
            <div class="date-picker-group">
              <div class="form-group year-field">
                <input type="number" class="form-control" id="f-start-year" placeholder="年" min="1" value="${startParts.year}">
              </div>
              <div class="form-group" id="modal-start-month-group">
                <input type="number" class="form-control" id="f-start-month" placeholder="月" min="1" max="12" value="${startParts.month}">
              </div>
              <div class="form-group" id="modal-start-day-group">
                <input type="number" class="form-control" id="f-start-day" placeholder="日" min="1" max="31" value="${startParts.day}">
              </div>
            </div>
            <div class="date-precision-row" id="modal-start-precision-row">
              <button type="button" class="date-precision-btn ${isEdit && event.start_precision === 0 ? 'active' : ''}" data-precision="0">仅年</button>
              <button type="button" class="date-precision-btn ${isEdit && event.start_precision === 1 ? 'active' : ''}" data-precision="1">年月</button>
              <button type="button" class="date-precision-btn ${(!isEdit || event.start_precision === 2) ? 'active' : ''}" data-precision="2">年月日</button>
            </div>
          </div>
          <div class="form-group">
            <div class="form-label-row">
              <label class="form-label">结束时间</label>
              <button type="button" class="sync-btn" id="modal-sync-end-btn">⟳ 同步开始</button>
            </div>
            <div class="era-toggle" id="modal-end-era">
              <button type="button" class="era-toggle-btn ${!endParts.isBce ? 'active' : ''}" data-era="ce">公元</button>
              <button type="button" class="era-toggle-btn ${endParts.isBce ? 'active' : ''}" data-era="bce">公元前</button>
            </div>
            <div class="date-picker-group">
              <div class="form-group year-field">
                <input type="number" class="form-control" id="f-end-year" placeholder="年" min="1" value="${endParts.year}">
              </div>
              <div class="form-group" id="modal-end-month-group">
                <input type="number" class="form-control" id="f-end-month" placeholder="月" min="1" max="12" value="${endParts.month}">
              </div>
              <div class="form-group" id="modal-end-day-group">
                <input type="number" class="form-control" id="f-end-day" placeholder="日" min="1" max="31" value="${endParts.day}">
              </div>
            </div>
            <div class="date-precision-row" id="modal-end-precision-row">
              <button type="button" class="date-precision-btn ${isEdit && event.end_precision === 0 ? 'active' : ''}" data-precision="0">仅年</button>
              <button type="button" class="date-precision-btn ${isEdit && event.end_precision === 1 ? 'active' : ''}" data-precision="1">年月</button>
              <button type="button" class="date-precision-btn ${(!isEdit || event.end_precision === 2 || !event.end_ts) ? 'active' : ''}" data-precision="2">年月日</button>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">说明</label>
          <textarea class="form-control" id="f-desc" placeholder="事件详细说明...">${escapeHtml(event?.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">提示</label>
          <textarea class="form-control" id="f-tips" placeholder="提示信息（猜图时显示，非必填）">${escapeHtml(event?.tips || '')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">纬度</label>
            <input type="number" step="any" class="form-control" id="f-lat" value="${event?.location_lat ?? ''}" placeholder="39.9042">
          </div>
          <div class="form-group">
            <label class="form-label">经度</label>
            <input type="number" step="any" class="form-control" id="f-lng" value="${event?.location_lng ?? ''}" placeholder="116.4074">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">地点名称</label>
          <input type="text" class="form-control" id="f-locname" value="${escapeHtml(event?.location_name || '')}" placeholder="如：北京天安门">
        </div>
        <div class="form-group">
          <label class="form-label">排序</label>
          <input type="number" class="form-control" id="f-sort" value="${event?.sort_order || 0}" placeholder="数字越小越靠前">
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-default" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="save-btn">保存</button>
    </div>
  `, true);

  initEraToggle('modal-start-era');
  initEraToggle('modal-end-era');
  initModalPrecisionRow('modal-start-precision-row', 'modal-start-month-group', 'modal-start-day-group');
  initModalPrecisionRow('modal-end-precision-row', 'modal-end-month-group', 'modal-end-day-group');
  bindDateFieldBounds('f-start-month', 'f-start-day');
  bindDateFieldBounds('f-end-month', 'f-end-day');

  document.getElementById('modal-sync-end-btn').addEventListener('click', () => {
    syncEndFromStart({
      startYearId: 'f-start-year',
      startMonthId: 'f-start-month',
      startDayId: 'f-start-day',
      startEraId: 'modal-start-era',
      startPrecisionRowId: 'modal-start-precision-row',
      endYearId: 'f-end-year',
      endMonthId: 'f-end-month',
      endDayId: 'f-end-day',
      endEraId: 'modal-end-era',
      endPrecisionRowId: 'modal-end-precision-row',
      endMonthGroupId: 'modal-end-month-group',
      endDayGroupId: 'modal-end-day-group'
    });
  });

  document.getElementById('save-btn').addEventListener('click', async () => {
    const startEra = document.querySelector('#modal-start-era .era-toggle-btn.active').dataset.era;
    const startPrecision = parseInt(document.querySelector('#modal-start-precision-row .date-precision-btn.active').dataset.precision);
    const startYear = document.getElementById('f-start-year').value;
    const startMonth = document.getElementById('f-start-month').value;
    const startDay = document.getElementById('f-start-day').value;

    let startTs = startYear ? dateToTs(startYear, startMonth || 1, startDay || 1, startEra === 'bce') : null;
    if (startTs !== null && startPrecision === 0) startTs = dateToTs(startYear, 1, 1, startEra === 'bce');
    else if (startTs !== null && startPrecision === 1) startTs = dateToTs(startYear, startMonth || 1, 1, startEra === 'bce');

    let endTs = null;
    let endPrecision = 0;
    const endYear = document.getElementById('f-end-year').value;
    if (endYear) {
      const endEra = document.querySelector('#modal-end-era .era-toggle-btn.active').dataset.era;
      endPrecision = parseInt(document.querySelector('#modal-end-precision-row .date-precision-btn.active').dataset.precision);
      const endMonth = document.getElementById('f-end-month').value;
      const endDay = document.getElementById('f-end-day').value;
      if (endPrecision === 0) endTs = dateToTs(endYear, 1, 1, endEra === 'bce');
      else if (endPrecision === 1) endTs = dateToTs(endYear, endMonth || 1, 1, endEra === 'bce');
      else endTs = dateToTs(endYear, endMonth || 1, endDay || 1, endEra === 'bce');
    }

    const data = {
      category_id: state.currentCategory.id,
      sub_category_id: state.currentSubCategory.id,
      title: document.getElementById('f-title').value.trim(),
      start_ts: startTs,
      start_precision: startTs !== null ? startPrecision : 0,
      end_ts: endTs,
      end_precision: endPrecision,
      description: document.getElementById('f-desc').value.trim() || null,
      tips: document.getElementById('f-tips').value.trim() || null,
      location_lat: document.getElementById('f-lat').value || null,
      location_lng: document.getElementById('f-lng').value || null,
      location_name: document.getElementById('f-locname').value.trim() || null,
      sort_order: parseInt(document.getElementById('f-sort').value) || 0
    };

    if (!data.title) { toast('请输入事件名称', 'error'); return; }

    let res;
    if (isEdit) {
      res = await API.put(`/events/${event.id}`, data);
    } else {
      res = await API.post('/events', data);
    }

    if (res.success) {
      toast(res.message, 'success');
      closeModal();
      loadEvents();
    } else {
      toast(res.message, 'error');
    }
  });
}

function initModalPrecisionRow(rowId, monthGroupId, dayGroupId) {
  const row = document.getElementById(rowId);
  row.querySelectorAll('.date-precision-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.date-precision-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const precision = parseInt(btn.dataset.precision);
      const monthGroup = document.getElementById(monthGroupId);
      const dayGroup = document.getElementById(dayGroupId);
      const monthInput = monthGroup ? monthGroup.querySelector('input') : null;
      const dayInput = dayGroup ? dayGroup.querySelector('input') : null;

      if (precision === 0) {
        if (monthGroup) monthGroup.style.display = 'none';
        if (dayGroup) dayGroup.style.display = 'none';
        if (monthInput) monthInput.value = '';
        if (dayInput) dayInput.value = '';
      } else if (precision === 1) {
        if (monthGroup) monthGroup.style.display = '';
        if (dayGroup) dayGroup.style.display = 'none';
        if (dayInput) dayInput.value = '';
      } else {
        if (monthGroup) monthGroup.style.display = '';
        if (dayGroup) dayGroup.style.display = '';
      }
    });
  });
}

function makeDraggable(element, handle) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const dragHandle = handle || element;

  dragHandle.style.cursor = 'move';
  dragHandle.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    let newTop = element.offsetTop - pos2;
    let newLeft = element.offsetLeft - pos1;

    const parent = element.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const elemRect = element.getBoundingClientRect();

    const minTop = 10;
    const maxTop = parentRect.height - elemRect.height - 10;
    const minLeft = 10;
    const maxLeft = parentRect.width - elemRect.width - 10;

    newTop = Math.max(minTop, Math.min(newTop, maxTop));
    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

    element.style.top = newTop + 'px';
    element.style.left = newLeft + 'px';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }

  function closeDragElement() {
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }
}

function openEditMapView(event) {
  state.currentEditingEvent = event;
  setBreadcrumb(`首页 / ${state.currentCategory.name} / ${state.currentSubCategory.name} / ${event.title} / 修改`);

  document.getElementById('main-view').innerHTML = `
    <div class="map-edit-view">
      <div id="map"></div>
      <div class="floating-panel" id="edit-panel">
        <div class="floating-panel-header" id="edit-panel-header">
          <span class="floating-panel-title">修改事件</span>
        </div>
        <div class="floating-panel-body">
          <form id="edit-form">
            <div class="form-group">
              <label class="form-label required">事件名称</label>
              <input type="text" class="form-control" id="e-title" value="${escapeHtml(event.title || '')}" placeholder="请输入事件名称">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">开始时间</label>
                <div class="era-toggle" id="edit-start-era">
                  <button type="button" class="era-toggle-btn" data-era="ce">公元</button>
                  <button type="button" class="era-toggle-btn" data-era="bce">公元前</button>
                </div>
                <div class="date-picker-group">
                  <div class="form-group year-field">
                    <input type="number" class="form-control" id="e-start-year" placeholder="年" min="1">
                  </div>
                  <div class="form-group" id="edit-start-month-group">
                    <input type="number" class="form-control" id="e-start-month" placeholder="月" min="1" max="12">
                  </div>
                  <div class="form-group" id="edit-start-day-group">
                    <input type="number" class="form-control" id="e-start-day" placeholder="日" min="1" max="31">
                  </div>
                </div>
                <div class="date-precision-row" id="edit-start-precision-row">
                  <button type="button" class="date-precision-btn" data-precision="0">仅年</button>
                  <button type="button" class="date-precision-btn" data-precision="1">年月</button>
                  <button type="button" class="date-precision-btn" data-precision="2">年月日</button>
                </div>
              </div>
              <div class="form-group">
                <div class="form-label-row">
                  <label class="form-label">结束时间</label>
                  <button type="button" class="sync-btn" id="edit-sync-end-btn">⟳ 同步开始</button>
                </div>
                <div class="era-toggle" id="edit-end-era">
                  <button type="button" class="era-toggle-btn" data-era="ce">公元</button>
                  <button type="button" class="era-toggle-btn" data-era="bce">公元前</button>
                </div>
                <div class="date-picker-group">
                  <div class="form-group year-field">
                    <input type="number" class="form-control" id="e-end-year" placeholder="年" min="1">
                  </div>
                  <div class="form-group" id="edit-end-month-group">
                    <input type="number" class="form-control" id="e-end-month" placeholder="月" min="1" max="12">
                  </div>
                  <div class="form-group" id="edit-end-day-group">
                    <input type="number" class="form-control" id="e-end-day" placeholder="日" min="1" max="31">
                  </div>
                </div>
                <div class="date-precision-row" id="edit-end-precision-row">
                  <button type="button" class="date-precision-btn" data-precision="0">仅年</button>
                  <button type="button" class="date-precision-btn" data-precision="1">年月</button>
                  <button type="button" class="date-precision-btn" data-precision="2">年月日</button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">说明</label>
              <textarea class="form-control" id="e-desc" placeholder="事件详细说明..." rows="3">${escapeHtml(event.description || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">提示</label>
              <textarea class="form-control" id="e-tips" placeholder="提示信息（猜图时显示，非必填）" rows="2">${escapeHtml(event.tips || '')}</textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">纬度</label>
                <input type="number" step="any" class="form-control" id="e-lat" value="${event.location_lat ?? ''}" placeholder="39.9042">
              </div>
              <div class="form-group">
                <label class="form-label">经度</label>
                <input type="number" step="any" class="form-control" id="e-lng" value="${event.location_lng ?? ''}" placeholder="116.4074">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">地点名称</label>
              <input type="text" class="form-control" id="e-locname" value="${escapeHtml(event.location_name || '')}" placeholder="如：北京天安门">
            </div>
            <div class="form-group">
              <label class="form-label">排序</label>
              <input type="number" class="form-control" id="e-sort" value="${event.sort_order || 0}" placeholder="数字越小越靠前">
            </div>
          </form>
        </div>
        <div class="floating-panel-footer">
          <button class="btn btn-default" id="edit-cancel-btn">取消</button>
          <button class="btn btn-primary" id="edit-save-btn">更新</button>
        </div>
      </div>
    </div>
  `;

  if (state.map) { state.map.remove(); state.map = null; }

  const sub = state.currentSubCategory;
  let tileType = 'hybrid';
  let tileUrl = '';
  let tileSd = 'a,b,c';
  let mapMinZoom = 2;
  let mapMaxZoom = 8;

  if (sub) {
    if (sub.map_tile_type) tileType = sub.map_tile_type;
    if (sub.map_tile_url) tileUrl = sub.map_tile_url;
    if (sub.map_tile_subdomains) tileSd = sub.map_tile_subdomains;
    if (sub.map_min_zoom != null) mapMinZoom = parseInt(sub.map_min_zoom);
    if (sub.map_max_zoom != null) mapMaxZoom = parseInt(sub.map_max_zoom);
  }

  let center, zoom;
  if (event.location_lat && event.location_lng) {
    center = [event.location_lat, event.location_lng];
    zoom = 4;
  } else if (sub && sub.center_lat != null && sub.center_lng != null) {
    center = [parseFloat(sub.center_lat), parseFloat(sub.center_lng)];
    zoom = sub.default_zoom != null ? parseInt(sub.default_zoom) : ((sub?.code === 'china') ? 4 : 2);
  } else {
    const subCode = sub?.code || '';
    if (subCode === 'china') {
      center = [35, 105];
      zoom = 4;
    } else {
      center = [30, 120];
      zoom = 2;
    }
  }

  state.map = L.map('map', {
    center: center,
    zoom: zoom,
    minZoom: mapMinZoom,
    maxZoom: mapMaxZoom,
    zoomControl: true,
    worldCopyJump: true
  });

  addTileLayersToMap(state.map, tileType, tileUrl, tileSd, mapMinZoom, mapMaxZoom);

  loadChinaProvinces();
  loadWorldAdmin1Labels();

  let editMarker = null;
  if (event.location_lat && event.location_lng) {
    editMarker = L.marker([event.location_lat, event.location_lng], {
      draggable: true
    }).addTo(state.map);

    editMarker.on('dragend', () => {
      const pos = editMarker.getLatLng();
      document.getElementById('e-lat').value = pos.lat.toFixed(6);
      document.getElementById('e-lng').value = pos.lng.toFixed(6);
    });
  }

  const panel = document.getElementById('edit-panel');
  const panelHeader = document.getElementById('edit-panel-header');
  makeDraggable(panel, panelHeader);

  const startParts = event.start_ts ? tsToYearMonthDay(event.start_ts) : { year: '', month: '', day: '', isBce: false };
  const endParts = event.end_ts ? tsToYearMonthDay(event.end_ts) : { year: '', month: '', day: '', isBce: false };

  document.getElementById('e-start-year').value = startParts.year;
  document.getElementById('e-start-month').value = startParts.month;
  document.getElementById('e-start-day').value = startParts.day;
  document.getElementById('e-end-year').value = endParts.year;
  document.getElementById('e-end-month').value = endParts.month;
  document.getElementById('e-end-day').value = endParts.day;

  setupEraToggle('edit-start-era', startParts.isBce);
  setupEraToggle('edit-end-era', endParts.isBce);
  setupPrecisionRow('edit-start-precision-row', 'edit-start-month-group', 'edit-start-day-group', event.start_precision || 2);
  setupPrecisionRow('edit-end-precision-row', 'edit-end-month-group', 'edit-end-day-group', event.end_precision || 2);
  bindDateFieldBounds('e-start-month', 'e-start-day');
  bindDateFieldBounds('e-end-month', 'e-end-day');

  document.getElementById('edit-sync-end-btn').addEventListener('click', () => {
    syncEndFromStart({
      startYearId: 'e-start-year',
      startMonthId: 'e-start-month',
      startDayId: 'e-start-day',
      startEraId: 'edit-start-era',
      startPrecisionRowId: 'edit-start-precision-row',
      endYearId: 'e-end-year',
      endMonthId: 'e-end-month',
      endDayId: 'e-end-day',
      endEraId: 'edit-end-era',
      endPrecisionRowId: 'edit-end-precision-row',
      endMonthGroupId: 'edit-end-month-group',
      endDayGroupId: 'edit-end-day-group'
    });
  });

  const latInput = document.getElementById('e-lat');
  const lngInput = document.getElementById('e-lng');

  function updateMarkerFromInputs() {
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (editMarker) {
        editMarker.setLatLng([lat, lng]);
      } else {
        editMarker = L.marker([lat, lng], { draggable: true }).addTo(state.map);
        editMarker.on('dragend', () => {
          const pos = editMarker.getLatLng();
          latInput.value = pos.lat.toFixed(6);
          lngInput.value = pos.lng.toFixed(6);
        });
      }
      state.map.panTo([lat, lng]);
    }
  }

  latInput.addEventListener('change', updateMarkerFromInputs);
  lngInput.addEventListener('change', updateMarkerFromInputs);

  state.map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    latInput.value = lat.toFixed(6);
    lngInput.value = lng.toFixed(6);

    if (editMarker) {
      editMarker.setLatLng([lat, lng]);
    } else {
      editMarker = L.marker([lat, lng], { draggable: true }).addTo(state.map);
      editMarker.on('dragend', () => {
        const pos = editMarker.getLatLng();
        latInput.value = pos.lat.toFixed(6);
        lngInput.value = pos.lng.toFixed(6);
      });
    }
  });

  document.getElementById('edit-cancel-btn').addEventListener('click', renderEventList);

  document.getElementById('edit-save-btn').addEventListener('click', async () => {
    const title = document.getElementById('e-title').value.trim();
    if (!title) {
      toast('请输入事件名称', 'error');
      return;
    }

    const startEra = document.querySelector('#edit-start-era .era-toggle-btn.active').dataset.era;
    const startPrecision = parseInt(document.querySelector('#edit-start-precision-row .date-precision-btn.active').dataset.precision);
    const startYear = document.getElementById('e-start-year').value;
    const startMonth = document.getElementById('e-start-month').value;
    const startDay = document.getElementById('e-start-day').value;

    let startTs = startYear ? dateToTs(startYear, startMonth || 1, startDay || 1, startEra === 'bce') : null;
    if (startTs !== null && startPrecision === 0) startTs = dateToTs(startYear, 1, 1, startEra === 'bce');
    else if (startTs !== null && startPrecision === 1) startTs = dateToTs(startYear, startMonth || 1, 1, startEra === 'bce');

    let endTs = null;
    let endPrecision = 0;
    const endYear = document.getElementById('e-end-year').value;
    if (endYear) {
      const endEra = document.querySelector('#edit-end-era .era-toggle-btn.active').dataset.era;
      endPrecision = parseInt(document.querySelector('#edit-end-precision-row .date-precision-btn.active').dataset.precision);
      const endMonth = document.getElementById('e-end-month').value;
      const endDay = document.getElementById('e-end-day').value;
      if (endPrecision === 0) endTs = dateToTs(endYear, 1, 1, endEra === 'bce');
      else if (endPrecision === 1) endTs = dateToTs(endYear, endMonth || 1, 1, endEra === 'bce');
      else endTs = dateToTs(endYear, endMonth || 1, endDay || 1, endEra === 'bce');
    }

    const data = {
      category_id: state.currentCategory.id,
      sub_category_id: state.currentSubCategory.id,
      title: title,
      start_ts: startTs,
      start_precision: startTs !== null ? startPrecision : 0,
      end_ts: endTs,
      end_precision: endPrecision,
      description: document.getElementById('e-desc').value.trim() || null,
      tips: document.getElementById('e-tips').value.trim() || null,
      location_lat: document.getElementById('e-lat').value || null,
      location_lng: document.getElementById('e-lng').value || null,
      location_name: document.getElementById('e-locname').value.trim() || null,
      sort_order: parseInt(document.getElementById('e-sort').value) || 0
    };

    const res = await API.put(`/events/${event.id}`, data);
    if (res.success) {
      toast(res.message, 'success');
      renderEventList();
    } else {
      toast(res.message, 'error');
    }
  });
}

function setupPrecisionRow(rowId, monthGroupId, dayGroupId, defaultPrecision = 2) {
  const row = document.getElementById(rowId);
  const btns = row.querySelectorAll('.date-precision-btn');
  
  btns.forEach(btn => {
    if (parseInt(btn.dataset.precision) === defaultPrecision) {
      btn.classList.add('active');
    }
  });

  const monthGroup = document.getElementById(monthGroupId);
  const dayGroup = document.getElementById(dayGroupId);
  const monthInput = monthGroup ? monthGroup.querySelector('input') : null;
  const dayInput = dayGroup ? dayGroup.querySelector('input') : null;

  if (defaultPrecision === 0) {
    if (monthGroup) monthGroup.style.display = 'none';
    if (dayGroup) dayGroup.style.display = 'none';
  } else if (defaultPrecision === 1) {
    if (monthGroup) monthGroup.style.display = '';
    if (dayGroup) dayGroup.style.display = 'none';
  }

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const precision = parseInt(btn.dataset.precision);

      if (precision === 0) {
        if (monthGroup) monthGroup.style.display = 'none';
        if (dayGroup) dayGroup.style.display = 'none';
        if (monthInput) monthInput.value = '';
        if (dayInput) dayInput.value = '';
      } else if (precision === 1) {
        if (monthGroup) monthGroup.style.display = '';
        if (dayGroup) dayGroup.style.display = 'none';
        if (dayInput) dayInput.value = '';
      } else {
        if (monthGroup) monthGroup.style.display = '';
        if (dayGroup) dayGroup.style.display = '';
      }
    });
  });
}

function setupEraToggle(containerId, defaultIsBce = false) {
  const container = document.getElementById(containerId);
  const btns = container.querySelectorAll('.era-toggle-btn');
  
  btns.forEach(btn => {
    if ((defaultIsBce && btn.dataset.era === 'bce') || (!defaultIsBce && btn.dataset.era === 'ce')) {
      btn.classList.add('active');
    }
  });

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function deleteEvent(event) {
  confirmDialog(
    `确定要删除事件「${event.title}」吗？`,
    async () => {
      const res = await API.delete(`/events/${event.id}`);
      if (res.success) {
        toast(res.message, 'success');
        loadEvents();
      } else {
        toast(res.message, 'error');
      }
    },
    '该操作同时删除关联的图片记录'
  );
}

async function openImageManager(event) {
  state.currentEditingEvent = event;
  setBreadcrumb(`首页 / ${state.currentCategory.name} / ${state.currentSubCategory.name} / ${event.title} / 图片管理`);

  document.getElementById('main-view').innerHTML = `
    <div class="page-header">
      <div>
        <span class="back-link" id="back-btn">← 返回列表</span>
        <h2 class="page-title" style="margin-top:8px;">图片管理 - ${escapeHtml(event.title)}</h2>
      </div>
    </div>
    <div class="table-container" style="padding:24px;">
      <div class="image-manager-tabs">
        <button type="button" class="img-mgr-tab active" data-tab="upload">📤 上传图片</button>
        <button type="button" class="img-mgr-tab" data-tab="url">🔗 添加URL图片</button>
      </div>
      <div class="img-mgr-tab-panel" id="img-mgr-upload-panel">
        <div class="image-upload-area" id="upload-area">
          <div style="font-size:40px;">📤</div>
          <p>点击或拖拽图片到此处上传</p>
          <p style="font-size:12px;color:#a0aec0;margin-top:4px;">支持 JPG、PNG、GIF、WEBP、BMP 格式，单张最大 10MB，一次最多上传 20 张</p>
          <input type="file" id="file-input" accept="image/*" multiple style="display:none;">
        </div>
      </div>
      <div class="img-mgr-tab-panel" id="img-mgr-url-panel" style="display:none;">
        <div class="image-url-input">
          <input type="url" class="form-control" id="mgr-image-url" placeholder="粘贴图片URL (http://或https://开头)" style="max-width:100%;">
          <input type="text" class="form-control" id="mgr-image-name" placeholder="图片名称（可选）" style="max-width:100%;margin-top:8px;">
          <button class="btn btn-primary" id="mgr-add-url-btn" style="margin-top:8px;">+ 添加URL图片</button>
        </div>
      </div>
      <div id="images-container">
        <div style="text-align:center;padding:30px;color:#718096;">加载中...</div>
      </div>
    </div>
    <input type="file" id="replace-file-input" accept="image/*" style="display:none;">
  `;

  document.getElementById('back-btn').addEventListener('click', renderEventList);

  document.querySelectorAll('.img-mgr-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.img-mgr-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('img-mgr-upload-panel').style.display = tabName === 'upload' ? '' : 'none';
      document.getElementById('img-mgr-url-panel').style.display = tabName === 'url' ? '' : 'none';
    });
  });

  document.getElementById('mgr-add-url-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('mgr-image-url');
    const nameInput = document.getElementById('mgr-image-name');
    const url = urlInput.value.trim();
    const name = nameInput.value.trim();

    if (!url) { toast('请输入图片URL', 'error'); return; }
    if (!/^https?:\/\//i.test(url)) { toast('URL必须以http://或https://开头', 'error'); return; }

    const res = await API.post('/images/add-url', { event_id: event.id, url, name });
    if (res.success) {
      toast(res.message, 'success');
      urlInput.value = '';
      nameInput.value = '';
      loadImages(event.id);
    } else {
      toast(res.message, 'error');
    }
  });

  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const replaceFileInput = document.getElementById('replace-file-input');

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      uploadImages(event.id, e.dataTransfer.files);
    }
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      uploadImages(event.id, e.target.files);
    }
  });

  replaceFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const imageToReplace = replaceImageHandler(file);
      replaceFileInput.value = '';
    }
  });

  await loadImages(event.id);
}

let imageToReplaceId = null;

function replaceImageHandler(file) {
  if (!imageToReplaceId || !state.currentEditingEvent) return;
  
  const eventId = state.currentEditingEvent.id;
  const oldImgId = imageToReplaceId;
  imageToReplaceId = null;

  if (!file || !file.type.startsWith('image/')) {
    toast('请选择有效的图片文件', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('event_id', eventId);
  formData.append('images', file);

  toast('正在替换图片...', 'info');

  (async () => {
    try {
      const uploadRes = await API.upload('/images/upload', formData);
      if (!uploadRes.success) {
        toast('上传失败: ' + uploadRes.message, 'error');
        return;
      }

      const delRes = await API.delete(`/images/${oldImgId}`);
      if (!delRes.success) {
        toast('旧图片删除失败，但新图片已上传', 'warning');
      } else {
        toast('替换成功', 'success');
      }

      loadImages(eventId);
    } catch (e) {
      toast('替换失败: ' + e.message, 'error');
    }
  })();
}

async function loadImages(eventId) {
  const container = document.getElementById('images-container');
  const res = await API.get(`/images/event/${eventId}`);

  if (!res.success) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#e53e3e;">加载失败</div>`;
    return;
  }

  state.currentImages = res.data;

  if (res.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:30px;">
        <div class="empty-state-icon">🖼️</div>
        <h3>暂无图片</h3>
        <p style="margin-top:8px;font-size:13px;">请上传或添加URL图片（至少一张）</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="images-grid">
      ${res.data.map(img => {
        const isUrl = img.file_path && (img.file_path.startsWith('http://') || img.file_path.startsWith('https://'));
        return `
        <div class="image-card">
          <img src="${img.url}" alt="${escapeHtml(img.original_name || '')}">
          ${isUrl ? '<div class="url-image-tag">URL</div>' : ''}
          ${!isUrl ? `<button class="image-card-replace" data-id="${img.id}" title="替换">⟳</button>` : ''}
          <button class="image-card-delete" data-id="${img.id}" title="删除">×</button>
          <div class="image-card-info">
            <div class="image-card-name">${escapeHtml(img.original_name || img.filename)}</div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;

  container.querySelectorAll('.image-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const imgId = parseInt(btn.dataset.id);
      if (state.currentImages && state.currentImages.length <= 1) {
        toast('至少需要保留一张图片（上传或URL均可）', 'error');
        return;
      }
      confirmDialog('确定删除这张图片吗？', async () => {
        const delRes = await API.delete(`/images/${imgId}`);
        if (delRes.success) {
          toast(delRes.message, 'success');
          loadImages(eventId);
        } else {
          toast(delRes.message, 'error');
        }
      });
    });
  });

  container.querySelectorAll('.image-card-replace').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageToReplaceId = parseInt(btn.dataset.id);
      document.getElementById('replace-file-input').click();
    });
  });
}

async function uploadImages(eventId, files) {
  const formData = new FormData();
  formData.append('event_id', eventId);
  Array.from(files).forEach(f => formData.append('images', f));

  toast('正在上传...', 'info');
  const res = await API.upload('/images/upload', formData);

  if (res.success) {
    toast(res.message, 'success');
    loadImages(eventId);
  } else {
    toast(res.message, 'error');
  }
}

init();
