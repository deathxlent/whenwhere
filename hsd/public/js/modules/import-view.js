window.HSD = window.HSD || {};

HSD.importView = {
  render(container) {
    if (!container) container = document.getElementById('main-view');
    const breadcrumb = document.getElementById('breadcrumb-text');
    if (breadcrumb) breadcrumb.textContent = '数据导入';
    HSD.mapCore.restoreLayout();

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">📥 数据导入</h2>
      </div>

      <div class="info-panel" style="margin-bottom:20px;background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:16px;">
        <div style="font-weight:600;color:#2c5282;margin-bottom:10px;">📖 导入说明</div>
        <div style="color:#2d3748;font-size:13px;line-height:1.8;">
          <div><strong>导入规则：</strong></div>
          <div>• <strong>地图</strong>：按编码或同名同配置判断，已存在则跳过</div>
          <div>• <strong>一二级分类</strong>：按编码或同名同配置判断，已存在则跳过</div>
          <div>• <strong>事件</strong>：全部作为新事件导入，不覆盖</div>
          <div>• <strong>瓦片/图片</strong>：文件已存在则跳过</div>
          <div style="margin-top:10px;"><strong>注意事项：</strong></div>
          <div>• 导入的 ZIP 文件来自 adddatatools 的导出功能</div>
          <div>• 导入过程中请勿关闭页面</div>
        </div>
      </div>

      <div class="import-container" style="max-width:600px;margin:0 auto;">
        <div class="import-drop-area" id="import-drop-area" style="border:2px dashed #cbd5e0;border-radius:12px;padding:60px 20px;text-align:center;cursor:pointer;transition:all 0.2s;">
          <div style="font-size:64px;margin-bottom:16px;">📦</div>
          <h3 style="margin-bottom:8px;color:#2d3748;">点击或拖拽 ZIP 文件到此处</h3>
          <p style="color:#718096;font-size:13px;">支持从 adddatatools 导出的事件 ZIP 文件</p>
          <input type="file" id="import-file-input" accept=".zip" style="display:none;">
        </div>

        <div id="import-progress" style="margin-top:20px;display:none;">
          <div style="padding:12px;background:#f7fafc;border-radius:8px;text-align:center;">
            <span id="import-progress-text">正在导入...</span>
          </div>
        </div>

        <div id="import-result" style="margin-top:20px;display:none;">
          <div class="result-card" style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin-bottom:16px;">导入结果</h4>
            <div id="import-result-content"></div>
          </div>
        </div>
      </div>
    `;

    const dropArea = document.getElementById('import-drop-area');
    const fileInput = document.getElementById('import-file-input');

    dropArea.addEventListener('click', () => fileInput.click());

    dropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = '#3182ce';
      dropArea.style.backgroundColor = '#ebf8ff';
    });

    dropArea.addEventListener('dragleave', () => {
      dropArea.style.borderColor = '#cbd5e0';
      dropArea.style.backgroundColor = 'transparent';
    });

    dropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dropArea.style.borderColor = '#cbd5e0';
      dropArea.style.backgroundColor = 'transparent';
      if (e.dataTransfer.files.length > 0) {
        HSD.importView.handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        HSD.importView.handleFile(e.target.files[0]);
      }
      e.target.value = '';
    });
  },

  async handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast('请选择 ZIP 文件', 'error');
      return;
    }

    const progressDiv = document.getElementById('import-progress');
    const resultDiv = document.getElementById('import-result');
    const progressText = document.getElementById('import-progress-text');
    const resultContent = document.getElementById('import-result-content');

    progressDiv.style.display = 'block';
    resultDiv.style.display = 'none';
    progressText.textContent = `正在导入 ${file.name}...`;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await API.upload('/import/zip', formData);

      progressDiv.style.display = 'none';

      if (res.success) {
        toast(res.message, 'success');
        resultDiv.style.display = 'block';

        const r = res.results;
        let html = `
          <div style="margin-bottom:12px;padding:10px;background:#f0fff4;border-radius:6px;">
            <strong>✅ ${res.message}</strong>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr style="background:#f7fafc;">
                <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0;">类型</th>
                <th style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;">成功</th>
                <th style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;">跳过</th>
                <th style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;">失败</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">🗺️ 地图</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#38a169;"><strong>${r.maps.success}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#d69e2e;"><strong>${r.maps.skipped}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#e53e3e;"><strong>${r.maps.failed}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">📂 一级分类</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#38a169;"><strong>${r.categories.success}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#d69e2e;"><strong>${r.categories.skipped}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#e53e3e;"><strong>${r.categories.failed}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">📁 二级分类</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#38a169;"><strong>${r.sub_categories.success}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#d69e2e;"><strong>${r.sub_categories.skipped}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#e53e3e;"><strong>${r.sub_categories.failed}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">📋 事件</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#38a169;"><strong>${r.events.success}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;">-</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#e53e3e;"><strong>${r.events.failed}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">🧩 瓦片文件</td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#38a169;"><strong>${r.tiles.copied}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;color:#d69e2e;"><strong>${r.tiles.skipped}</strong></td>
                <td style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0;">-</td>
              </tr>
              <tr>
                <td style="padding:8px;">🖼️ 图片文件</td>
                <td style="text-align:center;padding:8px;color:#38a169;"><strong>${r.images.copied}</strong></td>
                <td style="text-align:center;padding:8px;color:#d69e2e;"><strong>${r.images.skipped}</strong></td>
                <td style="text-align:center;padding:8px;">-</td>
              </tr>
            </tbody>
          </table>
        `;

        const allErrors = [
          ...r.maps.errors,
          ...r.categories.errors,
          ...r.sub_categories.errors,
          ...r.events.errors
        ];

        if (allErrors.length > 0) {
          html += `
            <div style="margin-top:16px;">
              <h5 style="margin-bottom:8px;color:#4a5568;">详细信息：</h5>
              <div style="max-height:200px;overflow-y:auto;background:#f7fafc;border-radius:6px;padding:8px;font-size:12px;font-family:monospace;">
                ${allErrors.map(e => `<div style="padding:4px 0;border-bottom:1px solid #edf2f7;">${escapeHtml(e)}</div>`).join('')}
              </div>
            </div>
          `;
        }

        resultContent.innerHTML = html;
      } else {
        toast(res.message, 'error');
        resultDiv.style.display = 'block';
        resultContent.innerHTML = `
          <div style="padding:12px;background:#fff5f5;border-radius:6px;color:#742a2a;">
            <strong>❌ 导入失败：</strong>${escapeHtml(res.message)}
          </div>
        `;
      }
    } catch (e) {
      progressDiv.style.display = 'none';
      toast('导入出错：' + e.message, 'error');
    }
  }
};
