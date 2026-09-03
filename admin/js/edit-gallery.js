const params = new URLSearchParams(window.location.search);

const imageId = params.get("id");

if (!imageId) {

    alert("Image ID Missing!");

    window.location.href = "gallery.html";

}

const docRef = db.collection("gallery").doc(imageId);

// Load Image Data
docRef.get()
.then((doc)=>{

    if(!doc.exists){

        alert("Image Not Found!");

        window.location.href="gallery.html";

        return;

    }

    const g = doc.data();

    document.getElementById("title").value = g.title || "";
    document.getElementById("image").value = g.image || "";

    document.getElementById("preview").src = "../" + g.image;

});

// Live Preview
document.getElementById("image").addEventListener("input",()=>{

    document.getElementById("preview").src =
        "../" + document.getElementById("image").value;

});

// Update Image
document.getElementById("updateGallery").addEventListener("click",()=>{

    const updatedTitle =
        document.getElementById("title").value.trim();

    const updatedImage =
        document.getElementById("image").value.trim();

    if (!updatedTitle || !updatedImage) {

        alert("Please fill all required fields.");
        return;

    }

    docRef.update({

        title: updatedTitle,

        image: updatedImage

    })

    .then(()=>{

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

                        title: "🖼️ Gallery Updated",

                        body:
                            "Gallery image updated: " +
                            updatedTitle,

                        link: "/gallery.html",

                        updateType: "gallery",

                        targetPlayerId: "ALL",

                        senderEmail:
                            firebase.auth().currentUser?.email || "Admin"

                    })
                }
            ).catch((error) => {

                console.warn(
                    "4FU ANDROID FCM GALLERY UPDATE ERROR:",
                    error
                );

            });

        } catch (error) {

            console.warn(
                "4FU ANDROID FCM GALLERY UPDATE ERROR:",
                error
            );

        }

        // ==========================================

        alert("✅ Gallery Updated Successfully!");

        window.location.href="gallery.html";

    })

    .catch((err)=>{

        console.log(err);

        alert("Update Failed!");

    });

});