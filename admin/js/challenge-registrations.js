// =====================================
// CHALLENGE REGISTRATIONS - ADMIN
// =====================================

const challengeList =
    document.getElementById("challengeList");

const challengeFilter =
    document.getElementById("challengeFilter");

const statusFilter =
    document.getElementById("statusFilter");

const searchInput =
    document.getElementById("searchInput");


let registrations = [];


// =====================================
// ESCAPE HTML
// =====================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================
// FORMAT DATE
// =====================================

function formatDate(value) {

    if (!value) {
        return "—";
    }


    if (value.toDate) {
        return value.toDate().toLocaleString();
    }


    const d = new Date(value);


    if (isNaN(d.getTime())) {
        return String(value);
    }


    return d.toLocaleString();

}


// =====================================
// STATUS CLASS
// =====================================

function statusClass(status) {

    const s =
        String(status || "New")
            .toLowerCase();


    if (s === "confirmed") {
        return "status-confirmed";
    }


    if (s === "rejected") {
        return "status-rejected";
    }


    return "status-new";

}


// =====================================
// LOAD REGISTRATIONS
// =====================================

async function loadRegistrations() {

    challengeList.innerHTML =
        '<div class="empty">Loading registrations...</div>';


    try {

        const snapshot =
            await db
                .collection("challengeRegistrations")
                .get();


        registrations = [];


        snapshot.forEach((doc) => {

            registrations.push({

                docId: doc.id,

                ...doc.data()

            });

        });


        // =====================================
        // SORT NEWEST FIRST
        // =====================================

        registrations.sort((a, b) => {

            const aTime =
                a.createdAt?.toMillis
                    ? a.createdAt.toMillis()
                    : new Date(
                        a.createdAt ||
                        a.date ||
                        0
                    ).getTime();


            const bTime =
                b.createdAt?.toMillis
                    ? b.createdAt.toMillis()
                    : new Date(
                        b.createdAt ||
                        b.date ||
                        0
                    ).getTime();


            return bTime - aTime;

        });


        renderRegistrations();


    } catch (error) {

        console.error(
            "Challenge registrations error:",
            error
        );


        challengeList.innerHTML =
            '<div class="empty">' +
            '❌ Failed to load registrations.<br><br>' +
            escapeHtml(error.message) +
            '</div>';

    }

}


// =====================================
// RENDER REGISTRATIONS
// =====================================

