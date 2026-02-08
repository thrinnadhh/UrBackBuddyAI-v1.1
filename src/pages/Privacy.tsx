import { useEffect, useState } from 'react';
import { Shield, Lock, EyeOff, Terminal } from 'lucide-react';

export default function Privacy() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const randomMs = Math.floor(Math.random() * 20) + 5;
            const hash = Math.random().toString(36).substring(2, 15);

            const possibleLogs = [
                `[LOCAL_GPU] Frame processed in ${randomMs} ms`,
                `[PRIVACY_CORE] Face data hashed: sha256(${hash}...)`,
                `[DATA_LINK] 0 bytes sent to cloud`,
                `[SECURE_ENCLAVE] Verifying local integrity...OK`
            ];

            const newLog = possibleLogs[Math.floor(Math.random() * possibleLogs.length)];

            setLogs(prev => [newLog, ...prev.slice(0, 20)]);
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 h-full grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Column: The Evidence (Terminal) */}
            <div className="bg-black border border-white/10 rounded-3xl p-6 font-mono text-xs text-green-500 overflow-hidden flex flex-col shadow-2xl relative h-full">
                <div className="flex items-center justify-between mb-4 border-b border-green-500/20 pb-2">
                    <div className="flex items-center gap-2">
                        <Terminal size={14} />
                        <span className="opacity-70">LIVE_PROCESSING.LOG</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/50" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                        <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 flex flex-col gap-1 overflow-y-auto mix-blend-screen scrollbar-hide">
                        {/* Current Log (Typing effect simulation) */}
                        <div className="flex items-center gap-2 text-green-400">
                            <span className="animate-pulse">_</span>
                        </div>

                        {logs.map((log, i) => (
                            <div key={i} className={`truncate ${i === 0 ? 'text-green-400 font-bold' : 'opacity-70'} `}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Terminal Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%] opacity-20" />
            </div>

            {/* Right Column: The Promise */}
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 flex flex-col justify-center relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <Shield className="text-white mb-6" size={56} strokeWidth={1.5} />

                <h2 className="text-4xl font-bold text-white mb-6 tracking-tight leading-tight">
                    Our Privacy Promise.
                </h2>

                <p className="text-xl text-white/70 leading-relaxed font-light">
                    No matter what — even <span className="text-white font-medium">you</span> can't understand this data.
                    It is a one-way hashed value. There is no way to retrieve it back.
                </p>

                <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-white font-medium">
                            <Lock size={16} className="text-emerald-500" /> Local Encrypted
                        </span>
                        <span className="text-xs text-white/40">Keys never leave device</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-2 text-white font-medium">
                            <EyeOff size={16} className="text-emerald-500" /> Zero Knowledge
                        </span>
                        <span className="text-xs text-white/40">We can't see anything</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
