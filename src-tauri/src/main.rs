#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;
mod pose;
mod state;

use nokhwa::{
    pixel_format::RgbFormat,
    utils::{CameraIndex, RequestedFormat, RequestedFormatType},
    Camera,
};
use rusqlite::params;
use state::AppState;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State, WindowEvent,
};
use std::collections::HashMap;
use serde::Serialize;
use tauri_plugin_notification::NotificationExt;

// GLOBAL FLAG: Controls the background thread
static IS_TRACKING: AtomicBool = AtomicBool::new(false);

// --- LEGACY STRUCTS (Mirroring types for legacy internal commands if needed) ---
#[derive(Serialize)]
pub struct DashboardStatsStruct {
    pub current_streak: i64,
    pub focus_time_today: i64,
    pub coaching_stage: i64,
}

#[derive(Serialize)]
pub struct AnalyticsSummary {
    pub current_streak: i64, // Changed to i64 to match DB
    pub best_streak: i64,
    pub total_focus_hours: f64,
    pub daily_trend: Vec<DailyPoint>,
    pub hourly_breakdown: Vec<HourlyPoint>,
}

#[derive(Serialize)]
pub struct DailyPoint {
    pub date: String,
    pub score: i64,
}

#[derive(Serialize)]
pub struct HourlyPoint {
    pub hour: String,
    pub score: i64,
}


// --- COMMANDS ---

#[tauri::command]
fn init_camera(state: State<AppState>) -> Result<String, String> {
    let mut camera_lock = state.camera.lock().map_err(|_| "Failed to lock camera")?;
    if camera_lock.is_some() {
        return Ok("Camera already active".to_string());
    }

    let index = CameraIndex::Index(0);
    
    // RELAXED FORMAT: Fixes "Not Found/Rejected/Unsupported" on many webcams
    // We stop forcing YUYV/640x480 and let the backend (nokhwa) pick the best match
    // usually MJPEG or YUYV at a compatible resolution.
    let format = RequestedFormat::new::<RgbFormat>(RequestedFormatType::None);

    let mut camera = Camera::new(index, format).map_err(|e| e.to_string())?;
    camera.open_stream().map_err(|e| e.to_string())?;

    *camera_lock = Some(camera);
    Ok("Camera Initialized".to_string())
}

#[tauri::command]
fn kill_camera(state: State<AppState>) -> bool {
    IS_TRACKING.store(false, Ordering::Relaxed);
    let mut camera_lock = state.camera.lock().unwrap();
    if let Some(mut cam) = camera_lock.take() {
        let _ = cam.stop_stream();
        return true;
    }
    false
}

#[tauri::command]
fn init_ai(app_handle: tauri::AppHandle, state: State<AppState>) -> Result<String, String> {
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Path Error: {}", e))?
        .join("resources/pose_model.onnx");

    if !resource_path.exists() {
        return Err(format!("Model missing at {:?}", resource_path));
    }
    state.pose_engine.load_model(resource_path)
}

