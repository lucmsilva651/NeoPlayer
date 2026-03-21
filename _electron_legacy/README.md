# _electron_legacy

This directory contains the **original Electron main-process files** that were
replaced during the migration to Tauri 2.x.  They are kept here as a reference
and **should not be run** from this location.

| File | Original location | Purpose |
|------|-------------------|---------|
| `src/electron/main.js` | `src/electron/main.js` | Electron main process entry point |
| `src/electron/preload.js` | `src/electron/preload.js` | Electron contextBridge preload script |
| `forge.config.js` | `forge.config.js` | Electron Forge packaging configuration |
| `vite.main.config.js` | `vite.main.config.js` | Vite config for the Electron main process build |
| `vite.preload.config.js` | `vite.preload.config.js` | Vite config for the Electron preload script build |

See `TAURI_MIGRATION.md` at the repo root for full migration details.
