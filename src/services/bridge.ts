import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility: number;
}

export const bridge = {
    // --- Camera & Hardware ---
    initCamera: async () => invoke<string>("init_camera"),
    killCamera: async () => invoke<boolean>("kill_camera"),

    // --- Data Layer ---
    initDb: async () => invoke<string>("init_db"),

    // --- AI Engine ---
    initAi: async () => invoke<string>("init_ai"),
    startTracking: async () => invoke<string>("start_tracking"),
    stopTracking: async () => invoke<string>("stop_tracking"),

    // --- Session Management ---
    saveSession: async (duration: number, score: number) =>
        invoke<string>("save_session_data", { duration, score }),

    getRecentSessions: async () => invoke<SessionData[]>("get_recent_sessions"),

    // --- Settings & Logs (NEW) ---
    saveSetting: async (key: string, value: string) =>
        invoke<string>("save_setting", { key, value }),

    getSettings: async () => invoke<Record<string, string>>("get_settings"),

    logPrivacyEvent: async (event: string, hash: string) =>
        invoke<string>("log_privacy_event", { event, hash }),

    getDashboardStats: async () => invoke<DashboardStats>("get_dashboard_stats"),

    // --- Analytics ---
    getAnalyticsSummary: async () => invoke<AnalyticsSummary>("get_analytics_summary"),

    // --- Alert System ---
    sendNotification: async (title: string, body: string) => invoke<void>("send_notification", { title, body }),
    playAlertSound: async () => invoke<void>("play_alert_sound"),

    // --- Events ---
    onPoseUpdate: (callback: (landmarks: Landmark[]) => void) => {
        return listen<Landmark[]>("pose_update", (event) => {
            callback(event.payload);
        });
    }
};

export interface SessionData {
    id: number;
    timestamp: string;
    duration: number;
    score: number;
}

export interface DashboardStats {
    current_streak: number;
    focus_time_today: number;
    coaching_stage: number;
}

export interface DailyPoint {
    date: string;
    score: number;
}

export interface HourlyPoint {
    hour: string;
    score: number;
}

export interface AnalyticsSummary {
    current_streak: number;
    best_streak: number;
    total_focus_hours: number;
    daily_trend: DailyPoint[];
    hourly_breakdown: HourlyPoint[];
}
