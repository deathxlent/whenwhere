let state = {
  categories: [],
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
    const res = await API.get('/categories');
    if (res.success) {
      state.categories = res.data;
      renderMainView();
    }
  } catch (e) {
    toast('加载数据失败', 'error');
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
      <div class="action-bar">
        <button class="btn btn-primary" id="enter-btn" disabled>进入地图添加</button>
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
      document.getElementById('enter-btn').disabled = false;
    });
  });

  document.getElementById('enter-btn').addEventListener('click', () => {
    if (state.currentSubCategory) {
      renderMapView();
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
              <label class="form-label">结束时间</label>
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
              <div class="add-image-area" id="add-image-area">
                <div style="font-size:28px;">📤</div>
                <p>点击或拖拽上传图片</p>
              </div>
              <input type="file" id="f-images" accept="image/*" multiple style="display:none;">
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

function initMap() {
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  let center, zoom;
  const subCode = state.currentSubCategory?.code || '';
  if (subCode === 'china') {
    center = [35, 105];
    zoom = 5;
  } else {
    center = [20, 10];
    zoom = 2;
  }

  state.map = L.map('map', {
    center: center,
    zoom: zoom,
    minZoom: 2,
    maxZoom: 18,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(state.map);

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
  data.features.forEach(feature => {
    const name = feature.properties.name;
    if (!name) return;

    const bounds = L.geoJSON(feature).getBounds();
    const center = bounds.getCenter();

    const zoom = state.map.getZoom();
    if (zoom >= 4) {
      const label = L.marker(center, {
        icon: L.divIcon({
          className: 'province-label',
          html: name,
          iconSize: [0, 0]
        }),
        interactive: false
      }).addTo(state.map);
      state.admin1Labels.push(label);
    }
  });
}

async function loadWorldAdmin1Labels() {
  try {
    const res = await fetch('/shared/geojson/world_admin1_labels.json');
    const data = await res.json();

    data.features.forEach(feature => {
      const name = feature.properties.name;
      const coords = feature.geometry.coordinates;
      if (!name || !coords) return;

      const label = L.marker([coords[1], coords[0]], {
        icon: L.divIcon({
          className: 'admin1-label',
          html: name,
          iconSize: [0, 0]
        }),
        interactive: false
      });
      state.admin1Labels.push(label);
    });

    updateLabelVisibility();
    state.map.on('zoomend', updateLabelVisibility);
  } catch (e) {
    console.warn('加载世界行政区划标注失败:', e);
  }
}

function updateLabelVisibility() {
  if (!state.map) return;
  const zoom = state.map.getZoom();

  state.admin1Labels.forEach(label => {
    const el = label.getElement();
    if (!el) return;

    const iconEl = el.querySelector('.province-label, .admin1-label');
    if (iconEl && iconEl.classList.contains('province-label')) {
      if (zoom >= 4) {
        if (!state.map.hasLayer(label)) state.map.addLayer(label);
      } else {
        if (state.map.hasLayer(label)) state.map.removeLayer(label);
      }
    } else {
      if (zoom >= 5) {
        if (!state.map.hasLayer(label)) state.map.addLayer(label);
      } else {
        if (state.map.hasLayer(label)) state.map.removeLayer(label);
      }
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

  if (state.pendingImages.length === 0) { toast('请至少上传一张图片', 'error'); return; }

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

    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('category_code', catCode);
    formData.append('sub_category_code', subCode);
    formData.append('event_title', title);
    state.pendingImages.forEach(img => {
      formData.append('images', img.file);
    });

    const imgRes = await API.upload('/images/upload', formData);

    if (!imgRes.success) {
      toast('事件已添加但图片上传失败: ' + (imgRes.message || ''), 'error');
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
        <button class="btn btn-success" id="add-map-btn">🗺️ 地图添加</button>
        <button class="btn btn-primary" id="add-btn">+ 快速添加</button>
      </div>
    </div>
    <div class="table-container" id="list-container">
      <div style="text-align:center;padding:40px;color:#718096;">加载中...</div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', renderMainView);
  document.getElementById('add-map-btn').addEventListener('click', renderMapView);
  document.getElementById('add-btn').addEventListener('click', () => showEventForm());

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
      if (action === 'edit') showEventForm(event);
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
              <div class="form-group">
                <input type="number" class="form-control" id="f-start-month" placeholder="月" min="1" max="12" value="${startParts.month}">
              </div>
              <div class="form-group">
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
            <label class="form-label">结束时间</label>
            <div class="era-toggle" id="modal-end-era">
              <button type="button" class="era-toggle-btn ${!endParts.isBce ? 'active' : ''}" data-era="ce">公元</button>
              <button type="button" class="era-toggle-btn ${endParts.isBce ? 'active' : ''}" data-era="bce">公元前</button>
            </div>
            <div class="date-picker-group">
              <div class="form-group year-field">
                <input type="number" class="form-control" id="f-end-year" placeholder="年" min="1" value="${endParts.year}">
              </div>
              <div class="form-group">
                <input type="number" class="form-control" id="f-end-month" placeholder="月" min="1" max="12" value="${endParts.month}">
              </div>
              <div class="form-group">
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
  initModalPrecisionRow('modal-start-precision-row', 'f-start-month', 'f-start-day');
  initModalPrecisionRow('modal-end-precision-row', 'f-end-month', 'f-end-day');
  bindDateFieldBounds('f-start-month', 'f-start-day');
  bindDateFieldBounds('f-end-month', 'f-end-day');

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

function initModalPrecisionRow(rowId, monthId, dayId) {
  const row = document.getElementById(rowId);
  row.querySelectorAll('.date-precision-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.date-precision-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const precision = parseInt(btn.dataset.precision);
      const monthInput = document.getElementById(monthId);
      const dayInput = document.getElementById(dayId);

      if (precision === 0) {
        monthInput.closest('.form-group').style.display = 'none';
        dayInput.closest('.form-group').style.display = 'none';
        monthInput.value = '';
        dayInput.value = '';
      } else if (precision === 1) {
        monthInput.closest('.form-group').style.display = '';
        dayInput.closest('.form-group').style.display = 'none';
        dayInput.value = '';
      } else {
        monthInput.closest('.form-group').style.display = '';
        dayInput.closest('.form-group').style.display = '';
      }
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
  setBreadcrumb(`首页 / ${state.currentCategory.name} / ${state.currentSubCategory.name} / ${event.title} / 图片管理`);

  document.getElementById('main-view').innerHTML = `
    <div class="page-header">
      <div>
        <span class="back-link" id="back-btn">← 返回列表</span>
        <h2 class="page-title" style="margin-top:8px;">图片管理 - ${escapeHtml(event.title)}</h2>
      </div>
    </div>
    <div class="table-container" style="padding:24px;">
      <div class="image-upload-area" id="upload-area">
        <div style="font-size:40px;">📤</div>
        <p>点击或拖拽图片到此处上传</p>
        <p style="font-size:12px;color:#a0aec0;margin-top:4px;">支持 JPG、PNG、GIF、WEBP、BMP 格式，单张最大 10MB，一次最多上传 20 张</p>
        <input type="file" id="file-input" accept="image/*" multiple style="display:none;">
      </div>
      <div id="images-container">
        <div style="text-align:center;padding:30px;color:#718096;">加载中...</div>
      </div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', renderEventList);

  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');

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

  await loadImages(event.id);
}

async function loadImages(eventId) {
  const container = document.getElementById('images-container');
  const res = await API.get(`/images/event/${eventId}`);

  if (!res.success) {
    container.innerHTML = `<div style="text-align:center;padding:30px;color:#e53e3e;">加载失败</div>`;
    return;
  }

  if (res.data.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:30px;">
        <div class="empty-state-icon">🖼️</div>
        <h3>暂无图片</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="images-grid">
      ${res.data.map(img => `
        <div class="image-card">
          <img src="${img.url}" alt="${escapeHtml(img.original_name || '')}">
          <button class="image-card-delete" data-id="${img.id}" title="删除">×</button>
          <div class="image-card-info">
            <div class="image-card-name">${escapeHtml(img.original_name || img.filename)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.image-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const imgId = parseInt(btn.dataset.id);
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
