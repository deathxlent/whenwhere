let currentPage = 'dashboard';
let map = null;
let markers = [];
let selectedSubCategoryId = null;
let selectedCategoryId = null;
let editingEventId = null;
let tempMarker = null;
let currentMapData = null;

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
        setTimeout(() => {
            if (selectedSubCategoryId) {
                loadSubCategoryMap(selectedSubCategoryId);
            } else {
                showMapPlaceholder('请先选择分类和子分类，绑定地图后即可在此处出题');
            }
        }, 100);
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
    
    let options = '<option value="">请选择分类</option>';
    res.data.forEach(c => {
        options += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
    
    select.innerHTML = options;
    filterSelect.innerHTML = '<option value="">选择分类查看子分类</option>' + options.replace('请选择分类', '');
    parentSelect.innerHTML = options;
}

async function loadSubCategories() {
    const categoryId = document.getElementById('event-category-select').value;
    const tabsEl = document.getElementById('sub-category-tabs');
    
    if (!categoryId) {
        tabsEl.innerHTML = '<span style="color: #9ca3af; font-size: 13px;">请先选择分类</span>';
        selectedSubCategoryId = null;
        clearMarkers();
        showMapPlaceholder('请先选择分类和子分类，绑定地图后即可在此处出题');
        return;
    }
    
    selectedCategoryId = categoryId;
    
    const res = await api(`/categories/${categoryId}/sub-categories`);
    
    if (!res.success || res.data.length === 0) {
        tabsEl.innerHTML = '<span style="color: #9ca3af; font-size: 13px;">该分类下暂无子分类</span>';
        selectedSubCategoryId = null;
        clearMarkers();
        showMapPlaceholder('该分类下暂无子分类，请先在「分类管理」中添加子分类并绑定地图');
        return;
    }
    
    let html = '';
    res.data.forEach((sc, index) => {
        const active = index === 0 ? 'active' : '';
        html += `<span class="sub-category-tab ${active}" data-id="${sc.id}" onclick="selectSubCategory(${sc.id})">${escapeHtml(sc.name)}</span>`;
    });
    tabsEl.innerHTML = html;
    
    if (res.data.length > 0) {
        selectSubCategory(res.data[0].id);
    }
}

function selectSubCategory(subCatId) {
    selectedSubCategoryId = subCatId;
    
    document.querySelectorAll('.sub-category-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.id) === subCatId);
    });
    
    loadEventsForSubCategory(subCatId);
    loadSubCategoryMap(subCatId);
}

async function loadSubCategoryMap(subCatId) {
    const res = await api(`/categories/sub-categories/${subCatId}`);
    
    if (!res.success || !res.data.map_id) {
        showMapPlaceholder('该子分类未绑定地图，请在「分类管理」中为子分类绑定地图后再出题');
        return;
    }
    
    const sc = res.data;
    const mapId = sc.map_id;
    
    const mapRes = await api(`/maps/${mapId}`);
    if (!mapRes.success) return;
    
    currentMapData = mapRes.data;
    initEventMap(mapRes.data, sc);
}

function showMapPlaceholder(msg) {
    if (map) {
        map.remove();
        map = null;
    }
    clearMarkers();
    const mapEl = document.getElementById('event-map');
    const placeholderEl = document.getElementById('map-placeholder');
    const listPanel = document.getElementById('event-list-panel');
    const formPanel = document.getElementById('event-form-panel');
    if (mapEl) mapEl.style.display = 'none';
    if (listPanel) listPanel.style.display = 'none';
    if (formPanel) formPanel.style.display = 'none';
    if (placeholderEl) {
        placeholderEl.style.display = 'flex';
        const textEl = placeholderEl.querySelector('.placeholder-text');
        if (textEl) textEl.textContent = msg || '请选择分类和子分类';
    }
}

