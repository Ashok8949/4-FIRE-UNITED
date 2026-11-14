/* 4FU FESTIVE UNIVERSE
 * Reads the public settings/website document and applies an opt-in festival layer.
 * Animations are bounded, scheduled transitions are handled without page reloads,
 * and reduced-motion preferences are respected.
 */
(() => {
  "use strict";
  const FESTIVALS = {
    diwali: { emoji: "🪔", particle: "fu-spark", count: 24, message: "May your days shine bright — Happy Diwali!" },
    holi: { emoji: "🎨", particle: "fu-holi-splash", count: 13, message: "Add a little colour to every victory — Happy Holi!" },
    christmas: { emoji: "🎄", particle: "fu-snow", count: 30, message: "Wishing the 4FU family a magical Christmas!" },
    newyear: { emoji: "🎆", particle: "fu-confetti", count: 34, message: "New year. New goals. Same 4FU fire!" },
    eid: { emoji: "🌙", particle: "fu-spark", count: 18, message: "Peace, happiness and victories — Eid Mubarak!" },
    independence: { emoji: "🇮🇳", particle: "fu-confetti", count: 22, message: "Celebrating freedom, courage and unity." },
    halloween: { emoji: "🎃", particle: "fu-spark", count: 18, message: "A little spooky, a lot competitive. Happy Halloween!" }
  };
  const MAX_TIMER = 2147483647;
  const reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const params = new URLSearchParams(window.location.search);
  const preview = params.get("festivalPreview");
  const valid = key => Object.prototype.hasOwnProperty.call(FESTIVALS, key);
  let activeKey = null;
  let boundaryTimer = null;
  let liveConfig = null;

  function activeForDate(config, now = Date.now()) {
    if (!config || config.enabled !== true || !valid(config.festival)) return null;
    if (config.mode === "manual") return config.festival;
    if (config.mode !== "scheduled") return null;
    const start = Date.parse(config.startAt || "");
    const end = Date.parse(config.endAt || "");
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || now < start || now >= end) return null;
    return config.festival;
  }

  function removeExperience() {
    Array.from(document.documentElement.classList).forEach(name => {
      if (name.startsWith("fu-festival-")) document.documentElement.classList.remove(name);
    });
    ["fourfu-festival-layer", "fourfu-festival-toast", "fourfu-festival-diya-left", "fourfu-festival-diya-right", "fourfu-festival-rangoli", "fourfu-festival-moon"]
      .forEach(id => document.getElementById(id)?.remove());
    activeKey = null;
  }

  function addRangoli() {
    const wrap = document.createElement("div");
    wrap.id = "fourfu-festival-rangoli";
    wrap.className = "fu-rangoli";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="#ffbd4a" stroke-width="1.5"><circle cx="100" cy="100" r="82"/><circle cx="100" cy="100" r="65"/><circle cx="100" cy="100" r="46"/><circle cx="100" cy="100" r="24"/><path d="M100 18V182M18 100H182M42 42L158 158M158 42L42 158"/><path d="M100 22Q128 52 100 78Q72 52 100 22ZM178 100Q148 128 122 100Q148 72 178 100ZM100 178Q72 148 100 122Q128 148 100 178ZM22 100Q52 72 78 100Q52 128 22 100Z"/></g><g fill="#ffdf80"><circle cx="100" cy="18" r="3"/><circle cx="182" cy="100" r="3"/><circle cx="100" cy="182" r="3"/><circle cx="18" cy="100" r="3"/></g></svg>';
    document.body.appendChild(wrap);
  }

  function build(key, isPreview = false) {
    if (!valid(key) || activeKey === key) return;
    removeExperience();
    const theme = FESTIVALS[key];
    activeKey = key;
    document.documentElement.classList.add("fu-festival-" + key);
    const layer = document.createElement("div");
    layer.id = "fourfu-festival-layer";
    layer.setAttribute("aria-hidden", "true");
    if (!reducedMotion) {
      for (let i = 0; i < theme.count; i++) {
        const particle = document.createElement("span");
        particle.className = "fu-festival-particle " + theme.particle;
        particle.style.setProperty("--x", Math.random() * 100 + "vw");
        particle.style.setProperty("--duration", 9 + Math.random() * 13 + "s");
        particle.style.setProperty("--delay", -Math.random() * 18 + "s");
        particle.style.setProperty("--drift", -65 + Math.random() * 130 + "px");
        particle.style.setProperty("--alpha", (0.25 + Math.random() * 0.45).toFixed(2));
        particle.style.setProperty("--rot", Math.round(Math.random() * 180) + "deg");
        if (key === "holi") particle.style.background = ["#ff4e9b", "#ffc247", "#38d8c5", "#8c75ff", "#ff794d"][i % 5];
        if (key === "newyear" || key === "independence") particle.style.background = key === "independence" ? ["#ff9933", "#fff", "#138808"][i % 3] : ["#ffca55", "#8fd7ff", "#ff7eb6", "#b49aff"][i % 4];
        layer.appendChild(particle);
      }
    }
    document.body.appendChild(layer);

    if (key === "diwali") {
      const left = document.createElement("span");
      left.id = "fourfu-festival-diya-left"; left.className = "fu-diya"; left.textContent = "🪔";
      const right = document.createElement("span");
      right.id = "fourfu-festival-diya-right"; right.className = "fu-diya fu-diya-right"; right.textContent = "🪔";
      left.setAttribute("aria-hidden", "true"); right.setAttribute("aria-hidden", "true");
      document.body.append(left, right); addRangoli();
    }
    if (key === "eid" && !reducedMotion) {
      const moon = document.createElement("span");
      moon.id = "fourfu-festival-moon"; moon.className = "fu-diya"; moon.textContent = "🌙";
      moon.setAttribute("aria-hidden", "true"); document.body.appendChild(moon);
    }

    let welcomed = false;
    const welcomeKey = "fu-festival-welcomed:" + key;
    if (!isPreview) {
      try { welcomed = sessionStorage.getItem(welcomeKey) === "1"; } catch (_) {}
    }
    if (!welcomed) {
      const toast = document.createElement("div");
      toast.id = "fourfu-festival-toast"; toast.className = "fu-festival-toast";
      toast.setAttribute("role", "status"); toast.textContent = theme.emoji + " " + theme.message;
      document.body.appendChild(toast);
      if (!isPreview) {
        try { sessionStorage.setItem(welcomeKey, "1"); } catch (_) {}
      }
      window.setTimeout(() => toast.remove(), 6500);
    }
  }

  function applyLiveConfig() {
    if (!liveConfig) return;
    if (boundaryTimer !== null) window.clearTimeout(boundaryTimer);
    boundaryTimer = null;
    const now = Date.now();
    const nextKey = activeForDate(liveConfig, now);
    if (nextKey) build(nextKey);
    else if (activeKey) removeExperience();

    if (liveConfig.enabled === true && liveConfig.mode === "scheduled" && valid(liveConfig.festival)) {
      const start = Date.parse(liveConfig.startAt || "");
      const end = Date.parse(liveConfig.endAt || "");
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        const nextBoundary = now < start ? start : (now < end ? end : null);
        if (nextBoundary !== null) {
          boundaryTimer = window.setTimeout(applyLiveConfig, Math.min(MAX_TIMER, Math.max(0, nextBoundary - now + 20)));
        }
      }
    }
  }

  function start() {
    if (params.has("festivalPreview")) {
      if (valid(preview)) build(preview, true);
      return;
    }
    if (typeof db === "undefined" || !db.collection) return;
    db.collection("settings").doc("website").get().then(doc => {
      if (!doc.exists) return;
      liveConfig = doc.data().festival || null;
      applyLiveConfig();
    }).catch(err => console.warn("[4FU Festive Universe] Could not load festival settings:", err));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") applyLiveConfig();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
