// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod pose;
mod state;

use nokhwa::{
    pixel_format::RgbFormat,
    utils::{CameraIndex, RequestedFormat, RequestedFormatType},
    Camera,
};
use rusqlite::{params, Connection};
use state::AppState;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State, WindowEvent,
};
use serde::Serialize;
// --- ALERT SYSTEM ---
use tauri_plugin_notification::NotificationExt;
use rodio::{source::Source, OutputStream, Sink};
use std::collections::HashMap;

// GLOBAL FLAG: Controls the background thread
// True = Run Loop, False = Stop Loop
static IS_TRACKING: AtomicBool = AtomicBool::new(false);

// --- STRUCTS ---

// Data Struct for History
#[derive(Serialize)]
pub struct SessionData {
    pub id: i64,
    pub timestamp: String,
    pub duration: i64,
    pub score: i64,
}

// Data Struct for Dashboard Stats
#[derive(Serialize)]
pub struct DashboardStatsStruct {
    pub current_streak: i64,
    pub focus_time_today: i64,
    pub coaching_stage: i64,
}

// Data Structs for Analytics
#[derive(Serialize)]
pub struct DailyPoint {
    pub date: String,
    pub score: i32,
}

#[derive(Serialize)]
pub struct HourlyPoint {
    pub hour: String,
    pub score: i32,
}

#[derive(Serialize)]
pub struct AnalyticsSummary {
    pub current_streak: i32,
    pub best_streak: i32,
    pub total_focus_hours: f32,
    pub daily_trend: Vec<DailyPoint>,
    pub hourly_breakdown: Vec<HourlyPoint>,
}


// --- COMMANDS ---

// COMMAND 1: Init Camera
#[tauri::command]
fn init_camera(state: State<AppState>) -> Result<String, String> {
    let mut camera_lock = state.camera.lock().map_err(|_| "Failed to lock camera")?;
    if camera_lock.is_some() {
        return Ok("Camera already active".to_string());
    }

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

        // 1. Session Logs (Existing)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS session_logs (
                id INTEGER PRIMARY KEY, 
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                duration INTEGER,
                score INTEGER
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

        // 2. Settings (New)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY, 
                value TEXT
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

        // 3. Daily Stats (New)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT PRIMARY KEY, 
                total_focus_seconds INTEGER, 
                slouch_duration_seconds INTEGER, 
                breaks_taken INTEGER, 
                score INTEGER
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

        // 4. User Progress (New)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY, 
                current_streak INTEGER, 
                best_streak INTEGER, 
                coaching_stage INTEGER
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

        // 5. Privacy Logs (New)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS privacy_logs (
                id INTEGER PRIMARY KEY, 
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
                event TEXT, 
                hash TEXT
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

        *db_lock = Some(conn);
        Ok("DB Connected".to_string())
    } else {
        Ok("DB already connected".to_string())
    }
}

// COMMAND 4: Initialize AI Engine
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

