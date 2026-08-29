// ==========================================
// 4 FIRE UNITED - PLAYER EDIT PROFILE
// ==========================================

let playerDocId = null;
let playerData = null;


// ==========================================
// AUTH CHECK + LOAD PLAYER
// ==========================================

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        window.location.href = "player-login.html";

        return;

    }

    try {

        let snapshot = await db
            .collection("players")
            .where("authUid", "==", user.uid)
            .limit(1)
            .get();

        if (snapshot.empty) {
            snapshot = await db
                .collection("players")
                .where("loginEmail", "==", user.email)
                .limit(1)
                .get();
        }


        if (snapshot.empty) {

            await auth.signOut();

            window.location.href = "player-login.html";

            return;

        }


        const doc = snapshot.docs[0];

        playerDocId = doc.id;

        playerData = doc.data();


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

        // 🔒 ROLE LOCK - PLAYER CANNOT CHANGE ROLE
        const roleField = document.getElementById("role");

        if (roleField) {
            roleField.disabled = true;
            roleField.readOnly = true;
            roleField.style.pointerEvents = "none";
            roleField.style.cursor = "not-allowed";
        }

        document.getElementById("language").value =
            playerData.language || "";

        document.getElementById("country").value =
            playerData.country || "";

        document.getElementById("currentEmail").value =
            user.email || playerData.loginEmail || "";

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

                alert(
                    "Email changed successfully to " +
                    newEmail
                );

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

                    // 🔒 ROLE LOCK
                    // Always keep the role assigned by admin
                    role:
                        playerData.role || "",

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
                    authUid: currentUser.uid,


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