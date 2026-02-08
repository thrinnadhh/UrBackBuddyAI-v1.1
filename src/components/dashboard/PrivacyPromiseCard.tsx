import { CheckCircle, WifiOff, HardDrive } from "lucide-react";

export const PrivacyPromiseCard = () => {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
            <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider opacity-80">Privacy Guarantee</h3>
            <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm">
                    <CheckCircle size={16} className="text-[var(--color-primary)]" />
                    <span>100% On-Device Processing</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                    <HardDrive size={16} className="text-[var(--color-primary)]" />
                    <span>No Image/Video Storage</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                    <WifiOff size={16} className="text-[var(--color-primary)]" />
                    <span>No Network Calls</span>
                </li>
            </ul>
        </div>
    );
};
