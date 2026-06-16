let currentPage = 'dashboard';
let map = null;
let markers = [];
let selectedSubCategoryId = null;
let selectedCategoryId = null;
let editingEventId = null;
let tempMarker = null;
let currentSubCategoryData = null;
let startPrecision = 2;
let endPrecision = 2;
let startEra = 'ce';
let endEra = 'ce';

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadDashboard();
    loadCategories();
    loadMaps();
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

function switchPage(page) {
    currentPage = page;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === 'page-' + page);
    });
    
    const titles = {
        dashboard: '数据概览',
        events: '出题 / 添加事件',
        categories: '分类管理',
        maps: '地图管理',
        export: '数据导出 / 导入'
    };
    document.getElementById('page-title').textContent = titles[page] || '';
    
    if (page === 'events') {
        setTimeout(() => initEventPageBindings(), 100);
    }
    if (page === 'dashboard') {
        loadDashboard();
    }
    if (page === 'categories') {
        loadCategoryList();
    }
    if (page === 'maps') {
        loadMapList();
    }
    if (page === 'export') {
        loadExportEventList();
        loadExportStats();
    }
}

async function api(url, options = {}) {
    const defaultOptions = {
        headers: { 'Content-Type': 'application/json' }
    };
    const opts = { ...defaultOptions, ...options };
    if (opts.body && typeof opts.body === 'object') {
        opts.body = JSON.stringify(opts.body);
    }
    
    try {
        const res = await fetch('/api' + url, opts);
        return await res.json();
    } catch (e) {
        return { success: false, message: e.message };
    }
}

function loadDashboard() {
    loadStats();
    loadRecentEvents();
}

async function loadStats() {
    const mapsRes = await api('/maps');
    const catsRes = await api('/categories');
    const subsRes = await api('/categories/sub-categories/all');
    const eventsRes = await api('/events/all');
    
    if (mapsRes.success) {
        document.getElementById('stat-maps').textContent = mapsRes.data.length;
    }
    if (catsRes.success) {
        document.getElementById('stat-categories').textContent = catsRes.data.length;
    }
    if (subsRes.success) {
        document.getElementById('stat-subcats').textContent = subsRes.data.length;
    }
    if (eventsRes.success) {
        document.getElementById('stat-events').textContent = eventsRes.data.length;
    }
}