function hideMapPlaceholder() {
    const mapEl = document.getElementById('event-map');
    const placeholderEl = document.getElementById('map-placeholder');
    const listPanel = document.getElementById('event-list-panel');
    if (mapEl) mapEl.style.display = '';
    if (placeholderEl) placeholderEl.style.display = 'none';
    if (listPanel) listPanel.style.display = '';
}

function initEventMap(mapData, subCategory) {
    if (!mapData) return;
    
    if (map) {
        map.remove();
        map = null;
    }
    
    hideMapPlaceholder();
    
    const mapEl = document.getElementById('event-map');
    if (!mapEl || mapEl.offsetHeight === 0) {
        setTimeout(() => initEventMap(mapData, subCategory), 100);
        return;
    }
    
    const crs = mapData.crs_type === 'simple' ? L.CRS.Simple : L.CRS.EPSG3857;
    
    const mapOptions = {
        crs: crs,
        minZoom: mapData.min_zoom || 0,
        maxZoom: mapData.max_zoom || 18,
        zoomSnap: 0.25,
        attributionControl: false
    };
    
    map = L.map('event-map', mapOptions);
    
    let tileUrl = mapData.tile_url;
    if (mapData.tile_type === 'osm') {
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    
    const tileOptions = {
        noWrap: mapData.crs_type === 'simple',
        tileSize: mapData.tile_size || 256
    };
    
    if (mapData.tile_subdomains) {
        tileOptions.subdomains = mapData.tile_subdomains.split(',');
    }
    
    if (mapData.bounds_south !== null && mapData.bounds_south !== undefined) {
        tileOptions.bounds = [
            [mapData.bounds_south, mapData.bounds_west],
            [mapData.bounds_north, mapData.bounds_east]
        ];
    }
    
    L.tileLayer(tileUrl, tileOptions).addTo(map);
    
    let centerLat = subCategory?.center_lat ?? mapData.center_lat ?? 30;
    let centerLng = subCategory?.center_lng ?? mapData.center_lng ?? 120;
    let defaultZoom = subCategory?.default_zoom ?? mapData.default_zoom ?? 2;
    
    if (mapData.bounds_south !== null && mapData.bounds_south !== undefined) {
        const bounds = [
            [mapData.bounds_south, mapData.bounds_west],
            [mapData.bounds_north, mapData.bounds_east]
        ];
        map.fitBounds(bounds, { animate: false });
    } else {
        map.setView([centerLat, centerLng], defaultZoom);
    }
    
    map.on('click', onMapClick);
    map.on('mousemove', onMapMove);
    
    loadEventsForSubCategory(selectedSubCategoryId);
}

function onMapClick(e) {
    if (!selectedSubCategoryId) {
        alert('请先选择子分类');
        return;
    }
    
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }
    
    tempMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
    tempMarker.on('dragend', function() {
        const pos = tempMarker.getLatLng();
        document.getElementById('event-lat').value = pos.lat.toFixed(6);
        document.getElementById('event-lng').value = pos.lng.toFixed(6);
    });
    
    document.getElementById('event-lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('event-lng').value = e.lng.toFixed(6);
    
    editingEventId = null;
    document.getElementById('event-form-title').textContent = '添加事件';
    document.getElementById('event-title').value = '';
    document.getElementById('event-start-ts').value = '';
    document.getElementById('event-start-precision').value = '0';
    document.getElementById('event-end-ts').value = '';
    document.getElementById('event-end-precision').value = '0';
    document.getElementById('event-description').value = '';
    document.getElementById('event-tips').value = '';
    document.getElementById('event-location-name').value = '';
    
    document.getElementById('event-form-panel').style.display = 'flex';
    document.getElementById('event-title').focus();
}

function onMapMove(e) {
    document.getElementById('coord-display').textContent = 
        `纬度: ${e.latlng.lat.toFixed(4)} | 经度: ${e.latlng.lng.toFixed(4)} | 点击地图添加事件`;
}

function closeEventForm() {
    document.getElementById('event-form-panel').style.display = 'none';
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

async function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    const lat = parseFloat(document.getElementById('event-lat').value);
    const lng = parseFloat(document.getElementById('event-lng').value);
    
    if (!selectedSubCategoryId) {
        alert('请先选择子分类');
        return;
    }
    if (!title) {
        alert('请输入事件标题');
        return;
    }
    if (isNaN(lat) || isNaN(lng)) {
        alert('请在地图上点击选择位置');
        return;
    }
    
    const startTsStr = document.getElementById('event-start-ts').value.trim();
    const endTsStr = document.getElementById('event-end-ts').value.trim();
    
    const data = {
        category_id: selectedCategoryId,
        sub_category_id: selectedSubCategoryId,
        title: title,
        start_ts: startTsStr ? parseInt(startTsStr) : null,
        start_precision: parseInt(document.getElementById('event-start-precision').value),
        end_ts: endTsStr ? parseInt(endTsStr) : null,
        end_precision: parseInt(document.getElementById('event-end-precision').value),
        description: document.getElementById('event-description').value.trim() || null,
        tips: document.getElementById('event-tips').value.trim() || null,
        location_lat: lat,
        location_lng: lng,
        location_name: document.getElementById('event-location-name').value.trim() || null
    };
    
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
        closeEventForm();
        loadEventsForSubCategory(selectedSubCategoryId);
        loadStats();
    } else {
        alert('保存失败: ' + res.message);
    }
}

