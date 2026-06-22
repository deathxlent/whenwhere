function openVideoPlayer(url) {
  const existing = document.getElementById('video-player-modal');
  if (existing) {
    existing.remove();
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'video-player-modal';
  modal.className = 'video-player-modal';
  modal.innerHTML = `
    <div class="video-player-overlay"></div>
    <div class="video-player-container">
      <button class="video-player-close" onclick="closeVideoPlayer()">×</button>
      <div class="video-player-content">
        <iframe src="${escapeHtml(url)}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.video-player-overlay').addEventListener('click', closeVideoPlayer);
}

function closeVideoPlayer() {
  const modal = document.getElementById('video-player-modal');
  if (modal) modal.remove();
}

function openImageViewer(src) {
  const existing = document.getElementById('image-viewer');
  if (existing) {
    existing.remove();
    return;
  }

  const viewer = document.createElement('div');
  viewer.id = 'image-viewer';
  viewer.className = 'image-viewer';
  viewer.innerHTML = `
    <div class="image-viewer-overlay"></div>
    <div class="image-viewer-container">
      <img src="${src}" class="image-viewer-img" alt="查看图片">
      <button class="image-viewer-close" onclick="document.getElementById('image-viewer').remove()">×</button>
    </div>
  `;
  document.body.appendChild(viewer);

  viewer.querySelector('.image-viewer-overlay').addEventListener('click', closeViewer);
  viewer.querySelector('.image-viewer-img').addEventListener('click', closeViewer);
}

function closeViewer() {
  const viewer = document.getElementById('image-viewer');
  if (viewer) viewer.remove();
}

function showLocationConfirm() {
  if (document.getElementById('location-confirm-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'time-picker-overlay';
  overlay.id = 'location-confirm-overlay';
  overlay.innerHTML = `
    <div class="time-picker-panel">
      <div class="time-picker-title">确认位置</div>
      <div style="padding:20px;text-align:center;color:rgba(255,255,255,0.85);">
        已选择位置，确定提交吗？
      </div>
      <div class="time-picker-actions">
        <button class="btn btn-secondary" id="lc-cancel">取消</button>
        <button class="btn btn-primary" id="lc-confirm">确定提交</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('lc-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('lc-confirm').addEventListener('click', () => {
    overlay.remove();
    submitGuess();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function showTimePicker() {
  if (document.getElementById('time-picker-overlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'time-picker-overlay';
  overlay.id = 'time-picker-overlay';
  overlay.innerHTML = `
    <div class="time-picker-panel">
      <div class="time-picker-title">选择时间</div>
      <div class="precision-row">
        <button class="precision-btn active" data-precision="0">仅年</button>
        <button class="precision-btn" data-precision="1">年月</button>
        <button class="precision-btn" data-precision="2">年月日</button>
      </div>
      <div class="time-picker-row">
        <div class="form-group">
          <label class="form-label">年</label>
          <input type="number" class="form-control" id="tp-year" placeholder="如：1949">
        </div>
        <div class="form-group" id="tp-month-group" style="display:none;">
          <label class="form-label">月</label>
          <input type="number" class="form-control" id="tp-month" placeholder="1-12" min="1" max="12">
        </div>
        <div class="form-group" id="tp-day-group" style="display:none;">
          <label class="form-label">日</label>
          <input type="number" class="form-control" id="tp-day" placeholder="1-31" min="1" max="31">
        </div>
      </div>
      <div class="time-picker-actions">
        <button class="btn btn-secondary" id="tp-cancel">取消</button>
        <button class="btn btn-primary" id="tp-confirm">确定</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let precision = 0;
  overlay.querySelectorAll('.precision-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.precision-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      precision = parseInt(btn.dataset.precision);
      document.getElementById('tp-month-group').style.display = precision >= 1 ? '' : 'none';
      document.getElementById('tp-day-group').style.display = precision >= 2 ? '' : 'none';
    });
  });

  document.getElementById('tp-cancel').addEventListener('click', () => {
    overlay.remove();
  });

  document.getElementById('tp-confirm').addEventListener('click', () => {
    const year = parseInt(document.getElementById('tp-year').value);
    if (!year || isNaN(year)) { alert('请输入年份'); return; }

    appState.guessYear = year;
    appState.guessMonth = precision >= 1 ? (parseInt(document.getElementById('tp-month').value) || null) : null;
    appState.guessDay = precision >= 2 ? (parseInt(document.getElementById('tp-day').value) || null) : null;

    overlay.remove();
    submitGuess();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}
