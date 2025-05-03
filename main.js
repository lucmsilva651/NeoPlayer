import { app, BrowserWindow, Menu } from "electron";
import { is } from "@electron-toolkit/utils";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const template = [{
  label: ''
}];

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    icon: join(__dirname, 'app', 'icons', 'png', '16x16.png'),
    width: 600,
    height: 410,
    minWidth: 600,
    minHeight: 410,
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

  win.loadFile(join(__dirname, 'app', 'app.html'));

  if (is.dev) {
    win.webContents.openDevTools();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
});