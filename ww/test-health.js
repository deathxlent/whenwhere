const http = require('http');
const req = http.get('http://localhost:3000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', (e) => console.log('Error:', e.message));
req.setTimeout(5000, () => { req.destroy(); console.log('Timeout'); });