async function loadEventsForSubCategory(subCatId) {
    if (!selectedCategoryId || !subCatId) return;
    
    const res = await api(`/events?category_id=${selectedCategoryId}&sub_category_id=${subCatId}&page_size=100`);
    const listEl = document.getElementById('event-list');
    const countEl = document.getElementById('event-count');
    
    if (!res.success || res.data.length === 0) {
        countEl.textContent = '0';
        listEl.innerHTML = '<div class="empty-state"><div class="icon">📍</div><p style="font-size: 12px;">点击地图添加事件</p></div>';
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
    markers.forEach(m => { if (map) map.removeLayer(m); });
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
    
    if (map) {
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([e.location_lat, e.location_lng], { draggable: true }).addTo(map);
        tempMarker.on('dragend', function() {
            const pos = tempMarker.getLatLng();
            document.getElementById('event-lat').value = pos.lat.toFixed(6);
            document.getElementById('event-lng').value = pos.lng.toFixed(6);
        });
        map.panTo([e.location_lat, e.location_lng]);
    }
    
    document.getElementById('event-form-title').textContent = '编辑事件';
    document.getElementById('event-title').value = e.title || '';
    document.getElementById('event-start-ts').value = e.start_ts || '';
    document.getElementById('event-start-precision').value = e.start_precision || 0;
    document.getElementById('event-end-ts').value = e.end_ts || '';
    document.getElementById('event-end-precision').value = e.end_precision || 0;
    document.getElementById('event-description').value = e.description || '';
    document.getElementById('event-tips').value = e.tips || '';
    document.getElementById('event-lat').value = e.location_lat || '';
    document.getElementById('event-lng').value = e.location_lng || '';
    document.getElementById('event-location-name').value = e.location_name || '';
    
    document.getElementById('event-form-panel').style.display = 'flex';
}

async function deleteEvent(eventId) {
    if (!confirm('确定要删除这个事件吗？')) return;
    
    const res = await api(`/events/${eventId}`, { method: 'DELETE' });
    if (res.success) {
        loadEventsForSubCategory(selectedSubCategoryId);
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
            <td>${sc.map_name ? escapeHtml(sc.map_name) : '<span style="color: #999;">未绑定</span>'}</td>
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
    
    let options = '<option value="">不绑定</option>';
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
    
    if (type === 'osm') {
        urlGroup.style.display = 'none';
    } else {
        urlGroup.style.display = 'block';
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

function exportData() {
    const format = document.getElementById('export-format').value;
    
    if (format === 'json') {
        window.location.href = '/api/export/json';
    } else if (format === 'sql') {
        window.location.href = '/api/export/sql';
    }
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
