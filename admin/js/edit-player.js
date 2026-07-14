const params = new URLSearchParams(window.location.search);
const playerId = params.get("id");

if (!playerId) {

    alert("Player ID Missing!");
    window.location = "players.html";

}

const docRef = db.collection("players").doc(playerId);

const imageInput = document.getElementById("image");
const weaponImageInput = document.getElementById("weaponImage");
const previewImage = document.getElementById("previewImage");
const progress = document.getElementById("uploadProgress");
const status = document.getElementById("uploadStatus");

let imageUrl = "";
let weaponImageUrl = "";
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

// ==========================================
// LOAD PLAYER
// ==========================================

docRef.get().then((doc) => {

    if (!doc.exists) {

        alert("Player Not Found!");
        window.location = "players.html";
        return;

    }

    const p = doc.data();

    document.getElementById("name").value = p.name || "";
    document.getElementById("ign").value = p.ign || "";
    document.getElementById("uid").value = p.uid || "";
    document.getElementById("role").value = p.role || "";
    document.getElementById("level").value = p.level || "";
    document.getElementById("rank").value = p.rank || "";
    document.getElementById("kd").value = p.kd || "";
    document.getElementById("headshot").value = p.headshot || "";
    document.getElementById("matches").value = p.matches || 0;
    document.getElementById("booyah").value = p.booyah || 0;
    document.getElementById("guild").value = p.guild || "";
    document.getElementById("language").value = p.language || "";
    document.getElementById("country").value = p.country || "";

document.getElementById("since").value = p.since || "";
    document.getElementById("weaponName").value = p.weaponName || "";

document.getElementById("weaponType").value = p.weaponType || "";

document.getElementById("weaponQuote").value = p.weaponQuote || "";

document.getElementById("displayOrder").value =
    p.displayOrder || "";

    document.getElementById("featured").checked = p.featured || false;

    // ==========================
    // Social Media
    // ==========================

    document.getElementById("instagram").value = p.instagram || "";
    document.getElementById("youtube").value = p.youtube || "";
    document.getElementById("discord").value = p.discord || "";
    document.getElementById("facebook").value = p.facebook || "";

    // Preview Image

   if (p.image) {

    imageUrl = p.image;
    weaponImageUrl = p.weaponImage || "";

    previewImage.src = p.image;

}

})

.catch((err) => {

    console.error(err);

});

// ==========================================
// SAVE PLAYER
// ==========================================

document.getElementById("saveBtn").addEventListener("click", async () => {

    if (imageInput.files.length > 0) {

   showProgress("Uploading Player Image...");

    const upload = await uploadToCloudinary(
        imageInput.files[0]
    );

    imageUrl = upload.secure_url;

} else {

    showProgress("Updating Player...");

}

showProgress("Uploading Weapon Image...");

if (weaponImageInput.files.length > 0) {

    const upload = await uploadToCloudinary(
        weaponImageInput.files[0]
    );

    weaponImageUrl = upload.secure_url;

}

showProgress("Updating Player...");


    const data = {

        name: document.getElementById("name").value.trim(),
        ign: document.getElementById("ign").value.trim(),
        uid: document.getElementById("uid").value.trim(),
        role: document.getElementById("role").value.trim(),
        level: Number(document.getElementById("level").value),
        rank: document.getElementById("rank").value.trim(),
        kd: document.getElementById("kd").value.trim(),
        headshot: document.getElementById("headshot").value.trim(),
        matches: Number(document.getElementById("matches").value) || 0,
        booyah: Number(document.getElementById("booyah").value) || 0,
        weaponName: document.getElementById("weaponName").value.trim(),

weaponType: document.getElementById("weaponType").value.trim(),

weaponQuote: document.getElementById("weaponQuote").value.trim(),

weaponImage: weaponImageUrl,
        guild: document.getElementById("guild").value.trim(),
        language: document.getElementById("language").value.trim(),

        country: document.getElementById("country").value.trim(),

since: document.getElementById("since").value.trim(),
        displayOrder: Number(
    document.getElementById("displayOrder").value
) || 9999,
        featured: document.getElementById("featured").checked,

        // Social Media

        instagram: document.getElementById("instagram").value.trim(),
        youtube: document.getElementById("youtube").value.trim(),
        discord: document.getElementById("discord").value.trim(),
        facebook: document.getElementById("facebook").value.trim(),

        image: imageUrl,

      lastEdited: new Date()

    };

   
    

    docRef.update(data)

    .then(() => {
        setProgress(100,"Player Updated Successfully");

        alert("✅ Player Updated Successfully!");

        resetProgress();

        window.location = "players.html";

    })

    .catch((err) => {

        console.error(err);

        resetProgress();

        alert("Update Failed!");

    });

});


