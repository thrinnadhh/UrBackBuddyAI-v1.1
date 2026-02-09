import { useEffect, useRef, useState } from 'react';
import { PostureResult } from '../utils/postureMath';

interface PoseOverlayProps {
    externalLandmarks?: any[]; // For TFJS from Parent
    externalPosture?: PostureResult | null; // For TFJS from Parent
}

export const PoseOverlay = ({ externalLandmarks, externalPosture }: PoseOverlayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [localStatus, setLocalStatus] = useState("Waiting for Session Start...");
    const [statusColor, setStatusColor] = useState("bg-zinc-800 text-white");
    const lastFrameTimeRef = useRef<number>(Date.now());

    // RENDER LOGIC (Frontend TFJS)
    const renderFrame = (landmarks: any[], posture: PostureResult | null) => {
        lastFrameTimeRef.current = Date.now();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!landmarks || landmarks.length === 0 || !posture) {
            setLocalStatus("No Body Detected");
            setStatusColor("bg-yellow-600/80 text-white");
            return;
        }

        // --- UPDATE STATUS UI ---
        setLocalStatus(posture.message);

        if (posture.reason === 'ignore') {
            setStatusColor("bg-yellow-500 text-black shadow-yellow-500/50 animate-pulse");
        } else if (!posture.isGood) {
            setStatusColor("bg-red-500 text-white shadow-red-500/50");
        } else {
            setStatusColor("bg-emerald-500 text-black shadow-emerald-500/50");
        }

        // --- DRAW SKELETON ---
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = !posture.isGood ? '#ef4444' : '#10b981';
        ctx.fillStyle = ctx.strokeStyle;

        // Connections based on TFJS MoveNet/BlazePose common keypoints
        const connections = [
            [5, 7], [7, 9],   // Left Arm: Shoulder -> Elbow -> Wrist
            [6, 8], [8, 10],  // Right Arm: Shoulder -> Elbow -> Wrist
            [5, 6],           // Shoulders
            [5, 11], [6, 12], // Torso sides
            [11, 12]          // Hips
        ];

        // Draw Points
        landmarks.forEach((p) => {
            if (p.score > 0.2 || p.visibility > 0.2) { // Check score or visibility
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        });

        // Draw Skeleton Lines
        connections.forEach(([startIdx, endIdx]) => {
            const p1 = landmarks[startIdx];
            const p2 = landmarks[endIdx];
            if (p1 && p2 && (p1.score > 0.2 || p1.visibility > 0.2) && (p2.score > 0.2 || p2.visibility > 0.2)) {
                drawLine(ctx, p1, p2, canvas);
            }
        });
    };

    const drawLine = (ctx: CanvasRenderingContext2D, p1: any, p2: any, canvas: HTMLCanvasElement) => {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
    };

    // MODE: EXTERNAL (TFJS from Hook)
    useEffect(() => {
        if (externalLandmarks && externalPosture) {
            renderFrame(externalLandmarks, externalPosture);
        }
    }, [externalLandmarks, externalPosture]);

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center bg-black/40">

            {/* Floating Dynamic Pill */}
            <div
                className={`absolute top-6 px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-xl transition-all duration-300 z-10 ${statusColor}`}
            >
                {localStatus}
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
