const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'ww', 'db', 'whenwhere.db');
const db = new Database(DB_PATH);

console.log('正在清空数据库...');

db.exec(`
  DELETE FROM event_images;
  DELETE FROM events;
  DELETE FROM sub_categories;
  DELETE FROM categories;
  DELETE FROM maps;
`);

console.log('✅ 数据库已清空');
console.log('  事件表:', db.prepare('SELECT COUNT(*) FROM events').get()['COUNT(*)'], '条');
console.log('  子分类表:', db.prepare('SELECT COUNT(*) FROM sub_categories').get()['COUNT(*)'], '条');
console.log('  分类表:', db.prepare('SELECT COUNT(*) FROM categories').get()['COUNT(*)'], '条');
console.log('  地图表:', db.prepare('SELECT COUNT(*) FROM maps').get()['COUNT(*)'], '条');

db.close();