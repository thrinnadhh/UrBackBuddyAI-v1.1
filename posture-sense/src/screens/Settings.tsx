import { useAppStore } from '../store/useAppStore';
import { ChevronRight } from 'lucide-react';

export const Settings = () => {
    const { theme, toggleTheme, fontSize, setFontSize } = useAppStore();

    return (
        <div className="p-8 h-full overflow-y-auto max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-100 mb-8">Settings</h2>

            {/* Section 1: Appearance */}
            <section className="mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Appearance</h3>
                <div className="bg-surface-dark border border-slate-800 rounded-lg overflow-hidden">

                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <div>
                            <div className="text-slate-200 font-medium">Theme</div>
                            <div className="text-xs text-slate-500">Choose your interface appearance</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm transition-colors border border-slate-700"
                        >
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </button>
                    </div>

                    {/* Font Size Stepper */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <div>
                            <div className="text-slate-200 font-medium">Font Size</div>
                            <div className="text-xs text-slate-500">Adjust text scaling</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setFontSize(Math.max(75, fontSize - 5))} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-slate-300 hover:bg-slate-700">-</button>
                            <span className="text-slate-300 w-12 text-center text-sm">{fontSize}%</span>
                            <button onClick={() => setFontSize(Math.min(150, fontSize + 5))} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded text-slate-300 hover:bg-slate-700">+</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Preferences */}
            <section className="mb-8">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Preferences</h3>
                <div className="bg-surface-dark border border-slate-800 rounded-lg overflow-hidden">
                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <div>
                            <div className="text-slate-200 font-medium">Break Reminders</div>
                            <div className="text-xs text-slate-500">Get notified to take a break</div>
                        </div>
                        <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-0 transition-transform duration-200 ease-in-out" />
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-700 cursor-pointer"></label>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Legal */}
            <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Legal</h3>
                <div className="bg-surface-dark border border-slate-800 rounded-lg overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors text-left">
                        <div>
                            <div className="text-slate-200 font-medium">Open Source Licenses</div>
                            <div className="text-xs text-slate-500">Apache 2.0 Usage</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-500" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors text-left">
                        <div>
                            <div className="text-slate-200 font-medium">Medical Disclaimer</div>
                            <div className="text-xs text-slate-500">Not a medical device</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-500" />
                    </button>
                </div>
            </section>
        </div>
    );
};
