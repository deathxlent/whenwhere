let map = null;
let guessMarker = null;
let correctMarker = null;
let distanceLine = null;

function addTileLayersToMap(mapObj, tileType, customUrl, customSd, minZoom, maxZoom, crsType, bounds, tileSize) {
  const sdArr = customSd ? customSd.split(',').map(s => s.trim()).filter(Boolean) : ['1','2','3','4'];

  if (crsType === 'simple' && bounds) {
    try {
      mapObj.setMaxBounds(bounds);
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
    L.tileLayer(customUrl, tileOptions).addTo(mapObj);
    if (bounds && crsType === 'simple') {
      try {
        mapObj.fitBounds(bounds, { animate: false });
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
    }).addTo(mapObj);
    return;
  }

  if (tileType === 'amap_street') {
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: minZoom,
      maxZoom: maxZoom,
      attribution: '&copy; 高德地图'
    }).addTo(mapObj);
    return;
  }

  if (tileType === 'amap_satellite') {
    L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: minZoom,
      maxZoom: maxZoom,
      attribution: '&copy; 高德卫星'
    }).addTo(mapObj);
    L.tileLayer('https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1','2','3','4'],
      minZoom: Math.max(minZoom, 3),
      maxZoom: maxZoom
    }).addTo(mapObj);
    return;
  }

  L.tileLayer('./tiles/osm/{z}/{x}/{y}.png', {
    minZoom: minZoom,
    maxZoom: Math.min(maxZoom, 2)
  }).addTo(mapObj);

  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    minZoom: Math.max(minZoom, 3),
    maxZoom: maxZoom,
    attribution: '&copy; 高德地图'
  }).addTo(mapObj);
}

function initMap() {
  if (map) {
    map.remove();
    map = null;
  }

  const subCategory = appState.currentSubCategory;
  const tileType = subCategory.map_tile_type || 'hybrid';
  const customUrl = subCategory.map_tile_url ? subCategory.map_tile_url.replace(/^\//, './') : '';
  const customSd = subCategory.map_tile_subdomains || 'a,b,c';
  const minZoom = subCategory.map_min_zoom || 2;
  const maxZoom = subCategory.map_max_zoom || 8;
  const crsType = subCategory.map_crs_type || 'epsg3857';
  
  let bounds = null;
  if (subCategory.map_bounds_south != null) {
    bounds = [
      [subCategory.map_bounds_south, subCategory.map_bounds_west],
      [subCategory.map_bounds_north, subCategory.map_bounds_east]
    ];
  }

  const tileSize = subCategory.map_tile_size || 256;

  let centerLat = subCategory.center_lat || 35;
  let centerLng = subCategory.center_lng || 105;
  let defaultZoom = subCategory.default_zoom || 4;

  const mapOptions = {
    center: [centerLat, centerLng],
    zoom: defaultZoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    zoomControl: true,
    attributionControl: true
  };

  if (crsType === 'simple') {
    mapOptions.crs = L.CRS.Simple;
    mapOptions.zoomSnap = 0;
    if (bounds) {
      mapOptions.center = [
        (bounds[0][0] + bounds[1][0]) / 2,
        (bounds[0][1] + bounds[1][1]) / 2
      ];
    }
  }

  map = L.map('map-container', mapOptions);

  addTileLayersToMap(map, tileType, customUrl, customSd, minZoom, maxZoom, crsType, bounds, tileSize);

  if (tileType === 'hybrid' && crsType === 'epsg3857') {
    WORLD_COUNTRIES.forEach(country => {
      L.marker([country.lat, country.lng], {
        icon: L.divIcon({ className: 'country-label', html: country.name, iconSize: [0, 0] }),
        interactive: false
      }).addTo(map);
    });
  }

  map.on('click', onMapClick);
  
  setTimeout(() => map.invalidateSize(), 100);
  
  return map;
}

function onMapClick(e) {
  const { lat, lng } = e.latlng;
  
  if (guessMarker) {
    guessMarker.setLatLng([lat, lng]);
  } else {
    guessMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'guess-marker',
        html: '<div style="width:24px;height:24px;background:#4CAF50;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(map);
  }
  
  appState.guessLat = lat;
  appState.guessLng = lng;
  
  const submitBtn = document.getElementById('submit-guess');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('disabled');
  }
}

function showCorrectLocation(lat, lng, guessLat, guessLng) {
  if (correctMarker) {
    correctMarker.remove();
  }
  if (distanceLine) {
    distanceLine.remove();
  }
  
  correctMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'correct-marker',
      html: '<div style="width:24px;height:24px;background:#f44336;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }).addTo(map);
  
  distanceLine = L.polyline(
    [[guessLat, guessLng], [lat, lng]],
    { color: '#FF9800', weight: 3, dashArray: '10, 10' }
  ).addTo(map);
  
  map.fitBounds(L.latLngBounds([[guessLat, guessLng], [lat, lng]]).pad(0.2));
}

function clearMapMarkers() {
  if (guessMarker) {
    guessMarker.remove();
    guessMarker = null;
  }
  if (correctMarker) {
    correctMarker.remove();
    correctMarker = null;
  }
  if (distanceLine) {
    distanceLine.remove();
    distanceLine = null;
  }
  appState.guessLat = null;
  appState.guessLng = null;
}

function resetMapView() {
  clearMapMarkers();
  if (map) {
    const subCategory = appState.currentSubCategory;
    const centerLat = subCategory.center_lat || 35;
    const centerLng = subCategory.center_lng || 105;
    const defaultZoom = subCategory.default_zoom || 4;
    map.setView([centerLat, centerLng], defaultZoom);
  }
  
  const submitBtn = document.getElementById('submit-guess');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('disabled');
  }
}
