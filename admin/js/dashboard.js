const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        auth.signOut().then(() => {

            window.location.href = "login.html";

        }).catch((error) => {

            console.error(error);

        });

    });

}

// ===============================
// Dashboard Counts
// ===============================

// Total Players
db.collection("players").get().then((snapshot) => {

    console.log("Players =", snapshot.size);

    document.getElementById("totalPlayers").textContent = snapshot.size;

}).catch((err)=>{

    console.error("Players Error:", err);

});


// Total Tournaments
db.collection("tournaments").get().then((snapshot) => {

    console.log("Tournaments =", snapshot.size);

    document.getElementById("totalTournaments").textContent = snapshot.size;

}).catch((err)=>{

    console.error("Tournament Error:", err);

});

// Total Gallery Images
db.collection("gallery").get().then((snapshot) => {

    document.getElementById("totalGallery").textContent = snapshot.size;

}).catch((err) => {

    console.error("Gallery Error:", err);

});

// Temporary Values

// Total Visitors
db.collection("stats").doc("visitors").get()
.then((doc) => {

    if (doc.exists) {
        document.getElementById("totalVisitors").textContent = doc.data().total;
    } else {
        document.getElementById("totalVisitors").textContent = "0";
    }

})
.catch((err) => {

    console.error("Visitors Error:", err);

});

// Protect Dashboard
//auth.onAuthStateChanged((user) => {
//
  //  if (!user) {
    //    window.location.href = "login.html";
   // }

//});