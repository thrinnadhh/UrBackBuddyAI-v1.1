import { useState } from "react";
import { Power } from "lucide-react";
import { bridge } from "../../services/bridge";

export const CameraControlCard = () => {
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("Ready");

    const toggleCamera = async () => {
        setLoading(true);
        try {
            if (isActive) {
                // CASE 1: Camera is ON -> Turn it OFF
                console.log("Stopping Camera...");
                const success = await bridge.killCamera();
                if (success) {
                    setIsActive(false);
                    setStatus("Hardware Disconnected");
                    console.log("Camera Killed.");
                } else {
                    setStatus("Error disconnecting");
                }
            } else {
                // CASE 2: Camera is OFF -> Turn it ON
                console.log("Starting Camera...");
                const response = await bridge.initCamera();

                // Only set to TRUE if backend confirms success
                if (response === "Camera Initialized" || response === "Camera already active") {
                    setIsActive(true);
                    setStatus("Monitoring Active");
                } else {
                    setStatus(response);
                }
            }
        } catch (e) {
            console.error("Camera Error:", e);
            setStatus("Connection Error");
            setIsActive(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
            <div className="flex flex-col items-center space-y-2">
                <h3 className="font-semibold text-lg">Hardware Control</h3>
                <p className={`text-xs font-mono uppercase tracking-wider ${isActive ? 'text-[var(--color-primary)]' : 'text-zinc-500'}`}>
                    {status}
                </p>
            </div>

            <button
                onClick={toggleCamera}
                disabled={loading}
                className={`
                    w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative group border-4
                    ${isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "border-zinc-500 bg-transparent text-zinc-500 hover:border-zinc-400 hover:text-zinc-400"
                    }
                `}
            >
                {loading ? (
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Power size={32} />
                )}
            </button>

            <p className="text-xs opacity-60 max-w-[200px]">
                {isActive
                    ? "Camera stream is active and processing locally."
                    : "Camera is physically disconnected from the engine."}
            </p>
        </div>
    );
};
