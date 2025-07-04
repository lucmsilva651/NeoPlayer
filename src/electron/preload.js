const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  alert: (options) => ipcRenderer.invoke("dialog", options)
});