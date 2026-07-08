/*=========================================
      4 FIRE UNITED CINEMATIC LOADER
=========================================*/

window.addEventListener("load", () => {

const loader = document.getElementById("loader");
if (!loader) return;

const flash = document.querySelector(".flash");
const ring = document.querySelector(".fire-ring");
const sparks = document.querySelector(".sparks");
const logo = document.querySelector(".loader-content");
const particleBox = document.querySelector(".particles");

/* Lock Scroll */

document.body.style.overflow = "hidden";

/*==============================
      BULLET COLLISION
==============================*/

setTimeout(() => {

    if (flash) flash.classList.add("active");
    if (ring) ring.classList.add("active");
    if (sparks) sparks.classList.add("active");

    loader.classList.add("loader-shake");

}, 1500);

/*==============================
      REMOVE SHAKE
==============================*/

setTimeout(() => {

    loader.classList.remove("loader-shake");

}, 1900);

/*==============================
      SHOW LOGO
==============================*/

setTimeout(() => {

    if (logo) {
        logo.style.opacity = "1";
        logo.style.transform = "scale(1)";
        logo.style.transition = "1s";
    }

}, 2200);

/*==============================
      FIRE PULSE
==============================*/

let pulseInterval = null;

if (logo) {

    pulseInterval = setInterval(() => {

        logo.style.filter = "brightness(1.4)";

        setTimeout(() => {

            logo.style.filter = "brightness(1)";

        }, 250);

    }, 1200);

}

/*==============================
      FIRE PARTICLES
==============================*/

if (particleBox) {

    for (let i = 0; i < 30; i++) {

        const ember = document.createElement("span");

        ember.className = "ember";

        ember.style.left = Math.random() * 100 + "vw";
        ember.style.animationDuration = (3 + Math.random() * 4) + "s";
        ember.style.animationDelay = (Math.random() * 4) + "s";
        ember.style.width = (2 + Math.random() * 6) + "px";
        ember.style.height = ember.style.width;

        particleBox.appendChild(ember);

    }

}

/*==============================
      LOGO GLOW
==============================*/

let glowInterval = null;

if (logo) {

    glowInterval = setInterval(() => {

        logo.animate(
            [
                { transform: "scale(1)" },
                { transform: "scale(1.03)" },
                { transform: "scale(1)" }
            ],
            {
                duration: 800
            }
        );

    }, 1800);

}

/*==============================
      FLASH FADE
==============================*/

setTimeout(() => {

    if (flash) {

        flash.style.transition = ".8s";
        flash.style.opacity = "0";

    }

}, 2600);

/*==============================
      LOADER EXIT
==============================*/

setTimeout(() => {

    loader.style.transition = "opacity 1.2s ease";
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";

    document.body.style.overflow = "auto";

    if (pulseInterval) clearInterval(pulseInterval);
    if (glowInterval) clearInterval(glowInterval);

}, 1800);

/*==============================
      CLEANUP
==============================*/

setTimeout(() => {

    loader.remove();

}, 6500);

});