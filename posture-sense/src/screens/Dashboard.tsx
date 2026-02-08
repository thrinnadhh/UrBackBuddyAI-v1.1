import { useAppStore } from '../store/useAppStore';
import { ChevronDown, ChevronRight, Shield, Camera } from 'lucide-react';

export const Dashboard = () => {
    const {
        last15MinLogs,
        privacyLogExpanded,
        togglePrivacyLog,
        cameraEnabled,
        toggleCamera
    } = useAppStore();

    return (
        <div className="p-8 h-full overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-100 mb-2">PostureSense</h1>
                <p className="text-slate-400">Privacy-First Correction</p>
            </header>

            {/* Strict 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column */}
                <div className="space-y-6">

                    {/* Item A: Last 15 Minutes Log (Accordion) */}
                    <div className="bg-surface-dark/50 border border-slate-800 rounded-lg overflow-hidden">
                        <button
                            onClick={togglePrivacyLog}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-slate-200 font-semibold">
                                <Shield size={18} className="text-emerald-500" />
                                <span>Transparency Log (15m)</span>
                            </div>
                            {privacyLogExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        {privacyLogExpanded && (
                            <div className="p-4 bg-black/40 font-mono text-xs text-slate-400 space-y-1 border-t border-slate-800">
                                {last15MinLogs.slice(0, 10).map((log) => (
                                    <div key={log.id} className="flex gap-2 opacity-75 hover:opacity-100 transition-opacity">
                                        <span className="text-slate-600">[{log.timestamp}]</span>
                                        <span className="text-emerald-500/80">{log.action}</span>
                                        <span className="text-slate-700 truncate">{log.hash}</span>
                                    </div>
                                ))}
                                {last15MinLogs.length > 10 && (
                                    <div className="pt-2 text-center text-slate-600 italic">... {last15MinLogs.length - 10} more entries ...</div>
                                )}
                            </div>
                        )}
                        {!privacyLogExpanded && (
                            <div className="px-4 pb-4 text-xs text-slate-500 font-mono">
                                {last15MinLogs[0] && (
                                    <div className="flex gap-2">
                                        <span>Latest:</span>
                                        <span className="truncate">{last15MinLogs[0].hash}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Item B: What We Process */}
                    <div className="bg-surface-dark border border-slate-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">What We Process</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>Real-time vector angles (Shoulder to Ear)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>Session duration timers</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <span className="line-through decoration-slate-500 text-slate-600">No Raw Video Frames</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <span className="line-through decoration-slate-500 text-slate-600">No Face/Identity Data</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Right Column */}
                <div className="space-y-6">

                    {/* Item C: Privacy Promise */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-lg">
                        <h3 className="text-lg font-bold text-slate-100 mb-2">The Privacy Promise</h3>
                        <div className="text-slate-400 text-sm leading-relaxed space-y-4">
                            <p>
                                "A privacy promise is a promise. No matter what — even you can’t understand this data.
                                It is a one‑way hashed value. There is no way to retrieve it back."
                            </p>
                            <p className="text-xs text-slate-500">
                                We designed PostureSense to be structurally incapable of spying on you.
                                The camera feed never leaves your device's RAM.
                            </p>
                        </div>
                    </div>

                    {/* Item D: Camera Control */}
                    <div className="bg-surface-dark border border-slate-800 rounded-lg p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${cameraEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                <Camera size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-100">Camera Input</h3>
                                <p className="text-xs text-slate-500">{cameraEnabled ? 'Processing locally' : 'Input disabled'}</p>
                            </div>
                        </div>

                        <button
                            onClick={toggleCamera}
                            className={`w-12 h-6 rounded-full transition-colors relative ${cameraEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${cameraEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Abstract Avatar Placeholder */}
                    <div className="h-64 bg-black/50 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
                        {cameraEnabled ? (
                            <div className="relative">
                                {/* Abstract "Bones" */}
                                <div className="w-1 h-32 bg-slate-700 mx-auto rounded-full"></div>
                                <div className="w-24 h-1 bg-slate-700 absolute top-8 left-1/2 -translate-x-1/2 rounded-full"></div>
                                <div className="w-4 h-4 bg-emerald-500 rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-emerald-500 font-mono tracking-widest">LIVE_SIGNAL</p>
                            </div>
                        ) : (
                            <div className="text-center text-slate-600">
                                <Camera size={48} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Camera Off</p>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};
