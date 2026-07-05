/*==========================
      FIRE PARTICLES
==========================*/

const hero = document.querySelector(".hero");

if(hero){

    for(let i=0;i<40;i++){

        const particle = document.createElement("span");

        particle.classList.add("particle");

        particle.style.left = Math.random()*100+"%";

        particle.style.animationDuration =
        (4+Math.random()*6)+"s";

        particle.style.animationDelay =
        Math.random()*5+"s";

        hero.appendChild(particle);

    }

}