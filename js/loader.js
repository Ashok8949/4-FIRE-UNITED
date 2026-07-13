/*=========================================
      4 FIRE UNITED
      BULLET LOADER V2
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    const loader = document.getElementById("loader");

    if (!loader) return;

    loader.style.display = "flex";

    document.body.style.overflow = "hidden";

    /*==============================
        BULLETS FIRE
==============================*/

setTimeout(() => {

    loader.classList.add("loader-start");

},150);

/*==============================
        IMPACT
==============================*/

setTimeout(() => {

    loader.classList.add("loader-impact");

},1450);

/*==============================
        BULLETS REMOVE
==============================*/

const bullets=document.querySelectorAll(".bullet");

setTimeout(()=>{

bullets.forEach(b=>{

b.style.transition=".18s";

b.style.opacity="0";

b.style.transform+=" scale(.65)";

});

},900);

/*==============================
        LOGO
==============================*/

setTimeout(()=>{

loader.classList.add("loader-show");

},1700);

/*==============================
        EXIT
==============================*/

setTimeout(()=>{

loader.classList.add("loader-hide");

document.body.style.overflow="auto";

},4000);

/*==============================
        REMOVE
==============================*/

setTimeout(()=>{

loader.remove();

},4600);

});