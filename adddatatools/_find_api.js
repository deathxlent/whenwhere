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

async function test() {
    console.log('=== Categories ===');
    const cats = await apiReq('GET', '/categories');
    console.log(JSON.stringify(cats, null, 2));
    
    console.log('\n=== Categories / 1 ===');
    const c1 = await apiReq('GET', '/categories/1');
    console.log(JSON.stringify(c1, null, 2));
    
    console.log('\n=== Events list ===');
    const ev = await apiReq('GET', '/events');
    console.log(JSON.stringify(ev, null, 2));
}
test();
