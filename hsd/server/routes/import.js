const express = require('express');
const router = express.Router();
const unzipper = require('unzipper');
const multer = require('multer');

const { initDbSchema } = require('./import/schema');
const { importAllData } = require('./import/data-importer');
const { copyTiles, copyImages } = require('./import/file-copier');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});

initDbSchema();

router.post('/zip', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '请上传ZIP文件' });
  }

  const results = {
    maps: { success: 0, skipped: 0, failed: 0, errors: [] },
    categories: { success: 0, skipped: 0, failed: 0, errors: [] },
    sub_categories: { success: 0, skipped: 0, failed: 0, errors: [] },
    events: { success: 0, failed: 0, errors: [] },
    tiles: { copied: 0, skipped: 0 },
    images: { copied: 0, skipped: 0 }
  };

  let importData = null;
  const tileFiles = [];
  const imageFiles = [];

  try {
    const directory = await unzipper.Open.buffer(req.file.buffer);
    
    const jsonEntry = directory.files.find(f => f.path === 'adddata_export.json');
    if (!jsonEntry) {
      return res.json({ success: false, message: 'ZIP文件中未找到 adddata_export.json' });
    }

    const jsonContent = await jsonEntry.buffer();
    importData = JSON.parse(jsonContent.toString('utf8'));

    for (const file of directory.files) {
      if (file.path.match(/^(adddata\/)?tiles\//) && !file.path.endsWith('/')) {
        tileFiles.push(file);
      }
      if (file.path.match(/^(adddata\/)?images\//) && !file.path.endsWith('/')) {
        imageFiles.push(file);
      }
    }
  } catch (e) {
    return res.json({ success: false, message: '解析ZIP文件失败: ' + e.message });
  }

  try {
    const dbResults = importAllData(importData);
    Object.assign(results.maps, dbResults.maps);
    Object.assign(results.categories, dbResults.categories);
    Object.assign(results.sub_categories, dbResults.sub_categories);
    Object.assign(results.events, dbResults.events);
  } catch (e) {
    return res.json({ success: false, message: '导入数据失败: ' + e.message });
  }

  await copyTiles(tileFiles, results);
  await copyImages(imageFiles, results);

  res.json({ success: true, message: '导入完成', results });
});

router.post('/json', (req, res) => {
  const importData = req.body;

  if (!importData || typeof importData !== 'object') {
    return res.json({ success: false, message: '导入数据格式错误' });
  }

  try {
    const results = importAllData(importData);
    res.json({ success: true, message: '导入完成', results });
  } catch (e) {
    res.json({ success: false, message: '导入失败: ' + e.message });
  }
});

module.exports = router;
