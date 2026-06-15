const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'ww', 'db', 'whenwhere.db');
const db = new Database(DB_PATH);

db.prepare(`
  UPDATE maps SET
    crs_type = 'simple',
    bounds_south = -256,
    bounds_west = 0,
    bounds_north = 0,
    bounds_east = 256,
    tile_ext = 'webp',
    tile_size = 256,
    tile_url = '/tiles/fortnite/{z}/{x}/{y}.webp',
    min_zoom = 1,
    max_zoom = 4,
    name = '堡垒之夜地图',
    description = 'Fortnite 游戏地图（本地瓦片）'
  WHERE code = 'fortnite'
`).run();

console.log('Updated fortnite map');
console.log('Map data:', JSON.stringify(db.prepare('SELECT * FROM maps WHERE code = ?').get('fortnite'), null, 2));

db.close();
