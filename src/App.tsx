import { useState, useEffect } from 'react';
import { bridge } from './services/bridge';
import { PoseOverlay } from './components/PoseOverlay';
import {
  LayoutDashboard,
  Settings,
  History,
  Moon,
  Sun,
  Monitor, // For Midnight mode
  Activity
} from 'lucide-react'; // Make sure to install: npm install lucide-react

type Theme = 'light' | 'dark' | 'midnight';
type View = 'dashboard' | 'analytics' | 'settings';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isTracking, setTracking] = useState(false);

  // --- THEME LOGIC ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'midnight');
    root.classList.add(theme);
  }, [theme]);

  // --- TRACKING LOGIC ---
  const toggleTracking = async () => {
    if (isTracking) {
      await bridge.stopTracking();
      setTracking(false);
    } else {
      await bridge.startTracking();
      setTracking(true);
    }
  };

  // --- DYNAMIC STYLES BASED ON THEME ---
  const getThemeClasses = () => {
    switch (theme) {
      case 'light': return "bg-gray-100 text-gray-900";
      case 'midnight': return "bg-black text-gray-200"; // Pure black
      default: return "bg-gray-900 text-white"; // Standard Dark
    }
  };

  const getCardClass = () => {
    switch (theme) {
      case 'light': return "bg-white border-gray-200 shadow-sm";
      case 'midnight': return "bg-[#0A0A0A] border-[#1A1A1A]";
      default: return "bg-gray-800 border-gray-700";
    }
  };

  return (
    <div className={`flex h-screen w-screen transition-colors duration-300 ${getThemeClasses()}`}>

      {/* --- SIDEBAR --- */}
      <aside className={`w-64 flex flex-col border-r p-4 ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-800 bg-opacity-50'}`}>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">UrBackBuddy</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isActive={view === 'dashboard'}
            onClick={() => setView('dashboard')}
            theme={theme}
          />
          <NavItem
            icon={<History size={20} />}
            label="Analytics"
            isActive={view === 'analytics'}
            onClick={() => setView('analytics')}
            theme={theme}
          />
          <NavItem
            icon={<Settings size={20} />}
            label="Settings"
            isActive={view === 'settings'}
            onClick={() => setView('settings')}
            theme={theme}
          />
        </nav>

        {/* Theme Toggle Panel */}
        <div className={`p-3 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
          <div className="text-xs font-semibold opacity-50 mb-3 uppercase tracking-wider">Appearance</div>
          <div className="flex justify-between">
            <ThemeBtn theme={theme} target="light" icon={<Sun size={16} />} onClick={() => setTheme('light')} />
            <ThemeBtn theme={theme} target="dark" icon={<Moon size={16} />} onClick={() => setTheme('dark')} />
            <ThemeBtn theme={theme} target="midnight" icon={<Monitor size={16} />} onClick={() => setTheme('midnight')} />
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold capitalize">{view}</h2>
            <p className="opacity-60 text-sm">Welcome back, Trinadh.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`h-3 w-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-sm font-mono opacity-70">{isTracking ? 'System Active' : 'System Idle'}</span>
          </div>
        </header>

        {/* VIEW 1: DASHBOARD (The AI Engine) */}
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">

            {/* The Visualizer Stage */}
            <div className={`lg:col-span-2 rounded-2xl flex flex-col items-center justify-center relative border ${getCardClass()}`}>
              <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                <PoseOverlay />
              </div>

              {/* Floating Action Button */}
              <button
                onClick={toggleTracking}
                className={`absolute bottom-6 px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 ${isTracking
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-black hover:bg-green-400"
                  }`}
              >
                {isTracking ? "Stop Session" : "Start Monitoring"}
              </button>
            </div>

            {/* Right Panel: Quick Stats */}
            <div className="flex flex-col gap-6">
              <StatCard title="Session Time" value="00:00" subtitle="Elapsed" theme={theme} />
              <StatCard title="Posture Score" value="100%" subtitle="Excellent" theme={theme} />

              {/* Daily Graph Placeholder */}
              <div className={`flex-1 rounded-2xl border p-4 ${getCardClass()}`}>
                <h3 className="opacity-60 text-sm font-bold mb-4">Daily Trend</h3>
                <div className="w-full h-32 flex items-end gap-2 px-2 opacity-50">
                  {[40, 70, 35, 90, 60, 80, 50].map((h, i) => (
                    <div key={i} className="flex-1 bg-green-500 rounded-t-sm transition-all hover:bg-green-400" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SETTINGS PLACEHOLDER */}
        {view === 'settings' && (
          <div className={`p-8 rounded-2xl border ${getCardClass()}`}>
            <h3 className="text-xl font-bold mb-4">Sensitivity Settings</h3>
            <p className="opacity-60">Adjust how strict the AI judge is.</p>
            {/* We will add sliders here later */}
          </div>
        )}

      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

const NavItem = ({ icon, label, isActive, onClick, theme }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
        ? 'bg-green-500 text-black font-bold shadow-lg shadow-green-500/20'
        : `opacity-60 hover:opacity-100 hover:bg-white/5`
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ThemeBtn = ({ theme, target, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg transition-all ${theme === target ? 'bg-green-500 text-black shadow-md' : 'opacity-40 hover:opacity-100 hover:bg-gray-500/20'
      }`}
  >
    {icon}
  </button>
);

const StatCard = ({ title, value, subtitle, theme }: any) => {
  const getCardClass = () => {
    switch (theme) {
      case 'light': return "bg-white border-gray-200 shadow-sm";
      case 'midnight': return "bg-[#0A0A0A] border-[#1A1A1A]";
      default: return "bg-gray-800 border-gray-700";
    }
  };

  return (
    <div className={`p-6 rounded-2xl border ${getCardClass()}`}>
      <div className="text-sm opacity-60 font-medium uppercase tracking-wider mb-1">{title}</div>
      <div className="text-4xl font-mono font-light my-2">{value}</div>
      <div className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-md inline-block">
        {subtitle}
      </div>
    </div>
  );
};

export default App;
