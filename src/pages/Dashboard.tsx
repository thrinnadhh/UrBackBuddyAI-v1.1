import { useEffect, useCallback, useState } from 'react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { GlobalScore } from '../components/dashboard/GlobalScore';
import RobotBuddy from '../components/dashboard/RobotBuddy';
import { CoachingPlan } from '../components/dashboard/CoachingPlan';
import { PoseOverlay } from '../components/PoseOverlay';
import { Timer, Flame, Zap } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { bridge } from '../services/bridge';

// Power Bar Vital Component (Vertical Sci-Fi Style)
const BodyVitalCard = ({ label, score, color, icon }: { label: string, score: number, color: string, icon: string }) => (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col items-center justify-between gap-3 group hover:bg-zinc-800/60 hover:border-white/10 transition-all h-32 relative overflow-hidden">
        {/* Background Scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:animate-[shimmer_2s_infinite]" />

        <div className="flex flex-col items-center z-10">
            <span className="text-xl mb-1">{icon}</span>
            <span className={`text-[10px] font-bold tracking-widest ${color}`}>{label}</span>
        </div>

        {/* Vertical Power Bar */}
        <div className="w-2 h-full bg-zinc-800 rounded-full relative overflow-hidden flex-1 max-h-[60px]">
            <div
                className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ease-out ${color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor]`}
                style={{ height: `${score}%` }}
            />
        </div>

        <span className="text-xs text-white font-mono z-10">{Math.round(score)}%</span>
    </div>
);

// Robot Speech Bubble Component
const RobotCommunication = ({ corrections, isTracking }: { corrections: string[], isTracking: boolean }) => {
    const [msgIndex, setMsgIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");

    // Cycle messages
    useEffect(() => {
        if (corrections.length > 0) {
            const interval = setInterval(() => {
                setMsgIndex(prev => (prev + 1) % corrections.length);
            }, 3000);
            return () => clearInterval(interval);
        } else {
            setMsgIndex(0);
        }
    }, [corrections.length]);

    // Typewriter effect for text
    useEffect(() => {
        const targetText = corrections.length > 0
            ? corrections[msgIndex % corrections.length]
            : (isTracking ? "Scanning posture..." : "Ready to assist!");

        let i = 0;
        setDisplayText("");
        const typeInterval = setInterval(() => {
            if (i < targetText.length) {
                setDisplayText(targetText.slice(0, i + 1));
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 30);

        return () => clearInterval(typeInterval);
    }, [msgIndex, corrections, isTracking]);

    const isAlert = corrections.length > 0;

    return (
        <div className={`
            absolute -top-12 left-1/2 transform -translate-x-1/2 z-20 
            max-w-[200px] w-full
            ${isAlert ? 'animate-bounce-slight' : ''}
        `}>
            <div className={`
                relative bg-zinc-900/90 backdrop-blur-xl border px-4 py-3 rounded-2xl shadow-xl
                ${isAlert ? 'border-red-500/50 text-red-100' : 'border-emerald-500/30 text-emerald-100'}
            `}>
                <p className="text-xs font-mono leading-relaxed text-center">
                    {displayText}
                    <span className="animate-pulse">_</span>
                </p>
                {/* Triangle Pointer */}
                <div className={`
                    absolute -bottom-2 left-1/2 transform -translate-x-1/2 
                    w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]
                    ${isAlert ? 'border-t-red-900/90' : 'border-t-zinc-900/90'}
                `} />
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { videoRef, startTracking: startCamera, stopTracking: stopCamera, posture: hookPosture, landmarks, isReady } = usePoseDetection();

    // DEBUG: Verify Re-renders
    // console.log("Dashboard Render - Posture:", hookPosture ? hookPosture.score : "No Data");
    const {
        isTracking,
        sessionTime,
        postureScore: storeScore, // Rename helper
        incrementSessionTime,
        setTracking,
        fetchAnalytics,
        analytics,
        metrics: storeMetrics,
        corrections,
        updateRealtimeStats
    } = useAppStore();

    // Sync Hook Posture to Global Store
    useEffect(() => {
        if (hookPosture && isTracking) {
            updateRealtimeStats(hookPosture);
        }
    }, [hookPosture, isTracking, updateRealtimeStats]);

    // Use Hook values for rendering if tracking, else store fallback
    const displayScore = isTracking && hookPosture ? hookPosture.score : storeScore;
    const displayMetrics = isTracking && hookPosture ? hookPosture.metrics : storeMetrics;

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

    // Tracking Logic
    const toggleTracking = useCallback(async () => {
        console.log("🖱️ Button Clicked"); // Verification Log
        try {
            if (isTracking) {
                stopCamera(); // Stop Hook Camera
                await bridge.stopTracking(); // Stop Backend AI (Just in case)
                setTracking(false);

                if (sessionTime > 5) {
                    await bridge.saveSession({
                        id: crypto.randomUUID(),
                        start_time: new Date(Date.now() - sessionTime * 1000).toISOString(),
                        end_time: new Date().toISOString(),
                        duration_sec: sessionTime,
                        avg_score: displayScore,
                        good_time_sec: Math.floor(sessionTime * (displayScore / 100)),
                        bad_time_sec: Math.floor(sessionTime * ((100 - displayScore) / 100)),
                        breakdown_json: JSON.stringify(displayMetrics || {})
                    });
                }
            } else {
                if (!isReady) {
                    alert("AI Model Loading... Please wait.");
                    return;
                }
                const cameraStarted = await startCamera(); // Start Hook Camera
                if (cameraStarted) {
                    // await bridge.startTracking(); // BACKEND AI DISABLED
                    setTracking(true);
                }
            }
        } catch (error) {
            console.error("CRITICAL ERROR:", error);
            alert(`Failed to toggle AI Engine: ${error}`);
            setTracking(false);
        }
    }, [isTracking, sessionTime, displayScore, displayMetrics, setTracking, startCamera, stopCamera, isReady]);

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
                        <h1 className="text-3xl font-bold text-white tracking-tight">System Status</h1>
                        <p className="text-white/40 text-sm mt-1 font-mono">
                            {isTracking ? ">> MONITORING ACTIVE" : ">> STANDBY MODE"}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-mono font-bold text-emerald-400 tabular-nums tracking-wider drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                            {formatTime(sessionTime)}
                        </div>
                        <p className="text-white/30 text-xs uppercase tracking-widest mt-1">Session Duration</p>
                    </div>
                </div>

                {/* Main Stage */}
                <div className="flex-1 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center p-8 shadow-2xl group">
                    {/* Corner Decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-xl" />

                    <div className="absolute top-4 left-6 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-zinc-600'} `} />
                        <span className="text-xs font-medium text-white/50 tracking-wider font-mono">
                            {isTracking ? 'LIVE FEED [REC]' : 'CAMERA PAUSED'}
                        </span>
                    </div>

                    <div className="w-full max-w-md aspect-square relative flex items-center justify-center">
                        {/* New Holographic Score */}
                        <GlobalScore score={displayScore} />

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-full max-w-[70%] max-h-[70%] rounded-full overflow-hidden border border-white/5 shadow-2xl relative">
                                {/* PASS LANDMARKS & RESULTS TO OVERLAY */}
                                <PoseOverlay

                                    externalLandmarks={landmarks}
                                    externalPosture={hookPosture}
                                />
                                {!isTracking && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Zap className="text-white/20" size={32} />
                                            <span className="text-white/30 font-mono text-xs tracking-widest">SIGNAL LOST</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NEW POWER BAR VITALS */}
                    <div className="w-full max-w-lg grid grid-cols-3 gap-4 mt-8">
                        <BodyVitalCard label="NECK" score={displayMetrics?.neck || 100} color="text-cyan-400" icon="👤" />
                        <BodyVitalCard label="SPINE" score={displayMetrics?.spine || 100} color="text-yellow-400" icon="🦴" />
                        <BodyVitalCard label="SHOULDERS" score={displayMetrics?.shoulders || 100} color="text-magenta-400" icon="💪" />
                    </div>

                    <div className="absolute bottom-4 flex gap-4">
                        <button
                            onClick={toggleTracking}
                            className={`px-8 py-3 rounded-full font-bold text-sm tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 border ${isTracking
                                ? 'bg-red-500/10 text-red-400 border-red-500/50 hover:bg-red-500/20'
                                : 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 hover:text-black'
                                } `}
                        >
                            {isTracking ? 'TERMINATE SCAN' : 'INITIATE SCAN'}
                        </button>
                    </div>
                </div>
            </div>


            {/* RIGHT COLUMN: Stats & Coaching */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full">

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Streak Card */}
                    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <Flame className="text-red-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white font-mono leading-none">
                                {analytics?.current_streak || 0}
                            </div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Day Streak</div>
                        </div>
                    </div>

                    {/* Focus Time Card */}
                    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Timer className="text-blue-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white font-mono leading-none">
                                {analytics ? analytics.total_focus_hours.toFixed(1) : '0.0'}h
                            </div>
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Total Focus</div>
                        </div>
                    </div>
                </div>

                {/* Coaching Plan */}
                <CoachingPlan
                    score={analytics?.daily_trend?.[analytics.daily_trend.length - 1]?.score || displayScore}
                />

                {/* AI Companion Card with NEW FEEDBACK BUBBLE - MOVED TO BOTTOM */}
                <div className="col-span-12 lg:col-span-4 flex-1 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative group shadow-lg flex items-center justify-center min-h-[300px]">
                    <div className="absolute top-4 left-6 z-10">
                        <h3 className="text-sm font-bold text-white/80 tracking-wide">AI COMPANION</h3>
                        <p className="text-[10px] text-white/40 font-mono mt-1">UNIT: ROB-01</p>
                    </div>

                    {/* The Robot and His Message - Centered and slightly scaled but not offset */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className="w-full h-full scale-110"> {/* Slight scale for impact, but keeping center */}
                            <RobotCommunication corrections={corrections} isTracking={isTracking} />
                            <RobotBuddy isGoodPosture={displayScore > 60} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Hidden Video for Hook Stream (Must be visible for TFJS to read, but pointer-events-none) */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                width={640}
                height={480}
                className="absolute opacity-0 pointer-events-none"
            />
        </div >
    );
}
