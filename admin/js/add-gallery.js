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