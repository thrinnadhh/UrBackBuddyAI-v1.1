import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Trophy, Clock } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function Journey() {
    const { analytics, fetchAnalytics } = useAppStore();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    return (
        <div className="p-8 h-full flex flex-col gap-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">My Journey</h1>
                <p className="text-white/40 text-sm">Tracking consistency over the long haul.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Red Card: Current Streak */}
                <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 group hover:border-red-500/40 transition-all">
                    <div className="p-4 bg-red-500/20 rounded-full mb-2">
                        <Flame className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-4xl font-bold text-white font-mono">{analytics?.current_streak || 0}</h3>
                    <p className="text-red-400 text-xs uppercase tracking-widest font-bold">Days Streak</p>
                </div>

                {/* Gold Card: Best Record */}
                <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 group hover:border-amber-500/40 transition-all">
                    <div className="p-4 bg-amber-500/20 rounded-full mb-2">
                        <Trophy className="text-amber-500" size={32} />
                    </div>
                    <h3 className="text-4xl font-bold text-white font-mono">{analytics?.best_streak || 0}</h3>
                    <p className="text-amber-400 text-xs uppercase tracking-widest font-bold">Best Record</p>
                </div>

                {/* Blue Card: Total Focus */}
                <div className="bg-blue-500/10 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 group hover:border-blue-500/40 transition-all">
                    <div className="p-4 bg-blue-500/20 rounded-full mb-2">
                        <Clock className="text-blue-500" size={32} />
                    </div>
                    <h3 className="text-4xl font-bold text-white font-mono">
                        {analytics ? analytics.total_focus_hours.toFixed(1) : '0.0'}h
                    </h3>
                    <p className="text-blue-400 text-xs uppercase tracking-widest font-bold">Total Focus</p>
                </div>

            </div>

            {/* Main Chart Section */}
            <div className="flex-1 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col min-h-[350px]">
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-6">Daily Consistency (Last 7 Days)</h3>

                <div className="flex-1 w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.daily_trend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
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
                            />
                            <Tooltip
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar
                                dataKey="score"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
