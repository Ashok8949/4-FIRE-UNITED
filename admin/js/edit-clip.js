const id = new URLSearchParams(window.location.search).get("id");

const ref = db.collection("clips").doc(id);

const clipType = document.getElementById("clipType");
const videoFile = document.getElementById("videoFile");
const videoUrl = document.getElementById("videoUrl");

const titleInput = document.getElementById("title");
const playerInput = document.getElementById("playerName");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const thumbnailInput = document.getElementById("thumbnail");

const updateBtn = document.getElementById("updateClip");

const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");

let oldThumbnail = "";
let oldVideo = "";
let oldFeatured = false;

clipType.addEventListener("change", () => {

    if (clipType.value === "video") {

        videoFile.style.display = "block";
        videoUrl.style.display = "none";

    } else {

        videoFile.style.display = "none";
        videoUrl.style.display = "block";

    }

});

function showProgress(text){

    if(progress){

        progress.style.display="block";

    }

    if(status){

        status.style.display="block";

        status.innerText=text;

    }

}

function setProgress(value,text){

    if(progress){

        progress.value=value;

    }

    if(status){

        status.innerText=text;

    }

}

function resetProgress(){

    if(progress){

        progress.style.display="none";

        progress.value=0;

    }

    if(status){

        status.style.display="none";

    }

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

            if(e.lengthComputable && progress){

                progress.value=Math.round((e.loaded/e.total)*100);

            }

        };

        xhr.onload=()=>{

            if(xhr.status===200){

                resolve(JSON.parse(xhr.responseText));

            }else{

                reject("Cloudinary Upload Failed");

            }

        };

        xhr.onerror=()=>reject("Upload Failed");

        xhr.send(formData);

    });

}

ref.get().then((doc) => {

    if (!doc.exists) {

        alert("Clip Not Found");

        window.location.href = "clips.html";

        return;

    }

    const clip = doc.data();

    oldThumbnail = clip.thumbnail || "";

    oldFeatured = clip.featured || false;

document.getElementById("featured").checked = oldFeatured;

    oldVideo = clip.videoUrl || "";

    titleInput.value = clip.title || "";

    playerInput.value = clip.playerName || "";

    categoryInput.value = clip.category || "";

    descriptionInput.value = clip.description || "";

    clipType.value = clip.clipType || "youtube";

    clipType.dispatchEvent(new Event("change"));

    if (clip.clipType === "video") {

        videoUrl.value = "";

    } else {

        videoUrl.value = oldVideo;

    }

}).catch((err)=>{

    console.error(err);

    alert("Failed to load clip.");

});

updateBtn.addEventListener("click", async () => {

    try {

        updateBtn.disabled = true;

        let thumbnail = oldThumbnail;

        let finalVideo = oldVideo;
        const featured =
    document.getElementById("featured").checked;

        /* ---------- Thumbnail ---------- */

        if (thumbnailInput.files.length > 0) {

            showProgress("Uploading Thumbnail...");

            const img = await uploadToCloudinary(

                thumbnailInput.files[0],

                "image"

            );

            thumbnail = img.secure_url;

        }

        /* ---------- Video ---------- */

        if (clipType.value === "video") {

            if (videoFile.files.length > 0) {

                showProgress("Uploading Video...");

                const vid = await uploadToCloudinary(

                    videoFile.files[0],

                    "video"

                );

                finalVideo = vid.secure_url;

            }

        } else {

            finalVideo = videoUrl.value.trim();

            if (!finalVideo) {

                alert("Enter Video URL");

                updateBtn.disabled = false;

                return;

            }

            if (

                clipType.value === "instagram" &&

                !finalVideo.includes("instagram.com")

            ) {

                alert("Invalid Instagram Reel URL");

                updateBtn.disabled = false;

                return;

            }

            if (

                clipType.value === "youtube" &&

                !(

                    finalVideo.includes("youtube.com") ||

                    finalVideo.includes("youtu.be")

                )

            ) {

                alert("Invalid YouTube URL");

                updateBtn.disabled = false;

                return;

            }

        }

        if (featured) {

    const oldFeaturedDocs = await db.collection("clips")
        .where("featured", "==", true)
        .get();

    const batch = db.batch();

    oldFeaturedDocs.forEach(doc => {

        batch.update(doc.ref, {

            featured: false

        });

    });

    await batch.commit();

}

        showProgress("Updating Clip...");

        await ref.update({

            title: titleInput.value.trim(),

            playerName: playerInput.value.trim(),

            thumbnail: thumbnail,

            videoUrl: finalVideo,

            clipType: clipType.value,

            category: categoryInput.value.trim(),

            description: descriptionInput.value.trim(),
            featured: featured

        });

        setProgress(100,"Clip Updated Successfully");

        alert("✅ Clip Updated Successfully!");

        window.location.href = "clips.html";

    }

    catch(err){

        console.error(err);

        alert(err);

        resetProgress();

        updateBtn.disabled = false;

    }

});