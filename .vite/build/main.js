//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);
//#endregion
//#region package.json
var package_exports = /* @__PURE__ */ __exportAll({
	author: () => author,
	category: () => category,
	default: () => package_default,
	dependencies: () => dependencies,
	description: () => description,
	devDependencies: () => devDependencies,
	license: () => license,
	macCategory: () => macCategory,
	main: () => main,
	name: () => name,
	packageName: () => packageName,
	repository: () => repository,
	scripts: () => scripts,
	version: () => version
});
var name, version, main, license, packageName, category, repository, description, macCategory, author, dependencies, devDependencies, scripts, package_default;
var init_package = __esmMin((() => {
	name = "neoplayer";
	version = "1.5.4";
	main = ".vite/build/main.js";
	license = "BSD-3-Clause";
	packageName = "NeoPlayer";
	category = ["Audio", "AudioVideo"];
	repository = {
		"type": "git",
		"url": "https://github.com/lucmsilva651/NeoPlayer.git"
	};
	description = "Module player built on Electron";
	macCategory = "public.app-category.music";
	author = {
		"name": "Lucas Gabriel (lucmsilva)",
		"email": "lucmsilva651@gmail.com"
	};
	dependencies = {
		"@electron-toolkit/utils": "^4.0.0",
		"@iconify-json/mdi": "^1.2.3",
		"@iconify/vue": "^5.0.0",
		"electron-squirrel-startup": "^1.0.1",
		"vue": "^3.5.30"
	};
	devDependencies = {
		"@electron-forge/cli": "^7.11.1",
		"@electron-forge/maker-deb": "^7.11.1",
		"@electron-forge/maker-dmg": "^7.11.1",
		"@electron-forge/maker-rpm": "^7.11.1",
		"@electron-forge/maker-squirrel": "^7.11.1",
		"@electron-forge/plugin-auto-unpack-natives": "^7.11.1",
		"@electron-forge/plugin-fuses": "^7.11.1",
		"@electron-forge/plugin-vite": "^7.11.1",
		"@vitejs/plugin-vue": "^6.0.5",
		"electron": "^41.0.2",
		"vite": "^8.0.1"
	};
	scripts = {
		"deps": "git submodule update --init src/lib/chiptune",
		"start": "npm run deps && electron-forge start",
		"package": "npm run deps && electron-forge package",
		"make": "npm run deps && electron-forge make"
	};
	package_default = {
		name,
		version,
		main,
		license,
		packageName,
		category,
		repository,
		description,
		macCategory,
		author,
		dependencies,
		devDependencies,
		scripts
	};
}));
//#endregion
//#region src/electron/main.js
var { app, BrowserWindow, Tray, Menu, nativeImage, dialog, ipcMain, session } = require("electron/main");
var { is, platform } = require("@electron-toolkit/utils");
var pkg = (init_package(), __toCommonJS(package_exports).default);
var path = require("node:path");
if (require("electron-squirrel-startup")) return;
var appIcon = nativeImage.createFromPath(path.join(__dirname, "..", "icons", "icon.png"));
var instanceLock = app.requestSingleInstanceLock();
var winWidth = 550;
var winHeight = 425;
function createWindow() {
	const webPreferences = {
		preload: path.join(__dirname, "preload.js"),
		autoplayPolicy: "no-user-gesture-required",
		...is.dev ? {} : { devTools: false },
		nodeIntegration: false,
		contextIsolation: true,
		spellcheck: false,
		sandbox: true
	};
	const win = new BrowserWindow({
		disableAutoHideCursor: true,
		backgroundColor: "#0d0d0d",
		...!platform.isMacOS ? {
			titleBarStyle: "hidden",
			titleBarOverlay: {
				symbolColor: "#ffffff",
				color: "#0d0f12",
				height: 39
			}
		} : {},
		useContentSize: true,
		minHeight: winHeight,
		maximizable: false,
		minWidth: winWidth,
		height: winHeight,
		width: winWidth,
		resizable: false,
		darkTheme: true,
		webPreferences,
		icon: appIcon,
		center: true,
		show: false
	});
	Menu.setApplicationMenu(null);
	win.loadURL("http://localhost:5173");
	if (is.dev) win.webContents.openDevTools();
	win.once("ready-to-show", () => {
		win.show();
		win.on("show", () => {
			win.focus();
		});
		win.setMinimumSize(winWidth, winHeight);
		win.setSize(winWidth, winHeight);
	});
	return win;
}
function hideWindow(win) {
	if (win.isVisible() && !win.isMinimized()) win.hide();
	else {
		win.show();
		win.focus();
	}
}
function createTray(win) {
	const tray = new Tray(appIcon);
	tray.setToolTip(pkg.packageName);
	const contextMenu = Menu.buildFromTemplate([{
		label: `Hide/Show Window`,
		click: () => hideWindow(win)
	}, {
		label: `Quit ${pkg.packageName}`,
		role: "quit"
	}]);
	tray.setContextMenu(contextMenu);
	tray.on("click", () => {
		hideWindow(win);
	});
	return tray;
}
if (!instanceLock) app.quit();
else app.whenReady().then(() => {
	let mainWindow = createWindow();
	app.on("second-instance", () => {
		if (mainWindow) {
			if (mainWindow.isMinimized()) mainWindow.restore();
			mainWindow.focus();
		}
	});
	if (!platform.isMacOS) createTray(mainWindow);
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
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
//#endregion
