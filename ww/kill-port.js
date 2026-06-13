const { execSync } = require('child_process');
try {
  const result = execSync('netstat -ano | findstr :3000 | findstr LISTENING', { encoding: 'utf8' });
  const match = result.match(/(\d+)\s*$/m);
  if (match) {
    const pid = match[1].trim();
    console.log('Killing PID:', pid);
    execSync('taskkill /PID ' + pid + ' /F', { encoding: 'utf8' });
    console.log('Done');
  } else {
    console.log('No process found on port 3000');
  }
} catch (e) {
  console.log('No process found or already killed');
}
