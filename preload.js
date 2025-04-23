const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openDialog: (msg) => ipcRenderer.invoke('moduleMsgDialog', msg),
  minimize: () => ipcRenderer.send('minimize'),
  maximizeToggle: () => ipcRenderer.invoke('toggle-maximize'),
  close: () => ipcRenderer.send('close'),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized))
});