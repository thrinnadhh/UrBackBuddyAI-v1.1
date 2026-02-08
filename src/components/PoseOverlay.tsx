import { useEffect, useRef, useState } from 'react';
import { bridge } from '../services/bridge';
import { analyzePosture } from '../utils/postureMath';

interface PoseOverlayProps {
    onPostureChange?: (isGood: boolean) => void;
    sensitivity?: number;
}

export const PoseOverlay = ({ onPostureChange, sensitivity = 5 }: PoseOverlayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState("Waiting for Session Start...");
    const [statusColor, setStatusColor] = useState("bg-zinc-800 text-white");

    useEffect(() => {
        const unlistenPromise = bridge.onPoseUpdate((landmarks) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. Analyze
            const posture = analyzePosture(landmarks, sensitivity);

            // Notify Parent (App.tsx)
            if (onPostureChange) {
                onPostureChange(posture.isGood);
            }

            // Pro Max Color Logic: Green for Good, Amber for Warn, Red for Critical
            let strokeColor = '#10b981'; // Emerald-500

            if (!posture.isGood) {
                strokeColor = '#ef4444'; // Red-500
                setStatusColor("bg-red-500 text-white shadow-red-500/50");
            } else {
                setStatusColor("bg-emerald-500 text-black shadow-emerald-500/50");
            }

            setStatus(posture.message);

            // 2. Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 3. Style Setup
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = strokeColor;
            ctx.fillStyle = strokeColor;

            // 4. Draw Skeleton (Simplified for Aesthetics)
            // Only drawing upper body for cleaner look
            const connections = [
                [11, 12], [11, 13], [13, 15], // Arms
                [12, 14], [14, 16],
                [11, 23], [12, 24], // Torso
                [0, 1], [1, 2], [2, 3], [3, 7], // Face
                [0, 4], [4, 5], [5, 6], [6, 8]
            ];

            connections.forEach(([i, j]) => {
                const p1 = landmarks[i];
                const p2 = landmarks[j];

                if (p1 && p2 && p1.visibility > 0.6 && p2.visibility > 0.6) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                    ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                    ctx.stroke();
                }
            });

            // Draw Head Dot only (Cleaner look)
            const nose = landmarks[0];
            if (nose && nose.visibility > 0.6) {
                ctx.beginPath();
                ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 6, 0, 2 * Math.PI);
                ctx.fill();
            }
        });

        return () => { unlistenPromise.then((unlisten) => unlisten()); };
    }, [onPostureChange]); // Added handled as dependency

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center bg-black/40">

            {/* Floating Dynamic Pill */}
            <div
                className={`absolute top-6 px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-xl transition-all duration-300 z-10 ${statusColor}`}
            >
                {status}
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="w-full h-full object-contain opacity-90"
            />

            {/* Grid Overlay for "Tech" Feel */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        </div>
    );
};
