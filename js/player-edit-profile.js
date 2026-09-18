// ==========================================
// 4 FIRE UNITED - PLAYER EDIT PROFILE
// ==========================================

let playerDocId = null;
let playerData = null;


// ==========================================
// 4FU LIVE FREE FIRE API
// ==========================================

function liveValue(...values) {
    return values.find(
        value =>
            value !== undefined &&
            value !== null &&
            value !== ""
    );
}

function liveNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function liveText(id, value, fallback = "—") {
    const el = document.getElementById(id);
    if (el) {
        el.textContent =
            value !== undefined &&
            value !== null &&
            value !== ""
                ? String(value)
                : fallback;
    }
}

function getLiveStats(data) {
    const stats = data?.stats || {};
    return {
        matches: liveValue(stats.matches, data?.matches),
        wins: liveValue(stats.wins, data?.wins),
        kills: liveValue(stats.kills, data?.kills),
        deaths: liveValue(stats.deaths, data?.deaths),
        kd: liveValue(stats.kd, data?.kd),
        headshot: liveValue(
            stats.headshot,
            stats.headshotRate,
            data?.headshot,
            data?.headshotRate
        ),
        headshots: liveValue(stats.headshots, data?.headshots),
        headshotKills: liveValue(
            stats.headshotKills,
            data?.headshotKills
        ),
        booyahRate: liveValue(
            stats.booyahRate,
            data?.booyahRate
        )
    };
}

function applyLiveFreeFireDataToEdit(data) {
    if (!data) return;

    const basic = data.basicInfo || {};
    const stats = getLiveStats(data);

    const liveUid = liveValue(
        basic.accountId,
        data.uid,
        playerData?.uid
    );

    const liveIgn = liveValue(
        basic.nickname,
        data.nickname,
        data.name
    );

    const liveLevel = liveValue(
        basic.level,
        data.level
    );

    const liveGuild = liveValue(
        data.guild,
        data.clanName,
        data.clanBasicInfo?.clanName
    );

    const liveGuildId = liveValue(
        data.guildId,
        data.clanBasicInfo?.clanId
    );

    const liveBrRank = liveValue(
        data.rank,
        data.rankName,
        basic.rank
    );

    const liveBrRp = liveValue(
        data.rankingPoints,
        data.brRankingPoints
    );

    const liveCsRank = liveValue(
        data.csRank,
        data.csRankName
    );

    const liveCsRp = liveValue(
        data.csRankingPoints,
        data.csRp
    );

    const likes = liveValue(
        data.likes,
        data.liked
    );

    const gender = liveValue(
        data.gender,
        data.socialInfo?.gender
    );

    const language = liveValue(
        data.language,
        data.socialInfo?.language
    );

    const releaseVersion = liveValue(
        data.releaseVersion,
        data.release_version
    );

    const pet = data.petInfo || data.pet || {};
    const petId = liveValue(
        pet.id,
        pet.petId,
        pet.petID
    );
    const petLevel = liveValue(
        pet.level,
        pet.petLevel
    );

    const matches = liveNumber(stats.matches);
    const wins = liveNumber(stats.wins);
    const kills = liveNumber(stats.kills);
    const deaths = liveNumber(stats.deaths);

    const calculatedKd =
        deaths > 0
            ? (kills / deaths).toFixed(2)
            : kills > 0
                ? kills.toFixed(2)
                : "0.00";

    const calculatedWinRate =
        matches > 0
            ? ((wins / matches) * 100).toFixed(2)
            : "0.00";

    // Existing editable game fields receive the live API values.
    // Rank select stays unchanged because API rank is a numeric rank ID.
    if (liveIgn !== undefined) {
        document.getElementById("ign").value = liveIgn;
    }

    if (liveUid !== undefined) {
        document.getElementById("uid").value = liveUid;
    }

    if (liveGuild !== undefined) {
        document.getElementById("guild").value = liveGuild;
    }

    if (liveLevel !== undefined) {
        document.getElementById("level").value = liveLevel;
    }

    if (stats.kd !== undefined || kills || deaths) {
        document.getElementById("kd").value =
            liveValue(stats.kd, calculatedKd);
    }

    if (stats.headshot !== undefined) {
        document.getElementById("headshot").value =
            stats.headshot;
    }

    if (stats.matches !== undefined) {
        document.getElementById("matches").value =
            stats.matches;
    }

    if (stats.wins !== undefined) {
        document.getElementById("booyah").value =
            stats.wins;
    }

    // Live API panel.
    liveText("liveIgn", liveIgn);
    liveText("liveUid", liveUid);
    liveText("liveGuild", liveGuild);
    liveText("liveGuildId", liveGuildId);
    liveText("liveLevel", liveLevel);
    liveText("liveBrRank", liveBrRank);
    liveText("liveBrRp", liveBrRp);
    liveText("liveCsRank", liveCsRank);
    liveText("liveCsRp", liveCsRp);
    liveText("liveKd", liveValue(stats.kd, calculatedKd));
    liveText("liveHs", stats.headshot);
    liveText("liveWinRate", calculatedWinRate + "%");
    liveText("liveMatches", stats.matches);
    liveText("liveWins", stats.wins);
    liveText("liveKills", stats.kills);
    liveText("liveDeaths", stats.deaths);
    liveText("liveHeadshots", stats.headshots);
    liveText("liveHsKills", stats.headshotKills);
    liveText("liveLikes", likes);
    liveText("liveGender", gender);
    liveText("liveLanguage", language);
    liveText("liveVersion", releaseVersion);
    liveText("livePetId", petId);
    liveText("livePetLevel", petLevel);

    const status = document.getElementById("liveApiStatus");
    if (status) {
        status.textContent =
            "LIVE • Synced " +
            new Date().toLocaleTimeString();
        status.style.color = "#ff8a00";
    }
}

