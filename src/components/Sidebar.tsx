import { LayoutDashboard, BarChart2, Settings } from "lucide-react";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "report", label: "Daily Report", icon: BarChart2 },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <div className="w-64 h-full bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col transition-colors duration-200">
            <div className="p-6 border-b border-[var(--border)]">
                <h1 className="text-xl font-bold text-[var(--text-main)]">
                    PostureSense
                </h1>
                <p className="text-xs text-[var(--text-main)] opacity-70 mt-1">Privacy Engine v1.0</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200
                ${isActive
                                    ? "bg-[var(--bg-app)] text-[var(--color-primary)] font-medium"
                                    : "text-[var(--text-main)] hover:bg-[var(--bg-app)]/50 opacity-80 hover:opacity-100"
                                }`}
                        >
                            <Icon size={20} className={isActive ? "text-[var(--color-primary)]" : "text-[var(--text-main)]"} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                    <span className="text-xs text-[var(--text-main)] font-mono opacity-80">System Secure</span>
                </div>
            </div>
        </div>
    );
};
