const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const zipPath = path.join(__dirname, '..', 'test', 'adddata_export_2026-06-16T03-14-32.zip');
const extractPath = path.join(__dirname, '..', 'test', 'extract_test');

if (!fs.existsSync(extractPath)) {
  fs.mkdirSync(extractPath, { recursive: true });
}

fs.createReadStream(zipPath)
  .pipe(unzipper.Extract({ path: extractPath }))
  .on('close', () => {
    console.log('解压完成');
    const files = fs.readdirSync(extractPath);
    console.log('文件列表:', files);
    const jsonFile = files.find(f => f.endsWith('.json'));
    if (jsonFile) {
      const data = JSON.parse(fs.readFileSync(path.join(extractPath, jsonFile), 'utf8'));
      console.log('\n=== 导出数据结构 ===');
      console.log('地图:', JSON.stringify(data.maps.map(m => ({ code: m.code, name: m.name })), null, 2));
      console.log('分类:', JSON.stringify(data.categories.map(c => ({ code: c.code, name: c.name })), null, 2));
      console.log('子分类:', JSON.stringify(data.sub_categories.map(sc => ({
        code: sc.code,
        name: sc.name,
        category_code: sc.category_code,
        map_code: sc.map_code,
        map_id: sc.map_id
      })), null, 2));
      console.log('事件数:', data.events.length);
    }
  });
