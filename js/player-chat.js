/* =========================================
   4 FIRE UNITED
   PLAYER FIRE CHAT
========================================= */

let chatUnsubscribe = null;


/* =========================================
   CHAT ELEMENTS
========================================= */

const chatMessages =
    document.getElementById("chatMessages");

const chatInput =
    document.getElementById("chatMessage");

const sendChatBtn =
    document.getElementById("sendChatMessage");


/* =========================================
   CHECK PLAYER LOGIN
========================================= */

firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {

        if (chatMessages) {

            chatMessages.innerHTML = `
                <div class="chat-loading">
                    🔒 Please login to use Fire Chat.
                </div>
            `;

        }

        return;
    }


    try {

        const snapshot = await db
            .collection("players")
            .where(
                "loginEmail",
                "==",
                user.email
            )
            .limit(1)
            .get();


        if (snapshot.empty) {

            chatMessages.innerHTML = `
                <div class="chat-loading">
                    Player profile not found.
                </div>
            `;

            return;
        }


        const playerDoc =
            snapshot.docs[0];


        startFireChat(
            playerDoc.id
        );


    } catch (error) {

        console.error(
            "Player Chat Login Error:",
            error
        );


        chatMessages.innerHTML = `
            <div class="chat-loading">
                ❌ Chat loading failed.
            </div>
        `;

    }

});


/* =========================================
   REALTIME CHAT
========================================= */

function startFireChat(currentPlayerId) {

    if (chatUnsubscribe) {

        chatUnsubscribe();

    }


    chatUnsubscribe = db
        .collection("chat")
        .limit(100)
        .onSnapshot(

            (snapshot) => {

                chatMessages.innerHTML = "";


                if (snapshot.empty) {

                    chatMessages.innerHTML = `
                        <div class="chat-loading">
                            🔥 No messages yet.<br>
                            Be the first to start the fire.
                        </div>
                    `;

                    return;
                }


                let messages = [];


                snapshot.forEach((doc) => {

                    messages.push({

                        id: doc.id,

                        ...doc.data()

                    });

                });


                /* Sort oldest → newest */

                messages.sort((a, b) => {

                    const aTime =
                        a.createdAt &&
                        a.createdAt.toMillis
                            ? a.createdAt.toMillis()
                            : 0;


                    const bTime =
                        b.createdAt &&
                        b.createdAt.toMillis
                            ? b.createdAt.toMillis()
                            : 0;


                    return aTime - bTime;

                });


                messages.forEach((message) => {

                    renderChatMessage(
                        message,
                        currentPlayerId
                    );

                });


                scrollChatToBottom();

            },


            (error) => {

                console.error(
                    "FIRE CHAT ERROR:",
                    error
                );


                chatMessages.innerHTML = `
                    <div class="chat-loading">
                        ❌ Unable to load Fire Chat.
                    </div>
                `;

            }

        );

}


/* =========================================
   DISPLAY MESSAGE
========================================= */

