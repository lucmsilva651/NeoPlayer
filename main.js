import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 600,
    height: 410,
    minWidth: 380,
    minHeight: 410,
    center: true,
    frame: false,
    darkTheme: true,
    backgroundColor: '#0d0d0d',
    titleBarStyle: 'hidden',
    icon: join(__dirname, 'app', 'icons', 'png', '16x16.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // devTools: false,
    }
  });
  
  win.loadFile(join(__dirname, 'app/app.html'));

  win.on('maximize', () => {
    win.webContents.send('window-maximized', true);
  });
  
  win.on('unmaximize', () => {
    win.webContents.send('window-maximized', false);
  });

  app.on('browser-window-focus', function () {
    globalShortcut.register("CommandOrControl+R", () => { return false });
    globalShortcut.register("F5", () => { return false });
  });

  app.on('browser-window-blur', function () {
    globalShortcut.unregister('CommandOrControl+R');
    globalShortcut.unregister('F5');
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  ipcMain.on('minimize', () => win.minimize());
  ipcMain.on('close', () => win.close());
  ipcMain.handle('toggle-maximize', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  });  
});