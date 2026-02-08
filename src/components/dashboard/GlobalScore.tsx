import { useEffect, useState } from "react";

interface GlobalScoreProps {
    score: number;
}

export function GlobalScore({ score }: GlobalScoreProps) {
    const [displayScore, setDisplayScore] = useState(0);
    const radius = 100;
    const circumference = 2 * Math.PI * radius;

    // Progress offset calculation
    // 0% = circumference, 100% = 0
    const strokeDashoffset = circumference - (displayScore / 100) * circumference;

    useEffect(() => {
        // Simple animation effect
        const timer = setTimeout(() => {
            setDisplayScore(score);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="relative w-[250px] h-[250px] flex items-center justify-center">
            {/* SVG Gauge */}
            <svg className="w-full h-full transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx="125"
                    cy="125"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="15"
                    fill="transparent"
                    className="text-white/5"
                />
                {/* Foreground Circle (Progress) */}
                <circle
                    cx="125"
                    cy="125"
                    r={radius}
                    stroke="url(#scoreGradient)"
                    strokeWidth="15"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" /> {/* Emerald-500 */}
                        <stop offset="100%" stopColor="#84cc16" /> {/* Lime-500 */}
                    </linearGradient>
                </defs>
            </svg>

            {/* Center Text */}
            <div className="absolute flex flex-col items-center">
                <span className="text-6xl font-bold text-white tracking-tighter drop-shadow-lg">
                    {displayScore}
                </span>
                <span className="text-xs font-bold text-emerald-400 tracking-widest mt-1 uppercase">
                    Global Score
                </span>
            </div>

            {/* Inner Glow/Blur Element for flair */}
            <div className="absolute w-[180px] h-[180px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
    );
}
