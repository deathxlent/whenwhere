const http = require('http');
const fs = require('fs');
const path = require('path');
const { Unzipper } = require('archiver');
const { PassThrough } = require('stream');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve({ 
                status: res.statusCode, 
                buffer: Buffer.concat(chunks), 
                headers: res.headers 
            }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function test() {
    console.log('=== Get events list ===');
    const list = await makeRequest({ hostname: 'localhost', port: 3000, path: '/api/export/events/list', method: 'GET' });
    const j1 = JSON.parse(list.buffer.toString());
    const zeldaEvents = j1.data.events.filter(e => e.category_name === 'zelda');
    console.log('Zelda events:', zeldaEvents.map(e => `${e.id}:${e.title}`));
    
    console.log('\n=== Export ZIP with all zelda events (should include custom map) ===');
    const body = JSON.stringify({ event_ids: zeldaEvents.map(e => e.id) });
    const r = await makeRequest({
        hostname: 'localhost', port: 3000,
        path: '/api/export/zip', method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    }, body);
    
    console.log('Status:', r.status);
    console.log('Size:', r.buffer.length, 'bytes');
    
    const outPath = path.join(__dirname, '_test_export_result.zip');
    fs.writeFileSync(outPath, r.buffer);
    console.log('Saved to:', outPath);
    
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(outPath);
    const entries = zip.getEntries();
    console.log('\n=== ZIP contents ===');
    entries.forEach(e => {
        console.log(`  ${e.isDirectory ? '[DIR] ' : '      '} ${e.entryName} (${e.header.size} bytes)`);
    });
    
    const jsonEntry = entries.find(e => e.entryName === 'adddata_export.json');
    if (jsonEntry) {
        console.log('\n=== JSON content (maps section) ===');
        const data = JSON.parse(zip.readAsText(jsonEntry));
        console.log('Maps:', data.maps?.map(m => `${m.code} (${m.tile_type})`));
        console.log('Events count:', data.events?.length);
        console.log('Event titles:', data.events?.map(e => e.title));
    }
    
    const manifestEntry = entries.find(e => e.entryName === 'manifest.json');
    if (manifestEntry) {
        console.log('\n=== Manifest ===');
        console.log(zip.readAsText(manifestEntry));
    }
}

test().catch(console.error);
