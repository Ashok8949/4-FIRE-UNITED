const clipType = document.getElementById("clipType");
const videoFile = document.getElementById("videoFile");
const videoUrl = document.getElementById("videoUrl");

const saveBtn = document.getElementById("saveClip");

const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");


/* =========================================================
   CLIP TYPE CHANGE
========================================================= */

clipType.addEventListener("change", () => {

    if (clipType.value === "video") {

        videoFile.style.display = "block";
        videoUrl.style.display = "none";

    } else {

        videoFile.style.display = "none";
        videoUrl.style.display = "block";

    }

});


/* =========================================================
   RESET PROGRESS
========================================================= */

function resetProgress() {

    progress.style.display = "none";
    progress.value = 0;

    status.style.display = "none";
    status.innerText = "";

}


/* =========================================================
   SHOW PROGRESS
========================================================= */

function showProgress(text) {

    progress.style.display = "block";

    status.style.display = "block";

    status.innerText = text;

}


/* =========================================================
   SET PROGRESS
========================================================= */

function setProgress(value, text) {

    progress.style.display = "block";

    status.style.display = "block";

    progress.value = value;

    status.innerText = text;

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

            reject("No file selected.");

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
            "4fu_clips"
        );


        const xhr =
            new XMLHttpRequest();


        xhr.open(

            "POST",

            `https://api.cloudinary.com/v1_1/vuto9fey/${resourceType}/upload`,

            true

        );


        /* ==========================================
           3 MINUTE TIMEOUT
        ========================================== */

        xhr.timeout =
            180000;


        /* ==========================================
           UPLOAD PROGRESS
        ========================================== */

        xhr.upload.onprogress =
            (e) => {

                if (e.lengthComputable) {

                    const percent =
                        Math.round(
                            (
                                e.loaded /
                                e.total
                            ) * 100
                        );


                    progress.style.display =
                        "block";


                    status.style.display =
                        "block";


                    progress.value =
                        percent;


                    if (
                        resourceType === "image"
                    ) {

                        status.innerText =
                            `Uploading Thumbnail... ${percent}%`;

                    } else {

                        status.innerText =
                            `Uploading Video... ${percent}%`;

                    }

                }

            };


        /* ==========================================
           SUCCESS / ERROR RESPONSE
        ========================================== */

        xhr.onload =
            () => {

                console.log(
                    "Cloudinary Status:",
                    xhr.status
                );

                console.log(
                    "Cloudinary Response:",
                    xhr.responseText
                );


                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    try {

                        const response =
                            JSON.parse(
                                xhr.responseText
                            );


                        resolve(
                            response
                        );

                    }

                    catch (error) {

                        reject(
                            "Invalid Cloudinary response."
                        );

                    }

                }

                else {

                    let message =
                        "Cloudinary Upload Failed";


                    try {

                        const response =
                            JSON.parse(
                                xhr.responseText
                            );


                        if (
                            response.error &&
                            response.error.message
                        ) {

                            message =
                                response.error.message;

                        }

                    }

                    catch (error) {

                        // Ignore JSON parse error

                    }


                    reject(
                        message
                    );

                }

            };


        /* ==========================================
           NETWORK ERROR
        ========================================== */

        xhr.onerror =
            () => {

                reject(
                    "Cloudinary Network Error. Check your internet connection."
                );

            };


        /* ==========================================
           TIMEOUT
        ========================================== */

        xhr.ontimeout =
            () => {

                reject(
                    "Cloudinary upload timed out. Try a smaller file."
                );

            };


        /* ==========================================
           ABORT
        ========================================== */

        xhr.onabort =
            () => {

                reject(
                    "Cloudinary upload cancelled."
                );

            };


        /* ==========================================
           START UPLOAD
        ========================================== */

        xhr.send(
            formData
        );

    });

}


/* =========================================================
   SAVE CLIP
========================================================= */