// COMMAND 5: Start Tracking (PRODUCTION MODE)
#[tauri::command]
fn start_tracking(app_handle: tauri::AppHandle, state: State<AppState>) -> Result<String, String> {
    // 1. Check if already running
    if IS_TRACKING.load(Ordering::Relaxed) {
        println!("Backend: Already tracking");
        return Ok("Already tracking".to_string());
    }

    // 2. Check Camera Initialization
    let camera_lock = state.camera.lock().map_err(|_| "Failed to lock camera mutex")?;
    if camera_lock.is_none() {
        return Err("Camera not initialized. Call init_camera() first.".to_string());
    }
    drop(camera_lock); // Release lock before thread spawning

    // 3. Check Model Logic (Simple existence check)
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Resource dir error: {}", e))?
        .join("resources/pose_model.onnx");

    if !resource_path.exists() {
        println!("CRITICAL: Model missing at {:?}", resource_path);
        return Err(format!("Model missing at: {:?}", resource_path));
    }

    // 4. Start Thread
    println!("Backend: Tracking Started!");
    IS_TRACKING.store(true, Ordering::Relaxed);
    let state_clone = state.inner().clone();

    thread::spawn(move || {
        println!("🚀 Background tracking thread started...");
        
        while IS_TRACKING.load(Ordering::Relaxed) {
            let start_time = Instant::now();

            // Safe Frame Capture
            let frame_data = {
                if let Ok(mut camera_lock) = state_clone.camera.lock() {
                    if let Some(cam) = camera_lock.as_mut() {
                        match cam.frame() {
                            Ok(frame) => {
                                // Auto-decode to RGB (Crucial for compatibility)
                                match frame.decode_image::<RgbFormat>() {
                                    Ok(decoded) => Some((
                                        decoded.into_raw(),
                                        frame.resolution().width(),
                                        frame.resolution().height(),
                                    )),
                                    Err(_) => None,
                                }
                            }
                            Err(_) => None,
                        }
                    } else {
                        None
                    }
                } else {
                    None
                }
            };

            if let Some((buffer, width, height)) = frame_data {
                // Safe Inference
                if let Ok(landmarks) = state_clone.pose_engine.infer(buffer, width, height) {
                    let _ = app_handle.emit("pose_update", &landmarks);
                }
            }

            // Frame Limiter (~15 FPS to save CPU) - Adjusted for performance
            let elapsed = start_time.elapsed();
            if elapsed < Duration::from_millis(66) {
                thread::sleep(Duration::from_millis(66) - elapsed);
            }
        }
        println!("🛑 Tracking Stopped");
    });

    Ok("Tracking Started Successfully".to_string())
}

// COMMAND 6: Stop Tracking
#[tauri::command]
fn stop_tracking() -> String {
    IS_TRACKING.store(false, Ordering::Relaxed);
    "Tracking Stopping...".to_string()
}

// COMMAND 7: Save Session Data
#[tauri::command]
fn save_session_data(state: State<AppState>, duration: i64, score: i64) -> Result<String, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;

    if let Some(conn) = db_lock.as_ref() {
        conn.execute(
            "INSERT INTO session_logs (duration, score) VALUES (?1, ?2)",
            params![duration, score],
        )
        .map_err(|e| e.to_string())?;
        Ok("Session Saved".to_string())
    } else {
        Err("Database not initialized".to_string())
    }
}

// COMMAND 8: Get Recent Sessions (History)
#[tauri::command]
fn get_recent_sessions(state: State<AppState>) -> Result<Vec<SessionData>, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    if let Some(conn) = db_lock.as_ref() {
        let mut stmt = conn.prepare("SELECT id, timestamp, duration, score FROM session_logs ORDER BY id DESC LIMIT 50")
            .map_err(|e| e.to_string())?;
        
        let session_iter = stmt.query_map([], |row| {
            Ok(SessionData {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                duration: row.get(2)?,
                score: row.get(3)?,
            })
        }).map_err(|e| e.to_string())?;

        let mut sessions = Vec::new();
        for session in session_iter {
            sessions.push(session.map_err(|e| e.to_string())?);
        }
        
        Ok(sessions)
    } else {
        Err("Database not initialized".to_string())
    }
}

// COMMAND 9: Save Setting
#[tauri::command]
fn save_setting(state: State<AppState>, key: String, value: String) -> Result<String, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
        Ok("Setting Saved".to_string())
    } else {
        Err("Database not initialized".to_string())
    }
}

// COMMAND 10: Get Settings
#[tauri::command]
fn get_settings(state: State<AppState>) -> Result<HashMap<String, String>, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).map_err(|e| e.to_string())?;

        let mut settings = HashMap::new();
        for row in rows {
            let (key, value): (String, String) = row.map_err(|e| e.to_string())?;
            settings.insert(key, value);
        }
        Ok(settings)
    } else {
        Err("Database not initialized".to_string())
    }
}