#[tauri::command]
fn start_tracking(app_handle: tauri::AppHandle, state: State<AppState>) -> Result<String, String> {
    if IS_TRACKING.load(Ordering::Relaxed) {
        return Ok("Already tracking".to_string());
    }

    let mut camera_lock = state.camera.lock().map_err(|_| "Failed to lock camera")?;
    if camera_lock.is_none() {
        println!("📷 initializing camera...");
        let index = CameraIndex::Index(0);
        
        // FAIL-SAFE: Use 'None' to avoid locking the device configuration
        // This lets the OS decide the best format (usually 720p/1080p MJPEG or YUYV)
        // avoiding "Lock Rejected" errors on macOS
        let format = RequestedFormat::new::<RgbFormat>(RequestedFormatType::None);
        
        match Camera::new(index, format) {
            Ok(new_cam) => {
                println!("✅ Camera Object Created (Default Config)");
                *camera_lock = Some(new_cam);
            },
            Err(e) => {
                println!("❌ Camera Creation Failed: {}", e);
                return Err(format!("Camera Error: {}", e));
            }
        }
    }

    if let Some(cam) = camera_lock.as_mut() {
        if !cam.is_stream_open() {
            println!("🔄 Opening Camera Stream...");
            if let Err(e) = cam.open_stream() {
                println!("❌ Failed to open stream: {}", e);
                return Err(format!("Camera Stream Error: {}", e));
            } else {
                println!("✅ Stream Open!");
            }
        }
    }
    drop(camera_lock);

    IS_TRACKING.store(true, Ordering::Relaxed);
    let state_clone = state.inner().clone();

    thread::spawn(move || {
        println!("🚀 Background tracking thread started...");
        let mut loop_count = 0;
        
        while IS_TRACKING.load(Ordering::Relaxed) {
            let start_time = Instant::now();
            
            // HEARTBEAT
            if loop_count % 30 == 0 { let _ = app_handle.emit("tracking_debug", "❤️ Tracking Heartbeat"); }

            let frame_data = {
                if let Ok(mut camera_lock) = state_clone.camera.lock() {
                    if let Some(cam) = camera_lock.as_mut() {
                        match cam.frame() {
                            Ok(frame) => {
                                match frame.decode_image::<RgbFormat>() {
                                    Ok(decoded) => {
                                         // let _ = app_handle.emit("tracking_debug", "✅ Frame Decoded");
                                         Some((decoded.into_raw(), frame.resolution().width(), frame.resolution().height()))
                                    },
                                    Err(e) => {
                                        let msg = format!("❌ Frame Decode Error: {}", e);
                                        println!("{}", msg);
                                        let _ = app_handle.emit("tracking_debug", &msg);
                                        None
                                    },
                                }
                            }
                            Err(e) => {
                                let msg = format!("❌ Camera Frame Error: {}", e);
                                println!("{}", msg);
                                let _ = app_handle.emit("tracking_debug", &msg);
                                None
                            },
                        }
                    } else { 
                        if loop_count % 60 == 0 { let _ = app_handle.emit("tracking_debug", "⚠️ Camera Lock is None inside thread"); }
                        None 
                    }
                } else { 
                    let _ = app_handle.emit("tracking_debug", "⚠️ Failed to lock camera mutex");
                    None 
                }
            };

            if let Some((buffer, width, height)) = frame_data {
                // let _ = app_handle.emit("tracking_debug", "🧠 Running Inference...");
                match state_clone.pose_engine.infer(buffer, width, height) {
                    Ok(landmarks) => {
                        let _ = app_handle.emit("pose_update", &landmarks);
                        if loop_count % 30 == 0 { 
                            let _ = app_handle.emit("tracking_debug", &format!("✅ Landmarks detected: {}", landmarks.len())); 
                        }
                    }
                    Err(e) => {
                        let msg = format!("⚠️ Inference Error: {}", e);
                        if loop_count % 30 == 0 { println!("{}", msg); }
                        let _ = app_handle.emit("tracking_debug", &msg);
                    }
                }
            } else {
                 // Warn if no frame data but we aren't printing specific errors (e.g. lock failed)
            }

            loop_count += 1;
            let elapsed = start_time.elapsed();
            if elapsed < Duration::from_millis(66) {
                thread::sleep(Duration::from_millis(66) - elapsed);
            }
        }
        
        println!("🛑 Tracking loop exited. Checking camera drop...");
        let _ = app_handle.emit("tracking_debug", "🛑 Tracking loop exited");
        if let Ok(mut camera_lock) = state_clone.camera.lock() {
             if let Some(mut cam) = camera_lock.take() {
                let _ = cam.stop_stream();
                println!("📸 Camera Dropped & Stream Stopped");
            }
        }
    });

    Ok("Tracking Started".to_string())
}

#[tauri::command]
fn stop_tracking() -> String {
    IS_TRACKING.store(false, Ordering::Relaxed);
    "Tracking Stopped".to_string()
}

// --- LEGACY / HELPER COMMANDS (To be refactored eventually) ---

#[tauri::command]
fn save_setting(state: State<AppState>, key: String, value: String) -> Result<String, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)", params![key, value]).map_err(|e| e.to_string())?;
        Ok("Saved".to_string())
    } else { Err("No DB".to_string()) }
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> Result<HashMap<String, String>, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?))).map_err(|e| e.to_string())?;
        let mut map = HashMap::new();
        for r in rows { let (k,v) = r.map_err(|e| e.to_string())?; map.insert(k, v); }
        Ok(map)
    } else { Err("No DB".to_string()) }
}

#[tauri::command]
fn log_privacy_event(state: State<AppState>, event: String, hash: String) -> Result<String, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        conn.execute("INSERT INTO privacy_logs (event, hash) VALUES (?1, ?2)", params![event, hash]).map_err(|e| e.to_string())?;
        Ok("Logged".to_string())
    } else { Err("No DB".to_string()) }
}

