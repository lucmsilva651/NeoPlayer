import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { updateElectronApp } from "update-electron-app";
import { is } from "@electron-toolkit/utils";
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

updateElectronApp();

const require = createRequire(import.meta.url);

if (require('electron-squirrel-startup')) {
  app.quit();
}

let win = null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    };
  });

  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  app.whenReady().then(() => {
    const win = new BrowserWindow({
      icon: join(__dirname, 'app', 'icons', 'png', '16x16.png'),
      width: 600,
      height: 365,
      center: true,
      minWidth: 600,
      minHeight: 365,
      visible: false,
      darkTheme: true,
      backgroundColor: '#0d0d0d',
      webPreferences: {
        preload: join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        spellcheck: false,
        sandbox: true,
        ...(is.dev ? {} : { devTools: false }),
      }
    });

    win.removeMenu();
    win.loadFile(join(__dirname, 'app', 'app.html'));

    if (is.dev) {
      win.webContents.openDevTools();
    };

    win.on('show', () => {
      setTimeout(() => {
        win.focus();
      }, 200);
    });

    win.show();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") app.quit();
    });

    let isDialogOpen = false;
    ipcMain.handle('dialog', async (event, options) => {
      if (isDialogOpen) return;
      isDialogOpen = true;
      try {
        return await dialog.showMessageBox(options);
      } finally {
        isDialogOpen = false;
      };
    });
  });
};