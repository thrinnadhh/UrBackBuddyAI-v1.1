import { useEffect, useCallback } from 'react';
import { GlobalScore } from '../components/dashboard/GlobalScore';
import { CoachingPlan } from '../components/dashboard/CoachingPlan';
import { PoseOverlay } from '../components/PoseOverlay';
import { Timer, Flame } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { bridge } from '../services/bridge'; // Import bridge

export default function Dashboard() {
    const {
        isTracking,
        sessionTime,
        postureScore,
        incrementSessionTime,
        setTracking,
        fetchAnalytics,
        analytics
    } = useAppStore();

    // Fetch analytics on mount
    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Timer Integration
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isTracking) {
            interval = setInterval(() => {
                incrementSessionTime();
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking, incrementSessionTime]);

    // Tracking Logic - Explicit Handler
    const toggleTracking = useCallback(async () => {
        try {
            if (isTracking) {
                console.log("Stopping tracking...");
                await bridge.stopTracking();
                if (sessionTime > 5) {
                    await bridge.saveSession(sessionTime, postureScore);
                }
                setTracking(false);
                // setSessionTime(0); // Optional: keep time for display or reset? User snippet said reset.
            } else {
                console.log("Starting tracking...");
                const response = await bridge.startTracking();
                console.log("Backend response:", response);
                setTracking(true);
            }
        } catch (error) {
            console.error("CRITICAL ERROR:", error);
            alert(`Failed to toggle AI Engine: ${error}`);
            setTracking(false);
        }
    }, [isTracking, sessionTime, postureScore, setTracking]);

    // Format time (MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
    };

    return (
        <div className="p-8 h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">

            {/* LEFT COLUMN: Main Score & Camera */}
            <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Good Morning, Guest.</h1>
                        <p className="text-white/40 text-sm mt-1">Ready to improve your posture today?</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-mono font-bold text-emerald-400 tabular-nums tracking-wider">
                            {formatTime(sessionTime)}
                        </div>
                        <p className="text-white/30 text-xs uppercase tracking-widest mt-1">Session Time</p>
                    </div>
                </div>

                {/* Main Stage */}
                <div className="flex-1 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-8 shadow-2xl">
                    <div className="absolute top-4 left-6 flex items-center gap-2">
                        <div className={`w - 2 h - 2 rounded - full ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'} `} />
                        <span className="text-xs font-medium text-white/50 tracking-wider">
                            {isTracking ? 'LIVE ANALYSIS' : 'STANDBY'}
                        </span>
                    </div>

                    <div className="w-full max-w-md aspect-square relative flex items-center justify-center">
                        <GlobalScore score={postureScore} />

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-full max-w-[70%] max-h-[70%] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                                <PoseOverlay
                                    sensitivity={5} // Could be connected to store.sensitivity
                                />
                                {!isTracking && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                                        <span className="text-white/50 font-mono text-xs">CAMERA PAUSED</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 flex gap-4">
                        <button
                            onClick={toggleTracking}
                            className={`px - 8 py - 3 rounded - full font - bold text - sm tracking - wide transition - all shadow - lg hover: scale - 105 active: scale - 95 flex items - center gap - 2 ${isTracking
                                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20'
                                : 'bg-emerald-500 text-black hover:bg-emerald-400'
                                } `}
                        >
                            {isTracking ? 'STOP TRACKING' : 'START SESSION'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Stats & Coaching */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                <CoachingPlan
                    score={analytics?.daily_trend?.[analytics.daily_trend.length - 1]?.score || postureScore}
                />

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Streak Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <Flame className="text-red-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white font-mono leading-none">
                                {analytics?.current_streak || 0}
                            </div>
                            <div className="text-xs text-white/40">Day Streak</div>
                        </div>
                    </div>

                    {/* Focus Time Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                            <Timer className="text-blue-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white font-mono leading-none">
                                {analytics ? analytics.total_focus_hours.toFixed(1) : '0.0'}h
                            </div>
                            <div className="text-xs text-white/40">Total Focus</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
