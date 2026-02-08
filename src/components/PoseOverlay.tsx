import { useEffect, useRef, useState } from 'react';
import { bridge } from '../services/bridge';
import { analyzePosture } from '../utils/postureMath';

export const PoseOverlay = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState("Waiting for AI...");
    const [postureColor, setPostureColor] = useState("#00FF00");

    useEffect(() => {
        // 1. Start Listening
        const unlistenPromise = bridge.onPoseUpdate((landmarks) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 2. Analyze Posture
            const posture = analyzePosture(landmarks);
            const color = posture.isGood ? '#4ADE80' : '#EF4444'; // Green vs Red

            setPostureColor(color);
            setStatus(posture.message);

            // 3. Clear Canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.fillStyle = color;
            ctx.strokeStyle = color;

            // 4. Draw Landmarks (Dots)
            landmarks.forEach((point) => {
                if (point.visibility < 0.6) return; // Hide low confidence points

                const x = point.x > 2.0 ? (point.x / 256.0) * canvas.width : point.x * canvas.width;
                const y = point.y > 2.0 ? (point.y / 256.0) * canvas.height : point.y * canvas.height;

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });

            // 5. Draw Skeleton (Lines)
            const connections = [
                [11, 12], [11, 13], [13, 15], // Shoulders & Left Arm
                [12, 14], [14, 16],           // Right Arm
                [11, 23], [12, 24], [23, 24], // Torso
                [0, 1], [1, 2], [2, 3], [3, 7], // Face L
                [0, 4], [4, 5], [5, 6], [6, 8], // Face R
            ];

            connections.forEach(([i, j]) => {
                const p1 = landmarks[i];
                const p2 = landmarks[j];

                if (p1 && p2 && p1.visibility > 0.6 && p2.visibility > 0.6) {
                    const p1x = p1.x > 2.0 ? (p1.x / 256.0) * canvas.width : p1.x * canvas.width;
                    const p1y = p1.y > 2.0 ? (p1.y / 256.0) * canvas.height : p1.y * canvas.height;
                    const p2x = p2.x > 2.0 ? (p2.x / 256.0) * canvas.width : p2.x * canvas.width;
                    const p2y = p2.y > 2.0 ? (p2.y / 256.0) * canvas.height : p2.y * canvas.height;

                    ctx.beginPath();
                    ctx.moveTo(p1x, p1y);
                    ctx.lineTo(p2x, p2y);
                    ctx.stroke();
                }
            });
        });

        // Cleanup function to stop listening when component unmounts
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center p-1 bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
            {/* Dynamic Status Bar */}
            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-bold text-black shadow-lg transition-colors duration-300 z-10"
                style={{ backgroundColor: postureColor }}
            >
                {status}
            </div>

            <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="bg-black rounded-lg opacity-90"
                style={{ borderColor: postureColor, borderWidth: '2px' }}
            />

            <div className="absolute bottom-2 right-4 text-gray-500 text-[10px] font-mono">
                SECURE • LOCAL • AI
            </div>
        </div>
    );
};
