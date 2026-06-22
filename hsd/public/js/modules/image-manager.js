window.HSD = window.HSD || {};

HSD.imageManager = {
  imageToReplaceId: null,

  async open(event) {
    HSD.state.currentEditingEvent = event;
    document.getElementById('breadcrumb-text').textContent = `首页 / ${HSD.state.currentCategory.name} / ${HSD.state.currentSubCategory.name} / ${event.title} / 图片管理`;

    document.getElementById('main-view').innerHTML = `
      <div class="page-header">
        <div>
          <span class="back-link" id="back-btn">← 返回列表</span>
          <h2 class="page-title" style="margin-top:8px;">图片管理 - ${escapeHtml(event.title)}</h2>
        </div>
      </div>
      <div class="table-container" style="padding:24px;">
        <div class="image-manager-tabs">
          <button type="button" class="img-mgr-tab active" data-tab="upload">📤 上传图片</button>
          <button type="button" class="img-mgr-tab" data-tab="url">🔗 添加URL图片</button>
        </div>
        <div class="img-mgr-tab-panel" id="img-mgr-upload-panel">
          <div class="image-upload-area" id="upload-area">
            <div style="font-size:40px;">📤</div>
            <p>点击或拖拽图片到此处上传</p>
            <p style="font-size:12px;color:#a0aec0;margin-top:4px;">支持 JPG、PNG、GIF、WEBP、BMP 格式，单张最大 10MB，一次最多上传 20 张</p>
            <input type="file" id="file-input" accept="image/*" multiple style="display:none;">
          </div>
        </div>
        <div class="img-mgr-tab-panel" id="img-mgr-url-panel" style="display:none;">
          <div class="image-url-input">
            <input type="url" class="form-control" id="mgr-image-url" placeholder="粘贴图片URL (http://或https://开头)" style="max-width:100%;">
            <input type="text" class="form-control" id="mgr-image-name" placeholder="图片名称（可选）" style="max-width:100%;margin-top:8px;">
            <button class="btn btn-primary" id="mgr-add-url-btn" style="margin-top:8px;">+ 添加URL图片</button>
          </div>
        </div>
        <div id="images-container">
          <div style="text-align:center;padding:30px;color:#718096;">加载中...</div>
        </div>
      </div>
      <input type="file" id="replace-file-input" accept="image/*" style="display:none;">
    `;

    document.getElementById('back-btn').addEventListener('click', () => HSD.eventList.render());

    document.querySelectorAll('.img-mgr-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.img-mgr-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById('img-mgr-upload-panel').style.display = tabName === 'upload' ? '' : 'none';
        document.getElementById('img-mgr-url-panel').style.display = tabName === 'url' ? '' : 'none';
      });
    });

    document.getElementById('mgr-add-url-btn').addEventListener('click', async () => {
      const urlInput = document.getElementById('mgr-image-url');
      const nameInput = document.getElementById('mgr-image-name');
      const url = urlInput.value.trim();
      const name = nameInput.value.trim();

      if (!url) { toast('请输入图片URL', 'error'); return; }
      if (!/^https?:\/\//i.test(url)) { toast('URL必须以http://或https://开头', 'error'); return; }

      const res = await API.post('/images/add-url', { event_id: event.id, url, name });
      if (res.success) {
        toast(res.message, 'success');
        urlInput.value = '';
        nameInput.value = '';
        HSD.imageManager.loadImages(event.id);
      } else {
        toast(res.message, 'error');
      }
    });

    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const replaceFileInput = document.getElementById('replace-file-input');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        HSD.imageManager.uploadImages(event.id, e.dataTransfer.files);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        HSD.imageManager.uploadImages(event.id, e.target.files);
      }
    });

    replaceFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        const file = e.target.files[0];
        HSD.imageManager.replaceImageHandler(file);
        replaceFileInput.value = '';
      }
    });

    await HSD.imageManager.loadImages(event.id);
  },

  replaceImageHandler(file) {
    if (!HSD.imageManager.imageToReplaceId || !HSD.state.currentEditingEvent) return;

    const eventId = HSD.state.currentEditingEvent.id;
    const oldImgId = HSD.imageManager.imageToReplaceId;
    HSD.imageManager.imageToReplaceId = null;

    if (!file || !file.type.startsWith('image/')) {
      toast('请选择有效的图片文件', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('images', file);

    toast('正在替换图片...', 'info');

    (async () => {
      try {
        const uploadRes = await API.upload('/images/upload', formData);
        if (!uploadRes.success) {
          toast('上传失败: ' + uploadRes.message, 'error');
          return;
        }

        const delRes = await API.delete(`/images/${oldImgId}`);
        if (!delRes.success) {
          toast('旧图片删除失败，但新图片已上传', 'warning');
        } else {
          toast('替换成功', 'success');
        }

        HSD.imageManager.loadImages(eventId);
      } catch (e) {
        toast('替换失败: ' + e.message, 'error');
      }
    })();
  },

  async loadImages(eventId) {
    const container = document.getElementById('images-container');
    const res = await API.get(`/images/event/${eventId}`);

    if (!res.success) {
      container.innerHTML = `<div style="text-align:center;padding:30px;color:#e53e3e;">加载失败</div>`;
      return;
    }

    HSD.state.currentImages = res.data;

    if (res.data.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:30px;">
          <div class="empty-state-icon">🖼️</div>
          <h3>暂无图片</h3>
          <p style="margin-top:8px;font-size:13px;">请上传或添加URL图片（至少一张）</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="images-grid">
        ${res.data.map(img => {
          const isUrl = img.file_path && (img.file_path.startsWith('http://') || img.file_path.startsWith('https://'));
          return `
          <div class="image-card">
            <img src="${img.url}" alt="${escapeHtml(img.original_name || '')}">
            ${isUrl ? '<div class="url-image-tag">URL</div>' : ''}
            ${!isUrl ? `<button class="image-card-replace" data-id="${img.id}" title="替换">⟳</button>` : ''}
            <button class="image-card-delete" data-id="${img.id}" title="删除">×</button>
            <div class="image-card-info">
              <div class="image-card-name">${escapeHtml(img.original_name || img.filename)}</div>
            </div>
          </div>
        `}).join('')}
      </div>
    `;

    container.querySelectorAll('.image-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const imgId = parseInt(btn.dataset.id);
        if (HSD.state.currentImages && HSD.state.currentImages.length <= 1) {
          toast('至少需要保留一张图片（上传或URL均可）', 'error');
          return;
        }
        confirmDialog('确定删除这张图片吗？', async () => {
          const delRes = await API.delete(`/images/${imgId}`);
          if (delRes.success) {
            toast(delRes.message, 'success');
            HSD.imageManager.loadImages(eventId);
          } else {
            toast(delRes.message, 'error');
          }
        });
      });
    });

    container.querySelectorAll('.image-card-replace').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        HSD.imageManager.imageToReplaceId = parseInt(btn.dataset.id);
        document.getElementById('replace-file-input').click();
      });
    });
  },

  async uploadImages(eventId, files) {
    const formData = new FormData();
    formData.append('event_id', eventId);
    Array.from(files).forEach(f => formData.append('images', f));

    toast('正在上传...', 'info');
    const res = await API.upload('/images/upload', formData);

    if (res.success) {
      toast(res.message, 'success');
      HSD.imageManager.loadImages(eventId);
    } else {
      toast(res.message, 'error');
    }
  }
};
