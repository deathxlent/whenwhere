function renderAnswersPage(eventId) {
  cleanupGame();
  appState.currentPage = 'answers';
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="answers-page">
      <div class="answers-map-wrap">
        <div class="answers-map-container" id="answers-map"></div>
        <div class="answers-floating-panel" id="answers-panel">
          <div class="answers-panel-header">
            <div class="answers-panel-title" id="answers-panel-title">加载中...</div>
            <div class="answers-panel-actions">
              <button class="answers-panel-close" id="answers-panel-close">×</button>
            </div>
          </div>
          <div class="answers-panel-content" id="answers-panel-content">
            <div style="text-align:center;padding:40px;color:rgba(255,255,255,0.5);">数据加载中...</div>
          </div>
        </div>
      </div>
      <button class="btn btn-secondary answers-back-btn" id="answers-back-btn">← 返回收藏页</button>
    </div>
  `;

  document.getElementById('answers-back-btn').addEventListener('click', renderFavoritesPage);

  initAnswersPanelDrag();

  const data = loadAnswersData(eventId);
  if (!data) {
    alert('加载失败');
    renderFavoritesPage();
    return;
  }
  initAnswersMap(data);
}

function loadAnswersData(eventId) {
  const event = getEventById(eventId);
  if (!event) return null;

  const subCategory = findSubCategoryByEventId(eventId);
  if (!subCategory) return null;

  const category = findCategoryBySubCategoryId(subCategory.id);

  const allAnswers = getEventAnswers(eventId);
  const validAnswers = allAnswers.filter(a => a.guess_lat != null && a.guess_lng != null);

  const otherAnswers = validAnswers.filter(a => a.user_id !== 'demo_user').map(a => ({
    id: a.id,
    username: a.username || '匿名用户',
    user_id: a.user_id,
    guess_lat: a.guess_lat,
    guess_lng: a.guess_lng,
    guess_year: a.guess_year,
    guess_month: a.guess_month,
    guess_day: a.guess_day,
    distance_km: a.distance_km,
    time_diff_years: a.time_diff_years,
    precise_location: a.precise_location,
    precise_time: a.precise_time,
    timed_out: a.timed_out,
    elapsed_seconds: a.elapsed_seconds,
    created_at: a.created_at
  }));

  let myAnswer = null;
  const mine = allAnswers.filter(a => a.user_id === 'demo_user').pop();
  if (mine) {
    myAnswer = {
      id: mine.id,
      guess_lat: mine.guess_lat,
      guess_lng: mine.guess_lng,
      guess_year: mine.guess_year,
      guess_month: mine.guess_month,
      guess_day: mine.guess_day,
      distance_km: mine.distance_km,
      time_diff_years: mine.time_diff_years,
      precise_location: mine.precise_location,
      precise_time: mine.precise_time,
      timed_out: mine.timed_out,
      elapsed_seconds: mine.elapsed_seconds,
      created_at: mine.created_at
    };
  }

  const stats = getEventAnswerStats(eventId);

  const start_display = formatTimestamp(event.start_ts, event.start_precision);
  const end_display = event.end_ts ? formatTimestamp(event.end_ts, event.end_precision) : null;

  return {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      tips: event.tips,
      location_lat: event.location_lat,
      location_lng: event.location_lng,
      location_lat2: event.location_lat2,
      location_lng2: event.location_lng2,
      location_only: event.location_only,
      location_name: event.location_name,
      start_ts: event.start_ts,
      start_precision: event.start_precision,
      end_ts: event.end_ts,
      end_precision: event.end_precision,
      start_display: start_display,
      end_display: end_display,
      category_name: category ? category.name : '',
      sub_category_name: subCategory.name,
      sub_category_code: subCategory.code,
      video_url: event.video_url,
      audio_url: event.audio_url,
      images: event.images || []
    },
    map_config: {
      center_lat: subCategory.center_lat,
      center_lng: subCategory.center_lng,
      default_zoom: subCategory.default_zoom,
      min_zoom: subCategory.min_zoom,
      max_zoom: subCategory.max_zoom,
      tile_type: subCategory.map_tile_type || 'hybrid',
      tile_url: subCategory.map_tile_url || '',
      tile_subdomains: subCategory.map_tile_subdomains || 'a,b,c',
      crs_type: subCategory.map_crs_type || 'epsg3857',
      bounds_south: subCategory.map_bounds_south,
      bounds_west: subCategory.map_bounds_west,
      bounds_north: subCategory.map_bounds_north,
      bounds_east: subCategory.map_bounds_east,
      tile_size: subCategory.map_tile_size || 256,
      distance_unit: 'km',
      distance_scale: 1,
      map_min_zoom: subCategory.map_min_zoom,
      map_max_zoom: subCategory.map_max_zoom
    },
    stats: stats,
    other_answers: otherAnswers,
    my_answer: myAnswer
  };
}

function findSubCategoryByEventId(eventId) {
  for (const cat of DEMO_DATA.categories) {
    for (const sub of cat.subCategories) {
      if (sub.events) {
        const event = sub.events.find(e => e.id === eventId);
        if (event) return sub;
      }
    }
  }
  return null;
}

function findCategoryBySubCategoryId(subCategoryId) {
  return DEMO_DATA.categories.find(cat => 
    cat.subCategories.some(sub => sub.id === subCategoryId)
  );
}

function initAnswersPanelDrag() {
  const panel = document.getElementById('answers-panel');
  const header = panel.querySelector('.answers-panel-header');
  let isDragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('answers-panel-close')) return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    document.body.style.userSelect = 'none';
    panel.style.right = 'auto';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (startLeft + (e.clientX - startX)) + 'px';
    panel.style.top = Math.max(10, startTop + (e.clientY - startY)) + 'px';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });

  document.getElementById('answers-panel-close').addEventListener('click', () => {
    panel.style.display = 'none';
  });
}

function initAnswersMap(data) {
  const { event, map_config, stats, other_answers, my_answer } = data;
  const mc = map_config || {};

  let mapCenter = [30, 120];
  if (mc.center_lat != null && mc.center_lng != null) {
    mapCenter = [parseFloat(mc.center_lat), parseFloat(mc.center_lng)];
  } else if (event.location_lat != null && event.location_lng != null) {
    mapCenter = [parseFloat(event.location_lat), parseFloat(event.location_lng)];
  }

  let minZoom = mc.min_zoom != null ? parseInt(mc.min_zoom) : 2;
  let maxZoom = mc.max_zoom != null ? parseInt(mc.max_zoom) : 8;
  if (mc.map_min_zoom != null) minZoom = Math.max(minZoom, parseInt(mc.map_min_zoom));
  if (mc.map_max_zoom != null) maxZoom = Math.min(maxZoom, parseInt(mc.map_max_zoom));

  const crsType = mc.crs_type || 'epsg3857';
  const hasBounds = mc.bounds_south != null && mc.bounds_west != null
    && mc.bounds_north != null && mc.bounds_east != null;
  const bounds = hasBounds
    ? [[parseFloat(mc.bounds_south), parseFloat(mc.bounds_west)],
      [parseFloat(mc.bounds_north), parseFloat(mc.bounds_east)]]
    : null;

  const tileSize = mc.tile_size || 256;
  const mapZoom = mc.default_zoom != null ? parseInt(mc.default_zoom) : (bounds ? minZoom : 4);

  const mapOptions = {
    center: mapCenter,
    zoom: mapZoom,
    minZoom: minZoom,
    maxZoom: maxZoom,
    zoomControl: true,
    worldCopyJump: crsType !== 'simple',
    preferCanvas: crsType === 'simple'
  };
  if (crsType === 'simple' && bounds) {
    mapOptions.crs = L.CRS.Simple;
    mapOptions.zoomSnap = 0;
    const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
    const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
    mapOptions.center = [centerLat, centerLng];
  }

  const map = L.map('answers-map', mapOptions);
  appState.answersMap = map;

  addTileLayersToMap(map,
    mc.tile_type || 'hybrid',
    mc.tile_url || '',
    mc.tile_subdomains || 'a,b,c',
    minZoom, maxZoom,
    crsType,
    bounds,
    tileSize
  );

  const allLatLngs = [];
  if (event.location_lat != null && event.location_lng != null) {
    allLatLngs.push([event.location_lat, event.location_lng]);
    if (event.location_lat2 != null && event.location_lng2 != null) {
      allLatLngs.push([event.location_lat2, event.location_lng2]);
    }
  }

  other_answers.forEach(a => {
    if (a.guess_lat != null && a.guess_lng != null) {
      allLatLngs.push([a.guess_lat, a.guess_lng]);
    }
  });

  if (my_answer && my_answer.guess_lat != null && my_answer.guess_lng != null) {
    allLatLngs.push([my_answer.guess_lat, my_answer.guess_lng]);
  }

  const distanceUnit = mc.distance_unit || 'km';

  const correctMarkerStyle = {
    color: '#00ff88',
    fillColor: '#00ff88',
    fillOpacity: 0.15,
    weight: 3,
    opacity: 0.9
  };

  if (event.location_lat != null && event.location_lng != null) {
    if (event.location_lat2 != null && event.location_lng2 != null) {
      L.rectangle([
        [event.location_lat, event.location_lng],
        [event.location_lat2, event.location_lng2]
      ], {
        ...correctMarkerStyle,
        className: 'correct-answer-rect'
      }).addTo(map).bindPopup('<div style="color:#00ff88;font-weight:700;">✓ 正确答案区域</div>');

      const centerLat = (event.location_lat + event.location_lat2) / 2;
      const centerLng = (event.location_lng + event.location_lng2) / 2;
      L.marker([centerLat, centerLng], {
        icon: L.divIcon({
          className: 'correct-answer-icon',
          html: '<div class="map-answer-marker correct">📍</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map).bindPopup('<div class="map-popup"><b>✓ 正确答案</b><br>' + escapeHtml(event.title || '') + '</div>');
    } else {
      L.circleMarker([event.location_lat, event.location_lng], {
        radius: 10,
        ...correctMarkerStyle,
        className: 'correct-answer-marker'
      }).addTo(map).bindPopup(
        '<div class="map-popup"><b>✓ 正确答案位置</b><br>'
        + escapeHtml(event.location_name || '')
        + (event.title ? '<br>' + escapeHtml(event.title) : '')
        + '</div>'
      );

      L.marker([event.location_lat, event.location_lng], {
        icon: L.divIcon({
          className: 'correct-answer-icon',
          html: '<div class="map-answer-marker correct">📍</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);
    }
  }

  other_answers.forEach(a => {
    if (a.guess_lat == null || a.guess_lng == null) return;
    const isCorrectLoc = a.precise_location;
    const markerColor = isCorrectLoc ? '#ffd700' : '#ff6b6b';

    L.circleMarker([a.guess_lat, a.guess_lng], {
      radius: 5,
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.85,
      opacity: 0.85,
      weight: 0,
      className: 'other-answer-marker'
    }).addTo(map).bindPopup(buildAnswerPopup(a, false, distanceUnit));
  });

  if (my_answer && my_answer.guess_lat != null && my_answer.guess_lng != null) {
    const mine = my_answer;

    L.circleMarker([mine.guess_lat, mine.guess_lng], {
      radius: 9,
      color: '#4fc3f7',
      fillColor: '#4fc3f7',
      fillOpacity: 0.9,
      opacity: 0.9,
      weight: 3,
      className: 'my-answer-marker'
    }).addTo(map).bindPopup(buildAnswerPopup({ ...mine, username: '我' }, true, distanceUnit));

    L.marker([mine.guess_lat, mine.guess_lng], {
      icon: L.divIcon({
        className: 'my-answer-icon',
        html: '<div class="map-answer-marker my">👤</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    }).addTo(map);
  }

  if (allLatLngs.length > 0) {
    setTimeout(() => {
      try {
        map.fitBounds(L.latLngBounds(allLatLngs).pad(0.25));
      } catch (e) {}
    }, 100);
  }

  renderAnswersPanelContent(event, stats, other_answers, my_answer, distanceUnit);
}

function buildAnswerPopup(a, isMine, distanceUnit) {
  const timeText = a.guess_year
    ? `${a.guess_year}${a.guess_month ? '/' + a.guess_month : ''}${a.guess_day ? '/' + a.guess_day : ''}`
    : '未作答';
  const distText = a.distance_km != null ? `${a.distance_km} ${distanceUnit}` : '未作答';
  const timeDiffText = a.time_diff_years != null
    ? (a.time_diff_years === 0 ? '完全正确' : `${a.time_diff_years > 0 ? '+' : ''}${a.time_diff_years} 年`)
    : '未作答';

  return `<div class="map-popup">
    <b style="color:${isMine ? '#4fc3f7' : '#fff'}">${escapeHtml(a.username || '匿名用户')}</b><br>
    🕐 ${timeText}<br>
    📏 距离: ${distText} ${a.precise_location ? '<span style="color:#00ff88">(精准)</span>' : ''}<br>
    ⏰ 时间差: ${timeDiffText} ${a.precise_time ? '<span style="color:#00ff88">(精准)</span>' : ''}<br>
    ${a.elapsed_seconds ? `⏱️ ${a.elapsed_seconds.toFixed(1)} 秒` : ''}
  </div>`;
}

function renderAnswersPanelContent(event, stats, otherAnswers, myAnswer, distanceUnit) {
  const panelTitle = document.getElementById('answers-panel-title');
  panelTitle.textContent = escapeHtml(event.title) || '答题分析';

  const content = document.getElementById('answers-panel-content');
  const locOnly = event.location_only;

  const timeRange = event.start_display
    ? `${event.start_display}${event.end_display && event.end_display !== event.start_display ? ' ~ ' + event.end_display : ''}`
    : '-';

  let myCompareHtml = '';
  if (myAnswer) {
    const myDist = myAnswer.distance_km != null ? `${myAnswer.distance_km} ${distanceUnit}` : '未作答';
    const myTimeDiff = myAnswer.time_diff_years != null
      ? (myAnswer.time_diff_years === 0 ? '完全正确！' : `${myAnswer.time_diff_years > 0 ? '+' : ''}${myAnswer.time_diff_years} 年`)
      : '未作答';
    const myTimeGuess = myAnswer.guess_year
      ? `${myAnswer.guess_year}${myAnswer.guess_month ? '/' + myAnswer.guess_month : ''}${myAnswer.guess_day ? '/' + myAnswer.guess_day : ''}`
      : '未作答';
    const distClass = myAnswer.precise_location ? 'correct' : (myAnswer.distance_km != null ? 'wrong' : '');
    const timeClass = myAnswer.precise_time ? 'correct' : (myAnswer.time_diff_years != null ? 'wrong' : '');

    myCompareHtml = `
      <div class="answer-compare-section">
        <div class="compare-title" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;">我的答案对比</div>
        <div class="compare-table">
          <div class="compare-row">
            <div class="compare-label">📍 我的位置</div>
            <div class="compare-value ${distClass}">${myDist} ${myAnswer.precise_location ? '🎯' : ''}</div>
            <div class="compare-label">📍 正确位置</div>
            <div class="compare-value correct">${escapeHtml(event.location_name || '未知')}</div>
          </div>
          ${!locOnly ? `
          <div class="compare-row">
            <div class="compare-label">⏰ 我的时间</div>
            <div class="compare-value">${myTimeGuess}</div>
            <div class="compare-label">⏰ 正确时间</div>
            <div class="compare-value correct">${timeRange}</div>
          </div>
          <div class="compare-row">
            <div class="compare-label">⏳ 时间偏差</div>
            <div class="compare-value ${timeClass}">${myTimeDiff} ${myAnswer.precise_time ? '🎯' : ''}</div>
            <div class="compare-label">😅 距离偏差</div>
            <div class="compare-value ${distClass}">${myDist}</div>
          </div>
          ` : ''}
        </div>
        <div class="compare-row" style="margin-top:8px;">
          <div class="compare-label">⏱️ 我的耗时</div>
          <div class="compare-value">${myAnswer.elapsed_seconds ? myAnswer.elapsed_seconds.toFixed(1) + ' 秒' : '-'}</div>
        </div>
      </div>
    `;
  }

  const imagesHtml = (event.images && event.images.length > 0)
    ? `<div class="panel-images">
        ${event.images.slice(0, 3).map(img => `<img src="${img.url}" class="panel-thumb" onclick="openImageViewer('${img.url}')">`).join('')}
      </div>`
    : '';

  const descriptionHtml = event.description
    ? `<div class="panel-description">${escapeHtml(event.description)}</div>`
    : '';

  const tipsHtml = event.tips
    ? `<div class="panel-tips"><b>💡 提示:</b> ${escapeHtml(event.tips)}</div>`
    : '';

  const videoHtml = event.video_url
    ? `<div class="panel-media-item" onclick="openVideoPlayer('${escapeHtml(event.video_url)}')">
        <span style="color:#ffd700;">▶️ 观看视频</span>
      </div>`
    : '';

  const audioHtml = event.audio_url
    ? `<div class="panel-media-item" onclick="window.open('${escapeHtml(event.audio_url)}', '_blank')">
        🔗 打开音频
      </div>`
    : '';

  const preciseLocRate = stats.total_answers > 0
    ? (Math.round(((stats.total_precise_location || 0) / stats.total_answers) * 1000) / 10)
    : 0;
  const preciseTimeRate = stats.total_answers > 0
    ? (Math.round(((stats.total_precise_time || 0) / stats.total_answers) * 1000) / 10)
    : 0;

  content.innerHTML = `
    <div class="panel-content">
      <div class="panel-event-meta">
        <span class="panel-category">[${escapeHtml(event.category_name || '')}${event.sub_category_name ? ' / ' + escapeHtml(event.sub_category_name) : ''}]</span>
      </div>
      ${imagesHtml}
      ${descriptionHtml}
      ${tipsHtml}
      ${videoHtml}
      ${audioHtml}

      <div class="panel-info-block">
        <div class="panel-info-row">
          <span class="panel-info-label">📍 地点:</span>
          <span class="panel-info-value">${escapeHtml(event.location_name || '未知')}</span>
        </div>
        ${!locOnly ? `
        <div class="panel-info-row">
          <span class="panel-info-label">⏰ 时间:</span>
          <span class="panel-info-value">${timeRange}</span>
        </div>
        ` : ''}
      </div>

      <div class="panel-stats-grid">
        <div class="panel-stats-card">
          <div class="panel-stats-num">${stats.total_answers || 0}</div>
          <div class="panel-stats-label">总答题数</div>
        </div>
        <div class="panel-stats-card">
          <div class="panel-stats-num">${stats.avg_distance != null ? stats.avg_distance : '-'}</div>
          <div class="panel-stats-label">平均距离(${distanceUnit})</div>
        </div>
        ${!locOnly ? `
        <div class="panel-stats-card">
          <div class="panel-stats-num">${stats.avg_time_diff != null ? stats.avg_time_diff : '-'}</div>
          <div class="panel-stats-label">平均时间差(年)</div>
        </div>
        ` : ''}
        <div class="panel-stats-card">
          <div class="panel-stats-num">${stats.avg_elapsed != null ? stats.avg_elapsed : '-'}</div>
          <div class="panel-stats-label">平均耗时(秒)</div>
        </div>
        <div class="panel-stats-card precise-loc">
          <div class="panel-stats-num">${preciseLocRate}%</div>
          <div class="panel-stats-label">精准位置率(${stats.total_precise_location || 0}人)</div>
        </div>
        ${!locOnly ? `
        <div class="panel-stats-card precise-time">
          <div class="panel-stats-num">${preciseTimeRate}%</div>
          <div class="panel-stats-label">精准时间率(${stats.total_precise_time || 0}人)</div>
        </div>
        ` : ''}
      </div>

      ${myCompareHtml}

      <div class="answer-list-section">
        <div class="compare-title" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;">图例说明</div>
        <div class="legend-row">
          <span class="legend-dot" style="background:#00ff88;"></span>
          <span class="legend-text">正确答案</span>
          <span class="legend-dot" style="background:#4fc3f7;"></span>
          <span class="legend-text">我的答案</span>
          <span class="legend-dot" style="background:#ffd700;"></span>
          <span class="legend-text">他人精准</span>
          <span class="legend-dot" style="background:#ff6b6b;"></span>
          <span class="legend-text">他人未中</span>
        </div>
      </div>
    </div>
  `;
}
