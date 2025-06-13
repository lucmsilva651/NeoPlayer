const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openDialog: (type, title, msg) => ipcRenderer.invoke("dialog", type, title, msg)
});