/*=========================================
        4 FIRE UNITED LOADER V2
=========================================*/

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (!loader) return;

    document.body.style.overflow = "hidden";

    // Minimum smooth intro
    setTimeout(() => {

        loader.style.opacity = "0";
        loader.style.visibility = "hidden";

        document.body.style.overflow = "auto";

        setTimeout(() => {

            loader.remove();

        }, 450);

    }, 1600);

});