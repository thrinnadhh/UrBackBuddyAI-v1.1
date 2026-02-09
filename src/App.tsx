import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Journey from './pages/Journey';
import Privacy from './pages/Privacy';
import Settings from './pages/Settings';

import { useEffect } from 'react';
import { bridge } from './services/bridge';
import { getCurrentWindow } from '@tauri-apps/api/window';

function App() {
  useEffect(() => {
    // FAIL-SAFE: Ensure camera is killed on window close
    let unlistenFn: (() => void) | undefined;

    const setupCleanup = async () => {
      try {
        // Only attempt if running in Tauri environment
        // @ts-ignore
        if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
          unlistenFn = await getCurrentWindow().onCloseRequested(async () => {
            console.log("Win Close Req: Killing Camera...");
            await bridge.killCamera();
          });
        }
      } catch (err) {
        console.warn("Tauri API not available (Browser Mode?):", err);
      }
    };

    setupCleanup();

    return () => {
      if (unlistenFn) unlistenFn();
    };

    const bootSequence = async () => {
      console.log("🚀 Booting System...");

      try {
        console.log("1. Initializing Database...");
        await bridge.initDb();
        console.log("✅ Database Ready");

        console.log("2. Initializing Camera...");
        await bridge.initCamera();
        console.log("✅ Camera Ready");

        console.log("3. Initializing AI Engine...");
        await bridge.initAi();
        console.log("✅ AI Engine Ready");

      } catch (error) {
        console.error("❌ CRITICAL BOOT ERROR:", error);
        alert(`Backend Initialization Failed:\n${error}`); // This will show the real reason
      }
    };

    bootSequence();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="journey" element={<Journey />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
