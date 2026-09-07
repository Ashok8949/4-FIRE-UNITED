// ===============================
// CONTACT FORM
// ===============================

document.getElementById("contactForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const messageText = document.getElementById("message").value.trim();

    // ===============================
    // VALIDATION
    // ===============================

    if (!name || !email || !subject || !messageText) {

        alert("Please fill all fields.");
        return;

    }

    // ===============================
    // EMAIL VALIDATION
    // ===============================

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        alert("Please enter a valid email address.");
        return;

    }

    // ===============================
    // BUTTON
    // ===============================

    const btn = document.getElementById("sendMessage");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';


    // ===============================
    // CONTACT MESSAGE
    // ===============================

    const contactMessage = {

        name: name,

        email: email,

        subject: subject,

        message: messageText,

        status: "New",

        createdAt: firebase.firestore.FieldValue.serverTimestamp(),

        date: new Date().toLocaleString()

    };


    try {

        // ===============================
        // SAVE MESSAGE
        // ===============================

        await db.collection("contactMessages")
            .add(contactMessage);


        // ===============================
        // CREATE NOTIFICATION
        // ===============================

        await db.collection("notifications").add({

            title: "New Contact Message",

            message: `${name} sent a new contact message`,

            type: "contact",

            link: "messages.html",

            isRead: false,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });


        // ===============================
        // SUCCESS
        // ===============================

        alert("✅ Message Sent Successfully!");

        document.getElementById("contactForm").reset();


    } catch (err) {

        console.error("Contact Form Error:", err);

        alert("❌ Failed to send message. Please try again.");

    }


    // ===============================
    // RESET BUTTON
    // ===============================

    btn.disabled = false;

    btn.innerHTML = "Send Message";

});