function renderRegistrations() {

    const challenge =
        challengeFilter.value;


    const status =
        statusFilter.value;


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        registrations.filter((item) => {

            const matchesChallenge =
                challenge === "ALL" ||
                item.challengeType === challenge;


            const matchesStatus =
                status === "ALL" ||
                (item.status || "New") === status;


            const searchable = [

                item.registrationId,

                item.leaderName,

                item.leaderUID,

                item.teamName,

                item.whatsapp,

                item.email,

                item.challengeType

            ]
                .join(" ")
                .toLowerCase();


            return (
                matchesChallenge &&
                matchesStatus &&
                searchable.includes(search)
            );

        });


    // =====================================
    // EMPTY
    // =====================================

    if (!filtered.length) {

        challengeList.innerHTML =
            '<div class="empty">' +
            '🔥 No challenge registrations found.' +
            '</div>';

        return;

    }


    // =====================================
    // CREATE CARDS
    // =====================================

    challengeList.innerHTML =
        filtered
            .map((item) => {

                const statusValue =
                    item.status || "New";


                const phone =
                    String(
                        item.whatsapp || ""
                    )
                    .replace(
                        /[^0-9+]/g,
                        ""
                    );


                const email =
                    item.email || "";


                return `

                    <div class="challenge-item">

                        <div class="challenge-top">

                            <div>

                                <div class="challenge-type">

                                    🔥
                                    ${escapeHtml(
                                        item.challengeType ||
                                        "CHALLENGE"
                                    )}

                                </div>

                                <div class="challenge-id">

                                    ${escapeHtml(
                                        item.registrationId ||
                                        item.docId
                                    )}

                                </div>

                            </div>


                            <span
                                class="status ${statusClass(
                                    statusValue
                                )}"
                            >

                                ${escapeHtml(
                                    statusValue
                                )}

                            </span>

                        </div>


                        <div class="challenge-grid">


                            <!-- LEADER -->

                            <div class="detail">

                                <small>
                                    Leader Name
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        item.leaderName ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <!-- UID -->

                            <div class="detail">

                                <small>
                                    Free Fire UID
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        item.leaderUID ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <!-- TEAM -->

                            ${
                                item.challengeType !== "1V1"
                                ? `

                                    <div class="detail">

                                        <small>
                                            Team Name
                                        </small>

                                        <strong>
                                            ${escapeHtml(
                                                item.teamName ||
                                                "—"
                                            )}
                                        </strong>

                                    </div>

                                `
                                : ""
                            }


                            <!-- WHATSAPP -->

                            <div class="detail">

                                <small>
                                    WhatsApp
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        item.whatsapp ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <!-- EMAIL -->

                            <div class="detail">

                                <small>
                                    Email
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        email ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <!-- DATE -->

                            <div class="detail">

                                <small>
                                    Preferred Date
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        item.preferredDate ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <!-- TIME -->

                            <div class="detail">

                                <small>
                                    Preferred Time
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        item.preferredTime ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                            <!-- REGISTERED -->

                            <div class="detail">

                                <small>
                                    Registered At
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        formatDate(
                                            item.createdAt ||
                                            item.date
                                        )
                                    )}
                                </strong>

                            </div>


                            <!-- MESSAGE -->

                            <div
                                class="detail"
                                style="grid-column:1/-1;"
                            >

                                <small>
                                    Message
                                </small>

                                <strong>
                                    ${escapeHtml(
                                        item.message ||
                                        "—"
                                    )}
                                </strong>

                            </div>


                        </div>


                        <!-- ACTIONS -->

                        <div class="challenge-actions">


                            ${
                                phone
                                ? `

                                    <a
                                        class="btn-contact"
                                        href="https://wa.me/${phone.replace("+", "")}"
                                        target="_blank"
                                    >

                                        <i
                                            class="fa-brands fa-whatsapp"
                                        ></i>

                                        WhatsApp

                                    </a>

                                `
                                : ""
                            }


                            ${
                                email
                                ? `

                                    <a
                                        class="btn-contact"
                                        href="mailto:${escapeHtml(
                                            email
                                        )}"
                                    >

                                        <i
                                            class="fa-solid fa-envelope"
                                        ></i>

                                        Email

                                    </a>

                                `
                                : ""
                            }


                            <button
                                class="btn-confirm"
                                onclick="updateChallengeStatus(
                                    '${item.docId}',
                                    'Confirmed'
                                )"
                            >

                                <i
                                    class="fa-solid fa-check"
                                ></i>

                                Confirm

                            </button>


                            <button
                                class="btn-reject"
                                onclick="updateChallengeStatus(
                                    '${item.docId}',
                                    'Rejected'
                                )"
                            >

                                <i
                                    class="fa-solid fa-xmark"
                                ></i>

                                Reject

                            </button>


                            <button
                                class="btn-delete"
                                onclick="deleteChallenge(
                                    '${item.docId}'
                                )"
                            >

                                <i
                                    class="fa-solid fa-trash"
                                ></i>

                                Delete

                            </button>


                        </div>

                    </div>

                `;

            })
            .join("");

}


// =====================================
// UPDATE STATUS
// =====================================

async function updateChallengeStatus(
    docId,
    status
) {

    try {

        await db
            .collection(
                "challengeRegistrations"
            )
            .doc(docId)
            .update({

                status: status

            });


        const item =
            registrations.find(
                (x) =>
                    x.docId === docId
            );


        if (item) {
            item.status = status;
        }


        renderRegistrations();


    } catch (error) {

        console.error(error);


        alert(
            "❌ Failed to update status.\n\n" +
            error.message
        );

    }

}


// =====================================
// DELETE REGISTRATION
// =====================================

async function deleteChallenge(docId) {

    if (
        !confirm(
            "Delete this challenge registration permanently?"
        )
    ) {

        return;

    }


    try {

        await db
            .collection(
                "challengeRegistrations"
            )
            .doc(docId)
            .delete();


        registrations =
            registrations.filter(
                (item) =>
                    item.docId !== docId
            );


        renderRegistrations();


    } catch (error) {

        console.error(error);


        alert(
            "❌ Failed to delete registration.\n\n" +
            error.message
        );

    }

}


// =====================================
// FILTER EVENTS
// =====================================

challengeFilter?.addEventListener(
    "change",
    renderRegistrations
);


statusFilter?.addEventListener(
    "change",
    renderRegistrations
);


searchInput?.addEventListener(
    "input",
    renderRegistrations
);


// =====================================
// LOGOUT
// =====================================

document
    .getElementById("logoutBtn")
    ?.addEventListener(
        "click",
        () => {

            auth.signOut()

                .then(() => {

                    window.location.href =
                        "login.html";

                })

                .catch((error) => {

                    console.error(error);

                    alert(error.message);

                });

        }
    );


// =====================================
// START
// =====================================

loadRegistrations();