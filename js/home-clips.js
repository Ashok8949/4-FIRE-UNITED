const homeGrid = document.getElementById("homeClipsGrid");

if (homeGrid) {

    db.collection("clips")
        .orderBy("createdAt", "desc")
        .limit(3)
        .get()
        .then((snapshot) => {

            homeGrid.innerHTML = "";

            snapshot.forEach((doc) => {

                const clip = doc.data();

                homeGrid.innerHTML += `

                <div class="clip-card">

                    <a href="clips.html">

                        <div class="clip-thumbnail">

                            <img src="${clip.thumbnail}" alt="${clip.title}">

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

        })

        .catch(console.error);

}