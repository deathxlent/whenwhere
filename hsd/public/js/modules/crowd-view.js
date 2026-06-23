window.HSD = window.HSD || {};

HSD.crowdView = {
  state: {
    currentPage: 'dashboard',
    map: null,
    markers: [],
    selectedSubCategoryId: null,
    selectedCategoryId: null,
    editingEventId: null,
    tempMarker: null,
    currentSubCategoryData: null,
    startPrecision: 2,
    endPrecision: 2,
    startEra: 'ce',
    endEra: 'ce',
    eventListPage: 1,
    selectedExportIds: new Set()
  },

  apiBase: '/api/crowd',

  async api(url, options = {}) {
    const defaultOptions = {
      headers: { 'Content-Type': 'application/json' }
    };
    const opts = { ...defaultOptions, ...options };
    if (opts.body && typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body);
    }
    try {
      const res = await fetch(this.apiBase + url, opts);
      return await res.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  render(container) {
    if (!container) container = document.getElementById('main-view');
    const breadcrumb = document.getElementById('breadcrumb-text');
    if (breadcrumb) breadcrumb.textContent = '众筹出题';
    HSD.mapCore.restoreLayout();

    container.innerHTML = `
      <div class="crowd-app" style="display:flex;flex-direction:column;height:calc(100vh - 100px);min-height:600px;">
        <div class="crowd-toolbar" style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #e5e7eb;margin-bottom:12px;border-radius:8px;">
          <div class="crowd-nav" style="display:flex;gap:4px;">
            <button class="crowd-nav-btn active" data-page="dashboard" style="padding:8px 14px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px;color:#6b7280;transition:all 0.2s;">📊 概览</button>
            <button class="crowd-nav-btn" data-page="events" style="padding:8px 14px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px;color:#6b7280;transition:all 0.2s;">📍 出题</button>
            <button class="crowd-nav-btn" data-page="categories" style="padding:8px 14px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px;color:#6b7280;transition:all 0.2s;">📁 分类</button>
            <button class="crowd-nav-btn" data-page="maps" style="padding:8px 14px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px;color:#6b7280;transition:all 0.2s;">🗺️ 地图</button>
            <button class="crowd-nav-btn" data-page="export" style="padding:8px 14px;border:none;background:transparent;border-radius:6px;cursor:pointer;font-size:13px;color:#6b7280;transition:all 0.2s;">📤 导出</button>
          </div>
          <div style="flex:1;"></div>
          <div class="crowd-title" style="font-weight:600;color:#1f2937;">众筹出题管理</div>
        </div>
        <div class="crowd-content" id="crowd-content" style="flex:1;overflow:auto;"></div>
      </div>

      <div id="crowd-modal" class="modal-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;z-index:10000;">
        <div class="modal" style="background:#fff;border-radius:10px;width:90%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;">
          <div class="modal-header" style="padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">
            <h3 id="crowd-modal-title" style="font-size:16px;margin:0;">标题</h3>
            <button id="crowd-modal-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999;line-height:1;">×</button>
          </div>
          <div id="crowd-modal-body" class="modal-body" style="padding:16px 20px;overflow-y:auto;flex:1;"></div>
          <div id="crowd-modal-footer" class="modal-footer" style="padding:12px 20px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px;"></div>
        </div>
      </div>
    `;

    this.bindNav();
    this.switchPage('dashboard');
  },

  bindNav() {
    document.querySelectorAll('.crowd-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchPage(btn.dataset.page);
      });
    });

    document.getElementById('crowd-modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('crowd-modal').addEventListener('click', (e) => {
      if (e.target.id === 'crowd-modal') this.closeModal();
    });
  },

  switchPage(page) {
    this.state.currentPage = page;

    document.querySelectorAll('.crowd-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
      if (b.classList.contains('active')) {
        b.style.background = '#eff6ff';
        b.style.color = '#2563eb';
      } else {
        b.style.background = 'transparent';
        b.style.color = '#6b7280';
      }
    });

    this.cleanupMap();

    switch (page) {
      case 'dashboard':
        this.renderDashboard();
        break;
      case 'events':
        this.renderEventsPage();
        break;
      case 'categories':
        this.renderCategoriesPage();
        break;
      case 'maps':
        this.renderMapsPage();
        break;
      case 'export':
        this.renderExportPage();
        break;
    }
  },

  cleanupMap() {
    if (this.state.map) {
      this.state.map.remove();
      this.state.map = null;
    }
    this.state.markers = [];
    this.state.tempMarker = null;
  },

  openModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('crowd-modal-title').textContent = title;
    document.getElementById('crowd-modal-body').innerHTML = bodyHtml;
    document.getElementById('crowd-modal-footer').innerHTML = footerHtml;
    document.getElementById('crowd-modal').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('crowd-modal').style.display = 'none';
  },

  renderDashboard() {
    const content = document.getElementById('crowd-content');
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px;">
        <div class="stat-card" style="background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border-radius:10px;padding:20px;">
          <div style="font-size:12px;opacity:0.8;">地图数量</div>
          <div id="crowd-stat-maps" style="font-size:32px;font-weight:700;">-</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;border-radius:10px;padding:20px;">
          <div style="font-size:12px;opacity:0.8;">分类数量</div>
          <div id="crowd-stat-categories" style="font-size:32px;font-weight:700;">-</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border-radius:10px;padding:20px;">
          <div style="font-size:12px;opacity:0.8;">子分类数量</div>
          <div id="crowd-stat-subcats" style="font-size:32px;font-weight:700;">-</div>
        </div>
        <div class="stat-card" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;border-radius:10px;padding:20px;">
          <div style="font-size:12px;opacity:0.8;">事件总数</div>
          <div id="crowd-stat-events" style="font-size:32px;font-weight:700;">-</div>
        </div>
      </div>

      <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:16px;">
        <h3 style="font-size:15px;margin-bottom:12px;">快速开始</h3>
        <ol style="padding-left:20px;line-height:2;color:#4b5563;font-size:13px;">
          <li>在 <b>🗺️ 地图</b> 中添加需要的地图（默认已有世界地图）</li>
          <li>在 <b>📁 分类</b> 中创建分类和子分类，并绑定地图</li>
          <li>在 <b>📍 出题</b> 中选择子分类，在地图上点击添加事件</li>
          <li>在 <b>📤 导出</b> 中导出数据，导入到 ww 应用</li>
        </ol>
      </div>

      <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <h3 style="font-size:15px;margin-bottom:12px;">最近添加的事件</h3>
        <div id="crowd-recent-events">
          <div style="text-align:center;padding:30px;color:#a0aec0;">加载中...</div>
        </div>
      </div>
    `;

    this.loadDashboardStats();
    this.loadRecentEvents();
  },

  async loadDashboardStats() {
    const res = await this.api('/events/stats');
    if (res.success) {
      document.getElementById('crowd-stat-maps').textContent = res.data.maps;
      document.getElementById('crowd-stat-categories').textContent = res.data.categories;
      document.getElementById('crowd-stat-subcats').textContent = res.data.sub_categories;
      document.getElementById('crowd-stat-events').textContent = res.data.events;
    }
  },

  async loadRecentEvents() {
    const res = await this.api('/events/recent?limit=10');
    const el = document.getElementById('crowd-recent-events');

    if (!res.success || res.data.length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">暂无事件</div>';
      return;
    }

    let html = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">标题</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">分类</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">时间</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">地点</th></tr></thead><tbody>';

    res.data.forEach(e => {
      html += `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 12px;">${this.escapeHtml(e.title)}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(e.sub_category_name || '-')}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(e.start_display || '-')}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(e.location_name || '-')}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    el.innerHTML = html;
  },

  renderEventsPage() {
    const content = document.getElementById('crowd-content');
    content.innerHTML = `
      <div style="background:#fff;border-radius:8px;padding:12px 16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;align-items:end;">
          <div>
            <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">选择分类</label>
            <select id="crowd-event-category" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              <option value="">请选择分类</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">选择子分类</label>
            <div id="crowd-event-sub-tabs" style="display:flex;gap:6px;flex-wrap:wrap;">
              <span style="color:#a0aec0;font-size:13px;padding:6px 0;">请先选择分类</span>
            </div>
          </div>
        </div>
      </div>

      <div id="crowd-events-workspace" style="display:none;">
        <div style="display:flex;gap:12px;height:calc(100vh - 280px);min-height:500px;">
          <div style="flex:1;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column;">
            <div style="padding:8px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:13px;">
              <span id="crowd-map-info" style="font-weight:500;color:#374151;">地图</span>
              <span id="crowd-map-coords" style="color:#6b7280;font-family:monospace;">纬度: - | 经度: -</span>
            </div>
            <div id="crowd-event-map" style="flex:1;"></div>
            <div style="padding:8px 14px;background:#eff6ff;border-top:1px solid #bfdbfe;font-size:13px;color:#1e40af;">
              💡 点击地图任意位置添加事件标记
            </div>
          </div>

          <div style="width:380px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;">
            <div style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="padding:12px 16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
                <h3 id="crowd-event-form-title" style="font-size:14px;margin:0;">➕ 添加事件</h3>
                <button id="crowd-reset-form" class="btn btn-secondary btn-sm" style="padding:4px 10px;font-size:12px;">重置</button>
              </div>
              <div style="padding:12px 16px;">
                <div id="crowd-coord-box" style="padding:8px 12px;background:#f9fafb;border-radius:6px;font-size:13px;color:#374151;margin-bottom:12px;">
                  📍 <span id="crowd-disp-lat" style="color:#6b7280;">-</span>, <span id="crowd-disp-lng" style="color:#6b7280;">-</span>
                  <span id="crowd-coord-hint" style="color:#ef4444;font-size:12px;margin-left:8px;">请先在地图上点击选择位置</span>
                </div>

                <div style="margin-bottom:10px;">
                  <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">事件标题 <span style="color:#ef4444;">*</span></label>
                  <input type="text" id="crowd-event-title" placeholder="如：秦始皇统一六国" style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
                </div>
                <div style="margin-bottom:10px;">
                  <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">地点名称</label>
                  <input type="text" id="crowd-event-loc" placeholder="如：陕西咸阳" style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
                </div>

                <div style="margin-bottom:10px;">
                  <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">开始时间</label>
                  <div class="crowd-era-toggle" id="crowd-start-era" style="display:flex;gap:4px;margin-bottom:6px;">
                    <button type="button" class="crowd-era-btn active" data-era="ce" style="flex:1;padding:5px 10px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">公元</button>
                    <button type="button" class="crowd-era-btn" data-era="bce" style="flex:1;padding:5px 10px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">公元前</button>
                  </div>
                  <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <input type="number" id="crowd-start-year" placeholder="年" min="1" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center;">
                    <input type="number" id="crowd-start-month" placeholder="月" min="1" max="12" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center;">
                    <input type="number" id="crowd-start-day" placeholder="日" min="1" max="31" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center;">
                  </div>
                  <div class="crowd-precision-row" id="crowd-start-precision" style="display:flex;gap:4px;">
                    <button type="button" class="crowd-precision-btn" data-p="0" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">仅年</button>
                    <button type="button" class="crowd-precision-btn" data-p="1" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">年月</button>
                    <button type="button" class="crowd-precision-btn active" data-p="2" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">年月日</button>
                  </div>
                </div>

                <div style="margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <label style="font-size:12px;color:#374151;font-weight:500;">结束时间</label>
                    <button id="crowd-sync-end" type="button" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:12px;padding:0;">⟳ 同步开始</button>
                  </div>
                  <div class="crowd-era-toggle" id="crowd-end-era" style="display:flex;gap:4px;margin-bottom:6px;">
                    <button type="button" class="crowd-era-btn active" data-era="ce" style="flex:1;padding:5px 10px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">公元</button>
                    <button type="button" class="crowd-era-btn" data-era="bce" style="flex:1;padding:5px 10px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;font-size:12px;">公元前</button>
                  </div>
                  <div style="display:flex;gap:6px;margin-bottom:6px;">
                    <input type="number" id="crowd-end-year" placeholder="年" min="1" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center;">
                    <input type="number" id="crowd-end-month" placeholder="月" min="1" max="12" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center;">
                    <input type="number" id="crowd-end-day" placeholder="日" min="1" max="31" style="flex:1;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;text-align:center;">
                  </div>
                  <div class="crowd-precision-row" id="crowd-end-precision" style="display:flex;gap:4px;">
                    <button type="button" class="crowd-precision-btn" data-p="0" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">仅年</button>
                    <button type="button" class="crowd-precision-btn" data-p="1" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">年月</button>
                    <button type="button" class="crowd-precision-btn active" data-p="2" style="flex:1;padding:4px 8px;border:1px solid #d1d5db;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">年月日</button>
                  </div>
                </div>

                <div style="margin-bottom:10px;">
                  <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">描述</label>
                  <textarea id="crowd-event-desc" rows="2" placeholder="事件详细描述..." style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;resize:vertical;"></textarea>
                </div>
                <div style="margin-bottom:10px;">
                  <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">提示/答案</label>
                  <textarea id="crowd-event-tips" rows="2" placeholder="答题提示或答案" style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;resize:vertical;"></textarea>
                </div>

                <button id="crowd-save-event" class="btn btn-primary" style="width:100%;padding:8px;">💾 保存事件</button>
              </div>
            </div>

            <div style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <div style="padding:12px 16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
                <h3 style="font-size:14px;margin:0;">📋 事件列表 <span id="crowd-event-count" style="color:#6b7280;font-weight:normal;font-size:12px;">0</span></h3>
              </div>
              <div id="crowd-event-list" style="max-height:300px;overflow-y:auto;">
                <div style="text-align:center;padding:30px;color:#a0aec0;font-size:13px;">点击地图添加事件</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="crowd-events-empty" style="background:#fff;border-radius:8px;padding:40px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:56px;margin-bottom:16px;">🗺️</div>
        <h3 style="margin-bottom:8px;color:#374151;">请选择子分类开始出题</h3>
        <p style="color:#6b7280;font-size:14px;line-height:1.8;">
          1. 先选择一个<b>分类</b><br>
          2. 然后选择一个<b>子分类</b>（需要绑定地图）<br>
          3. 如果没有子分类，去<b>分类</b>页面创建
        </p>
      </div>
    `;

    this.loadEventCategories();
    this.bindEventPageEvents();
  },

  bindEventPageEvents() {
    document.getElementById('crowd-event-category').addEventListener('change', (e) => {
      this.loadEventSubCategories(e.target.value);
    });

    document.getElementById('crowd-save-event').addEventListener('click', () => this.saveEvent());
    document.getElementById('crowd-reset-form').addEventListener('click', () => this.resetEventForm());
    document.getElementById('crowd-sync-end').addEventListener('click', () => this.syncEndTime());

    this.bindEraPrecision('start');
    this.bindEraPrecision('end');
  },

  bindEraPrecision(prefix) {
    document.querySelectorAll(`#crowd-${prefix}-era .crowd-era-btn`).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#crowd-${prefix}-era .crowd-era-btn`).forEach(b => {
          b.classList.remove('active');
          b.style.background = '#fff';
          b.style.color = '#374151';
        });
        btn.classList.add('active');
        btn.style.background = '#3b82f6';
        btn.style.color = '#fff';
        btn.style.borderColor = '#3b82f6';
        if (prefix === 'start') this.state.startEra = btn.dataset.era;
        else this.state.endEra = btn.dataset.era;
      });
    });

    const firstBtn = document.querySelector(`#crowd-${prefix}-era .crowd-era-btn.active`);
    if (firstBtn) {
      firstBtn.style.background = '#3b82f6';
      firstBtn.style.color = '#fff';
      firstBtn.style.borderColor = '#3b82f6';
    }

    document.querySelectorAll(`#crowd-${prefix}-precision .crowd-precision-btn`).forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll(`#crowd-${prefix}-precision .crowd-precision-btn`).forEach(b => {
          b.classList.remove('active');
          b.style.background = '#fff';
          b.style.color = '#374151';
        });
        btn.classList.add('active');
        btn.style.background = '#10b981';
        btn.style.color = '#fff';
        btn.style.borderColor = '#10b981';
        if (prefix === 'start') this.state.startPrecision = parseInt(btn.dataset.p);
        else this.state.endPrecision = parseInt(btn.dataset.p);
      });
    });

    const firstPrecBtn = document.querySelector(`#crowd-${prefix}-precision .crowd-precision-btn.active`);
    if (firstPrecBtn) {
      firstPrecBtn.style.background = '#10b981';
      firstPrecBtn.style.color = '#fff';
      firstPrecBtn.style.borderColor = '#10b981';
    }
  },

  async loadEventCategories() {
    const res = await this.api('/categories');
    const select = document.getElementById('crowd-event-category');
    if (!res.success || res.data.length === 0) {
      select.innerHTML = '<option value="">请先在分类管理中创建分类</option>';
      return;
    }
    select.innerHTML = '<option value="">请选择分类</option>' +
      res.data.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
  },

  async loadEventSubCategories(categoryId) {
    const tabsEl = document.getElementById('crowd-event-sub-tabs');
    if (!categoryId) {
      tabsEl.innerHTML = '<span style="color:#a0aec0;font-size:13px;padding:6px 0;">请先选择分类</span>';
      this.clearEventsWorkspace();
      return;
    }

    this.state.selectedCategoryId = categoryId;
    const res = await this.api(`/categories/${categoryId}/sub-categories`);

    if (!res.success || res.data.length === 0) {
      tabsEl.innerHTML = '<span style="color:#a0aec0;font-size:13px;padding:6px 0;">该分类下暂无子分类</span>';
      this.clearEventsWorkspace();
      return;
    }

    tabsEl.innerHTML = res.data.map(sc => {
      const hasMap = sc.map_id != null;
      const borderColor = hasMap ? '#10b981' : '#f59e0b';
      const tagBg = hasMap ? '#d1fae5' : '#ffedd5';
      const tagColor = hasMap ? '#065f46' : '#c2410c';
      const tagText = hasMap ? '✓' : '⚠';
      return `<span class="crowd-sub-tab" data-id="${sc.id}" style="padding:6px 12px;border:1px solid ${borderColor};border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.2s;display:inline-flex;align-items:center;gap:6px;">
        ${this.escapeHtml(sc.name)}
        <span style="background:${tagBg};color:${tagColor};font-size:10px;padding:1px 6px;border-radius:10px;">${tagText}</span>
      </span>`;
    }).join('');

    tabsEl.querySelectorAll('.crowd-sub-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const id = parseInt(tab.dataset.id);
        this.selectSubCategory(id, tabsEl);
      });
    });

    const firstWithMap = res.data.find(sc => sc.map_id != null);
    if (firstWithMap) {
      this.selectSubCategory(firstWithMap.id, tabsEl);
    } else {
      this.clearEventsWorkspace();
    }
  },

  selectSubCategory(id, tabsEl) {
    this.state.selectedSubCategoryId = id;
    tabsEl.querySelectorAll('.crowd-sub-tab').forEach(t => {
      if (parseInt(t.dataset.id) === id) {
        t.style.background = '#3b82f6';
        t.style.color = '#fff';
        t.style.borderColor = '#3b82f6';
      } else {
        t.style.background = '#fff';
        t.style.color = '#374151';
      }
    });
    this.loadSubCategoryAndInitMap(id);
  },

  clearEventsWorkspace() {
    document.getElementById('crowd-events-workspace').style.display = 'none';
    document.getElementById('crowd-events-empty').style.display = 'block';
    this.cleanupMap();
  },

  async loadSubCategoryAndInitMap(subCatId) {
    const subRes = await this.api(`/categories/${subCatId}`);
    if (!subRes.success || !subRes.data) {
      toast('加载子分类失败', 'error');
      return;
    }

    const sc = subRes.data;
    this.state.currentSubCategoryData = sc;

    if (!sc.sub_categories || sc.sub_categories.length === 0) {
      toast('子分类不存在', 'error');
      return;
    }

    const subCat = sc.sub_categories.find(s => s.id === subCatId);
    if (!subCat || !subCat.map_id) {
      this.clearEventsWorkspace();
      toast('该子分类未绑定地图', 'error');
      return;
    }

    const mapRes = await this.api(`/maps/${subCat.map_id}`);
    if (!mapRes.success || !mapRes.data) {
      toast('加载地图失败', 'error');
      return;
    }

    const mapData = mapRes.data;
    document.getElementById('crowd-events-empty').style.display = 'none';
    document.getElementById('crowd-events-workspace').style.display = 'block';

    this.cleanupMap();
    setTimeout(() => this.initCrowdMap(mapData, subCat), 100);
  },

  initCrowdMap(mapData, subCat) {
    const mapEl = document.getElementById('crowd-event-map');
    if (!mapEl) return;

    document.getElementById('crowd-map-info').textContent = `🗺️ ${mapData.name}`;

    const tileLayer = this.buildTileLayer(mapData);
    const mapOptions = {
      minZoom: subCat.min_zoom ?? mapData.min_zoom ?? 2,
      maxZoom: subCat.max_zoom ?? mapData.max_zoom ?? 18,
      zoomControl: true
    };

    if (mapData.crs_type === 'simple' && mapData.bounds_south != null) {
      const bounds = [
        [mapData.bounds_south, mapData.bounds_west],
        [mapData.bounds_north, mapData.bounds_east]
      ];
      mapOptions.crs = L.CRS.Simple;
      mapOptions.maxBounds = bounds;
      this.state.map = L.map('crowd-event-map', mapOptions).setView([0, 0], subCat.default_zoom ?? 2);
    } else {
      this.state.map = L.map('crowd-event-map', mapOptions).setView(
        [subCat.center_lat ?? mapData.center_lat ?? 30, subCat.center_lng ?? mapData.center_lng ?? 120],
        subCat.default_zoom ?? mapData.default_zoom ?? 2
      );
    }

    tileLayer.addTo(this.state.map);

    this.state.map.on('mousemove', (e) => {
      document.getElementById('crowd-map-coords').textContent =
        `纬度: ${e.latlng.lat.toFixed(4)} | 经度: ${e.latlng.lng.toFixed(4)}`;
    });

    this.state.map.on('click', (e) => {
      if (this.state.tempMarker) {
        this.state.map.removeLayer(this.state.tempMarker);
      }
      this.state.tempMarker = L.marker(e.latlng, { draggable: true }).addTo(this.state.map);
      this.state.tempMarker.on('dragend', (ev) => {
        this.updateCoordDisplay(ev.target.getLatLng());
      });
      this.updateCoordDisplay(e.latlng);
    });

    this.loadEventList();
  },

  buildTileLayer(mapData) {
    let url, options = {};

    switch (mapData.tile_type) {
      case 'osm':
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        options.attribution = '© OpenStreetMap';
        break;
      case 'amap_street':
        url = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';
        options.subdomains = ['1', '2', '3', '4'];
        break;
      case 'amap_satellite':
        url = 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}';
        options.subdomains = ['1', '2', '3', '4'];
        break;
      case 'custom':
      default:
        url = mapData.tile_url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        if (mapData.tile_subdomains) {
          options.subdomains = mapData.tile_subdomains.split(',');
        }
    }

    if (mapData.tile_size) {
      options.tileSize = mapData.tile_size;
    }

    return L.tileLayer(url, options);
  },

  updateCoordDisplay(latlng) {
    document.getElementById('crowd-disp-lat').textContent = latlng.lat.toFixed(6);
    document.getElementById('crowd-disp-lng').textContent = latlng.lng.toFixed(6);
    document.getElementById('crowd-coord-hint').textContent = '';
    document.getElementById('crowd-disp-lat').style.color = '#1f2937';
    document.getElementById('crowd-disp-lng').style.color = '#1f2937';
  },

  syncEndTime() {
    document.getElementById('crowd-end-year').value = document.getElementById('crowd-start-year').value;
    document.getElementById('crowd-end-month').value = document.getElementById('crowd-start-month').value;
    document.getElementById('crowd-end-day').value = document.getElementById('crowd-start-day').value;
    this.state.endPrecision = this.state.startPrecision;
    this.state.endEra = this.state.startEra;

    document.querySelectorAll('#crowd-end-era .crowd-era-btn').forEach(b => {
      const active = b.dataset.era === this.state.endEra;
      b.classList.toggle('active', active);
      b.style.background = active ? '#3b82f6' : '#fff';
      b.style.color = active ? '#fff' : '#374151';
      b.style.borderColor = active ? '#3b82f6' : '#d1d5db';
    });

    document.querySelectorAll('#crowd-end-precision .crowd-precision-btn').forEach(b => {
      const active = parseInt(b.dataset.p) === this.state.endPrecision;
      b.classList.toggle('active', active);
      b.style.background = active ? '#10b981' : '#fff';
      b.style.color = active ? '#fff' : '#374151';
      b.style.borderColor = active ? '#10b981' : '#d1d5db';
    });
  },

  parseDate(prefix) {
    const year = parseInt(document.getElementById(`crowd-${prefix}-year`).value);
    const month = parseInt(document.getElementById(`crowd-${prefix}-month`).value) || 0;
    const day = parseInt(document.getElementById(`crowd-${prefix}-day`).value) || 0;
    const precision = prefix === 'start' ? this.state.startPrecision : this.state.endPrecision;
    const era = prefix === 'start' ? this.state.startEra : this.state.endEra;

    if (!year) return { ts: null, precision: 0 };

    let sign = era === 'bce' ? -1 : 1;
    let ts;
    if (precision === 0) {
      ts = sign * year * 10000;
    } else if (precision === 1) {
      ts = sign * (year * 10000 + (month || 1) * 100);
    } else {
      ts = sign * (year * 10000 + (month || 1) * 100 + (day || 1));
    }

    return { ts, precision };
  },

  resetEventForm() {
    this.state.editingEventId = null;
    document.getElementById('crowd-event-title').value = '';
    document.getElementById('crowd-event-loc').value = '';
    document.getElementById('crowd-event-desc').value = '';
    document.getElementById('crowd-event-tips').value = '';
    document.getElementById('crowd-start-year').value = '';
    document.getElementById('crowd-start-month').value = '';
    document.getElementById('crowd-start-day').value = '';
    document.getElementById('crowd-end-year').value = '';
    document.getElementById('crowd-end-month').value = '';
    document.getElementById('crowd-end-day').value = '';
    document.getElementById('crowd-coord-hint').textContent = '请先在地图上点击选择位置';
    document.getElementById('crowd-disp-lat').textContent = '-';
    document.getElementById('crowd-disp-lng').textContent = '-';
    document.getElementById('crowd-event-form-title').textContent = '➕ 添加事件';

    if (this.state.tempMarker && this.state.map) {
      this.state.map.removeLayer(this.state.tempMarker);
      this.state.tempMarker = null;
    }
  },

  async saveEvent() {
    const title = document.getElementById('crowd-event-title').value.trim();
    if (!title) {
      toast('请填写事件标题', 'error');
      return;
    }

    let lat = null, lng = null;
    if (this.state.tempMarker) {
      const pos = this.state.tempMarker.getLatLng();
      lat = pos.lat;
      lng = pos.lng;
    }

    const start = this.parseDate('start');
    const end = this.parseDate('end');

    const body = {
      category_id: this.state.selectedCategoryId,
      sub_category_id: this.state.selectedSubCategoryId,
      title,
      start_ts: start.ts,
      start_precision: start.precision,
      end_ts: end.ts,
      end_precision: end.precision,
      description: document.getElementById('crowd-event-desc').value.trim() || null,
      tips: document.getElementById('crowd-event-tips').value.trim() || null,
      location_lat: lat,
      location_lng: lng,
      location_name: document.getElementById('crowd-event-loc').value.trim() || null,
      location_type: 'point'
    };

    let res;
    if (this.state.editingEventId) {
      res = await this.api(`/events/${this.state.editingEventId}`, {
        method: 'PUT',
        body
      });
    } else {
      res = await this.api('/events', {
        method: 'POST',
        body
      });
    }

    if (res.success) {
      toast(this.state.editingEventId ? '更新成功' : '添加成功', 'success');
      this.resetEventForm();
      this.loadEventList();
    } else {
      toast('保存失败: ' + res.message, 'error');
    }
  },

  async loadEventList() {
    const res = await this.api(`/events?category_id=${this.state.selectedCategoryId}&sub_category_id=${this.state.selectedSubCategoryId}&page_size=100`);
    const listEl = document.getElementById('crowd-event-list');
    const countEl = document.getElementById('crowd-event-count');

    if (!res.success || !res.data || res.data.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;font-size:13px;">暂无事件，点击地图添加</div>';
      countEl.textContent = '0';
      return;
    }

    countEl.textContent = res.total || res.data.length;

    this.state.markers.forEach(m => { if (this.state.map) this.state.map.removeLayer(m); });
    this.state.markers = [];

    listEl.innerHTML = res.data.map(e => {
      if (this.state.map && e.location_lat != null && e.location_lng != null) {
        const marker = L.marker([e.location_lat, e.location_lng]).addTo(this.state.map);
        marker.bindPopup(`<b>${this.escapeHtml(e.title)}</b><br>${this.escapeHtml(e.start_display || '-')}`);
        this.state.markers.push(marker);
      }

      return `<div class="crowd-ev-item" data-id="${e.id}" style="padding:8px 12px;border-bottom:1px solid #f3f4f6;cursor:pointer;">
        <div style="font-size:13px;font-weight:500;color:#1f2937;">${this.escapeHtml(e.title)}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px;">
          ${this.escapeHtml(e.start_display || '-')}
          ${e.location_name ? ' · ' + this.escapeHtml(e.location_name) : ''}
        </div>
        <div style="margin-top:4px;display:flex;gap:4px;">
          <button class="crowd-ev-edit" data-id="${e.id}" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:11px;padding:0;">编辑</button>
          <button class="crowd-ev-del" data-id="${e.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:11px;padding:0;">删除</button>
        </div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.crowd-ev-item').forEach(item => {
      item.addEventListener('click', (ev) => {
        if (ev.target.classList.contains('crowd-ev-edit') || ev.target.classList.contains('crowd-ev-del')) return;
        const id = parseInt(item.dataset.id);
        const event = res.data.find(e => e.id === id);
        if (event && this.state.map && event.location_lat != null) {
          this.state.map.setView([event.location_lat, event.location_lng], (this.state.map.getZoom() || 5));
        }
      });
    });

    listEl.querySelectorAll('.crowd-ev-edit').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const event = res.data.find(e => e.id === id);
        if (event) this.editEvent(event);
      });
    });

    listEl.querySelectorAll('.crowd-ev-del').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!confirm('确定删除此事件？')) return;
        const id = parseInt(btn.dataset.id);
        const r = await this.api(`/events/${id}`, { method: 'DELETE' });
        if (r.success) {
          toast('删除成功', 'success');
          this.loadEventList();
        } else {
          toast('删除失败: ' + (r.message || '未知错误'), 'error');
        }
      });
    });
  },

  editEvent(e) {
    this.state.editingEventId = e.id;
    document.getElementById('crowd-event-form-title').textContent = '✏️ 编辑事件';
    document.getElementById('crowd-event-title').value = e.title || '';
    document.getElementById('crowd-event-loc').value = e.location_name || '';
    document.getElementById('crowd-event-desc').value = e.description || '';
    document.getElementById('crowd-event-tips').value = e.tips || '';

    this.fillDateFields('start', e.start_ts, e.start_precision);
    this.fillDateFields('end', e.end_ts, e.end_precision);

    if (e.location_lat != null && e.location_lng != null) {
      if (this.state.tempMarker && this.state.map) {
        this.state.map.removeLayer(this.state.tempMarker);
      }
      if (this.state.map) {
        this.state.tempMarker = L.marker([e.location_lat, e.location_lng], { draggable: true }).addTo(this.state.map);
        this.state.tempMarker.on('dragend', (ev) => this.updateCoordDisplay(ev.target.getLatLng()));
        this.state.map.setView([e.location_lat, e.location_lng], this.state.map.getZoom() || 5);
      }
      this.updateCoordDisplay({ lat: e.location_lat, lng: e.location_lng });
    }
  },

  fillDateFields(prefix, ts, precision) {
    if (ts == null) return;

    const absTs = Math.abs(ts);
    const sign = ts < 0 ? -1 : 1;
    let year, month = 0, day = 0;

    if (absTs >= 10000000) {
      day = absTs % 100;
      const rest = Math.floor(absTs / 100);
      month = rest % 100;
      year = Math.floor(rest / 100);
    } else if (absTs >= 10000) {
      const rest = Math.floor(absTs / 100);
      month = absTs % 100;
      year = Math.floor(rest / 100);
      day = rest % 100;
    } else {
      year = absTs;
    }

    if (sign < 0) year = -year;

    const era = year < 0 ? 'bce' : 'ce';
    if (prefix === 'start') this.state.startEra = era;
    else this.state.endEra = era;
    if (prefix === 'start') this.state.startPrecision = precision || 0;
    else this.state.endPrecision = precision || 0;

    document.getElementById(`crowd-${prefix}-year`).value = Math.abs(year);
    document.getElementById(`crowd-${prefix}-month`).value = month || '';
    document.getElementById(`crowd-${prefix}-day`).value = day || '';

    document.querySelectorAll(`#crowd-${prefix}-era .crowd-era-btn`).forEach(b => {
      const active = b.dataset.era === era;
      b.classList.toggle('active', active);
      b.style.background = active ? '#3b82f6' : '#fff';
      b.style.color = active ? '#fff' : '#374151';
      b.style.borderColor = active ? '#3b82f6' : '#d1d5db';
    });

    document.querySelectorAll(`#crowd-${prefix}-precision .crowd-precision-btn`).forEach(b => {
      const active = parseInt(b.dataset.p) === (precision || 0);
      b.classList.toggle('active', active);
      b.style.background = active ? '#10b981' : '#fff';
      b.style.color = active ? '#fff' : '#374151';
      b.style.borderColor = active ? '#10b981' : '#d1d5db';
    });
  },

  renderCategoriesPage() {
    const content = document.getElementById('crowd-content');
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr;gap:12px;">
        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;margin:0;">分类列表</h3>
            <button id="crowd-add-category" class="btn btn-primary btn-sm" style="padding:6px 14px;font-size:13px;">+ 添加分类</button>
          </div>
          <div id="crowd-category-list">加载中...</div>
        </div>

        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;margin:0;">子分类管理</h3>
            <div style="display:flex;gap:8px;align-items:center;">
              <select id="crowd-sub-filter" style="padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
                <option value="">选择分类查看</option>
              </select>
              <button id="crowd-add-sub" class="btn btn-primary btn-sm" style="padding:6px 14px;font-size:13px;">+ 添加子分类</button>
            </div>
          </div>
          <div id="crowd-sub-list">
            <div style="text-align:center;padding:30px;color:#a0aec0;">请选择一个分类</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('crowd-add-category').addEventListener('click', () => this.openCategoryModal());
    document.getElementById('crowd-add-sub').addEventListener('click', () => this.openSubCategoryModal());
    document.getElementById('crowd-sub-filter').addEventListener('change', (e) => this.loadSubCategoryList(e.target.value));

    this.loadCategoryList();
  },

  async loadCategoryList() {
    const res = await this.api('/categories/all');
    const listEl = document.getElementById('crowd-category-list');
    const filterEl = document.getElementById('crowd-sub-filter');

    if (!res.success || res.data.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">暂无分类</div>';
      filterEl.innerHTML = '<option value="">选择分类查看</option>';
      return;
    }

    filterEl.innerHTML = '<option value="">选择分类查看</option>' +
      res.data.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');

    listEl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">编码</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">名称</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">排序</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">操作</th></tr></thead><tbody>' +
      res.data.map(c => `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${this.escapeHtml(c.code)}</td>
        <td style="padding:8px 12px;font-weight:500;">${this.escapeHtml(c.name)}</td>
        <td style="padding:8px 12px;color:#6b7280;">${c.sort_order}</td>
        <td style="padding:8px 12px;">
          <button class="crowd-cat-edit" data-id="${c.id}" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:12px;margin-right:8px;">编辑</button>
          <button class="crowd-cat-del" data-id="${c.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;">删除</button>
        </td>
      </tr>`).join('') + '</tbody></table>';

    listEl.querySelectorAll('.crowd-cat-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = res.data.find(x => x.id === parseInt(btn.dataset.id));
        this.openCategoryModal(c);
      });
    });

    listEl.querySelectorAll('.crowd-cat-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确定删除此分类？')) return;
        const r = await this.api(`/categories/${btn.dataset.id}`, { method: 'DELETE' });
        if (r.success) { toast('删除成功', 'success'); this.loadCategoryList(); }
        else toast('删除失败: ' + r.message, 'error');
      });
    });
  },

  openCategoryModal(category = null) {
    const isEdit = category != null;
    this.openModal(
      isEdit ? '编辑分类' : '添加分类',
      `<div style="margin-bottom:12px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">编码 <span style="color:#ef4444;">*</span></label>
        <input type="text" id="crowd-cat-code" value="${category?.code || ''}" placeholder="如：history" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">名称 <span style="color:#ef4444;">*</span></label>
        <input type="text" id="crowd-cat-name" value="${category?.name || ''}" placeholder="如：历史" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>
      <div>
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">排序</label>
        <input type="number" id="crowd-cat-order" value="${category?.sort_order ?? 0}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>`,
      `<button class="btn btn-secondary" id="crowd-cat-cancel">取消</button>
       <button class="btn btn-primary" id="crowd-cat-save">${isEdit ? '保存' : '添加'}</button>`
    );

    document.getElementById('crowd-cat-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('crowd-cat-save').addEventListener('click', async () => {
      const code = document.getElementById('crowd-cat-code').value.trim();
      const name = document.getElementById('crowd-cat-name').value.trim();
      const sort_order = parseInt(document.getElementById('crowd-cat-order').value) || 0;
      if (!code || !name) { toast('编码和名称不能为空', 'error'); return; }

      let r;
      if (isEdit) {
        r = await this.api(`/categories/${category.id}`, { method: 'PUT', body: { code, name, sort_order } });
      } else {
        r = await this.api('/categories', { method: 'POST', body: { code, name, sort_order } });
      }
      if (r.success) { toast(isEdit ? '更新成功' : '添加成功', 'success'); this.closeModal(); this.loadCategoryList(); }
      else toast('操作失败: ' + r.message, 'error');
    });
  },

  async loadSubCategoryList(categoryId) {
    const listEl = document.getElementById('crowd-sub-list');
    if (!categoryId) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">请选择一个分类</div>';
      return;
    }

    const res = await this.api(`/categories/${categoryId}`);
    if (!res.success || !res.data?.sub_categories?.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">该分类下暂无子分类</div>';
      return;
    }

    const subs = res.data.sub_categories;
    const mapsRes = await this.api('/maps');
    const maps = mapsRes.success ? mapsRes.data : [];

    listEl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">编码</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">名称</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">绑定地图</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">操作</th></tr></thead><tbody>' +
      subs.map(sc => `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${this.escapeHtml(sc.code)}</td>
        <td style="padding:8px 12px;font-weight:500;">${this.escapeHtml(sc.name)}</td>
        <td style="padding:8px 12px;color:${sc.map_id ? '#10b981' : '#f59e0b'};">${sc.map_name || '未绑定'}</td>
        <td style="padding:8px 12px;">
          <button class="crowd-sub-edit" data-id="${sc.id}" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:12px;margin-right:8px;">编辑</button>
          <button class="crowd-sub-del" data-id="${sc.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;">删除</button>
        </td>
      </tr>`).join('') + '</tbody></table>';

    listEl.querySelectorAll('.crowd-sub-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const sc = subs.find(x => x.id === parseInt(btn.dataset.id));
        this.openSubCategoryModal(sc, parseInt(categoryId), maps);
      });
    });

    listEl.querySelectorAll('.crowd-sub-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确定删除此子分类？')) return;
        const r = await this.api(`/categories/sub-category/${btn.dataset.id}`, { method: 'DELETE' });
        if (r.success) { toast('删除成功', 'success'); this.loadSubCategoryList(categoryId); }
        else toast('删除失败: ' + r.message, 'error');
      });
    });
  },

  openSubCategoryModal(subCat = null, parentCategoryId = null, maps = []) {
    const isEdit = subCat != null;
    const catFilter = document.getElementById('crowd-sub-filter');
    const defaultCatId = parentCategoryId || (catFilter?.value || '');

    let categoryOptions = '<option value="">请选择分类</option>';
    this.api('/categories/all').then(catsRes => {
      if (catsRes.success) {
        categoryOptions += catsRes.data.map(c =>
          `<option value="${c.id}" ${(isEdit ? subCat.category_id : defaultCatId) == c.id ? 'selected' : ''}>${this.escapeHtml(c.name)}</option>`
        ).join('');
        document.getElementById('crowd-sub-parent').innerHTML = categoryOptions;
      }
    });

    let mapOptions = '<option value="">不绑定</option>';
    if (maps.length === 0) {
      this.api('/maps').then(mRes => {
        if (mRes.success) {
          mapOptions += mRes.data.map(m =>
            `<option value="${m.id}" ${isEdit && subCat.map_id == m.id ? 'selected' : ''}>${this.escapeHtml(m.name)}</option>`
          ).join('');
          document.getElementById('crowd-sub-map').innerHTML = mapOptions;
        }
      });
    } else {
      mapOptions += maps.map(m =>
        `<option value="${m.id}" ${isEdit && subCat.map_id == m.id ? 'selected' : ''}>${this.escapeHtml(m.name)}</option>`
      ).join('');
    }

    this.openModal(
      isEdit ? '编辑子分类' : '添加子分类',
      `<div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">所属分类 <span style="color:#ef4444;">*</span></label>
        <select id="crowd-sub-parent" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">${categoryOptions}</select>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">编码 <span style="color:#ef4444;">*</span></label>
        <input type="text" id="crowd-sub-code" value="${subCat?.code || ''}" placeholder="如：events" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">名称 <span style="color:#ef4444;">*</span></label>
        <input type="text" id="crowd-sub-name" value="${subCat?.name || ''}" placeholder="如：历史事件" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">绑定地图</label>
        <select id="crowd-sub-map" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">${mapOptions}</select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">中心纬度</label>
          <input type="number" step="0.0001" id="crowd-sub-lat" value="${subCat?.center_lat ?? ''}" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
        </div>
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">中心经度</label>
          <input type="number" step="0.0001" id="crowd-sub-lng" value="${subCat?.center_lng ?? ''}" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
        </div>
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">默认缩放</label>
          <input type="number" id="crowd-sub-zoom" value="${subCat?.default_zoom ?? 2}" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
        </div>
      </div>
      <div>
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">排序</label>
        <input type="number" id="crowd-sub-order" value="${subCat?.sort_order ?? 0}" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
      </div>`,
      `<button class="btn btn-secondary" id="crowd-sub-cancel">取消</button>
       <button class="btn btn-primary" id="crowd-sub-save">${isEdit ? '保存' : '添加'}</button>`
    );

    document.getElementById('crowd-sub-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('crowd-sub-save').addEventListener('click', async () => {
      const category_id = parseInt(document.getElementById('crowd-sub-parent').value);
      const code = document.getElementById('crowd-sub-code').value.trim();
      const name = document.getElementById('crowd-sub-name').value.trim();
      const map_id = parseInt(document.getElementById('crowd-sub-map').value) || null;
      const center_lat = parseFloat(document.getElementById('crowd-sub-lat').value) || null;
      const center_lng = parseFloat(document.getElementById('crowd-sub-lng').value) || null;
      const default_zoom = parseInt(document.getElementById('crowd-sub-zoom').value) || 2;
      const sort_order = parseInt(document.getElementById('crowd-sub-order').value) || 0;

      if (!category_id || !code || !name) { toast('请填写必填项', 'error'); return; }

      let r;
      if (isEdit) {
        r = await this.api(`/categories/sub-category/${subCat.id}`, {
          method: 'PUT',
          body: { map_id, name, sort_order, center_lat, center_lng, default_zoom }
        });
      } else {
        r = await this.api('/categories/sub-category', {
          method: 'POST',
          body: { category_id, code, name, map_id, sort_order, center_lat, center_lng, default_zoom }
        });
      }
      if (r.success) {
        toast(isEdit ? '更新成功' : '添加成功', 'success');
        this.closeModal();
        const fid = document.getElementById('crowd-sub-filter').value;
        if (fid) this.loadSubCategoryList(fid);
      } else {
        toast('操作失败: ' + r.message, 'error');
      }
    });
  },

  renderMapsPage() {
    const content = document.getElementById('crowd-content');
    content.innerHTML = `
      <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="font-size:15px;margin:0;">地图列表</h3>
          <button id="crowd-add-map" class="btn btn-primary btn-sm" style="padding:6px 14px;font-size:13px;">+ 添加地图</button>
        </div>
        <div id="crowd-map-list">加载中...</div>
      </div>
    `;

    document.getElementById('crowd-add-map').addEventListener('click', () => this.openMapModal());
    this.loadMapList();
  },

  async loadMapList() {
    const res = await this.api('/maps/all');
    const listEl = document.getElementById('crowd-map-list');

    if (!res.success || res.data.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">暂无地图</div>';
      return;
    }

    listEl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">编码</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">名称</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">类型</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">坐标系</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">缩放</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">操作</th></tr></thead><tbody>' +
      res.data.map(m => `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 12px;font-family:monospace;font-size:12px;">${this.escapeHtml(m.code)}</td>
        <td style="padding:8px 12px;font-weight:500;">${this.escapeHtml(m.name)}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(m.tile_type || '-')}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(m.crs_type || '-')}</td>
        <td style="padding:8px 12px;color:#6b7280;">${m.min_zoom}-${m.max_zoom}</td>
        <td style="padding:8px 12px;">
          <button class="crowd-map-edit" data-id="${m.id}" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:12px;margin-right:8px;">编辑</button>
          <button class="crowd-map-del" data-id="${m.id}" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;">删除</button>
        </td>
      </tr>`).join('') + '</tbody></table>';

    listEl.querySelectorAll('.crowd-map-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = res.data.find(x => x.id === parseInt(btn.dataset.id));
        this.openMapModal(m);
      });
    });

    listEl.querySelectorAll('.crowd-map-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('确定删除此地图？')) return;
        const r = await this.api(`/maps/${btn.dataset.id}`, { method: 'DELETE' });
        if (r.success) { toast('删除成功', 'success'); this.loadMapList(); }
        else toast('删除失败: ' + r.message, 'error');
      });
    });
  },

  openMapModal(map = null) {
    const isEdit = map != null;
    this.openModal(
      isEdit ? '编辑地图' : '添加地图',
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">编码 <span style="color:#ef4444;">*</span></label>
          <input type="text" id="crowd-map-code" value="${map?.code || ''}" placeholder="如：world" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
        </div>
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">名称 <span style="color:#ef4444;">*</span></label>
          <input type="text" id="crowd-map-name" value="${map?.name || ''}" placeholder="如：世界地图" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
        </div>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">瓦片类型</label>
        <select id="crowd-map-type" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
          <option value="osm" ${map?.tile_type === 'osm' ? 'selected' : ''}>OSM 标准地图</option>
          <option value="amap_street" ${map?.tile_type === 'amap_street' ? 'selected' : ''}>高德街道图</option>
          <option value="amap_satellite" ${map?.tile_type === 'amap_satellite' ? 'selected' : ''}>高德卫星图</option>
          <option value="custom" ${map?.tile_type === 'custom' ? 'selected' : ''}>自定义URL</option>
        </select>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">瓦片URL（自定义时必填）</label>
        <input type="text" id="crowd-map-url" value="${map?.tile_url || ''}" placeholder="https://{s}.example.com/{z}/{x}/{y}.png" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">子域名（逗号分隔，可选）</label>
        <input type="text" id="crowd-map-subs" value="${map?.tile_subdomains || ''}" placeholder="a,b,c" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">坐标系</label>
          <select id="crowd-map-crs" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
            <option value="epsg3857" ${map?.crs_type !== 'simple' ? 'selected' : ''}>EPSG3857 (标准)</option>
            <option value="simple" ${map?.crs_type === 'simple' ? 'selected' : ''}>Simple (本地图)</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">最小缩放</label>
          <input type="number" id="crowd-map-minz" value="${map?.min_zoom ?? 0}" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
        </div>
        <div>
          <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">最大缩放</label>
          <input type="number" id="crowd-map-maxz" value="${map?.max_zoom ?? 18}" style="width:100%;padding:6px 8px;border:1px solid #cbd5e0;border-radius:6px;font-size:12px;">
        </div>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px;color:#374151;font-weight:500;display:block;margin-bottom:4px;">描述</label>
        <input type="text" id="crowd-map-desc" value="${map?.description || ''}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
      </div>`,
      `<button class="btn btn-secondary" id="crowd-map-cancel">取消</button>
       <button class="btn btn-primary" id="crowd-map-save">${isEdit ? '保存' : '添加'}</button>`
    );

    document.getElementById('crowd-map-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('crowd-map-save').addEventListener('click', async () => {
      const code = document.getElementById('crowd-map-code').value.trim();
      const name = document.getElementById('crowd-map-name').value.trim();
      if (!code || !name) { toast('编码和名称不能为空', 'error'); return; }

      const body = {
        code,
        name,
        tile_type: document.getElementById('crowd-map-type').value,
        tile_url: document.getElementById('crowd-map-url').value.trim() || null,
        tile_subdomains: document.getElementById('crowd-map-subs').value.trim() || null,
        crs_type: document.getElementById('crowd-map-crs').value,
        min_zoom: parseInt(document.getElementById('crowd-map-minz').value) || 0,
        max_zoom: parseInt(document.getElementById('crowd-map-maxz').value) || 18,
        description: document.getElementById('crowd-map-desc').value.trim() || null
      };

      let r;
      if (isEdit) {
        r = await this.api(`/maps/${map.id}`, { method: 'PUT', body });
      } else {
        r = await this.api('/maps', { method: 'POST', body });
      }
      if (r.success) { toast(isEdit ? '更新成功' : '添加成功', 'success'); this.closeModal(); this.loadMapList(); }
      else toast('操作失败: ' + r.message, 'error');
    });
  },

  renderExportPage() {
    const content = document.getElementById('crowd-content');
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="font-size:15px;margin-bottom:12px;">📊 数据统计</h3>
          <div id="crowd-export-stats">加载中...</div>
        </div>
        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h3 style="font-size:15px;margin-bottom:12px;">📤 导出操作</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button id="crowd-download-full" class="btn btn-primary" style="padding:10px;text-align:left;">⬇️ 下载完整 JSON 数据</button>
            <button id="crowd-preview-data" class="btn btn-secondary" style="padding:10px;text-align:left;">👁️ 预览部分数据</button>
          </div>
          <div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:6px;font-size:12px;color:#4b5563;line-height:1.6;">
            <p style="font-weight:600;margin-bottom:4px;">使用说明：</p>
            <p>1. 导出的 JSON 数据包含地图、分类、子分类、事件</p>
            <p>2. 可以通过 <b>数据导入</b> 页面导入到 ww 主数据库</p>
            <p>3. 数据库文件位于 <code>hsd/db/crowd.db</code></p>
          </div>
        </div>
        <div style="grid-column:1 / -1;background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="font-size:15px;margin:0;">📋 事件列表</h3>
          </div>
          <div id="crowd-export-events" style="max-height:400px;overflow-y:auto;">加载中...</div>
        </div>
      </div>
    `;

    document.getElementById('crowd-download-full').addEventListener('click', () => this.downloadFullExport());
    document.getElementById('crowd-preview-data').addEventListener('click', () => this.previewExportData());
    this.loadExportStats();
    this.loadExportEventList();
  },

  async loadExportStats() {
    const res = await this.api('/export/stats');
    const el = document.getElementById('crowd-export-stats');
    if (!res.success) {
      el.innerHTML = '<div style="color:#ef4444;">加载失败</div>';
      return;
    }

    const d = res.data;
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="padding:12px;background:#eff6ff;border-radius:6px;">
          <div style="font-size:12px;color:#2563eb;">地图</div>
          <div style="font-size:24px;font-weight:700;color:#1d4ed8;">${d.maps}</div>
        </div>
        <div style="padding:12px;background:#ecfdf5;border-radius:6px;">
          <div style="font-size:12px;color:#059669;">分类</div>
          <div style="font-size:24px;font-weight:700;color:#047857;">${d.categories}</div>
        </div>
        <div style="padding:12px;background:#fffbeb;border-radius:6px;">
          <div style="font-size:12px;color:#d97706;">子分类</div>
          <div style="font-size:24px;font-weight:700;color:#b45309;">${d.sub_categories}</div>
        </div>
        <div style="padding:12px;background:#faf5ff;border-radius:6px;">
          <div style="font-size:12px;color:#7c3aed;">事件</div>
          <div style="font-size:24px;font-weight:700;color:#6d28d9;">${d.events}</div>
        </div>
      </div>
    `;
  },

  async loadExportEventList() {
    const res = await this.api('/export/events-list');
    const el = document.getElementById('crowd-export-events');

    if (!res.success || !res.data?.length) {
      el.innerHTML = '<div style="text-align:center;padding:30px;color:#a0aec0;">暂无事件</div>';
      return;
    }

    el.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="background:#f9fafb;position:sticky;top:0;"><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">标题</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">分类</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">时间</th><th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">地点</th></tr></thead><tbody>' +
      res.data.map(e => `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:8px 12px;font-weight:500;">${this.escapeHtml(e.title)}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(e.category_name || '')} / ${this.escapeHtml(e.sub_category_name || '')}</td>
        <td style="padding:8px 12px;color:#6b7280;">${e.start_ts != null ? this.formatTsDisplay(e.start_ts, e.start_precision) : '-'}</td>
        <td style="padding:8px 12px;color:#6b7280;">${this.escapeHtml(e.location_name || '-')}</td>
      </tr>`).join('') + '</tbody></table>';
  },

  formatTsDisplay(ts, precision) {
    if (ts == null) return '-';
    const absTs = Math.abs(ts);
    const sign = ts < 0 ? -1 : 1;
    let year, month, day;
    if (absTs >= 10000000) {
      day = absTs % 100;
      const rest = Math.floor(absTs / 100);
      month = rest % 100;
      year = Math.floor(rest / 100);
    } else if (absTs >= 10000) {
      const rest = Math.floor(absTs / 100);
      month = absTs % 100;
      year = Math.floor(rest / 100);
      day = rest % 100;
    } else {
      year = absTs; month = 0; day = 0;
    }
    if (sign < 0) year = -year;
    const prefix = year < 0 ? '公元前' : '';
    const absYear = Math.abs(year);
    const p = precision || 0;
    if (p === 0) return `${prefix}${absYear}年`;
    if (p === 1) return `${prefix}${absYear}年${month}月`;
    return `${prefix}${absYear}年${month}月${day}日`;
  },

  downloadFullExport() {
    const a = document.createElement('a');
    a.href = this.apiBase + '/export/download';
    a.download = `crowd_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('下载已开始', 'success');
  },

  async previewExportData() {
    const res = await this.api('/export/events-preview');
    if (!res.success) { toast('加载失败', 'error'); return; }

    let html = '<div style="max-height:60vh;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f9fafb;position:sticky;top:0;"><th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e5e7eb;">标题</th><th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e5e7eb;">时间</th><th style="padding:6px 10px;text-align:left;border-bottom:1px solid #e5e7eb;">坐标</th></tr></thead><tbody>';
    (res.data || []).forEach(e => {
      html += `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:6px 10px;font-weight:500;">${this.escapeHtml(e.title)}</td>
        <td style="padding:6px 10px;color:#6b7280;">${this.formatTsDisplay(e.start_ts, e.start_precision)}</td>
        <td style="padding:6px 10px;color:#6b7280;font-family:monospace;font-size:11px;">${e.location_lat?.toFixed(3) || '-'}, ${e.location_lng?.toFixed(3) || '-'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    this.openModal('数据预览（前20条）', html, `<button class="btn btn-secondary" onclick="HSD.crowdView.closeModal()">关闭</button>`);
  },

  escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }
};
