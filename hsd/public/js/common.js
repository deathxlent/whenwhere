const API = {
  async get(url) {
    const res = await fetch(`/api${url}`);
    return await res.json();
  },
  async post(url, data) {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  async put(url, data) {
    const res = await fetch(`/api${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  async delete(url) {
    const res = await fetch(`/api${url}`, {
      method: 'DELETE'
    });
    return await res.json();
  },
  async upload(url, formData) {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  }
};

function toast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function showModal(html, isLarge = false) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal ${isLarge ? 'large' : ''}" onclick="event.stopPropagation()">
        ${html}
      </div>
    </div>
  `;
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

function confirmDialog(message, onConfirm, subMessage = '') {
  showModal(`
    <div class="modal-body confirm-dialog">
      <div class="confirm-dialog-text">${message}</div>
      ${subMessage ? `<div class="confirm-dialog-sub">${subMessage}</div>` : ''}
    </div>
    <div class="modal-footer">
      <button class="btn btn-default" onclick="closeModal()">取消</button>
      <button class="btn btn-danger" id="confirm-btn">确定</button>
    </div>
  `);
  document.getElementById('confirm-btn').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function setBreadcrumb(text) {
  document.getElementById('breadcrumb-text').textContent = text;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
