import { useTheme } from "../context/ThemeContext";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Monitor, Bell, Clock, Shield, Info } from "lucide-react";

export const SettingsPage = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-[var(--text-main)] opacity-60">Control Center & Preferences</p>
            </header>

            {/* Appearance Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Monitor size={18} className="text-[var(--color-primary)]" />
                    <h2 className="text-md font-semibold font-mono uppercase tracking-wider opacity-80">Appearance</h2>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Interface Theme</label>
                        <SegmentedControl
                            value={theme}
                            onChange={(val) => setTheme(val as any)}
                            options={[
                                { value: "light", label: "Light" },
                                { value: "dark", label: "Dark (Zinc)" },
                                { value: "midnight", label: "Midnight" }
                            ]}
                        />
                        <p className="text-xs opacity-50">
                            Select 'Midnight' for OLED screens to save battery.
                        </p>
                    </div>
                </div>
            </section>

            {/* Preferences Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-[var(--color-primary)]" />
                    <h2 className="text-md font-semibold font-mono uppercase tracking-wider opacity-80">Preferences</h2>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 space-y-6">
                    {/* Break Frequency */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <label className="text-sm font-medium block">Break Frequency</label>
                            <span className="text-xs opacity-60">How often should we remind you?</span>
                        </div>
                        <select className="bg-[var(--bg-app)] border border-[var(--border)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)]">
                            <option>Every 20m</option>
                            <option>Every 40m</option>
                            <option>Every 60m</option>
                        </select>
                    </div>

                    <div className="h-px bg-[var(--border)] w-full" />

                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Bell size={14} />
                                <label className="text-sm font-medium block">Smart Notifications</label>
                            </div>
                            <span className="text-xs opacity-60">Intelligent alerts based on posture.</span>
                        </div>
                        {/* Toggle Switch Mock */}
                        <div className="w-10 h-6 bg-[var(--color-primary)] rounded-full relative cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm" />
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-[var(--color-primary)]" />
                    <h2 className="text-md font-semibold font-mono uppercase tracking-wider opacity-80">About</h2>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <Info size={20} className="text-[var(--color-primary)] mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium">Local-First Architecture</h3>
                            <p className="text-xs opacity-60 leading-relaxed">
                                PostureSense is built on a "Privacy First" engine. No images, video, or data ever leave your device.
                                Processing happens locally on your CPU/GPU.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono opacity-40 pt-2 border-t border-[var(--border)]">
                        <span>Version 1.0.0</span>
                        <span>Build 2026.02.07</span>
                    </div>
                </div>
            </section>
        </div>
    );
};