saveBtn.addEventListener(
    "click",
    async () => {

        try {

            saveBtn.disabled =
                true;


            let thumbnail =
                "";

            let finalVideo =
                "";


            /* ==========================================
               BASIC INFORMATION
            ========================================== */

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


            /* ==========================================
               VALIDATION
            ========================================== */

            if (title === "") {

                alert(
                    "Enter Title"
                );

                saveBtn.disabled =
                    false;

                return;

            }


            if (player === "") {

                alert(
                    "Enter Player Name"
                );

                saveBtn.disabled =
                    false;

                return;

            }


            if (category === "") {

                alert(
                    "Enter Category"
                );

                saveBtn.disabled =
                    false;

                return;

            }


            /* ==========================================
               VIDEO CLIP
            ========================================== */

            if (
                clipType.value ===
                "video"
            ) {


                const image =
                    document
                        .getElementById(
                            "thumbnail"
                        )
                        .files[0];


                const video =
                    document
                        .getElementById(
                            "videoFile"
                        )
                        .files[0];


                /* ======================================
                   THUMBNAIL CHECK
                ====================================== */

                if (!image) {

                    alert(
                        "Select Thumbnail"
                    );

                    saveBtn.disabled =
                        false;

                    return;

                }


                /* ======================================
                   VIDEO CHECK
                ====================================== */

                if (!video) {

                    alert(
                        "Select Video"
                    );

                    saveBtn.disabled =
                        false;

                    return;

                }


                /* ======================================
                   THUMBNAIL UPLOAD
                ====================================== */

                showProgress(
                    "Preparing Thumbnail..."
                );


                setProgress(
                    1,
                    "Uploading Thumbnail... 0%"
                );


                const imgUpload =
                    await uploadToCloudinary(
                        image,
                        "image"
                    );


                if (
                    !imgUpload ||
                    !imgUpload.secure_url
                ) {

                    throw new Error(
                        "Thumbnail upload failed."
                    );

                }


                thumbnail =
                    imgUpload.secure_url;


                setProgress(
                    10,
                    "Thumbnail Uploaded Successfully"
                );


                /* ======================================
                   VIDEO UPLOAD
                ====================================== */

                showProgress(
                    "Uploading Video..."
                );


                const videoUpload =
                    await uploadToCloudinary(
                        video,
                        "video"
                    );


                if (
                    !videoUpload ||
                    !videoUpload.secure_url
                ) {

                    throw new Error(
                        "Video upload failed."
                    );

                }


                finalVideo =
                    videoUpload.secure_url;


                setProgress(
                    100,
                    "Video Uploaded Successfully"
                );

            }


            /* ==========================================
               INSTAGRAM / YOUTUBE
            ========================================== */

            else {

                finalVideo =
                    videoUrl.value
                        .trim();


                if (
                    finalVideo === ""
                ) {

                    alert(
                        "Enter URL"
                    );

                    saveBtn.disabled =
                        false;

                    return;

                }


                /* ======================================
                   INSTAGRAM VALIDATION
                ====================================== */

                if (

                    clipType.value ===
                    "instagram" &&

                    !finalVideo.includes(
                        "instagram.com/reel/"
                    )

                ) {

                    alert(
                        "Enter a valid Instagram Reel URL"
                    );

                    saveBtn.disabled =
                        false;

                    return;

                }


                /* ======================================
                   YOUTUBE VALIDATION
                ====================================== */

                if (

                    clipType.value ===
                    "youtube" &&

                    !(
                        finalVideo.includes(
                            "youtube.com"
                        ) ||

                        finalVideo.includes(
                            "youtu.be"
                        )
                    )

                ) {

                    alert(
                        "Enter a valid YouTube URL"
                    );

                    saveBtn.disabled =
                        false;

                    return;

                }


                thumbnail =
                    "";

            }


            /* ==========================================
               FEATURED CLIP
            ========================================== */

            if (featured) {

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
                    (doc) => {

                        batch.update(
                            doc.ref,
                            {
                                featured:
                                    false
                            }
                        );

                    }
                );


                await batch.commit();

            }


            /* ==========================================
               SAVE CLIP TO FIRESTORE
            ========================================== */

            showProgress(
                "Saving Clip..."
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
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });


            setProgress(
                100,
                "Clip Saved Successfully"
            );


            /* ==========================================
               ANDROID APP FCM NOTIFICATION
            ========================================== */

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
                                    firebase.auth()
                                        .currentUser
                                        ?.email ||
                                    "Admin"

                            })

                    }

                )

                .catch(
                    (error) => {

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


            /* ==========================================
               SUCCESS
            ========================================== */

            alert(
                "✅ Clip Added Successfully!"
            );


            resetProgress();


            saveBtn.disabled =
                false;


            window.location.href =
                "clips.html";


        }

        catch (err) {

            console.error(
                "Clip Upload Error:",
                err
            );


            alert(
                err.message ||
                err
            );


            resetProgress();


            saveBtn.disabled =
                false;

        }

    }
);


/* =========================================================
   INITIAL CLIP TYPE
========================================================= */

clipType.dispatchEvent(
    new Event("change")
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
                e.key ===
                "Enter"
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
                e.key ===
                "Enter"
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
                e.key ===
                "Enter"
            ) {

                document
                    .getElementById(
                        "description"
                    )
                    .focus();

            }

        }
    );


/* =========================================================
   CTRL + ENTER
========================================================= */

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


/* =========================================================
   PAGE LOAD
========================================================= */

window.addEventListener(
    "load",
    () => {

        resetProgress();

    }
);


/* =========================================================
   VIDEO FILE SELECTED
========================================================= */

videoFile.addEventListener(
    "change",
    () => {

        if (
            videoFile.files.length > 0
        ) {

            const file =
                videoFile.files[0];


            const size =
                (
                    file.size /
                    1024 /
                    1024
                ).toFixed(2);


            status.style.display =
                "block";


            status.innerText =
                `Selected Video : ${file.name} (${size} MB)`;

        }

    }
);


/* =========================================================
   THUMBNAIL SELECTED
========================================================= */

document
    .getElementById("thumbnail")
    .addEventListener(
        "change",
        () => {

            const thumbnail =
                document
                    .getElementById(
                        "thumbnail"
                    );


            if (
                thumbnail.files.length > 0
            ) {

                const file =
                    thumbnail.files[0];


                const size =
                    (
                        file.size /
                        1024 /
                        1024
                    ).toFixed(2);


                status.style.display =
                    "block";


                status.innerText =
                    `Thumbnail Selected : ${file.name} (${size} MB)`;

            }

        }
    );