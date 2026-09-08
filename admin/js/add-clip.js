const clipType = document.getElementById("clipType");
const thumbnailInput = document.getElementById("thumbnail");
const videoFile = document.getElementById("videoFile");
const videoUrl = document.getElementById("videoUrl");

const saveBtn = document.getElementById("saveClip");
const cancelBtn = document.getElementById("cancelClip");

const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");
const progressWrap = document.getElementById("progressWrap");
const progressTitle = document.getElementById("progressTitle");
const progressPercent = document.getElementById("progressPercent");

const thumbnailZone = document.getElementById("thumbnailZone");
const videoZone = document.getElementById("videoZone");
const thumbnailName = document.getElementById("thumbnailName");
const videoName = document.getElementById("videoName");
const urlGroup = document.getElementById("urlGroup");
const thumbnailGroup = document.getElementById("thumbnailGroup");
const videoGroup = document.getElementById("videoGroup");

const FCM_URL =
    "https://script.google.com/macros/s/AKfycbyazs42LLTr5ulUJDf1y2EuDRzUKrHwD_B1DzFE1q1BipaBooQMPit6T5dKJeAfMy4_/exec";

const CLOUDINARY_CLOUD_NAME = "vuto9fey";
const CLOUDINARY_UPLOAD_PRESET = "4fu_clips";

let uploadInProgress = false;


/* =========================================================
   CLIP TYPE
========================================================= */

clipType.addEventListener("change", () => {

    const isVideo = clipType.value === "video";

    thumbnailGroup.style.display = isVideo ? "flex" : "none";
    videoGroup.style.display = isVideo ? "flex" : "none";
    urlGroup.style.display = isVideo ? "none" : "flex";

    if (!isVideo) {

        thumbnailInput.value = "";
        videoFile.value = "";

        thumbnailName.textContent = "";
        videoName.textContent = "";

        thumbnailZone.classList.remove("selected");
        videoZone.classList.remove("selected");

    }

});


/* =========================================================
   PROGRESS
========================================================= */

function resetProgress() {

    progressWrap.style.display = "none";

    progress.value = 0;

    progressPercent.textContent = "0%";

    progressTitle.textContent = "Preparing upload...";

    status.textContent = "";

}


function showProgress(title, value = 0) {

    progressWrap.style.display = "block";

    progress.value = value;

    progressPercent.textContent =
        value + "%";

    progressTitle.textContent =
        title;

    status.textContent =
        title;

}


function setProgress(value, text) {

    const safeValue =
        Math.max(
            0,
            Math.min(
                100,
                Number(value) || 0
            )
        );

    progress.value =
        safeValue;

    progressPercent.textContent =
        Math.round(safeValue) + "%";

    progressTitle.textContent =
        text;

    status.textContent =
        text;

}


/* =========================================================
   CLOUDINARY UPLOAD
========================================================= */

function uploadToCloudinary(
    file,
    resourceType = "image"
) {

    return new Promise((resolve, reject) => {

        if (!file) {

            reject(
                "No file selected."
            );

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "upload_preset",
            CLOUDINARY_UPLOAD_PRESET
        );


        const xhr =
            new XMLHttpRequest();


        const uploadUrl =
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;


        xhr.open(
            "POST",
            uploadUrl,
            true
        );


        /*
         * Large video uploads can take time.
         */

        xhr.timeout =
            900000;


        xhr.upload.onprogress =
            (event) => {

                if (!event.lengthComputable) {
                    return;
                }


                const percent =
                    Math.round(
                        (
                            event.loaded /
                            event.total
                        ) * 100
                    );


                setProgress(
                    percent,
                    resourceType === "image"
                        ? "Uploading thumbnail..."
                        : "Uploading video..."
                );

            };


        xhr.onload =
            () => {

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

                    if (
                        response.secure_url
                    ) {

                        resolve(
                            response
                        );

                        return;

                    }


                    reject(
                        "Cloudinary did not return a file URL."
                    );

                    return;

                }


                let message =
                    "Cloudinary upload failed.";


                if (
                    response.error &&
                    response.error.message
                ) {

                    message =
                        response.error.message;

                }


                reject(
                    message
                );

            };


        xhr.onerror =
            () => {

                reject(
                    "Network error while uploading to Cloudinary."
                );

            };


        xhr.ontimeout =
            () => {

                reject(
                    "Upload timed out. Please check your internet connection and try again."
                );

            };


        xhr.onabort =
            () => {

                reject(
                    "Upload cancelled."
                );

            };


        xhr.send(
            formData
        );

    });

}


