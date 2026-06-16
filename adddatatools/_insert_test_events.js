const db = require('./server/db');

console.log('=== Sub Categories ===');
const subCats = db.prepare('SELECT * FROM sub_categories').all();

const insertEvent = db.prepare(`INSERT INTO events (category_id, sub_category_id, title, start_ts, end_ts, location_lat, location_lng, location_name, description, tips, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const events = [
    [1, 1, '大灾变发生', 10000, null, -128.5, 128.125, '海拉鲁城堡', '大灾变，盖侬复活毁灭海拉鲁', '一百年前发生的悲剧', 1],
    [1, 1, '林克苏醒', 10100, null, -120, 100, '复苏神庙', '林克从一百年的沉睡中苏醒', '故事的开始', 2],
    [1, 1, '获得滑翔伞', 10101, null, -100, 150, '初始台地', '从老国王手中获得滑翔伞', '离开初始台地', 3],
    [1, 1, '击败灾厄盖侬', 10200, null, -128.5, 128.125, '海拉鲁城堡', '最终决战，击败灾厄盖侬拯救塞尔达', '主线完成', 4],
    [2, 2, '秦灭六国', -221, null, 34.3, 108.9, '陕西咸阳', '秦始皇嬴政统一六国，建立秦朝', '中国第一个大一统王朝', 1],
    [2, 2, '楚汉相争', -206, -202, 34.0, 113.6, '中原地区', '刘邦与项羽争夺天下', '四年战争', 2],
    [2, 2, '汉朝建立', -202, null, 34.3, 108.9, '长安', '刘邦建立汉朝，定都长安', '西汉开始', 3],
];

db.transaction(() => {
    for (const e of events) {
        insertEvent.run(...e);
    }
})();

console.log('\n=== Inserted events ===');
const evs = db.prepare('SELECT e.id, e.title, sc.name as sub_name, c.name as cat_name FROM events e JOIN sub_categories sc ON e.sub_category_id = sc.id JOIN categories c ON e.category_id = c.id').all();
evs.forEach(e => console.log(`  [${e.id}] ${e.title} (${e.cat_name} / ${e.sub_name})`));
