#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod commands;
mod pose;
mod state;

use state::AppState;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, MouseButton, TrayIconEvent},
    Emitter, Manager, State, WindowEvent,
};
use std::collections::HashMap;
use serde::Serialize;
use rusqlite::params;
use tauri_plugin_notification::NotificationExt;

// GLOBAL FLAG: Controls the background thread
static IS_TRACKING: AtomicBool = AtomicBool::new(false);

// --- LEGACY STRUCTS ---
#[derive(Serialize)]
pub struct DashboardStatsStruct {
    pub current_streak: i64,
    pub focus_time_today: i64,
    pub coaching_stage: i64,
}

#[derive(Serialize)]
pub struct AnalyticsSummary {
    pub current_streak: i64,
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

// NOTE: We stripped out Nokhwa. These camera commands now just toggle the flag
// or do nothing, assuming the Frontend handles the MediaStream directly.
// We keep the signatures to avoid breaking the Frontend Bridge calling them.

#[tauri::command]
fn init_camera(_state: State<AppState>) -> Result<String, String> {
    // No-op for backend camera. Frontend uses navigator.mediaDevices
    Ok("Backend Camera Init Skipped (Frontend Mode)".to_string())
}

#[tauri::command]
fn kill_camera(_state: State<AppState>) -> bool {
    IS_TRACKING.store(false, Ordering::Relaxed);
    true
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
fn start_tracking(_app_handle: tauri::AppHandle, _state: State<AppState>) -> Result<String, String> {
    // Just set the flag, no actual backend tracking loop
    IS_TRACKING.store(true, Ordering::Relaxed);
    Ok("Tracking Flag Set".to_string())
}

#[tauri::command]
fn stop_tracking() -> String {
    IS_TRACKING.store(false, Ordering::Relaxed);
    "Tracking Stopped".to_string()
}

// --- DB / HELPER COMMANDS ---

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
        
        let date_str = chrono::Local::now().format("%Y-%m-%d").to_string();
        let mut stats_stmt = conn.prepare("SELECT total_focus_time FROM daily_stats WHERE date = ?1").map_err(|e| e.to_string())?;
        let focus_time_today: i64 = stats_stmt.query_row(params![date_str], |row| row.get(0)).unwrap_or(0);

        Ok(DashboardStatsStruct { current_streak, focus_time_today, coaching_stage })
    } else { Err("No DB".to_string()) }
}

#[tauri::command]
fn get_analytics_summary(state: State<AppState>) -> Result<AnalyticsSummary, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    if let Some(conn) = db_lock.as_ref() {
         let mut total_stmt = conn.prepare("SELECT SUM(total_focus_time) FROM daily_stats").map_err(|e| e.to_string())?;
         let total_seconds: i64 = total_stmt.query_row([], |row| Ok(row.get::<_, Option<i64>>(0)?.unwrap_or(0))).unwrap_or(0);
         let total_focus_hours = total_seconds as f64 / 3600.0;

         let mut trend_stmt = conn.prepare("SELECT date, avg_score FROM daily_stats ORDER BY date DESC LIMIT 7").map_err(|e| e.to_string())?;
         let trend_iter = trend_stmt.query_map([], |row| Ok(DailyPoint{ date: row.get(0)?, score: row.get(1)? })).map_err(|e| e.to_string())?;
         let mut daily_trend: Vec<DailyPoint> = trend_iter.map(|r| r.unwrap()).collect();
         daily_trend.reverse();

         let mut hourly_stmt = conn.prepare("SELECT strftime('%H', start_time) as h, AVG(avg_score) FROM sessions WHERE date(start_time) = date('now') GROUP BY h").map_err(|e| e.to_string())?;
         let hourly_iter = hourly_stmt.query_map([], |row| {
             let h: String = row.get(0)?;
             let s: f64 = row.get(1)?;
             Ok(HourlyPoint { hour: format!("{}:00", h), score: s as i64 })
         }).map_err(|e| e.to_string())?;
         let mut hourly_breakdown: Vec<HourlyPoint> = hourly_iter.map(|r| r.unwrap()).collect();

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
                // Background tracking stop logic if meaningful
                if window.hide().is_ok() { api.prevent_close(); }
            }
        })
        .invoke_handler(tauri::generate_handler![
            init_camera, kill_camera, init_ai, start_tracking, stop_tracking,
            db::init_db,
            commands::save_session,
            commands::get_report_data,
            commands::get_recent_sessions,
            save_setting, get_settings, log_privacy_event, get_dashboard_stats, get_analytics_summary,
            send_notification, play_alert_sound
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
