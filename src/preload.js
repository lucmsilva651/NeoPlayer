const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  alert: (options) => ipcRenderer.invoke("dialog", options),
  close: () => ipcRenderer.send('window-control', 'close')
});