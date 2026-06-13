const fs = require('fs');
const vm = require('vm');
const c = fs.readFileSync('public/js/app.js', 'utf8');
const lines = c.split('\n');

const section = lines.slice(966, 978).join('\n');
console.log('Testing section:');
console.log(section);
console.log('---');
try {
  const wrapped = 'const x = ' + section;
  new vm.Script(wrapped, { filename: 'test.js' });
  console.log('OK');
} catch (e) {
  console.log('Error:', e.message);
}
