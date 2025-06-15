import { app, BrowserWindow, Menu, dialog, ipcMain } from "electron";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    spellcheck: false,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.removeMenu();
  win.loadFile(join(__dirname, 'app', 'app.html'));

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