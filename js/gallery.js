db.collection("gallery")
.get()
.then((snapshot) => {
    

    const gallery = document.getElementById("gallery-grid");

    gallery.innerHTML = "";
    let html = "";

    snapshot.forEach((doc) => {

        const g = doc.data();

        html += `

<div class="gallery-box">

    <img
        src="${g.image}"
        alt="${g.title}"
        loading="lazy"
        decoding="async">

    <div class="gallery-overlay">

        <h3>${g.title}</h3>

    </div>

</div>

`;

    });

    gallery.innerHTML = html;

})
.catch((error) => {

    console.error("Gallery Error:", error);

});