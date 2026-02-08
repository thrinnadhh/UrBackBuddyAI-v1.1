import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BarChart2, Map, Shield, Settings, User } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function Layout() {
    const location = useLocation();
    const { userProfile } = useAppStore();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Reports', path: '/reports', icon: BarChart2 },
        { name: 'My Journey', path: '/journey', icon: Map },
        { name: 'Privacy', path: '/privacy', icon: Shield },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen w-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-blue-500/30">
            {/* Sidebar - Midnight Glass Aesthetic */}
            <aside className="w-64 flex flex-col border-r border-white/10 bg-white/[0.02] backdrop-blur-xl h-full relative z-20">

                {/* Logo Area */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="font-bold text-white text-lg">B</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            BackBuddy
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                    }
                `}
                            >
                                <Icon size={20} className={`${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-white'} transition-colors`} />
                                <span className="font-medium text-sm">{item.name}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Snippet */}
                <div className="p-4 border-t border-white/5 mx-2 mb-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10 shadow-inner">
                            <User size={18} className="text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
                            <p className="text-xs text-green-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-[#050505] to-[#0a0a0a] relative scrollbar-hide">
                {/* Subtle background glow effects */}
                <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-full h-96 bg-violet-500/5 blur-[120px] rounded-full pointer-events-none translate-y-1/3" />

                {/* Content Container */}
                <div className="relative z-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
