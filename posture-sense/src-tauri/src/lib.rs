use std::sync::Mutex;
use tauri::{State, Manager};
// use nokhwa::Camera; // Using Camera as the struct in 0.10
// use rusqlite::Connection;

// Placeholder types to ensure compilation if dependencies aren't fully resolved yet
// In a real scenario, these would direct map to nokhwa::Camera (or CameraStream?) and rusqlite::Connection
// Nokhwa 0.10 usually uses Camera. The user requested CameraStream. Let's try to honor CameraStream or aliases.
// Actually, let's use the explicit names requested but keep them wrapped if needed.

// THE PRIVACY ENGINE STATE
// Wrapping CameraStream in Option allows us to Drop it (Kill Switch)
pub struct AppState {
    pub db: Mutex<Option<rusqlite::Connection>>,
    // User requested CameraStream. In 0.10 it is Camera usually, but maybe they mean Camera + Stream?
    // Let's use nokhwa::Camera for now as it's the main handle.
    // If I use CameraStream and it doesn't exist, compilation fails.
    // I will use nokhwa::Camera and add a comment that this represents the stream handle.
    pub camera: Mutex<Option<nokhwa::Camera>>, 
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(None),
            camera: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
