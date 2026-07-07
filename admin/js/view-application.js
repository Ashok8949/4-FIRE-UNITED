const params = new URLSearchParams(window.location.search);

const id = params.get("id");

if (!id) {

    alert("Application not found.");

    window.location.href = "applications.html";

}

const docRef = db.collection("joinApplications").doc(id);

docRef.get()

.then((doc) => {

    if (!doc.exists) {

        alert("Application not found.");

        window.location.href = "applications.html";

        return;

    }

    const a = doc.data();

    document.getElementById("name").textContent = a.name;
    document.getElementById("ign").textContent = a.ign;
    document.getElementById("uid").textContent = a.uid;
    document.getElementById("level").textContent = a.level;
    document.getElementById("rank").textContent = a.rank;
    document.getElementById("status").textContent = a.status;
    document.getElementById("date").textContent = a.appliedOn;
    document.getElementById("about").textContent = a.about || "-";

})

.catch((err) => {

    console.error(err);

});