const Database = require('better-sqlite3');
const db = new Database('./db/whenwhere.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);
tables.forEach(t => {
  const cols = db.pragma(`table_info(${t.name})`);
  console.log(`\n${t.name}:`, cols.map(c => `${c.name}(${c.type})`).join(', '));
});
db.close();
