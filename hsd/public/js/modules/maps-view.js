window.HSD = window.HSD || {};

HSD.mapsView = {
  async render(container) {
    if (!container) container = document.getElementById('main-view');
    HSD.mapCore.restoreLayout();

    const res = await API.get('/maps');
    if (res.success) HSD.state.maps = res.data;

    const cardsHtml = HSD.state.maps.map(map => {
      const isBound = (map.bind_count || 0) > 0;
      const bindSubsHtml = (map.bind_subs && map.bind_subs.length > 0) ?
        `<div class="map-bind-subs">
          <div class="bind-subs-title">🔗 已绑定的子类：</div>
          <div class="bind-subs-list">
            ${map.bind_subs.map(s => `<span class="bind-sub-tag">${escapeHtml(s.category_name)} / ${escapeHtml(s.name)}</span>`).join('')}
          </div>
        </div>` : '';

      return `
      <div class="map-card ${isBound ? 'map-card-bound' : ''}" data-id="${map.id}">
        <div class="map-preview">🗺️</div>
        <div class="map-card-header">
          <div>
            <div class="map-card-name">${escapeHtml(map.name)}</div>
            <div style="margin-top:4px;"><span class="map-card-code">${escapeHtml(map.code)}</span></div>
          </div>
          ${isBound ? '<span class="bound-tag">🔗 已绑定</span>' : '<span class="free-tag">✓ 完全编辑</span>'}
        </div>
        <div class="map-card-desc">${escapeHtml(map.description || '暂无描述')}</div>
        <div class="map-card-meta">
          <span>🧩 ${HSD.categoriesView.getTileTypeName(map.tile_type)}</span>
          <span>🔍 缩放:${map.min_zoom || 0}-${map.max_zoom || 18}</span>
          <span>🔗 绑定:${map.bind_count || 0} 个子类</span>
        </div>
        ${bindSubsHtml}
        <div class="map-card-actions">
          <button class="btn btn-default btn-sm" data-action="view" data-id="${map.id}">👁️ 查看</button>
          <button class="btn btn-default btn-sm" data-action="edit" data-id="${map.id}">✏️ 编辑</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${map.id}" ${isBound ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>🗑️</button>
        </div>
      </div>
    `}).join('');

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">🗺️ 地图管理</h2>
        <button class="btn btn-primary" id="add-map-btn">+ 新增地图</button>
      </div>
      <div class="info-panel" style="margin-bottom:16px;background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:16px;">
        <div style="font-weight:600;color:#2c5282;margin-bottom:10px;">📖 地图配置规范与说明</div>
        <div style="color:#2d3748;font-size:13px;line-height:1.8;">
          <div><strong>一、瓦片类型说明：</strong></div>
          <div>• <strong>🌐 OSM标准</strong>：开源地图，需外网访问</div>
          <div>• <strong>🛣️ 高德街道</strong>：国内常用街道图，需外网访问高德API</div>
          <div>• <strong>🛰️ 高德卫星</strong>：卫星影像图，需外网访问高德API</div>
          <div>• <strong>🎯 混合(推荐)</strong>：本地OSM瓦片(缩放2-3) + 高德街道(缩放4+)，兼顾离线可用和清晰度</div>
          <div>• <strong>⚙️ 自定义</strong>：自定义瓦片URL，适合特殊历史地图、中东史等定制地图</div>
          <div style="margin-top:10px;"><strong>二、如何添加「中东史」等自定义地图：</strong></div>
          <div>1. 点击右上角「+ 新增地图」按钮</div>
          <div>2. 填写地图代码（如：middle_east）、名称（如：中东地图）</div>
          <div>3. 选择瓦片类型：推荐「🎯 混合」用于通用区域地图</div>
          <div>4. 如需特定历史地图瓦片，选择「⚙️ 自定义」并填写瓦片URL模板（格式：https://{s}.domain.com/{z}/{x}/{y}.png）</div>
          <div>5. 设置合适的缩放范围（建议min=2, max=8~12）和排序</div>
          <div>6. 保存后，到「类别管理」中给对应子类绑定此新地图</div>
          <div style="margin-top:10px;"><strong>三、注意事项：</strong></div>
          <div>• 地图被子类绑定后：仅允许修改「描述、最小缩放、最大缩放、距离单位、距离倍率」</div>
          <div>• 地图被子类绑定后：名称、代码、瓦片配置、排序均无法修改，删除也被禁止</div>
          <div>• 建议设置合理的中心点（经纬度）和默认缩放级别，提升用户体验</div>
          <div>• 自定义瓦片服务需确保CORS跨域配置正确</div>
        </div>
      </div>
      <div style="margin-bottom:20px;padding:14px;background:#fffbeb;border-radius:8px;color:#78350f;font-size:13px;">
        ⚠️ <strong>注意：</strong>已有子类别绑定的地图<strong>仅允许修改：描述、最小/最大缩放、距离单位/倍率</strong>，其他字段（名称/代码/瓦片/排序）不可修改，且删除被禁止。
      </div>
      <div class="three-col-grid">${cardsHtml || '<div style="grid-column:span 3;text-align:center;padding:60px;color:#a0aec0;"><div style="font-size:48px;margin-bottom:16px;">🗺️</div>暂无地图，点击右上角「+ 新增地图」</div>'}</div>
    `;

    document.getElementById('add-map-btn').addEventListener('click', () => HSD.mapsView.openMapModal(null));

    container.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = HSD.state.maps.find(x => x.id == btn.dataset.id);
        if (m) HSD.mapsView.openMapModal(m, true);
      });
    });

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        const m = HSD.state.maps.find(x => x.id == btn.dataset.id);
        if (m) HSD.mapsView.openMapModal(m, false);
      });
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        const m = HSD.state.maps.find(x => x.id == btn.dataset.id);
        if (m) HSD.mapsView.confirmDeleteMap(m);
      });
    });
  },

  confirmDeleteMap(map) {
    confirmDialog(`确定要删除地图「${map.name}」吗？`, async () => {
      const res = await API.delete(`/maps/${map.id}`);
      if (res.success) {
        toast(res.message, 'success');
        HSD.mapsView.render();
      } else {
        toast(res.message, 'error');
      }
    });
  },

  openMapModal(map = null, isViewOnly = false) {
    const isEdit = map != null && !isViewOnly;
    const mode = isViewOnly ? '查看' : (isEdit ? '编辑' : '添加');
    const tileType = map?.tile_type || 'hybrid';
    const isBound = map && (map.bind_count || 0) > 0 && !isViewOnly;

    const nameDisabled = isViewOnly || isBound ? 'disabled' : '';
    const codeDisabled = isViewOnly || isEdit ? 'readonly' : '';
    const descDisabled = isViewOnly ? 'disabled' : '';
    const tileDisabled = isViewOnly || isBound ? 'disabled' : '';
    const zoomDisabled = isViewOnly ? 'disabled' : '';
    const sortDisabled = isViewOnly || isBound ? 'disabled' : '';
    const distDisabled = isViewOnly ? 'disabled' : '';

    const html = `
      <div class="modal-overlay" id="map-modal">
        <div class="modal" style="max-width:650px;max-height:90vh;overflow-y:auto;">
          <div class="modal-header">
            <div class="modal-title">${mode}地图</div>
            <button class="modal-close" onclick="document.getElementById('map-modal').remove();">&times;</button>
          </div>
          <div class="modal-body">
            ${isBound ?
              `<div class="disabled-hint">⚠️ 该地图已绑定 ${map.bind_count} 个子类别，仅允许修改：描述、最小缩放、最大缩放、距离单位、距离倍率</div>` : ''}
            ${isViewOnly ? `<div class="disabled-hint" style="background:#ebf8ff;color:#2c5282;">🔍 查看模式，内容不可编辑</div>` : ''}
            <div class="form-grid">
              <div>
                <label class="form-label">地图名称 *</label>
                <input class="form-control" id="map-name" value="${map ? escapeHtml(map.name) : ''}" placeholder="如：世界地图" ${nameDisabled}>
              </div>
              <div>
                <label class="form-label">地图代码 *</label>
                <input class="form-control" id="map-code" value="${map ? escapeHtml(map.code) : ''}" placeholder="如：world（英文唯一）" ${codeDisabled}>
              </div>
            </div>
            <div style="margin-top:14px;">
              <label class="form-label">描述</label>
              <textarea class="form-control" id="map-desc" rows="2" ${descDisabled}>${map ? escapeHtml(map.description || '') : ''}</textarea>
            </div>
            <div style="margin-top:14px;">
              <label class="form-label">瓦片类型</label>
              <div class="tile-type-options" id="tile-type-options">
                <div class="tile-type-option ${tileType === 'osm' ? 'selected' : ''} ${tileDisabled ? 'disabled-option' : ''}" data-type="osm">🌐 OSM标准</div>
                <div class="tile-type-option ${tileType === 'amap_street' ? 'selected' : ''} ${tileDisabled ? 'disabled-option' : ''}" data-type="amap_street">🛣️ 高德街道</div>
                <div class="tile-type-option ${tileType === 'amap_satellite' ? 'selected' : ''} ${tileDisabled ? 'disabled-option' : ''}" data-type="amap_satellite">🛰️ 高德卫星</div>
                <div class="tile-type-option ${tileType === 'hybrid' ? 'selected' : ''} ${tileDisabled ? 'disabled-option' : ''}" data-type="hybrid">🎯 混合(推荐)</div>
                <div class="tile-type-option ${tileType === 'custom' ? 'selected' : ''} ${tileDisabled ? 'disabled-option' : ''}" data-type="custom">⚙️ 自定义</div>
              </div>
            </div>
            <div class="form-grid" style="margin-top:14px;">
              <div>
                <label class="form-label">最小缩放</label>
                <input class="form-control" type="number" min="0" max="18" id="map-min-zoom" value="${map ? (map.min_zoom || 0) : 2}" ${zoomDisabled}>
              </div>
              <div>
                <label class="form-label">最大缩放</label>
                <input class="form-control" type="number" min="0" max="18" id="map-max-zoom" value="${map ? (map.max_zoom || 18) : 8}" ${zoomDisabled}>
              </div>
              <div>
                <label class="form-label">排序</label>
                <input class="form-control" type="number" id="map-sort" value="${map ? (map.sort_order || 0) : 0}" ${sortDisabled}>
              </div>
            </div>
            <div class="form-grid" style="margin-top:14px;">
              <div>
                <label class="form-label">距离单位</label>
                <input class="form-control" id="map-distance-unit" value="${map && map.distance_unit ? escapeHtml(map.distance_unit) : 'km'}" placeholder="如：km、米、光年、天文单位" ${distDisabled}>
              </div>
              <div>
                <label class="form-label">距离倍率</label>
                <input class="form-control" type="number" step="any" id="map-distance-scale" value="${map && map.distance_scale != null ? map.distance_scale : 1}" placeholder="如：1、3、0.001" ${distDisabled}>
              </div>
            </div>
            <div id="custom-tile-fields" style="margin-top:14px;display:${tileType === 'custom' ? '' : 'none'};">
              <div style="font-weight:600;color:#2d3748;margin-bottom:8px;">⚙️ 自定义瓦片配置</div>
              <div class="form-grid">
                <div style="grid-column:span 2;">
                  <label class="form-label">瓦片URL模板</label>
                  <input class="form-control" id="map-tile-url" value="${map && map.tile_url ? escapeHtml(map.tile_url) : ''}" placeholder="https://{s}.tile.example.com/{z}/{x}/{y}.png" ${tileDisabled}>
                </div>
                <div>
                  <label class="form-label">子域名（逗号分隔）</label>
                  <input class="form-control" id="map-tile-sd" value="${map && map.tile_subdomains ? escapeHtml(map.tile_subdomains) : 'a,b,c'}" placeholder="a,b,c" ${tileDisabled}>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" onclick="document.getElementById('map-modal').remove();">关闭</button>
            ${!isViewOnly ? '<button class="btn btn-primary" id="save-map-btn">保存</button>' : ''}
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    let selectedTileType = tileType;
    document.querySelectorAll('#tile-type-options .tile-type-option').forEach(opt => {
      if (isViewOnly || isBound) return;
      opt.addEventListener('click', () => {
        document.querySelectorAll('#tile-type-options .tile-type-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedTileType = opt.dataset.type;
        document.getElementById('custom-tile-fields').style.display = selectedTileType === 'custom' ? '' : 'none';
      });
    });

    const saveBtn = document.getElementById('save-map-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('map-name').value.trim();
        const code = document.getElementById('map-code').value.trim();
        const description = document.getElementById('map-desc').value.trim() || null;
        const min_zoom = parseInt(document.getElementById('map-min-zoom').value) || 0;
        const max_zoom = parseInt(document.getElementById('map-max-zoom').value) || 18;
        const sort_order = parseInt(document.getElementById('map-sort').value) || 0;
        const distance_unit = document.getElementById('map-distance-unit').value.trim() || 'km';
        const distance_scale = parseFloat(document.getElementById('map-distance-scale').value);
        let tile_url = document.getElementById('map-tile-url').value.trim() || null;
        let tile_subdomains = document.getElementById('map-tile-sd').value.trim() || null;

        if (!name || !code) { toast('请填写名称和代码', 'error'); return; }

        const data = { name, code, description, tile_type: selectedTileType, min_zoom, max_zoom, sort_order, distance_unit, distance_scale: isNaN(distance_scale) ? 1 : distance_scale };
        if (selectedTileType === 'custom') {
          data.tile_url = tile_url;
          data.tile_subdomains = tile_subdomains;
        }

        let res;
        if (isEdit) {
          res = await API.put(`/maps/${map.id}`, data);
        } else {
          res = await API.post('/maps', data);
        }

        if (res.success) {
          toast(res.message, 'success');
          document.getElementById('map-modal').remove();
          HSD.mapsView.render();
        } else {
          toast(res.message, 'error');
        }
      });
    }
  }
};
