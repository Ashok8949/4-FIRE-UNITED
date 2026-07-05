const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        sessionStorage.removeItem("adminLoggedIn");

        window.location.href = "login.html";

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

// Temporary Values
document.getElementById("totalGallery").textContent = "0";
document.getElementById("totalVisitors").textContent = "0";