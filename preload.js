const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openDialog: (options) => ipcRenderer.invoke("dialog", options)
});