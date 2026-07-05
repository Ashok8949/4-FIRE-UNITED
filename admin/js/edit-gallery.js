const params = new URLSearchParams(window.location.search);

const imageId = params.get("id");

if (!imageId) {

    alert("Image ID Missing!");

    window.location.href = "gallery.html";

}

const docRef = db.collection("gallery").doc(imageId);

// Load Image Data
docRef.get()
.then((doc)=>{

    if(!doc.exists){

        alert("Image Not Found!");

        window.location.href="gallery.html";

        return;

    }

    const g = doc.data();

    document.getElementById("title").value = g.title || "";
    document.getElementById("image").value = g.image || "";

    document.getElementById("preview").src = "../" + g.image;

});

// Live Preview
document.getElementById("image").addEventListener("input",()=>{

    document.getElementById("preview").src =
        "../" + document.getElementById("image").value;

});

// Update Image
document.getElementById("updateGallery").addEventListener("click",()=>{

    docRef.update({

        title:document.getElementById("title").value.trim(),

        image:document.getElementById("image").value.trim()

    })

    .then(()=>{

        alert("✅ Gallery Updated Successfully!");

        window.location.href="gallery.html";

    })

    .catch((err)=>{

        console.log(err);

        alert("Update Failed!");

    });

});