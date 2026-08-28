db.collection("gallery")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {

        const gallery =
            document.getElementById("gallery-grid");

        if (!gallery) return;

        let html = "";

        snapshot.forEach((doc) => {

            const g = doc.data();

            html += `

                <div class="gallery-box">

                    <img
                        src="${g.image}"
                        alt="${g.title || "Gallery"}"
                        loading="lazy"
                        decoding="async">

                    <div class="gallery-overlay">

                        <h3>
                            ${g.title || ""}
                        </h3>

                        ${
                            g.playerName
                                ? `
                                <p>
                                    <i class="fa-solid fa-user"></i>
                                    ${g.playerName}
                                </p>
                                `
                                : ""
                        }

                    </div>

                </div>

            `;

        });


        if (!snapshot.empty) {

            gallery.innerHTML = html;

        } else {

            gallery.innerHTML = `

                <div class="no-gallery">

                    <h2>No Gallery Available</h2>

                    <p>
                        Team memories will appear here soon.
                    </p>

                </div>

            `;

        }

    })
    .catch((error) => {

        console.error(
            "Gallery Error:",
            error
        );

    });