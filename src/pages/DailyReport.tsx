import { Clock, TrendingUp, AlertTriangle, Activity } from "lucide-react";

export const DailyReportPage = () => {
    // Mock Data
    const stats = [
        { label: "Today's Focus", value: "4h 12m", icon: Clock, color: "text-[var(--color-primary)]" },
        { label: "Posture Score", value: "88%", icon: TrendingUp, color: "text-emerald-500" },
        { label: "Slouch Detected", value: "12 times", icon: AlertTriangle, color: "text-amber-500" },
    ];

    const sessions = [
        { id: 1, time: "09:00 AM", duration: "45m", status: "Good", score: 92 },
        { id: 2, time: "10:15 AM", duration: "1h 10m", status: "Moderate", score: 78 },
        { id: 3, time: "01:30 PM", duration: "30m", status: "Excellent", score: 98 },
    ];

    return (
        <div className="p-8 h-full flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold">Daily Report</h1>
                <p className="text-[var(--text-main)] opacity-60">Analysis of your posture patterns.</p>
            </header>

            {/* Top Row: Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium opacity-50 uppercase tracking-wide">{stat.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-[var(--bg-app)] opacity-80 ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Center: Activity Graph Placeholder */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex flex-col h-64">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-semibold">Activity Timeline</h3>
                </div>

                {/* Graph Area */}
                <div className="flex-1 bg-[var(--bg-app)]/50 rounded border border-[var(--border)] border-dashed flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 grid grid-cols-12 gap-px bg-[var(--border)]/10">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bg-[var(--bg-app)]/30 backdrop-blur-[1px]" />
                        ))}
                    </div>
                    <span className="text-xs opacity-40 font-mono relative z-10">[ Activity Graph Visualization ]</span>
                </div>
            </div>

            {/* Bottom: Session Log */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex-1 min-h-0 flex flex-col">
                <h3 className="text-sm font-semibold mb-4">Recent Sessions</h3>
                <div className="overflow-y-auto flex-1 pr-2 space-y-3">
                    {sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 rounded bg-[var(--bg-app)]/50 border border-[var(--border)]/50 hover:border-[var(--color-primary)]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${session.score > 90 ? 'bg-emerald-500' : session.score > 75 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                <div>
                                    <p className="text-sm font-medium">{session.time}</p>
                                    <p className="text-xs opacity-50">{session.duration}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold">{session.score}%</p>
                                <p className="text-xs opacity-50">{session.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
