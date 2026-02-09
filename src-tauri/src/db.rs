use rusqlite::{params, Connection, Result};
use tauri::State;
use crate::state::AppState;

#[tauri::command]
pub fn init_db(state: State<AppState>) -> Result<String, String> {
    let mut db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    
    // If already initialized, return early (or just check existence)
    if db_lock.is_none() {
        let conn = Connection::open("posturesense.db").map_err(|e| e.to_string())?;

        // 1. Sessions Table (Raw Log Data)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                duration_sec INTEGER NOT NULL,
                avg_score INTEGER NOT NULL,
                good_time_sec INTEGER NOT NULL,
                bad_time_sec INTEGER NOT NULL,
                breakdown_json TEXT
            )",
            [],
        ).map_err(|e| e.to_string())?;

        // 2. Daily Stats (Aggregated)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS daily_stats (
                date TEXT PRIMARY KEY,
                total_sessions INTEGER DEFAULT 0,
                total_focus_time INTEGER DEFAULT 0,
                avg_score INTEGER DEFAULT 0
            )",
            [],
        ).map_err(|e| e.to_string())?;

        // 3. User Progress (Streaks) - Kept from original if needed, or we rely on aggregation
        conn.execute(
            "CREATE TABLE IF NOT EXISTS user_progress (
                id INTEGER PRIMARY KEY, 
                current_streak INTEGER DEFAULT 0, 
                best_streak INTEGER DEFAULT 0,
                last_active_date TEXT
            )",
            [],
        ).map_err(|e| e.to_string())?;

        // 4. Settings (Preserve existing)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY, 
                value TEXT
            )",
            [],
        ).map_err(|e| e.to_string())?;

        *db_lock = Some(conn);
        Ok("Database Initialized".to_string())
    } else {
        Ok("Database already initialized".to_string())
    }
}