async function loadRecentEvents() {
    const res = await api('/events/all');
    const listEl = document.getElementById('recent-events-list');
    
    if (!res.success || res.data.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>暂无事件，快去添加吧！</p></div>';
        return;
    }
    
    const recent = res.data.slice(-10).reverse();
    let html = '<table><thead><tr><th>标题</th><th>分类</th><th>子分类</th><th>时间</th><th>地点</th></tr></thead><tbody>';
    
    recent.forEach(e => {
        html += `<tr>
            <td>${escapeHtml(e.title)}</td>
            <td>${escapeHtml(e.category_name || '-')}</td>
            <td>${escapeHtml(e.sub_category_name || '-')}</td>
            <td>${escapeHtml(e.start_display || '-')}</td>
            <td>${escapeHtml(e.location_name || '-')}</td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    listEl.innerHTML = html;
}

function loadCategories() {
    loadCategorySelect();
    loadCategoryList();
}

async function loadCategorySelect() {
    const res = await api('/categories');
    const select = document.getElementById('event-category-select');
    const filterSelect = document.getElementById('sub-category-filter');
    const parentSelect = document.getElementById('sub-category-parent');
    
    if (!res.success) return;
    
    let options = '<option value="">请先在分类管理中创建分类</option>';
    if (res.data.length > 0) {
        options = '<option value="">请选择分类</option>';
    }
    res.data.forEach(c => {
        options += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
    
    select.innerHTML = options;
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">选择分类查看子分类</option>' + options.replace('请先在分类管理中创建分类', '').replace('请选择分类', '');
    }
    if (parentSelect) {
        parentSelect.innerHTML = options;
    }
}

function initEventPageBindings() {
    document.querySelectorAll('#start-era .era-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#start-era .era-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            startEra = btn.dataset.era;
        });
    });
    
    document.querySelectorAll('#end-era .era-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#end-era .era-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            endEra = btn.dataset.era;
        });
    });
    
    document.querySelectorAll('#start-precision .precision-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#start-precision .precision-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            startPrecision = parseInt(btn.dataset.precision);
            updateDateFieldsVisibility('start');
        });
    });
    
    document.querySelectorAll('#end-precision .precision-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#end-precision .precision-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            endPrecision = parseInt(btn.dataset.precision);
            updateDateFieldsVisibility('end');
        });
    });
}

function updateDateFieldsVisibility(prefix) {
    const precision = prefix === 'start' ? startPrecision : endPrecision;
    const monthField = document.getElementById(prefix + '-month')?.parentElement;
    const dayField = document.getElementById(prefix + '-day')?.parentElement;
    if (monthField) monthField.style.display = precision >= 1 ? '' : 'none';
    if (dayField) dayField.style.display = precision >= 2 ? '' : 'none';
}

async function loadEventSubCategories() {
    const categoryId = document.getElementById('event-category-select').value;
    const tabsEl = document.getElementById('event-sub-category-tabs');
    
    if (!categoryId) {
        tabsEl.innerHTML = '<span style="color: #9ca3af; font-size: 13px;">请先选择分类</span>';
        selectedSubCategoryId = null;
        selectedCategoryId = null;
        currentSubCategoryData = null;
        clearEventsWorkspace();
        return;
    }
    
    selectedCategoryId = categoryId;
    
    const res = await api(`/categories/${categoryId}/sub-categories`);
    
    if (!res.success || res.data.length === 0) {
        tabsEl.innerHTML = '<span style="color: #9ca3af; font-size: 13px;">该分类下暂无子分类，请先去分类管理中创建</span>';
        selectedSubCategoryId = null;
        currentSubCategoryData = null;
        clearEventsWorkspace();
        return;
    }
    
    let html = '';
    res.data.forEach((sc, index) => {
        const hasMap = sc.map_id != null;
        const tagClass = hasMap ? 'tag-green' : 'tag-orange';
        const tagText = hasMap ? '✓ 已绑地图' : '⚠ 未绑地图';
        html += `<span class="sub-category-tab" data-id="${sc.id}" onclick="selectEventSubCategory(${sc.id})" style="position:relative;">
            ${escapeHtml(sc.name)}
            <span class="tag ${tagClass}" style="margin-left:6px;font-size:10px;padding:1px 6px;">${tagText}</span>
        </span>`;
    });
    tabsEl.innerHTML = html;
    
    const firstWithMap = res.data.find(sc => sc.map_id != null);
    if (firstWithMap) {
        selectEventSubCategory(firstWithMap.id);
    } else if (res.data.length > 0) {
        tabsEl.innerHTML += '<p style="color:#ef4444;font-size:12px;margin-top:8px;width:100%;">⚠️ 该分类下所有子分类都未绑定地图，请先在分类管理中绑定地图</p>';
        clearEventsWorkspace();
    }
}

function clearEventsWorkspace() {
    document.getElementById('events-workspace').style.display = 'none';
    document.getElementById('events-empty').style.display = 'block';
    if (map) {
        map.remove();
        map = null;
    }
    clearMarkers();
}

function selectEventSubCategory(subCatId) {
    selectedSubCategoryId = subCatId;
    
    document.querySelectorAll('#event-sub-category-tabs .sub-category-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.id) === subCatId);
    });
    
    loadSubCategoryData(subCatId);
}

async function loadSubCategoryData(subCatId) {
    const res = await api(`/categories/sub-categories/${subCatId}`);
    if (!res.success) {
        alert('加载子分类信息失败');
        return;
    }
    
    const sc = res.data;
    currentSubCategoryData = sc;
    
    if (!sc.map_id) {
        clearEventsWorkspace();
        alert('该子分类未绑定地图，请先在分类管理中绑定地图');
        return;
    }
    
    document.getElementById('events-empty').style.display = 'none';
    document.getElementById('events-workspace').style.display = 'block';
    
    document.getElementById('map-info-text').textContent = `🗺️ ${sc.category_name} / ${sc.name} - ${sc.map_name || '未知地图'}`;
    
    setTimeout(() => initMapForEvents(sc), 50);
}

function addTileLayersToMap(mapInstance, tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds, tileSize) {
    if (tileType === 'custom' && tileUrl) {
        const customUrl = tileUrl;
        const tileOptions = {
            noWrap: crsType === 'simple',
            tileSize: tileSize || 256,
            minZoom: minZoom,
            maxZoom: maxZoom,
            minNativeZoom: minZoom,
            maxNativeZoom: maxZoom
        };
        if (tileSd) {
            tileOptions.subdomains = tileSd.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (bounds) {
            tileOptions.bounds = bounds;
        }
        L.tileLayer(customUrl, tileOptions).addTo(mapInstance);
        if (bounds && crsType === 'simple') {
            try {
                mapInstance.fitBounds(bounds, { animate: false, maxZoom: maxZoom });
            } catch(e) {}
        }
        return;
    }

    if (tileType === 'osm') {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            subdomains: ['a','b','c'],
            minZoom: minZoom,
            maxZoom: maxZoom,
            attribution: '&copy; OpenStreetMap'
        }).addTo(mapInstance);
        return;
    }

    if (tileType === 'amap_street') {
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1','2','3','4'],
            minZoom: minZoom,
            maxZoom: maxZoom,
            attribution: '&copy; 高德地图'
        }).addTo(mapInstance);
        return;
    }

    if (tileType === 'amap_satellite') {
        L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
            subdomains: ['1','2','3','4'],
            minZoom: minZoom,
            maxZoom: maxZoom,
            attribution: '&copy; 高德卫星'
        }).addTo(mapInstance);
        L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1','2','3','4'],
            minZoom: Math.max(minZoom, 3),
            maxZoom: maxZoom
        }).addTo(mapInstance);
        return;
    }

    if (tileType === 'hybrid') {
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
            subdomains: ['1','2','3','4'],
            minZoom: minZoom,
            maxZoom: maxZoom,
            attribution: '&copy; 高德地图'
        }).addTo(mapInstance);
        return;
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a','b','c'],
        minZoom: minZoom,
        maxZoom: maxZoom
    }).addTo(mapInstance);
}

function initMapForEvents(subCategory) {
    if (map) {
        map.remove();
        map = null;
    }
    
    const mapEl = document.getElementById('event-map');
    if (!mapEl || mapEl.offsetHeight === 0) {
        setTimeout(() => initMapForEvents(subCategory), 100);
        return;
    }
    
    let center, zoom, minZoom, maxZoom;
    let tileType = 'hybrid';
    let tileUrl = '';
    let tileSd = 'a,b,c';
    let crsType = 'epsg3857';
    let bounds = null;
    let tileSize = 256;

    if (subCategory) {
        if (subCategory.map_tile_size) tileSize = parseInt(subCategory.map_tile_size);
        if (subCategory.map_center_lat != null && subCategory.map_center_lng != null) {
            center = [parseFloat(subCategory.map_center_lat), parseFloat(subCategory.map_center_lng)];
        } else if (subCategory.center_lat != null && subCategory.center_lng != null) {
            center = [parseFloat(subCategory.center_lat), parseFloat(subCategory.center_lng)];
        }
        if (subCategory.map_default_zoom != null) {
            zoom = parseInt(subCategory.map_default_zoom);
        } else if (subCategory.default_zoom != null) {
            zoom = parseInt(subCategory.default_zoom);
        }
        if (subCategory.map_min_zoom != null) minZoom = parseInt(subCategory.map_min_zoom);
        if (subCategory.map_max_zoom != null) maxZoom = parseInt(subCategory.map_max_zoom);
        if (subCategory.map_tile_type) tileType = subCategory.map_tile_type;
        if (subCategory.map_tile_url) tileUrl = subCategory.map_tile_url;
        if (subCategory.map_tile_subdomains) tileSd = subCategory.map_tile_subdomains;
        if (subCategory.map_crs_type) crsType = subCategory.map_crs_type;
        if (subCategory.map_bounds_south != null && subCategory.map_bounds_west != null && 
            subCategory.map_bounds_north != null && subCategory.map_bounds_east != null &&
            subCategory.map_bounds_south !== '') {
            bounds = [
                [parseFloat(subCategory.map_bounds_south), parseFloat(subCategory.map_bounds_west)],
                [parseFloat(subCategory.map_bounds_north), parseFloat(subCategory.map_bounds_east)]
            ];
        }
    }

    if (crsType === 'simple' && bounds) {
        const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
        const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
        center = [centerLat, centerLng];
    } else if (!center) {
        center = [subCategory?.center_lat ?? subCategory?.map_center_lat ?? 30, 
                  subCategory?.center_lng ?? subCategory?.map_center_lng ?? 120];
    }
    if (zoom == null) zoom = subCategory?.default_zoom ?? subCategory?.map_default_zoom ?? 2;
    if (minZoom == null) minZoom = subCategory?.map_min_zoom ?? 0;
    if (maxZoom == null) maxZoom = subCategory?.map_max_zoom ?? 18;

    const crs = crsType === 'simple' ? L.CRS.Simple : L.CRS.EPSG3857;
    
    const mapOptions = {
        crs: crs,
        center: center,
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
        zoomControl: true,
        worldCopyJump: crsType !== 'simple',
        preferCanvas: crsType === 'simple',
        attributionControl: false
    };
    if (crsType === 'simple') {
        mapOptions.zoomSnap = 0.25;
    }
    
    map = L.map('event-map', mapOptions);
    
    addTileLayersToMap(map, tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds, tileSize);

    if (crsType === 'simple' && bounds) {
        try {
            map.setMaxBounds(bounds);
        } catch(e) {}
    }
    
    map.on('click', onEventsMapClick);
    map.on('mousemove', onEventsMapMove);
    
    resetEventForm();
    loadEventsForCurrentSubCategory();
}

function onEventsMapClick(e) {
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    tempMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    tempMarker.on('dragend', function() {
        const pos = tempMarker.getLatLng();
        updateCoordDisplay(pos.lat, pos.lng);
    });
    
    updateCoordDisplay(e.latlng.lat, e.latlng.lng);
    
    const sidePanel = document.querySelector('.events-side-panel');
    if (sidePanel) {
        sidePanel.classList.add('highlight-flash');
        setTimeout(() => sidePanel.classList.remove('highlight-flash'), 1500);
    }
    
    const titleInput = document.getElementById('event-title');
    if (titleInput) {
        titleInput.focus();
    }
}

function updateCoordDisplay(lat, lng) {
    document.getElementById('disp-lat').textContent = Number(lat).toFixed(6);
    document.getElementById('disp-lng').textContent = Number(lng).toFixed(6);
    document.getElementById('coord-hint').style.display = 'none';
    document.getElementById('disp-lat').style.color = '#059669';
    document.getElementById('disp-lng').style.color = '#059669';
}

function onEventsMapMove(e) {
    document.getElementById('map-coords').textContent = 
        `纬度: ${e.latlng.lat.toFixed(4)} | 经度: ${e.latlng.lng.toFixed(4)}`;
}

function resetEventForm() {
    editingEventId = null;
    document.getElementById('event-form-title').textContent = '➕ 添加事件';
    
    document.getElementById('event-title').value = '';
    document.getElementById('event-location-name').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-tips').value = '';
    
    document.getElementById('start-year').value = '';
    document.getElementById('start-month').value = '';
    document.getElementById('start-day').value = '';
    document.getElementById('end-year').value = '';
    document.getElementById('end-month').value = '';
    document.getElementById('end-day').value = '';
    
    startEra = 'ce';
    endEra = 'ce';
    startPrecision = 2;
    endPrecision = 2;
    
    document.querySelectorAll('#start-era .era-btn').forEach(b => b.classList.toggle('active', b.dataset.era === 'ce'));
    document.querySelectorAll('#end-era .era-btn').forEach(b => b.classList.toggle('active', b.dataset.era === 'ce'));
    document.querySelectorAll('#start-precision .precision-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.precision) === 2));
    document.querySelectorAll('#end-precision .precision-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.precision) === 2));
    
    updateDateFieldsVisibility('start');
    updateDateFieldsVisibility('end');
    
    document.getElementById('disp-lat').textContent = '-';
    document.getElementById('disp-lng').textContent = '-';
    document.getElementById('coord-hint').style.display = '';
    document.getElementById('disp-lat').style.color = '#6b7280';
    document.getElementById('disp-lng').style.color = '#6b7280';
    
    if (tempMarker && map) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

function syncEndTime() {
    document.getElementById('end-year').value = document.getElementById('start-year').value;
    document.getElementById('end-month').value = document.getElementById('start-month').value;
    document.getElementById('end-day').value = document.getElementById('start-day').value;
    
    document.querySelectorAll('#end-era .era-btn').forEach(b => b.classList.toggle('active', b.dataset.era === startEra));
    endEra = startEra;
    
    document.querySelectorAll('#end-precision .precision-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.precision) === startPrecision));
    endPrecision = startPrecision;
    
    updateDateFieldsVisibility('end');
}

function dateToTs(year, month, day, era, precision) {
    let y = parseInt(year) || 0;
    if (era === 'bce' && y > 0) y = -y;
    const m = precision >= 1 ? (parseInt(month) || 1) : 1;
    const d = precision >= 2 ? (parseInt(day) || 1) : 1;
    if (y === 0 && !year) return null;
    if (y >= 0) {
        return y * 10000 + m * 100 + d;
    } else {
        return y * 10000 - m * 100 - d;
    }
}

function tsToDateParts(ts) {
    if (ts === null || ts === undefined || ts === '') return { year: '', month: '', day: '', era: 'ce', precision: 2 };
    const sign = ts < 0 ? -1 : 1;
    const absTs = Math.abs(ts);
    const day = absTs % 100;
    const rest = Math.floor(absTs / 100);
    const month = rest % 100;
    const year = Math.floor(rest / 100) * sign;
    return {
        year: Math.abs(year).toString(),
        month: month ? month.toString() : '',
        day: day ? day.toString() : '',
        era: year < 0 ? 'bce' : 'ce',
        precision: day ? 2 : (month ? 1 : 0)
    };
}

function saveEventForm() {
    const title = document.getElementById('event-title').value.trim();
    const latStr = document.getElementById('disp-lat').textContent;
    const lngStr = document.getElementById('disp-lng').textContent;
    
    if (!selectedSubCategoryId) {
        alert('请先选择子分类');
        return;
    }
    if (!title) {
        alert('请输入事件标题');
        return;
    }
    if (latStr === '-' || lngStr === '-') {
        alert('请先在地图上点击选择位置');
        return;
    }
    
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
        alert('坐标无效，请重新在地图上点击选择');
        return;
    }
    
    const startTs = dateToTs(
        document.getElementById('start-year').value,
        document.getElementById('start-month').value,
        document.getElementById('start-day').value,
        startEra,
        startPrecision
    );
    
    const endYear = document.getElementById('end-year').value;
    let endTs = null;
    if (endYear) {
        endTs = dateToTs(endYear,
            document.getElementById('end-month').value,
            document.getElementById('end-day').value,
            endEra,
            endPrecision
        );
    }
    if (endTs === null && startTs !== null) {
        endTs = startTs;
        endPrecision = startPrecision;
    }
    
    const data = {
        category_id: selectedCategoryId,
        sub_category_id: selectedSubCategoryId,
        title: title,
        start_ts: startTs,
        start_precision: startPrecision,
        end_ts: endTs,
        end_precision: endPrecision,
        description: document.getElementById('event-description').value.trim() || null,
        tips: document.getElementById('event-tips').value.trim() || null,
        location_lat: lat,
        location_lng: lng,
        location_name: document.getElementById('event-location-name').value.trim() || null
    };
    
    saveEvent(data);
}

async function saveEvent(data) {
    let res;
    if (editingEventId) {
        res = await api(`/events/${editingEventId}`, {
            method: 'PUT',
            body: data
        });
    } else {
        res = await api('/events', {
            method: 'POST',
            body: data
        });
    }
    
    if (res.success) {
        resetEventForm();
        loadEventsForCurrentSubCategory();
        loadStats();
    } else {
        alert('保存失败: ' + res.message);
    }
}

async function loadEventsForCurrentSubCategory() {
    if (!selectedCategoryId || !selectedSubCategoryId) return;
    
    const res = await api(`/events?category_id=${selectedCategoryId}&sub_category_id=${selectedSubCategoryId}&page_size=100`);
    const listEl = document.getElementById('event-list');
    const countEl = document.getElementById('event-count');
    
    if (!res.success || res.data.length === 0) {
        countEl.textContent = '0';
        listEl.innerHTML = '<div class="empty-state" style="padding: 30px 20px;"><div class="icon" style="font-size: 36px;">📍</div><p style="font-size: 13px; margin-top: 8px;">点击地图添加事件</p></div>';
        clearMarkers();
        return;
    }
    
    countEl.textContent = res.data.length;
    
    let html = '';
    res.data.forEach(e => {
        html += `<div class="event-item" onclick="editEvent(${e.id})">
            <div class="title">${escapeHtml(e.title)}</div>
            <div class="meta">${escapeHtml(e.start_display || '未设置时间')}${e.location_name ? ' · ' + escapeHtml(e.location_name) : ''}</div>
        </div>`;
    });
    listEl.innerHTML = html;
    
    showEventMarkers(res.data);
}

function clearMarkers() {
    markers.forEach(m => map && map.removeLayer(m));
    markers = [];
}

function showEventMarkers(events) {
    clearMarkers();
    if (!map) return;
    
    events.forEach(e => {
        if (e.location_lat !== null && e.location_lng !== null) {
            const marker = L.marker([e.location_lat, e.location_lng]).addTo(map);
            let popupHtml = `<b>${escapeHtml(e.title)}</b>`;
            if (e.start_display) popupHtml += `<br>时间: ${escapeHtml(e.start_display)}`;
            if (e.location_name) popupHtml += `<br>地点: ${escapeHtml(e.location_name)}`;
            if (e.description) popupHtml += `<br><br>${escapeHtml(e.description).substring(0, 100)}`;
            popupHtml += `<br><br><button onclick="editEvent(${e.id})" style="padding: 4px 8px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; cursor: pointer;">编辑</button>`;
            popupHtml += ` <button onclick="deleteEvent(${e.id})" style="padding: 4px 8px; background: #ef4444; color: #fff; border: none; border-radius: 4px; cursor: pointer;">删除</button>`;
            
            marker.bindPopup(popupHtml);
            markers.push(marker);
        }
    });
}

async function editEvent(eventId) {
    const res = await api(`/events/${eventId}`);
    if (!res.success) {
        alert('获取事件失败');
        return;
    }
    
    const e = res.data;
    editingEventId = e.id;
    document.getElementById('event-form-title').textContent = '✏️ 编辑事件';
    
    if (map) {
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([e.location_lat, e.location_lng], { draggable: true }).addTo(map);
        tempMarker.on('dragend', function() {
            const pos = tempMarker.getLatLng();
            updateCoordDisplay(pos.lat, pos.lng);
        });
        map.panTo([e.location_lat, e.location_lng]);
    }
    
    document.getElementById('event-title').value = e.title || '';
    document.getElementById('event-location-name').value = e.location_name || '';
    document.getElementById('event-description').value = e.description || '';
    document.getElementById('event-tips').value = e.tips || '';
    
    updateCoordDisplay(e.location_lat, e.location_lng);
    
    const startParts = tsToDateParts(e.start_ts);
    document.getElementById('start-year').value = startParts.year;
    document.getElementById('start-month').value = startParts.month;
    document.getElementById('start-day').value = startParts.day;
    startEra = startParts.era;
    startPrecision = e.start_precision != null ? e.start_precision : startParts.precision;
    document.querySelectorAll('#start-era .era-btn').forEach(b => b.classList.toggle('active', b.dataset.era === startEra));
    document.querySelectorAll('#start-precision .precision-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.precision) === startPrecision));
    updateDateFieldsVisibility('start');
    
    const endParts = tsToDateParts(e.end_ts);
    document.getElementById('end-year').value = endParts.year;
    document.getElementById('end-month').value = endParts.month;
    document.getElementById('end-day').value = endParts.day;
    endEra = endParts.era;
    endPrecision = e.end_precision != null ? e.end_precision : endParts.precision;
    document.querySelectorAll('#end-era .era-btn').forEach(b => b.classList.toggle('active', b.dataset.era === endEra));
    document.querySelectorAll('#end-precision .precision-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.precision) === endPrecision));
    updateDateFieldsVisibility('end');
}

async function deleteEvent(eventId) {
    if (!confirm('确定要删除这个事件吗？')) return;
    
    const res = await api(`/events/${eventId}`, { method: 'DELETE' });
    if (res.success) {
        loadEventsForCurrentSubCategory();
        loadStats();
    } else {
        alert('删除失败: ' + res.message);
    }
}

function loadCategoryList() {
    loadCategories();
    loadSubCategoryList();
}

async function loadCategoryList() {
    const res = await api('/categories');
    const tbody = document.getElementById('category-list');
    
    if (!res.success || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af;">暂无分类</td></tr>';
        return;
    }
    
    let html = '';
    res.data.forEach(c => {
        html += `<tr>
            <td><code>${escapeHtml(c.code)}</code></td>
            <td>${escapeHtml(c.name)}</td>
            <td>${c.total_sub_count || 0}</td>
            <td>${c.total_event_count || 0}</td>
            <td>${c.sort_order || 0}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editCategory(${c.id})">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategory(${c.id})">删除</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function openCategoryModal(id = null) {
    document.getElementById('category-id').value = id || '';
    document.getElementById('category-modal-title').textContent = id ? '编辑分类' : '添加分类';
    
    if (id) {
        api(`/categories/${id}`).then(res => {
            if (res.success) {
                document.getElementById('category-code').value = res.data.code;
                document.getElementById('category-code').readOnly = true;
                document.getElementById('category-name').value = res.data.name;
                document.getElementById('category-sort').value = res.data.sort_order || 0;
            }
        });
    } else {
        document.getElementById('category-code').value = '';
        document.getElementById('category-code').readOnly = false;
        document.getElementById('category-name').value = '';
        document.getElementById('category-sort').value = 0;
    }
    
    openModal('category-modal');
}

function editCategory(id) {
    openCategoryModal(id);
}

async function saveCategory() {
    const id = document.getElementById('category-id').value;
    const data = {
        code: document.getElementById('category-code').value.trim(),
        name: document.getElementById('category-name').value.trim(),
        sort_order: parseInt(document.getElementById('category-sort').value) || 0
    };
    
    if (!data.code || !data.name) {
        alert('请填写编码和名称');
        return;
    }
    
    let res;
    if (id) {
        res = await api(`/categories/${id}`, {
            method: 'PUT',
            body: { name: data.name, sort_order: data.sort_order }
        });
    } else {
        res = await api('/categories', {
            method: 'POST',
            body: data
        });
    }
    
    if (res.success) {
        closeModal('category-modal');
        loadCategoryList();
        loadCategorySelect();
        loadStats();
    } else {
        alert('保存失败: ' + res.message);
    }
}

async function deleteCategory(id) {
    if (!confirm('确定要删除这个分类吗？')) return;
    
    const res = await api(`/categories/${id}`, { method: 'DELETE' });
    if (res.success) {
        loadCategoryList();
        loadCategorySelect();
        loadStats();
    } else {
        alert('删除失败: ' + res.message);
    }
}

async function loadSubCategoryList() {
    const categoryId = document.getElementById('sub-category-filter').value;
    const container = document.getElementById('sub-category-container');
    
    if (!categoryId) {
        container.innerHTML = '<div class="empty-state"><div class="icon">📁</div><p>请先选择一个分类</p></div>';
        return;
    }
    
    const res = await api(`/categories/${categoryId}/sub-categories`);
    
    if (!res.success || res.data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📂</div>
                <p>该分类下暂无子分类</p>
                <button class="btn btn-primary btn-sm" style="margin-top: 12px;" onclick="openSubCategoryModal(null, ${categoryId})">+ 添加子分类</button>
            </div>
        `;
        return;
    }
    
    let html = `<div style="margin-bottom: 12px;"><button class="btn btn-primary btn-sm" onclick="openSubCategoryModal(null, ${categoryId})">+ 添加子分类</button></div>`;
    html += '<table><thead><tr><th>编码</th><th>名称</th><th>绑定地图</th><th>事件数</th><th>排序</th><th>操作</th></tr></thead><tbody>';
    
    res.data.forEach(sc => {
        html += `<tr>
            <td><code>${escapeHtml(sc.code)}</code></td>
            <td>${escapeHtml(sc.name)}</td>
            <td>${sc.map_name ? escapeHtml(sc.map_name) : '<span style="color: #ef4444;">未绑定（无法出题）</span>'}</td>
            <td>${sc.event_count || 0}</td>
            <td>${sc.sort_order || 0}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editSubCategory(${sc.id})">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSubCategory(${sc.id})">删除</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function openSubCategoryModal(id = null, categoryId = null) {
    document.getElementById('sub-category-id').value = id || '';
    document.getElementById('sub-category-modal-title').textContent = id ? '编辑子分类' : '添加子分类';
    
    loadMapSelect();
    
    if (id) {
        api(`/categories/sub-categories/${id}`).then(res => {
            if (res.success) {
                const sc = res.data;
                document.getElementById('sub-category-parent').value = sc.category_id;
                document.getElementById('sub-category-code').value = sc.code;
                document.getElementById('sub-category-code').readOnly = true;
                document.getElementById('sub-category-name').value = sc.name;
                document.getElementById('sub-category-map').value = sc.map_id || '';
                document.getElementById('sub-center-lat').value = sc.center_lat || '';
                document.getElementById('sub-center-lng').value = sc.center_lng || '';
                document.getElementById('sub-default-zoom').value = sc.default_zoom || 2;
                document.getElementById('sub-min-zoom').value = sc.min_zoom || 2;
                document.getElementById('sub-max-zoom').value = sc.max_zoom || 8;
                document.getElementById('sub-category-sort').value = sc.sort_order || 0;
            }
        });
    } else {
        if (categoryId) {
            document.getElementById('sub-category-parent').value = categoryId;
        }
        document.getElementById('sub-category-code').value = '';
        document.getElementById('sub-category-code').readOnly = false;
        document.getElementById('sub-category-name').value = '';
        document.getElementById('sub-category-map').value = '';
        document.getElementById('sub-center-lat').value = '';
        document.getElementById('sub-center-lng').value = '';
        document.getElementById('sub-default-zoom').value = 2;
        document.getElementById('sub-min-zoom').value = 2;
        document.getElementById('sub-max-zoom').value = 8;
        document.getElementById('sub-category-sort').value = 0;
    }
    
    openModal('sub-category-modal');
}

function editSubCategory(id) {
    openSubCategoryModal(id);
}

async function loadMapSelect() {
    const res = await api('/maps');
    const select = document.getElementById('sub-category-map');
    
    if (!res.success) return;
    
    let options = '<option value="">不绑定（无法出题）</option>';
    res.data.forEach(m => {
        options += `<option value="${m.id}">${escapeHtml(m.name)}</option>`;
    });
    select.innerHTML = options;
}

async function saveSubCategory() {
    const id = document.getElementById('sub-category-id').value;
    const categoryId = document.getElementById('sub-category-parent').value;
    
    const data = {
        code: document.getElementById('sub-category-code').value.trim(),
        name: document.getElementById('sub-category-name').value.trim(),
        sort_order: parseInt(document.getElementById('sub-category-sort').value) || 0,
        map_id: document.getElementById('sub-category-map').value || null,
        center_lat: parseFloat(document.getElementById('sub-center-lat').value) || null,
        center_lng: parseFloat(document.getElementById('sub-center-lng').value) || null,
        default_zoom: parseInt(document.getElementById('sub-default-zoom').value) || 2,
        min_zoom: parseInt(document.getElementById('sub-min-zoom').value) || 2,
        max_zoom: parseInt(document.getElementById('sub-max-zoom').value) || 8
    };
    
    if (!categoryId || !data.code || !data.name) {
        alert('请填写分类、编码和名称');
        return;
    }
    if (!data.map_id) {
        if (!confirm('子分类未绑定地图，将无法进行出题。确定保存吗？')) return;
    }
    
    let res;
    if (id) {
        res = await api(`/categories/sub-categories/${id}`, {
            method: 'PUT',
            body: data
        });
    } else {
        res = await api(`/categories/${categoryId}/sub-categories`, {
            method: 'POST',
            body: data
        });
    }
    
    if (res.success) {
        closeModal('sub-category-modal');
        loadSubCategoryList();
        loadStats();
    } else {
        alert('保存失败: ' + res.message);
    }
}

async function deleteSubCategory(id) {
    if (!confirm('确定要删除这个子分类吗？')) return;
    
    const res = await api(`/categories/sub-categories/${id}`, { method: 'DELETE' });
    if (res.success) {
        loadSubCategoryList();
        loadStats();
    } else {
        alert('删除失败: ' + res.message);
    }
}

function loadMaps() {
    loadMapList();
}

async function loadMapList() {
    const res = await api('/maps');
    const tbody = document.getElementById('map-list');
    
    if (!res.success || res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #9ca3af;">暂无地图</td></tr>';
        return;
    }
    
    let html = '';
    res.data.forEach(m => {
        const typeText = {
            'osm': 'OSM标准',
            'amap_street': '高德街道',
            'amap_satellite': '高德卫星',
            'custom': '自定义瓦片',
            'hybrid': '混合图层'
        }[m.tile_type] || m.tile_type;
        
        html += `<tr>
            <td><code>${escapeHtml(m.code)}</code></td>
            <td>${escapeHtml(m.name)}</td>
            <td><span class="tag">${typeText}</span></td>
            <td>${m.crs_type || 'epsg3857'}</td>
            <td>${m.min_zoom} - ${m.max_zoom}</td>
            <td>${m.bind_count || 0}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editMap(${m.id})">编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteMap(${m.id})">删除</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function openMapModal(id = null) {
    document.getElementById('map-id').value = id || '';
    document.getElementById('map-modal-title').textContent = id ? '编辑地图' : '添加地图';
    
    if (id) {
        api(`/maps/${id}`).then(res => {
            if (res.success) {
                const m = res.data;
                document.getElementById('map-code').value = m.code;
                document.getElementById('map-code').readOnly = true;
                document.getElementById('map-name').value = m.name;
                document.getElementById('map-description').value = m.description || '';
                document.getElementById('map-tile-type').value = m.tile_type || 'custom';
                document.getElementById('map-crs-type').value = m.crs_type || 'epsg3857';
                document.getElementById('map-tile-url').value = m.tile_url || '';
                document.getElementById('map-tile-subdomains').value = m.tile_subdomains || '';
                document.getElementById('map-min-zoom').value = m.min_zoom || 0;
                document.getElementById('map-max-zoom').value = m.max_zoom || 18;
                document.getElementById('map-default-zoom').value = m.default_zoom || 2;
                document.getElementById('map-center-lat').value = m.center_lat || '';
                document.getElementById('map-center-lng').value = m.center_lng || '';
                document.getElementById('map-bounds-south').value = m.bounds_south || '';
                document.getElementById('map-bounds-west').value = m.bounds_west || '';
                document.getElementById('map-bounds-north').value = m.bounds_north || '';
                document.getElementById('map-bounds-east').value = m.bounds_east || '';
                document.getElementById('map-tile-ext').value = m.tile_ext || 'png';
                document.getElementById('map-tile-size').value = m.tile_size || 256;
                document.getElementById('map-sort-order').value = m.sort_order || 0;
                onTileTypeChange();
            }
        });
    } else {
        document.getElementById('map-code').value = '';
        document.getElementById('map-code').readOnly = false;
        document.getElementById('map-name').value = '';
        document.getElementById('map-description').value = '';
        document.getElementById('map-tile-type').value = 'osm';
        document.getElementById('map-crs-type').value = 'epsg3857';
        document.getElementById('map-tile-url').value = '';
        document.getElementById('map-tile-subdomains').value = '';
        document.getElementById('map-min-zoom').value = 2;
        document.getElementById('map-max-zoom').value = 18;
        document.getElementById('map-default-zoom').value = 2;
        document.getElementById('map-center-lat').value = 30;
        document.getElementById('map-center-lng').value = 120;
        document.getElementById('map-bounds-south').value = '';
        document.getElementById('map-bounds-west').value = '';
        document.getElementById('map-bounds-north').value = '';
        document.getElementById('map-bounds-east').value = '';
        document.getElementById('map-tile-ext').value = 'png';
        document.getElementById('map-tile-size').value = 256;
        document.getElementById('map-sort-order').value = 0;
        onTileTypeChange();
    }
    
    openModal('map-modal');
}

function onTileTypeChange() {
    const type = document.getElementById('map-tile-type').value;
    const urlGroup = document.getElementById('tile-url-group');
    const sdGroup = document.getElementById('tile-sd-group');
    
    if (type === 'osm' || type === 'amap_street' || type === 'amap_satellite') {
        urlGroup.style.display = 'none';
        if (sdGroup) sdGroup.style.display = 'none';
    } else {
        urlGroup.style.display = 'block';
        if (sdGroup) sdGroup.style.display = 'block';
    }
}

function editMap(id) {
    openMapModal(id);
}

async function saveMap() {
    const id = document.getElementById('map-id').value;
    
    const data = {
        code: document.getElementById('map-code').value.trim(),
        name: document.getElementById('map-name').value.trim(),
        description: document.getElementById('map-description').value.trim() || null,
        tile_type: document.getElementById('map-tile-type').value,
        crs_type: document.getElementById('map-crs-type').value,
        tile_url: document.getElementById('map-tile-url').value.trim() || null,
        tile_subdomains: document.getElementById('map-tile-subdomains').value.trim() || null,
        min_zoom: parseInt(document.getElementById('map-min-zoom').value) || 0,
        max_zoom: parseInt(document.getElementById('map-max-zoom').value) || 18,
        default_zoom: parseInt(document.getElementById('map-default-zoom').value) || 2,
        center_lat: parseFloat(document.getElementById('map-center-lat').value) || null,
        center_lng: parseFloat(document.getElementById('map-center-lng').value) || null,
        bounds_south: parseFloat(document.getElementById('map-bounds-south').value) || null,
        bounds_west: parseFloat(document.getElementById('map-bounds-west').value) || null,
        bounds_north: parseFloat(document.getElementById('map-bounds-north').value) || null,
        bounds_east: parseFloat(document.getElementById('map-bounds-east').value) || null,
        tile_ext: document.getElementById('map-tile-ext').value,
        tile_size: parseInt(document.getElementById('map-tile-size').value) || 256,
        sort_order: parseInt(document.getElementById('map-sort-order').value) || 0
    };

    if (data.tile_type === 'amap_street') {
        data.tile_url = 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}';
        data.tile_subdomains = '1,2,3,4';
    } else if (data.tile_type === 'amap_satellite') {
        data.tile_url = 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}';
        data.tile_subdomains = '1,2,3,4';
    } else if (data.tile_type === 'osm') {
        data.tile_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        data.tile_subdomains = 'a,b,c';
    }
    
    if (!data.code || !data.name) {
        alert('请填写编码和名称');
        return;
    }
    
    let res;
    if (id) {
        res = await api(`/maps/${id}`, {
            method: 'PUT',
            body: data
        });
    } else {
        res = await api('/maps', {
            method: 'POST',
            body: data
        });
    }
    
    if (res.success) {
        closeModal('map-modal');
        loadMapList();
        loadStats();
    } else {
        alert('保存失败: ' + res.message);
    }
}

async function deleteMap(id) {
    if (!confirm('确定要删除这个地图吗？')) return;
    
    const res = await api(`/maps/${id}`, { method: 'DELETE' });
    if (res.success) {
        loadMapList();
        loadStats();
    } else {
        alert('删除失败: ' + res.message);
    }
}

let allExportEvents = [];
let selectedExportEventIds = new Set();
let exportCategories = [];
let exportSubCategories = [];

async function loadExportEventList() {
    const res = await api('/export/events/list');
    if (!res.success) {
        document.getElementById('export-event-selector').innerHTML = '<div style="padding: 40px; text-align: center; color: #ef4444;">加载失败</div>';
        return;
    }
    
    allExportEvents = res.data.events || [];
    exportCategories = res.data.categories || [];
    exportSubCategories = res.data.sub_categories || [];
    
    const catSel = document.getElementById('export-filter-category');
    const subCatSel = document.getElementById('export-filter-subcategory');
    
    catSel.innerHTML = '<option value="">全部</option>';
    exportCategories.forEach(c => {
        catSel.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
    
    updateExportSubCategoryFilter();
    catSel.onchange = () => {
        updateExportSubCategoryFilter();
        renderExportEventList();
    };
    
    renderExportEventList();
}

function updateExportSubCategoryFilter() {
    const catId = document.getElementById('export-filter-category').value;
    const subCatSel = document.getElementById('export-filter-subcategory');
    
    let filtered = exportSubCategories;
    if (catId) {
        filtered = exportSubCategories.filter(sc => sc.category_id == catId);
    }
    
    subCatSel.innerHTML = '<option value="">全部</option>';
    filtered.forEach(sc => {
        subCatSel.innerHTML += `<option value="${sc.id}">${escapeHtml(sc.name)}</option>`;
    });
}

function formatTs(ts) {
    if (!ts) return '';
    const s = String(ts).padStart(8, '0');
    if (s.length === 8) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    }
    return s;
}

function renderExportEventList() {
    const catId = document.getElementById('export-filter-category').value;
    const subCatId = document.getElementById('export-filter-subcategory').value;
    
    let events = allExportEvents;
    if (catId) {
        events = events.filter(e => e.category_id == catId);
    }
    if (subCatId) {
        events = events.filter(e => e.sub_category_id == subCatId);
    }
    
    const container = document.getElementById('export-event-selector');
    
    if (events.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: #9ca3af;">暂无事件</div>';
        updateExportSelectedCount();
        return;
    }
    
    const grouped = {};
    events.forEach(e => {
        const key = `${e.category_id}-${e.sub_category_id}`;
        if (!grouped[key]) {
            grouped[key] = {
                category_name: e.category_name,
                sub_category_name: e.sub_category_name,
                map_name: e.map_name,
                events: []
            };
        }
        grouped[key].events.push(e);
    });
    
    let html = '';
    for (const key of Object.keys(grouped)) {
        const g = grouped[key];
        html += `<div class="export-event-group">`;
        html += `<div class="export-group-header">${escapeHtml(g.category_name)} <span class="sub">/ ${escapeHtml(g.sub_category_name)}${g.map_name ? ' · 🗺️ ' + escapeHtml(g.map_name) : ''}</span></div>`;
        for (const e of g.events) {
            const checked = selectedExportEventIds.has(e.id) ? 'checked' : '';
            const cls = selectedExportEventIds.has(e.id) ? 'export-event-item checked' : 'export-event-item';
            html += `<div class="${cls}" data-id="${e.id}" onclick="toggleExportEvent(${e.id})">
                <input type="checkbox" class="checkbox" ${checked} onclick="event.stopPropagation(); toggleExportEvent(${e.id})">
                <div class="title">${escapeHtml(e.title)}</div>
                <div class="meta">${formatTs(e.start_ts)}${e.location_name ? ' · 📍 ' + escapeHtml(e.location_name) : ''}${e.end_ts ? ' ~ ' + formatTs(e.end_ts) : ''}</div>
            </div>`;
        }
        html += `</div>`;
    }
    
    container.innerHTML = html;
    updateExportSelectedCount();
}

function toggleExportEvent(id) {
    if (selectedExportEventIds.has(id)) {
        selectedExportEventIds.delete(id);
    } else {
        selectedExportEventIds.add(id);
    }
    const el = document.querySelector(`.export-event-item[data-id="${id}"]`);
    if (el) {
        el.classList.toggle('checked', selectedExportEventIds.has(id));
        const cb = el.querySelector('.checkbox');
        if (cb) cb.checked = selectedExportEventIds.has(id);
    }
    updateExportSelectedCount();
}

function toggleSelectAllExportEvents() {
    const catId = document.getElementById('export-filter-category').value;
    const subCatId = document.getElementById('export-filter-subcategory').value;
    
    let events = allExportEvents;
    if (catId) events = events.filter(e => e.category_id == catId);
    if (subCatId) events = events.filter(e => e.sub_category_id == subCatId);
    
    const allSelected = events.every(e => selectedExportEventIds.has(e.id));
    
    if (allSelected) {
        events.forEach(e => selectedExportEventIds.delete(e.id));
    } else {
        events.forEach(e => selectedExportEventIds.add(e.id));
    }
    
    renderExportEventList();
}

function updateExportSelectedCount() {
    document.getElementById('export-selected-count').textContent = selectedExportEventIds.size;
}

async function exportSelectedEvents() {
    if (selectedExportEventIds.size === 0) {
        alert('请先选择要导出的事件');
        return;
    }
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '打包中...';
    
    try {
        const res = await fetch('/api/export/zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_ids: Array.from(selectedExportEventIds) })
        });
        
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || '导出失败');
        }
        
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition') || '';
        let filename = `adddata_export_${Date.now()}.zip`;
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`导出成功！已选择 ${selectedExportEventIds.size} 个事件`);
    } catch (err) {
        alert('导出失败: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function exportData() {
    exportSelectedEvents();
}

function downloadTemplate() {
    window.location.href = '/api/export/import-template';
}

async function importData() {
    const fileInput = document.getElementById('import-file');
    const resultEl = document.getElementById('import-result');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('请选择要导入的 JSON 文件');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            const res = await api('/export/import', {
                method: 'POST',
                body: data
            });
            
            if (res.success) {
                const r = res.results;
                resultEl.innerHTML = `
                    <div class="alert alert-success">
                        <b>导入成功！</b><br>
                        地图: 成功 ${r.maps.success} 个，失败 ${r.maps.failed} 个<br>
                        分类: 成功 ${r.categories.success} 个，失败 ${r.categories.failed} 个<br>
                        子分类: 成功 ${r.sub_categories.success} 个，失败 ${r.sub_categories.failed} 个<br>
                        事件: 成功 ${r.events.success} 个，失败 ${r.events.failed} 个
                    </div>
                `;
                loadStats();
                loadMapList();
                loadCategoryList();
            } else {
                resultEl.innerHTML = `<div class="alert alert-error">导入失败: ${escapeHtml(res.message)}</div>`;
            }
        } catch (err) {
            resultEl.innerHTML = `<div class="alert alert-error">文件解析失败: ${escapeHtml(err.message)}</div>`;
        }
    };
    
    reader.readAsText(file);
}

async function loadExportStats() {
    const res = await api('/export/all');
    const statsEl = document.getElementById('export-stats');
    
    if (!res.success) {
        statsEl.innerHTML = '<p>加载失败</p>';
        return;
    }
    
    const d = res.data;
    statsEl.innerHTML = `
        <div class="stat-cards" style="margin-bottom: 0;">
            <div class="stat-card blue">
                <div class="label">地图数量</div>
                <div class="value">${d.maps.length}</div>
            </div>
            <div class="stat-card green">
                <div class="label">分类数量</div>
                <div class="value">${d.categories.length}</div>
            </div>
            <div class="stat-card orange">
                <div class="label">子分类数量</div>
                <div class="value">${d.sub_categories.length}</div>
            </div>
            <div class="stat-card purple">
                <div class="label">事件总数</div>
                <div class="value">${d.events.length}</div>
            </div>
        </div>
    `;
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});
