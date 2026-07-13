const homeGrid = document.getElementById("homeClipsGrid");

document.addEventListener("homeDataReady", () => {

    if (!homeGrid) return;

    let html = "";

    window.homeData.clips.forEach((doc) => {

        const clip = doc.data();

        html += `

        <div class="clip-card">

            <a href="clips.html">

                <div class="clip-thumbnail">

                    <img
                        src="${clip.thumbnail}"
                        alt="${clip.title}"
                        loading="lazy"
                        decoding="async">

                    <div class="play-btn">
                        <i class="fa-solid fa-play"></i>
                    </div>

                </div>

            </a>

            <div class="clip-info">

                <h3>${clip.title}</h3>

                <p class="player-name">

                    <i class="fa-solid fa-user"></i>

                    ${clip.playerName}

                </p>

                <span class="clip-category">

                    ${clip.category}

                </span>

            </div>

        </div>

        `;

    });

    homeGrid.innerHTML = html;

});