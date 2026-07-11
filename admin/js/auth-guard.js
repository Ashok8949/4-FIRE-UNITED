auth.onAuthStateChanged((user) => {

    if (user) {

        document.body.style.visibility = "visible";

    } else {

        window.location.replace("login.html");

    }

});