async function refreshLiveFreeFireData() {
    if (
        !playerData ||
        !playerData.uid ||
        typeof window.getFreeFirePlayer !== "function"
    ) {
        return;
    }

    const status = document.getElementById("liveApiStatus");
    const button = document.getElementById("liveApiRefresh");

    if (status) {
        status.textContent = "Fetching latest Free Fire data...";
    }

    if (button) {
        button.disabled = true;
        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
    }

    try {
        const liveData =
            await window.getFreeFirePlayer(
                playerData.uid,
                playerData.region || "IND"
            );

        if (!liveData) {
            throw new Error("Free Fire API returned no data.");
        }

        applyLiveFreeFireDataToEdit(liveData);

    } catch (error) {
        console.warn(
            "[4FU] Live edit-profile API unavailable:",
            error
        );

        if (status) {
            status.textContent =
                "Live API unavailable • Firestore values kept";
            status.style.color = "#888";
        }

    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<i class="fa-solid fa-rotate"></i> Refresh Live Data';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const refreshButton =
        document.getElementById("liveApiRefresh");

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            refreshLiveFreeFireData
        );
    }
});



// ==========================================
// AUTH CHECK + LOAD PLAYER
// ==========================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        window.location.href = "player-login.html";

        return;

    }

    try {

        const snapshot = await db
            .collection("players")
            .where("loginEmail", "==", user.email)
            .limit(1)
            .get();


        if (snapshot.empty) {

            await auth.signOut();

            window.location.href = "player-login.html";

            return;

        }


        const doc = snapshot.docs[0];

        playerDocId = doc.id;

        playerData = doc.data();


        // Load Firestore first so the form renders immediately,
        // then replace live game fields with current Free Fire API data.
        setTimeout(() => {
            refreshLiveFreeFireData();
        }, 0);


        // ==========================================
        // LOAD PLAYER DATA
        // ==========================================

        document.getElementById("name").value =
            playerData.name || "";

        document.getElementById("ign").value =
            playerData.ign || "";

        document.getElementById("uid").value =
            playerData.uid || "";

        document.getElementById("guild").value =
            playerData.guild || "";

        document.getElementById("role").value =
            playerData.role || "";

        // ROLE IS CONTROLLED BY ADMIN ONLY
        const roleField = document.getElementById("role");
        if (roleField) {
            roleField.readOnly = true;
            roleField.disabled = true;
            roleField.setAttribute("aria-readonly", "true");
            roleField.title = "Role can only be changed by an administrator.";
        }

        document.getElementById("language").value =
            playerData.language || "";

        document.getElementById("country").value =
            playerData.country || "";

        document.getElementById("loginEmail").value =
            playerData.loginEmail || user.email || "";

        document.getElementById("level").value =
            playerData.level ?? "";

        document.getElementById("rank").value =
            playerData.rank || "";

        document.getElementById("kd").value =
            playerData.kd || "";

        document.getElementById("headshot").value =
            playerData.headshot || "";

        document.getElementById("matches").value =
            playerData.matches ?? "";

        document.getElementById("booyah").value =
            playerData.booyah ?? "";


        // ==========================================
        // WEAPON
        // ==========================================

        document.getElementById("weaponName").value =
            playerData.weaponName || "";

        document.getElementById("weaponType").value =
            playerData.weaponType || "";

        document.getElementById("weaponQuote").value =
            playerData.weaponQuote || "";


        // ==========================================
        // SOCIAL MEDIA
        // ==========================================

        document.getElementById("instagram").value =
            playerData.instagram || "";

        document.getElementById("youtube").value =
            playerData.youtube || "";

        document.getElementById("discord").value =
            playerData.discord || "";

        document.getElementById("facebook").value =
            playerData.facebook || "";


        // ==========================================
        // PLAYER IMAGE
        // ==========================================

        document.getElementById("previewImage").src =
            playerData.image || "../images/logo/logo.png";


        // ==========================================
        // WEAPON IMAGE
        // ==========================================

        if (playerData.weaponImage) {

            const weaponPreview =
                document.getElementById("weaponPreview");

            if (weaponPreview) {

                weaponPreview.src =
                    playerData.weaponImage;

                weaponPreview.style.display =
                    "block";

            }

        }


        document.body.style.visibility = "visible";


    } catch (error) {

        console.error(error);

        alert("Unable to load player profile.");

    }

});