/* =========================================================
   THUMBNAIL FILE SELECT
========================================================= */

thumbnailInput.addEventListener(
    "change",
    () => {

        const file =
            thumbnailInput.files[0];


        if (!file) {

            thumbnailName.textContent =
                "";

            thumbnailZone.classList.remove(
                "selected"
            );

            return;

        }


        thumbnailName.textContent =
            `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;


        thumbnailZone.classList.add(
            "selected"
        );

    }
);


/* =========================================================
   VIDEO FILE SELECT
========================================================= */

videoFile.addEventListener(
    "change",
    () => {

        const file =
            videoFile.files[0];


        if (!file) {

            videoName.textContent =
                "";

            videoZone.classList.remove(
                "selected"
            );

            return;

        }


        videoName.textContent =
            `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;


        videoZone.classList.add(
            "selected"
        );

    }
);


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    document.getElementById(
        "title"
    ).value = "";


    document.getElementById(
        "playerName"
    ).value = "";


    document.getElementById(
        "category"
    ).value = "";


    document.getElementById(
        "description"
    ).value = "";


    thumbnailInput.value =
        "";


    videoFile.value =
        "";


    videoUrl.value =
        "";


    document.getElementById(
        "featured"
    ).checked = false;


    thumbnailName.textContent =
        "";


    videoName.textContent =
        "";


    thumbnailZone.classList.remove(
        "selected"
    );


    videoZone.classList.remove(
        "selected"
    );


    clipType.value =
        "video";


    clipType.dispatchEvent(
        new Event("change")
    );

}


/* =========================================================
   CANCEL
========================================================= */

cancelBtn.addEventListener(
    "click",
    () => {

        if (uploadInProgress) {
            return;
        }


        window.location.href =
            "clips.html";

    }
);


/* =========================================================
   SAVE CLIP
========================================================= */

