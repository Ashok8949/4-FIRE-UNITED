(() => {
    "use strict";

    const button = document.getElementById("checkStatusBtn");
    const uidInput = document.getElementById("checkUID");
    const emailInput = document.getElementById("checkEmail");
    const result = document.getElementById("statusResult");

    if (!button || !uidInput || !emailInput || !result) return;

    const endpoint = "https://asia-south1-fire-united.cloudfunctions.net/lookupJoinApplicationStatus";

    function showMessage(title, message, color = "#8B0000") {
        result.replaceChildren();
        result.style.display = "block";
        result.style.background = "#111";
        result.style.border = `2px solid ${color}`;

        const heading = document.createElement("h2");
        heading.textContent = title;
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        result.append(heading, paragraph);
    }

    function showApplication(app) {
        const colors = {
            Accepted: "#28a745",
            Rejected: "#dc3545",
            Pending: "#ffc107"
        };
        const color = colors[app.status] || colors.Pending;
        const icon = app.status === "Accepted" ? "🟢" :
            app.status === "Rejected" ? "🔴" : "🟡";

        result.replaceChildren();
        result.style.display = "block";
        result.style.background = "#111";
        result.style.border = `2px solid ${color}`;
        result.style.color = "#fff";

        const badge = document.createElement("h2");
        badge.textContent = `${icon} ${app.status}`;
        badge.style.color = color;
        result.appendChild(badge);

        const fields = [
            ["👤 Full Name", app.name],
            ["🎮 Game Name", app.ign],
            ["🆔 UID", app.uid],
            ["🏆 Rank", app.rank],
            ["📅 Applied On", app.appliedOn]
        ];

        fields.forEach(([label, value]) => {
            const row = document.createElement("p");
            const strong = document.createElement("strong");
            strong.textContent = `${label} : `;
            row.append(strong, document.createTextNode(value || "-"));
            result.appendChild(row);
        });

        if (app.status !== "Pending") {
            const heading = document.createElement("h3");
            heading.textContent = "💬 Message From Admin";
            heading.style.color = color;
            const message = document.createElement("p");
            message.textContent = app.message || (
                app.status === "Accepted"
                    ? "🎉 Congratulations! Welcome to 4 FIRE UNITED."
                    : "Unfortunately your application was not selected."
            );
            result.append(heading, message);
        } else {
            const message = document.createElement("p");
            message.textContent = "Your application is currently under review.";
            result.appendChild(message);
        }
    }

    button.addEventListener("click", async () => {
        const uid = uidInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();

        if (!/^\d{5,15}$/.test(uid)) {
            showMessage("Invalid UID", "Enter a valid 5–15 digit Free Fire UID.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            showMessage("Invalid email", "Enter the email address used in your application.");
            return;
        }

        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "Checking...";
        showMessage("🔍 Checking application", "Please wait...", "#ffc107");

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, email })
            });
            const data = await response.json().catch(() => ({}));

            if (response.status === 404 || (response.ok && data.found === false)) {
                showMessage("❌ Application Not Found", "No application matched that UID and email.");
                return;
            }
            if (!response.ok || data.success !== true || !data.application) {
                throw new Error(data.message || "Unable to check application status right now.");
            }
            showApplication(data.application);
        } catch (error) {
            console.error("Application status lookup failed:", error);
            showMessage("❌ Unable to Check Status", "Please try again later.");
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    });
})();