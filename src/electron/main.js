const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, ipcMain } = require("electron/main");
const { is, platform } = require("@electron-toolkit/utils");
const pkg = require("../../package.json");
const path = require("node:path");

if (require("electron-squirrel-startup")) return;

const appIcon = nativeImage.createFromPath(path.join(__dirname, "..", "icons", "icon.png"));
const instanceLock = app.requestSingleInstanceLock();

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
    symbolColor: "#ffffff",
    color: "#0d0f12",
    height: (40 - 1)
  };

  const win = new BrowserWindow({
    disableAutoHideCursor: true,
    backgroundColor: "#0d0d0d",
    ...(!platform.isMacOS
      ? {
        titleBarStyle: "hidden",
        titleBarOverlay
      }
      : {}),
    maximizable: false,
    resizable: false,
    darkTheme: true,
    webPreferences,
    icon: appIcon,
    center: true,
    show: false,
    height: 510,
    width: 600
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, "..", "ui", "index.html"));
  if (is.dev) win.webContents.openDevTools();

  win.once("ready-to-show", () => {
    win.show();
    win.on('show', () => {
      win.focus();
    });
  });

  return win;
}

function createTray(win) {
  const tray = new Tray(appIcon);
  tray.setToolTip(pkg.packageName);

  const contextMenu = Menu.buildFromTemplate([
    { label: `Quit ${pkg.packageName}`, role: "quit" }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (win.isVisible() && !win.isMinimized()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  return tray;
}

if (!instanceLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    let mainWindow = createWindow();
    let tray = null;

    app.on("second-instance", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    if (!platform.isMacOS) tray = createTray(mainWindow);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      }
    });

    app.on("window-all-closed", () => {
      app.quit();
    });

    let isDialogOpen = false;
    ipcMain.handle("dialog", async (event, options) => {
      if (isDialogOpen) return;
      isDialogOpen = true;
      try {
        return await dialog.showMessageBox(mainWindow, {
          icon: appIcon,
          ...options
        });
      } finally {
        isDialogOpen = false;
      }
    });
  });
}