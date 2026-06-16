const api = window.api;

const state = {
  config: null,
  fileData: null,
  resultData: null,
  extractionOptions: {
    categoryCode: 'extracted',
    categoryName: '提取的事件',
    subCategoryCode: 'events',
    subCategoryName: '历史事件',
    customPrompt: ''
  },
  progressTotal: 0,
  progressCurrent: 0,
  removeProgressListener: null
};

const els = {};

function init() {
  cacheElements();
  bindEvents();
  loadConfig();
  loadSavedOptions();
}

function cacheElements() {
  els.btnSettings = document.getElementById('btn-settings');
  els.settingsModal = document.getElementById('settings-modal');
  els.btnCloseSettings = document.getElementById('btn-close-settings');
  els.btnCancelSettings = document.getElementById('btn-cancel-settings');
  els.btnSaveSettings = document.getElementById('btn-save-settings');
  els.activeProvider = document.getElementById('active-provider');
  els.rateLimit = document.getElementById('rate-limit');
  els.providersConfig = document.getElementById('providers-config');
  els.btnTestConnection = document.getElementById('btn-test-connection');
  els.testResult = document.getElementById('test-result');
  els.configPath = document.getElementById('config-path');
  els.btnOpenConfigDir = document.getElementById('btn-open-config-dir');

  els.dropZone = document.getElementById('drop-zone');
  els.btnSelectFile = document.getElementById('btn-select-file');
  els.fileInfo = document.getElementById('file-info');
  els.fileName = document.getElementById('file-name');
  els.fileSize = document.getElementById('file-size');
  els.docTitle = document.getElementById('doc-title');
  els.charCount = document.getElementById('char-count');
  els.wordCount = document.getElementById('word-count');
  els.btnRemoveFile = document.getElementById('btn-remove-file');

  els.categoryCode = document.getElementById('category-code');
  els.categoryName = document.getElementById('category-name');
  els.subCategoryCode = document.getElementById('sub-category-code');
  els.subCategoryName = document.getElementById('sub-category-name');
  els.customPrompt = document.getElementById('custom-prompt');

  els.btnExtract = document.getElementById('btn-extract');
  els.btnStop = document.getElementById('btn-stop');
  els.progressSummary = document.getElementById('progress-summary');
  els.progressText = document.getElementById('progress-text');
  els.progressContainer = document.getElementById('progress-container');
  els.progressBar = document.getElementById('progress-bar');
  els.progressLog = document.getElementById('progress-log');

  els.resultSection = document.getElementById('result-section');
  els.eventCount = document.getElementById('event-count');
  els.eventsList = document.getElementById('events-list');
  els.jsonPreview = document.getElementById('json-preview');
  els.btnCopyJson = document.getElementById('btn-copy-json');
  els.btnSaveJson = document.getElementById('btn-save-json');
  els.errorsPanel = document.getElementById('errors-panel');
  els.errorsList = document.getElementById('errors-list');

  els.tabBtns = document.querySelectorAll('.tab-btn');
  els.tabContents = document.querySelectorAll('.tab-content');

  els.toast = document.getElementById('toast');
}

function bindEvents() {
  els.btnSettings.addEventListener('click', openSettings);
  els.btnCloseSettings.addEventListener('click', closeSettings);
  els.btnCancelSettings.addEventListener('click', closeSettings);
  els.settingsModal.querySelector('.modal-overlay').addEventListener('click', closeSettings);
  els.btnSaveSettings.addEventListener('click', saveSettings);
  els.btnTestConnection.addEventListener('click', testConnection);
  els.btnOpenConfigDir.addEventListener('click', () => api.openConfigDir());

  els.btnSelectFile.addEventListener('click', selectFile);
  els.dropZone.addEventListener('click', selectFile);
  setupDropZone();
  els.btnRemoveFile.addEventListener('click', removeFile);

  [els.categoryCode, els.categoryName, els.subCategoryCode, els.subCategoryName, els.customPrompt].forEach(el => {
    el.addEventListener('input', saveOptions);
  });

  els.btnExtract.addEventListener('click', runExtraction);

  els.btnCopyJson.addEventListener('click', copyJson);
  els.btnSaveJson.addEventListener('click', saveJson);

  els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !els.settingsModal.classList.contains('hidden')) {
      closeSettings();
    }
  });
}

