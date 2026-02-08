interface Option {
    value: string;
    label: string;
}

interface SegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
}

export const SegmentedControl = ({ options, value, onChange }: SegmentedControlProps) => {
    return (
        <div className="flex bg-[var(--bg-app)] p-1 rounded-lg border border-[var(--border)]">
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`
              flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${isSelected
                                ? "bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm border border-[var(--border)]"
                                : "text-[var(--text-main)] opacity-60 hover:opacity-100 hover:bg-[var(--bg-card)]/50"
                            }
            `}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
