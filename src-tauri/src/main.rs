// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod pose; 

use state::AppState;
use tauri::{State, Manager, Emitter}; 
use nokhwa::{
    pixel_format::RgbFormat,
    utils::{CameraIndex, RequestedFormat, RequestedFormatType},
    Camera,
};
use rusqlite::Connection;
use std::thread;
use std::time::{Duration, Instant};
use std::sync::atomic::{AtomicBool, Ordering};

// GLOBAL FLAG: Controls the background thread
// True = Run Loop, False = Stop Loop
static IS_TRACKING: AtomicBool = AtomicBool::new(false);

// COMMAND 1: Init Camera
#[tauri::command]
fn init_camera(state: State<AppState>) -> Result<String, String> {
    let mut camera_lock = state.camera.lock().map_err(|_| "Failed to lock camera")?;
    if camera_lock.is_some() { return Ok("Camera already active".to_string()); }

    // 1. Pick the first available camera (Index 0)
    let index = CameraIndex::Index(0);
    // 2. Request a standard 640x480 format (YUYV is safer for Mac FaceTime Cameras)
    let format = RequestedFormat::new::<RgbFormat>(RequestedFormatType::Closest(
        nokhwa::utils::CameraFormat::new(
            nokhwa::utils::Resolution::new(640, 480),
            nokhwa::utils::FrameFormat::YUYV,
            30,
        ),
    ));

    // 3. Open the Camera Stream
    let mut camera = Camera::new(index, format).map_err(|e| e.to_string())?;
    camera.open_stream().map_err(|e| e.to_string())?;

    // 4. Store it in State
    *camera_lock = Some(camera);
    Ok("Camera Initialized".to_string())
}

// COMMAND 2: Kill Switch
#[tauri::command]
fn kill_camera(state: State<AppState>) -> bool {
    // 1. Stop the loop first
    IS_TRACKING.store(false, Ordering::Relaxed);
    
    // 2. Kill the hardware
    let mut camera_lock = state.camera.lock().unwrap();
    println!("🔌 KILL SWITCH ACTIVATED");

    if let Some(mut cam) = camera_lock.take() {
        let _ = cam.stop_stream();
        println!("Camera dropped.");
        return true;
    }
    false
}

// COMMAND 3: Init DB
#[tauri::command]
fn init_db(state: State<AppState>) -> Result<String, String> {
    let mut db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if db_lock.is_none() {
        let conn = Connection::open("posturesense.db").map_err(|e| e.to_string())?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS session_logs (id INTEGER PRIMARY KEY, timestamp TEXT)", 
            []
        ).map_err(|e| e.to_string())?;
        
        *db_lock = Some(conn);
        Ok("DB Connected".to_string())
    } else {
        Ok("DB already connected".to_string())
    }
}

// COMMAND 4: Initialize AI Engine
#[tauri::command]
fn init_ai(app_handle: tauri::AppHandle, state: State<AppState>) -> Result<String, String> {
    let resource_path = app_handle.path().resource_dir()
        .map_err(|e| format!("Path Error: {}", e))?
        .join("resources/pose_model.onnx");

    if !resource_path.exists() {
        return Err(format!("Model missing at {:?}", resource_path));
    }

    state.pose_engine.load_model(resource_path)
}

// COMMAND 5: Start Tracking (PRODUCTION MODE)
#[tauri::command]
fn start_tracking(app_handle: tauri::AppHandle, state: State<AppState>) -> Result<String, String> {
    if IS_TRACKING.load(Ordering::Relaxed) {
        return Ok("Already tracking".to_string());
    }

    IS_TRACKING.store(true, Ordering::Relaxed);
    let state_clone = state.inner().clone();
    
    thread::spawn(move || {
        println!("🚀 Tracking Started (Silent Mode)");

        while IS_TRACKING.load(Ordering::Relaxed) {
            let start_time = Instant::now();

            let frame_data = {
                if let Ok(mut camera_lock) = state_clone.camera.lock() {
                    if let Some(cam) = camera_lock.as_mut() {
                        match cam.frame() {
                            Ok(frame) => {
                                // Auto-decode to RGB (Crucial for compatibility)
                                match frame.decode_image::<RgbFormat>() {
                                    Ok(decoded) => Some((decoded.into_raw(), frame.resolution().width(), frame.resolution().height())),
                                    Err(_) => None 
                                }
                            },
                            Err(_) => None
                        }
                    } else { None }
                } else { None }
            };

            if let Some((buffer, width, height)) = frame_data {
                if let Ok(landmarks) = state_clone.pose_engine.infer(buffer, width, height) {
                    // Send data silently
                    let _ = app_handle.emit("pose_update", &landmarks);
                }
            }

            let elapsed = start_time.elapsed();
            if elapsed < Duration::from_millis(66) {
                thread::sleep(Duration::from_millis(66) - elapsed);
            }
        }
        println!("🛑 Tracking Stopped");
    });

    Ok("Tracking Started".to_string())
}

// COMMAND 6: Stop Tracking
#[tauri::command]
fn stop_tracking() -> String {
    IS_TRACKING.store(false, Ordering::Relaxed);
    "Tracking Stopping...".to_string()
}

fn main() {
    let app_state = AppState::default();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            init_camera, 
            kill_camera, 
            init_db,
            init_ai,
            start_tracking,
            stop_tracking
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}