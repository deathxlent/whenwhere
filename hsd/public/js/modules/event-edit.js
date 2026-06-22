window.HSD = window.HSD || {};

HSD.eventEdit = {
  showForm(event = null) {
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
          <div class="form-group" style="margin-bottom:8px;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" id="f-location-only" style="width:16px;height:16px;" ${isEdit && event.location_only ? 'checked' : ''}>
              仅猜测地点（不猜时间）
            </label>
          </div>
          <div class="form-row" id="modal-time-section">
            <div class="form-group" id="modal-start-time-group">
              <label class="form-label">开始时间</label>
              <div class="era-toggle" id="modal-start-era">
                <button type="button" class="era-toggle-btn ${!startParts.isBce ? 'active' : ''}" data-era="ce">公元</button>
                <button type="button" class="era-toggle-btn ${startParts.isBce ? 'active' : ''}" data-era="bce">公元前</button>
              </div>
              <div class="date-picker-group">
                <div class="form-group year-field">
                  <input type="number" class="form-control" id="f-start-year" placeholder="年" min="1" value="${startParts.year}">
                </div>
                <div class="form-group" id="modal-start-month-group">
                  <input type="number" class="form-control" id="f-start-month" placeholder="月" min="1" max="12" value="${startParts.month}">
                </div>
                <div class="form-group" id="modal-start-day-group">
                  <input type="number" class="form-control" id="f-start-day" placeholder="日" min="1" max="31" value="${startParts.day}">
                </div>
              </div>
              <div class="date-precision-row" id="modal-start-precision-row">
                <button type="button" class="date-precision-btn ${isEdit && event.start_precision === 0 ? 'active' : ''}" data-precision="0">仅年</button>
                <button type="button" class="date-precision-btn ${isEdit && event.start_precision === 1 ? 'active' : ''}" data-precision="1">年月</button>
                <button type="button" class="date-precision-btn ${(!isEdit || event.start_precision === 2) ? 'active' : ''}" data-precision="2">年月日</button>
              </div>
            </div>
            <div class="form-group" id="modal-end-time-group">
              <div class="form-label-row">
                <label class="form-label">结束时间</label>
                <button type="button" class="sync-btn" id="modal-sync-end-btn">⟳ 同步开始</button>
              </div>
              <div class="era-toggle" id="modal-end-era">
                <button type="button" class="era-toggle-btn ${!endParts.isBce ? 'active' : ''}" data-era="ce">公元</button>
                <button type="button" class="era-toggle-btn ${endParts.isBce ? 'active' : ''}" data-era="bce">公元前</button>
              </div>
              <div class="date-picker-group">
                <div class="form-group year-field">
                  <input type="number" class="form-control" id="f-end-year" placeholder="年" min="1" value="${endParts.year}">
                </div>
                <div class="form-group" id="modal-end-month-group">
                  <input type="number" class="form-control" id="f-end-month" placeholder="月" min="1" max="12" value="${endParts.month}">
                </div>
                <div class="form-group" id="modal-end-day-group">
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
          <div class="form-group">
            <label class="form-label">小贴士</label>
            <textarea class="form-control" id="f-tips" placeholder="小贴士（猜图时显示，非必填）">${escapeHtml(event?.tips || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">视频URL</label>
            <input type="text" class="form-control" id="f-video-url" value="${escapeHtml(event?.video_url || '')}" placeholder="支持优酷、bilibili链接">
            <div class="form-hint">仅支持 youku.com / bilibili.com / b23.tv 链接</div>
          </div>
          <div class="form-group">
            <label class="form-label">音频URL</label>
            <input type="text" class="form-control" id="f-audio-url" value="${escapeHtml(event?.audio_url || '')}" placeholder="支持QQ音乐、网易云音乐或.mp3链接">
            <div class="form-hint">支持 y.qq.com / music.163.com / .mp3 结尾的链接</div>
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
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">纬度2（框选右下角）</label>
              <input type="number" step="any" class="form-control" id="f-lat2" value="${event?.location_lat2 ?? ''}" placeholder="留空表示选点">
            </div>
            <div class="form-group">
              <label class="form-label">经度2（框选右下角）</label>
              <input type="number" step="any" class="form-control" id="f-lng2" value="${event?.location_lng2 ?? ''}" placeholder="留空表示选点">
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

    HSD.eventForm.initEraToggle('modal-start-era');
    HSD.eventForm.initEraToggle('modal-end-era');
    HSD.eventForm.initModalPrecisionRow('modal-start-precision-row', 'modal-start-month-group', 'modal-start-day-group');
    HSD.eventForm.initModalPrecisionRow('modal-end-precision-row', 'modal-end-month-group', 'modal-end-day-group');
    HSD.eventForm.bindDateFieldBounds('f-start-month', 'f-start-day');
    HSD.eventForm.bindDateFieldBounds('f-end-month', 'f-end-day');

    document.getElementById('modal-sync-end-btn').addEventListener('click', () => {
      HSD.eventForm.syncEndFromStart({
        startYearId: 'f-start-year',
        startMonthId: 'f-start-month',
        startDayId: 'f-start-day',
        startEraId: 'modal-start-era',
        startPrecisionRowId: 'modal-start-precision-row',
        endYearId: 'f-end-year',
        endMonthId: 'f-end-month',
        endDayId: 'f-end-day',
        endEraId: 'modal-end-era',
        endPrecisionRowId: 'modal-end-precision-row',
        endMonthGroupId: 'modal-end-month-group',
        endDayGroupId: 'modal-end-day-group'
      });
    });

    document.getElementById('f-location-only').addEventListener('change', (e) => {
      const disabled = e.target.checked;
      const timeSection = document.getElementById('modal-time-section');
      if (timeSection) {
        timeSection.style.opacity = disabled ? '0.4' : '1';
        timeSection.style.pointerEvents = disabled ? 'none' : '';
      }
    });

    if (isEdit && event.location_only) {
      const timeSection = document.getElementById('modal-time-section');
      if (timeSection) {
        timeSection.style.opacity = '0.4';
        timeSection.style.pointerEvents = 'none';
      }
    }

    document.getElementById('save-btn').addEventListener('click', async () => {
      const locationOnly = document.getElementById('f-location-only').checked;

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
        category_id: HSD.state.currentCategory.id,
        sub_category_id: HSD.state.currentSubCategory.id,
        title: document.getElementById('f-title').value.trim(),
        start_ts: startTs,
        start_precision: startTs !== null ? startPrecision : 0,
        end_ts: endTs,
        end_precision: endPrecision,
        description: document.getElementById('f-desc').value.trim() || null,
        tips: document.getElementById('f-tips').value.trim() || null,
        location_lat: document.getElementById('f-lat').value || null,
        location_lng: document.getElementById('f-lng').value || null,
        location_lat2: document.getElementById('f-lat2').value || null,
        location_lng2: document.getElementById('f-lng2').value || null,
        location_only: document.getElementById('f-location-only').checked,
        location_name: document.getElementById('f-locname').value.trim() || null,
        sort_order: parseInt(document.getElementById('f-sort').value) || 0,
        video_url: document.getElementById('f-video-url').value.trim() || null,
        audio_url: document.getElementById('f-audio-url').value.trim() || null
      };

      if (!data.title) { toast('请输入事件名称', 'error'); return; }

      if (!isEdit) {
        const hasTips = !!(data.tips && data.tips.trim());
        const hasVideo = !!(data.video_url && data.video_url.trim());
        const hasAudio = !!(data.audio_url && data.audio_url.trim());
        if (!hasTips && !hasVideo && !hasAudio) {
          toast('提示(tips)、视频URL、音频URL 至少需要填写一项（如需添加图片请使用「地图添加」模式）', 'error');
          return;
        }
      }

      let res;
      if (isEdit) {
        res = await API.put(`/events/${event.id}`, data);
      } else {
        res = await API.post('/events', data);
      }

      if (res.success) {
        toast(res.message, 'success');
        closeModal();
        HSD.eventList.loadEvents();
      } else {
        toast(res.message, 'error');
      }
    });
  }
};
