let allGallery = [];

db.collection("gallery")
.get()
.then((snapshot) => {

    allGallery = [];

    snapshot.forEach((doc) => {

        allGallery.push({
            id: doc.id,
            ...doc.data()
        });

    });

    renderGallery(allGallery);

})
.catch((error) => {

    console.error(error);

});

function renderGallery(list) {

    const gallery = document.getElementById("galleryGrid");

    gallery.innerHTML = "";

    list.forEach((g) => {

        gallery.innerHTML += `

        <div class="gallery-card">

            <img src="../${g.image}" alt="${g.title}">

            <div class="gallery-info">

                <h3>${g.title}</h3>

                <div class="gallery-buttons">

                    <a href="edit-gallery.html?id=${g.id}" class="edit-btn">

                        <i class="fa-solid fa-pen"></i> Edit

                    </a>

                    <button class="delete-btn"
                            onclick="deleteGallery('${g.id}')">

                        <i class="fa-solid fa-trash"></i> Delete

                    </button>

                </div>

            </div>

        </div>

        `;

    });

}

function deleteGallery(id) {

    if (!confirm("Delete this image?")) return;

    db.collection("gallery")
    .doc(id)
    .delete()

    .then(() => {

        alert("✅ Image Deleted Successfully!");

        location.reload();

    })

    .catch((err) => {

        console.error(err);

        alert("❌ Delete Failed!");

    });

}