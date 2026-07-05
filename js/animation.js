/*==========================
    SCROLL ANIMATION
==========================*/

const reveals = document.querySelectorAll(
".about, .players, .hall, .gallery-preview, .stats-section, .join-team, .team-card, .player-profile, .tournament-card, .gallery-box"
);

function revealOnScroll(){

    const trigger = window.innerHeight * 0.85;

    reveals.forEach(item=>{

        const top = item.getBoundingClientRect().top;

        if(top < trigger){

            item.classList.add("show");

        }

    });

}

window.addEventListener("scroll", revealOnScroll);

window.addEventListener("load", revealOnScroll);