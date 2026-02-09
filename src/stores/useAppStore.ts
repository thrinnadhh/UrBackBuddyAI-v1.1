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

    // Metrics
    metrics: { neck: number; shoulders: number; spine: number };
    corrections: string[];


    postureScore: number; // 0-100 (Display Value)
    targetScore: number;  // 0-100 (Internal Target)
    momentum: number;     // -1.0 to 1.0

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
    updateRealtimeStats: (result: boolean | { isGood: boolean; score?: number; metrics?: { neck: number; shoulders: number; spine: number }; corrections?: string[] }) => void;

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



    metrics: { neck: 100, shoulders: 100, spine: 100 }, // NEW: Granular Metrics
    corrections: [], // NEW: Directional Feedback

    postureScore: 100, // 0-100 (Display Value)
    targetScore: 100,
    momentum: 0,

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
    updateRealtimeStats: (result: any) => set((state) => {
        if (!state.isTracking) return {};

        // If simple boolean passed (legacy support or check), handle gracefully
        const isGood = typeof result === 'boolean' ? result : (result.isGood ?? true);
        const currentMetrics = (typeof result === 'object' && result?.metrics) ? result.metrics : { neck: 100, shoulders: 100, spine: 100 };
        const newScore = (typeof result === 'object' && result?.score !== undefined) ? result.score : (isGood ? 100 : 60);
        const currentCorrections = (typeof result === 'object' && result?.corrections) ? result.corrections : [];

        let { postureScore, momentum, slouchTime, metrics } = state;

        // --- 1. Global Score Smoothing ---
        // Lerp towards the calculated global score from the logic layer
        const diff = newScore - postureScore;
        postureScore += diff * 0.1; // Smooth transition

        // --- 2. Metric Smoothing ---
        // Smooth individual metrics towards their real-time targets
        metrics = {
            neck: Math.round(metrics.neck + (currentMetrics.neck - metrics.neck) * 0.1),
            shoulders: Math.round(metrics.shoulders + (currentMetrics.shoulders - metrics.shoulders) * 0.1),
            spine: Math.round(metrics.spine + (currentMetrics.spine - metrics.spine) * 0.1),
        };

        // --- 3. Momentum & Slouch Time ---
        if (isGood) {
            momentum = Math.min(1.0, momentum + 0.05);
        } else {
            momentum = Math.max(-1.0, momentum - 0.1);
            slouchTime += 0.033;
        }

        return {
            postureScore: parseFloat(postureScore.toFixed(2)),
            targetScore: newScore, // Update target directly from logic
            momentum,
            slouchTime: parseFloat(slouchTime.toFixed(3)),
            metrics,
            corrections: currentCorrections // Update corrections directly (no smoothing needed)
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
