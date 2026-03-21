import { alertDialog } from '../../../lib/tauriAdapter.js';

// Replaces: window.api.alert(options)  (Electron contextBridge / ipcRenderer)
// Now delegates to the Tauri adapter which calls @tauri-apps/plugin-dialog.
export default (type, title, message) => {
  return alertDialog({
    type,
    title,
    message,
  });
}