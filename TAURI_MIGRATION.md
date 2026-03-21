# TAURI_MIGRATION.md

Complete migration guide from **Electron 41 + Vite + Vue 3** to **Tauri 2.x**.

---

## Summary of Changes

### New files

| File | Purpose |
|------|---------|
| `src-tauri/Cargo.toml` | Rust crate manifest — declares Tauri 2 and plugin dependencies |
| `src-tauri/build.rs` | Tauri build-time code generation |
| `src-tauri/tauri.conf.json` | Application configuration (window, bundle, dev server) |
| `src-tauri/capabilities/default.json` | Tauri permission grants for the main window |
| `src-tauri/src/lib.rs` | Main Rust library — tray setup, single-instance, app lifecycle |
| `src-tauri/src/main.rs` | Desktop binary entry point |
| `src-tauri/icons/icon.{png,ico,icns}` | App icons (copied from `src/icons/`) |
| `src/lib/tauriAdapter.js` | Frontend adapter that replaces `window.api.*` IPC calls |
| `docs/tauri-migration-map.md` | Full Electron → Tauri API mapping and risk analysis |
| `_electron_legacy/` | Original Electron files preserved for reference (not used) |

### Modified files

| File | Change |
|------|--------|
| `package.json` | Added `vite:dev`, `vite:build`, `dev`, `build` scripts; added `@tauri-apps/cli`, `@tauri-apps/api`, `@tauri-apps/plugin-dialog` as dependencies |
| `.gitignore` | Added `src-tauri/target/` |
| `src/ui/App.vue` | Added Tauri window-control buttons (minimise / close); added `isTauri` guard; imported `getCurrentWindow` from `@tauri-apps/api/window` |
| `src/ui/main.js` | Added `window-minimize` and `close` MDI icons to the offline icon bundle |
| `src/ui/css/index.css` | Reduced `.titlebar` `padding-right` from `6rem` → `0.5rem` (the 6 rem was reserved for Electron's native title-bar overlay); added `.titlebar-wc` and `.titlebar-wc--close` styles |
| `src/ui/js/utils/showDialog.js` | Replaced `window.api.alert()` with `alertDialog()` from `src/lib/tauriAdapter.js` |

---

## Tauri Plugins Added

| npm package | Rust crate | Version | Replaces |
|-------------|-----------|---------|---------|
| `@tauri-apps/plugin-dialog` | `tauri-plugin-dialog` | `2` | `ipcMain.handle("dialog")` + `dialog.showMessageBox()` |
| — | `tauri-plugin-single-instance` | `2` | `app.requestSingleInstanceLock()` + `app.on("second-instance")` |

**Built-in Tauri features used (no extra plugin):**

- `tauri` crate `features = ["tray-icon"]` — replaces `Tray`, `Menu`, `tray.on("click")`

---

## Rust Crates Added

| Crate | Version | Purpose |
|-------|---------|---------|
| `tauri` | `2` | Core application runtime |
| `tauri-build` | `2` | Build-time code generation |
| `tauri-plugin-dialog` | `2` | Native message dialogs |
| `tauri-plugin-single-instance` | `2` | Prevent multiple app instances |
| `serde` | `1` | Serialisation |
| `serde_json` | `1` | JSON support |

---

## Manual Steps Required

1. **Platform-specific bundle targets** — `tauri.conf.json` has `"targets": "all"`.
   Run `tauri build --target <deb|rpm|dmg|nsis>` or configure the `targets` array
   to match the platforms you ship.

2. **Code signing (macOS)** — Set `APPLE_SIGNING_IDENTITY`, `APPLE_CERTIFICATE`,
   `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD`, and
   `APPLE_TEAM_ID` environment variables for notarisation.  See the
   [Tauri code-signing docs](https://tauri.app/distribute/sign/macos/).

3. **Code signing (Windows)** — Provide a PFX certificate via the
   `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   environment variables.  See the
   [Tauri code-signing docs](https://tauri.app/distribute/sign/windows/).

4. **App updater** — The original Electron build did not use an auto-updater.
   If you want to add one, integrate `tauri-plugin-updater` and a public-key
   signing workflow.

5. **Capability tuning** — Review `src-tauri/capabilities/default.json`.
   Remove any permission that is not actively used in the application.

6. **Content Security Policy** — `tauri.conf.json` sets `"csp": null` to disable
   the CSP entirely.  This is required because NeoPlayer:
   - Loads WebAssembly (`chiptune3.worklet.wasm`) which needs `script-src 'wasm-unsafe-eval'`
   - Fetches module files from arbitrary external URLs (modarchive.org and others) which needs `connect-src *`
   
   Once you have a fixed list of allowed origins, replace `null` with a proper
   policy such as:
   ```
   "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://api.modarchive.org https:; font-src 'self'; style-src 'self' 'unsafe-inline'"
   ```

7. **macOS title-bar** — The migration uses `decorations: false` on all
   platforms for a uniform custom title bar.  If you prefer the native macOS
   traffic lights, set `decorations: true` in `tauri.conf.json` and add a
   `titleBarStyle: "Overlay"` window option for macOS using a platform-specific
   `tauri.macos.conf.json` file.

---

## Known Behavioural Differences from the Electron Version

| Feature | Electron behaviour | Tauri behaviour | Severity |
|---------|-------------------|-----------------|----------|
| macOS title bar | Standard native title bar with traffic-light buttons | Custom HTML close / minimise buttons (`decorations: false`) | Low — fully functional |
| Dialog `type: "none"` | System dialog with no icon | Mapped to `kind: "info"` (info icon) in `tauriAdapter.js` | Low — cosmetic |
| `autoplayPolicy: "no-user-gesture-required"` | Explicit Electron WebContents flag | No equivalent in Tauri; audio autoplay works in practice in embedded WebViews | Low — audio works |
| Tray double-click (Linux/Windows) | First click always toggles window | Left-button click-up toggles window via `TrayIconEvent::Click` | Very low |
| DevTools | Opened automatically in dev mode (`win.webContents.openDevTools()`) | Use Tauri's built-in inspector: right-click → Inspect, or set `devtools: true` in `tauri.conf.json` | Dev-only |

---

## How to Run

### Development

```sh
npm run dev
# Equivalent to: npm run deps && tauri dev
# Tauri will automatically start the Vite dev server (port 5173) and open the
# application window.
```

### Production Build

```sh
npm run build
# Equivalent to: npm run deps && tauri build
# Produces platform installers in src-tauri/target/release/bundle/
```

### Legacy Electron (reference only)

The original Electron scripts are still present for reference:

```sh
npm run start    # electron-forge start
npm run make     # electron-forge make (produces installer)
```

Note: the Electron devDependencies (`@electron-forge/*`, `electron`) are still
in `package.json` so the legacy scripts continue to work if needed.
