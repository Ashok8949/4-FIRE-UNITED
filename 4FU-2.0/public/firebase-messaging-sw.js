/* 4FU 2.0 Firebase Messaging Service Worker
 * Background push handler for the existing fire-united Firebase project.
 */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBS7S43uJdMtXCL1j4CKanXK6W_Fpq9MQg",
  authDomain: "fire-united.firebaseapp.com",
  projectId: "fire-united",
  storageBucket: "fire-united.firebasestorage.app",
  messagingSenderId: "643603449722",
  appId: "1:643603449722:web:8a8952c317a3cecffe78c3",
  measurementId: "G-JC6K4S3R9C",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "4FU";
  const body = notification.body || data.body || "New 4FU update";
  const url = data.url || data.click_action || "/4fu-2.0/";

  self.registration.showNotification(title, {
    body,
    icon: notification.icon || "/images/logo/logo.png",
    badge: notification.badge || "/images/logo/logo.png",
    data: { url },
    tag: data.tag || "4fu-notification",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/4fu-2.0/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
