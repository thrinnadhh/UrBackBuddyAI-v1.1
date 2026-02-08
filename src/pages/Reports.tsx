import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, BarChart2 } from 'lucide-react';

export default function Reports() {
    const { analytics, fetchAnalytics } = useAppStore();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Helper to calculate Average Score
    const averageScore = analytics && analytics.hourly_breakdown.length > 0
        ? Math.round(analytics.hourly_breakdown.reduce((acc, curr) => acc + curr.score, 0) / analytics.hourly_breakdown.length)
        : 0;

    return (
        <div className="p-8 h-full flex flex-col gap-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Report</h1>
                <p className="text-white/40 text-sm">Deep dive into your posture metrics.</p>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                {/* Main Graph: Hourly Breakdown */}
                <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">Hourly Breakdown (Today)</h3>
                        <BarChart2 className="text-white/20" size={20} />
                    </div>

                    <div className="flex-1 w-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.hourly_breakdown || []}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#ffffff40"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#ffffff40"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#ffffff20' }}
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stats Column */}
                <div className="flex flex-col gap-4">

                    {/* Stat Card 1: Avg Quality */}
                    <div className="flex-1 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-center items-center gap-2">
                        <div className="p-3 bg-emerald-500/20 rounded-full mb-2">
                            <Zap className="text-emerald-500" size={24} />
                        </div>
                        <h3 className="text-3xl font-bold text-white font-mono">{averageScore}%</h3>
                        <p className="text-emerald-400 text-xs uppercase tracking-widest font-bold">Avg Quality</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
