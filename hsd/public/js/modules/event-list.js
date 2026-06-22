window.HSD = window.HSD || {};

HSD.eventList = {
  async render() {
    HSD.state.currentView = 'list';
    const cat = HSD.state.currentCategory;
    const sub = HSD.state.currentSubCategory;
    document.getElementById('breadcrumb-text').textContent = `首页 / ${cat.name} / ${sub.name} / 列表`;
    HSD.mapCore.restoreLayout();

    document.getElementById('main-view').innerHTML = `
      <div class="page-header">
        <div>
          <span class="back-link" id="back-btn">← 返回首页</span>
          <h2 class="page-title" style="margin-top:8px;">${cat.name} - ${sub.name}</h2>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" id="add-map-btn">🗺️ 地图添加</button>
        </div>
      </div>
      <div class="table-container" id="list-container">
        <div style="text-align:center;padding:40px;color:#718096;">加载中...</div>
      </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => HSD.mapCore.renderMainView());
    document.getElementById('add-map-btn').addEventListener('click', () => HSD.mapCore.renderMapView());

    await HSD.eventList.loadEvents();
  },

  async loadEvents() {
    const res = await API.get(`/events?category_id=${HSD.state.currentCategory.id}&sub_category_id=${HSD.state.currentSubCategory.id}`);
    const container = document.getElementById('list-container');

    if (!res.success) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#e53e3e;">加载失败: ${res.message}</div>`;
      return;
    }

    HSD.state.currentEvents = res.data;

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
        const event = HSD.state.currentEvents.find(e => e.id === id);
        if (action === 'edit') HSD.eventEdit.showForm(event);
        else if (action === 'delete') HSD.eventList.deleteEvent(event);
        else if (action === 'images') HSD.imageManager.open(event);
      });
    });
  },

  deleteEvent(event) {
    confirmDialog(
      `确定要删除事件「${event.title}」吗？`,
      async () => {
        const res = await API.delete(`/events/${event.id}`);
        if (res.success) {
          toast(res.message, 'success');
          HSD.eventList.loadEvents();
        } else {
          toast(res.message, 'error');
        }
      },
      '该操作同时删除关联的图片记录'
    );
  }
};
