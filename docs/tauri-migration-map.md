# Tauri Migration Map & Risk Analysis

## Project Overview

**NeoPlayer** is a chiptune/module-file player built on Electron 41 + Vite + Vue 3.
This document maps every Electron / Node.js API to its Tauri 2.x equivalent and
records the risk level and required plugins / crates for the migration.

---

## 1 · Electron API → Tauri 2.x Equivalence Table

| # | Electron / Node API | Usage in codebase | Tauri 2.x equivalent / strategy | Risk |
|---|---------------------|-------------------|----------------------------------|------|
| 1 | `app.requestSingleInstanceLock()` + `app.on("second-instance")` | Prevent multiple instances, focus existing window | `tauri-plugin-single-instance` — `init(callback)` | Low |
| 2 | `BrowserWindow` (creation, size, show/hide, focus) | Main window lifecycle | `tauri::WebviewWindowBuilder` / `WebviewWindow` in Rust; `getCurrentWindow()` in frontend | Low |
| 3 | `BrowserWindow` `show: false` + `ready-to-show` | Prevent white flash on start | `visible: false` in `tauri.conf.json`, then `win.show()` in `setup()` | Low |
| 4 | `titleBarStyle: "hidden"` + `titleBarOverlay` (Windows/Linux) | Custom drag-region titlebar | `decorations: false` in Tauri window config; CSS `-webkit-app-region: drag` already present; custom minimize/close buttons added to HTML titlebar | Medium |
| 5 | `Menu.setApplicationMenu(null)` | Remove default app menu | Not needed in Tauri — no default application menu is shown | Low |
| 6 | `Tray` + `Menu.buildFromTemplate` (non-macOS) | System tray icon with Hide/Show and Quit items | `tauri::tray::TrayIconBuilder` + `tauri::menu::{MenuBuilder, MenuItemBuilder}` (built into `tauri` crate with `tray-icon` feature) | Low |
| 7 | `tray.on("click")` | Toggle window visibility on tray click | `TrayIconBuilder::on_tray_icon_event` matching `TrayIconEvent::Click` | Low |
| 8 | `ipcMain.handle("dialog")` + `dialog.showMessageBox()` | Native message / error / info dialogs | `tauri-plugin-dialog` Rust plugin + `@tauri-apps/plugin-dialog` frontend package (`message()` function) | Low |
| 9 | `contextBridge.exposeInMainWorld("api", {...})` + `ipcRenderer.invoke("dialog")` | Preload bridge for dialog IPC | Replaced by direct `@tauri-apps/plugin-dialog` frontend calls via `src/lib/tauriAdapter.js` | Low |
| 10 | `app.on("window-all-closed", () => app.quit())` | Quit when all windows close | Default Tauri behaviour on Windows/Linux; macOS handled via `WindowEvent::CloseRequested` exit in Rust `setup()` | Low |
| 11 | `app.on("activate")` (macOS) | Re-create window on Dock click | Not needed — window is never fully destroyed in the Tauri version | Low |
| 12 | `nativeImage.createFromPath(...)` | App / tray icon | `app.default_window_icon()` (loaded from `bundle.icon` in `tauri.conf.json`) | Low |
| 13 | `require("electron-squirrel-startup")` | Windows Squirrel installer lifecycle | Tauri bundles its own installer (NSIS / WiX); this shim is not needed | Low |
| 14 | `@electron-toolkit/utils` (`is.dev`, `platform.isMacOS`) | Dev-mode detection, platform check | `#[cfg(debug_assertions)]` / `#[cfg(target_os = "macos")]` in Rust; `import.meta.env.DEV` in Vite for frontend | Low |
| 15 | `node:path` (`path.join`) | File path construction in main process | Rust `std::path::PathBuf` / string concatenation | Low |
| 16 | `require("../../package.json")` | Read app name / version in main process | `tauri::generate_context!()` provides app metadata; version defined in `Cargo.toml` | Low |
| 17 | `session` (imported but unused) | — | No migration needed | Low |
| 18 | Electron Forge makers (deb, rpm, dmg, squirrel) | Platform packaging | `tauri build` with `bundle.targets` — Tauri ships built-in bundlers for `.deb`, `.rpm`, `.dmg`, `.msi`/NSIS | Low |
| 19 | `webPreferences.autoplayPolicy: "no-user-gesture-required"` | Audio autoplay without user interaction | No equivalent config in Tauri/WebKitGTK/WebView2; autoplay usually works by default in embedded views | Medium |

---

## 2 · APIs with No Direct Equivalent & Proposed Workarounds

| Electron feature | Gap | Proposed workaround |
|-----------------|-----|---------------------|
| `titleBarOverlay` (native min/max/close controls on Windows) | Tauri has no equivalent titlebar-overlay API | Add custom minimize + close buttons to the existing HTML `.titlebar` element; adjust `padding-right` in CSS to reclaim the space previously reserved for native controls |
| `autoplayPolicy: "no-user-gesture-required"` | WebKitGTK (Linux) and WebView2 (Windows) do not expose this via Tauri config | Audio autoplay should still work in embedded views; add `// MIGRATION NOTE` if issues arise on specific platforms |
| `dialog.showMessageBox` `type: "none"` | `@tauri-apps/plugin-dialog` `message()` only supports `kind: "info" | "warning" | "error"` | Map `"none"` → `"info"` in `tauriAdapter.js` |
| `isDialogOpen` mutex in Electron IPC handler | Prevents showing two dialogs simultaneously | Tauri's `message()` is already serialised per-call in the frontend; no server-side mutex needed |

---

## 3 · Risk Assessment Summary

| Risk Level | Count | Items |
|-----------|-------|-------|
| **Low** | 17 | All items except #4 and #19 |
| **Medium** | 2 | #4 (titlebar decoration), #19 (autoplay policy) |
| **High** | 0 | — |

---

## 4 · Required Tauri Plugins

| Plugin (npm) | Plugin (Rust crate) | Purpose |
|---|---|---|
| `@tauri-apps/plugin-dialog@^2` | `tauri-plugin-dialog = "2"` | Native message dialogs (replaces `ipcMain.handle("dialog")`) |
| — | `tauri-plugin-single-instance = "2"` | Single-instance lock (replaces `app.requestSingleInstanceLock()`) |
| `@tauri-apps/api@^2` | — | Frontend `getCurrentWindow()` for minimize / close buttons |

**Built-in Tauri features used (no extra plugin):**

| Feature | Enabled via |
|---------|------------|
| System tray | `tauri` crate `features = ["tray-icon"]` |
| Window management | `tauri` core |

---

## 5 · Required Rust Crates

| Crate | Version | Purpose |
|-------|---------|---------|
| `tauri` | `2` | Core application runtime |
| `tauri-plugin-dialog` | `2` | Native dialog boxes |
| `tauri-plugin-single-instance` | `2` | Prevent multiple app instances |
| `tauri-build` | `2` | Build-time code generation |
| `serde` | `1` | Serialisation / deserialisation |
| `serde_json` | `1` | JSON support |
