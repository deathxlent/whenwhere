const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SDK_INSTALL_DIR = 'C:\\Android';
const CMDLINE_TOOLS_URL = 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip';
const TEMP_FILE = path.join(SDK_INSTALL_DIR, 'cmdline-tools.zip');
const EXTRACT_DIR = path.join(SDK_INSTALL_DIR, 'cmdline-tools');
const FINAL_DIR = path.join(EXTRACT_DIR, 'latest');

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const protocol = url.startsWith('https') ? https : http;
    
    const options = {
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const request = protocol.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

      const file = fs.createWriteStream(dest);
      let downloaded = 0;
      let lastUpdate = Date.now();

      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const now = Date.now();
        if (now - lastUpdate > 2000) {
          const percent = totalSize ? ((downloaded / totalSize) * 100).toFixed(1) : '?';
          console.log(`  ${(downloaded / 1024 / 1024).toFixed(2)} MB / ${(totalSize / 1024 / 1024).toFixed(2)} MB (${percent}%)`);
          lastUpdate = now;
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          console.log('✓ Download complete');
          resolve();
        });
      });
    });

    request.on('error', reject);
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  try {
    if (!fs.existsSync(SDK_INSTALL_DIR)) {
      fs.mkdirSync(SDK_INSTALL_DIR, { recursive: true });
    }

    console.log('=== Installing Android Command Line Tools ===\n');

    if (!fs.existsSync(TEMP_FILE)) {
      await download(CMDLINE_TOOLS_URL, TEMP_FILE);
    } else {
      console.log('✓ Already downloaded');
    }

    console.log('\nExtracting...');
    execSync(`powershell -Command "Expand-Archive -Path '${TEMP_FILE}' -DestinationPath '${EXTRACT_DIR}' -Force"`, { stdio: 'inherit' });

    const extractedDir = path.join(EXTRACT_DIR, 'cmdline-tools');
    if (fs.existsSync(extractedDir)) {
      if (fs.existsSync(FINAL_DIR)) {
        fs.rmSync(FINAL_DIR, { recursive: true, force: true });
      }
      fs.renameSync(extractedDir, FINAL_DIR);
    }

    console.log('\n✓ Command line tools installed to:', FINAL_DIR);

    const sdkManager = path.join(FINAL_DIR, 'bin', 'sdkmanager.bat');
    console.log('\n=== Installing SDK Components ===\n');

    const packages = [
      'platform-tools',
      'platforms;android-33',
      'build-tools;34.0.0'
    ];

    for (const pkg of packages) {
      console.log(`\nInstalling ${pkg}...`);
      execSync(`"${sdkManager}" --install "${pkg}" --sdk_root="${SDK_INSTALL_DIR}"`, { 
        stdio: 'inherit',
        env: { ...process.env, JAVA_HOME: 'C:\\Program Files\\Java\\jdk-17' }
      });
    }

    console.log('\n✓ Android SDK installation complete!');
    console.log(`  ANDROID_HOME=${SDK_INSTALL_DIR}`);
    console.log(`  Add to PATH: ${SDK_INSTALL_DIR}\\platform-tools`);
    console.log(`  Add to PATH: ${FINAL_DIR}\\bin`);

    const localProps = path.join(__dirname, '..', 'android', 'local.properties');
    fs.writeFileSync(localProps, `sdk.dir=${SDK_INSTALL_DIR.replace(/\\/g, '\\\\')}\n`);
    console.log(`\n✓ Updated ${localProps}`);

    console.log('\nNow run:');
    console.log('  cd ww-apk/android');
    console.log('  gradle assembleDebug');

  } catch (err) {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  }
}

main();
