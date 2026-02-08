import { useState } from "react";
import { ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export const PrivacyAccordion = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Mocked hashes specifically for demo
    const mockHashes = [
        "SHA-256: 8a7b9c... [Processed locally]",
        "SHA-256: 1d4e2f... [Processed locally]",
        "SHA-256: 9a0b3c... [Processed locally]",
        "SHA-256: 5f6e7d... [Processed locally]",
        "SHA-256: 2a1b4c... [Processed locally]"
    ];

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-app)] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-[var(--color-primary)]" />
                    <span className="font-medium text-sm">Processed in last 15m</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="p-4 bg-[var(--bg-app)] border-t border-[var(--border)]">
                    <div className="font-mono text-xs space-y-2 opacity-70">
                        {mockHashes.map((hash, i) => (
                            <div key={i} className="truncate">{hash}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
