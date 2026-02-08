import { useRef } from 'react';
import { Sliders } from 'lucide-react';

interface SettingsViewProps {
    sensitivity: number;
    setSensitivity: (val: number) => void;
}

export const SettingsView = ({ sensitivity, setSensitivity }: SettingsViewProps) => {
    const sliderRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSensitivity(parseInt(e.target.value));
    };

    return (
        <div className="h-full w-full overflow-y-auto pr-2">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">Settings</h2>
                <p className="text-white/40 text-sm">Customize your AI experience.</p>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-8">

                {/* Section: Sensitivity */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Sliders size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Posture Sensitivity</h3>
                            <p className="text-xs text-white/50">Adjust how strict the AI is about your posture.</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-white/70">Correction Level</span>
                            <span className="text-2xl font-bold font-mono text-emerald-400">{sensitivity}</span>
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={sensitivity}
                            onChange={handleChange}
                            ref={sliderRef}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                        />

                        <div className="flex justify-between mt-3 text-[10px] uppercase font-bold text-white/30 tracking-wider">
                            <span>Relaxed</span>
                            <span>Standard</span>
                            <span>Strict</span>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/70 leading-relaxed">
                    <strong>Pro Tip:</strong> Start with a sensitivity of 5. Increase it if you find yourself slouching without alerts. Decrease it if you get too many false positives.
                </div>

            </div>
        </div>
    );
};
