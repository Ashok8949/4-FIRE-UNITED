let allGallery = [];


// =========================================
// LOAD GALLERY
// =========================================

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

        console.error(
            "Error loading gallery:",
            error
        );


        const gallery =
            document.getElementById(
                "galleryGrid"
            );


        gallery.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>Failed to Load Gallery</h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>

        `;

    });


// =========================================
// RENDER GALLERY
// =========================================

function renderGallery(list){

    const gallery =
        document.getElementById(
            "galleryGrid"
        );


    const count =
        document.getElementById(
            "galleryCount"
        );


    gallery.innerHTML = "";


    // Count

    count.textContent =
        `${list.length} ${
            list.length === 1
                ? "Image"
                : "Images"
        }`;


    // Empty

    if(list.length === 0){

        gallery.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-images"></i>

                <h3>No Images Found</h3>

                <p>
                    Add an image to your 4 FIRE UNITED gallery.
                </p>

            </div>

        `;

        return;

    }


    // Cards

    list.forEach((g) => {


        let image =
            g.image || "";


        if(
            image &&
            !image.startsWith("http")
        ){

            image =
                "../" + image;

        }


        const title =
            escapeHtml(
                g.title || "Untitled"
            );


        gallery.innerHTML += `

            <div class="gallery-card">


                <div class="gallery-image-wrap">

                    <img

                        class="gallery-image"

                        src="${image}"

                        alt="${title}"

                        onerror="
                            this.src=
                            'https://via.placeholder.com/800x500.png?text=IMAGE+NOT+FOUND';
                        "

                    >

                </div>


                <div class="gallery-info">


                    <h3 title="${title}">

                        ${title}

                    </h3>


                    <div class="gallery-buttons">


                        <a

                            href="
                                edit-gallery.html?id=${encodeURIComponent(g.id)}
                            "

                            class="edit-btn"

                        >

                            <i class="fa-solid fa-pen"></i>

                            Edit

                        </a>


                        <button

                            class="delete-btn"

                            onclick="
                                deleteGallery('${g.id}')
                            "

                        >

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>


                    </div>


                </div>


            </div>

        `;

    });

}


// =========================================
// DELETE GALLERY
// =========================================

function deleteGallery(id){

    const galleryItem =
        allGallery.find(
            item =>
                item.id === id
        );


    const title =
        galleryItem?.title ||
        "this image";


    if(
        !confirm(
            `Delete ${title}?`
        )
    ){

        return;

    }


    db.collection("gallery")
        .doc(id)
        .delete()

        .then(() => {


            alert(
                "Image Deleted Successfully!"
            );


            allGallery =
                allGallery.filter(
                    item =>
                        item.id !== id
                );


            renderGallery(
                allGallery
            );


        })

        .catch((error) => {


            console.error(
                "Delete gallery error:",
                error
            );


            alert(
                "Delete Failed!\n\n" +
                error.message
            );

        });

}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value){

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}