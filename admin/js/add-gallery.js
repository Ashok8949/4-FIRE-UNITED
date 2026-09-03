document.getElementById("saveGallery").addEventListener("click", () => {

    const gallery = {

        title: document.getElementById("title").value.trim(),
        image: document.getElementById("image").value.trim(),
        createdAt: new Date()

    };

    if (!gallery.title || !gallery.image) {

        alert("Please fill all required fields.");
        return;

    }

    const btn = document.getElementById("saveGallery");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    db.collection("gallery")
    .add(gallery)

    .then(() => {

        db.collection("notifications").add({

            title: "New Gallery Image",

            message: "A new image was added to the gallery.",

            type: "gallery",

            link: "gallery.html",

            isRead: false,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

        // ==========================================
        // ANDROID APP FCM NOTIFICATION
        // ==========================================

        try {

            fetch(
                "https://script.google.com/macros/s/AKfycbyazs42LLtr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec",
                {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({

                        type: "gallery",

                        priority: "normal",

                        title: "📸 New Gallery Image",

                        body:
                            "A new image was added to the 4 FIRE UNITED gallery: " +
                            gallery.title,

                        link: "/gallery.html",

                        updateType: "gallery",

                        targetPlayerId: "ALL",

                        senderEmail:
                            firebase.auth().currentUser?.email || "Admin"

                    })
                }
            ).catch((error) => {

                console.warn(
                    "4FU ANDROID FCM GALLERY ERROR:",
                    error
                );

            });

        } catch (error) {

            console.warn(
                "4FU ANDROID FCM GALLERY ERROR:",
                error
            );

        }

        // ==========================================

        alert("✅ Gallery Image Added Successfully!");

        window.location.href = "gallery.html";

    })

    .catch((error) => {

        console.error(error);

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Image';

        alert("❌ Failed to save image.");

    });

});