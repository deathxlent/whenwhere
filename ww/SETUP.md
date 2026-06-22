# WhenWhere 安装与配置指南

## 快速安装（Windows）

### 1. 安装 Node.js

如果尚未安装 Node.js，请从 [官网](https://nodejs.org/) 下载并安装 LTS 版本（推荐 20.x 或更高）。

验证安装：
```powershell
node --version
npm --version
```

### 2. 安装项目依赖

```powershell
cd ww
npm install
```

安装过程中 `better-sqlite3` 会编译原生模块，如果遇到编译错误：

**Windows 用户**：
```powershell
# 安装 Windows 构建工具（管理员身份运行）
npm install --global windows-build-tools
```

### 3. 初始化数据库

首次运行需要初始化数据库，创建所有表结构：

```powershell
npm run init-db
```

数据库文件将创建在 `ww/db/whenwhere.db`。

### 4. 准备游戏数据

游戏需要题目数据才能游玩。有以下几种方式获取数据：

#### 方式 A：使用 HSD 维护系统添加
使用配套的 [HSD 维护系统](../hsd/SETUP.md) 手动添加题目。

#### 方式 B：导入现有数据
从 HSD 导出的 ZIP 包导入数据，操作步骤见 [HSD 数据导入](../hsd/FLOW.md#3-数据导入流程)。

#### 方式 C：使用示例数据
如果有示例数据库文件，直接复制到 `ww/db/whenwhere.db` 即可。

### 5. 启动服务

```powershell
npm start
```

服务启动后，在浏览器访问：`http://localhost:3000`

---

## 详细配置

### 端口配置

默认使用 3000 端口，如需修改：

**PowerShell:**
```powershell
$env:PORT = 8080
npm start
```

**CMD:**
```cmd
set PORT=8080 && npm start
```

**Linux/macOS:**
```bash
PORT=8080 npm start
```

或直接修改 `server/app.js`：
```javascript
const PORT = process.env.PORT || 3000;  // 修改默认端口
```

### 静态资源路径配置

默认情况下，静态资源（图片、瓦片、GeoJSON）存放在 `ww/static/` 目录下。

如需修改，编辑 `server/app.js`：
```javascript
const STATIC_PATH = path.join(__dirname, '..', 'static');
```

### 游戏参数配置

编辑 `server/config.js` 调整游戏参数：

```javascript
module.exports = {
  // 每局游戏时长（秒）
  GAME_DURATION: 30,
  
  // 精准位置判定阈值（km）
  PRECISE_DISTANCE_KM: 50,
  
  // 精准时间判定阈值（年）
  PRECISE_TIME_YEARS: 1,
  
  // 答案分析显示的最大记录数
  MAX_ANSWERS_FOR_ANALYSIS: 50,
  
  // Token 加密密钥（生产环境请修改）
  TOKEN_SECRET: 'your-secret-key-here'
};
```

**重要提示**：生产环境请务必修改 `TOKEN_SECRET` 为随机字符串。

### 数据库优化配置

数据库默认启用了以下优化（`server/db.js`）：

```javascript
// WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');

// 启用外键约束
db.pragma('foreign_keys = ON');

// 同步模式（可选，根据性能需求调整）
// db.pragma('synchronous = NORMAL');
```

如需更高性能，可添加：
```javascript
db.pragma('cache_size = -20000');  // 20MB 缓存
db.pragma('temp_store = MEMORY');   // 临时表存内存
```

---

## 数据库初始化详解

`npm run init-db` 会执行 `server/init-db.js`，创建以下表：

1. **users** - 用户表
2. **categories** - 分类表
3. **sub_categories** - 子分类表
4. **maps** - 地图配置表
5. **events** - 事件/题目表
6. **event_images** - 事件图片表
7. **game_stats** - 每日游戏统计表
8. **game_sessions** - 游戏会话表
9. **game_answers** - 答题记录表
10. **achievements** - 成就定义表
11. **user_achievements** - 用户成就表
12. **rank_history** - 段位历史表
13. **votes** - 投票表
14. **favorites** - 收藏表

同时创建必要的索引以提升查询性能。

### 重置数据库

如需清空所有数据重新开始：

```powershell
# 停止服务后执行
del db\whenwhere.db
del db\whenwhere.db-shm
del db\whenwhere.db-wal

# 重新初始化
npm run init-db
```

**警告**：这会删除所有用户数据、游戏记录和题目，请谨慎操作！

---

## 验证安装

### 1. 健康检查

启动服务后，访问：
```
http://localhost:3000/api/health
```

应返回：
```json
{
  "success": true,
  "message": "WW服务运行正常",
  "timestamp": "2026-06-22T..."
}
```

### 2. 验证分类 API

```
http://localhost:3000/api/categories
```

### 3. 验证前端页面

访问 `http://localhost:3000`，应看到登录页面。

---

## 地图瓦片配置

### 使用在线地图瓦片

默认使用混合模式（低缩放 OSM，高缩放高德），无需额外配置。

### 使用离线地图瓦片

1. 将瓦片文件放入 `ww/static/tiles/{map_name}/` 目录
2. 瓦片命名格式：`{z}/{x}/{y}.{ext}`
3. 在 HSD 中配置地图，设置 `tile_type` 为 `custom`，并填入瓦片 URL 模板

示例瓦片 URL：`/tiles/fortnite/{z}/{x}/{y}.webp`

### 使用自定义平面坐标系地图

对于非地理地图（如游戏地图）：
1. 设置 `crs_type` 为 `simple`
2. 配置地图边界 `bounds_south/west/north/east`
3. 配置 `distance_unit` 和 `distance_scale`（可选）

---

## 生产环境部署

### 使用 PM2 管理进程

```powershell
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server/app.js --name ww

# 查看状态
pm2 status

# 查看日志
pm2 logs ww

# 重启服务
pm2 restart ww

# 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理配置示例

```nginx
server {
    listen 80;
    server_name whenwhere.example.com;

    # 静态资源直接由 Nginx 提供
    location /images/ {
        alias /path/to/ww/static/images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /tiles/ {
        alias /path/to/ww/static/tiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /geojson/ {
        alias /path/to/ww/static/geojson/;
        expires 7d;
    }

    location /lib/ {
        alias /path/to/ww/static/lib/;
        expires 30d;
    }

    # 其他请求转发到 Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }
}
```

### 启用 HTTPS

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取并安装证书
sudo certbot --nginx -d whenwhere.example.com
```

---

## 备份与恢复

### 数据库备份

因为使用 SQLite，备份非常简单：

```powershell
# 停止服务后复制数据库文件
copy db\whenwhere.db backup\whenwhere_$(Get-Date -Format "yyyyMMdd_HHmmss").db
```

或在服务运行时使用 SQLite 命令备份：
```bash
sqlite3 db/whenwhere.db ".backup backup/whenwhere_backup.db"
```

### 定时备份脚本（Windows PowerShell）

```powershell
$backupDir = "C:\backups\whenwhere"
$sourceFile = "C:\ws\whenwhere\ww\db\whenwhere.db"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$destFile = Join-Path $backupDir "whenwhere_$timestamp.db"

# 创建备份目录
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# 复制文件
Copy-Item $sourceFile $destFile

# 删除超过 30 天的备份
Get-ChildItem $backupDir -Filter "*.db" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item

Write-Host "备份完成: $destFile"
```

保存为 `backup.ps1`，使用任务计划程序定期执行。

### 数据恢复

```powershell
# 停止服务
# 用备份文件覆盖当前数据库
copy backup\whenwhere_backup.db db\whenwhere.db
# 启动服务
```

---

## 常见安装问题

### Q: npm install 时 better-sqlite3 编译失败

**Windows 解决方案：**
```powershell
# 以管理员身份运行 PowerShell
npm install --global windows-build-tools
npm install --global @vscode/vs-build-tools

# 然后重新安装
npm install
```

**Linux 解决方案：**
```bash
sudo apt-get install build-essential python3
npm install
```

### Q: 启动时提示端口被占用

```powershell
# 查找占用端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### Q: 地图瓦片加载失败显示灰色

- 检查网络连接
- 如果在中国境内，建议使用高德地图瓦片
- 检查浏览器控制台（F12）是否有跨域或 404 错误

### Q: 图片无法显示

- 检查图片文件是否存在于 `ww/static/images/` 目录
- 检查文件路径和权限
- 检查浏览器控制台是否有 404 错误

### Q: 数据库文件被锁定

SQLite 是文件型数据库，确保：
- 没有其他进程正在访问数据库
- 数据库文件所在目录有写入权限
- 如果 WAL 模式文件损坏，删除 `-shm` 和 `-wal` 文件后重试

### Q: 登录后刷新页面显示未登录

- 检查浏览器是否禁用了 localStorage
- 检查 Token 是否已过期或失效
- 尝试清除浏览器缓存后重新登录

---

## 📱 Android APK 构建指南

### 前置环境准备

#### 1. 安装 JDK 17

APK 构建需要 JDK 17 或更高版本：

**Windows:**
1. 下载 [Oracle JDK 17](https://www.oracle.com/java/technologies/downloads/#java17) 或 [OpenJDK 17](https://adoptium.net/)
2. 运行安装程序，默认安装到 `C:\Program Files\Java\jdk-17`
3. 配置环境变量：
   ```powershell
   # 系统属性 -> 环境变量 -> 系统变量
   # 新建 JAVA_HOME = C:\Program Files\Java\jdk-17
   # 编辑 Path，添加 %JAVA_HOME%\bin
   
   # 验证
   java -version
   # 应显示 java version "17.x.x"
   ```

#### 2. 安装 Android SDK

**方式 A：安装 Android Studio（推荐）**
1. 下载 [Android Studio](https://developer.android.com/studio)
2. 运行安装程序，选择默认配置
3. 首次启动时选择 "Custom" 安装，确保勾选：
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
4. 安装完成后，在欢迎界面点击 "More Actions" -> "SDK Manager"
5. 安装 Android 13.0 (Tiramisu) 或更高版本的 SDK Platform
6. 在 "SDK Tools" 中安装：
   - Android SDK Build-Tools 34.0.0+
   - Android SDK Platform-Tools
   - Android SDK Tools

**方式 B：仅安装命令行工具**
1. 下载 [Android Command Line Tools](https://developer.android.com/studio#command-tools)
2. 解压到 `C:\Android\cmdline-tools\latest\`
3. 配置环境变量：
   ```powershell
   ANDROID_HOME = C:\Android
   Path 添加: %ANDROID_HOME%\platform-tools; %ANDROID_HOME%\cmdline-tools\latest\bin
   
   # 验证
   sdkmanager --version
   adb version
   ```
4. 安装 SDK 组件：
   ```powershell
   sdkmanager "platform-tools" "platforms;android-33" "build-tools;34.0.0"
   ```

#### 3. 验证环境

打开新的 PowerShell 窗口，执行：
```powershell
echo "JAVA_HOME: $env:JAVA_HOME"
echo "ANDROID_HOME: $env:ANDROID_HOME"
java -version
```

### Gradle 下载与配置

APK 构建需要 Gradle 8.2.1。首次构建时会自动下载，但如遇网络问题可手动处理：

#### 常见问题：SSL 证书错误

如果遇到 `PKIX path building failed` 错误，说明系统无法验证 Gradle 下载服务器的证书。

**解决方案：**

1. **使用系统 CA 证书（推荐）**：
   ```powershell
   # 以管理员身份运行 PowerShell
   Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.2\Client" -Name "DisabledByDefault" -Value 0
   Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.2\Client" -Name "Enabled" -Value 1
   ```

2. **手动下载 Gradle**：
   - 访问 https://services.gradle.org/distributions/
   - 下载 `gradle-8.2.1-all.zip`
   - 放到目录：`%USERPROFILE%\.gradle\wrapper\dists\gradle-8.2.1-all\d8pvvlun5bx6sdtwqhf8y9z4b\`
   - 删除同目录下的 `.lck` 和 `.part` 文件

3. **配置 Gradle 镜像**：
   在 `ww-apk/android/gradle.properties` 中添加：
   ```properties
   systemProp.http.proxyHost=127.0.0.1
   systemProp.http.proxyPort=7890
   systemProp.https.proxyHost=127.0.0.1
   systemProp.https.proxyPort=7890
   ```

### 首次构建完整流程

```powershell
# 1. 进入 APK 目录
cd c:\ws\whenwhere\ww-apk

# 2. 安装依赖
npm install

# 3. 执行构建脚本（同步前端代码和数据库）
node scripts/build-apk.js

# 4. 初始化 Capacitor Android 项目（仅首次）
npx cap add android

# 5. 同步到 Android 项目
npx cap sync android

# 6. 打开 Android Studio
npx cap open android
```

在 Android Studio 中：
1. 等待 Gradle 同步完成（首次可能需要 5-10 分钟下载依赖）
2. 菜单栏选择 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. 构建完成后点击右下角的 **locate** 链接
4. APK 文件位置：`ww-apk/android/app/build/outputs/apk/debug/app-debug.apk`

### 日常更新流程

在 `ww/` 目录开发完成后，更新 APK 只需：

```powershell
cd ww-apk
npm run build          # 同步最新代码和数据
npx cap sync android   # 同步到 Android 项目
npx cap open android   # 在 Android Studio 中重新构建
```

### 构建 Release 版 APK

Debug 版 APK 可直接安装，但如需发布：

1. 生成签名密钥：
   ```powershell
   keytool -genkey -v -keystore whenwhere.keystore -alias whenwhere -keyalg RSA -keysize 2048 -validity 10000
   ```

2. 在 `ww-apk/android/app/build.gradle` 中配置签名：
   ```groovy
   android {
       signingConfigs {
           release {
               storeFile file("whenwhere.keystore")
               storePassword "your_password"
               keyAlias "whenwhere"
               keyPassword "your_password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. 构建 Release APK：
   ```powershell
   cd ww-apk/android
   .\gradlew.bat assembleRelease
   ```

4. APK 位置：`ww-apk/android/app/build/outputs/apk/release/app-release.apk`

### 安装 APK 到手机

**方式 A：通过 USB**
1. 手机开启「开发者选项」和「USB 调试」
2. 连接电脑，选择「传输文件」模式
3. 运行：
   ```powershell
   adb install app-debug.apk
   ```

**方式 B：直接传输**
1. 将 APK 复制到手机存储
2. 在手机文件管理器中点击 APK 文件安装
3. 允许「未知来源应用」安装

### 常见构建问题

#### Q: Gradle 同步一直卡在下载

A: 检查网络连接，或手动下载 Gradle 放到缓存目录（见上文）。

#### Q: 构建时报错 `SDK location not found`

A: 确保 `ANDROID_HOME` 环境变量已正确设置，或在 `ww-apk/android/local.properties` 中添加：
```properties
sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

#### Q: 安装 APK 时提示「解析包错误」

A: 可能是 APK 构建不完整，重新构建；或手机 Android 版本过低（需 Android 7.0+）。

#### Q: APK 启动后白屏

A: 检查浏览器控制台（通过 Chrome 远程调试 `chrome://inspect`），通常是资源路径错误或 JavaScript 异常。

#### Q: 数据库不加载

A: 确保 `ww/db/whenwhere.db` 存在，且构建脚本执行时成功复制到了 `ww-apk/www/` 目录。

---

## 🔗 相关文档
