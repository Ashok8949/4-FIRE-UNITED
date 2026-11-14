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


            const submissionData = {
                challengeType: selectedChallenge,
                leaderName,
                leaderUID,
                whatsapp,
                email,
                teamName: selectedChallenge === "1V1" ? "" : teamName,
                preferredDate,
                preferredTime,
                message
            };

            // =====================================
            // INSTAGRAM DM MESSAGE
            // =====================================

            let registrationID = "";
            let dmMessage = "";
            const createDmMessage = (id) => `🔥 Hi 4FU!

I just registered for a ${selectedChallenge} Challenge.

👤 Leader: ${leaderName}
🎮 UID: ${leaderUID}
🏆 Challenge: ${selectedChallenge}
${selectedChallenge !== "1V1" && teamName ? `👥 Team: ${teamName}\\n` : ""}
🆔 Registration ID: ${id}

Please confirm my challenge registration.

Thank you! 🔥`;


            try {

                const response = await fetch("https://asia-south1-fire-united.cloudfunctions.net/submitChallengeRegistration", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Idempotency-Key": crypto.randomUUID()
                    },
                    body: JSON.stringify(submissionData)
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok || !result.success || !result.registrationId) {
                    throw new Error(result.message || "Registration failed.");
                }
                registrationID = result.registrationId;
                dmMessage = createDmMessage(registrationID);

                // Admin alerts are generated by a trusted Firestore trigger.

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