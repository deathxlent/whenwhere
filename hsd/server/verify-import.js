const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'ww', 'db', 'whenwhere.db');
const db = new Database(DB_PATH);

console.log('=== 验证数据 ===\n');

console.log('地图:');
const maps = db.prepare('SELECT id, code, name, tile_type FROM maps').all();
maps.forEach(m => console.log(`  ${m.id}: ${m.code} - ${m.name} (${m.tile_type})`));

console.log('\n分类:');
const cats = db.prepare('SELECT id, code, name FROM categories').all();
cats.forEach(c => console.log(`  ${c.id}: ${c.code} - ${c.name}`));

console.log('\n子分类 (重点检查 map_id):');
const subs = db.prepare(`
  SELECT sc.id, sc.code, sc.name, sc.map_id, m.name as map_name
  FROM sub_categories sc
  LEFT JOIN maps m ON sc.map_id = m.id
`).all();
subs.forEach(s => {
  const mapStatus = s.map_id ? `✅ 关联地图: ${s.map_name} (ID: ${s.map_id})` : '❌ 未关联地图';
  console.log(`  ${s.id}: ${s.code} - ${s.name} - ${mapStatus}`);
});

console.log('\n事件 (检查子分类关联):');
const events = db.prepare(`
  SELECT e.id, e.title, sc.name as sub_name, m.name as map_name
  FROM events e
  JOIN sub_categories sc ON e.sub_category_id = sc.id
  LEFT JOIN maps m ON sc.map_id = m.id
`).all();
events.forEach(e => {
  const mapStatus = e.map_name ? `✅ 可通过子分类访问地图: ${e.map_name}` : '❌ 子分类未关联地图';
  console.log(`  ${e.id}: ${e.title} -> ${e.sub_name} - ${mapStatus}`);
});

db.close();