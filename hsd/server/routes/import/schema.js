const db = require('../../db');

function ensureTableColumns(tableName, columns) {
  const existingCols = db.pragma(`table_info(${tableName})`).map(c => c.name);
  for (const col of columns) {
    if (!existingCols.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added column ${tableName}.${col.name}`);
      } catch (e) {
        console.warn(`Add column ${tableName}.${col.name} failed:`, e.message);
      }
    }
  }
}

function initDbSchema() {
  ensureTableColumns('maps', [
    { name: 'center_lat', type: 'REAL' },
    { name: 'center_lng', type: 'REAL' },
    { name: 'default_zoom', type: 'INTEGER DEFAULT 2' }
  ]);
  ensureTableColumns('events', [
    { name: 'tips', type: 'TEXT' }
  ]);
  ensureTableColumns('sub_categories', [
    { name: 'map_id', type: 'INTEGER' },
    { name: 'center_lat', type: 'REAL' },
    { name: 'center_lng', type: 'REAL' },
    { name: 'default_zoom', type: 'INTEGER DEFAULT 2' },
    { name: 'min_zoom', type: 'INTEGER DEFAULT 2' },
    { name: 'max_zoom', type: 'INTEGER DEFAULT 8' }
  ]);
}

module.exports = {
  ensureTableColumns,
  initDbSchema
};
