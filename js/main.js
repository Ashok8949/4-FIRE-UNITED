/*=========================================
        4 FIRE UNITED - MAIN JS
=========================================*/

/*=============
    LOADER
=============*/

window.addEventListener("load", () => {

    const loader = document.querySelector(".loader");

    if (loader) {

        setTimeout(() => {

            loader.classList.add("hide");

            setTimeout(() => {
                loader.style.display = "none";
            }, 500);

        }, 1200);

    }

});

/*=============
 MOBILE MENU
=============*/

const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });

}

/*=============
SMOOTH SCROLL
=============*/

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        const target = document.querySelector(this.getAttribute("href"));

        if (!target) return;

        e.preventDefault();

        target.scrollIntoView({

            behavior: "smooth"

        });

    });

});

/*=============
SCROLL TO TOP
=============*/

const scrollBtn = document.getElementById("scrollTop");

if (scrollBtn) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 300) {

            scrollBtn.style.display = "flex";

        } else {

            scrollBtn.style.display = "none";

        }

    });

    scrollBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}



/*=============
NAVBAR EFFECT
=============*/

const navbar = document.querySelector(".navbar");

if (navbar) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 50) {

            navbar.style.background = "rgba(0,0,0,.92)";
            navbar.style.boxShadow = "0 10px 25px rgba(0,0,0,.35)";

        } else {

            navbar.style.background = "rgba(0,0,0,.35)";
            navbar.style.boxShadow = "none";

        }

    });

}

/*=============
ACTIVE NAV LINK
=============*/

const currentPage = location.pathname.split("/").pop();

document.querySelectorAll(".nav-links a").forEach(link => {

    const href = link.getAttribute("href");

    if (href === currentPage || (currentPage === "" && href === "index.html")) {

        link.classList.add("active");

    }

});

/*=============
CURRENT YEAR
=============*/

const year = document.getElementById("year");

if (year) {

    year.textContent = new Date().getFullYear();

}

/*=============
BUTTON CLICK
=============*/

document.querySelectorAll(".btn1,.btn2,.join-btn").forEach(btn => {

    btn.addEventListener("click", function () {

        this.style.transform = "scale(.96)";

        setTimeout(() => {

            this.style.transform = "";

        }, 120);

    });

});

/*=============
LAZY LOADING
=============*/

document.querySelectorAll("img").forEach(img => {

    img.loading = "lazy";

});

/*=============
SCROLL REVEAL
=============*/

const revealItems = document.querySelectorAll(

".about,.players,.hall,.gallery-preview,.stats-section,.join-team,.team-card,.player-profile,.player-banner,.tournament-card,.gallery-box"

);

function revealOnScroll() {

    revealItems.forEach(item => {

        const top = item.getBoundingClientRect().top;

        if (top < window.innerHeight - 100) {

            item.classList.add("show");

        }

    });

}

window.addEventListener("scroll", revealOnScroll);

revealOnScroll();

/*=============
COUNTER
=============*/

const counters = document.querySelectorAll(".stats-card h1");

let counted = false;

function startCounter() {

    const stats = document.querySelector(".stats-section");

    if (!stats || counted) return;

    const top = stats.getBoundingClientRect().top;

    if (top < window.innerHeight - 100) {

        counted = true;

        counters.forEach(counter => {

            const finalText = counter.innerText;

            const finalNumber = parseInt(finalText.replace(/\D/g, ""));

            const suffix = finalText.replace(/[0-9]/g, "");

            if (isNaN(finalNumber)) return;

            let value = 0;

            const timer = setInterval(() => {

                value++;

                counter.innerText = value + suffix;

                if (value >= finalNumber) {

                    counter.innerText = finalText;

                    clearInterval(timer);

                }

            }, 20);

        });

    }

}

window.addEventListener("scroll", startCounter);

/*=============
NAVBAR HIDE
=============*/

let lastScroll = 0;

window.addEventListener("scroll", () => {

    if (!navbar) return;

    const current = window.pageYOffset;

    if (current > lastScroll && current > 120) {

        navbar.style.transform = "translateY(-100%)";

    } else {

        navbar.style.transform = "translateY(0)";

    }

    lastScroll = current;

});

/*=============
DISABLE RIGHT CLICK
=============*/

document.addEventListener("contextmenu", e => {

    e.preventDefault();

});

/*=============
PRELOAD IMAGES
=============*/

window.addEventListener("load", () => {

    Array.from(document.images).forEach(image => {

        const img = new Image();

        img.src = image.src;

    });

});