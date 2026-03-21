use tauri::Manager;

// MIGRATION NOTE — autoplay policy:
// Electron's BrowserWindow had `autoplayPolicy: "no-user-gesture-required"` which
// explicitly permitted audio playback without a prior user interaction.  Tauri's
// WebKitGTK (Linux) and WebView2 (Windows) runtimes do not expose this flag via
// config.  In practice, audio autoplay works inside embedded webviews without it,
// but if users encounter silent playback on a particular platform the developer
// may need to investigate platform-specific WebView flags.

// MIGRATION NOTE — macOS title-bar:
// The original Electron code used the default (non-hidden) title bar on macOS,
// giving users the native traffic-light buttons.  This Tauri build uses
// `decorations: false` on all platforms for a uniform custom title bar.  As a
// result, macOS users see the custom HTML minimise / close buttons instead of the
// native traffic lights.  To restore native traffic lights on macOS, set
// `decorations: true` in tauri.conf.json and add `titleBarStyle: "Overlay"` for
// macOS only using a platform-conditional `setup()` block or a separate
// `tauri.macos.conf.json` override.

/// Application entry point — called from main.rs (desktop) and from the
/// mobile entry point macro if mobile targets are ever added.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Replaces: app.requestSingleInstanceLock() + app.on("second-instance", ...)
        // When a second instance is launched this callback focuses the existing window.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        // Replaces: ipcMain.handle("dialog") + dialog.showMessageBox()
        // The frontend calls this plugin directly via @tauri-apps/plugin-dialog.
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Replaces: win.once("ready-to-show", () => win.show())
            // The window starts hidden (visible:false in tauri.conf.json) and is
            // shown here after the Tauri runtime has fully initialised.
            if let Some(win) = app.get_webview_window("main") {
                win.show()?;

                // Replaces: app.on("window-all-closed", () => app.quit()) for macOS.
                // On Windows/Linux Tauri exits automatically when the last window closes.
                // On macOS the app would stay alive, so we intercept CloseRequested and exit.
                #[cfg(target_os = "macos")]
                {
                    let handle = app.handle().clone();
                    win.on_window_event(move |event| {
                        if let tauri::WindowEvent::CloseRequested { .. } = event {
                            handle.exit(0);
                        }
                    });
                }
            }

            // Replaces: createTray() — system tray with Hide/Show and Quit items.
            // Only created on non-macOS, matching the original Electron behaviour.
            #[cfg(not(target_os = "macos"))]
            setup_tray(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Creates the system tray icon with a context menu.
///
/// Replaces:
///   - `new Tray(appIcon)`
///   - `tray.setToolTip(...)` / `tray.setContextMenu(...)`
///   - `tray.on("click", () => hideWindow(win))`
///   - `Menu.buildFromTemplate([{label:"Hide/Show Window"}, {label:"Quit"}])`
#[cfg(not(target_os = "macos"))]
fn setup_tray(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use tauri::{
        menu::{MenuBuilder, MenuItemBuilder},
        tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    };

    let hide_show =
        MenuItemBuilder::with_id("hide_show", "Hide/Show Window").build(app)?;
    let quit =
        MenuItemBuilder::with_id("quit", "Quit NeoPlayer").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&hide_show, &quit])
        .build()?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("NeoPlayer")
        .menu(&menu)
        // Replaces: context-menu click handlers (Hide/Show and Quit items)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "hide_show" => {
                if let Some(win) = app.get_webview_window("main") {
                    if win.is_visible().unwrap_or(false) {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        // Replaces: tray.on("click", () => hideWindow(win))
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    if win.is_visible().unwrap_or(false) {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
