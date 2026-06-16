const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  validateConfig: (providerKey) => ipcRenderer.invoke('config:validate', providerKey),
  getConfigPath: () => ipcRenderer.invoke('config:path'),
  openConfigDir: () => ipcRenderer.invoke('config:open-dir'),

  selectHtmlFile: () => ipcRenderer.invoke('html:select-file'),
  parseHtmlText: (text) => ipcRenderer.invoke('html:parse-text', text),

  runExtraction: (params) => ipcRenderer.invoke('extract:run', params),
  onExtractionProgress: (callback) => {
    const listener = (_, data) => callback(data);
    ipcRenderer.on('extract:progress', listener);
    return () => ipcRenderer.removeListener('extract:progress', listener);
  },

  saveJson: (data) => ipcRenderer.invoke('export:save-json', data),
  previewJson: (data) => ipcRenderer.invoke('export:preview-json', data),

  openExternal: (url) => ipcRenderer.invoke('app:open-external', url)
});
