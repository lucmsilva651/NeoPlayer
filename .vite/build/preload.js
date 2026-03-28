//#region src/electron/preload.js
var { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("api", { alert: (options) => ipcRenderer.invoke("dialog", options) });
//#endregion
