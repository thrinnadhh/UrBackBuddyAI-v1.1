import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Journey from './pages/Journey';
import Privacy from './pages/Privacy';
import Settings from './pages/Settings';

import { useEffect } from 'react';
import { bridge } from './services/bridge';

function App() {
  useEffect(() => {
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
