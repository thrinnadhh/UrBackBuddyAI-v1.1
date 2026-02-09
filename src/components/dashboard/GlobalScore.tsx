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

    const getScoreColor = (s: number) => {
        if (s >= 80) return "#10b981"; // Emerald-500 (Excellent)
        if (s >= 65) return "#eab308"; // Yellow-500 (Okay)
        return "#ef4444"; // Red-500 (Critical)
    };

    const currentColor = getScoreColor(displayScore);

    useEffect(() => {
        // Animation effect
        const timer = setTimeout(() => {
            setDisplayScore(score);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">

            {/* Spinning Outer Ring (Slow) */}
            <div className="absolute inset-0 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 border border-white/10 border-dashed rounded-full animate-[spin_20s_linear_infinite_reverse]" />

            {/* Glowing Backdrop */}
            <div
                className="absolute w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none transition-colors duration-1000 opacity-20"
                style={{ backgroundColor: currentColor }}
            />

            {/* Main Gauge SVG */}
            <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {/* Background Track */}
                <circle
                    cx="150"
                    cy="150"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/5"
                />

                {/* Tick Marks (Simulated with dashed stroke) */}
                <circle
                    cx="150"
                    cy="150"
                    r={radius + 15}
                    stroke="white"
                    strokeWidth="2"
                    fill="transparent"
                    strokeDasharray="4 10"
                    className="opacity-10"
                />

                {/* Progress Arc */}
                <circle
                    cx="150"
                    cy="150"
                    r={radius}
                    stroke={currentColor}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_currentColor]"
                />
            </svg>

            {/* Center Content */}
            <div className="absolute flex flex-col items-center z-10">
                <span className="text-7xl font-bold text-white tracking-tighter drop-shadow-2xl font-mono">
                    {Math.round(displayScore)}
                </span>
                <span style={{ color: currentColor }} className="text-xs font-bold tracking-[0.2em] uppercase mt-2 transition-colors duration-500">
                    System Integrity
                </span>

                {/* Small indicator light */}
                <div className={`mt-3 w-1.5 h-1.5 rounded-full ${displayScore >= 65 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
            </div>

            {/* Scanning Line Effect */}
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent top-1/2 animate-[ping_3s_infinite_reverse] opacity-20" />
        </div>
    );
}
