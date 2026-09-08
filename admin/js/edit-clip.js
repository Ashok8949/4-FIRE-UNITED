// ==========================================================
// EDIT CLIP - 4 FIRE UNITED
// ==========================================================

const params = new URLSearchParams(window.location.search);
const clipId = params.get("id");


// ==========================================================
// CHECK CLIP ID
// ==========================================================

if (!clipId) {

    alert("Clip ID Missing!");

    window.location.href = "clips.html";

}


// ==========================================================
// FIRESTORE
// ==========================================================

const docRef = db.collection("clips").doc(clipId);


// ==========================================================
// ELEMENTS
// ==========================================================

const titleInput = document.getElementById("title");
const playerNameInput = document.getElementById("playerName");

const thumbnailInput = document.getElementById("thumbnail");

const clipTypeInput = document.getElementById("clipType");

const videoUrlInput = document.getElementById("videoUrl");

const videoFileInput = document.getElementById("videoFile");

const categoryInput = document.getElementById("category");

const descriptionInput = document.getElementById("description");

const featuredInput = document.getElementById("featured");

const updateButton = document.getElementById("updateClip");

const progress = document.getElementById("uploadProgress");

const status = document.getElementById("uploadStatus");


// ==========================================================
// CLOUDINARY
// ==========================================================

const CLOUDINARY_CLOUD_NAME = "vuto9fey";

const CLOUDINARY_UPLOAD_PRESET = "4fu_clips";


// ==========================================================
// FCM
// ==========================================================

const FCM_URL =
    "https://script.google.com/macros/s/AKfycbyazs42LLTr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec";


// ==========================================================
// CURRENT DATA
// ==========================================================

let currentThumbnail = "";

let currentVideoUrl = "";

let isUpdating = false;


// ==========================================================
// PROGRESS FUNCTIONS
// ==========================================================

function showProgress(text) {

    progress.style.display = "block";

    status.style.display = "block";

    status.innerText = text;

}


function setProgress(value, text) {

    progress.style.display = "block";

    status.style.display = "block";

    progress.value = value;

    status.innerText = text;

}


function resetProgress() {

    progress.style.display = "none";

    status.style.display = "none";

    progress.value = 0;

    status.innerText = "";

}


// ==========================================================
// CLOUDINARY UPLOAD
// ==========================================================

function uploadToCloudinary(file, resourceType = "image") {

    return new Promise((resolve, reject) => {

        if (!file) {

            reject("No file selected.");

            return;

        }


        const formData = new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "upload_preset",
            CLOUDINARY_UPLOAD_PRESET
        );


        const xhr = new XMLHttpRequest();


        const uploadURL =
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;


        xhr.open(
            "POST",
            uploadURL,
            true
        );


        // Large video upload timeout
        xhr.timeout = 900000;


        // ==================================================
        // UPLOAD PROGRESS
        // ==================================================

        xhr.upload.onprogress = (event) => {

            if (!event.lengthComputable) {
                return;
            }


            const percent =
                Math.round(
                    (event.loaded / event.total) * 100
                );


            if (resourceType === "video") {

                setProgress(
                    percent,
                    `Uploading New Video... ${percent}%`
                );

            }
            else {

                setProgress(
                    percent,
                    `Uploading New Thumbnail... ${percent}%`
                );

            }

        };


        // ==================================================
        // SUCCESS / ERROR
        // ==================================================

        xhr.onload = () => {

            let response = {};

            try {

                response =
                    JSON.parse(
                        xhr.responseText || "{}"
                    );

            }
            catch (error) {

                response = {};

            }


            if (
                xhr.status >= 200 &&
                xhr.status < 300
            ) {

                if (response.secure_url) {

                    resolve(response);

                }
                else {

                    reject(
                        "Cloudinary did not return a file URL."
                    );

                }

                return;

            }


            let errorMessage =
                "Cloudinary upload failed.";


            if (
                response.error &&
                response.error.message
            ) {

                errorMessage =
                    response.error.message;

            }


            reject(errorMessage);

        };


        xhr.onerror = () => {

            reject(
                "Network error while uploading."
            );

        };


        xhr.ontimeout = () => {

            reject(
                "Upload timed out. Please check your internet connection."
            );

        };


        xhr.onabort = () => {

            reject(
                "Upload cancelled."
            );

        };


        xhr.send(formData);

    });

}


