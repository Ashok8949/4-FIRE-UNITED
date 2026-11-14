// ===============================
// JOIN TEAM FORM
// ===============================

document.getElementById("joinForm").addEventListener("submit", (e) => {

    e.preventDefault();

    const application = {

        name: document.getElementById("name").value.trim(),
        ign: document.getElementById("ign").value.trim(),
        uid: document.getElementById("uid").value.trim(),
        email: document.getElementById("email").value.trim(),
        level: document.getElementById("level").value,
        rank: document.getElementById("rank").value,
        about: document.getElementById("about").value.trim(),

        status: "Pending",

        appliedOn: new Date().toLocaleDateString()

    };

    if (
    !application.name ||
    !application.ign ||
    !application.uid ||
    !application.email ||
    !application.level
) {
    alert("Please fill all required fields.");
    return;
}

    const btn = document.getElementById("applyBtn");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Applying...';

    db.collection("joinApplications")
    .add(application)

    .then(() => {

        alert("✅ Application Submitted Successfully!");

        document.getElementById("joinForm").reset();

        btn.disabled = false;

        btn.innerHTML = "Apply Now";

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Failed to submit application.");

        btn.disabled = false;

        btn.innerHTML = "Apply Now";

    });

});