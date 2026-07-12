const id = new URLSearchParams(window.location.search).get("id");

const ref = db.collection("clips").doc(id);

ref.get().then((doc) => {

    if (!doc.exists) {

        alert("Clip Not Found");

        window.location = "clips.html";

        return;

    }

    const clip = doc.data();

    document.getElementById("title").value = clip.title || "";
    document.getElementById("playerName").value = clip.playerName || "";
    document.getElementById("thumbnail").value = clip.thumbnail || "";
    document.getElementById("videoUrl").value = clip.videoUrl || "";
    document.getElementById("category").value = clip.category || "";
    document.getElementById("description").value = clip.description || "";

});

document.getElementById("updateClip").onclick = () => {

    ref.update({

        title: document.getElementById("title").value.trim(),
        playerName: document.getElementById("playerName").value.trim(),
        thumbnail: document.getElementById("thumbnail").value.trim(),
        videoUrl: document.getElementById("videoUrl").value.trim(),
        category: document.getElementById("category").value.trim(),
        description: document.getElementById("description").value.trim()

    })

    .then(() => {

        alert("✅ Clip Updated Successfully!");

        window.location = "clips.html";

    })

    .catch((err) => {

        alert(err.message);

    });

};