// ==========================================================
// CLIP TYPE UI
// ==========================================================

function updateClipTypeUI() {

    const type =
        clipTypeInput.value;


    if (type === "video") {

        videoUrlInput.style.display =
            "none";

        videoFileInput.style.display =
            "block";

    }
    else {

        videoUrlInput.style.display =
            "block";

        videoFileInput.style.display =
            "none";

    }

}


clipTypeInput.addEventListener(
    "change",
    updateClipTypeUI
);


// ==========================================================
// LOAD CLIP
// ==========================================================

async function loadClip() {

    try {

        showProgress(
            "Loading Clip..."
        );


        const doc =
            await docRef.get();


        if (!doc.exists) {

            alert(
                "Clip Not Found!"
            );

            window.location.href =
                "clips.html";

            return;

        }


        const clip =
            doc.data();


        // ==================================================
        // BASIC DATA
        // ==================================================

        titleInput.value =
            clip.title || "";


        playerNameInput.value =
            clip.playerName || "";


        categoryInput.value =
            clip.category || "";


        descriptionInput.value =
            clip.description || "";


        featuredInput.checked =
            clip.featured === true;


        // ==================================================
        // CLIP TYPE
        // ==================================================

        clipTypeInput.value =
            clip.clipType || "youtube";


        // ==================================================
        // THUMBNAIL
        // ==================================================

        currentThumbnail =
            clip.thumbnail || "";


        // ==================================================
        // VIDEO
        // ==================================================

        currentVideoUrl =
            clip.videoUrl || "";


        if (
            clip.clipType === "video"
        ) {

            videoUrlInput.value =
                "";

        }
        else {

            videoUrlInput.value =
                clip.videoUrl || "";

        }


        updateClipTypeUI();


        resetProgress();

    }

    catch (error) {

        console.error(
            "Load Clip Error:",
            error
        );


        resetProgress();


        alert(
            "Unable to load clip."
        );

    }

}


// ==========================================================
// UPDATE CLIP
// ==========================================================

