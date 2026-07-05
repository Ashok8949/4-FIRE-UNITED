/*=========================================
      4 FIRE UNITED - CARD FIRE BORDER
      Spawns rising ember particles around
      each team-card / player-card so the
      flame border feels alive & 3D.
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    const cards = document.querySelectorAll(".team-card, .player-card");

    cards.forEach(card => {

        // avoid double-init if script runs twice
        if (card.querySelector(".card-embers")) return;

        const emberLayer = document.createElement("div");
        emberLayer.className = "card-embers";
        card.appendChild(emberLayer);

        const emberCount = 16;

        for (let i = 0; i < emberCount; i++) {

            const ember = document.createElement("span");
            ember.className = "card-ember";

            const size = (2 + Math.random() * 4).toFixed(1);

            ember.style.left = Math.random() * 100 + "%";
            ember.style.width = size + "px";
            ember.style.height = size + "px";
            ember.style.animationDuration = (1.4 + Math.random() * 2.2) + "s";
            ember.style.animationDelay = (Math.random() * 3) + "s";
            ember.style.setProperty("--drift", (Math.random() * 30 - 15) + "px");

            emberLayer.appendChild(ember);

        }

    });

});