function setupDropZone() {
  const zone = els.dropZone;
  ['dragenter', 'dragover'].forEach(event => {
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('dragover');
    });
  });
  ['dragleave', 'dragend', 'drop'].forEach(event => {
    zone.addEventListener(event, (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('dragover');
    });
  });
  zone.addEventListener('drop', async (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  });
}

async function loadConfig() {
  try {
    state.config = await api.getConfig();
    const extraction = state.config.extraction || {};
    state.extractionOptions = {
      categoryCode: extraction.defaultCategoryCode || 'extracted',
      categoryName: extraction.defaultCategoryName || '提取的事件',
      subCategoryCode: extraction.defaultSubCategoryCode || 'events',
      subCategoryName: extraction.defaultSubCategoryName || '历史事件',
      customPrompt: state.extractionOptions?.customPrompt || ''
    };
    loadSavedOptions();
    applyDefaultValues();
    updateExtractButton();
  } catch (err) {
    showToast('加载配置失败: ' + err.message, 'error');
  }
}

function loadSavedOptions() {
  try {
    const saved = localStorage.getItem('extractionOptions');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state.extractionOptions, parsed);
    }
  } catch (_) {}

  els.categoryCode.value = state.extractionOptions.categoryCode;
  els.categoryName.value = state.extractionOptions.categoryName;
  els.subCategoryCode.value = state.extractionOptions.subCategoryCode;
  els.subCategoryName.value = state.extractionOptions.subCategoryName;
  els.customPrompt.value = state.extractionOptions.customPrompt || '';
}

function saveOptions() {
  state.extractionOptions = {
    categoryCode: els.categoryCode.value.trim() || 'extracted',
    categoryName: els.categoryName.value.trim() || '提取的事件',
    subCategoryCode: els.subCategoryCode.value.trim() || 'events',
    subCategoryName: els.subCategoryName.value.trim() || '历史事件',
    customPrompt: els.customPrompt.value
  };
  localStorage.setItem('extractionOptions', JSON.stringify(state.extractionOptions));
}

function applyDefaultValues() {
  const extraction = state.config?.extraction || {};
  if (!els.categoryCode.value) els.categoryCode.placeholder = extraction.defaultCategoryCode || 'extracted';
  if (!els.categoryName.value) els.categoryName.placeholder = extraction.defaultCategoryName || '提取的事件';
  if (!els.subCategoryCode.value) els.subCategoryCode.placeholder = extraction.defaultSubCategoryCode || 'events';
  if (!els.subCategoryName.value) els.subCategoryName.placeholder = extraction.defaultSubCategoryName || '历史事件';
}

function updateExtractButton() {
  const hasFile = !!state.fileData;
  const hasConfig = state.config && state.config.providers && state.config.activeProvider
    && state.config.providers[state.config.activeProvider]?.apiKey;
  els.btnExtract.disabled = !(hasFile && hasConfig);

  if (!hasConfig && hasFile) {
    showToast('请先在设置中配置模型API Key', 'error');
  }
}

async function selectFile() {
  try {
    const data = await api.selectHtmlFile();
    if (data) {
      state.fileData = data;
      showFileInfo(data);
      updateExtractButton();
    }
  } catch (err) {
    showToast('选择文件失败: ' + err.message, 'error');
  }
}

async function handleFile(file) {
  if (!file.name.match(/\.(html|htm)$/i)) {
    showToast('请选择HTML或HTM文件', 'error');
    return;
  }

  try {
    const content = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const title = doc.querySelector('title')?.textContent?.trim()
      || doc.querySelector('h1')?.textContent?.trim()
      || file.name;
    const text = doc.body?.innerText || content.replace(/<[^>]+>/g, ' ');
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    state.fileData = {
      filePath: file.path,
      fileName: file.name,
      fileSize: file.size,
      content: text,
      rawHtml: content,
      title,
      wordCount
    };

    showFileInfo(state.fileData);
    updateExtractButton();
  } catch (err) {
    showToast('读取文件失败: ' + err.message, 'error');
  }
}

function showFileInfo(data) {
  els.dropZone.classList.add('hidden');
  els.fileInfo.classList.remove('hidden');

  els.fileName.textContent = data.fileName;
  els.fileSize.textContent = formatFileSize(data.fileSize);
  els.docTitle.textContent = data.title || '(无标题)';
  els.charCount.textContent = (data.content?.length || 0).toLocaleString();
  els.wordCount.textContent = (data.wordCount || 0).toLocaleString();
}

