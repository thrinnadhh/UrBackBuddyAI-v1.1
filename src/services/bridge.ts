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
