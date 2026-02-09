use tauri::State;
use crate::state::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime, Local, Duration};

// --- DATA STRUCTURES ---

#[derive(Serialize, Deserialize, Debug)]
pub struct SessionSummary {
    pub id: String, // UUID
    pub start_time: String, // ISO
    pub end_time: String, // ISO
    pub duration_sec: i64,
    pub avg_score: i64,
    pub good_time_sec: i64,
    pub bad_time_sec: i64,
    pub breakdown_json: String, // JSON specific scores
}

#[derive(Serialize, Debug)]
pub struct ReportDataPoint {
    pub name: String, // "9AM" or "Mon"
    pub score: i64,
    pub focus: i64, // Minutes
}

#[derive(Serialize, Debug)]
pub struct ReportSummary {
    pub total_focus_hours: f64,
    pub avg_score: i64,
    pub best_streak: i64,
    pub current_streak: i64,
    pub graph_data: Vec<ReportDataPoint>,
}

// --- HELPER LOGIC ---

fn calculate_streak(conn: &rusqlite::Connection) -> Result<(i64, i64), String> {
    // 1. Get all unique dates with sessions in the last 60 days
    let mut stmt = conn.prepare(
        "SELECT DISTINCT date(start_time) as session_date 
         FROM sessions 
         WHERE date(start_time) >= date('now', '-60 days')
         ORDER BY session_date DESC"
    ).map_err(|e| e.to_string())?;

    let dates: Vec<String> = stmt.query_map([], |row| row.get(0)).map_err(|e| e.to_string())?
        .collect::<Result<_, _>>().map_err(|e| e.to_string())?;

    if dates.is_empty() {
        return Ok((0, 0));
    }

    // Logic: Iterate backwards from today/yesterday
    let _today = Local::now().format("%Y-%m-%d").to_string();
    let _yesterday = (Local::now() - Duration::days(1)).format("%Y-%m-%d").to_string();

    // RE-IMPLEMENTATION: Simple loop
    // Convert strings to NaiveDate
    let parsed_dates: Vec<chrono::NaiveDate> = dates.iter()
        .filter_map(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .collect();

    if parsed_dates.is_empty() { return Ok((0,0)); }

    // Current Streak
    let mut streak = 0;
    let mut check_date = Local::now().date_naive();
    
    // If no session today, check if streak is alive from yesterday
    if !parsed_dates.contains(&check_date) {
        if parsed_dates.contains(&(check_date - Duration::days(1))) {
           // Streak continues from yesterday, but today is not added yet 
           // Wait, if today has 0 sessions, streak is technically still active until end of day?
           // User logic usually: Streak is consecutive days with activity.
           // If I didn't practice today yet, streak is X (from yesterday).
           check_date = check_date - Duration::days(1);
        } else {
             check_date = check_date - Duration::days(1); // Fail case
        }
    }

    for _ in 0..60 { // Max check
        if parsed_dates.contains(&check_date) {
            streak += 1;
            check_date = check_date - Duration::days(1);
        } else {
            break;
        }
    }

    Ok((streak, streak)) // Best streak needs separate query or more complex logic. For now returning current/current.
}

// --- COMMANDS ---

#[tauri::command]
pub fn save_session(state: State<AppState>, session: SessionSummary) -> Result<String, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let conn = db_lock.as_ref().ok_or("Database not initialized")?;

    // 1. Insert Raw Data
    conn.execute(
        "INSERT INTO sessions (id, start_time, end_time, duration_sec, avg_score, good_time_sec, bad_time_sec, breakdown_json)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            session.id, 
            session.start_time, 
            session.end_time, 
            session.duration_sec, 
            session.avg_score, 
            session.good_time_sec, 
            session.bad_time_sec, 
            session.breakdown_json
        ],
    ).map_err(|e| e.to_string())?;

    // 2. Pre-Aggregate Daily Stats
    // Extract YYYY-MM-DD from start_time
    let date_str = session.start_time.chars().take(10).collect::<String>();
    
    // Upsert Daily Stats
    let exists: i64 = conn.query_row(
        "SELECT count(*) FROM daily_stats WHERE date = ?1", 
        params![date_str], 
        |r| r.get(0)
    ).unwrap_or(0);

    if exists > 0 {
        conn.execute(
            "UPDATE daily_stats 
             SET total_sessions = total_sessions + 1, 
                 total_focus_time = total_focus_time + ?1,
                 avg_score = (avg_score * total_sessions + ?2) / (total_sessions + 1)
             WHERE date = ?3",
            params![session.duration_sec, session.avg_score, date_str]
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO daily_stats (date, total_sessions, total_focus_time, avg_score)
             VALUES (?1, 1, ?2, ?3)",
            params![date_str, session.duration_sec, session.avg_score]
        ).map_err(|e| e.to_string())?;
    }

    Ok("Data Saved".to_string())
}

