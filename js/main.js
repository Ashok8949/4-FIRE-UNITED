/*=========================================
        4 FIRE UNITED - MAIN JS V2
=========================================*/

"use strict";

/*=========================================
            DOM ELEMENTS
=========================================*/

const loader = document.querySelector(".loader");
const navbar = document.querySelector(".navbar");
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");
const scrollBtn = document.getElementById("scrollTop");
const year = document.getElementById("year");

/*=========================================
            PAGE LOADED
=========================================*/



    // Hide Loader

   

    // Current Year

    

/*=========================================
            MOBILE MENU
=========================================*/

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });

    document.querySelectorAll(".nav-links a").forEach((link) => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("active");

        });

    });

}

/*=========================================
            SMOOTH SCROLL
=========================================*/

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {

    anchor.addEventListener("click", (e) => {

        const href = anchor.getAttribute("href");

        // Ignore empty or placeholder links
        if (!href || href === "#") return;

        // Only handle in-page anchors
        if (!href.startsWith("#")) return;

        const target = document.querySelector(href);

        if (!target) return;

        e.preventDefault();

        target.scrollIntoView({

            behavior: "smooth",
            block: "start"

        });

    });

});

/*=========================================
            ACTIVE NAV LINK
=========================================*/

const currentPage = location.pathname.split("/").pop();

document.querySelectorAll(".nav-links a").forEach((link) => {

    const href = link.getAttribute("href");

    if (
        href === currentPage ||
        (currentPage === "" && href === "index.html")
    ) {

        link.classList.add("active");

    }

});

/*=========================================
            NAVBAR EFFECT
=========================================*/

if (navbar) {

    let lastScroll = 0;

    window.addEventListener("scroll", () => {

        const current = window.pageYOffset;

        // Background

        if (current > 40) {

            navbar.style.background = "rgba(0,0,0,.92)";
            navbar.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";

        } else {

            navbar.style.background = "rgba(0,0,0,.35)";
            navbar.style.boxShadow = "none";

        }

        // Hide / Show

        if (current > lastScroll && current > 120) {

            navbar.style.transform = "translateY(-100%)";

        } else {

            navbar.style.transform = "translateY(0)";

        }

        lastScroll = current;

    }, { passive: true });

}
/*=========================================
            SCROLL TO TOP
=========================================*/

if (scrollBtn) {

    window.addEventListener("scroll", () => {

        scrollBtn.style.display =
            window.scrollY > 300 ? "flex" : "none";

    }, { passive: true });

    scrollBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}

/*=========================================
            BUTTON ANIMATION
=========================================*/

document.querySelectorAll(".btn1,.btn2,.join-btn").forEach((btn) => {

    btn.addEventListener("click", () => {

        btn.style.transform = "scale(.96)";

        setTimeout(() => {

            btn.style.transform = "";

        }, 120);

    });

});

/*=========================================
            SCROLL REVEAL
=========================================*/

const revealItems = document.querySelectorAll(

".about,.players,.hall,.gallery-preview,.stats-section,.join-team,.team-card,.player-profile,.player-banner,.tournament-card,.gallery-box"

);

function revealOnScroll() {

    revealItems.forEach((item) => {

        if (

            item.getBoundingClientRect().top <
            window.innerHeight - 80

        ) {

            item.classList.add("show");

        }

    });

}

window.addEventListener(

    "scroll",

    revealOnScroll,

    { passive: true }

);

revealOnScroll();

/*=========================================
            COUNTER
=========================================*/

const counters = document.querySelectorAll(".stats-card h1");

let counterStarted = false;

function animateCounter(counter, endValue, suffix) {

    let start = 0;

    const duration = 1200;

    const startTime = performance.now();

    function update(now) {

        const progress = Math.min(

            (now - startTime) / duration,

            1

        );

        start = Math.floor(progress * endValue);

        counter.textContent = start + suffix;

        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            counter.textContent = endValue + suffix;

        }

    }

    requestAnimationFrame(update);

}

