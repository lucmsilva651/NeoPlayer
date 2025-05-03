import { app, BrowserWindow, Menu } from "electron";
import { is } from "@electron-toolkit/utils";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const template = [{
  label: ''
}];

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.whenReady().then(() => {
  const isWindows = process.platform === 'win32';
  let needsFocusFix = false;
  let triggeringProgrammaticBlur = false;
  const win = new BrowserWindow({
    icon: join(__dirname, 'app', 'icons', 'png', '16x16.png'),
    width: 600,
    height: 365,
    minWidth: 600,
    minHeight: 365,
    resizable: false,
    center: true,
    darkTheme: true,
    backgroundColor: '#0d0d0d',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#131313',
      symbolColor: '#ffffff',
      height: 35
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      ...(is.dev ? {} : { devTools: false }),
    }
  });

  win.on('blur', (event) => {
    if (!triggeringProgrammaticBlur) {
      needsFocusFix = true;
    };
  });

  win.on('focus', (event) => {
    if (isWindows && needsFocusFix) {
      needsFocusFix = false;
      triggeringProgrammaticBlur = true;
      setTimeout(function () {
        win.blur();
        win.focus();
        setTimeout(function () {
          triggeringProgrammaticBlur = false;
        }, 100);
      }, 100);
    };
  });

  win.loadFile(join(__dirname, 'app', 'app.html'));

  if (is.dev) {
    win.webContents.openDevTools();
  };

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
});