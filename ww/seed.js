const db = require('./server/db');

const chinaEvents = [
  { title: '秦统一六国', start_ts: -22100, start_precision: 0, end_ts: -22100, end_precision: 0, description: '秦始皇统一六国，建立中国第一个大一统王朝', location_lat: 34.2637, location_lng: 108.9425, location_name: '咸阳' },
  { title: '赤壁之战', start_ts: 20800, start_precision: 1, end_ts: 20800, end_precision: 1, description: '孙刘联军在赤壁大败曹操，奠定三国鼎立基础', location_lat: 30.3259, location_lng: 113.6216, location_name: '赤壁' },
  { title: '贞观之治开始', start_ts: 62700, start_precision: 0, end_ts: 64900, end_precision: 0, description: '唐太宗李世民开创的盛世局面', location_lat: 34.2619, location_lng: 108.9428, location_name: '长安' },
  { title: '郑和下西洋', start_ts: 140500, start_precision: 1, end_ts: 143300, end_precision: 1, description: '明朝航海家郑和七次下西洋', location_lat: 26.0745, location_lng: 119.2965, location_name: '福州' },
  { title: '鸦片战争', start_ts: 184000, start_precision: 0, end_ts: 184200, end_precision: 0, description: '第一次鸦片战争，中国近代史的开端', location_lat: 22.2783, location_lng: 113.5589, location_name: '广州' },
  { title: '辛亥革命', start_ts: 191110, start_precision: 1, end_ts: 191202, end_precision: 1, description: '推翻清朝统治，建立中华民国', location_lat: 30.5928, location_lng: 114.3055, location_name: '武昌' },
  { title: '中华人民共和国成立', start_ts: 19491001, start_precision: 2, end_ts: 19491001, end_precision: 2, description: '毛泽东在天安门宣告中华人民共和国成立', location_lat: 39.9087, location_lng: 116.3975, location_name: '北京' }
];

const worldEvents = [
  { title: '法国大革命', start_ts: 17890714, start_precision: 2, end_ts: 179900, end_precision: 0, description: '法国人民攻占巴士底狱，法国大革命爆发', location_lat: 48.8534, location_lng: 2.3488, location_name: '巴黎' },
  { title: '美国独立宣言', start_ts: 17760704, start_precision: 2, end_ts: 17760704, end_precision: 2, description: '美国发表独立宣言，脱离英国殖民统治', location_lat: 39.9526, location_lng: -75.1652, location_name: '费城' },
  { title: '第一次世界大战爆发', start_ts: 19140728, start_precision: 2, end_ts: 19181111, end_precision: 2, description: '萨拉热窝事件引发第一次世界大战', location_lat: 43.8563, location_lng: 18.4131, location_name: '萨拉热窝' },
  { title: '柏林墙倒塌', start_ts: 19891109, start_precision: 2, end_ts: 19891109, end_precision: 2, description: '柏林墙倒塌，东西德统一的象征', location_lat: 52.5163, location_lng: 13.3777, location_name: '柏林' }
];

const chinaSubId = 1;
const worldSubId = 2;
const juniorCatId = 1;

const insertEvent = db.prepare(`
  INSERT INTO events (category_id, sub_category_id, title, start_ts, start_precision, end_ts, end_precision, description, location_lat, location_lng, location_name, image_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
`);

const insert = db.transaction(() => {
  chinaEvents.forEach(e => {
    insertEvent.run(juniorCatId, chinaSubId, e.title, e.start_ts, e.start_precision, e.end_ts, e.end_precision, e.description, e.location_lat, e.location_lng, e.location_name);
  });
  worldEvents.forEach(e => {
    insertEvent.run(juniorCatId, worldSubId, e.title, e.start_ts, e.start_precision, e.end_ts, e.end_precision, e.description, e.location_lat, e.location_lng, e.location_name);
  });
});

insert();
console.log('测试数据插入完成！');
console.log('中国史事件:', chinaEvents.length);
console.log('世界史事件:', worldEvents.length);

const total = db.prepare('SELECT COUNT(*) as cnt FROM events').get();
console.log('事件总数:', total.cnt);

db.close();
