let allClips = [];
db.collection("clips")
.orderBy("createdAt", "desc")
.get()
.then((snapshot) => {

    const grid = document.getElementById("clipsGrid");

    grid.innerHTML = "";

    if (snapshot.empty) {

        grid.innerHTML = `
        <div class="no-clips">
            <h2>No Clips Available</h2>
            <p>Gameplay clips will appear here soon.</p>
        </div>`;
        return;
    }

    let featuredDoc =
    snapshot.docs.find(doc => doc.data().featured === true);

if (!featuredDoc) {

    featuredDoc = snapshot.docs[0];

}

if (featuredDoc) {

    const featured = featuredDoc.data();

    const banner = document.querySelector(".featured-clip");

    banner.style.backgroundImage =
        `url(${featured.thumbnail})`;

    document.getElementById("featuredTitle").textContent =
        featured.title;

    document.getElementById("featuredPlayer").textContent =
        "By " + featured.playerName;

    document.getElementById("featuredWatch").onclick = () => {

    if (featured.clipType === "instagram") {

        window.open(featured.videoUrl, "_blank");

    } else if (featured.clipType === "video") {

        playVideo(featured.videoUrl);

    } else {

        playVideo(getYoutubeId(featured.videoUrl));

    }

};

}

    snapshot.forEach((doc) => {

        const clip = doc.data();

        allClips.push({

    id: doc.id,

    ...clip

});

        let videoId = "";

if (clip.clipType === "youtube") {

    videoId = getYoutubeId(clip.videoUrl);

} else if (clip.clipType === "video") {

    videoId = clip.videoUrl;

}

        grid.innerHTML += `

        <div class="clip-card">

            <div class="clip-thumbnail"
${
clip.clipType === "instagram"
?
`onclick="window.open('${clip.videoUrl}','_blank')"`
:
`onclick="playVideo('${videoId}')"`
}
>

                <img src="${clip.thumbnail}" alt="${clip.title}">

                <div class="play-btn">
                    <i class="fa-solid fa-play"></i>
                </div>

            </div>

            <div class="clip-info">

                <h3>${clip.title}</h3>

                <p class="player-name">
                    <i class="fa-solid fa-user"></i>
                    ${clip.playerName}
                </p>

                <span class="clip-category">
                    ${clip.category}
                </span>

                <p class="clip-description">
                    ${clip.description || ""}
                </p>

                ${
clip.clipType === "instagram"

? `

<a href="${clip.videoUrl}"
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
    onclick="playVideo('${videoId}')">

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
.catch(console.error);

function getYoutubeId(url){

    const match = url.match(/(?:v=|youtu\.be\/)([^&]+)/);

    return match ? match[1] : "";

}

function playVideo(url) {

    const modal = document.getElementById("videoModal");
    const container = document.getElementById("videoContainer");

    modal.style.display = "flex";

    if (
        url.includes("cloudinary") ||
        url.endsWith(".mp4") ||
        url.endsWith(".webm") ||
        url.endsWith(".mov")
    ) {

        container.innerHTML = `
            <video
                controls
                autoplay
                style="width:100%;height:100%;border-radius:14px;">
                <source src="${url}" type="video/mp4">
            </video>
        `;

    } else {

        container.innerHTML = `
            <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/${url}?autoplay=1"
                allow="autoplay; encrypted-media"
                allowfullscreen
                style="border:none;border-radius:14px;">
            </iframe>
        `;

    }

}

window.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("videoModal");
    const container = document.getElementById("videoContainer");
    const closeBtn = document.getElementById("closeVideo");

    closeBtn.onclick = () => {

        modal.style.display = "none";
        container.innerHTML = "";

    };

    modal.onclick = (e) => {

        if (e.target === modal) {

            modal.style.display = "none";
            container.innerHTML = "";

        }

    };

});

const search = document.getElementById("searchClip");
const categoryFilter = document.getElementById("categoryFilter");

function filterClips() {

    const text = search.value.toLowerCase().trim();
    const category = categoryFilter.value;

    document.querySelectorAll(".clip-card").forEach((card, index) => {

        const clip = allClips[index];

        if (!clip) return;

        const searchMatch =
            clip.title.toLowerCase().includes(text) ||
            clip.playerName.toLowerCase().includes(text);

        const categoryMatch =
            category === "" || clip.category === category;

        card.style.display =
            (searchMatch && categoryMatch) ? "" : "none";

    });

}

search.addEventListener("input", filterClips);
categoryFilter.addEventListener("change", filterClips);