const { app, BrowserWindow, Tray, nativeImage, dialog, ipcMain } = require("electron/main");
const { is, platform } = require("@electron-toolkit/utils");
const path = require("node:path");

if (require("electron-squirrel-startup")) return;

const appIcon = nativeImage.createFromPath(path.join(__dirname, "icons", "icon.png"));
const instanceLock = app.requestSingleInstanceLock();
let window = null;
let tray = null;

function createWindow() {
  const webPreferences = {
    preload: path.join(__dirname, "preload.js"),
    autoplayPolicy: "no-user-gesture-required",
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
    disableAutoHideCursor: true,
    backgroundColor: "#0d0d0d",
    ...(!platform.isMacOS ? {
      titleBarStyle: "hidden",
      titleBarOverlay
    } : {}),
    darkTheme: true,
    webPreferences,
    minHeight: 385,
    minWidth: 600,
    icon: appIcon,
    center: true,
    height: 385,
    width: 600
  });

  window.removeMenu();
  window.loadFile(path.join(__dirname, "html", "index.html"));
  if (is.dev) window.webContents.openDevTools();
};

function createTray(win) {
  tray = new Tray(appIcon);
  tray.setToolTip("NeoPlayer");

  tray.on("click", () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
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
    if (!platform.isMacOS) createTray(window);
  };

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    app.quit();
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