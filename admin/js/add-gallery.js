document.getElementById("saveGallery").addEventListener("click", () => {

    const title = document.getElementById("title").value.trim();
    const image = document.getElementById("image").value.trim();

    if (title === "" || image === "") {

        alert("Please fill all fields.");
        return;

    }

    db.collection("gallery").add({

        title: title,
        image: image,
        createdAt: new Date()

    })

    .then(() => {

        alert("✅ Gallery Image Added Successfully!");

        window.location.href = "gallery.html";

    })

    .catch((error) => {

        console.error(error);

        alert("❌ Failed to save image.");

    });

});