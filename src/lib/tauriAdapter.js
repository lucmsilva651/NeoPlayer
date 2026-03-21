/**
 * tauriAdapter.js
 *
 * Single adapter module that replaces every call that previously went through
 * the Electron contextBridge (`window.api.*` / `ipcRenderer.invoke`).
 *
 * Each export matches the interface that the rest of the frontend expects so
 * that callers only need to update their import path.
 */

import { message } from '@tauri-apps/plugin-dialog';

/**
 * Show a native message dialog.
 *
 * Replaces: `window.api.alert(options)` → `ipcRenderer.invoke("dialog", options)`
 *           which called `dialog.showMessageBox()` in the Electron main process.
 *
 * @param {object} options
 * @param {'error'|'info'|'warning'|'none'} options.type  - Dialog kind.
 *        'none' is mapped to 'info' because @tauri-apps/plugin-dialog does not
 *        support a "no-icon" variant.
 * @param {string}   options.title    - Dialog window title.
 * @param {string}   options.message  - Body text shown in the dialog.
 * @returns {Promise<void>}
 */
export function alertDialog({ type, title, message: body }) {
  // Map Electron dialog types to Tauri dialog kinds.
  const kindMap = { error: 'error', warning: 'warning', info: 'info', none: 'info' };
  const kind = kindMap[type] ?? 'info';

  if (!('__TAURI_INTERNALS__' in window)) {
    // Fallback for non-Tauri environments (e.g. plain browser preview).
    // eslint-disable-next-line no-alert
    window.alert(`${title}\n\n${body}`);
    return Promise.resolve();
  }

  return message(body, { title, kind });
}
