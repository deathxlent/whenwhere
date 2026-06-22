const path = require('path');
const fs = require('fs');
const { WW_STATIC_PATH, TILES_ROOT, IMAGES_ROOT } = require('../../config');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function copyTiles(tileFiles, results) {
  results.tiles = { copied: 0, skipped: 0 };

  for (const file of tileFiles) {
    try {
      const relPath = file.path.replace(/^(adddata\/)?tiles\//, '');
      const destPath = path.join(TILES_ROOT, relPath);
      const destDir = path.dirname(destPath);

      if (fs.existsSync(destPath)) {
        results.tiles.skipped++;
        continue;
      }

      ensureDirSync(destDir);

      const content = await file.buffer();
      fs.writeFileSync(destPath, content);
      results.tiles.copied++;
    } catch (e) {
      console.error('复制瓦片文件失败:', e.message);
    }
  }
}

async function copyImages(imageFiles, results) {
  results.images = { copied: 0, skipped: 0 };

  for (const file of imageFiles) {
    try {
      const relPath = file.path.replace(/^(adddata\/)?images\//, '');
      const destPath = path.join(IMAGES_ROOT, relPath);
      const destDir = path.dirname(destPath);

      if (fs.existsSync(destPath)) {
        results.images.skipped++;
        continue;
      }

      ensureDirSync(destDir);

      const content = await file.buffer();
      fs.writeFileSync(destPath, content);
      results.images.copied++;
    } catch (e) {
      console.error('复制图片文件失败:', e.message);
    }
  }
}

module.exports = {
  ensureDirSync,
  copyTiles,
  copyImages,
  WW_STATIC_PATH,
  TILES_ROOT,
  IMAGES_ROOT
};
