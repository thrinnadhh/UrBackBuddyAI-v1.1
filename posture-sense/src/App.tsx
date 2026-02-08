import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Dashboard } from './screens/Dashboard';
import { Settings } from './screens/Settings';
import { LayoutDashboard, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';

function App() {
  const { currentTab, setTab, theme, initialize, error } = useAppStore();

  // Initialize Backend on Mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Handle theme class on body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [theme]);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme}`}>
      {/* Sidebar */}
      <nav className="w-20 lg:w-64 flex flex-col border-r border-slate-800 bg-surface-dark z-20">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-lg shrink-0"></div>
          <span className="ml-3 font-bold text-slate-100 hidden lg:block tracking-tight">PostureSense</span>
        </div>

        <div className="flex-1 py-6 space-y-1 px-3">
          <button
            onClick={() => setTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentTab === 'dashboard' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden lg:block text-sm font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${currentTab === 'settings' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <SettingsIcon size={20} />
            <span className="hidden lg:block text-sm font-medium">Settings</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
              U
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-medium text-slate-300">Local User</div>
              <div className="text-[10px] text-slate-500">Offline Profile</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-background-dark relative flex flex-col">
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-center text-red-400 text-xs">
            <AlertTriangle size={14} className="mr-2" />
            <span>System Error: {error}</span>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