saveBtn.addEventListener(
    "click",
    async () => {

        if (uploadInProgress) {
            return;
        }


        const title =
            document
                .getElementById("title")
                .value
                .trim();


        const player =
            document
                .getElementById("playerName")
                .value
                .trim();


        const category =
            document
                .getElementById("category")
                .value
                .trim();


        const description =
            document
                .getElementById("description")
                .value
                .trim();


        const featured =
            document
                .getElementById("featured")
                .checked;


        /* =================================================
           VALIDATION
        ================================================= */

        if (!title) {

            alert(
                "Enter Title"
            );

            document
                .getElementById("title")
                .focus();

            return;

        }


        if (!player) {

            alert(
                "Enter Player Name"
            );

            document
                .getElementById("playerName")
                .focus();

            return;

        }


        if (!category) {

            alert(
                "Enter Category"
            );

            document
                .getElementById("category")
                .focus();

            return;

        }


        if (
            clipType.value === "video"
        ) {

            if (
                !thumbnailInput.files[0]
            ) {

                alert(
                    "Select Thumbnail"
                );

                return;

            }


            if (
                !videoFile.files[0]
            ) {

                alert(
                    "Select Video"
                );

                return;

            }

        }
        else {

            const url =
                videoUrl.value.trim();


            if (!url) {

                alert(
                    "Enter URL"
                );

                videoUrl.focus();

                return;

            }


            if (
                clipType.value === "instagram" &&
                !(
                    url.includes(
                        "instagram.com/reel/"
                    ) ||
                    url.includes(
                        "instagram.com/p/"
                    )
                )
            ) {

                alert(
                    "Enter a valid Instagram Reel URL"
                );

                videoUrl.focus();

                return;

            }


            if (
                clipType.value === "youtube" &&
                !(
                    url.includes(
                        "youtube.com"
                    ) ||
                    url.includes(
                        "youtu.be"
                    )
                )
            ) {

                alert(
                    "Enter a valid YouTube URL"
                );

                videoUrl.focus();

                return;

            }

        }


        /* =================================================
           AUTH
        ================================================= */

        const user =
            firebase
                .auth()
                .currentUser;


        if (!user) {

            alert(
                "Admin login required."
            );

            return;

        }


        /* =================================================
           START
        ================================================= */

        uploadInProgress =
            true;


        saveBtn.disabled =
            true;


        cancelBtn.disabled =
            true;


        saveBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';


        try {

            let thumbnail =
                "";

            let finalVideo =
                "";


            /* =================================================
               VIDEO UPLOAD
            ================================================= */

            if (
                clipType.value === "video"
            ) {

                const image =
                    thumbnailInput.files[0];


                const video =
                    videoFile.files[0];


                /* Thumbnail */

                showProgress(
                    "Uploading thumbnail...",
                    0
                );


                const imgUpload =
                    await uploadToCloudinary(
                        image,
                        "image"
                    );


                thumbnail =
                    imgUpload.secure_url;


                setProgress(
                    100,
                    "Thumbnail uploaded successfully."
                );


                /* Video */

                showProgress(
                    "Preparing video upload...",
                    0
                );


                const videoUpload =
                    await uploadToCloudinary(
                        video,
                        "video"
                    );


                finalVideo =
                    videoUpload.secure_url;


                setProgress(
                    100,
                    "Video uploaded successfully."
                );

            }


            /* =================================================
               URL CLIP
            ================================================= */

            else {

                finalVideo =
                    videoUrl.value.trim();


                thumbnail =
                    "";

            }


            /* =================================================
               FEATURED CLIP
            ================================================= */

            if (featured) {

                showProgress(
                    "Updating featured clip...",
                    100
                );


                const oldFeatured =
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


                oldFeatured.forEach(
                    doc => {

                        batch.update(
                            doc.ref,
                            {
                                featured:
                                    false
                            }
                        );

                    }
                );


                if (!oldFeatured.empty) {

                    await batch.commit();

                }

            }


            /* =================================================
               FIRESTORE
            ================================================= */

            showProgress(
                "Saving clip...",
                100
            );


            await db
                .collection("clips")
                .add({

                    title:
                        title,

                    playerName:
                        player,

                    playerId:
                        "",

                    thumbnail:
                        thumbnail,

                    videoUrl:
                        finalVideo,

                    clipType:
                        clipType.value,

                    category:
                        category,

                    description:
                        description,

                    featured:
                        featured,

                    createdAt:
                        firebase
                            .firestore
                            .FieldValue
                            .serverTimestamp()

                });


            /* =================================================
               ANDROID FCM
            ================================================= */

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
                                    "🎬 New Clip Added",

                                body:
                                    player +
                                    " added a new gameplay clip: " +
                                    title,

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
                    error => {

                        console.warn(
                            "4FU ANDROID FCM CLIP ERROR:",
                            error
                        );

                    }
                );

            }
            catch (error) {

                console.warn(
                    "4FU ANDROID FCM CLIP ERROR:",
                    error
                );

            }


            /* =================================================
               SUCCESS
            ================================================= */

            setProgress(
                100,
                "Clip saved successfully!"
            );


            alert(
                "✅ Clip Added Successfully!"
            );


            resetForm();

            resetProgress();


            window.location.href =
                "clips.html";

        }


        catch (error) {

            console.error(
                "Add Clip Error:",
                error
            );


            const message =
                error &&
                error.message
                    ? error.message
                    : String(error);


            status.textContent =
                "❌ " + message;


            progressWrap.style.display =
                "block";


            alert(
                "❌ Clip upload failed:\n\n" +
                message
            );


            saveBtn.disabled =
                false;


            cancelBtn.disabled =
                false;


            saveBtn.innerHTML =
                '<i class="fa-solid fa-cloud-arrow-up"></i> Upload & Save Clip';

        }


        finally {

            uploadInProgress =
                false;

        }

    }
);


/* =========================================================
   ENTER KEY NAVIGATION
========================================================= */

document
    .getElementById("title")
    .addEventListener(
        "keypress",
        (e) => {

            if (
                e.key === "Enter"
            ) {

                document
                    .getElementById(
                        "playerName"
                    )
                    .focus();

            }

        }
    );


document
    .getElementById("playerName")
    .addEventListener(
        "keypress",
        (e) => {

            if (
                e.key === "Enter"
            ) {

                document
                    .getElementById(
                        "category"
                    )
                    .focus();

            }

        }
    );


document
    .getElementById("category")
    .addEventListener(
        "keypress",
        (e) => {

            if (
                e.key === "Enter"
            ) {

                document
                    .getElementById(
                        "description"
                    )
                    .focus();

            }

        }
    );


/* =================================================
   CTRL + ENTER
================================================= */

document
    .getElementById("description")
    .addEventListener(
        "keydown",
        (e) => {

            if (
                e.ctrlKey &&
                e.key === "Enter"
            ) {

                saveBtn.click();

            }

        }
    );


/* =================================================
   INITIALIZE
================================================= */

clipType.dispatchEvent(
    new Event("change")
);

resetProgress();