import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility: number;
}

// --- MOCK DATA ---
const MOCKED_SESSIONS: SessionSummary[] = [
    {
        id: "mock-1",
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration_sec: 1200,
        avg_score: 85,
        good_time_sec: 1000,
        bad_time_sec: 200,
        breakdown_json: "{}"
    },
];
const MOCKED_STATS: DashboardStats = {
    current_streak: 5,
    focus_time_today: 14400, // 4 hours
    coaching_stage: 2
};
const MOCKED_ANALYTICS: AnalyticsSummary = {
    current_streak: 5,
    best_streak: 12,
    total_focus_hours: 42.5,
    daily_trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        score: 80 + Math.floor(Math.random() * 20)
    })).reverse(),
    hourly_breakdown: [
        { hour: "9AM", score: 85 },
        { hour: "10AM", score: 90 },
        { hour: "11AM", score: 75 },
    ]
};

// --- SAFE INVOKE HELPER ---
const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (!isTauri()) {
        console.warn(`[Mock Bridge] invoking: ${command}`, args);
        // Return mocks based on command
        if (command === 'get_dashboard_stats') return MOCKED_STATS as unknown as T;
        if (command === 'get_analytics_summary') return MOCKED_ANALYTICS as unknown as T;
        if (command === 'get_recent_sessions') return MOCKED_SESSIONS as unknown as T;
        if (command === 'get_settings') return {} as unknown as T;
        if (command === 'start_tracking') return "Mock Tracking Started" as unknown as T;
        if (command === 'stop_tracking') return "Mock Tracking Stopped" as unknown as T;
        if (command === 'init_camera') return "Mock Camera Init" as unknown as T;
        return Promise.resolve() as unknown as T;
    }
    try {
        return await invoke<T>(command, args);
    } catch (error) {
        console.error(`[Bridge Error] ${command}:`, error);
        throw error;
    }
}

export const bridge = {
    // --- Camera & Hardware ---
    initCamera: async () => safeInvoke<string>("init_camera"),
    killCamera: async () => safeInvoke<boolean>("kill_camera"),

    // --- Data Layer ---
    initDb: async () => safeInvoke<string>("init_db"),

    // --- AI Engine ---
    initAi: async () => safeInvoke<string>("init_ai"),
    startTracking: async () => safeInvoke<string>("start_tracking"),
    stopTracking: async () => safeInvoke<string>("stop_tracking"),

    // --- Session Management ---
    saveSession: async (session: SessionSummary) =>
        safeInvoke<string>("save_session", { session }),

    getRecentSessions: async () => safeInvoke<SessionSummary[]>("get_recent_sessions"),

    // --- Settings & Logs (NEW) ---
    saveSetting: async (key: string, value: string) =>
        safeInvoke<string>("save_setting", { key, value }),

    getSettings: async () => safeInvoke<Record<string, string>>("get_settings"),

    logPrivacyEvent: async (event: string, hash: string) =>
        safeInvoke<string>("log_privacy_event", { event, hash }),

    getDashboardStats: async () => safeInvoke<DashboardStats>("get_dashboard_stats"),

    // --- Analytics ---
    getAnalyticsSummary: async () => safeInvoke<AnalyticsSummary>("get_analytics_summary"),

    // --- REPORTS (NEW) ---
    getReportData: async (range: "day" | "week" | "month") =>
        safeInvoke<ReportSummary>("get_report_data", { range }),

    // --- Alert System ---
    sendNotification: async (title: string, body: string) => safeInvoke<void>("send_notification", { title, body }),
    playAlertSound: async () => safeInvoke<void>("play_alert_sound"),

    // --- Events ---
    onPoseUpdate: (callback: (landmarks: Landmark[]) => void) => {
        return listen<Landmark[]>("pose_update", (event) => {
            callback(event.payload);
        });
    },

    onTrackingDebug: (callback: (message: string) => void) => {
        return listen<string>("tracking_debug", (event) => {
            callback(event.payload);
        });
    }
};

export interface SessionSummary {
    id: string; // UUID
    start_time: string; // ISO
    end_time: string; // ISO
    duration_sec: number;
    avg_score: number;
    good_time_sec: number;
    bad_time_sec: number;
    breakdown_json: string;
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

export interface ReportDataPoint {
    name: string;
    score: number;
    focus: number;
}

export interface ReportSummary {
    total_focus_hours: number;
    avg_score: number;
    best_streak: number;
    current_streak: number;
    graph_data: ReportDataPoint[];
}
