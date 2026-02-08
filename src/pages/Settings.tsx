import { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Moon, Sun, Timer, Eye, Camera, Bell, Database, Shield } from 'lucide-react';

// Custom Tailwnd Components
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${checked ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const Slider = ({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (val: number) => void }) => (
    <div className="relative w-full h-6 flex items-center">
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 z-10"
        />
        <div className="absolute h-1 bg-emerald-500/50 rounded-l-lg pointer-events-none" style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
    </div>
);

export default function Settings() {
    const {
        theme, setTheme,
        breakEnabled, setBreakEnabled,
        breakInterval, setBreakInterval,
        smartMode, setSmartMode,
        highContrast, setHighContrast,
        reducedMotion, setReducedMotion,
        sensitivity, setSensitivity,
        notificationsEnabled, setNotificationsEnabled,
        soundEnabled, setSoundEnabled
    } = useAppStore();

    const [activeCategory, setActiveCategory] = useState('breaks');

    const categories = [
        { id: 'breaks', label: 'Breaks & System', icon: Timer },
        { id: 'appearance', label: 'Appearance', icon: Eye },
        { id: 'posture', label: 'Posture Detection', icon: Camera },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'data', label: 'Data & Reports', icon: Database },
        { id: 'privacy', label: 'Privacy', icon: Shield },
    ];

    const renderContent = () => {
        switch (activeCategory) {
            case 'breaks':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Break Intelligence</h2>
                            <p className="text-white/40 text-sm">Configure generic break timers.</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-8">
                            {/* Break Intelligence */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">Break Reminders</span>
                                    <Switch checked={breakEnabled} onChange={setBreakEnabled} />
                                </div>
                                {breakEnabled && (
                                    <div className="pt-2">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-white/70">Frequency</span>
                                            <span className="text-emerald-400 font-mono">{breakInterval}m</span>
                                        </div>
                                        <Slider value={breakInterval} min={15} max={120} onChange={setBreakInterval} />
                                        <div className="flex justify-between text-xs text-white/30 px-1 mt-1">
                                            <span>15m</span>
                                            <span>120m</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Smart Mode */}
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium">Smart Mode</span>
                                    <span className="text-white/40 text-xs max-w-xs">Only alert if you've been sitting continuously without verified breaks.</span>
                                </div>
                                <Switch checked={smartMode} onChange={setSmartMode} />
                            </div>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Appearance</h2>
                            <p className="text-white/40 text-sm">Visual customization.</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-8">

                            {/* Theme Selector */}
                            <div className="space-y-4">
                                <label className="text-white font-medium block">Theme</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${theme === 'dark'
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                            : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                                            }`}
                                    >
                                        <Moon size={20} /> Dark
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${theme === 'light'
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                            : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                                            }`}
                                    >
                                        <Sun size={20} /> Light
                                    </button>
                                </div>
                            </div>

                            {/* Accessbility */}
                            <div className="pt-6 border-t border-white/5 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">High Contrast</span>
                                    <Switch checked={highContrast} onChange={setHighContrast} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">Reduced Motion</span>
                                    <Switch checked={reducedMotion} onChange={setReducedMotion} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'posture':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Posture Detection</h2>
                            <p className="text-white/40 text-sm">Camera settings and analysis sensitivity.</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-8">
                            {/* Camera Access */}
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <Camera size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm font-medium">Camera Access</span>
                                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Active</span>
                                    </div>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                            </div>

                            {/* Sensitivity */}
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white/70">Detection Sensitivity</span>
                                    <span className="text-emerald-400 font-mono">{sensitivity} / 10</span>
                                </div>
                                <Slider value={sensitivity} min={1} max={10} onChange={setSensitivity} />
                                <p className="text-xs text-white/30 pt-2">
                                    Higher values will alert you to smaller deviations in posture.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Notifications & Sound</h2>
                            <p className="text-white/40 text-sm">Manage how UrBackBuddyAI alerts you.</p>
                        </div>

                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-8">
                            {/* Notifications */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium">System Notifications</span>
                                    <span className="text-white/40 text-xs">Receive native OS notifications when you slouch.</span>
                                </div>
                                <Switch checked={notificationsEnabled} onChange={setNotificationsEnabled} />
                            </div>

                            {/* Sound */}
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-medium">Sound Effects</span>
                                    <span className="text-white/40 text-xs">Play a gentle beep when posture is poor.</span>
                                </div>
                                <Switch checked={soundEnabled} onChange={setSoundEnabled} />
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="h-full flex items-center justify-center text-white/20">
                        <span className="text-sm">Settings panel under construction</span>
                    </div>
                );
        }
    };

    return (
        <div className="h-full grid grid-cols-1 md:grid-cols-[260px_1fr]">
            {/* Sidebar */}
            <div className="py-6 pr-4 border-r border-white/10 flex flex-col gap-1 pl-6">
                <h1 className="text-lg font-bold text-white mb-6 px-2 tracking-tight">System Settings</h1>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${activeCategory === cat.id
                            ? 'bg-white/10 text-white font-medium shadow-lg backdrop-blur-sm'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <cat.icon size={16} />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Content Panel */}
            <div className="p-8 md:p-12 overflow-y-auto">
                <div className="max-w-xl mx-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
