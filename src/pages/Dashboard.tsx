import { useEffect } from 'react';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { RobotBuddy } from '../components/dashboard/Robot3D';
import { ScoreGrid } from '../components/dashboard/ScoreGrid';

export default function Dashboard() {
    const { videoRef, postureState, isAnalyzing, toggleAnalysis } = usePoseDetection();

    // Auto-start (Mount Logic)
    useEffect(() => {
        if (!isAnalyzing) {
            toggleAnalysis();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">

            {/* HIDDEN EYES (Camera) */}
            {/* Must exist for detection but invisible to user */}
            <video
                ref={videoRef}
                className="hidden absolute opacity-0 pointer-events-none"
                autoPlay
                playsInline
                muted
            />

            {/* THE VISUALS (Robot) */}
            {/* Robot3D now contains its own Canvas */}
            <div className="w-full h-[60%] flex items-center justify-center">
                <RobotBuddy score={postureState.total} isGood={postureState.isGood} />
            </div>

            {/* THE DATA (Score Grid) */}
            <div className="w-full h-[40%] flex items-start justify-center pt-8 bg-slate-900/50 backdrop-blur-sm z-10">
                <ScoreGrid scores={postureState} />
            </div>

            {/* DEBUG / STATUS OVERLAY */}
            {!isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
                    <div className="text-cyan-400 font-mono text-xl animate-pulse">
                        INITIALIZING SENSORS...
                    </div>
                </div>
            )}
        </div>
    );
}
