const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WW = path.join(ROOT, 'ww');
const WWW = path.join(ROOT, 'ww-apk', 'www');
const MOBILE = path.join(ROOT, 'ww-apk', 'mobile');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('=== WW-APK 构建脚本 ===');
console.log('');

console.log('[1/6] 清理 www/ 目录...');
removeDir(WWW);
ensureDir(WWW);

console.log('[2/6] 复制前端代码 (ww/public -> www)...');
copyRecursive(path.join(WW, 'public'), WWW);

console.log('[3/6] 复制静态资源 (ww/static -> www)...');
const staticDir = path.join(WW, 'static');
if (fs.existsSync(staticDir)) {
  const entries = fs.readdirSync(staticDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(staticDir, entry.name);
    const destPath = path.join(WWW, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[4/6] 复制数据库 (ww/db -> www)...');
const dbDir = path.join(WW, 'db');
if (fs.existsSync(dbDir)) {
  const dbFile = path.join(dbDir, 'whenwhere.db');
  if (fs.existsSync(dbFile)) {
    fs.copyFileSync(dbFile, path.join(WWW, 'whenwhere.db'));
    console.log('  已复制 whenwhere.db');
  } else {
    console.log('  警告: whenwhere.db 不存在，APK 将在首次启动时创建空数据库');
  }
} else {
  console.log('  警告: db/ 目录不存在，APK 将在首次启动时创建空数据库');
}

console.log('[5/6] 注入移动端适配代码...');
const indexPath = path.join(WWW, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const sqlJsScript = '<script src="https://sql.js.org/dist/sql-wasm.js"></script>';

const mobileInitScript = `
<script src="/mobile/db-driver.js"></script>
<script src="/mobile/auth-crypto.js"></script>
<script src="/mobile/business-logic.js"></script>
<script src="/mobile/api-adapter.js"></script>
<script>
dbDriver.initDatabase().then(function() {
  window._db = dbDriver;
  console.log('Mobile API adapter initialized');
}).catch(function(e) {
  console.error('Database init failed:', e);
  window._dbInitError = e.message;
});
</script>
`;

indexHtml = indexHtml.replace(
  '<script src="/js/utils.js"></script>',
  sqlJsScript + '\n' + mobileInitScript + '\n<script src="/js/utils.js"></script>'
);

fs.writeFileSync(indexPath, indexHtml, 'utf8');

ensureDir(path.join(WWW, 'mobile'));
copyRecursive(MOBILE, path.join(WWW, 'mobile'));

console.log('[5.5/6] 替换 utils.js 中的 API 对象...');
const utilsPath = path.join(WWW, 'js', 'utils.js');
if (fs.existsSync(utilsPath)) {
  let utilsJs = fs.readFileSync(utilsPath, 'utf8');
  utilsJs = utilsJs.replace(
    /const API = \{[\s\S]*?\};/,
    `var API = {
  get: async function(url) {
    var impl = window.__MOBILE_API__ || window.MobileAPI;
    if (!impl) {
      alert("API not initialized. Please restart the app.");
      throw new Error("API not initialized");
    }
    return impl.get(url);
  },
  post: async function(url, data) {
    var impl = window.__MOBILE_API__ || window.MobileAPI;
    if (!impl) {
      alert("API not initialized. Please restart the app.");
      throw new Error("API not initialized");
    }
    return impl.post(url, data);
  }
};`
  );
  utilsJs = utilsJs.replace(/const /g, 'var ');
  utilsJs = utilsJs.replace(/async (\w+)\(([^)]*)\) \{/g, '$1: async function($2) {');
  utilsJs = utilsJs.replace(/`\$\{([^}]+)\}\$\{([^}]+)\}`/g, '" + $1 + $2 + "');
  utilsJs = utilsJs.replace(/`\$\{([^}]+)\}([^`]+)`/g, '" + $1 + "$2"');
  utilsJs = utilsJs.replace(/\$\{([^}]+)\}/g, '" + $1 + "');
  utilsJs = utilsJs.replace(/`([^`]+)`/g, '"$1"');
  fs.writeFileSync(utilsPath, utilsJs, 'utf8');
  console.log('  已替换 API 对象为移动端适配层');
}

console.log('[6/6] 修改前端地图瓦片路径...');
const mapJsPath = path.join(WWW, 'js', 'map.js');
if (fs.existsSync(mapJsPath)) {
  let mapJs = fs.readFileSync(mapJsPath, 'utf8');
  fs.writeFileSync(mapJsPath, mapJs, 'utf8');
}

console.log('');
console.log('=== 构建完成! ===');
console.log('');
console.log('下一步操作:');
console.log('  1. cd ww-apk');
console.log('  2. npm install');
console.log('  3. npx cap add android (首次)');
console.log('  4. npx cap sync android');
console.log('  5. npx cap open android');
console.log('');