function removeFile() {
  state.fileData = null;
  els.dropZone.classList.remove('hidden');
  els.fileInfo.classList.add('hidden');
  updateExtractButton();
  hideResult();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(ts) {
  if (ts === null || ts === undefined) return '-';
  const isNegative = ts < 0;
  const abs = Math.abs(ts);
  const year = Math.floor(abs / 10000);
  const month = Math.floor((abs % 10000) / 100);
  const day = abs % 100;
  const prefix = isNegative ? '公元前 ' : '';

  if (month === 0) return `${prefix}${year}年`;
  if (day === 0) return `${prefix}${year}年${month}月`;
  return `${prefix}${year}年${month}月${day}日`;
}

function precisionLabel(p) {
  const labels = ['精确到日', '精确到月', '精确到年', '粗略估计', '不确定'];
  return labels[p] || labels[4];
}

async function runExtraction() {
  if (!state.fileData) return;

  saveOptions();

  els.btnExtract.classList.add('hidden');
  els.btnStop.classList.remove('hidden');
  els.progressContainer.classList.remove('hidden');
  els.progressSummary.classList.remove('hidden');
  els.progressLog.innerHTML = '';
  els.progressBar.style.width = '0%';
  state.progressTotal = 0;
  state.progressCurrent = 0;

  hideResult();

  const options = {
    categoryCode: state.extractionOptions.categoryCode,
    categoryName: state.extractionOptions.categoryName,
    subCategoryCode: state.extractionOptions.subCategoryCode,
    subCategoryName: state.extractionOptions.subCategoryName,
    customPrompt: state.extractionOptions.customPrompt,
    docTitle: state.fileData.title,
    parseHtml: false
  };

  if (state.removeProgressListener) {
    state.removeProgressListener();
  }

  state.removeProgressListener = api.onExtractionProgress(handleProgress);

  try {
    updateProgressText('正在准备提取...');
    addLog('info', `开始处理文档: ${state.fileData.title}`);

    const result = await api.runExtraction({
      htmlContent: state.fileData.rawHtml,
      options
    });

    if (result.success) {
      state.resultData = result.data;
      showResult(result.data);
      updateProgressText(`提取完成！共 ${result.data.events.length} 个事件`);
      addLog('success', `提取完成，共 ${result.data.events.length} 个唯一事件`);
      if (result.data.stats) {
        const s = result.data.stats;
        addLog('info', `分块数: ${s.totalChunks}, 原始提取: ${s.rawExtracted}, 去重后: ${s.finalCount}, 错误数: ${s.errorCount}`);
      }
      setProgress(100);
    } else {
      throw new Error(result.error || '提取失败');
    }
  } catch (err) {
    addLog('error', '提取失败: ' + err.message);
    showToast('提取失败: ' + err.message, 'error');
    updateProgressText('提取失败');
  } finally {
    els.btnExtract.classList.remove('hidden');
    els.btnStop.classList.add('hidden');
    if (state.removeProgressListener) {
      state.removeProgressListener();
      state.removeProgressListener = null;
    }
  }
}

function handleProgress(data) {
  switch (data.type) {
    case 'parsing':
      updateProgressText(data.message);
      addLog('info', data.message);
      break;
    case 'chunking':
      addLog('info', data.message);
      break;
    case 'chunking:done':
      addLog('info', data.message);
      state.progressTotal = data.chunkCount;
      break;
    case 'chunk:start':
      updateProgressText(data.message);
      addLog('info', data.message);
      break;
    case 'chunk:complete':
      addLog(data.extractedCount > 0 ? 'success' : 'info', data.message);
      if (state.progressTotal > 0) {
        state.progressCurrent = data.chunkIndex + 1;
        setProgress(Math.round((state.progressCurrent / state.progressTotal) * 90));
      }
      break;
    case 'chunk:error':
      addLog('error', data.message);
      if (state.progressTotal > 0) {
        state.progressCurrent = data.chunkIndex + 1;
        setProgress(Math.round((state.progressCurrent / state.progressTotal) * 90));
      }
      break;
    case 'dedupe':
    case 'formatting':
      updateProgressText(data.message);
      addLog('info', data.message);
      break;
    case 'complete':
      addLog('success', data.message);
      break;
    case 'rate-limit:wait':
      addLog('info', `速率限制: 等待 ${(data.waitMs / 1000).toFixed(1)} 秒 (${data.currentCount}/${data.limit} req/min)`);
      break;
    case 'request:start':
      addLog('info', `调用 ${data.provider} 模型: ${data.model}`);
      break;
    case 'request:complete':
      if (data.tokens && data.tokens.total_tokens) {
        addLog('success', `API调用完成，使用 ${data.tokens.total_tokens} tokens`);
      }
      break;
    case 'request:error':
      addLog('error', `API请求失败: ${data.error}`);
      break;
  }
}

function setProgress(percent) {
  els.progressBar.style.width = percent + '%';
}

function updateProgressText(text) {
  els.progressText.textContent = text;
}

function addLog(type, message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const time = new Date();
  const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

  let cls = '';
  if (type === 'error') cls = 'log-error';
  else if (type === 'success') cls = 'log-success';

  entry.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="${cls}">${escapeHtml(message)}</span>`;
  els.progressLog.appendChild(entry);
  els.progressLog.scrollTop = els.progressLog.scrollHeight;
}

function showResult(data) {
  els.resultSection.classList.remove('hidden');
  els.eventCount.textContent = `${data.events.length} 个事件`;

  renderEvents(data.events);
  api.previewJson(data.exportData).then(json => {
    els.jsonPreview.textContent = json;
  });

  if (data.errors && data.errors.length > 0) {
    els.errorsPanel.classList.remove('hidden');
    els.errorsList.innerHTML = data.errors.map(e =>
      `<li>第 ${e.chunk + 1} 段: ${escapeHtml(e.error)}</li>`
    ).join('');
  } else {
    els.errorsPanel.classList.add('hidden');
  }

  els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResult() {
  els.resultSection.classList.add('hidden');
  state.resultData = null;
}

function renderEvents(events) {
  els.eventsList.innerHTML = events.map((e, idx) => {
    const metaItems = [];
    metaItems.push(`<span class="meta-item"><span class="meta-label">时间:</span>${formatDate(e.start_ts)}${e.end_ts ? ' ~ ' + formatDate(e.end_ts) : ''} <small>(${precisionLabel(e.start_precision)})</small></span>`);
    if (e.location_name) {
      metaItems.push(`<span class="event-location"><span class="meta-label">地点:</span>${escapeHtml(e.location_name)}</span>`);
    }
    if (e.location_lat !== null && e.location_lng !== null) {
      metaItems.push(`<span class="meta-item"><span class="meta-label">坐标:</span>${e.location_lat}, ${e.location_lng}</span>`);
    }

    return `
      <div class="event-card">
        <div class="event-header">
          <span class="event-title">${escapeHtml(e.title)}</span>
          <span class="event-index">#${idx + 1}</span>
        </div>
        <div class="event-meta">
          ${metaItems.join('')}
        </div>
        ${e.description ? `<div class="event-description">${escapeHtml(e.description)}</div>` : ''}
        ${e.tips ? `<div class="event-tips">💡 ${escapeHtml(e.tips)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function switchTab(tab) {
  els.tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  els.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tab}`);
  });
}

