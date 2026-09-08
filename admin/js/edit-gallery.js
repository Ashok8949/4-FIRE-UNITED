const params = new URLSearchParams(window.location.search);

const imageId = params.get("id");

if (!imageId) {

    alert("Image ID Missing!");

    window.location.href = "gallery.html";

}

const docRef = db.collection("gallery").doc(imageId);

const titleInput =
    document.getElementById("title");

const imageInput =
    document.getElementById("image");

const preview =
    document.getElementById("preview");

const updateButton =
    document.getElementById("updateGallery");

const fileNameBox =
    document.getElementById("galleryFileName");

const statusBox =
    document.getElementById("galleryStatus");

let currentImage = "";

let selectedImageFile = null;


/* =========================================================
   IMAGE URL FIX
   ========================================================= */

function getImageUrl(image) {

    if (!image) return "";

    image = String(image).trim();

    // Firebase / Cloudinary / any full URL
    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("data:")
    ) {

        return image;

    }

    // Root-relative path
    if (image.startsWith("/")) {

        return image;

    }

    // Local image path from admin page
    return "../" + image;

}


/* =========================================================
   LOAD IMAGE DATA
   ========================================================= */

docRef.get()

.then((doc) => {

    if (!doc.exists) {

        alert("Image Not Found!");

        window.location.href =
            "gallery.html";

        return;

    }

    const g = doc.data() || {};

    titleInput.value =
        g.title || "";

    currentImage =
        g.image || "";

    preview.src =
        getImageUrl(currentImage);

})

.catch((error) => {

    console.error(
        "Gallery Load Error:",
        error
    );

    alert(
        "Unable to load gallery image."
    );

});


/* =========================================================
   DIRECT IMAGE SELECT
   ========================================================= */

if (imageInput) {

    imageInput.addEventListener(
        "change",
        function () {

            const file =
                this.files &&
                this.files[0];

            selectedImageFile =
                file || null;

            if (!file) {

                fileNameBox.textContent =
                    "";

                return;

            }

            if (!file.type.startsWith("image/")) {

                this.value = "";

                selectedImageFile =
                    null;

                statusBox.textContent =
                    "❌ Please select a valid image.";

                return;

            }

            fileNameBox.textContent =
                "New image: " + file.name;

            statusBox.textContent =
                "";

            const reader =
                new FileReader();

            reader.onload =
                function (event) {

                    preview.src =
                        event.target.result;

                };

            reader.readAsDataURL(file);

        }
    );

}


/* =========================================================
   UPDATE GALLERY IMAGE
   ========================================================= */

updateButton.addEventListener(
    "click",
    async () => {

        const updatedTitle =
            titleInput.value.trim();

        if (!updatedTitle) {

            alert(
                "Please enter image title."
            );

            return;

        }

        const user =
            firebase.auth().currentUser;

        if (!user) {

            alert(
                "Admin login required."
            );

            return;

        }

        updateButton.disabled =
            true;

        updateButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';


        try {

            let updatedImage =
                currentImage;

            let newStoragePath =
                "";


            /* =================================================
               NEW IMAGE SELECTED
               ================================================= */

            if (selectedImageFile) {

                statusBox.textContent =
                    "Uploading new image... 0%";


                const safeName =
                    selectedImageFile.name
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            "_"
                        );


                newStoragePath =
                    "gallery/" +
                    Date.now() +
                    "_" +
                    safeName;


                const storageRef =
                    firebase.storage()
                        .ref(newStoragePath);


                const uploadTask =
                    storageRef.put(
                        selectedImageFile
                    );


                await new Promise(
                    (resolve, reject) => {

                        uploadTask.on(

                            "state_changed",

                            (snapshot) => {

                                const percent =
                                    Math.round(
                                        (
                                            snapshot.bytesTransferred /
                                            snapshot.totalBytes
                                        ) * 100
                                    );

                                statusBox.textContent =
                                    "Uploading new image... " +
                                    percent +
                                    "%";

                            },

                            (error) => {

                                reject(error);

                            },

                            () => {

                                resolve();

                            }

                        );

                    }
                );


                statusBox.textContent =
                    "Getting new image URL...";


                updatedImage =
                    await storageRef
                        .getDownloadURL();

            }


            /* =================================================
               UPDATE FIRESTORE
               ================================================= */

            statusBox.textContent =
                "Saving changes...";


            const updateData = {

                title:
                    updatedTitle,

                image:
                    updatedImage,

                updatedAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            };


            if (newStoragePath) {

                updateData.storagePath =
                    newStoragePath;

            }


            await docRef.update(
                updateData
            );


            /* =================================================
               ANDROID APP FCM NOTIFICATION
               ================================================= */

            try {

                fetch(
                    "https://script.google.com/macros/s/AKfycbyazs42LLTr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec",
                    {

                        method:
                            "POST",

                        mode:
                            "no-cors",

                        headers: {

                            "Content-Type":
                                "text/plain;charset=utf-8"

                        },

                        body:
                            JSON.stringify({

                                type:
                                    "gallery",

                                priority:
                                    "normal",

                                title:
                                    "🖼️ Gallery Updated",

                                body:
                                    "Gallery image updated: " +
                                    updatedTitle,

                                link:
                                    "/gallery.html",

                                updateType:
                                    "gallery",

                                targetPlayerId:
                                    "ALL",

                                senderEmail:
                                    firebase.auth()
                                        .currentUser?.email ||
                                    "Admin"

                            })

                    }
                )

                .catch((error) => {

                    console.warn(
                        "4FU ANDROID FCM GALLERY UPDATE ERROR:",
                        error
                    );

                });

            }

            catch (error) {

                console.warn(
                    "4FU ANDROID FCM GALLERY UPDATE ERROR:",
                    error
                );

            }


            /* =================================================
               SUCCESS
               ================================================= */

            statusBox.textContent =
                "🔥 Gallery updated successfully!";


            updateButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Updated Successfully';


            setTimeout(
                () => {

                    window.location.href =
                        "gallery.html";

                },
                1000
            );


        }

        catch (error) {

            console.error(
                "Gallery Update Error:",
                error
            );


            statusBox.textContent =
                "❌ Update failed: " +
                (
                    error.message ||
                    "Unknown error"
                );


            alert(
                "Update Failed!\n\n" +
                (
                    error.message ||
                    "Unknown error"
                )
            );


            updateButton.disabled =
                false;


            updateButton.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Update Image';

        }

    }
);