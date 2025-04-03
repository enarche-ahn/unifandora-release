const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: (options) => ipcRenderer.invoke('select-folder', options),
  onContextMenuCommand: (callback) => ipcRenderer.on('context-menu-command', callback),
  resizeWindow: (width, height) => ipcRenderer.invoke('resize-window', width, height),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  moveWindow: (x, y) => ipcRenderer.send('move-window', x, y),
  setSlideshowState: (playing) => ipcRenderer.send('set-slideshow-state', playing),
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  loadFolderFromPath: (folderPath, options) => ipcRenderer.invoke('load-folder-from-path', folderPath, options),
  onAutoStartFolder: (callback) => ipcRenderer.on('auto-start-folder', callback),
  getConfig: () => ipcRenderer.invoke('get-config'),
  openOptions: () => ipcRenderer.send('open-options'),
  updateOptions: (options) => ipcRenderer.send('update-options', options),
  onOptionsUpdated: (callback) => ipcRenderer.on('options-updated', callback),
  onSetVersion: (callback) => ipcRenderer.on('set-version', (_event, value) => callback(value)),
  onMessage: (callback) => ipcRenderer.on('message', (_event, text) => callback(text))
});