// ==========================================
// PLAYER IMAGE PREVIEW
// ==========================================

document.getElementById("image").addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            document.getElementById("previewImage").src =
                event.target.result;

        };

        reader.readAsDataURL(file);

    }
);


// ==========================================
// SAVE PLAYER PROFILE
// ==========================================

document.getElementById("saveBtn").addEventListener(
    "click",
    async () => {

        if (!playerDocId) {

            alert("Player profile not loaded.");

            return;

        }


        const saveBtn =
            document.getElementById("saveBtn");

        const uploadStatus =
            document.getElementById("uploadStatus");

        const uploadProgress =
            document.getElementById("uploadProgress");


        try {

            saveBtn.disabled = true;

            saveBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';


            // ==========================================
            // IMAGE UPLOAD
            // ==========================================

            let imageUrl =
                playerData.image || "";

            const imageFile =
                document.getElementById("image").files[0];


            if (imageFile) {

                uploadProgress.style.display = "block";

                uploadStatus.style.display = "block";

                uploadStatus.textContent =
                    "Uploading player image...";


                const storageRef =
                    firebase.storage().ref(
                        "player-profiles/" +
                        playerDocId +
                        "/" +
                        Date.now() +
                        "_" +
                        imageFile.name
                    );


                const uploadTask =
                    storageRef.put(imageFile);


                await new Promise((resolve, reject) => {

                    uploadTask.on(

                        "state_changed",

                        (snapshot) => {

                            const progress =
                                (
                                    snapshot.bytesTransferred /
                                    snapshot.totalBytes
                                ) * 100;

                            uploadProgress.value =
                                progress;

                        },

                        (error) => {

                            reject(error);

                        },

                        async () => {

                            imageUrl =
                                await uploadTask.snapshot
                                    .ref
                                    .getDownloadURL();

                            resolve();

                        }

                    );

                });

            }


            // ==========================================
            // WEAPON IMAGE UPLOAD
            // ==========================================

            let weaponImageUrl =
                playerData.weaponImage || "";

            const weaponFile =
                document.getElementById("weaponImage").files[0];


            if (weaponFile) {

                uploadStatus.style.display = "block";

                uploadStatus.textContent =
                    "Uploading weapon image...";


                const weaponStorageRef =
                    firebase.storage().ref(
                        "player-weapons/" +
                        playerDocId +
                        "/" +
                        Date.now() +
                        "_" +
                        weaponFile.name
                    );


                const weaponUploadTask =
                    weaponStorageRef.put(weaponFile);


                await new Promise((resolve, reject) => {

                    weaponUploadTask.on(

                        "state_changed",

                        (snapshot) => {

                            const progress =
                                (
                                    snapshot.bytesTransferred /
                                    snapshot.totalBytes
                                ) * 100;

                            uploadProgress.value =
                                progress;

                        },

                        (error) => {

                            reject(error);

                        },

                        async () => {

                            weaponImageUrl =
                                await weaponUploadTask.snapshot
                                    .ref
                                    .getDownloadURL();

                            resolve();

                        }

                    );

                });

            }


            // ==========================================
            // FIREBASE AUTH
            // ==========================================

            const currentUser = auth.currentUser;

            if (!currentUser) {

                throw new Error(
                    "You are not logged in."
                );

            }


            const oldEmail =
                (currentUser.email || "")
                    .trim()
                    .toLowerCase();


            const newEmail =
                document.getElementById("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const currentPassword =
                document.getElementById("currentPassword")
                    .value
                    .trim();


            const newPassword =
                document.getElementById("newPassword")
                    .value
                    .trim();


            const confirmPassword =
                document.getElementById("confirmPassword")
                    .value
                    .trim();


            if (!newEmail) {

                throw new Error(
                    "Login email cannot be empty."
                );

            }


            const changingEmail =
                newEmail !== oldEmail;


            const changingPassword =
                newPassword !== "";


            // ==========================================
            // RE-AUTHENTICATION
            // ==========================================

            if (
                changingEmail ||
                changingPassword
            ) {

                if (!currentPassword) {

                    throw new Error(
                        "Enter your current password."
                    );

                }


                const credential =
                    firebase.auth.EmailAuthProvider
                        .credential(
                            oldEmail,
                            currentPassword
                        );


                await currentUser
                    .reauthenticateWithCredential(
                        credential
                    );

            }


            // ==========================================
            // PASSWORD CHANGE
            // ==========================================

            if (changingPassword) {

                if (newPassword.length < 6) {

                    throw new Error(
                        "New password must be at least 6 characters."
                    );

                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    throw new Error(
                        "New password and confirm password do not match."
                    );

                }


                await currentUser
                    .updatePassword(newPassword);

            }






            // ==========================================
            // EMAIL CHANGE
            // ==========================================

            // ==========================================
            // EMAIL CHANGE
            // ==========================================

            if (changingEmail) {

                await currentUser.updateEmail(newEmail);

            }

            // ==========================================
            // UPDATE FIRESTORE
            // ==========================================

            await db
                .collection("players")
                .doc(playerDocId)
                .update({

                    name:
                        document
                            .getElementById("name")
                            .value
                            .trim(),

                    ign:
                        document
                            .getElementById("ign")
                            .value
                            .trim(),

                    uid:
                        document
                            .getElementById("uid")
                            .value
                            .trim(),

                    guild:
                        document
                            .getElementById("guild")
                            .value
                            .trim(),

                    // ROLE LOCK: players cannot change their role.
                    role: playerData.role || "",

                    language:
                        document
                            .getElementById("language")
                            .value
                            .trim(),

                    country:
                        document
                            .getElementById("country")
                            .value,

                    loginEmail: newEmail,


                    level:
                        Number(
                            document
                                .getElementById("level")
                                .value
                        ) || 0,


                    rank:
                        document
                            .getElementById("rank")
                            .value,


                    kd:
                        document
                            .getElementById("kd")
                            .value
                            .trim(),


                    headshot:
                        document
                            .getElementById("headshot")
                            .value
                            .trim(),


                    matches:
                        Number(
                            document
                                .getElementById("matches")
                                .value
                        ) || 0,


                    booyah:
                        Number(
                            document
                                .getElementById("booyah")
                                .value
                        ) || 0,


                    weaponName:
                        document
                            .getElementById("weaponName")
                            .value
                            .trim(),


                    weaponType:
                        document
                            .getElementById("weaponType")
                            .value
                            .trim(),


                    weaponQuote:
                        document
                            .getElementById("weaponQuote")
                            .value
                            .trim(),


                    weaponImage:
                        weaponImageUrl,


                    instagram:
                        document
                            .getElementById("instagram")
                            .value
                            .trim(),


                    youtube:
                        document
                            .getElementById("youtube")
                            .value
                            .trim(),


                    discord:
                        document
                            .getElementById("discord")
                            .value
                            .trim(),


                    facebook:
                        document
                            .getElementById("facebook")
                            .value
                            .trim(),


                    image:
                        imageUrl

                });


            // ==========================================
            // SUCCESS
            // ==========================================

            uploadProgress.style.display =
                "none";

            uploadStatus.style.display =
                "block";

            uploadStatus.textContent =
                "Profile updated successfully!";


            saveBtn.innerHTML =
                '<i class="fa-solid fa-check"></i> Saved';


            setTimeout(() => {

                window.location.href =
                    "player-dashboard.html";

            }, 1200);


        } catch (error) {

            console.error(
                "SAVE ERROR:",
                error
            );

            alert(
    "Firebase Error:\n\n" +
    "CODE: " + (error.code || "NO CODE") +
    "\n\nMESSAGE: " + (error.message || "NO MESSAGE")
);


            uploadStatus.style.display =
                "block";


            let message =
                "Unable to save profile.";


            if (
                error.code ===
                "auth/wrong-password"
            ) {

                message =
                    "Current password is incorrect.";

            }

            else if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message =
                    "Current password is incorrect.";

            }

            else if (
                error.code ===
                "auth/weak-password"
            ) {

                message =
                    "New password is too weak.";

            }

            else if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                message =
                    "This email is already used by another account.";

            }

            else if (
                error.code ===
                "auth/invalid-email"
            ) {

                message =
                    "Please enter a valid email.";

            }

            else if (
                error.code ===
                "auth/requires-recent-login"
            ) {

                message =
                    "Please logout and login again, then try again.";

            }

            else if (
                error.code ===
                "auth/operation-not-allowed"
            ) {

                message =
                    "Firebase Authentication does not allow this operation.";

            }

            else if (
                error.code ===
                "permission-denied"
            ) {

                message =
                    "Permission denied. Check Firestore Rules.";

            }

            else if (error.message) {

                message =
                    error.message;

            }


            uploadStatus.textContent =
                message;


            saveBtn.disabled = false;


            saveBtn.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Save Changes';

        }

    }
);