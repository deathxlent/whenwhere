function initBgMap() {
  if (appState.bgMap) {
    appState.bgMap.remove();
    appState.bgMap = null;
  }
  const container = document.getElementById('bg-map');
  container.innerHTML = '<div id="bg-map-el" style="width:100%;height:100%;"></div>';

  const map = L.map('bg-map-el', {
    center: [30, 120],
    zoom: 2,
    minZoom: 2,
    maxZoom: 8,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false
  });

  L.tileLayer('/tiles/osm/{z}/{x}/{y}.png', {
    minZoom: 2,
    maxZoom: 2
  }).addTo(map);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: 3,
    maxZoom: 8,
    attribution: '&copy; 高德地图'
  }).addTo(map);

  WORLD_COUNTRIES.forEach(country => {
    L.marker([country.lat, country.lng], {
      icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
      interactive: false
    }).addTo(map);
  });

  appState.bgMap = map;
}

function addTileLayersToMap(map, tileType = 'hybrid', customUrl = '', customSd = 'a,b,c', minZoom = 2, maxZoom = 8, crsType = 'epsg3857', bounds = null, tileSize = 256) {
  const sdArr = customSd ? customSd.split(',').map(s => s.trim()).filter(Boolean) : ['1','2','3','4'];

  if (crsType === 'simple' && bounds) {
    try {
      map.setMaxBounds(bounds);
    } catch(e) {}
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
    if (bounds) {
      tileOptions.bounds = bounds;
    }
    L.tileLayer(customUrl, tileOptions).addTo(map);
    if (bounds && crsType === 'simple') {
      try {
        map.fitBounds(bounds, { animate: false });
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

  L.tileLayer('/tiles/osm/{z}/{x}/{y}.png', {
    minZoom: minZoom,
    maxZoom: Math.min(maxZoom, 2)
  }).addTo(map);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: Math.max(minZoom, 3),
    maxZoom: maxZoom,
    attribution: '&copy; 高德地图'
  }).addTo(map);
}

async function loadGameMapLabels() {
  try {
    const res = await fetch('/geojson/china_provinces.json');
    const data = await res.json();

    appState.provinceLayer = L.geoJSON(data, {
      style: { color: '#4a90d9', weight: 1, fillColor: '#a8d0f0', fillOpacity: 0.1, dashArray: '4' },
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name;
        if (name) {
          layer.bindTooltip(name, { permanent: false, direction: 'center', className: 'province-label' });
        }
      }
    }).addTo(appState.map);

    const currentZoom = appState.map.getZoom();
    data.features.forEach(feature => {
      const name = feature.properties.name;
      if (!name) return;
      const bounds = L.geoJSON(feature).getBounds();
      const center = bounds.getCenter();
      const label = L.marker(center, {
        icon: L.divIcon({ className: 'province-label', html: name, iconSize: [0, 0] }),
        interactive: false
      });
      label._isCountryLabel = false;
      label._isProvinceLabel = true;
      appState.admin1Labels.push(label);
      if (currentZoom >= 4) label.addTo(appState.map);
    });

    WORLD_COUNTRIES.forEach(country => {
      const label = L.marker([country.lat, country.lng], {
        icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
        interactive: false
      });
      label._isCountryLabel = true;
      label._isProvinceLabel = false;
      appState.admin1Labels.push(label);
      if (currentZoom >= 2) label.addTo(appState.map);
    });

    try {
      const adminRes = await fetch('/geojson/world_admin1_labels.json');
      const adminData = await adminRes.json();
      adminData.features.forEach(feature => {
        const name = feature.properties.name;
        const coords = feature.geometry.coordinates;
        const country = feature.properties.country;
        if (!name || !coords) return;
        if (!COUNTRIES_WITH_ADMIN1.has(country)) return;
        const label = L.marker([coords[1], coords[0]], {
          icon: L.divIcon({ className: 'admin1-label', html: name, iconSize: [0, 0] }),
          interactive: false
        });
        label._isCountryLabel = false;
        label._isProvinceLabel = false;
        appState.admin1Labels.push(label);
        if (currentZoom >= 4) label.addTo(appState.map);
      });
    } catch (e) {}

    appState.map.on('zoomend', () => {
      const zoom = appState.map.getZoom();
      appState.admin1Labels.forEach(label => {
        const minZoom = label._isCountryLabel ? 2 : 4;
        if (zoom >= minZoom) {
          if (!appState.map.hasLayer(label)) appState.map.addLayer(label);
        } else {
          if (appState.map.hasLayer(label)) appState.map.removeLayer(label);
        }
      });
    });
  } catch (e) {
    console.warn('加载地图标签失败:', e);
  }
}

function onGameMapClick(e) {
  const { lat, lng } = e.latlng;
  appState.guessLat = lat;
  appState.guessLng = lng;

  if (appState.mapClickMarker) {
    appState.mapClickMarker.setLatLng([lat, lng]);
  } else {
    appState.mapClickMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'guess-marker',
        html: '<div style="width:20px;height:20px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(appState.map);
  }

  if (appState.currentEvent && appState.currentEvent.location_only) {
    showLocationConfirm();
  } else {
    showTimePicker();
  }
}