function renderChatMessage(
    message,
    currentPlayerId
) {

    const wrapper =
        document.createElement("div");


    wrapper.className =
        "chat-message";


    const avatar =
        message.playerImage ||
        "../images/logo/logo.png";


    const playerName =
        message.playerName ||
        "4 FIRE UNITED Player";


    const text =
        message.text ||
        "";


    let time = "Now";


    if (
        message.createdAt &&
        message.createdAt.toDate
    ) {

        time =
            message.createdAt
                .toDate()
                .toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );

    }


    const isOwnMessage =
        message.playerId ===
        currentPlayerId;


    wrapper.innerHTML = `

        <img
            class="chat-avatar"
            src="${escapeHtml(avatar)}"
            alt="Player"
            onerror="
                this.src='../images/logo/logo.png'
            "
        >


        <div class="chat-message-body">


            <div class="chat-name">

                ${escapeHtml(playerName)}

                ${
                    isOwnMessage
                    ?
                    `
                    <span
                        style="
                            color:#777;
                            font-size:9px;
                            margin-left:6px;
                        "
                    >
                        YOU
                    </span>
                    `
                    :
                    ""
                }

            </div>


            <div class="chat-text">

                ${escapeHtml(text)}

            </div>


            <div class="chat-message-bottom">

                <span class="chat-time">

                    ${time}

                </span>


                ${
                    isOwnMessage
                    ?
                    `
                    <button
                        type="button"
                        class="chat-delete-btn"
                        onclick="
                            deleteChatMessage('${message.id}')
                        "
                        title="Delete message"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>
                    `
                    :
                    ""
                }

            </div>


        </div>

    `;


    chatMessages.appendChild(
        wrapper
    );

}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendFireChatMessage() {

    const user =
        firebase.auth().currentUser;


    if (!user) {

        alert(
            "Please login first."
        );

        return;
    }


    const text =
        chatInput.value.trim();


    if (!text) {

        return;

    }


    if (text.length > 300) {

        alert(
            "Message cannot be longer than 300 characters."
        );

        return;

    }


    try {

        sendChatBtn.disabled =
            true;


        const snapshot =
            await db
                .collection("players")
                .where(
                    "loginEmail",
                    "==",
                    user.email
                )
                .limit(1)
                .get();


        if (snapshot.empty) {

            alert(
                "Player profile not found."
            );

            return;

        }


        const playerDoc =
            snapshot.docs[0];


        const player =
            playerDoc.data();


        const playerName =
            player.name ||
            player.playerName ||
            player.ign ||
            "Player";


        const playerImage =
            player.image ||
            player.photo ||
            player.profileImage ||
            "../images/logo/logo.png";


        const chatMessageRef =
            await db
                .collection("chat")
                .add({

                text:
                    text,

                playerId:
                    playerDoc.id,

                playerName:
                    playerName,

                playerImage:
                    playerImage,

                playerEmail:
                    user.email,

                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp()

            });


        // =========================================
        // FCM CHAT PUSH
        // =========================================
        try {
            fetch(
                "https://script.google.com/macros/s/AKfycbw3nOBztKlMYFPs-J7vVEZimLNtZdwv6WicbuqG7lxFEzO7T3DXpVJoyGceUkovBGUV/exec",
                {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },
                    body: JSON.stringify({
                        type: "chat",
                        priority: "normal",
                        title: "💬 4 FIRE UNITED Live Chat",
                        body:
                            playerName +
                            ": " +
                            text,
                        link: "/player-dashboard.html",
                        messageId:
                            chatMessageRef.id,
                        senderPlayerId:
                            playerDoc.id,
                        senderEmail:
                            user.email
                    })
                }
            ).catch((pushError) => {
                console.warn(
                    "CHAT FCM PUSH ERROR:",
                    pushError
                );
            });
        } catch (pushError) {
            console.warn(
                "CHAT FCM PUSH ERROR:",
                pushError
            );
        }


        chatInput.value =
            "";


        chatInput.focus();


    } catch (error) {

        console.error(
            "SEND CHAT ERROR:",
            error
        );


        alert(
            "Message send failed."
        );


    } finally {

        sendChatBtn.disabled =
            false;

    }

}


/* =========================================
   SEND BUTTON
========================================= */

if (sendChatBtn) {

    sendChatBtn.addEventListener(
        "click",
        sendFireChatMessage
    );

}


/* =========================================
   ENTER TO SEND
========================================= */

if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendFireChatMessage();

            }

        }
    );

}


/* =========================================
   DELETE OWN MESSAGE
========================================= */

async function deleteChatMessage(
    messageId
) {

    const user =
        firebase.auth().currentUser;


    if (!user) {

        alert(
            "Please login first."
        );

        return;

    }


    try {

        const messageRef =
            db
                .collection("chat")
                .doc(messageId);


        const messageDoc =
            await messageRef.get();


        if (!messageDoc.exists) {

            return;

        }


        const message =
            messageDoc.data();


        /* Find logged-in player */

        const playerSnapshot =
            await db
                .collection("players")
                .where(
                    "loginEmail",
                    "==",
                    user.email
                )
                .limit(1)
                .get();


        if (
            playerSnapshot.empty
        ) {

            alert(
                "Player profile not found."
            );

            return;

        }


        const currentPlayerId =
            playerSnapshot
                .docs[0]
                .id;


        /* Security check */

        if (
            message.playerId !==
            currentPlayerId
        ) {

            alert(
                "You can only delete your own messages."
            );

            return;

        }


        await messageRef.delete();


    } catch (error) {

        console.error(
            "DELETE CHAT ERROR:",
            error
        );


        alert(
            "Message delete failed."
        );

    }

}


/* =========================================
   AUTO SCROLL
========================================= */

function scrollChatToBottom() {

    setTimeout(() => {

        if (chatMessages) {

            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        }

    }, 100);

}


/* =========================================
   HTML SECURITY
========================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}