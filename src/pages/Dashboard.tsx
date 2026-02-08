import { CameraControlCard } from "../components/dashboard/CameraControlCard";
import { PrivacyAccordion } from "../components/dashboard/PrivacyAccordion";
import { PrivacyPromiseCard } from "../components/dashboard/PrivacyPromiseCard";

export const DashboardPage = () => {
    return (
        <div className="p-8 h-full flex flex-col gap-6">
            <header className="mb-2">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-[var(--text-main)] opacity-60">Real-time posture monitoring & privacy controls.</p>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
                {/* Left Column: Posture Avatar Placeholder */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex items-center justify-center p-8 relative overflow-hidden">
                    {/* Placeholder for future Posture Avatar */}
                    <div className="w-64 h-64 rounded-full border-4 border-[var(--border)] flex items-center justify-center opacity-30">
                        <span className="text-lg font-medium">Posture Avatar</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-app)]/5 pointer-events-none" />
                </div>

                {/* Right Column: Controls & Privacy */}
                <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                    <CameraControlCard />
                    <PrivacyAccordion />
                    <PrivacyPromiseCard />
                </div>
            </div>
        </div>
    );
};
