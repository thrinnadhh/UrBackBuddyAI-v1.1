import { useState } from 'react';
import { bridge } from './services/bridge'; // Corrected path
import { PoseOverlay } from './components/PoseOverlay';

function App() {
  const [isAiReady, setAiReady] = useState(false);
  const [isTracking, setTracking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const initializeSystem = async () => {
    try {
      addLog("Initializing Camera...");
      await bridge.initCamera();

      addLog("Loading AI Brain...");
      await bridge.initAi();

      addLog("System Ready.");
      setAiReady(true);
    } catch (e) {
      // cast e to string or handle error properly
      addLog(`Error: ${e}`);
    }
  };

  const toggleTracking = async () => {
    if (isTracking) {
      await bridge.stopTracking();
      setTracking(false);
      addLog("Tracking Stopped.");
    } else {
      await bridge.startTracking();
      setTracking(true);
      addLog("Tracking Started...");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6 text-green-400">
        PostureSense <span className="text-sm text-gray-500">v1.0 Privacy Engine</span>
      </h1>

      {/* Control Panel */}
      <div className="flex gap-4 mb-8">
        {!isAiReady ? (
          <button
            onClick={initializeSystem}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold shadow-lg transition-all"
          >
            🔌 Initialize System
          </button>
        ) : (
          <button
            onClick={toggleTracking}
            className={`px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${isTracking
                ? "bg-red-600 hover:bg-red-500 animate-pulse"
                : "bg-green-600 hover:bg-green-500"
              }`}
          >
            {isTracking ? "🛑 Stop Tracking" : "▶️ Start Tracking"}
          </button>
        )}
      </div>

      {/* The Visualizer */}
      <div className="flex gap-8">
        <PoseOverlay />

        {/* Logs Panel */}
        <div className="w-64 h-[480px] bg-gray-900 border border-gray-800 rounded-lg p-4 font-mono text-xs overflow-hidden">
          <div className="text-gray-500 mb-2 border-b border-gray-700 pb-1">System Logs</div>
          {logs.map((log, i) => (
            <div key={i} className="mb-1 text-green-300">
              <span className="opacity-50 mr-2">[{i}]</span>{log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
