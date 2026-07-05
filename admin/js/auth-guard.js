// Auth Guard
auth.onAuthStateChanged((user) => {

    if (!user) {
        window.location.replace("login.html");
    }

});