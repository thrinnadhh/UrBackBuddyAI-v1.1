import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// CRITICAL: Global Error Logging for Debugging Blank Screen
window.onerror = function (message, source, lineno, colno, error) {
  console.error("GLOBAL ERROR CAUGHT:", message, error);
  document.body.innerHTML += `<div style="color:red; padding:20px; z-index:9999; position:fixed; top:0; background:black;">
    <h1>CRITICAL ERROR</h1>
    <pre>${message}</pre>
    <pre>${source}:${lineno}:${colno}</pre>
  </div>`;
};

// Fallback UI if React fails to mount properly
const rootElement = document.getElementById("root");
if (!rootElement) {
  document.body.innerHTML = "<h1>FATAL: Root element not found</h1>";
}

try {
  ReactDOM.createRoot(rootElement as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log("React Mounted Successfully");
} catch (err) {
  console.error("React Mount Failed:", err);
  document.body.innerHTML = `<h1>React Mount Failed</h1><pre>${err}</pre>`;
}
