const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const GRADLE_VERSION = '8.2.1';
const HASH_DIR = 'd8pvvlun5bx6sdtwqhf8y9z4b';

const MIRRORS = [
  `https://mirrors.cloud.tencent.com/gradle/gradle-${GRADLE_VERSION}-all.zip`,
  `https://mirrors.aliyun.com/macports/distfiles/gradle/gradle-${GRADLE_VERSION}-all.zip`,
  `https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-all.zip`
];

const homeDir = process.env.USERPROFILE || process.env.HOME;
const targetDir = path.join(homeDir, '.gradle', 'wrapper', 'dists', `gradle-${GRADLE_VERSION}-all`, HASH_DIR);
const targetFile = path.join(targetDir, `gradle-${GRADLE_VERSION}-all.zip`);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const tempFile = targetFile + '.downloading';

async function downloadFromMirror(url, index) {
  return new Promise((resolve, reject) => {
    console.log(`\nTrying mirror ${index + 1}/${MIRRORS.length}:`);
    console.log(`  ${url}`);

    const protocol = url.startsWith('https') ? https : http;
    const options = {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const request = protocol.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = response.headers.location;
        console.log(`  Redirecting to: ${redirectUrl}`);
        downloadFromMirror(redirectUrl, index).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        console.log(`  Failed with status: ${response.statusCode}`);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      if (totalSize < 1000000) {
        console.log(`  File too small (${totalSize} bytes), probably error page`);
        reject(new Error('File too small'));
        return;
      }

      console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      const file = fs.createWriteStream(tempFile);

      let downloaded = 0;
      let lastUpdate = Date.now();

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const now = Date.now();
        if (now - lastUpdate > 2000) {
          const percent = totalSize ? ((downloaded / totalSize) * 100).toFixed(1) : '?';
          console.log(`  Progress: ${(downloaded / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB (${percent}%)`);
          lastUpdate = now;
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          const finalSize = fs.statSync(tempFile).size;
          if (finalSize < 1000000) {
            console.log(`  Downloaded file too small (${finalSize} bytes)`);
            fs.unlinkSync(tempFile);
            reject(new Error('Downloaded file too small'));
            return;
          }

          if (totalSize && finalSize !== totalSize) {
            console.log(`  Size mismatch: ${finalSize} vs ${totalSize}`);
            fs.unlinkSync(tempFile);
            reject(new Error('Size mismatch'));
            return;
          }

          fs.renameSync(tempFile, targetFile);
          console.log(`\n✓ Gradle downloaded successfully!`);
          console.log(`  Location: ${targetFile}`);
          console.log(`  Size: ${(finalSize / 1024 / 1024).toFixed(2)} MB`);

          const lckFile = path.join(targetDir, `gradle-${GRADLE_VERSION}-all.zip.lck`);
          const partFile = path.join(targetDir, `gradle-${GRADLE_VERSION}-all.zip.part`);
          if (fs.existsSync(lckFile)) fs.unlinkSync(lckFile);
          if (fs.existsSync(partFile)) fs.unlinkSync(partFile);
          console.log('  Cleaned up lock files');

          resolve();
        });
      });
    });

    request.on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      reject(err);
    });

    request.setTimeout(30000, () => {
      console.log(`  Timeout`);
      request.destroy();
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      reject(new Error('Timeout'));
    });
  });
}

async function tryAllMirrors() {
  for (let i = 0; i < MIRRORS.length; i++) {
    try {
      await downloadFromMirror(MIRRORS[i], i);
      return true;
    } catch (err) {
      console.log(`  Mirror ${i + 1} failed: ${err.message}`);
      if (i < MIRRORS.length - 1) {
        console.log('  Trying next mirror...');
      }
    }
  }
  return false;
}

console.log(`Downloading Gradle ${GRADLE_VERSION}...`);
console.log(`  Target: ${targetFile}`);

tryAllMirrors().then((success) => {
  if (success) {
    console.log('\n✓ Download complete!');
    console.log('\nNow you can run:');
    console.log('  cd ww-apk/android');
    console.log('  .\\gradlew.bat assembleDebug');
  } else {
    console.error('\n✗ All mirrors failed. Please download manually:');
    console.log(`  Visit: https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-all.zip`);
    console.log(`  Save to: ${targetFile}`);
    process.exit(1);
  }
});

