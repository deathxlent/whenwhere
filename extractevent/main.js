const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ConfigManager = require('./lib/config');
const HtmlParser = require('./lib/html-parser');
const EventExtractor = require('./lib/event-extractor');

let mainWindow = null;
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.local.json');
const configManager = new ConfigManager(configPath);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, 'src', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await configManager.initialize();
  } catch (err) {
    console.error('Failed to initialize config:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('config:get', async () => {
  return configManager.getConfig();
});

ipcMain.handle('config:save', async (_, config) => {
  return configManager.saveConfig(config);
});

ipcMain.handle('config:validate', async (_, providerKey) => {
  return configManager.validateProvider(providerKey);
});

ipcMain.handle('config:path', async () => {
  return configPath;
});

ipcMain.handle('config:open-dir', async () => {
  shell.openPath(userDataPath);
  return true;
});

ipcMain.handle('html:select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择HTML文件',
    filters: [
      { name: 'HTML文件', extensions: ['html', 'htm'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = HtmlParser.parse(content);

  return {
    filePath,
    fileName: path.basename(filePath),
    fileSize: fs.statSync(filePath).size,
    content: parsed.text,
    rawHtml: content,
    title: parsed.title,
    wordCount: parsed.wordCount
  };
});

ipcMain.handle('html:parse-text', async (_, text) => {
  return HtmlParser.parseHtmlText(text);
});

ipcMain.handle('extract:run', async (_, params) => {
  const { htmlContent, options, progressCallback } = params;
  const extractor = new EventExtractor(configManager);

  extractor.on('progress', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('extract:progress', data);
    }
  });

  try {
    const result = await extractor.extract(htmlContent, options);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message, stack: err.stack };
  }
});

ipcMain.handle('export:save-json', async (_, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存JSON文件',
    defaultPath: `adddata_export_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [
      { name: 'JSON文件', extensions: ['json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return null;
  }

  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
  return result.filePath;
});

ipcMain.handle('export:preview-json', async (_, data) => {
  return JSON.stringify(data, null, 2);
});

ipcMain.handle('app:open-external', async (_, url) => {
  shell.openExternal(url);
  return true;
});
