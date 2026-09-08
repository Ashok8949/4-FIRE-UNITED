// =========================================
// 4FU CHALLENGES
// =========================================

document.addEventListener("DOMContentLoaded", () => {

    let selectedChallenge = "";

    const challengeCards =
        document.querySelectorAll(".challenge-card");

    const challengeSelection =
        document.getElementById("challengeSelection");

    const challengeFormWrapper =
        document.getElementById("challengeFormWrapper");

    const modeForms =
        document.querySelectorAll(".mode-form");

    const formTitle =
        document.getElementById("formTitle");

    const formModeBadge =
        document.getElementById("formModeBadge");

    const changeChallenge =
        document.getElementById("changeChallenge");

    const confirmationBox =
        document.getElementById("confirmationBox");


    // =========================================
    // SHOW SELECTED FORM
    // =========================================

    function openChallengeForm(mode) {

        selectedChallenge = mode;

        // Hide all forms
        modeForms.forEach((form) => {
            form.classList.remove("active");
            form.reset();
        });

        // Get selected form
        const activeForm =
            document.getElementById(`form${mode}`);

        if (!activeForm) return;


        // Update title
        formTitle.textContent =
            `${mode} CHALLENGE REGISTRATION`;


        // Update badge
        formModeBadge.innerHTML = `
            <i class="fa-solid fa-fire"></i>
            ${mode} BATTLE
        `;


        // Show selected form
        activeForm.classList.add("active");


        // Hide challenge cards
        challengeSelection.style.transition =
            "opacity .35s ease, transform .35s ease";

        challengeSelection.style.opacity = "0";

        challengeSelection.style.transform =
            "translateY(-25px) scale(.98)";


        // Show form after animation
        setTimeout(() => {

            challengeSelection.style.display = "none";

            challengeFormWrapper.style.display = "block";

            requestAnimationFrame(() => {

                challengeFormWrapper.classList.add("show");

            });


            // Scroll to form
            challengeFormWrapper.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }, 350);

    }


    // =========================================
    // CHALLENGE CARD CLICK
    // =========================================

    challengeCards.forEach((card) => {

        card.addEventListener("click", () => {

            // Remove previous selection
            challengeCards.forEach((item) => {

                item.classList.remove("selected");

            });


            // Select current card
            card.classList.add("selected");


            // Open selected form
            openChallengeForm(
                card.dataset.mode
            );

        });

    });


    // =========================================
    // CHANGE MODE
    // =========================================

    changeChallenge.addEventListener("click", () => {

        challengeFormWrapper.classList.remove("show");


        setTimeout(() => {

            // Hide form
            challengeFormWrapper.style.display =
                "none";


            // Hide all forms
            modeForms.forEach((form) => {

                form.classList.remove("active");

                form.reset();

            });


            // Show challenge cards
            challengeSelection.style.display =
                "block";

            challengeSelection.style.opacity =
                "0";

            challengeSelection.style.transform =
                "translateY(25px)";


            requestAnimationFrame(() => {

                challengeSelection.style.transition =
                    "opacity .4s ease, transform .4s ease";

                challengeSelection.style.opacity =
                    "1";

                challengeSelection.style.transform =
                    "translateY(0)";

            });


            // Remove selected card
            challengeCards.forEach((card) => {

                card.classList.remove("selected");

            });


            selectedChallenge = "";

        }, 300);

    });


    // =========================================
    // GENERATE REGISTRATION ID
    // =========================================

    function generateRegistrationID() {

        const random =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();


        return `#4FU-${random}`;

    }


    // =========================================
    // FORM SUBMIT
    // =========================================

    modeForms.forEach((form) => {

        form.addEventListener("submit", async (e) => {

            e.preventDefault();


            // Check challenge
            if (!selectedChallenge) {

                alert(
                    "🔥 Please select a challenge."
                );

                return;

            }


            // Make sure correct form is submitted
            if (
                form.dataset.mode !==
                selectedChallenge
            ) {

                alert(
                    "❌ Invalid challenge form."
                );

                return;

            }


            // =====================================
            // GET FORM VALUES
            // =====================================

            const get = (name) => {

                const field =
                    form.querySelector(
                        `[name="${name}"]`
                    );

                return field
                    ? field.value.trim()
                    : "";

            };


            const leaderName =
                get("leaderName");


            const leaderUID =
                get("leaderUID");


            const whatsapp =
                get("whatsapp");


            const email =
                get("email");


            const teamName =
                get("teamName");


            const preferredDate =
                form.querySelector(
                    '[name="preferredDate"]'
                )?.value || "";


            const preferredTime =
                form.querySelector(
                    '[name="preferredTime"]'
                )?.value || "";


            const message =
                get("message");


            // =====================================
            // SUBMIT BUTTON
            // =====================================

            const submitButton =
                form.querySelector(
                    ".challenge-submit"
                );


            submitButton.disabled = true;


            submitButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> REGISTERING...';


            // =====================================
            // REGISTRATION ID
            // =====================================

            const registrationID =
                generateRegistrationID();


            // =====================================
            // FIREBASE DATA
            // =====================================

            const registrationData = {

                registrationId:
                    registrationID,


                challengeType:
                    selectedChallenge,


                leaderName:
                    leaderName,


                leaderUID:
                    leaderUID,


                whatsapp:
                    whatsapp,


                email:
                    email,


                // Team name only for 2V2 / 4V4
                teamName:
                    selectedChallenge === "1V1"
                        ? ""
                        : teamName,


                preferredDate:
                    preferredDate || "",


                preferredTime:
                    preferredTime || "",


                message:
                    message || "",


                status:
                    "New",


                createdAt:
                    firebase.firestore
                        .FieldValue
                        .serverTimestamp(),


                date:
                    new Date()
                        .toLocaleString()

            };


            // =====================================
            // INSTAGRAM DM MESSAGE
            // =====================================

            const dmMessage =
`🔥 Hi 4FU!

I just registered for a ${selectedChallenge} Challenge.

👤 Leader: ${leaderName}
🎮 UID: ${leaderUID}
🏆 Challenge: ${selectedChallenge}
${selectedChallenge !== "1V1" && teamName
    ? `👥 Team: ${teamName}\n`
    : ""}
🆔 Registration ID: ${registrationID}

Please confirm my challenge registration.

Thank you! 🔥`;


            try {

                // =================================
                // SAVE REGISTRATION
                // =================================

                await db
                    .collection(
                        "challengeRegistrations"
                    )
                    .add(
                        registrationData
                    );


                // =================================
                // ADMIN NOTIFICATION
                // =================================

                await db
                    .collection(
                        "notifications"
                    )
                    .add({

                        title:
                            "🔥 New Challenge Registration",


                        message:
                            `${leaderName} registered for ${selectedChallenge} Challenge`,


                        type:
                            "challenge",


                        link:
                            "challenge-registrations.html",


                        isRead:
                            false,


                        createdAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    });


                // =================================
                // HIDE FORM
                // =================================

                challengeFormWrapper
                    .classList
                    .remove("show");


                setTimeout(() => {

                    challengeFormWrapper.style.display =
                        "none";


                    // =================================
                    // SHOW SUCCESS
                    // =================================

                    document.getElementById(
                        "registrationId"
                    ).textContent =
                        registrationID;


                    document.getElementById(
                        "dmMessage"
                    ).textContent =
                        "Your message is ready. Copy it and send it to 4FU on Instagram to confirm your challenge.";


                    confirmationBox
                        .classList
                        .add("show");


                    confirmationBox.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });


                }, 300);


                // =================================
                // COPY MESSAGE
                // =================================

                document.getElementById(
                    "copyMessage"
                ).onclick = async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                dmMessage
                            );


                        alert(
                            "📋 Message copied! Open Instagram and paste it."
                        );


                    } catch (error) {

                        console.error(
                            error
                        );


                        alert(
                            "Please copy the message manually."
                        );

                    }

                };


                // =================================
                // INSTAGRAM DM
                // =================================

                document.getElementById(
                    "instagramDM"
                ).onclick = async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                dmMessage
                            );

                    } catch (error) {

                        console.log(
                            "Clipboard permission unavailable."
                        );

                    }


                    window.open(
                        "https://ig.me/m/4fireunitedofficial",
                        "_blank"
                    );

                };


                // =================================
                // RESET FORM
                // =================================

                form.reset();


            } catch (error) {

                console.error(
                    "Challenge Registration Error:",
                    error
                );


                alert(
                    "❌ Registration failed. Please try again."
                );


            } finally {

                submitButton.disabled =
                    false;


                submitButton.innerHTML =
                    `🔥 REGISTER ${selectedChallenge || "CHALLENGE"} CHALLENGE`;

            }

        });

    });

});