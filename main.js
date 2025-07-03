const { app, BrowserWindow, dialog, ipcMain } = require("electron/main");
const { updateElectronApp } = require("update-electron-app");
const { is } = require("@electron-toolkit/utils");
const path = require("node:path");

if (require("electron-squirrel-startup")) app.quit();
updateElectronApp();

const instanceLock = app.requestSingleInstanceLock();
let window = null;

function createWindow() {
  app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
  const webPreferences = {
    preload: path.join(__dirname, "preload.js"),
    ...(is.dev ? {} : { devTools: false }),
    nodeIntegration: false,
    contextIsolation: true,
    spellcheck: false,
    sandbox: true
  };

  const titleBarOverlay = {
    color: "#131313",
    symbolColor: "#ffffff",
    height: 35
  };

  window = new BrowserWindow({
    icon: path.join(__dirname, "app", "icons", "png", "16x16.png"),
    disableAutoHideCursor: true,
    backgroundColor: "#0d0d0d",
    titleBarStyle: "hidden",
    titleBarOverlay,
    darkTheme: true,
    webPreferences,
    minHeight: 385,
    minWidth: 600,
    center: true,
    height: 385,
    width: 600
  });

  window.removeMenu();
  window.loadFile(path.join(__dirname, "app", "app.html"));
  if (is.dev) window.webContents.openDevTools();
};

app.whenReady().then(() => {
  if (!instanceLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (window) {
        if (window.isMinimized()) window.restore();
        window.focus();
      };
    });
    createWindow();
  };
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  let isDialogOpen = false;
  ipcMain.handle("dialog", async (event, options) => {
    if (isDialogOpen) return;
    isDialogOpen = true;
    try {
      return await dialog.showMessageBox(options);
    } finally {
      isDialogOpen = false;
    };
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});