// COMMAND 11: Log Privacy Event
#[tauri::command]
fn log_privacy_event(state: State<AppState>, event: String, hash: String) -> Result<String, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        conn.execute(
            "INSERT INTO privacy_logs (event, hash) VALUES (?1, ?2)",
            params![event, hash],
        )
        .map_err(|e| e.to_string())?;
        Ok("Event Logged".to_string())
    } else {
        Err("Database not initialized".to_string())
    }
}

// COMMAND 12: Get Dashboard Stats
#[tauri::command]
fn get_dashboard_stats(state: State<AppState>) -> Result<DashboardStatsStruct, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        // 1. Get User Progress
        let mut progress_stmt = conn.prepare("SELECT current_streak, coaching_stage FROM user_progress WHERE id = 1").map_err(|e| e.to_string())?;
        let progress_iter = progress_stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        }).map_err(|e| e.to_string())?;
        
        let (current_streak, coaching_stage) = if let Some(Ok(row)) = progress_iter.into_iter().next() {
            row
        } else {
            (0, 0) // Default if no record
        };

        // 2. Get Today's Focus Time
        let date_str = chrono::Local::now().format("%Y-%m-%d").to_string();
        
        let mut stats_stmt = conn.prepare("SELECT total_focus_seconds FROM daily_stats WHERE date = ?1").map_err(|e| e.to_string())?;
        let stats_iter = stats_stmt.query_map(params![date_str], |row| {
             Ok(row.get(0)?)
        }).map_err(|e| e.to_string())?;

        let focus_time_today: i64 = if let Some(Ok(val)) = stats_iter.into_iter().next() {
            val
        } else {
            0
        };

        Ok(DashboardStatsStruct {
            current_streak,
            focus_time_today,
            coaching_stage,
        })
    } else {
        Err("Database not initialized".to_string())
    }
}

// COMMAND 13: Get Analytics Summary
#[tauri::command]
fn get_analytics_summary(state: State<AppState>) -> Result<AnalyticsSummary, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
        // 1. Total Focus Hours (All time)
        let mut total_stmt = conn.prepare("SELECT SUM(total_focus_seconds) FROM daily_stats").map_err(|e| e.to_string())?;
        let total_seconds: i64 = total_stmt.query_row([], |row| {
             Ok(row.get::<_, Option<i64>>(0)?.unwrap_or(0))
        }).unwrap_or(0);
        
        let total_focus_hours = total_seconds as f32 / 3600.0;

        // 2. Daily Trend (Last 7 Days)
        let mut trend_stmt = conn.prepare(
            "SELECT date, score FROM daily_stats 
             ORDER BY date DESC LIMIT 7"
        ).map_err(|e| e.to_string())?;

        let trend_iter = trend_stmt.query_map([], |row| {
             Ok(DailyPoint {
                 date: row.get(0)?,
                 score: row.get(1)?,
             })
        }).map_err(|e| e.to_string())?;

        let mut daily_trend: Vec<DailyPoint> = trend_iter.map(|r| r.unwrap()).collect();
        daily_trend.reverse(); // Show oldest to newest in graph

        // 3. Hourly Breakdown (From session_logs)
        let mut hourly_stmt = conn.prepare(
            "SELECT strftime('%H', timestamp) as hour, AVG(score) as avg_score 
             FROM session_logs 
             GROUP BY hour 
             HAVING hour BETWEEN '09' AND '18'
             ORDER BY hour ASC"
        ).map_err(|e| e.to_string())?;

        let hourly_iter = hourly_stmt.query_map([], |row| {
             Ok(HourlyPoint {
                 hour: row.get::<_, String>(0)? + ":00",
                 score: row.get::<_, f64>(1)? as i32,
             })
        }).map_err(|e| e.to_string())?;

        let hourly_breakdown: Vec<HourlyPoint> = hourly_iter.map(|r| r.unwrap()).collect();

        // 4. Streak Logic
        let mut date_stmt = conn.prepare("SELECT date FROM daily_stats ORDER BY date DESC").map_err(|e| e.to_string())?;
        let dates: Vec<String> = date_stmt.query_map([], |row| Ok(row.get(0)?))
            .map_err(|e| e.to_string())?
            .map(|r| r.unwrap())
            .collect();

        let mut current_streak = 0;
        let mut best_streak = 0;
        
        if !dates.is_empty() {
            // Current Streak
            let today = chrono::Local::now().format("%Y-%m-%d").to_string();
            let yesterday = (chrono::Local::now() - chrono::Duration::days(1)).format("%Y-%m-%d").to_string();
            
            let mut streak_active = false;
            let mut check_date_str = today.clone();

            if dates.contains(&today) {
                streak_active = true;
            } else if dates.contains(&yesterday) {
                streak_active = true;
                check_date_str = yesterday.clone();
            }

            if streak_active {
                 let mut current_date = chrono::NaiveDate::parse_from_str(&check_date_str, "%Y-%m-%d").unwrap_or_default();
                 
                 loop {
                     if dates.contains(&current_date.format("%Y-%m-%d").to_string()) {
                         current_streak += 1;
                         current_date = current_date.pred_opt().unwrap();
                     } else {
                         break;
                     }
                 }
            }

            // Best Streak
            if !dates.is_empty() {
                let mut temp_streak = 1;
                let mut prev_date = chrono::NaiveDate::parse_from_str(&dates[0], "%Y-%m-%d").unwrap_or_default();

                for i in 1..dates.len() {
                    let curr_date = chrono::NaiveDate::parse_from_str(&dates[i], "%Y-%m-%d").unwrap_or_default();
                    let diff = prev_date.signed_duration_since(curr_date).num_days();

                    if diff == 1 {
                        temp_streak += 1;
                    } else {
                        if temp_streak > best_streak { best_streak = temp_streak; }
                        temp_streak = 1;
                    }
                    prev_date = curr_date;
                }
                if temp_streak > best_streak { best_streak = temp_streak; }
            }
        }

        Ok(AnalyticsSummary {
            current_streak,
            best_streak,
            total_focus_hours,
            daily_trend,
            hourly_breakdown,
        })
    } else {
        Err("Database not initialized".to_string())
    }
}

