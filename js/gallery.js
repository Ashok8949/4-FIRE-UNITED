db.collection("gallery")
.get()
.then((snapshot) => {

    const gallery = document.getElementById("gallery-grid");

    gallery.innerHTML = "";

    snapshot.forEach((doc) => {

        const g = doc.data();

        gallery.innerHTML += `

        <div class="gallery-box">

            <img src="${g.image}" alt="${g.title}">

            <div class="gallery-overlay">

                <h3>${g.title}</h3>

            </div>

        </div>

        `;

    });

})
.catch((error) => {

    console.error("Gallery Error:", error);

});