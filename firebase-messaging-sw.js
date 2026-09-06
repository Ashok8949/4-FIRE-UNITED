/* =========================================
   4 FIRE UNITED
   WEB PUSH DISABLED
   ANDROID APP = ONLY PUSH DESTINATION
========================================= */

self.addEventListener("install", (event) => {

    console.log(
        "[4FU] Web push service worker disabled."
    );

    self.skipWaiting();

});


self.addEventListener("activate", (event) => {

    event.waitUntil(

        self.registration
            .unregister()

            .then(() => {

                console.log(
                    "[4FU] Web FCM service worker unregistered."
                );

                return self.clients.matchAll({

                    type: "window",

                    includeUncontrolled: true

                });

            })

            .then((clients) => {

                clients.forEach((client) => {

                    client.postMessage({

                        type:
                            "4FU_WEB_FCM_DISABLED"

                    });

                });

            })

    );

});