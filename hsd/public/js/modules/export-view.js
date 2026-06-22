window.HSD = window.HSD || {};

HSD.exportView = {
  state: {
    events: [],
    categories: [],
    subCategories: [],
    selectedCategoryId: '',
    selectedSubCategoryId: '',
    selectedEventIds: new Set()
  },

  async render(container) {
    if (!container) container = document.getElementById('main-view');
    const breadcrumb = document.getElementById('breadcrumb-text');
    if (breadcrumb) breadcrumb.textContent = '数据导出';
    HSD.mapCore.restoreLayout();

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">📤 数据导出</h2>
      </div>

      <div class="info-panel" style="margin-bottom:20px;background:#f0fff4;border:1px solid #c6f6d5;border-radius:8px;padding:16px;">
        <div style="font-weight:600;color:#22543d;margin-bottom:10px;">📖 导出说明</div>
        <div style="color:#2d3748;font-size:13px;line-height:1.8;">
          <div><strong>导出格式：</strong></div>
          <div>• <strong>ZIP 包</strong>：包含 JSON 数据 + SQL 数据 + 瓦片 + 图片</div>
          <div>• <strong>JSON 文件</strong>：仅数据，不含瓦片和图片</div>
          <div style="margin-top:10px;"><strong>用途：</strong></div>
          <div>• 导出的数据可导入到 adddatatools 或其他 hsd 实例</div>
          <div>• 导出的 ZIP 文件可以直接在数据导入页面上传</div>
        </div>
      </div>

      <div class="export-toolbar" style="background:#fff;border-radius:8px;padding:16px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div>
            <label style="font-size:13px;color:#4a5568;margin-right:6px;">一级分类：</label>
            <select id="export-category-filter" class="form-select" style="padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              <option value="">全部</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;color:#4a5568;margin-right:6px;">二级分类：</label>
            <select id="export-subcategory-filter" class="form-select" style="padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              <option value="">全部</option>
            </select>
          </div>
          <div style="flex:1;"></div>
          <button class="btn btn-secondary" id="export-select-all-btn" style="padding:6px 14px;">全选</button>
          <button class="btn btn-secondary" id="export-deselect-all-btn" style="padding:6px 14px;">取消全选</button>
          <button class="btn btn-primary" id="export-zip-btn" style="padding:6px 14px;">📦 导出选中 ZIP</button>
          <button class="btn btn-secondary" id="export-json-btn" style="padding:6px 14px;">📄 导出全部 JSON</button>
        </div>
        <div style="margin-top:10px;font-size:12px;color:#718096;">
          已选中 <span id="export-selected-count" style="font-weight:600;color:#2b6cb0;">0</span> 个事件
        </div>
      </div>

      <div class="export-event-list" style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;">
        <div style="padding:12px 16px;background:#f7fafc;border-bottom:1px solid #e2e8f0;font-weight:600;color:#2d3748;">
          事件列表
        </div>
        <div id="export-event-list-body" style="max-height:500px;overflow-y:auto;">
          <div style="padding:40px;text-align:center;color:#a0aec0;">加载中...</div>
        </div>
      </div>
    `;

    await this.loadData();
    this.bindEvents();
    this.renderFilters();
    this.renderEventList();
  },

  async loadData() {
    const params = new URLSearchParams();
    if (this.state.selectedCategoryId) params.append('category_id', this.state.selectedCategoryId);
    if (this.state.selectedSubCategoryId) params.append('sub_category_id', this.state.selectedSubCategoryId);

    const res = await API.get(`/export/events?${params.toString()}`);
    if (res.success) {
      this.state.events = res.data.events;
      this.state.categories = res.data.categories;
      this.state.subCategories = res.data.subCategories;
    }
  },

  renderFilters() {
    const catSelect = document.getElementById('export-category-filter');
    const subCatSelect = document.getElementById('export-subcategory-filter');

    catSelect.innerHTML = '<option value="">全部</option>' +
      this.state.categories.map(c =>
        `<option value="${c.id}" ${c.id == this.state.selectedCategoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
      ).join('');

    const filteredSubCats = this.state.selectedCategoryId
      ? this.state.subCategories.filter(sc => sc.category_id == this.state.selectedCategoryId)
      : this.state.subCategories;

    subCatSelect.innerHTML = '<option value="">全部</option>' +
      filteredSubCats.map(sc =>
        `<option value="${sc.id}" ${sc.id == this.state.selectedSubCategoryId ? 'selected' : ''}>${escapeHtml(sc.name)}</option>`
      ).join('');
  },

  renderEventList() {
    const body = document.getElementById('export-event-list-body');
    const countEl = document.getElementById('export-selected-count');

    countEl.textContent = this.state.selectedEventIds.size;

    if (this.state.events.length === 0) {
      body.innerHTML = '<div style="padding:40px;text-align:center;color:#a0aec0;">暂无事件</div>';
      return;
    }

    let html = '';
    for (const ev of this.state.events) {
      const checked = this.state.selectedEventIds.has(ev.id);
      html += `
        <div class="export-event-item" data-id="${ev.id}" style="padding:10px 16px;border-bottom:1px solid #edf2f7;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background 0.2s;"
             onmouseover="this.style.backgroundColor='#f7fafc'" onmouseout="this.style.backgroundColor='transparent'">
          <input type="checkbox" class="export-event-checkbox" data-id="${ev.id}" ${checked ? 'checked' : ''}
                 style="width:16px;height:16px;cursor:pointer;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:500;color:#2d3748;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${escapeHtml(ev.title)}
            </div>
            <div style="font-size:12px;color:#718096;margin-top:2px;">
              <span style="background:#edf2f7;padding:2px 8px;border-radius:4px;">${escapeHtml(ev.category_name)}</span>
              <span style="color:#cbd5e0;margin:0 4px;">/</span>
              <span style="background:#edf2f7;padding:2px 8px;border-radius:4px;">${escapeHtml(ev.sub_category_name)}</span>
              ${ev.location_name ? `<span style="margin-left:8px;">📍 ${escapeHtml(ev.location_name)}</span>` : ''}
            </div>
          </div>
          <div style="font-size:12px;color:#a0aec0;">
            ${ev.start_ts ? new Date(ev.start_ts * 1000).toLocaleDateString() : ''}
          </div>
        </div>
      `;
    }
    body.innerHTML = html;

    body.querySelectorAll('.export-event-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') return;
        const id = parseInt(item.dataset.id);
        const checkbox = item.querySelector('.export-event-checkbox');
        if (this.state.selectedEventIds.has(id)) {
          this.state.selectedEventIds.delete(id);
          checkbox.checked = false;
        } else {
          this.state.selectedEventIds.add(id);
          checkbox.checked = true;
        }
        countEl.textContent = this.state.selectedEventIds.size;
      });
    });

    body.querySelectorAll('.export-event-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(cb.dataset.id);
        if (cb.checked) {
          this.state.selectedEventIds.add(id);
        } else {
          this.state.selectedEventIds.delete(id);
        }
        countEl.textContent = this.state.selectedEventIds.size;
      });
    });
  },

  bindEvents() {
    const catSelect = document.getElementById('export-category-filter');
    const subCatSelect = document.getElementById('export-subcategory-filter');

    catSelect.addEventListener('change', async () => {
      this.state.selectedCategoryId = catSelect.value;
      this.state.selectedSubCategoryId = '';
      this.state.selectedEventIds.clear();
      this.renderFilters();
      await this.loadData();
      this.renderEventList();
    });

    subCatSelect.addEventListener('change', async () => {
      this.state.selectedSubCategoryId = subCatSelect.value;
      this.state.selectedEventIds.clear();
      await this.loadData();
      this.renderEventList();
    });

    document.getElementById('export-select-all-btn').addEventListener('click', () => {
      this.state.events.forEach(ev => this.state.selectedEventIds.add(ev.id));
      this.renderEventList();
    });

    document.getElementById('export-deselect-all-btn').addEventListener('click', () => {
      this.state.selectedEventIds.clear();
      this.renderEventList();
    });

    document.getElementById('export-zip-btn').addEventListener('click', () => {
      this.exportZip();
    });

    document.getElementById('export-json-btn').addEventListener('click', () => {
      this.exportJson();
    });
  },

  async exportZip() {
    if (this.state.selectedEventIds.size === 0) {
      toast('请先选择要导出的事件', 'error');
      return;
    }

    try {
      const res = await fetch('/api/export/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_ids: Array.from(this.state.selectedEventIds) })
      });

      if (!res.ok) throw new Error('导出失败');

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `hsd_export_${Date.now()}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast('ZIP 导出成功', 'success');
    } catch (e) {
      toast('导出失败：' + e.message, 'error');
    }
  },

  exportJson() {
    const a = document.createElement('a');
    a.href = '/api/export/json';
    a.download = `hsd_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('JSON 导出中...', 'info');
  }
};