function startCounter() {

    if (counterStarted) return;

    const section = document.querySelector(".stats-section");

    if (!section) return;

    if (

        section.getBoundingClientRect().top <
        window.innerHeight - 100

    ) {

        counterStarted = true;

        counters.forEach((counter) => {

            const text = counter.textContent;

            const number = parseInt(

                text.replace(/\D/g, "")

            );

            const suffix = text.replace(/[0-9]/g, "");

            if (!isNaN(number)) {

                animateCounter(

                    counter,

                    number,

                    suffix

                );

            }

        });

    }

}

window.addEventListener(

    "scroll",

    startCounter,

    { passive: true }

);

startCounter();

/*=========================================
        PAGE VISIBILITY OPTIMIZATION
=========================================*/

document.addEventListener("visibilitychange", () => {

    if (document.hidden) {

        console.log("Page Hidden");

    } else {

        revealOnScroll();
        startCounter();

    }

});

/*=========================================
        VISITOR COUNTER
=========================================*/

(function () {

    const KEY = "4fu-last-visit";

    const now = Date.now();

    const lastVisit = Number(localStorage.getItem(KEY)) || 0;

    // Count only once every 30 minutes
    if (now - lastVisit < 30 * 60 * 1000) {

        return;

    }

    localStorage.setItem(KEY, now);

    if (typeof db === "undefined") return;

    db.collection("stats")
        .doc("visitors")
        .set({

            total: firebase.firestore.FieldValue.increment(1),

            lastVisit:
                firebase.firestore.FieldValue.serverTimestamp()

        }, {

            merge: true

        })

        .catch((err) => {

            console.error("Visitor Error:", err);

        });

})();

/*=========================================
        DISABLE RIGHT CLICK
=========================================*/

document.addEventListener("contextmenu", (e) => {

    // Uncomment if required

    // e.preventDefault();

});

/*=========================================
        IMAGE OPTIMIZATION
=========================================*/

document.querySelectorAll("img").forEach((img) => {

    img.decoding = "async";

    img.loading = "lazy";

});

/*=========================================
        MOBILE TOUCH OPTIMIZATION
=========================================*/

document.body.style.webkitTapHighlightColor = "transparent";

/*=========================================
        PERFORMANCE LOG
=========================================*/

window.addEventListener("load", () => {

    console.log(

        "%c4 FIRE UNITED Loaded Successfully",

        "color:#ff6a00;font-size:14px;font-weight:bold;"

    );

});

/*=========================================
        MOBILE PERFORMANCE
=========================================*/

window.addEventListener("pageshow", () => {

    revealOnScroll();
    startCounter();

});

/*=========================================
        SAFE LINKS
=========================================*/

document.querySelectorAll("a[target='_blank']").forEach((link) => {

    link.setAttribute(

        "rel",

        "noopener noreferrer"

    );

});

/*=========================================
        ESC KEY CLOSE MENU
=========================================*/

document.addEventListener("keydown", (e) => {

    if (

        e.key === "Escape" &&
        navLinks &&
        navLinks.classList.contains("active")

    ) {

        navLinks.classList.remove("active");

    }

});

/*=========================================
        AUTO CLOSE MENU
=========================================*/

document.addEventListener("click", (e) => {

    if (!menuBtn || !navLinks) return;

    if (

        !menuBtn.contains(e.target) &&
        !navLinks.contains(e.target)

    ) {

        navLinks.classList.remove("active");

    }

});

/*=========================================
        IMAGE FALLBACK
=========================================*/

document.querySelectorAll("img").forEach((img) => {

    img.onerror = function () {

        this.onerror = null;

if (location.pathname.includes("/players/")) {

    this.src = "../images/logo/logo.png";

} else {

    this.src = "images/logo/logo.png";

}

    };

});

/*=========================================
        CONSOLE BRANDING
=========================================*/

console.log(

`%c
██████╗  ███████╗██╗   ██╗
██╔══██╗ ██╔════╝██║   ██║
██████╔╝ █████╗  ██║   ██║
██╔══██╗ ██╔══╝  ██║   ██║
██║  ██║ ██║     ╚██████╔╝
╚═╝  ╚═╝ ╚═╝      ╚═════╝

4 FIRE UNITED
Forged In Fire • United In Victory
`,

"color:#ff6a00;font-weight:bold;"

);

/*=========================================
        END OF MAIN JS V2
=========================================*/