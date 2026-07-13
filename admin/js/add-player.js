const imageInput = document.getElementById("image");
const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");
const previewImage = document.getElementById("previewImage");

let imageUrl = "../images/logo/logo.png";

function showProgress(text){

    progress.style.display = "block";

    status.style.display = "block";

    status.innerText = text;

}

function setProgress(value,text){

    progress.value = value;

    status.innerText = text;

}

function resetProgress(){

    progress.style.display = "none";

    progress.value = 0;

    status.style.display = "none";

    status.innerText = "";

}

function uploadToCloudinary(file){

    return new Promise((resolve,reject)=>{

        const formData = new FormData();

        formData.append("file", file);

        formData.append("upload_preset", "4fu_clips");

        const xhr = new XMLHttpRequest();

        xhr.open(
            "POST",
            "https://api.cloudinary.com/v1_1/vuto9fey/image/upload"
        );

        xhr.upload.onprogress = (e) => {

    if(e.lengthComputable){

        const percent = Math.round(

            (e.loaded / e.total) * 100

        );

        setProgress(

            percent,

            `Uploading Image... ${percent}%`

        );

    }

};

        xhr.onload = () => {

            if(xhr.status === 200){

                resolve(JSON.parse(xhr.responseText));

            }else{

                reject("Image Upload Failed");

            }

        };

        xhr.onerror = () => reject("Network Error");

        xhr.send(formData);

    });

}

imageInput.addEventListener("change", () => {

    if(imageInput.files.length === 0) return;

    previewImage.src =
        URL.createObjectURL(imageInput.files[0]);

});
document.getElementById("savePlayer").addEventListener("click", async () => {

   
    showProgress("Uploading Image...");
    if (imageInput.files.length > 0) {

    const upload = await uploadToCloudinary(

        imageInput.files[0]

    );

    imageUrl = upload.secure_url;

}

    const player = {

        name: document.getElementById("name").value.trim(),
        ign: document.getElementById("ign").value.trim(),
        uid: document.getElementById("uid").value.trim(),
        guild: document.getElementById("guild").value.trim(),
        role: document.getElementById("role").value.trim(),
        language: document.getElementById("language").value.trim(),

        displayOrder: Number(
    document.getElementById("displayOrder").value
) || 9999,

        level:Number(document.getElementById("level").value),
        rank:document.getElementById("rank").value.trim(),
        kd:document.getElementById("kd").value.trim(),
        headshot:document.getElementById("headshot").value.trim(),
        matches: Number(document.getElementById("matches").value) || 0,
        booyah: Number(document.getElementById("booyah").value) || 0,

        instagram:document.getElementById("instagram").value.trim(),
        youtube:document.getElementById("youtube").value.trim(),
        discord:document.getElementById("discord").value.trim(),
        facebook:document.getElementById("facebook").value.trim(),

       image: imageUrl,

     featured: document.getElementById("featured").checked,

        createdAt:new Date()

    };

    setProgress(100,"Image Uploaded Successfully");

showProgress("Saving Player...");

    await db.collection("players").add(player);
    await db.collection("notifications").add({

    title: "New Player Added",

    message: player.name,

    type: "player",

    link: "players.html",

    isRead: false,

    createdAt:
    firebase.firestore.FieldValue.serverTimestamp()

});

setProgress(100,"Player Saved Successfully");

    alert("Player Added");
    resetProgress();

    location.href="players.html";

});