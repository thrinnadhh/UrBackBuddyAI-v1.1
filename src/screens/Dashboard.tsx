import { useState } from "react";
import { CameraOff, Lock, Unlock } from "lucide-react";
import { PrivacyLog } from "../components/PrivacyLog";
import { bridge } from "../services/bridge";

interface DashboardProps {
    logs: any[];
    addLog: (msg: string) => void;
    isCameraActive: boolean;
    setIsCameraActive: (active: boolean) => void;
}

export const Dashboard = ({ logs, addLog, isCameraActive, setIsCameraActive }: DashboardProps) => {
    const [loading, setLoading] = useState(false);

    const toggleCamera = async () => {
        setLoading(true);
        try {
            if (isCameraActive) {
                // Kill Switch
                const killed = await bridge.killCamera();
                if (killed) {
                    addLog("KILL SWITCH: Camera hardware connection dropped.");
                    setIsCameraActive(false);
                } else {
                    addLog("Error: Failed to kill camera stream.");
                }
            } else {
                // Init Camera
                const res = await bridge.initCamera();
                addLog(`Hardware: ${res}`);
                setIsCameraActive(true);
            }
        } catch (e) {
            addLog(`Error: ${e}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">

            {/* LEFT COLUMN: Avatar / Posture Status */}
            <div className="flex flex-col gap-6">
                <div className="flex-1 bg-surface/30 border border-glassBorder rounded-2xl flex items-center justify-center relative backdrop-blur-sm overflow-hidden group">

                    {/* Decorative Grid */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />

                    {/* Avatar Placeholder */}
                    <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700
            ${isCameraActive
                            ? "bg-glass shadow-[0_0_100px_rgba(16,185,129,0.2)] border border-emerald-500/30"
                            : "bg-glass border border-zinc-700/30"
                        }`}
                    >
                        {isCameraActive ? (
                            <div className="w-32 h-32 rounded-full border border-emerald-400/50 animate-pulse flex items-center justify-center">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_20px_#34d399]" />
                            </div>
                        ) : (
                            <CameraOff size={48} className="text-zinc-600" />
                        )}

                        {/* Status Text */}
                        <div className="absolute -bottom-12 text-center">
                            <div className={`text-sm font-bold tracking-widest uppercase ${isCameraActive ? 'text-emerald-400' : 'text-zinc-600'}`}>
                                {isCameraActive ? 'Monitoring' : 'Offline'}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT COLUMN: Controls & Privacy */}
            <div className="flex flex-col gap-6 justify-center">

                {/* Privacy Control Card */}
                <div className="bg-surface border border-glassBorder rounded-2xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Privacy Control</h2>
                        <p className="text-secondary text-sm max-w-xs mx-auto">
                            Hardware-level access control. When off, the camera stream is physically dropped from memory.
                        </p>
                    </div>

                    <button
                        onClick={toggleCamera}
                        disabled={loading}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 border-4 relative overflow-hidden group
              ${isCameraActive
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                                : "bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                            }`}
                    >
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            isCameraActive ? <Lock size={32} /> : <Unlock size={32} />
                        )}
                    </button>

                    <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        {isCameraActive ? "Secure Link Active" : "Hardware Disconnected"}
                    </div>
                </div>

                {/* Live Privacy Log */}
                <PrivacyLog logs={logs} />

            </div>

        </div>
    );
};
