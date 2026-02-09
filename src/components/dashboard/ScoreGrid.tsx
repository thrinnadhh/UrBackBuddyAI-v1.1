import { PostureMetrics } from '../../utils/postureMath';

interface ScoreGridProps {
    scores?: PostureMetrics;
}

const ProgressBar = ({ value }: { value: number }) => {
    // Color Logic
    let color = "bg-yellow-400";
    if (value > 80) color = "bg-green-400";
    if (value < 50) color = "bg-red-500";

    return (
        <div className="w-full h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
            <div
                className={`h-full ${color} transition-all duration-500 ease-out`}
                style={{ width: `${value}%` }}
            />
        </div>
    );
};

const GlassCard = ({ title, value, icon }: { title: string, value: number, icon: any }) => (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 flex flex-col items-start justify-between min-w-[200px] flex-1 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 mb-2 opacity-80">
            {icon}
            <span className="text-xs font-bold tracking-widest text-white uppercase">{title}</span>
        </div>

        <div className="text-4xl font-black text-white font-mono">
            {value}%
        </div>

        <ProgressBar value={value} />
    </div>
);

// Simple SVG Icons
const Icons = {
    Neck: <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    Shoulders: <svg className="w-5 h-5 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    Spine: <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
};

export const ScoreGrid = ({ scores }: ScoreGridProps) => {
    const s = scores || { total: 0, neck: 0, shoulders: 0, spine: 0, isGood: false };

    return (
        <div className="flex flex-row gap-6 w-full max-w-4xl px-4">
            <GlassCard title="NECK ALIGNMENT" value={s.neck} icon={Icons.Neck} />
            <GlassCard title="SHOULDER LEVEL" value={s.shoulders} icon={Icons.Shoulders} />
            <GlassCard title="SPINE UPRIGHT" value={s.spine} icon={Icons.Spine} />
        </div>
    );
};
