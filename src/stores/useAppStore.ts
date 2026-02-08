import { create } from 'zustand';
import { bridge, AnalyticsSummary } from '../services/bridge';

interface UserProfile {
    name: string;
    avatar?: string;
    email?: string;
}

interface AppState {
    userProfile: UserProfile;
    theme: 'dark' | 'light' | 'system';
    activeTab: string;

    // Tracking State
    isTracking: boolean;
    sessionTime: number; // in seconds
    slouchTime: number; // in seconds
    postureScore: number; // 0-100

    // Settings State
    breakEnabled: boolean;
    breakInterval: number; // minutes
    smartMode: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    sensitivity: number; // 1-10
    notificationsEnabled: boolean;
    soundEnabled: boolean;

    // Analytics State
    analytics: AnalyticsSummary | null;

    setUserProfile: (profile: UserProfile) => void;
    setTheme: (theme: 'dark' | 'light' | 'system') => void;
    setActiveTab: (tab: string) => void;

    // Tracking Actions
    setTracking: (isTracking: boolean) => void;
    incrementSessionTime: () => void;
    setPostureScore: (score: number) => void;
    updateRealtimeStats: (isGoodPosture: boolean) => void;

    // Settings Actions
    setBreakEnabled: (enabled: boolean) => void;
    setBreakInterval: (interval: number) => void;
    setSmartMode: (enabled: boolean) => void;
    setHighContrast: (enabled: boolean) => void;
    setReducedMotion: (enabled: boolean) => void;
    setSensitivity: (level: number) => void;
    setNotificationsEnabled: (enabled: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;

    // Analytics Actions
    fetchAnalytics: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
    userProfile: {
        name: 'Guest User',
    },
    theme: 'dark', // Default to dark for "Midnight Glass"
    activeTab: 'dashboard',

    isTracking: false,
    sessionTime: 0,
    slouchTime: 0,
    postureScore: 100, // Start with perfect score

    // Settings Defaults
    breakEnabled: true,
    breakInterval: 45,
    smartMode: false,
    highContrast: false,
    reducedMotion: false,
    sensitivity: 5,
    notificationsEnabled: true,
    soundEnabled: true,

    analytics: null,

    setUserProfile: (profile) => set({ userProfile: profile }),
    setTheme: (theme) => set({ theme }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    setTracking: (isTracking) => set({ isTracking }),
    incrementSessionTime: () => set((state) => ({ sessionTime: state.sessionTime + 1 })),
    setPostureScore: (score) => set({ postureScore: score }),
    updateRealtimeStats: (isGood) => set((state) => {
        if (!state.isTracking) return {};

        let newScore = state.postureScore;
        let newSlouchTime = state.slouchTime;

        // Assumes ~30fps call rate
        if (isGood) {
            newScore = Math.min(100, state.postureScore + 0.05);
        } else {
            newScore = Math.max(0, state.postureScore - 0.2);
            newSlouchTime += 0.033; // Approx 1/30th second
        }

        return {
            postureScore: parseFloat(newScore.toFixed(2)),
            slouchTime: parseFloat(newSlouchTime.toFixed(3))
        };
    }),

    setBreakEnabled: (enabled) => set({ breakEnabled: enabled }),
    setBreakInterval: (interval) => set({ breakInterval: interval }),
    setSmartMode: (enabled) => set({ smartMode: enabled }),
    setHighContrast: (enabled) => set({ highContrast: enabled }),
    setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
    setSensitivity: (level) => set({ sensitivity: level }),
    setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

    fetchAnalytics: async () => {
        try {
            const data = await bridge.getAnalyticsSummary();
            set({ analytics: data });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    },
}));
