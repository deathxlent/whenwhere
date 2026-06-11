let state = {
  categories: [],
  currentCategory: null,
  currentSubCategory: null,
  currentEvents: []
};

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
  setBreadcrumb('首页');
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
        <button class="btn btn-primary" id="enter-btn" disabled>进入维护</button>
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
      renderEventList();
    }
  });
}

async function renderEventList() {
  const cat = state.currentCategory;
  const sub = state.currentSubCategory;
  setBreadcrumb(`首页 / ${cat.name} / ${sub.name} / 列表`);

  document.getElementById('main-view').innerHTML = `
    <div class="page-header">
      <div>
        <span class="back-link" id="back-btn">← 返回首页</span>
        <h2 class="page-title" style="margin-top:8px;">${cat.name} - ${sub.name}</h2>
      </div>
      <button class="btn btn-success" id="add-btn">+ 添加事件</button>
    </div>
    <div class="table-container" id="list-container">
      <div style="text-align:center;padding:40px;color:#718096;">加载中...</div>
    </div>
  `;

  document.getElementById('back-btn').addEventListener('click', renderMainView);
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
        <p>点击右上角"添加事件"按钮开始录入数据</p>
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
          <th>地点坐标</th>
          <th>地点名称</th>
          <th>图片</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${res.data.map(event => `
          <tr>
            <td><strong>${escapeHtml(event.title)}</strong></td>
            <td>${escapeHtml(event.start_date || '-')}</td>
            <td>${escapeHtml(event.end_date || '-')}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(event.description || '')}">${escapeHtml(event.description || '-')}</td>
            <td>
              ${event.location_lat && event.location_lng 
                ? `<span class="badge badge-info">${Number(event.location_lat).toFixed(4)}, ${Number(event.location_lng).toFixed(4)}</span>`
                : '<span class="badge badge-gray">-</span>'}
            </td>
            <td>${escapeHtml(event.location_name || '-')}</td>
            <td><span class="badge ${event.image_count > 0 ? 'badge-info' : 'badge-gray'}">${event.image_count} 张</span></td>
            <td class="actions">
              <button class="btn btn-sm btn-warning" data-action="images" data-id="${event.id}">图片管理</button>
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
            <input type="text" class="form-control" id="f-start" value="${escapeHtml(event?.start_date || '')}" placeholder="例：公元前221年 或 2024-01-01">
          </div>
          <div class="form-group">
            <label class="form-label">结束时间</label>
            <input type="text" class="form-control" id="f-end" value="${escapeHtml(event?.end_date || '')}" placeholder="留空表示持续中">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">说明</label>
          <textarea class="form-control" id="f-desc" placeholder="事件详细说明...">${escapeHtml(event?.description || '')}</textarea>
        </div>
        <div class="location-row">
          <div class="form-group">
            <label class="form-label">纬度</label>
            <input type="number" step="any" class="form-control" id="f-lat" value="${event?.location_lat ?? ''}" placeholder="如：39.9042">
          </div>
          <div class="form-group">
            <label class="form-label">经度</label>
            <input type="number" step="any" class="form-control" id="f-lng" value="${event?.location_lng ?? ''}" placeholder="如：116.4074">
          </div>
          <div class="form-group">
            <label class="form-label">地点名称</label>
            <input type="text" class="form-control" id="f-locname" value="${escapeHtml(event?.location_name || '')}" placeholder="如：北京天安门">
          </div>
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
  `);

  document.getElementById('save-btn').addEventListener('click', async () => {
    const data = {
      category_id: state.currentCategory.id,
      sub_category_id: state.currentSubCategory.id,
      title: document.getElementById('f-title').value.trim(),
      start_date: document.getElementById('f-start').value.trim() || null,
      end_date: document.getElementById('f-end').value.trim() || null,
      description: document.getElementById('f-desc').value.trim() || null,
      location_lat: document.getElementById('f-lat').value || null,
      location_lng: document.getElementById('f-lng').value || null,
      location_name: document.getElementById('f-locname').value.trim() || null,
      sort_order: parseInt(document.getElementById('f-sort').value) || 0
    };

    if (!data.title) {
      toast('请输入事件名称', 'error');
      return;
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
      loadEvents();
    } else {
      toast(res.message, 'error');
    }
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
