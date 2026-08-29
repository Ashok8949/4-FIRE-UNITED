const {setGlobalOptions} = require("firebase-functions");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({
  maxInstances: 10,
  region: "asia-south1",
});


// ============================================
// SEND PUSH NOTIFICATION
// ============================================

exports.sendPushNotification = onDocumentCreated(
    "notifications/{notificationId}",
    async (event) => {
      const snapshot = event.data;

      if (!snapshot) {
        console.log("No notification data.");
        return;
      }


      const notification =
            snapshot.data();


      // Sirf push type notifications process karo
      if (
        notification.type !== "push"
      ) {
        console.log(
            "Not a push notification.",
        );

        return;
      }


      const title =
            notification.title ||
            "4 FIRE UNITED";


      const message =
            notification.message ||
            "";


      const link =
            notification.link ||
            "/player-dashboard.html";


      const target =
            notification.target ||
            "ALL";


      console.log(
          "📨 Push request:",
          {
            title,
            target,
          },
      );


      // ========================================
      // GET FCM TOKENS
      // ========================================

      let tokenQuery =
            admin
                .firestore()
                .collection("fcmTokens");


      if (
        target !== "ALL"
      ) {
        const playerDoc =
                await admin
                    .firestore()
                    .collection("players")
                    .doc(target)
                    .get();


        if (
          !playerDoc.exists
        ) {
          console.log(
              "Player not found:",
              target,
          );

          return;
        }


        const player =
                playerDoc.data();


        const playerEmail =
                player.loginEmail;


        if (!playerEmail) {
          console.log(
              "Player has no loginEmail.",
          );

          return;
        }


        tokenQuery =
                tokenQuery.where(
                    "playerEmail",
                    "==",
                    playerEmail,
                );
      }


      const tokenSnapshot =
            await tokenQuery.get();


      if (
        tokenSnapshot.empty
      ) {
        console.log(
            "No FCM tokens found.",
        );

        return;
      }


      // ========================================
      // COLLECT TOKENS
      // ========================================

      const tokens = [];


      tokenSnapshot.forEach(
          (doc) => {
            const data =
                    doc.data();


            if (
              data.token
            ) {
              tokens.push(
                  data.token,
              );
            }
          },
      );


      if (
        tokens.length === 0
      ) {
        console.log(
            "No valid tokens.",
        );

        return;
      }


      console.log(
          `📱 Sending to ${tokens.length} device(s)`,
      );


      // ========================================
      // FCM MESSAGE
      // ========================================

      const multicastMessage = {

        notification: {

          title: title,

          body: message,

        },


        data: {

          title: title,

          body: message,

          url: link,

        },


        webpush: {

          notification: {

            title: title,

            body: message,

            icon:
                        "/images/logo/logo.png",

            badge:
                        "/images/logo/logo.png",

            tag:
                        "4fu-notification",

            renotify:
                        true,

          },


          fcmOptions: {

            link:
                        link,

          },

        },


        tokens: tokens,

      };


      // ========================================
      // SEND
      // ========================================

      const response =
            await admin
                .messaging()
                .sendEachForMulticast(
                    multicastMessage,
                );


      console.log(
          "✅ FCM sent:",
          response.successCount,
      );


      console.log(
          "❌ FCM failed:",
          response.failureCount,
      );


      // ========================================
      // DELETE INVALID TOKENS
      // ========================================

      const batch =
            admin
                .firestore()
                .batch();


      let deleteCount = 0;


      response.responses.forEach(
          (result, index) => {
            if (
              !result.success
            ) {
              const errorCode =
                        result.error &&
                        result.error.code;


              if (
                errorCode ===
                        "messaging/registration-token-not-registered" ||
                        errorCode ===
                        "messaging/invalid-registration-token"
              ) {
                const token =
                            tokens[index];


                const tokenDoc =
                            tokenSnapshot.docs.find(
                                (doc) =>
                                  doc.data()
                                      .token ===
                                    token,
                            );


                if (tokenDoc) {
                  batch.delete(
                      tokenDoc.ref,
                  );

                  deleteCount++;
                }
              }
            }
          },
      );


      if (
        deleteCount > 0
      ) {
        await batch.commit();

        console.log(
            `🗑️ Removed ${deleteCount} invalid token(s).`,
        );
      }
    },
);
