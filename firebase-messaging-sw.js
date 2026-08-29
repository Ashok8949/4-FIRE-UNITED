importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyBS7S43uJdMtXCL1j4CKanXK6W_Fpq9MQg",
    authDomain: "fire-united.firebaseapp.com",
    projectId: "fire-united",
    storageBucket: "fire-united.firebasestorage.app",
    messagingSenderId: "643603449722",
    appId: "1:643603449722:web:8a8952c317a3cecffe78c3",
    measurementId: "G-JC6K4S3R9C",
    databaseURL: "https://fire-united-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "[FCM] Background message:",
        payload
    );

    const notification =
        payload.notification || {};

    const data =
        payload.data || {};

    const title =
        notification.title ||
        data.title ||
        "4 FIRE UNITED";

    const body =
        notification.body ||
        data.body ||
        "You have a new notification.";

    const icon =
        notification.icon ||
        data.icon ||
        "/images/logo/logo.png";

    const url =
        data.url ||
        "/player-dashboard.html";

    self.registration.showNotification(
        title,
        {
            body: body,
            icon: icon,
            badge: icon,
            tag: "4fu-notification",
            renotify: true,
            data: {
                url: url
            }
        }
    );
});

self.addEventListener(
    "notificationclick",
    (event) => {

        event.notification.close();

        const url =
            event.notification?.data?.url ||
            "/player-dashboard.html";

        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then((clientList) => {

                for (const client of clientList) {

                    if (
                        "focus" in client &&
                        client.url.includes(
                            location.origin
                        )
                    ) {

                        return client
                            .navigate(url)
                            .then(() => client.focus());
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(url);
                }

            })

        );

    }
);