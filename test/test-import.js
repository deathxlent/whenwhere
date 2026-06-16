const http = require('http');
const fs = require('fs');
const path = require('path');

const zipPath = path.join(__dirname, 'adddata_export_2026-06-16T03-14-32.zip');

function testImport() {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
  const fileData = fs.readFileSync(zipPath);
  const fileName = path.basename(zipPath);

  const preamble = `------${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/zip\r\n\r\n`;
  const postamble = `\r\n------${boundary}--\r\n`;

  const totalLength = Buffer.byteLength(preamble) + fileData.length + Buffer.byteLength(postamble);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/import/zip',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=----${boundary}`,
      'Content-Length': totalLength
    }
  };

  console.log(`正在上传 ${fileName} (${(fileData.length / 1024 / 1024).toFixed(2)} MB)...`);

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('\n=== 导入结果 ===');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
          console.log('\n✅ 导入成功！');
          const r = result.results;
          console.log(`地图: ${r.maps.success} 成功, ${r.maps.skipped} 跳过, ${r.maps.failed} 失败`);
          console.log(`一级分类: ${r.categories.success} 成功, ${r.categories.skipped} 跳过, ${r.categories.failed} 失败`);
          console.log(`二级分类: ${r.sub_categories.success} 成功, ${r.sub_categories.skipped} 跳过, ${r.sub_categories.failed} 失败`);
          console.log(`事件: ${r.events.success} 成功, ${r.events.failed} 失败`);
          console.log(`瓦片: ${r.tiles.copied} 复制, ${r.tiles.skipped} 跳过`);
          console.log(`图片: ${r.images.copied} 复制, ${r.images.skipped} 跳过`);
        } else {
          console.log('\n❌ 导入失败：', result.message);
        }
      } catch (e) {
        console.error('解析响应失败:', e.message);
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('请求失败:', e.message);
  });

  req.write(preamble);
  req.write(fileData);
  req.write(postamble);
  req.end();
}

testImport();