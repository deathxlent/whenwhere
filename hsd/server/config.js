const path = require('path');

const WW_STATIC_PATH = path.join(__dirname, '..', '..', 'ww', 'static');
const TILES_ROOT = path.join(WW_STATIC_PATH, 'tiles');
const IMAGES_ROOT = path.join(WW_STATIC_PATH, 'images');

module.exports = {
  WW_STATIC_PATH,
  TILES_ROOT,
  IMAGES_ROOT
};
