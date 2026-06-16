const http = require('http');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: data, headers: res.headers }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function test() {
    try {
        console.log('=== Test 1: Get events list ===');
        const r1 = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/export/events/list', method: 'GET' });
        console.log('Status:', r1.status);
        const j1 = JSON.parse(r1.data);
        console.log('Events count:', j1.data?.events?.length || 0);
        console.log('Categories:', j1.data?.categories?.map(c => c.name));
        if (j1.data?.events?.length > 0) {
            console.log('First event:', j1.data.events[0].title, 'id:', j1.data.events[0].id);
            
            console.log('\n=== Test 2: Export ZIP (first 2 events) ===');
            const firstEvents = j1.data.events.slice(0, 2).map(e => e.id);
            console.log('Exporting event ids:', firstEvents);
            const body = JSON.stringify({ event_ids: firstEvents });
            const r2 = await makeRequest({
                hostname: 'localhost', port: 3000,
                path: '/api/export/zip', method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            }, body);
            console.log('Status:', r2.status);
            console.log('Content-Type:', r2.headers['content-type']);
            console.log('Content-Disposition:', r2.headers['content-disposition']);
            console.log('Data length:', Buffer.byteLength(r2.data, 'binary'));
            if (r2.status === 200 && r2.headers['content-type'] === 'application/zip') {
                console.log('SUCCESS: ZIP export works!');
            }
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    }
}

test();
