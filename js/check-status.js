document.getElementById("checkStatusBtn").addEventListener("click", () => {

    const uid = document.getElementById("checkUID").value.trim();
    const result = document.getElementById("statusResult");

    if (!uid) {
        alert("Please enter your Free Fire UID.");
        return;
    }

    result.style.display = "block";
    result.style.background = "#111";
    result.innerHTML = "<p>🔍 Checking application...</p>";

    db.collection("joinApplications")
        .where("uid", "==", uid)
        .get()
        .then((snapshot) => {

            if (snapshot.empty) {

                result.style.background = "#8B0000";

                result.innerHTML = `
                    <h2>❌ Application Not Found</h2>
                    <p>No application found with this UID.</p>
                `;

                return;
            }

            const app = snapshot.docs[0].data();

            let color = "#ffc107";
            let icon = "🟡";

            if (app.status === "Accepted") {
                color = "#28a745";
                icon = "🟢";
            }

            if (app.status === "Rejected") {
                color = "#dc3545";
                icon = "🔴";
            }

            let defaultMessage = "";

            if (app.status === "Accepted") {

                defaultMessage =
                    "🎉 Congratulations! Welcome to 4 FIRE UNITED.";

            } else if (app.status === "Rejected") {

                defaultMessage =
                    "Unfortunately your application was not selected.";

            } else {

                defaultMessage =
                    "Your application is currently under review.";
            }

            result.style.background = "#111";
            result.style.border = `2px solid ${color}`;
            result.style.color = "#fff";

            result.innerHTML = `

                <div style="text-align:center;">

                    <span style="
                        background:${color};
                        color:#fff;
                        padding:10px 25px;
                        border-radius:50px;
                        font-size:18px;
                        font-weight:bold;
                        display:inline-block;
                        margin-bottom:20px;
                    ">
                        ${icon} ${app.status}
                    </span>

                </div>

                <hr>

                <p><strong>👤 Full Name :</strong> ${app.name}</p>

                <p><strong>🎮 Game Name :</strong> ${app.ign}</p>

                <p><strong>🆔 UID :</strong> ${app.uid}</p>

                <p><strong>🏆 Rank :</strong> ${app.rank}</p>

                <p><strong>📅 Applied On :</strong> ${app.appliedOn}</p>

                ${app.status !== "Pending" ? `

                    <hr>

                    <h3 style="color:${color};">
                        💬 Message From Admin
                    </h3>

                    <p>
                        ${app.message || defaultMessage}
                    </p>

                ` : ""}

            `;

        })

        .catch((err) => {

    console.error("Firestore Error:", err);

    alert(err.message);

    result.style.display = "block";
    result.style.background = "#8B0000";

    result.innerHTML = `
        <h2>❌ Error</h2>
        <p>${err.message}</p>
    `;

});

});