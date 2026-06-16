const http = require('http');

function apiReq(method, path, body) {
    return new Promise((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : null;
        const req = http.request({
            hostname: 'localhost', port: 3000,
            path: '/api' + path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { resolve({ raw: data, status: res.statusCode }); }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function setupTestData() {
    try {
        console.log('=== Adding test events ===');
        const subCats = await apiReq('GET', '/categories/sub-categories');
        console.log('Sub categories:', subCats);
        
        const sub1 = subCats.data.find(s => s.code === 'wild');
        console.log('zelda sub id:', sub1?.id);
        
        const sub2Res = await apiReq('GET', '/categories/2/sub-categories');
        console.log('Sub categories 2:', sub2Res.data);
        const sub2 = sub2Res.data[0];
        
        const events = [
            { sub_category_id: sub1.id, title: '大灾变发生', start_ts: 10000, location_lat: -128.5, location_lng: 128.125, location_name: '海拉鲁城堡', description: '大灾变，盖侬复活', tips: '一百年前' },
            { sub_category_id: sub1.id, title: '林克苏醒', start_ts: 10100, location_lat: -120, location_lng: 100, location_name: '复苏神庙', description: '林克从沉睡中苏醒' },
            { sub_category_id: sub1.id, title: '击败灾厄盖侬', start_ts: 10200, location_lat: -128.5, location_lng: 128.125, location_name: '海拉鲁城堡', description: '最终决战' },
            { sub_category_id: sub2?.id || 2, title: '测试事件-秦统一', start_ts: -221, location_lat: 34, location_lng: 108, location_name: '陕西咸阳', description: '秦始皇统一六国' },
            { sub_category_id: sub2?.id || 2, title: '测试事件-汉建立', start_ts: 202, location_lat: 34, location_lng: 109, location_name: '西安', description: '刘邦建立汉朝' }
        ];
        
        for (const e of events) {
            const res = await apiReq('POST', '/events', e);
            console.log('Create event:', e.title, res.success, res.message || '');
        }
        
        console.log('\n=== Verify events list ===');
        const list = await apiReq('GET', '/export/events/list');
        console.log('Total events:', list.data.events.length);
        list.data.events.forEach(e => console.log('  -', e.id, e.title, '[cat:', e.category_name, 'sub:', e.sub_category_name, ']'));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

setupTestData();
