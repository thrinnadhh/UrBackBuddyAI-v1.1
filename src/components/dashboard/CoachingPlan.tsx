import { CheckCircle2, Lock } from "lucide-react";

interface CoachingPlanProps {
    score: number;
}

export function CoachingPlan({ score }: CoachingPlanProps) {
    const steps = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'active' }, // Current Stage
        { id: 4, status: 'locked' },
        { id: 5, status: 'locked' },
    ];

    return (
        <div className="w-full h-full flex flex-col justify-center px-8 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none" />

            <div className="flex justify-between items-end mb-2 relative z-10">
                <h3 className="text-sm font-bold text-emerald-400 tracking-wider uppercase">
                    Coaching Plan - Stage 3/5
                </h3>
                <span className="text-xs text-white/40 font-mono">Mastery: {Math.round(score)}%</span>
            </div>

            {/* Stepper Visual */}
            <div className="relative flex items-center justify-between z-10">
                {/* Connecting Line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/10 -z-10" />

                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
              ${step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-black' : ''}
              ${step.status === 'active' ? 'bg-black border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : ''}
              ${step.status === 'locked' ? 'bg-zinc-900 border-zinc-800 text-zinc-700' : ''}
            `}
                    >
                        {step.status === 'completed' && <CheckCircle2 size={20} />}
                        {step.status === 'active' && <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />}
                        {step.status === 'locked' && <Lock size={16} />}
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-lime-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500 ease-out"
                        style={{ width: `${Math.max(5, score)}%` }} // Min 5% for visibility
                    />
                </div>
                <p className="mt-2 text-xs text-white/50">Next: Unlock "Advanced Ergonomics"</p>
            </div>
        </div>
    );
}
