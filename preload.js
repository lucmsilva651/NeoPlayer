const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openDialog: (msg) => ipcRenderer.invoke('moduleMsgDialog', msg)
});