function initResultMap(result) {
  if (appState.map) {
    appState.map.remove();
    appState.map = null;
  }

  const mapEl = document.getElementById('result-map');
  if (!mapEl) return;

  const correctLat = result.correct_lat;
  const correctLng = result.correct_lng;
  const correctLat2 = result.correct_lat2;
  const correctLng2 = result.correct_lng2;
  const guessLat = appState.guessLat;
  const guessLng = appState.guessLng;
  const distanceUnit = result.distance_unit || 'km';
  const isRect = correctLat2 != null && correctLng2 != null;

  const cfg = appState.mapConfig || {};
  const tileType = cfg.tileType || 'hybrid';
  const tileUrl = cfg.tileUrl || '';
  const tileSd = cfg.tileSd || 'a,b,c';
  const minZoom = cfg.minZoom || 2;
  const maxZoom = cfg.maxZoom || 18;
  const crsType = cfg.crsType || 'epsg3857';
  const bounds = cfg.bounds || null;
  const tileSize = cfg.tileSize || 256;

  let mapCenter = [30, 120];
  let mapZoom = 2;
  if (correctLat != null && correctLng != null) {
    if (isRect) {
      const north = Math.max(correctLat, correctLat2);
      const south = Math.min(correctLat, correctLat2);
      const east = Math.max(correctLng, correctLng2);
      const west = Math.min(correctLng, correctLng2);
      mapCenter = [(north + south) / 2, (east + west) / 2];
    } else if (guessLat != null && guessLng != null) {
      mapCenter = [(correctLat + guessLat) / 2, (correctLng + guessLng) / 2];
    } else {
      mapCenter = [correctLat, correctLng];
      mapZoom = minZoom + 3;
    }
  }

  const mapOptions = {
    center: mapCenter,
    zoom: mapZoom,
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

  const resultMap = L.map('result-map', mapOptions);

  addTileLayersToMap(resultMap, tileType, tileUrl, tileSd, minZoom, maxZoom, crsType, bounds, tileSize);

  if (crsType === 'simple' && bounds) {
    try {
      resultMap.setMaxBounds(bounds);
    } catch(e) {}
  }

  const mapLayers = [];

  if (correctLat != null && correctLng != null) {
    if (isRect) {
      const north = Math.max(correctLat, correctLat2);
      const south = Math.min(correctLat, correctLat2);
      const east = Math.max(correctLng, correctLng2);
      const west = Math.min(correctLng, correctLng2);

      const rectBounds = [[south, west], [north, east]];
      const rect = L.rectangle(rectBounds, {
        color: '#e53e3e',
        weight: 3,
        fillColor: '#e53e3e',
        fillOpacity: 0.15,
        dashArray: null
      }).addTo(resultMap);
      mapLayers.push(rect);

      rect.bindTooltip(result.correct_location_name || '正确区域', {
        permanent: false,
        direction: 'top',
        className: 'correct-tooltip'
      });
    } else {
      const correctMarker = L.marker([correctLat, correctLng], {
        icon: L.divIcon({
          className: 'correct-answer-marker',
          html: '<div class="answer-pin correct-pin"><div class="pin-inner">✓</div></div>',
          iconSize: [36, 48],
          iconAnchor: [18, 48]
        })
      }).addTo(resultMap);
      mapLayers.push(correctMarker);
      correctMarker.bindTooltip(result.correct_location_name || '正确位置', {
        permanent: false,
        direction: 'top',
        className: 'correct-tooltip'
      });
    }

    if (guessLat != null && guessLng != null) {
      const guessMarker = L.marker([guessLat, guessLng], {
        icon: L.divIcon({
          className: 'guess-answer-marker',
          html: '<div class="answer-pin guess-pin"><div class="pin-inner">?</div></div>',
          iconSize: [36, 48],
          iconAnchor: [18, 48]
        })
      }).addTo(resultMap);
      mapLayers.push(guessMarker);

      let lineEndLat = correctLat;
      let lineEndLng = correctLng;
      if (isRect) {
        const north = Math.max(correctLat, correctLat2);
        const south = Math.min(correctLat, correctLat2);
        const east = Math.max(correctLng, correctLng2);
        const west = Math.min(correctLng, correctLng2);

        let closestLat = guessLat;
        let closestLng = guessLng;

        if (guessLat < south) closestLat = south;
        else if (guessLat > north) closestLat = north;

        if (guessLng < west) closestLng = west;
        else if (guessLng > east) closestLng = east;

        lineEndLat = closestLat;
        lineEndLng = closestLng;
      }

      const dashedLine = L.polyline(
        [[guessLat, guessLng], [lineEndLat, lineEndLng]],
        {
          color: '#fbbf24',
          weight: 3,
          dashArray: '10, 8',
          opacity: 0.9
        }
      ).addTo(resultMap);
      mapLayers.push(dashedLine);

      const midLat = (guessLat + lineEndLat) / 2;
      const midLng = (guessLng + lineEndLng) / 2;
      const distanceLabel = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'distance-label-marker',
          html: `<div class="distance-label">${result.distance_km} ${distanceUnit}</div>`,
          iconSize: [100, 30],
          iconAnchor: [50, 15]
        }),
        interactive: false
      }).addTo(resultMap);
      mapLayers.push(distanceLabel);

      if (crsType !== 'simple' && mapLayers.length > 0) {
        const group = L.featureGroup(mapLayers);
        resultMap.fitBounds(group.getBounds().pad(0.3), { maxZoom: maxZoom });
      }
    } else {
      if (crsType === 'simple' && bounds) {
        try { resultMap.fitBounds(bounds, { animate: false }); } catch(e) {}
      } else if (isRect) {
        const north = Math.max(correctLat, correctLat2);
        const south = Math.min(correctLat, correctLat2);
        const east = Math.max(correctLng, correctLng2);
        const west = Math.min(correctLng, correctLng2);
        resultMap.fitBounds([[south, west], [north, east]], { maxZoom: maxZoom, padding: [50, 50] });
      }
    }
  }

  appState.map = resultMap;
}