async function copyJson() {
  if (!state.resultData) return;
  try {
    const json = await api.previewJson(state.resultData.exportData);
    await navigator.clipboard.writeText(json);
    showToast('JSON已复制到剪贴板', 'success');
  } catch (err) {
    showToast('复制失败: ' + err.message, 'error');
  }
}

async function saveJson() {
  if (!state.resultData) return;
  try {
    const result = await api.saveJson(state.resultData.exportData);
    if (result) {
      showToast('文件已保存: ' + result, 'success');
    }
  } catch (err) {
    showToast('保存失败: ' + err.message, 'error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  els.toast.textContent = message;
  els.toast.className = `toast ${type === 'info' ? '' : type}`;
  els.toast.classList.remove('hidden');
  setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 3000);
}

/* ========== Settings Modal ========== */

function openSettings() {
  if (!state.config) return;

  renderProviderOptions();
  renderProvidersConfig();

  els.rateLimit.value = state.config.rateLimitRequestsPerMinute;
  api.getConfigPath().then(p => {
    els.configPath.textContent = p;
  });

  els.testResult.textContent = '';
  els.testResult.className = 'test-result';
  els.settingsModal.classList.remove('hidden');
}

function closeSettings() {
  els.settingsModal.classList.add('hidden');
}

function renderProviderOptions() {
  const current = state.config.activeProvider;
  els.activeProvider.innerHTML = Object.entries(state.config.providers)
    .map(([key, p]) => `<option value="${key}" ${key === current ? 'selected' : ''}>${p.name}</option>`)
    .join('');
}

function renderProvidersConfig() {
  const activeKey = state.config.activeProvider;
  els.providersConfig.innerHTML = Object.entries(state.config.providers)
    .map(([key, p]) => `
      <div class="provider-card ${key === activeKey ? 'active' : ''}" data-provider="${key}">
        <div class="provider-header">
          <h3>${p.name}</h3>
          ${key === activeKey ? '<span class="provider-active-badge">当前使用</span>' : ''}
        </div>
        <div class="provider-fields">
          <div class="form-group full-width">
            <label for="prov-${key}-baseUrl">API Base URL</label>
            <input type="url" id="prov-${key}-baseUrl" class="form-input" value="${escapeHtml(p.baseUrl || '')}" data-key="${key}" data-field="baseUrl">
          </div>
          <div class="form-group full-width">
            <label for="prov-${key}-apiKey">API Key</label>
            <input type="password" id="prov-${key}-apiKey" class="form-input" value="${escapeHtml(p.apiKey || '')}" data-key="${key}" data-field="apiKey" placeholder="在此输入API Key">
          </div>
          <div class="form-group">
            <label for="prov-${key}-model">模型名称</label>
            <input type="text" id="prov-${key}-model" class="form-input" value="${escapeHtml(p.model || '')}" data-key="${key}" data-field="model">
          </div>
          ${key === 'claude' ? `
            <div class="form-group">
              <label for="prov-${key}-version">API Version</label>
              <input type="text" id="prov-${key}-version" class="form-input" value="${escapeHtml(p.version || '')}" data-key="${key}" data-field="version">
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
}

async function saveSettings() {
  const newConfig = JSON.parse(JSON.stringify(state.config));

  newConfig.activeProvider = els.activeProvider.value;
  newConfig.rateLimitRequestsPerMinute = parseInt(els.rateLimit.value, 10) || -1;

  els.providersConfig.querySelectorAll('input[data-key]').forEach(input => {
    const key = input.dataset.key;
    const field = input.dataset.field;
    if (newConfig.providers[key]) {
      newConfig.providers[key][field] = input.value.trim();
    }
  });

  newConfig.extraction = newConfig.extraction || {};
  newConfig.extraction.defaultCategoryCode = state.extractionOptions.categoryCode;
  newConfig.extraction.defaultCategoryName = state.extractionOptions.categoryName;
  newConfig.extraction.defaultSubCategoryCode = state.extractionOptions.subCategoryCode;
  newConfig.extraction.defaultSubCategoryName = state.extractionOptions.subCategoryName;

  const result = await api.saveConfig(newConfig);
  if (result.success) {
    state.config = newConfig;
    closeSettings();
    showToast('设置已保存', 'success');
    updateExtractButton();
  } else {
    showToast('保存失败: ' + (result.error || '未知错误'), 'error');
  }
}

async function testConnection() {
  els.testResult.textContent = '测试中...';
  els.testResult.className = 'test-result';

  const activeKey = els.activeProvider.value;
  const tempConfig = JSON.parse(JSON.stringify(state.config));
  tempConfig.activeProvider = activeKey;

  els.providersConfig.querySelectorAll('input[data-key]').forEach(input => {
    const key = input.dataset.key;
    const field = input.dataset.field;
    if (tempConfig.providers[key]) {
      tempConfig.providers[key][field] = input.value.trim();
    }
  });

  await api.saveConfig(tempConfig);

  const result = await api.validateConfig(activeKey);

  state.config = await api.getConfig();

  if (result.success) {
    els.testResult.textContent = `✓ 连接成功 (HTTP ${result.status})`;
    els.testResult.className = 'test-result success';
  } else {
    els.testResult.textContent = `✗ 失败: ${result.error}`;
    els.testResult.className = 'test-result error';
  }
}

document.addEventListener('DOMContentLoaded', init);
