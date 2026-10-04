import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "./styles/global.css";
import { AppErrorBoundary } from "./components/system/AppErrorBoundary";

if ("serviceWorker" in navigator && import.meta.env.PROD) { window.addEventListener("load", () => navigator.serviceWorker.register("/4fu-2.0/4fu-pwa-sw.js").catch(err => console.warn("[4FU PWA]", err))); }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>\n    <AppErrorBoundary>
    <BrowserRouter basename="/4fu-2.0">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