updateButton.addEventListener(
    "click",
    async () => {

        if (isUpdating) {
            return;
        }


        try {

            // ==============================================
            // GET VALUES
            // ==============================================

            const title =
                titleInput.value.trim();


            const playerName =
                playerNameInput.value.trim();


            const category =
                categoryInput.value.trim();


            const description =
                descriptionInput.value.trim();


            const clipType =
                clipTypeInput.value;


            const featured =
                featuredInput.checked;


            // ==============================================
            // VALIDATION
            // ==============================================

            if (!title) {

                alert(
                    "Enter Clip Title"
                );

                titleInput.focus();

                return;

            }


            if (!playerName) {

                alert(
                    "Enter Player Name"
                );

                playerNameInput.focus();

                return;

            }


            if (!category) {

                alert(
                    "Enter Category"
                );

                categoryInput.focus();

                return;

            }


            // ==============================================
            // URL VALIDATION
            // ==============================================

            if (
                clipType === "youtube"
            ) {

                const url =
                    videoUrlInput.value.trim();


                if (!url) {

                    alert(
                        "Enter YouTube URL"
                    );

                    videoUrlInput.focus();

                    return;

                }


                if (
                    !url.includes("youtube.com") &&
                    !url.includes("youtu.be")
                ) {

                    alert(
                        "Enter a valid YouTube URL"
                    );

                    videoUrlInput.focus();

                    return;

                }

            }


            if (
                clipType === "instagram"
            ) {

                const url =
                    videoUrlInput.value.trim();


                if (!url) {

                    alert(
                        "Enter Instagram Reel URL"
                    );

                    videoUrlInput.focus();

                    return;

                }


                if (
                    !url.includes("instagram.com")
                ) {

                    alert(
                        "Enter a valid Instagram URL"
                    );

                    videoUrlInput.focus();

                    return;

                }

            }


            // ==============================================
            // VIDEO TYPE
            // ==============================================

            if (
                clipType === "video" &&
                !currentVideoUrl &&
                !videoFileInput.files[0]
            ) {

                alert(
                    "Select a new video or keep the existing video."
                );

                return;

            }


            // ==============================================
            // START UPDATE
            // ==============================================

            isUpdating =
                true;


            updateButton.disabled =
                true;


            updateButton.innerHTML =
                "Updating...";


            // ==============================================
            // THUMBNAIL
            // ==============================================

            if (
                thumbnailInput.files.length > 0
            ) {

                showProgress(
                    "Uploading New Thumbnail..."
                );


                const thumbnailUpload =
                    await uploadToCloudinary(
                        thumbnailInput.files[0],
                        "image"
                    );


                currentThumbnail =
                    thumbnailUpload.secure_url;

            }


            // ==============================================
            // VIDEO
            // ==============================================

            let finalVideoUrl =
                currentVideoUrl;


            if (
                clipType === "video"
            ) {

                if (
                    videoFileInput.files.length > 0
                ) {

                    showProgress(
                        "Uploading New Video..."
                    );


                    const videoUpload =
                        await uploadToCloudinary(
                            videoFileInput.files[0],
                            "video"
                        );


                    finalVideoUrl =
                        videoUpload.secure_url;

                }

            }
            else {

                finalVideoUrl =
                    videoUrlInput.value.trim();

            }


            // ==============================================
            // FEATURED CLIP
            // ==============================================

            if (featured) {

                showProgress(
                    "Updating Featured Clip..."
                );


                const featuredSnapshot =
                    await db
                        .collection("clips")
                        .where(
                            "featured",
                            "==",
                            true
                        )
                        .get();


                const batch =
                    db.batch();


                featuredSnapshot.forEach(
                    (doc) => {

                        if (
                            doc.id !== clipId
                        ) {

                            batch.update(
                                doc.ref,
                                {
                                    featured: false
                                }
                            );

                        }

                    }
                );


                if (
                    !featuredSnapshot.empty
                ) {

                    await batch.commit();

                }

            }


            // ==============================================
            // FIRESTORE UPDATE
            // ==============================================

            showProgress(
                "Updating Clip..."
            );


            const updateData = {

                title:
                    title,

                playerName:
                    playerName,

                thumbnail:
                    currentThumbnail,

                videoUrl:
                    finalVideoUrl,

                clipType:
                    clipType,

                category:
                    category,

                description:
                    description,

                featured:
                    featured,

                updatedAt:
                    firebase
                        .firestore
                        .FieldValue
                        .serverTimestamp()

            };


            await docRef.update(
                updateData
            );


            // ==============================================
            // ANDROID FCM
            // ==============================================

            try {

                fetch(
                    FCM_URL,
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
                                    "clip",

                                priority:
                                    "normal",

                                title:
                                    "🎬 Clip Updated",

                                body:
                                    title +
                                    " gameplay clip has been updated.",

                                link:
                                    "/clips.html",

                                updateType:
                                    "clip",

                                targetPlayerId:
                                    "ALL",

                                senderEmail:
                                    firebase
                                        .auth()
                                        .currentUser
                                        ?.email ||
                                    "Admin"

                            })

                    }
                )
                .catch(
                    (error) => {

                        console.warn(
                            "4FU ANDROID FCM CLIP UPDATE ERROR:",
                            error
                        );

                    }
                );

            }
            catch (error) {

                console.warn(
                    "4FU ANDROID FCM CLIP UPDATE ERROR:",
                    error
                );

            }


            // ==============================================
            // SUCCESS
            // ==============================================

            setProgress(
                100,
                "Clip Updated Successfully!"
            );


            alert(
                "✅ Clip Updated Successfully!"
            );


            window.location.href =
                "clips.html";

        }

        catch (error) {

            console.error(
                "Update Clip Error:",
                error
            );


            resetProgress();


            alert(
                "❌ Update Failed!\n\n" +
                (
                    error.message ||
                    error
                )
            );


            updateButton.disabled =
                false;


            updateButton.innerHTML =
                "Update Clip";


            isUpdating =
                false;

        }

    }
);


// ==========================================================
// INITIAL LOAD
// ==========================================================

loadClip();