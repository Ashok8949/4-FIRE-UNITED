let allClips = [];


// ===============================
// LOAD CLIPS
// ===============================

db.collection("clips")
    .orderBy("createdAt", "desc")
    .get()
    .then((snapshot) => {

        allClips = [];

        snapshot.forEach((doc) => {

            allClips.push({
                id: doc.id,
                ...doc.data()
            });

        });

        renderClips(allClips);

    })
    .catch((error) => {

        console.error("Error loading clips:", error);

        const grid = document.getElementById("clipsGrid");

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <h3>Unable to Load Clips</h3>
                    <p>Please check your Firebase connection.</p>
                </div>
            `;
        }

    });


// ===============================
// RENDER CLIPS
// ===============================

function renderClips(list) {

    const grid = document.getElementById("clipsGrid");
    const count = document.getElementById("clipsCount");

    if (!grid) return;

    grid.innerHTML = "";

    if (count) {
        count.textContent = `${list.length} ${list.length === 1 ? "Clip" : "Clips"}`;
    }


    if (list.length === 0) {

        grid.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-video-slash"></i>

                <h3>No Clips Found</h3>

                <p>
                    Add a gameplay clip or try another search.
                </p>

            </div>
        `;

        return;
    }


    list.forEach((clip) => {

        const title = escapeHtml(clip.title || "Untitled Clip");
        const player = escapeHtml(clip.playerName || "Unknown Player");
        const category = escapeHtml(clip.category || "Gameplay");

        const thumbnail = clip.thumbnail || "";


        grid.innerHTML += `

            <div class="clip-card">

                <div class="clip-thumbnail">

                    <img
                        src="${escapeAttribute(thumbnail)}"
                        alt="${escapeAttribute(clip.title || "Gameplay Clip")}"
                        onerror="this.src='../images/logo/logo.png';"
                    >

                    <span class="clip-category">
                        ${category}
                    </span>

                </div>


                <div class="clip-info">

                    <h3 title="${escapeAttribute(clip.title || "Untitled Clip")}">
                        ${title}
                    </h3>


                    <div class="clip-player">

                        <i class="fa-solid fa-user"></i>

                        <span>${player}</span>

                    </div>


                    <div class="clip-buttons">

                        <a
                            href="edit-clip.html?id=${encodeURIComponent(clip.id)}"
                            class="edit-btn"
                        >
                            <i class="fa-solid fa-pen"></i>
                            Edit
                        </a>


                        <button
                            onclick="deleteClip('${escapeAttribute(clip.id)}')"
                            class="delete-btn"
                        >
                            <i class="fa-solid fa-trash"></i>
                            Delete
                        </button>

                    </div>

                </div>

            </div>

        `;

    });

}


// ===============================
// SEARCH
// ===============================

const searchBox = document.getElementById("searchClip");

if (searchBox) {

    searchBox.addEventListener("input", () => {

        const value = searchBox.value
            .trim()
            .toLowerCase();


        if (!value) {

            renderClips(allClips);

            return;

        }


        const filtered = allClips.filter((clip) => {

            return (
                (clip.title || "").toLowerCase().includes(value) ||
                (clip.playerName || "").toLowerCase().includes(value) ||
                (clip.category || "").toLowerCase().includes(value)
            );

        });


        renderClips(filtered);

    });

}


// ===============================
// DELETE CLIP
// ===============================

function deleteClip(id) {

    if (!confirm("Delete this clip?")) {
        return;
    }


    db.collection("clips")
        .doc(id)
        .delete()
        .then(() => {

            allClips = allClips.filter(
                clip => clip.id !== id
            );

            renderClips(allClips);

        })
        .catch((error) => {

            console.error("Delete error:", error);

            alert("❌ Failed to delete clip.\n\n" + error.message);

        });

}


// ===============================
// HTML ESCAPE
// ===============================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHtml(value);

}