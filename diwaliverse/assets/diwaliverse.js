(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The first public build is deliberately local-only. No personal data is sent.
  let diyaIsLit = false;
  let personalDiyas = 0;

  const lightButton = byId("lightButton");
  const lightButtonText = byId("lightButtonText");
  const lightStatus = byId("lightStatus");
  const diya = byId("interactiveDiya");
  const sparkLayer = byId("sparkLayer");
  const personalDiyasOutput = byId("personalDiyas");

  function burstSparks() {
    if (!sparkLayer || reducedMotion) return;
    const count = 18;
    for (let i = 0; i < count; i += 1) {
      const spark = document.createElement("span");
      const angle = (Math.PI * 2 * i) / count;
      const distance = 55 + Math.random() * 70;
      spark.className = "spark";
      spark.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      spark.style.animationDelay = (Math.random() * 100) + "ms";
      sparkLayer.appendChild(spark);
      window.setTimeout(() => spark.remove(), 1200);
    }
  }

  if (lightButton && diya) {
    lightButton.addEventListener("click", () => {
      diyaIsLit = !diyaIsLit;
      diya.classList.toggle("is-lit", diyaIsLit);
      lightButton.setAttribute("aria-pressed", String(diyaIsLit));
      lightButtonText.textContent = diyaIsLit ? "Let my light shine" : "Light my diya";
      if (diyaIsLit) {
        personalDiyas += 1;
        burstSparks();
        lightStatus.textContent = "Your diya is glowing. May your wish find its way.";
      } else {
        lightStatus.textContent = "Your diya is resting. You can light it again whenever you like.";
      }
      personalDiyasOutput.textContent = String(personalDiyas);
    });
  }

  // Wish wall preview: intentionally local-only until moderation is implemented.
  const wishForm = byId("wishForm");
  const wishMessage = byId("wishMessage");
  const wishName = byId("wishName");
  const wishCount = byId("wishCount");
  const wishPreview = byId("wishPreview");
  const wishPreviewText = byId("wishPreviewText");
  const wishPreviewBy = byId("wishPreviewBy");

  if (wishMessage && wishCount) {
    wishMessage.addEventListener("input", () => {
      wishCount.textContent = wishMessage.value.length + " / 180";
    });
  }

  if (wishForm) {
    wishForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = (wishMessage.value || "").trim();
      const name = (wishName.value || "").trim();
      if (!message) {
        wishMessage.focus();
        return;
      }
      wishPreviewText.textContent = message;
      wishPreviewBy.textContent = name ? "With love, " + name : "With love, a friend";
      wishPreview.hidden = false;
      wishPreview.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    });
  }

  // Greeting-card renderer: canvas output is generated entirely in this browser.
  const canvas = byId("greetingCanvas");
  const cardName = byId("cardName");
  const cardMessage = byId("cardMessage");
  const cardTheme = byId("cardTheme");
  const cardStatus = byId("cardStatus");

  const palettes = {
    gold: { top: "#1b1119", bottom: "#5b3028", accent: "#f1c47e", glow: "#e89a4c", text: "#fff0d5" },
    plum: { top: "#170f24", bottom: "#59304f", accent: "#e9b6c8", glow: "#b86b91", text: "#fff0e9" },
    forest: { top: "#0c1d1a", bottom: "#285044", accent: "#d9c58c", glow: "#8bb28b", text: "#f4f1d9" }
  };

  function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const test = line ? line + " " + word : word;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    const visible = lines.slice(0, maxLines);
    visible.forEach((entry, index) => context.fillText(entry, x, y + index * lineHeight));
    return visible.length;
  }

  function drawCard() {
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const palette = palettes[cardTheme && palettes[cardTheme.value] ? cardTheme.value : "gold"];
    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, palette.top);
    background.addColorStop(1, palette.bottom);
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(width / 2, 180, 5, width / 2, 180, 360);
    glow.addColorStop(0, palette.glow + "55");
    glow.addColorStop(1, palette.glow + "00");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = palette.accent + "99";
    context.lineWidth = 2;
    context.strokeRect(24, 24, width - 48, height - 48);
    context.strokeStyle = palette.accent + "44";
    context.lineWidth = 1;
    context.strokeRect(34, 34, width - 68, height - 68);

    // Subtle star field.
    for (let i = 0; i < 46; i += 1) {
      const x = 58 + ((i * 137) % (width - 116));
      const y = 55 + ((i * 83) % (height - 110));
      context.globalAlpha = 0.18 + ((i % 4) * 0.08);
      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(x, y, i % 7 === 0 ? 2.5 : 1.2, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;

    // Rangoli-inspired centre ornament.
    context.save();
    context.translate(width / 2, 150);
    for (let i = 0; i < 12; i += 1) {
      context.rotate(Math.PI / 6);
      context.beginPath();
      context.ellipse(0, -29, 8, 25, 0, 0, Math.PI * 2);
      context.strokeStyle = palette.accent + "88";
      context.lineWidth = 1.5;
      context.stroke();
    }
    context.beginPath();
    context.arc(0, 0, 7, 0, Math.PI * 2);
    context.fillStyle = palette.accent;
    context.fill();
    context.restore();

    context.textAlign = "center";
    context.fillStyle = palette.accent;
    context.font = "700 15px Arial, sans-serif";
    context.letterSpacing = "5px";
    context.fillText("A FESTIVAL OF LIGHT", width / 2, 238);

    context.fillStyle = palette.text;
    context.font = "italic 62px Georgia, serif";
    context.fillText("Happy Diwali", width / 2, 316);

    context.fillStyle = palette.accent;
    context.font = "16px Arial, sans-serif";
    context.fillText("To " + ((cardName && cardName.value.trim()) || "Someone special"), width / 2, 365);

    context.fillStyle = palette.text;
    context.font = "18px Georgia, serif";
    wrapText(context, (cardMessage && cardMessage.value.trim()) || "May your home glow with happiness and your heart shine with hope.", width / 2, 412, 650, 29, 3);

    context.fillStyle = palette.accent;
    context.font = "700 11px Arial, sans-serif";
    context.letterSpacing = "3px";
    context.fillText("WITH LIGHT & LOVE  ·  DIWALIVERSE", width / 2, 505);
    context.letterSpacing = "0px";
  }

  [cardName, cardMessage, cardTheme].forEach((field) => {
    if (field) field.addEventListener("input", drawCard);
    if (field && field.tagName === "SELECT") field.addEventListener("change", drawCard);
  });
  drawCard();

  const downloadButton = byId("downloadCard");
  if (downloadButton && canvas) {
    downloadButton.addEventListener("click", () => {
      drawCard();
      if (typeof canvas.toBlob !== "function") {
        cardStatus.textContent = "Your browser cannot export this card. Try a recent browser.";
        return;
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          cardStatus.textContent = "The card could not be created. Please try again.";
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "diwaliverse-greeting.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        cardStatus.textContent = "Your greeting card has been downloaded to your device.";
      }, "image/png");
    });
  }

  const shareButton = byId("shareInvite");
  const shareStatus = byId("shareStatus");
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const inviteUrl = window.location.href.split("#")[0];
      const shareData = {
        title: "Join me on DiwaliVerse",
        text: "Let's add a little light to the celebration. Light a diya and create a Diwali greeting with me.",
        url: inviteUrl
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          shareStatus.textContent = "Your invitation is ready to travel.";
          return;
        }
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareData.text + " " + inviteUrl);
          shareStatus.textContent = "Invitation link copied. Share it with your circle.";
          return;
        }
        shareStatus.textContent = "Copy this page link from your browser to invite your circle.";
      } catch (error) {
        if (error && error.name === "AbortError") return;
        shareStatus.textContent = "Sharing is unavailable here. Copy this page link to invite your circle.";
      }
    });
  }
})();