import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from "electron";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 600,
    height: 345,
    resizable: false,
    maximizable: false,
    icon: join(__dirname, 'app', 'icons', 'png', '16x16.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // devTools: false,
    },
    ...(process.platform !== 'darwin' ? {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#131313',
        symbolColor: '#ffffff',
        height: 40
      },
    } : {}),
  });

  app.on('browser-window-focus', function () {
    globalShortcut.register("CommandOrControl+R", () => { return false });
    globalShortcut.register("F5", () => { return false });
  });

  app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
  });

  win.loadFile(join(__dirname, 'app/app.html'));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
});

ipcMain.handle('moduleMsgDialog', async (event, moduleMsg) => {
  await dialog.showMessageBox({
    type: 'info',
    title: 'Module text/instruments',
    message: moduleMsg
  });
});