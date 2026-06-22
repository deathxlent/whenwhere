window.HSD = window.HSD || {};

HSD.categoriesView = {
  getTileTypeName(type) {
    const map = {
      osm: 'OSM标准',
      amap_street: '高德街道',
      amap_satellite: '高德卫星',
      hybrid: '混合图层',
      custom: '自定义'
    };
    return map[type] || (type || '未知');
  },

  openForEditing(category) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-link[data-view="categories"]').classList.add('active');
    HSD.categoriesView.render(null, category.id);
  },

  async render(container, selectedCategoryId = null) {
    if (!container) container = document.getElementById('main-view');
    const breadcrumb = document.getElementById('breadcrumb-text');
    if (breadcrumb) breadcrumb.textContent = '类别管理';
    HSD.mapCore.restoreLayout();

    const [catRes, mapRes] = await Promise.all([
      API.get('/categories'),
      API.get('/maps')
    ]);
    if (catRes.success) HSD.state.categories = catRes.data;
    if (mapRes.success) HSD.state.maps = mapRes.data;

    const listHtml = HSD.state.categories.map(cat => `
      <div class="category-list-item ${selectedCategoryId == cat.id ? 'selected' : ''}" data-id="${cat.id}">
        <div class="category-list-name">
          <span style="margin-right:8px;">${HSD.homeView.getCategoryIcon(cat.code)}</span>
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

    container.innerHTML = `
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

    container.querySelectorAll('.category-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const cat = HSD.state.categories.find(c => c.id == item.dataset.id);
        HSD.state.currentCategory = cat;
        container.querySelectorAll('.category-list-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        HSD.categoriesView.loadDetail(cat);
      });
    });

    document.getElementById('add-category-btn').addEventListener('click', () => HSD.categoriesView.openCategoryModal(null));

    if (selectedCategoryId) {
      const cat = HSD.state.categories.find(c => c.id == selectedCategoryId);
      if (cat) HSD.categoriesView.loadDetail(cat);
    }
  },

  async loadDetail(category) {
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
              <span class="info-value">${HSD.categoriesView.getTileTypeName(sub.map_tile_type)}</span>
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

    document.getElementById('add-sub-btn').addEventListener('click', () => HSD.categoriesView.openSubCategoryModal(null, category.id));
    document.getElementById('edit-cat-btn').addEventListener('click', () => HSD.categoriesView.openCategoryModal(category));
    document.getElementById('delete-cat-btn').addEventListener('click', () => HSD.categoriesView.confirmDeleteCategory(category));

    panel.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = subs.find(s => s.id == btn.dataset.id);
        if (sub) HSD.categoriesView.openSubCategoryModal(sub, category.id);
      });
    });

    panel.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = subs.find(s => s.id == btn.dataset.id);
        if (sub) HSD.categoriesView.confirmDeleteSubCategory(sub, category);
      });
    });

    panel.querySelectorAll('[data-action="events"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sub = subs.find(s => s.id == btn.dataset.id);
        if (sub) {
          HSD.state.currentSubCategory = sub;
          document.getElementById('breadcrumb-text').textContent = `类别管理 / ${category.name} / ${sub.name} / 事件列表`;
          HSD.eventList.render();
        }
      });
    });
  },

  openCategoryModal(category = null) {
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
        HSD.categoriesView.render(null, isEdit ? category.id : res.data?.id);
      } else {
        toast(res.message, 'error');
      }
    });
  },

  confirmDeleteCategory(category) {
    confirmDialog(`⚠️ 确定要删除大类别「${category.name}」吗？`, async () => {
      const res = await API.delete(`/categories/${category.id}`);
      if (res.success) {
        toast(res.message, 'success');
        HSD.categoriesView.render();
      } else {
        toast(res.message, 'error');
      }
    }, '此操作是【删除整个大类别】，同时会禁用该大类下所有关联的子类别和事件，数据不可恢复，请谨慎操作！');
  },

  confirmDeleteSubCategory(sub, category) {
    confirmDialog(`确定要删除子类别「${sub.name}」吗？`, async () => {
      const res = await API.delete(`/categories/${category.id}/sub-categories/${sub.id}`);
      if (res.success) {
        toast(res.message, 'success');
        HSD.categoriesView.loadDetail(category);
      } else {
        toast(res.message, 'error');
      }
    }, '该操作将同时删除所有关联的事件，无法撤销');
  },

  async openSubCategoryModal(sub = null, categoryId) {
    const isEdit = sub != null;
    const mapOptions = HSD.state.maps.map(m =>
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
        HSD.categoriesView.loadDetail(HSD.state.categories.find(c => c.id == categoryId));
      } else {
        toast(res.message, 'error');
      }
    });
  }
};
