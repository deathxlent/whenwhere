const Database = require('better-sqlite3');
const path = require('path');
const http = require('http');

const DB_PATH = path.join(__dirname, '..', '..', 'ww', 'db', 'whenwhere.db');

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testDelete() {
  const db = new Database(DB_PATH);
  console.log('=== 测试真删除功能 ===\n');

  const map = db.prepare('SELECT * FROM maps LIMIT 1').get();
  const cat = db.prepare('SELECT * FROM categories LIMIT 1').get();
  const sub = db.prepare('SELECT * FROM sub_categories LIMIT 1').get();
  const events = db.prepare('SELECT * FROM events').all();

  console.log('初始数据:');
  console.log(`  地图: ${map.id} - ${map.name}`);
  console.log(`  分类: ${cat.id} - ${cat.name}`);
  console.log(`  子分类: ${sub.id} - ${sub.name} (map_id: ${sub.map_id})`);
  console.log(`  事件: ${events.length} 条`);
  events.forEach(e => console.log(`    ${e.id}: ${e.title}`));

  console.log('\n--- 测试 1: 尝试删除地图（有子分类关联，应该失败） ---');
  let res = await httpRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/maps/${map.id}`,
    method: 'DELETE'
  });
  console.log(`  结果: ${res.success ? '成功' : '失败'} - ${res.message}`);
  console.log(`  地图是否仍存在: ${db.prepare('SELECT COUNT(*) FROM maps WHERE id = ?').get(map.id)['COUNT(*)'] > 0 ? '是 ✅' : '否 ❌'}`);

  console.log('\n--- 测试 2: 尝试删除子分类（有事件关联，应该失败） ---');
  res = await httpRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/categories/sub-categories/${sub.id}`,
    method: 'DELETE'
  });
  console.log(`  结果: ${res.success ? '成功' : '失败'} - ${res.message}`);
  console.log(`  子分类是否仍存在: ${db.prepare('SELECT COUNT(*) FROM sub_categories WHERE id = ?').get(sub.id)['COUNT(*)'] > 0 ? '是 ✅' : '否 ❌'}`);

  console.log('\n--- 测试 3: 删除所有事件 ---');
  for (const event of events) {
    res = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: `/api/events/${event.id}`,
      method: 'DELETE'
    });
    console.log(`  删除事件 ${event.id} (${event.title}): ${res.success ? '成功 ✅' : '失败 ❌'} - ${res.message}`);
  }
  console.log(`  剩余事件: ${db.prepare('SELECT COUNT(*) FROM events').get()['COUNT(*)']} 条`);

  console.log('\n--- 测试 4: 再次删除子分类（无事件关联，应该成功） ---');
  res = await httpRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/categories/sub-categories/${sub.id}`,
    method: 'DELETE'
  });
  console.log(`  结果: ${res.success ? '成功 ✅' : '失败 ❌'} - ${res.message}`);
  console.log(`  子分类是否仍存在: ${db.prepare('SELECT COUNT(*) FROM sub_categories WHERE id = ?').get(sub.id)['COUNT(*)'] > 0 ? '是 ❌' : '否 ✅'}`);

  console.log('\n--- 测试 5: 再次删除地图（无子分类关联，应该成功） ---');
  res = await httpRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/maps/${map.id}`,
    method: 'DELETE'
  });
  console.log(`  结果: ${res.success ? '成功 ✅' : '失败 ❌'} - ${res.message}`);
  console.log(`  地图是否仍存在: ${db.prepare('SELECT COUNT(*) FROM maps WHERE id = ?').get(map.id)['COUNT(*)'] > 0 ? '是 ❌' : '否 ✅'}`);

  console.log('\n--- 测试 6: 删除分类 ---');
  res = await httpRequest({
    hostname: 'localhost',
    port: 3001,
    path: `/api/categories/${cat.id}`,
    method: 'DELETE'
  });
  console.log(`  结果: ${res.success ? '成功 ✅' : '失败 ❌'} - ${res.message}`);
  console.log(`  分类是否仍存在: ${db.prepare('SELECT COUNT(*) FROM categories WHERE id = ?').get(cat.id)['COUNT(*)'] > 0 ? '是 ❌' : '否 ✅'}`);

  console.log('\n=== 最终数据库状态 ===');
  console.log(`  地图: ${db.prepare('SELECT COUNT(*) FROM maps').get()['COUNT(*)']} 条`);
  console.log(`  分类: ${db.prepare('SELECT COUNT(*) FROM categories').get()['COUNT(*)']} 条`);
  console.log(`  子分类: ${db.prepare('SELECT COUNT(*) FROM sub_categories').get()['COUNT(*)']} 条`);
  console.log(`  事件: ${db.prepare('SELECT COUNT(*) FROM events').get()['COUNT(*)']} 条`);

  db.close();
  console.log('\n✅ 删除功能测试完成！');
}

testDelete().catch(console.error);