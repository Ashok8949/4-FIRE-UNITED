// ===============================
// CONTACT FORM
// ===============================

document.getElementById("contactForm").addEventListener("submit", (e) => {

    e.preventDefault();

    const message = {

        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        message: document.getElementById("message").value.trim(),
        date: new Date().toLocaleDateString(),
        status: "New"

    };

    if (
        !message.name ||
        !message.email ||
        !message.subject ||
        !message.message
    ) {

        alert("Please fill all fields.");
        return;

    }

    const btn = document.getElementById("sendMessage");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    db.collection("contactMessages")
    .add(message)

    .then(() => {

        alert("✅ Message Sent Successfully!");

        document.getElementById("contactForm").reset();

        btn.disabled = false;

        btn.innerHTML = "Send Message";

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Failed to send message.");

        btn.disabled = false;

        btn.innerHTML = "Send Message";

    });

});