let selectedFiles = [];
let extractedData = null;

const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const btnPreview = document.getElementById('btn-preview');
const btnExtract = document.getElementById('btn-extract');
const btnDownload = document.getElementById('btn-download');
const resultSection = document.getElementById('result-section');
const resultTbody = document.getElementById('result-tbody');
const resultCount = document.getElementById('result-count');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const configStatus = document.getElementById('config-status');

async function checkConfigStatus() {
  try {
    const response = await fetch('/api/extract/status');
    const data = await response.json();
    
    const statusIndicator = configStatus.querySelector('.status-indicator');
    const statusText = configStatus.querySelector('.status-text');
    
    if (data.data.configured) {
      statusIndicator.className = 'status-indicator status-ready';
      let statusMsg = `配置就绪 - 提供商: ${data.data.provider}`;
      if (data.data.rate_limit_unlimited) {
        statusMsg += ' (速率: 无限制)';
      } else {
        statusMsg += ` (速率: ${data.data.rate_limit_per_minute}次/分钟)`;
      }
      statusText.textContent = statusMsg;
    } else {
      statusIndicator.className = 'status-indicator status-error';
      statusText.textContent = '配置未完成 - 请先配置 config.json';
    }
    
    updateButtonStates();
  } catch (e) {
    const statusIndicator = configStatus.querySelector('.status-indicator');
    const statusText = configStatus.querySelector('.status-text');
    statusIndicator.className = 'status-indicator status-error';
    statusText.textContent = '无法连接到服务器';
  }
}

function updateButtonStates() {
  const hasFiles = selectedFiles.length > 0;
  btnPreview.disabled = !hasFiles;
  btnExtract.disabled = !hasFiles;
}

uploadArea.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  addFiles(Array.from(e.target.files));
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  
  const files = Array.from(e.dataTransfer.files).filter(f => 
    f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm')
  );
  addFiles(files);
});

function addFiles(files) {
  for (const file of files) {
    if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.push(file);
    }
  }
  renderFileList();
  updateButtonStates();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
  updateButtonStates();
}

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <span>📄 ${file.name} (${formatFileSize(file.size)})</span>
      <button class="remove-btn" onclick="removeFile(${index})" title="移除">×</button>
    `;
    fileList.appendChild(div);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getOptions() {
  return {
    category_code: document.getElementById('category-code').value || 'history',
    category_name: document.getElementById('category-name').value || '历史',
    sub_category_code: document.getElementById('sub-category-code').value || 'events',
    sub_category_name: document.getElementById('sub-category-name').value || '历史事件',
    additional_instructions: document.getElementById('additional-instructions').value || ''
  };
}

async function extractEvents(preview = false) {
  if (selectedFiles.length === 0) {
    alert('请先上传 HTML 文件');
    return;
  }

  const formData = new FormData();
  const options = getOptions();
  
  for (const key in options) {
    if (options[key]) {
      formData.append(key, options[key]);
    }
  }
  
  for (const file of selectedFiles) {
    formData.append('files', file);
  }

  showLoading(preview ? '正在预览提取结果...' : '正在提取事件，请稍候...');

  try {
    const endpoint = preview ? '/api/extract/extract-preview' : '/api/extract/extract';
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      extractedData = data.data;
      displayResults(data.data, preview ? data.total_count : null);
    } else {
      alert('提取失败: ' + data.message);
    }
  } catch (e) {
    alert('请求失败: ' + e.message);
  } finally {
    hideLoading();
  }
}

function displayResults(data, totalCount = null) {
  resultSection.classList.remove('hidden');
  btnDownload.disabled = !data.events || data.events.length === 0;

  const count = totalCount !== null ? totalCount : data.events.length;
  const displayCount = data.events ? data.events.length : 0;
  
  if (totalCount !== null && totalCount > displayCount) {
    resultCount.textContent = `共 ${count} 个事件（显示前 ${displayCount} 个）`;
  } else {
    resultCount.textContent = `共 ${count} 个事件`;
  }

  resultTbody.innerHTML = '';
  
  if (data.events && data.events.length > 0) {
    data.events.forEach((event, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(event.title || '')}</td>
        <td>${formatTs(event.start_ts)}</td>
        <td>${formatTs(event.end_ts)}</td>
        <td>${escapeHtml(event.location_name || '-')}</td>
      `;
      resultTbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="text-align: center; color: #95a5a6;">没有提取到事件</td>';
    resultTbody.appendChild(tr);
  }
}

function formatTs(ts) {
  if (ts === null || ts === undefined || ts === '') return '-';
  if (typeof ts === 'number') {
    if (ts < 0) {
      return `公元前${Math.abs(ts)}年`;
    }
    return `公元${ts}年`;
  }
  return ts;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function downloadJson() {
  if (!extractedData) {
    alert('没有可下载的数据');
    return;
  }

  const dataStr = JSON.stringify(extractedData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `extracted_events_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showLoading(text = '加载中...') {
  loadingText.textContent = text;
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

btnPreview.addEventListener('click', () => extractEvents(true));
btnExtract.addEventListener('click', () => extractEvents(false));
btnDownload.addEventListener('click', downloadJson);

checkConfigStatus();
