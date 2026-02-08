import { Shield, Terminal } from "lucide-react";

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
}

interface PrivacyLogProps {
    logs: LogEntry[];
}

export const PrivacyLog = ({ logs }: PrivacyLogProps) => {
    return (
        <div className="w-full bg-black/40 border border-glassBorder rounded-lg overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-glassBorder bg-white/5">
                <div className="flex items-center gap-2 text-zinc-300">
                    <Terminal size={14} className="text-emerald-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Privacy Engine Log</span>
                </div>
                <Shield size={14} className="text-emerald-500/50" />
            </div>

            <div className="p-4 h-48 overflow-hidden relative">
                <div className="space-y-2 font-mono text-xs">
                    {logs.length === 0 && (
                        <div className="text-zinc-600 italic text-center mt-12">Waiting for engine activity...</div>
                    )}
                    {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-zinc-600">[{log.timestamp}]</span>
                            <span className="text-zinc-300">{log.message}</span>
                        </div>
                    ))}
                </div>

                {/* Readout overlay gradient */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
        </div>
    );
};
