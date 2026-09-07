import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import "./styles/assets.css";
import "./styles/seats.css";
import "./styles/pwa.css";
import "./styles/scoreboard.css";
import "./styles/flip.css";
import "./styles/camera.css";
import "./styles/lighting.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

document.addEventListener(
  "gesturestart",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);
