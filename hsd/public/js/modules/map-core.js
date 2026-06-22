window.HSD = window.HSD || {};

HSD.mapCore = {
  WORLD_COUNTRIES: [
    { name: '中国', lat: 35.8617, lng: 104.1954 },
    { name: '蒙古', lat: 46.8625, lng: 103.8467 },
    { name: '朝鲜', lat: 40.3399, lng: 127.5101 },
    { name: '韩国', lat: 35.9078, lng: 127.7669 },
    { name: '日本', lat: 36.2048, lng: 138.2529 },
    { name: '越南', lat: 14.0583, lng: 108.2772 },
    { name: '老挝', lat: 19.8563, lng: 102.4955 },
    { name: '柬埔寨', lat: 12.5657, lng: 104.9910 },
    { name: '缅甸', lat: 21.9162, lng: 95.9562 },
    { name: '泰国', lat: 15.8700, lng: 100.9925 },
    { name: '马来西亚', lat: 4.2105, lng: 101.9758 },
    { name: '新加坡', lat: 1.3521, lng: 103.8198 },
    { name: '印度尼西亚', lat: -0.7893, lng: 113.9213 },
    { name: '菲律宾', lat: 12.8797, lng: 121.7740 },
    { name: '印度', lat: 20.5937, lng: 78.9629 },
    { name: '巴基斯坦', lat: 30.3753, lng: 69.3451 },
    { name: '孟加拉国', lat: 23.6850, lng: 90.3563 },
    { name: '尼泊尔', lat: 28.3949, lng: 84.1240 },
    { name: '斯里兰卡', lat: 7.8731, lng: 80.7718 },
    { name: '哈萨克斯坦', lat: 48.0196, lng: 66.9237 },
    { name: '乌兹别克斯坦', lat: 41.3775, lng: 64.5853 },
    { name: '阿富汗', lat: 33.9391, lng: 67.7100 },
    { name: '伊朗', lat: 32.4279, lng: 53.6880 },
    { name: '伊拉克', lat: 33.2232, lng: 43.6793 },
    { name: '沙特阿拉伯', lat: 23.8859, lng: 45.0792 },
    { name: '土耳其', lat: 38.9637, lng: 35.2433 },
    { name: '叙利亚', lat: 34.8021, lng: 38.9968 },
    { name: '以色列', lat: 31.0461, lng: 34.8516 },
    { name: '埃及', lat: 26.8206, lng: 30.8025 },
    { name: '利比亚', lat: 26.3351, lng: 17.2283 },
    { name: '阿尔及利亚', lat: 28.0339, lng: 1.6596 },
    { name: '摩洛哥', lat: 31.7917, lng: -7.0926 },
    { name: '尼日利亚', lat: 9.0820, lng: 8.6753 },
    { name: '埃塞俄比亚', lat: 9.1450, lng: 40.4897 },
    { name: '肯尼亚', lat: -0.0236, lng: 37.9062 },
    { name: '南非', lat: -30.5595, lng: 22.9375 },
    { name: '英国', lat: 55.3781, lng: -3.4360 },
    { name: '爱尔兰', lat: 53.1424, lng: -7.6921 },
    { name: '法国', lat: 46.2276, lng: 2.2137 },
    { name: '德国', lat: 51.1657, lng: 10.4515 },
    { name: '荷兰', lat: 52.1326, lng: 5.2913 },
    { name: '比利时', lat: 50.5039, lng: 4.4699 },
    { name: '卢森堡', lat: 49.8153, lng: 6.1296 },
    { name: '瑞士', lat: 46.8182, lng: 8.2275 },
    { name: '奥地利', lat: 47.5162, lng: 14.5501 },
    { name: '意大利', lat: 41.8719, lng: 12.5674 },
    { name: '西班牙', lat: 40.4637, lng: -3.7492 },
    { name: '葡萄牙', lat: 39.3999, lng: -8.2245 },
    { name: '希腊', lat: 39.0742, lng: 21.8243 },
    { name: '丹麦', lat: 56.2639, lng: 9.5018 },
    { name: '挪威', lat: 60.4720, lng: 8.4689 },
    { name: '瑞典', lat: 60.1282, lng: 18.6435 },
    { name: '芬兰', lat: 61.9241, lng: 25.7482 },
    { name: '波兰', lat: 51.9194, lng: 19.1451 },
    { name: '捷克', lat: 49.8175, lng: 15.4730 },
    { name: '斯洛伐克', lat: 48.6690, lng: 19.6990 },
    { name: '匈牙利', lat: 47.1625, lng: 19.5033 },
    { name: '罗马尼亚', lat: 45.9432, lng: 24.9668 },
    { name: '保加利亚', lat: 42.7339, lng: 25.4858 },
    { name: '塞尔维亚', lat: 44.0165, lng: 21.0059 },
    { name: '克罗地亚', lat: 45.1000, lng: 15.2000 },
    { name: '波黑', lat: 43.9159, lng: 17.6791 },
    { name: '黑山', lat: 42.7087, lng: 19.3744 },
    { name: '马其顿', lat: 41.6086, lng: 21.7453 },
    { name: '阿尔巴尼亚', lat: 41.1533, lng: 20.1683 },
    { name: '立陶宛', lat: 55.1694, lng: 23.8813 },
    { name: '拉脱维亚', lat: 56.8796, lng: 24.6032 },
    { name: '爱沙尼亚', lat: 58.5953, lng: 25.0136 },
    { name: '俄罗斯', lat: 61.5240, lng: 105.3188 },
    { name: '乌克兰', lat: 48.3794, lng: 31.1656 },
    { name: '白俄罗斯', lat: 53.7098, lng: 27.9534 },
    { name: '摩尔多瓦', lat: 47.4116, lng: 28.3699 },
    { name: '格鲁吉亚', lat: 42.3154, lng: 43.3569 },
    { name: '亚美尼亚', lat: 40.0691, lng: 45.0382 },
    { name: '阿塞拜疆', lat: 40.1431, lng: 47.5769 },
    { name: '加拿大', lat: 56.1304, lng: -106.3468 },
    { name: '美国', lat: 37.0902, lng: -95.7129 },
    { name: '墨西哥', lat: 23.6345, lng: -102.5528 },
    { name: '危地马拉', lat: 15.7835, lng: -90.2308 },
    { name: '古巴', lat: 21.5218, lng: -77.7812 },
    { name: '巴拿马', lat: 8.5380, lng: -80.7821 },
    { name: '哥伦比亚', lat: 4.5709, lng: -74.2973 },
    { name: '委内瑞拉', lat: 6.4238, lng: -66.5897 },
    { name: '秘鲁', lat: -9.1900, lng: -75.0152 },
    { name: '厄瓜多尔', lat: -1.8312, lng: -78.1834 },
    { name: '巴西', lat: -14.2350, lng: -51.9253 },
    { name: '玻利维亚', lat: -16.2902, lng: -63.5887 },
    { name: '智利', lat: -35.6751, lng: -71.5430 },
    { name: '阿根廷', lat: -38.4161, lng: -63.6167 },
    { name: '乌拉圭', lat: -32.5228, lng: -55.7658 },
    { name: '巴拉圭', lat: -23.4425, lng: -58.4438 },
    { name: '澳大利亚', lat: -25.2744, lng: 133.7751 },
    { name: '新西兰', lat: -40.9006, lng: 174.8860 },
    { name: '巴布亚新几内亚', lat: -6.3149, lng: 143.9555 }
  ],

  COUNTRIES_WITH_ADMIN1: new Set(['中国', '美国', '俄罗斯', '印度', '加拿大', '澳大利亚', '巴西']),

  enterMapMode() {
    const appMain = document.getElementById('app-main');
    appMain.classList.add('map-mode');
    const header = document.querySelector('.app-header');
    header.classList.add('compact');
    const breadcrumb = document.querySelector('.breadcrumb');
    breadcrumb.classList.add('compact');
  },

  restoreLayout() {
    const appMain = document.getElementById('app-main');
    appMain.classList.remove('map-mode');
    const header = document.querySelector('.app-header');
    header.classList.remove('compact');
    const breadcrumb = document.querySelector('.breadcrumb');
    breadcrumb.classList.remove('compact');
    if (HSD.state.map) { HSD.state.map.remove(); HSD.state.map = null; }
  },

  async renderMainView(container) {
    if (!container) container = document.getElementById('main-view');
    HSD.state.currentView = 'home';
    document.getElementById('breadcrumb-text').textContent = '首页';
    HSD.mapCore.restoreLayout();

    const tabsHtml = HSD.state.categories.map((cat, idx) => `
      <div class="tab-item ${idx === 0 ? 'active' : ''}" data-id="${cat.id}" data-code="${cat.code}">${cat.name}</div>
    `).join('');

    container.innerHTML = `
      <div class="tabs-container">
        <div class="tabs-nav">${tabsHtml}</div>
        <div class="tab-content" id="tab-content"></div>
      </div>
    `;

    container.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = HSD.state.categories.find(c => c.id == tab.dataset.id);
        HSD.state.currentCategory = cat;
        HSD.mapCore.renderTabContent(cat);
      });
    });

    if (HSD.state.categories.length > 0) {
      HSD.state.currentCategory = HSD.state.categories[0];
      HSD.mapCore.renderTabContent(HSD.state.categories[0]);
    }
  },

  renderTabContent(category) {
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

    HSD.mapCore.loadSubCategories(category.id);
  },

  async loadSubCategories(categoryId) {
    const content = document.getElementById('tab-content');
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">加载中...</div>';

    const res = await API.get(`/categories/${categoryId}/sub-categories`);
    if (!res.success) {
      content.innerHTML = '<div style="text-align:center;padding:40px;color:#e53e3e;">加载失败</div>';
      return;
    }

    const subs = res.data;
    HSD.state.currentSubCategory = null;

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
        <div class="action-bar" style="display:flex;gap:12px;justify-content:center;">
          <button class="btn btn-primary" id="enter-map-btn" disabled>🗺️ 进入地图添加</button>
          <button class="btn btn-success" id="enter-list-btn" disabled>📋 进入列表管理</button>
        </div>
      </div>
    `;

    content.querySelectorAll('.radio-item').forEach(item => {
      item.addEventListener('click', () => {
        content.querySelectorAll('.radio-item').forEach(r => {
          r.classList.remove('selected');
          r.querySelector('input').checked = false;
        });
        item.classList.add('selected');
        item.querySelector('input').checked = true;
        const sub = subs.find(s => s.id == item.dataset.id);
        HSD.state.currentSubCategory = sub;
        document.getElementById('enter-map-btn').disabled = false;
        document.getElementById('enter-list-btn').disabled = false;
      });
    });

    document.getElementById('enter-map-btn').addEventListener('click', () => {
      if (HSD.state.currentSubCategory) {
        HSD.mapCore.renderMapView();
      }
    });

    document.getElementById('enter-list-btn').addEventListener('click', () => {
      if (HSD.state.currentSubCategory) {
        HSD.eventList.render();
      }
    });
  },

  async renderMapView() {
    HSD.state.currentView = 'map';
    const cat = HSD.state.currentCategory;
    const sub = HSD.state.currentSubCategory;
    document.getElementById('breadcrumb-text').textContent = `首页 / ${cat.name} / ${sub.name} / 地图添加`;
    HSD.mapCore.enterMapMode();
    HSD.state.admin1Labels = [];
    HSD.state.drawMode = false;

    document.getElementById('main-view').innerHTML = `
      <div class="map-view-container">
        <div class="map-container">
          <div id="map"></div>
          <div class="map-toolbar">
            <button class="btn btn-default btn-sm" id="back-home-btn">← 返回</button>
            <button class="btn btn-default btn-sm" id="view-list-btn">列表视图</button>
            <button class="btn btn-default btn-sm" id="toggle-draw-mode">📍 选点模式</button>
          </div>
          <div class="map-hint" id="map-hint">点击地图选择位置，或切换为框选模式画框</div>
        </div>
        <div class="add-panel" id="add-panel">
          <div class="add-panel-header">
            <div class="add-panel-title">添加事件</div>
            <button class="modal-close" id="close-panel-btn">&times;</button>
          </div>
          <div class="add-panel-body">
            ${HSD.eventForm.getAddPanelHtml()}
          </div>
        </div>
      </div>
    `;

    HSD.mapCore.initMap();
    HSD.eventForm.initAddPanel();
    HSD.mapDrawing.initDrawMode();
  },

  addTileLayersToMap(map, tileType, customUrl, customSd, minZoom, maxZoom, crsType, bounds, tileSize) {
    const sdArr = customSd ? customSd.split(',').map(s => s.trim()).filter(Boolean) : ['1','2','3','4'];

    if (crsType === 'simple' && bounds) {
      try { map.setMaxBounds(bounds); } catch(e) {}
    }

    if (tileType === 'custom' && customUrl) {
      const tileOptions = {
        subdomains: sdArr.length > 0 ? sdArr : undefined,
        minZoom: minZoom,
        maxZoom: maxZoom,
        minNativeZoom: minZoom,
        maxNativeZoom: maxZoom,
        noWrap: true,
        tileSize: tileSize || 256
      };
      if (bounds) tileOptions.bounds = bounds;
      L.tileLayer(customUrl, tileOptions).addTo(map);
      if (bounds && crsType === 'simple') {
        try { map.fitBounds(bounds, { animate: false }); } catch(e) {}
      }
      return;
    }

    if (tileType === 'osm') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        subdomains: ['a','b','c'],
        minZoom: minZoom,
        maxZoom: maxZoom,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      return;
    }

    if (tileType === 'amap_street') {
      L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        subdomains: ['1','2','3','4'],
        minZoom: minZoom,
        maxZoom: maxZoom,
        attribution: '&copy; 高德地图'
      }).addTo(map);
      return;
    }

    if (tileType === 'amap_satellite') {
      L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
        subdomains: ['1','2','3','4'],
        minZoom: minZoom,
        maxZoom: maxZoom,
        attribution: '&copy; 高德卫星'
      }).addTo(map);
      L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
        subdomains: ['1','2','3','4'],
        minZoom: Math.max(minZoom, 3),
        maxZoom: maxZoom
      }).addTo(map);
      return;
    }

    L.tileLayer('/shared/tiles/osm/{z}/{x}/{y}.png', {
      minZoom: minZoom,
      maxZoom: Math.min(maxZoom, 2)
    }).addTo(map);

    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: Math.max(minZoom, 3),
      maxZoom: maxZoom,
      attribution: '&copy; 高德地图'
    }).addTo(map);
  },

  initMap() {
    if (HSD.state.map) {
      HSD.state.map.remove();
      HSD.state.map = null;
    }

    const sub = HSD.state.currentSubCategory;
    let center, zoom, minZoom, maxZoom;
    let tileType = 'hybrid';
    let tileUrl = '';
    let tileSd = 'a,b,c';
    let crsType = 'epsg3857';
    let bounds = null;
    let tileSize = 256;

    if (sub) {
      if (sub.map_tile_size) tileSize = parseInt(sub.map_tile_size);
      if (sub.center_lat != null && sub.center_lng != null) {
        center = [parseFloat(sub.center_lat), parseFloat(sub.center_lng)];
      }
      if (sub.default_zoom != null) zoom = parseInt(sub.default_zoom);
      if (sub.map_min_zoom != null) minZoom = parseInt(sub.map_min_zoom);
      if (sub.map_max_zoom != null) maxZoom = parseInt(sub.map_max_zoom);
      if (sub.map_tile_type) tileType = sub.map_tile_type;
      if (sub.map_tile_url) tileUrl = sub.map_tile_url;
      if (sub.map_tile_subdomains) tileSd = sub.map_tile_subdomains;
      if (sub.map_crs_type) crsType = sub.map_crs_type;
      if (sub.map_bounds_south != null && sub.map_bounds_west != null && sub.map_bounds_north != null && sub.map_bounds_east != null) {
        bounds = [[parseFloat(sub.map_bounds_south), parseFloat(sub.map_bounds_west)], [parseFloat(sub.map_bounds_north), parseFloat(sub.map_bounds_east)]];
      }
    }

    if (crsType === 'simple' && bounds) {
      const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
      const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
      center = [centerLat, centerLng];
    } else if (!center) {
      const subCode = sub?.code || '';
      if (subCode === 'china') {
        center = [35, 105];
      } else {
        center = [30, 120];
      }
    }
    if (zoom == null) zoom = (sub?.code === 'china') ? 4 : 2;
    if (minZoom == null) minZoom = 2;
    if (maxZoom == null) maxZoom = 8;

    const mapOptions = {
      center: center,
      zoom: zoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      zoomControl: true,
      worldCopyJump: crsType !== 'simple',
      preferCanvas: crsType === 'simple'
    };
    if (crsType === 'simple') {
      mapOptions.crs = L.CRS.Simple;
      mapOptions.zoomSnap = 0;
    }

    HSD.state.map = L.map('map', mapOptions);
    HSD.state.admin1Labels = [];

    HSD.mapCore.addTileLayersToMap(HSD.state.map, tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds, tileSize);

    if (crsType !== 'simple') {
      HSD.mapCore.loadChinaProvinces();
      HSD.mapCore.loadWorldAdmin1Labels();
    }

    HSD.state.map.on('click', (e) => HSD.mapDrawing.onMapClick(e));

    document.getElementById('back-home-btn').addEventListener('click', () => {
      if (HSD.state.map) { HSD.state.map.remove(); HSD.state.map = null; }
      HSD.mapCore.renderMainView();
    });

    document.getElementById('view-list-btn').addEventListener('click', () => {
      if (HSD.state.map) { HSD.state.map.remove(); HSD.state.map = null; }
      HSD.eventList.render();
    });
  },

  async loadChinaProvinces() {
    try {
      const res = await fetch('/shared/geojson/china_provinces.json');
      const data = await res.json();

      HSD.state.provinceLayer = L.geoJSON(data, {
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
      }).addTo(HSD.state.map);

      HSD.mapCore.addProvinceLabels(data);
    } catch (e) {
      console.warn('加载中国省份数据失败:', e);
    }
  },

  addProvinceLabels(data) {
    const currentZoom = HSD.state.map.getZoom();
    data.features.forEach(feature => {
      const name = feature.properties.name;
      if (!name) return;

      const bounds = L.geoJSON(feature).getBounds();
      const center = bounds.getCenter();

      const label = L.marker(center, {
        icon: L.divIcon({
          className: 'province-label',
          html: name,
          iconSize: [0, 0]
        }),
        interactive: false
      });
      label._isCountryLabel = false;
      HSD.state.admin1Labels.push(label);
      if (currentZoom >= 4) {
        label.addTo(HSD.state.map);
      }
    });
  },

  async loadWorldAdmin1Labels() {
    try {
      const res = await fetch('/shared/geojson/world_admin1_labels.json');
      const data = await res.json();
      const currentZoom = HSD.state.map.getZoom();

      HSD.mapCore.WORLD_COUNTRIES.forEach(country => {
        const label = L.marker([country.lat, country.lng], {
          icon: L.divIcon({
            className: 'country-label',
            html: country.name,
            iconSize: [0, 0]
          }),
          interactive: false
        });
        label._isCountryLabel = true;
        HSD.state.admin1Labels.push(label);
        if (currentZoom >= 2) {
          label.addTo(HSD.state.map);
        }
      });

      data.features.forEach(feature => {
        const name = feature.properties.name;
        const coords = feature.geometry.coordinates;
        const country = feature.properties.country;
        if (!name || !coords) return;
        if (!HSD.mapCore.COUNTRIES_WITH_ADMIN1.has(country)) return;

        const label = L.marker([coords[1], coords[0]], {
          icon: L.divIcon({
            className: 'admin1-label',
            html: name,
            iconSize: [0, 0]
          }),
          interactive: false
        });
        label._isCountryLabel = false;
        HSD.state.admin1Labels.push(label);
        if (currentZoom >= 4) {
          label.addTo(HSD.state.map);
        }
      });

      HSD.state.map.on('zoomend', HSD.mapCore.updateLabelVisibility);
    } catch (e) {
      console.warn('加载世界行政区划标注失败:', e);
    }
  },

  updateLabelVisibility() {
    if (!HSD.state.map) return;
    const zoom = HSD.state.map.getZoom();

    HSD.state.admin1Labels.forEach(label => {
      const minZoom = label._isCountryLabel ? 2 : 4;
      if (zoom >= minZoom) {
        if (!HSD.state.map.hasLayer(label)) HSD.state.map.addLayer(label);
      } else {
        if (HSD.state.map.hasLayer(label)) HSD.state.map.removeLayer(label);
      }
    });
  }
};
