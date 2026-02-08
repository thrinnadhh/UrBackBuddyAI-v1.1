import { create } from 'zustand';
import { bridge } from '../services/bridge';

type Theme = 'light' | 'dark';
type Tab = 'dashboard' | 'privacy' | 'settings';

interface LogEntry {
    id: string;
    timestamp: string;
    hash: string;
    action: string;
}

interface CameraSignal {
    id: string;
    type: 'face' | 'pose';
    confidence: number;
}

interface AppState {
    // Config
    theme: Theme;
    fontSize: number; // percentage, e.g., 100
    cameraEnabled: boolean;
    privacyLogExpanded: boolean;
    currentTab: Tab;

    // Mock Data (still needed for UI state representation)
    last15MinLogs: LogEntry[];
    cameraSignals: CameraSignal[];

    // App State
    isInitialized: boolean;
    error: string | null;

    // Actions
    toggleTheme: () => void;
    setFontSize: (size: number) => void;
    toggleCamera: () => Promise<void>;
    togglePrivacyLog: () => void;
    setTab: (tab: Tab) => void;
    initialize: () => Promise<void>;
}

// Generate some mock logs
const generateMockLogs = (): LogEntry[] => {
    const logs = [];
    const actions = ['Frame Captured', 'Landmarks Extracted', 'Privacy Hash Generated', 'Frame Dropped'];
    for (let i = 0; i < 20; i++) {
        const date = new Date();
        date.setSeconds(date.getSeconds() - i * 5);
        logs.push({
            id: Math.random().toString(36).substr(2, 9),
            timestamp: date.toLocaleTimeString(),
            hash: 'sha256-' + Math.random().toString(36).substr(2, 8) + '...',
            action: actions[i % actions.length],
        });
    }
    return logs;
};

export const useAppStore = create<AppState>((set, get) => ({
    theme: 'dark',
    fontSize: 100,
    cameraEnabled: false,
    privacyLogExpanded: false,
    currentTab: 'dashboard',

    last15MinLogs: generateMockLogs(),
    cameraSignals: [],

    isInitialized: false,
    error: null,

    toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    setFontSize: (size) => set({ fontSize: size }),

    toggleCamera: async () => {
        const { cameraEnabled } = get();
        try {
            if (cameraEnabled) {
                // If currently enabled, we want to disable (Kill Switch)
                await bridge.killCamera();
                set({ cameraEnabled: false });
            } else {
                // If currently disabled, we want to enable (Acquire Handle)
                await bridge.initCamera();
                set({ cameraEnabled: true });
            }
            set({ error: null });
        } catch (e: any) {
            console.error('Failed to toggle camera:', e);
            set({ error: `Camera Error: ${e.toString()}` });
            // Revert state if needed, or just let error linger
        }
    },

    togglePrivacyLog: () => set((state) => ({ privacyLogExpanded: !state.privacyLogExpanded })),
    setTab: (tab) => set({ currentTab: tab }),

    initialize: async () => {
        try {
            if (get().isInitialized) return;
            await bridge.initDb();
            set({ isInitialized: true, error: null });
        } catch (e: any) {
            console.error('Failed to initialize app backend:', e);
            set({ error: `Backend Init Failed: ${e.toString()}` });
        }
    }
}));
