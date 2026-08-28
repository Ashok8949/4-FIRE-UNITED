let allClips = [];


db.collection("clips")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {

        const grid =
            document.getElementById("clipsGrid");

        if (!grid) return;

        grid.innerHTML = "";

        allClips = [];


        if (snapshot.empty) {

            grid.innerHTML = `

                <div class="no-clips">

                    <h2>No Clips Available</h2>

                    <p>
                        Gameplay clips will appear here soon.
                    </p>

                </div>

            `;

            return;

        }


        let featuredDoc =
            snapshot.docs.find(
                doc =>
                    doc.data().featured === true
            );


        if (!featuredDoc) {

            featuredDoc =
                snapshot.docs[0];

        }


        if (featuredDoc) {

            const featured =
                featuredDoc.data();

            const banner =
                document.querySelector(
                    ".featured-clip"
                );


            if (banner) {

                banner.style.backgroundImage =
                    `url(${featured.thumbnail})`;

            }


            const title =
                document.getElementById(
                    "featuredTitle"
                );


            if (title) {

                title.textContent =
                    featured.title || "";

            }


            const player =
                document.getElementById(
                    "featuredPlayer"
                );


            if (player) {

                player.textContent =
                    "By " +
                    (featured.playerName || "Player");

            }


            const watch =
                document.getElementById(
                    "featuredWatch"
                );


            if (watch) {

                watch.onclick = () => {

                    if (
                        featured.clipType ===
                        "instagram"
                    ) {

                        window.open(
                            featured.videoUrl,
                            "_blank"
                        );

                    } else {

                        playVideo(
                            featured.videoUrl
                        );

                    }

                };

            }

        }


        snapshot.forEach((doc) => {

            const clip =
                doc.data();


            allClips.push({

                id: doc.id,

                ...clip

            });


            let videoUrl =
                clip.videoUrl;


            grid.innerHTML += `

                <div class="clip-card">

                    <div
                        class="clip-thumbnail"
                        onclick="
                            ${
                                clip.clipType ===
                                "instagram"

                                ?

                                `window.open(
                                    '${clip.videoUrl}',
                                    '_blank'
                                )`

                                :

                                `playVideo(
                                    '${videoUrl}'
                                )`
                            }
                        "
                    >

                        <img
                            src="${clip.thumbnail}"
                            alt="${clip.title}"
                            loading="lazy">

                        <div class="play-btn">

                            <i class="fa-solid fa-play"></i>

                        </div>

                    </div>


                    <div class="clip-info">

                        <h3>
                            ${clip.title || ""}
                        </h3>


                        <p class="player-name">

                            <i class="fa-solid fa-user"></i>

                            ${clip.playerName || "Player"}

                        </p>


                        <span class="clip-category">

                            ${clip.category || "Gameplay"}

                        </span>


                        <p class="clip-description">

                            ${clip.description || ""}

                        </p>


                        ${
                            clip.clipType ===
                            "instagram"

                            ?

                            `

                            <a
                                href="${clip.videoUrl}"
                                target="_blank"
                                class="watch-btn">

                                <i class="fa-brands fa-instagram"></i>

                                Open Reel

                            </a>

                            `

                            :

                            `

                            <button
                                type="button"
                                class="watch-btn"
                                onclick="
                                    playVideo(
                                        '${videoUrl}'
                                    )
                                ">

                                <i class="fa-solid fa-circle-play"></i>

                                Watch Clip

                            </button>

                            `
                        }

                    </div>

                </div>

            `;

        });

    })
    .catch((error) => {

        console.error(
            "Clips Error:",
            error
        );

    });


/* =========================
   PLAY VIDEO
========================= */

function playVideo(url) {

    const modal =
        document.getElementById(
            "videoModal"
        );

    const container =
        document.getElementById(
            "videoContainer"
        );


    if (!modal || !container) return;


    modal.style.display =
        "flex";


    if (
        url.includes("cloudinary") ||
        url.includes(".mp4") ||
        url.includes(".webm") ||
        url.includes(".mov") ||
        url.includes("firebasestorage")
    ) {

        container.innerHTML = `

            <video
                controls
                autoplay
                style="
                    width:100%;
                    height:100%;
                    border-radius:14px;
                "
            >

                <source
                    src="${url}">

            </video>

        `;

    } else {

        const youtubeId =
            getYoutubeId(url);


        container.innerHTML = `

            <iframe

                width="100%"
                height="100%"

                src="
                    https://www.youtube.com/embed/
                    ${youtubeId}?autoplay=1
                "

                allow="
                    autoplay;
                    encrypted-media
                "

                allowfullscreen

                style="
                    border:none;
                    border-radius:14px;
                "

            ></iframe>

        `;

    }

}


/* =========================
   YOUTUBE ID
========================= */

function getYoutubeId(url) {

    if (!url) return "";

    const match =
        url.match(
            /(?:v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/
        );

    return match
        ? match[1]
        : "";

}


/* =========================
   CLOSE VIDEO
========================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        const modal =
            document.getElementById(
                "videoModal"
            );

        const container =
            document.getElementById(
                "videoContainer"
            );

        const closeBtn =
            document.getElementById(
                "closeVideo"
            );


        if (closeBtn) {

            closeBtn.onclick = () => {

                modal.style.display =
                    "none";

                container.innerHTML =
                    "";

            };

        }


        if (modal) {

            modal.onclick = (e) => {

                if (
                    e.target === modal
                ) {

                    modal.style.display =
                        "none";

                    container.innerHTML =
                        "";

                }

            };

        }

    }
);


/* =========================
   SEARCH
========================= */

const search =
    document.getElementById(
        "searchClip"
    );

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


function filterClips() {

    if (!search || !categoryFilter)
        return;


    const text =
        search.value
            .toLowerCase()
            .trim();


    const category =
        categoryFilter.value;


    document
        .querySelectorAll(
            ".clip-card"
        )
        .forEach(
            (card, index) => {

                const clip =
                    allClips[index];


                if (!clip) return;


                const searchMatch =

                    (clip.title || "")
                        .toLowerCase()
                        .includes(text)

                    ||

                    (clip.playerName || "")
                        .toLowerCase()
                        .includes(text);


                const categoryMatch =

                    category === ""

                    ||

                    clip.category ===
                    category;


                card.style.display =

                    (
                        searchMatch &&
                        categoryMatch
                    )

                    ? ""

                    : "none";

            }
        );

}


if (search) {

    search.addEventListener(
        "input",
        filterClips
    );

}


if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        filterClips
    );

}