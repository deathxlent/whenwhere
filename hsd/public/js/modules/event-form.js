window.HSD = window.HSD || {};

HSD.eventForm = {
  getAddPanelHtml() {
    return `
      <form id="add-form">
        <div class="coordinate-display" id="coord-display">
          纬度: <span id="disp-lat">-</span> &nbsp; 经度: <span id="disp-lng">-</span>
          &nbsp;&nbsp; 纬度2: <span id="disp-lat2">-</span> &nbsp; 经度2: <span id="disp-lng2">-</span>
        </div>
        <div class="form-group" style="margin-bottom:8px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
            <input type="checkbox" id="f-location-only" style="width:16px;height:16px;">
            仅猜测地点（不猜时间）
          </label>
        </div>
        <div class="form-group">
          <label class="form-label required">事件名称</label>
          <input type="text" class="form-control" id="f-title" placeholder="请输入事件名称" required>
        </div>
        <div class="form-group">
          <label class="form-label">地点名称</label>
          <input type="text" class="form-control" id="f-locname" placeholder="如：北京天安门">
        </div>
        <div class="form-group" id="add-start-time-group">
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
        <div class="form-group" id="add-end-time-group">
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
          <label class="form-label">小贴士</label>
          <textarea class="form-control" id="f-tips" placeholder="小贴士（猜图时显示，非必填）" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">视频URL</label>
          <input type="text" class="form-control" id="f-video-url" placeholder="支持优酷、bilibili链接">
          <div class="form-hint">仅支持 youku.com / bilibili.com / b23.tv 链接</div>
        </div>
        <div class="form-group">
          <label class="form-label">音频URL</label>
          <input type="text" class="form-control" id="f-audio-url" placeholder="支持QQ音乐、网易云音乐或.mp3链接">
          <div class="form-hint">支持 y.qq.com / music.163.com / .mp3 结尾的链接</div>
        </div>
        <div class="form-group">
          <label class="form-label">图片</label>
          <div class="image-tabs">
            <div class="image-add-tab active" data-tab="upload">📤 上传</div>
            <div class="image-add-tab" data-tab="url">🔗 URL</div>
          </div>
          <div id="tab-upload">
            <div class="image-add-area" id="add-image-area">
              <div style="font-size:32px;">📤</div>
              <p>点击或拖拽图片到此处</p>
              <p style="font-size:11px;color:#a0aec0;">最多 20 张，支持 JPG/PNG/GIF/WEBP</p>
              <input type="file" id="f-images" accept="image/*" multiple style="display:none;">
            </div>
          </div>
          <div id="tab-url" style="display:none;">
            <input type="text" class="form-control" id="f-image-url" placeholder="粘贴图片URL">
            <input type="text" class="form-control" id="f-image-name" placeholder="图片名称（可选）" style="margin-top:6px;">
            <button type="button" class="btn btn-default btn-sm" id="add-url-btn" style="margin-top:6px;">+ 添加URL</button>
          </div>
          <div class="image-previews" id="image-previews"></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;">
          <button type="button" class="btn btn-default" id="cancel-add-btn">取消</button>
          <button type="button" class="btn btn-primary" id="submit-add-btn">添加</button>
        </div>
      </form>
    `;
  },

  initAddPanel() {
    HSD.state.pendingImages = [];

    document.getElementById('close-panel-btn').addEventListener('click', () => HSD.eventForm.closeAddPanel());
    document.getElementById('cancel-add-btn').addEventListener('click', () => HSD.eventForm.closeAddPanel());
    document.getElementById('submit-add-btn').addEventListener('click', () => HSD.eventForm.submitEvent());

    document.getElementById('f-location-only').addEventListener('change', (e) => {
      const disabled = e.target.checked;
      const startGroup = document.getElementById('add-start-time-group');
      const endGroup = document.getElementById('add-end-time-group');
      if (startGroup) {
        startGroup.style.opacity = disabled ? '0.4' : '1';
        startGroup.style.pointerEvents = disabled ? 'none' : '';
      }
      if (endGroup) {
        endGroup.style.opacity = disabled ? '0.4' : '1';
        endGroup.style.pointerEvents = disabled ? 'none' : '';
      }
    });

    HSD.eventForm.initEraToggle('start-era');
    HSD.eventForm.initEraToggle('end-era');
    HSD.eventForm.initPrecisionRow('start');
    HSD.eventForm.initPrecisionRow('end');
    HSD.eventForm.bindDateFieldBounds('f-start-month', 'f-start-day');
    HSD.eventForm.bindDateFieldBounds('f-end-month', 'f-end-day');

    document.getElementById('sync-end-btn').addEventListener('click', () => {
      HSD.eventForm.syncEndFromStart({
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
      HSD.eventForm.addPendingImages(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => {
      HSD.eventForm.addPendingImages(e.target.files);
      e.target.value = '';
    });

    document.getElementById('add-url-btn').addEventListener('click', () => {
      const urlInput = document.getElementById('f-image-url');
      const nameInput = document.getElementById('f-image-name');
      const url = urlInput.value.trim();
      const name = nameInput.value.trim();

      if (!url) { toast('请输入图片URL', 'error'); return; }
      if (!/^https?:\/\//i.test(url)) { toast('URL必须以http://或https://开头', 'error'); return; }

      HSD.eventForm.addPendingUrlImage(url, name);
      urlInput.value = '';
      nameInput.value = '';
    });
  },

  addPendingUrlImage(url, name) {
    if (HSD.state.pendingImages.length >= 20) { toast('最多添加20张图片', 'warning'); return; }

    HSD.state.pendingImages.push({
      type: 'url',
      url: url,
      dataUrl: url,
      name: name || url
    });
    HSD.eventForm.renderImagePreviews();
    toast('URL图片已添加', 'success');
  },

  initEraToggle(groupId) {
    const group = document.getElementById(groupId);
    group.querySelectorAll('.era-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.era-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  bindDateFieldBounds(monthId, dayId) {
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
  },

  syncEndFromStart(options) {
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
  },

  initPrecisionRow(prefix) {
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
  },

  initModalPrecisionRow(rowId, monthGroupId, dayGroupId) {
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
  },

  addPendingImages(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (HSD.state.pendingImages.length >= 20) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        HSD.state.pendingImages.push({
          type: 'file',
          file: file,
          dataUrl: e.target.result,
          name: file.name
        });
        HSD.eventForm.renderImagePreviews();
      };
      reader.readAsDataURL(file);
    });
  },

  renderImagePreviews() {
    const container = document.getElementById('image-previews');
    container.innerHTML = HSD.state.pendingImages.map((img, idx) => `
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
        HSD.state.pendingImages.splice(idx, 1);
        HSD.eventForm.renderImagePreviews();
      });
    });
  },

  closeAddPanel() {
    const panel = document.getElementById('add-panel');
    panel.classList.remove('open');

    if (HSD.state.mapClickMarker) {
      HSD.state.map.removeLayer(HSD.state.mapClickMarker);
      HSD.state.mapClickMarker = null;
    }
    if (HSD.state.mapClickRect) {
      HSD.state.map.removeLayer(HSD.state.mapClickRect);
      HSD.state.mapClickRect = null;
    }
    if (HSD.state.mapDrawingRect) {
      HSD.state.map.removeLayer(HSD.state.mapDrawingRect);
      HSD.state.mapDrawingRect = null;
    }

    HSD.eventForm.resetAddForm();
    HSD.state.pendingImages = [];

    const hint = document.getElementById('map-hint');
    if (hint) hint.style.opacity = '1';
  },

  resetAddForm() {
    document.getElementById('f-title').value = '';
    document.getElementById('f-locname').value = '';
    document.getElementById('f-start-year').value = '';
    document.getElementById('f-start-month').value = '';
    document.getElementById('f-start-day').value = '';
    document.getElementById('f-end-year').value = '';
    document.getElementById('f-end-month').value = '';
    document.getElementById('f-end-day').value = '';
    document.getElementById('f-desc').value = '';
    const fTips = document.getElementById('f-tips');
    if (fTips) fTips.value = '';
    document.getElementById('image-previews').innerHTML = '';
    document.getElementById('disp-lat').textContent = '-';
    document.getElementById('disp-lng').textContent = '-';
    document.getElementById('disp-lat2').textContent = '-';
    document.getElementById('disp-lng2').textContent = '-';

    const locOnlyCheckbox = document.getElementById('f-location-only');
    if (locOnlyCheckbox) {
      locOnlyCheckbox.checked = false;
    }

    const startGroup = document.getElementById('add-start-time-group');
    const endGroup = document.getElementById('add-end-time-group');
    if (startGroup) { startGroup.style.opacity = '1'; startGroup.style.pointerEvents = ''; }
    if (endGroup) { endGroup.style.opacity = '1'; endGroup.style.pointerEvents = ''; }

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
  },

  async submitEvent() {
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
        HSD.eventForm.addPendingUrlImage(url, name || url);
        urlInput.value = '';
        if (urlNameInput) urlNameInput.value = '';
      }
    }

    const fTips = document.getElementById('f-tips');
    const tipsVal = fTips ? fTips.value.trim() : '';
    const fVideoUrl = document.getElementById('f-video-url');
    const videoUrlVal = fVideoUrl ? fVideoUrl.value.trim() : '';
    const fAudioUrl = document.getElementById('f-audio-url');
    const audioUrlVal = fAudioUrl ? fAudioUrl.value.trim() : '';

    if (HSD.state.pendingImages.length === 0 && !tipsVal && !videoUrlVal && !audioUrlVal) {
      toast('图片（上传或URL）、提示(tips)、视频URL、音频URL 至少需要填写一项', 'error');
      return;
    }

    const locationOnly = document.getElementById('f-location-only').checked;

    const startYear = document.getElementById('f-start-year').value;
    if (!locationOnly && !startYear) { toast('请输入开始时间的年份', 'error'); return; }

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
      const lat2Text = document.getElementById('disp-lat2').textContent;
      const lng2Text = document.getElementById('disp-lng2').textContent;

      const eventData = {
        category_id: HSD.state.currentCategory.id,
        sub_category_id: HSD.state.currentSubCategory.id,
        title: title,
        start_ts: startTs,
        start_precision: startPrecision,
        end_ts: endTs,
        end_precision: endPrecision,
        description: document.getElementById('f-desc').value.trim() || null,
        tips: tipsVal || null,
        location_lat: parseFloat(lat),
        location_lng: parseFloat(lng),
        location_name: document.getElementById('f-locname').value.trim() || null,
        location_lat2: lat2Text !== '-' ? parseFloat(lat2Text) : null,
        location_lng2: lng2Text !== '-' ? parseFloat(lng2Text) : null,
        location_only: locationOnly ? 1 : 0,
        video_url: videoUrlVal || null,
        audio_url: audioUrlVal || null
      };

      const res = await API.post('/events', eventData);

      if (!res.success) {
        toast(res.message || '添加失败', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '添加';
        return;
      }

      const eventId = res.data.id;
      const catCode = HSD.state.currentCategory.code;
      const subCode = HSD.state.currentSubCategory.code;

      const fileImages = HSD.state.pendingImages.filter(img => img.type === 'file');
      const urlImages = HSD.state.pendingImages.filter(img => img.type === 'url');

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

      HSD.eventForm.closeAddPanel();
    } catch (e) {
      toast('添加失败: ' + e.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '添加';
    }
  }
};