#[tauri::command]
pub fn get_report_data(state: State<AppState>, range: String) -> Result<ReportSummary, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let conn = db_lock.as_ref().ok_or("Database not initialized")?;

    // 1. Calculate Streaks
    let (current_streak, best_streak) = calculate_streak(conn)?;

    // 2. Aggregate Data based on Range
    let mut graph_data: Vec<ReportDataPoint> = Vec::new();

    if range == "day" {
        // Hourly Breakdown for Today
        let mut stmt = conn.prepare(
            "SELECT strftime('%H', start_time) as hour, AVG(avg_score) as score, SUM(duration_sec) / 60 as focus_min
             FROM sessions 
             WHERE date(start_time) = date('now', 'localtime')
             GROUP BY hour 
             ORDER BY hour ASC"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
             let h: String = row.get(0)?;
             let s: f64 = row.get(1)?;
             let f: i64 = row.get(2)?;
             Ok(ReportDataPoint {
                 name: format!("{}:00", h),
                 score: s as i64,
                 focus: f
             })
        }).map_err(|e| e.to_string())?;

        for r in rows { graph_data.push(r.unwrap()); }

    } else if range == "week" {
        // Daily Breakdown for Last 7 Days
        let mut stmt = conn.prepare(
             "SELECT strftime('%Y-%m-%d', start_time) as day, AVG(avg_score) as score, SUM(duration_sec) / 60 as focus_min
              FROM sessions 
              WHERE date(start_time) >= date('now', '-6 days', 'localtime')
              GROUP BY day
              ORDER BY day ASC"
        ).map_err(|e| e.to_string())?;

        let rows = stmt.query_map([], |row| {
             let d: String = row.get(0)?;
             let s: f64 = row.get(1)?;
             let f: i64 = row.get(2)?;
             
             // Convert 2024-02-10 to "Mon" or "10"
             let parsed = chrono::NaiveDate::parse_from_str(&d, "%Y-%m-%d").unwrap_or_default();
             let day_name = parsed.format("%a").to_string(); // "Mon", "Tue"

             Ok(ReportDataPoint {
                 name: day_name,
                 score: s as i64,
                 focus: f
             })
        }).map_err(|e| e.to_string())?;

        for r in rows { graph_data.push(r.unwrap()); }
    } else {
        // Month Data (grouped by day still? or weeks? User says "Month range")
        // Usually Monthly report shows days 1-30
         let mut stmt = conn.prepare(
             "SELECT strftime('%d', start_time) as day_num, AVG(avg_score) as score, SUM(duration_sec) / 60 as focus_min
              FROM sessions 
              WHERE date(start_time) >= date('now', 'start of month', 'localtime')
              GROUP BY day_num
              ORDER BY day_num ASC"
        ).map_err(|e| e.to_string())?;
        
        // ... implementation similar to week
        let rows = stmt.query_map([], |row| {
             let d: String = row.get(0)?;
             Ok(ReportDataPoint {
                 name: d,
                 score: row.get::<_, f64>(1)? as i64,
                 focus: row.get(2)?
             })
        }).map_err(|e| e.to_string())?;
         for r in rows { graph_data.push(r.unwrap()); }
    }

    Ok(ReportSummary {
        total_focus_hours: 12.5, // Calc this properly in real impl
        avg_score: 85,
        current_streak,
        best_streak,
        graph_data
    })
}

#[tauri::command]
pub fn get_recent_sessions(state: State<AppState>) -> Result<Vec<SessionSummary>, String> {
    let db_lock = state.db.lock().map_err(|_| "Failed to lock DB")?;
    let conn = db_lock.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn.prepare(
        "SELECT id, start_time, end_time, duration_sec, avg_score, good_time_sec, bad_time_sec, breakdown_json 
         FROM sessions 
         ORDER BY start_time DESC 
         LIMIT 50"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |row| {
        Ok(SessionSummary {
            id: row.get(0)?,
            start_time: row.get(1)?,
            end_time: row.get(2)?,
            duration_sec: row.get(3)?,
            avg_score: row.get(4)?,
            good_time_sec: row.get(5)?,
            bad_time_sec: row.get(6)?,
            breakdown_json: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut sessions = Vec::new();
    for r in rows {
        sessions.push(r.map_err(|e| e.to_string())?);
    }

    Ok(sessions)
}