// --- ALERT SYSTEM COMMANDS ---
#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) {
    let _ = app.notification()
        .builder()
        .title(title)
        .body(body)
        .show();
}

#[tauri::command]
fn play_alert_sound() {
    std::thread::spawn(|| {
        /* 
        // TODO: Fix rodio 0.21 API mismatch
        if let Ok((_stream, stream_handle)) = OutputStream::try_default() {
            if let Ok(sink) = Sink::try_new(&stream_handle) {
                let source = rodio::source::SineWave::new(440.0)
                    .take_duration(Duration::from_millis(200))
                    .amplify(0.10);
                sink.append(source);
                sink.sleep_until_end();
            }
        }
        */
        println!("beep!");
    });
}

// MAIN FUNCTION
fn main() {
    let app_state = AppState::default();

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // --- SYSTEM TRAY SETUP ---
            let quit_i = MenuItem::new(app, "Quit UrBackBuddy", true, None::<&str>)?;
            let show_i = MenuItem::new(app, "Show Dashboard", true, None::<&str>)?;
            
            // Capture IDs for matching
            let quit_id = quit_i.id().clone();
            let show_id = show_i.id().clone();

            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app: &tauri::AppHandle, event| {
                    if event.id == quit_id {
                         app.exit(0);
                    } else if event.id == show_id {
                        if let Some(window) = app.get_webview_window("main") {
                             let _ = window.show();
                             let _ = window.set_focus();
                        }
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    let tray: &TrayIcon = tray; 
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Prevent app from closing, just hide it to tray
                if window.hide().is_ok() {
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            init_camera,
            kill_camera,
            init_db,
            init_ai,
            start_tracking,
            stop_tracking,
            save_session_data,
            get_recent_sessions,
            save_setting,
            get_settings,
            log_privacy_event,
            get_dashboard_stats,
            get_analytics_summary,
            // Alert Commands
            send_notification,
            play_alert_sound
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
