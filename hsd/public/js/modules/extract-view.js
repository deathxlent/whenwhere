window.HSD = window.HSD || {};

HSD.extractView = {
  state: {
    selectedFiles: [],
    extractedData: null,
    configReady: false,
    provider: null
  },

  render(container) {
    if (!container) container = document.getElementById('main-view');
    const breadcrumb = document.getElementById('breadcrumb-text');
    if (breadcrumb) breadcrumb.textContent = 'AI 提取';
    HSD.mapCore.restoreLayout();

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">🤖 AI 事件提取</h2>
      </div>

      <div class="extract-config-status" id="extract-config-status" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
        <span class="status-indicator" style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>
        <span class="status-text" style="font-size:13px;color:#92400e;">加载配置中...</span>
        <div style="flex:1;"></div>
        <button class="btn btn-secondary btn-sm" id="extract-reload-config" style="padding:4px 10px;font-size:12px;">刷新配置</button>
      </div>

      <div class="extract-container" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div class="extract-left">
          <div class="info-panel" style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);margin-bottom:16px;">
            <div style="font-weight:600;color:#2d3748;margin-bottom:12px;">📋 提取设置</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">一级分类编码</label>
                <input type="text" id="extract-category-code" class="form-input" placeholder="history" value="history"
                       style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">一级分类名称</label>
                <input type="text" id="extract-category-name" class="form-input" placeholder="历史" value="历史"
                       style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">二级分类编码</label>
                <input type="text" id="extract-sub-category-code" class="form-input" placeholder="events" value="events"
                       style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              </div>
              <div>
                <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">二级分类名称</label>
                <input type="text" id="extract-sub-category-name" class="form-input" placeholder="历史事件" value="历史事件"
                       style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;">
              </div>
            </div>
            <div style="margin-top:10px;">
              <label style="font-size:12px;color:#4a5568;display:block;margin-bottom:4px;">附加说明（可选）</label>
              <textarea id="extract-additional-instructions" class="form-input" rows="2" placeholder="例如：只提取战争相关的事件"
                        style="width:100%;padding:6px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;resize:vertical;"></textarea>
            </div>
          </div>

          <div class="extract-upload-area" id="extract-upload-area" style="background:#fff;border:2px dashed #cbd5e0;border-radius:8px;padding:40px 20px;text-align:center;cursor:pointer;transition:all 0.2s;">
            <div style="font-size:48px;margin-bottom:12px;">📄</div>
            <h3 style="margin-bottom:8px;color:#2d3748;">点击或拖拽 HTML 文件到此处</h3>
            <p style="color:#718096;font-size:13px;">支持上传多个 HTML 文件，AI 将自动提取历史事件</p>
            <input type="file" id="extract-file-input" accept=".html,.htm" multiple style="display:none;">
          </div>

          <div id="extract-file-list" style="margin-top:12px;"></div>

          <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;">
            <button class="btn btn-secondary" id="extract-btn-preview" disabled style="padding:8px 20px;">🔍 预览提取</button>
            <button class="btn btn-primary" id="extract-btn-full" disabled style="padding:8px 20px;">✨ 完整提取</button>
            <button class="btn btn-success" id="extract-btn-download" disabled style="padding:8px 20px;">📥 下载 JSON</button>
          </div>
        </div>

        <div class="extract-right">
          <div class="extract-result-panel" style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);height:100%;min-height:500px;display:flex;flex-direction:column;">
            <div style="padding:12px 16px;background:#f7fafc;border-bottom:1px solid #e2e8f0;font-weight:600;color:#2d3748;display:flex;justify-content:space-between;align-items:center;">
              <span>提取结果</span>
              <span id="extract-result-count" style="font-size:12px;color:#718096;">暂无数据</span>
            </div>
            <div id="extract-result-body" style="flex:1;overflow-y:auto;padding:0;">
              <div style="padding:40px;text-align:center;color:#a0aec0;">
                上传 HTML 文件后点击提取按钮查看结果
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="extract-loading-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:12px;padding:30px 40px;text-align:center;min-width:300px;">
          <div style="font-size:48px;margin-bottom:16px;animation:spin 1s linear infinite;">⚙️</div>
          <div id="extract-loading-text" style="font-size:14px;color:#2d3748;">正在提取中...</div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.checkConfigStatus();
  },

  bindEvents() {
    const uploadArea = document.getElementById('extract-upload-area');
    const fileInput = document.getElementById('extract-file-input');

    uploadArea.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      this.addFiles(Array.from(e.target.files));
      e.target.value = '';
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#3182ce';
      uploadArea.style.backgroundColor = '#ebf8ff';
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#cbd5e0';
      uploadArea.style.backgroundColor = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#cbd5e0';
      uploadArea.style.backgroundColor = 'transparent';
      const files = Array.from(e.dataTransfer.files).filter(f =>
        f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
      );
      this.addFiles(files);
    });

    document.getElementById('extract-btn-preview').addEventListener('click', () => this.extractEvents(true));
    document.getElementById('extract-btn-full').addEventListener('click', () => this.extractEvents(false));
    document.getElementById('extract-btn-download').addEventListener('click', () => this.downloadJson());
    document.getElementById('extract-reload-config').addEventListener('click', () => this.reloadConfig());
  },

  async checkConfigStatus() {
    try {
      const res = await API.get('/extract/status');
      const statusEl = document.getElementById('extract-config-status');
      const indicator = statusEl.querySelector('.status-indicator');
      const text = statusEl.querySelector('.status-text');

      if (res.data && res.data.configured) {
        this.state.configReady = true;
        this.state.provider = res.data.provider;
        indicator.style.background = '#10b981';
        let statusMsg = `配置就绪 - 提供商: ${res.data.provider}`;
        if (res.data.rate_limit_unlimited) {
          statusMsg += ' (速率: 无限制)';
        } else {
          statusMsg += ` (速率: ${res.data.rate_limit_per_minute}次/分钟)`;
        }
        text.textContent = statusMsg;
        text.style.color = '#065f46';
        statusEl.style.background = '#ecfdf5';
        statusEl.style.borderColor = '#a7f3d0';
      } else {
        this.state.configReady = false;
        indicator.style.background = '#ef4444';
        text.textContent = '配置未完成 - 请复制 config.example.json 为 config.json 并填写 LLM 配置';
        text.style.color = '#991b1b';
        statusEl.style.background = '#fef2f2';
        statusEl.style.borderColor = '#fecaca';
      }

      this.updateButtonStates();
    } catch (e) {
      const statusEl = document.getElementById('extract-config-status');
      const indicator = statusEl.querySelector('.status-indicator');
      const text = statusEl.querySelector('.status-text');
      indicator.style.background = '#ef4444';
      text.textContent = '无法连接到服务器: ' + e.message;
      text.style.color = '#991b1b';
    }
  },

  async reloadConfig() {
    try {
      const res = await API.post('/extract/reload-config');
      if (res.success) {
        toast('配置已重新加载', 'success');
      } else {
        toast('配置加载失败: ' + res.message, 'error');
      }
      this.checkConfigStatus();
    } catch (e) {
      toast('刷新配置失败: ' + e.message, 'error');
    }
  },

  addFiles(files) {
    for (const file of files) {
      if (!this.state.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
        this.state.selectedFiles.push(file);
      }
    }
    this.renderFileList();
    this.updateButtonStates();
  },

  removeFile(index) {
    this.state.selectedFiles.splice(index, 1);
    this.renderFileList();
    this.updateButtonStates();
  },

  renderFileList() {
    const listEl = document.getElementById('extract-file-list');
    if (this.state.selectedFiles.length === 0) {
      listEl.innerHTML = '';
      return;
    }

    let html = '';
    this.state.selectedFiles.forEach((file, idx) => {
      html += `
        <div class="extract-file-item" style="background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px;">
          <span>📄</span>
          <span style="flex:1;font-size:13px;color:#2d3748;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(file.name)}</span>
          <span style="font-size:12px;color:#a0aec0;">${this.formatFileSize(file.size)}</span>
          <button class="extract-remove-btn" data-idx="${idx}" style="background:none;border:none;cursor:pointer;color:#a0aec0;font-size:18px;line-height:1;padding:0 4px;" title="移除">×</button>
        </div>
      `;
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.extract-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        this.removeFile(idx);
      });
    });
  },

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  },

  updateButtonStates() {
    const hasFiles = this.state.selectedFiles.length > 0;
    const enabled = hasFiles && this.state.configReady;
    document.getElementById('extract-btn-preview').disabled = !enabled;
    document.getElementById('extract-btn-full').disabled = !enabled;
    document.getElementById('extract-btn-download').disabled = !this.state.extractedData;
  },

  getOptions() {
    return {
      category_code: document.getElementById('extract-category-code').value || 'history',
      category_name: document.getElementById('extract-category-name').value || '历史',
      sub_category_code: document.getElementById('extract-sub-category-code').value || 'events',
      sub_category_name: document.getElementById('extract-sub-category-name').value || '历史事件',
      additional_instructions: document.getElementById('extract-additional-instructions').value || ''
    };
  },

  async extractEvents(preview = false) {
    if (this.state.selectedFiles.length === 0) {
      toast('请先上传 HTML 文件', 'error');
      return;
    }

    const formData = new FormData();
    const options = this.getOptions();

    for (const key in options) {
      if (options[key]) {
        formData.append(key, options[key]);
      }
    }

    for (const file of this.state.selectedFiles) {
      formData.append('files', file);
    }

    this.showLoading(preview ? '正在预览提取结果...' : '正在提取事件，请稍候...');

    try {
      const endpoint = preview ? '/extract/extract-preview' : '/extract/extract';
      const res = await API.upload(endpoint, formData);

      if (res.success) {
        this.state.extractedData = res.data;
        this.displayResults(res.data, preview ? res.total_count : null);
        toast(res.message, 'success');
      } else {
        toast('提取失败: ' + res.message, 'error');
      }
    } catch (e) {
      toast('请求失败: ' + e.message, 'error');
    } finally {
      this.hideLoading();
      this.updateButtonStates();
    }
  },

  displayResults(data, totalCount = null) {
    const countEl = document.getElementById('extract-result-count');
    const bodyEl = document.getElementById('extract-result-body');

    const count = totalCount !== null ? totalCount : data.events.length;
    const displayCount = data.events ? data.events.length : 0;

    if (totalCount !== null && totalCount > displayCount) {
      countEl.textContent = `共 ${count} 个事件（显示前 ${displayCount} 个）`;
    } else {
      countEl.textContent = `共 ${count} 个事件`;
    }

    if (!data.events || data.events.length === 0) {
      bodyEl.innerHTML = '<div style="padding:40px;text-align:center;color:#a0aec0;">没有提取到事件</div>';
      return;
    }

    let html = '';
    data.events.forEach((event, index) => {
      html += `
        <div class="extract-event-item" style="padding:12px 16px;border-bottom:1px solid #edf2f7;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <div style="background:#3182ce;color:#fff;font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px;flex-shrink:0;">${index + 1}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:500;color:#2d3748;margin-bottom:4px;">${escapeHtml(event.title || '')}</div>
              <div style="font-size:12px;color:#718096;margin-bottom:4px;">
                🕐 ${this.formatTs(event.start_ts)} ~ ${this.formatTs(event.end_ts)}
              </div>
              ${event.location_name ? `<div style="font-size:12px;color:#718096;margin-bottom:4px;">📍 ${escapeHtml(event.location_name)}</div>` : ''}
              ${event.description ? `<div style="font-size:12px;color:#4a5568;margin-top:6px;padding:8px;background:#f7fafc;border-radius:4px;line-height:1.5;">${escapeHtml(event.description)}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    });
    bodyEl.innerHTML = html;
  },

  formatTs(ts) {
    if (ts === null || ts === undefined || ts === '') return '-';
    if (typeof ts === 'number') {
      if (ts < 0) {
        return `公元前${Math.abs(ts)}年`;
      }
      return `公元${ts}年`;
    }
    return ts;
  },

  downloadJson() {
    if (!this.state.extractedData) {
      toast('没有可下载的数据', 'error');
      return;
    }

    const dataStr = JSON.stringify(this.state.extractedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted_events_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast('JSON 下载成功', 'success');
  },

  showLoading(text = '加载中...') {
    const overlay = document.getElementById('extract-loading-overlay');
    document.getElementById('extract-loading-text').textContent = text;
    overlay.style.display = 'flex';
  },

  hideLoading() {
    document.getElementById('extract-loading-overlay').style.display = 'none';
  }
};