#[tauri::command]
fn get_dashboard_stats(state: State<AppState>) -> Result<DashboardStatsStruct, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        let mut progress_stmt = conn.prepare("SELECT current_streak, coaching_stage FROM user_progress WHERE id = 1").map_err(|e| e.to_string())?;
        let (current_streak, coaching_stage) = progress_stmt.query_row([], |row| Ok((row.get(0)?, row.get(1)?))).unwrap_or((0, 1));
        
        // Fix table name here (using daily_stats now)
        let date_str = chrono::Local::now().format("%Y-%m-%d").to_string();
        let mut stats_stmt = conn.prepare("SELECT total_focus_time FROM daily_stats WHERE date = ?1").map_err(|e| e.to_string())?; // using total_focus_time from db.rs
        let focus_time_today: i64 = stats_stmt.query_row(params![date_str], |row| row.get(0)).unwrap_or(0);

        Ok(DashboardStatsStruct { current_streak, focus_time_today, coaching_stage })
    } else { Err("No DB".to_string()) }
}

#[tauri::command]
fn get_analytics_summary(state: State<AppState>) -> Result<AnalyticsSummary, String> {
    // Re-implement or call logic from commands.rs?
    // This is the "Overview" for the dashboard (different from Reports tab).
    // Let's implement it quickly using the new schema.
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
         let mut total_stmt = conn.prepare("SELECT SUM(total_focus_time) FROM daily_stats").map_err(|e| e.to_string())?;
         let total_seconds: i64 = total_stmt.query_row([], |row| Ok(row.get::<_, Option<i64>>(0)?.unwrap_or(0))).unwrap_or(0);
         let total_focus_hours = total_seconds as f64 / 3600.0;

         // Daily Trend
         let mut trend_stmt = conn.prepare("SELECT date, avg_score FROM daily_stats ORDER BY date DESC LIMIT 7").map_err(|e| e.to_string())?;
         let trend_iter = trend_stmt.query_map([], |row| Ok(DailyPoint{ date: row.get(0)?, score: row.get(1)? })).map_err(|e| e.to_string())?;
         let mut daily_trend: Vec<DailyPoint> = trend_iter.map(|r| r.unwrap()).collect();
         daily_trend.reverse();

         // Hourly (Today) logic
         let mut hourly_stmt = conn.prepare("SELECT strftime('%H', start_time) as h, AVG(avg_score) FROM sessions WHERE date(start_time) = date('now') GROUP BY h").map_err(|e| e.to_string())?;
         let hourly_iter = hourly_stmt.query_map([], |row| {
             let h: String = row.get(0)?;
             let s: f64 = row.get(1)?;
             Ok(HourlyPoint { hour: format!("{}:00", h), score: s as i64 })
         }).map_err(|e| e.to_string())?;
         let mut hourly_breakdown: Vec<HourlyPoint> = hourly_iter.map(|r| r.unwrap()).collect();

         // Streak
         let mut p_stmt = conn.prepare("SELECT current_streak, best_streak FROM user_progress WHERE id = 1").map_err(|e| e.to_string())?;
         let (curr, best) = p_stmt.query_row([], |row| Ok((row.get(0)?, row.get(1)?))).unwrap_or((0,0));

         Ok(AnalyticsSummary { current_streak: curr, best_streak: best, total_focus_hours, daily_trend, hourly_breakdown })
    } else { Err("No DB".to_string()) }
}

#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) {
    let _ = app.notification().builder().title(title).body(body).show();
}

#[tauri::command]
fn play_alert_sound() {
    // Stub
    println!("♪ BEEP ♪");
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
             let quit_i = MenuItem::new(app, "Quit", true, None::<&str>)?;
             let show_i = MenuItem::new(app, "Show", true, None::<&str>)?;
             let menu = Menu::with_items(app, &[&show_i, &quit_i])?;
             let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .build(app)?;
             Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                IS_TRACKING.store(false, Ordering::Relaxed);
                if window.hide().is_ok() { api.prevent_close(); }
            }
        })
        .invoke_handler(tauri::generate_handler![
            init_camera, kill_camera, init_ai, start_tracking, stop_tracking,
            // New Mod Commands
            db::init_db,
            commands::save_session,
            commands::get_report_data,
            commands::get_recent_sessions,
            // Legacy / Local
            save_setting, get_settings, log_privacy_event, get_dashboard_stats, get_analytics_summary,
            send_notification, play_alert_sound
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
