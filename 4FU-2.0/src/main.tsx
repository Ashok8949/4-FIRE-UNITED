import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "./styles/global.css";
import { AppErrorBoundary } from "./components/system/AppErrorBoundary";

if ("serviceWorker" in navigator && import.meta.env.PROD) { window.addEventListener("load", () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}4fu-pwa-sw.js`).catch(err => console.warn("[4FU PWA]", err))); }

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
      <App />
    </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
