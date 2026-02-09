import { SessionSummary } from '../services/bridge';

interface HistoryViewProps {
    data: SessionSummary[];
    isLoading: boolean;
}

export const HistoryView = ({ data, isLoading }: HistoryViewProps) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <div className="h-full w-full overflow-y-auto pr-2">
            <div className="mb-6">
                <h2 className="text-2xl font-bold">Session History</h2>
                <p className="text-white/40 text-sm">Your recent posture performance.</p>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {isLoading ? (
                    <div className="p-12 text-center text-white/40">Loading history...</div>
                ) : data.length === 0 ? (
                    <div className="p-12 text-center text-white/40">No sessions recorded yet.</div>
                ) : (
                    <div className="w-full">
                        {/* Header */}
                        <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-white/50 uppercase tracking-wider">
                            <div>Date</div>
                            <div>Duration</div>
                            <div>Score</div>
                            <div>Status</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-white/5">
                            {data.map((session) => (
                                <div key={session.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-white/5 transition-colors items-center text-sm">
                                    <div className="text-white/80">{formatDate(session.start_time)}</div>
                                    <div className="font-mono text-white/60">{formatTime(session.duration_sec)}</div>
                                    <div className={`font-bold ${session.avg_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {session.avg_score}
                                    </div>
                                    <div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide ${session.avg_score >= 80
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            }`}>
                                            {session.avg_score >= 80 ? 'Good' : 'Improve'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
