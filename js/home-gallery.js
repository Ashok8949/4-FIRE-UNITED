document.addEventListener("homeDataReady", () => {

    const gallery = document.getElementById("gallery-grid");

    if (!gallery) return;

    let html = "";

    window.homeData.gallery.forEach((doc) => {

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

});