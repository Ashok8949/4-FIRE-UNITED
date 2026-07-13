const clipType = document.getElementById("clipType");
const videoFile = document.getElementById("videoFile");
const videoUrl = document.getElementById("videoUrl");

const saveBtn = document.getElementById("saveClip");

const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");

clipType.addEventListener("change", () => {

    if (clipType.value === "video") {

        videoFile.style.display = "block";
        videoUrl.style.display = "none";

    } else {

        videoFile.style.display = "none";
        videoUrl.style.display = "block";

    }

});

function resetProgress() {

    progress.style.display = "none";
    progress.value = 0;

    status.style.display = "none";
    status.innerText = "";

}

function showProgress(text) {

    progress.style.display = "block";

    status.style.display = "block";

    status.innerText = text;

}

function setProgress(value,text){

    progress.value=value;

    status.innerText=text;

}

function uploadToCloudinary(file,resourceType="image"){

    return new Promise((resolve,reject)=>{

        const formData=new FormData();

        formData.append("file",file);

        formData.append("upload_preset","4fu_clips");

        const xhr=new XMLHttpRequest();

        xhr.open(

            "POST",

            `https://api.cloudinary.com/v1_1/vuto9fey/${resourceType}/upload`

        );

        xhr.upload.onprogress=(e)=>{

            if(e.lengthComputable){

                const percent=Math.round(

                    (e.loaded/e.total)*100

                );

                progress.value=percent;

            }

        };

        xhr.onload=()=>{

            if(xhr.status===200){

                resolve(

                    JSON.parse(xhr.responseText)

                );

            }else{

                reject("Cloudinary Upload Failed");

            }

        };

        xhr.onerror=()=>{

            reject("Network Error");

        };

        xhr.send(formData);

    });

}

saveBtn.addEventListener("click", async () => {

    try {

        saveBtn.disabled = true;

        let thumbnail = "";

        let finalVideo = "";

        const title =
            document.getElementById("title").value.trim();

        const player =
            document.getElementById("playerName").value.trim();

        const category =
            document.getElementById("category").value.trim();

        const description =
            document.getElementById("description").value.trim();

            const featured =
    document.getElementById("featured").checked;

        if(title===""){

            alert("Enter Title");

            saveBtn.disabled=false;

            return;

        }

        if(player===""){

            alert("Enter Player Name");

            saveBtn.disabled=false;

            return;

        }

        if(category===""){

            alert("Enter Category");

            saveBtn.disabled=false;

            return;

        }

        if(clipType.value==="video"){

            const image=
            document.getElementById("thumbnail").files[0];

            const video=
            document.getElementById("videoFile").files[0];

            if(!image){

                alert("Select Thumbnail");

                saveBtn.disabled=false;

                return;

            }

            if(!video){

                alert("Select Video");

                saveBtn.disabled=false;

                return;

            }

            showProgress("Uploading Thumbnail...");

            setProgress(5,"Uploading Thumbnail...");

            const imgUpload =
                await uploadToCloudinary(
                    image,
                    "image"
                );

            thumbnail =
                imgUpload.secure_url;

            setProgress(10,"Thumbnail Uploaded");

            showProgress("Uploading Video...");

                        const videoUpload =
                await uploadToCloudinary(
                    video,
                    "video"
                );

            finalVideo =
                videoUpload.secure_url;

            setProgress(
                100,
                "Video Uploaded Successfully"
            );

        }

        else {

    finalVideo = videoUrl.value.trim();

    if (finalVideo === "") {

        alert("Enter URL");

        saveBtn.disabled = false;

        return;

    }

    if (
        clipType.value === "instagram" &&
        !finalVideo.includes("instagram.com/reel/")
    ) {

        alert("Enter a valid Instagram Reel URL");

        saveBtn.disabled = false;

        return;

    }

    if (
        clipType.value === "youtube" &&
        !(
            finalVideo.includes("youtube.com") ||
            finalVideo.includes("youtu.be")
        )
    ) {

        alert("Enter a valid YouTube URL");

        saveBtn.disabled = false;

        return;

    }

    thumbnail = "";

}
if (featured) {

    const oldFeatured = await db.collection("clips")
        .where("featured", "==", true)
        .get();

    const batch = db.batch();

    oldFeatured.forEach(doc => {

        batch.update(doc.ref, {

            featured: false

        });

    });

    await batch.commit();

}
            

        showProgress("Saving Clip...");

        await db.collection("clips").add({

            title:title,

            playerName:player,

            playerId:"",

            thumbnail:thumbnail,

            videoUrl:finalVideo,

            clipType:clipType.value,

            category:category,

            description:description,

            featured: featured,

            createdAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });

        setProgress(
            100,
            "Clip Saved Successfully"
        );

                alert("✅ Clip Added Successfully!");

        resetProgress();

        saveBtn.disabled = false;

        window.location.href = "clips.html";

    }

    catch(err){

        console.error(err);

        alert(err);

        resetProgress();

        saveBtn.disabled = false;

    }

});
clipType.dispatchEvent(new Event("change"));

document.getElementById("title").addEventListener("keypress",(e)=>{

    if(e.key==="Enter"){

        document.getElementById("playerName").focus();

    }

});

document.getElementById("playerName").addEventListener("keypress",(e)=>{

    if(e.key==="Enter"){

        document.getElementById("category").focus();

    }

});

document.getElementById("category").addEventListener("keypress",(e)=>{

    if(e.key==="Enter"){

        document.getElementById("description").focus();

    }

});

document.getElementById("description").addEventListener("keydown",(e)=>{

    if(e.ctrlKey && e.key==="Enter"){

        saveBtn.click();

    }

});

window.addEventListener("load", () => {

    resetProgress();

});

videoFile.addEventListener("change", () => {

    if (videoFile.files.length > 0) {

        const file = videoFile.files[0];

        const size = (file.size / 1024 / 1024).toFixed(2);

        status.style.display = "block";

        status.innerText =
            `Selected Video : ${file.name} (${size} MB)`;

    }

});

document.getElementById("thumbnail").addEventListener("change", () => {

    if (document.getElementById("thumbnail").files.length > 0) {

        status.style.display = "block";

        status.innerText = "Thumbnail Selected";

    }

});