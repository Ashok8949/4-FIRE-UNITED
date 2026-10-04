importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:"AIzaSyBS7S43uJdMtXCL1j4CKanXK6W_Fpq9MQg",
  authDomain:"fire-united.firebaseapp.com",
  projectId:"fire-united",
  storageBucket:"fire-united.firebasestorage.app",
  messagingSenderId:"643603449722",
  appId:"1:643603449722:web:8a8952c317a3cecffe78c3"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  if(payload.notification) return;
  const data=payload.data||{};
  const title=data.title||"4 FIRE UNITED";
  const body=data.body||"You have a new notification.";
  const url=data.url||"/player-dashboard.html";
  self.registration.showNotification(title,{body,icon:data.icon||"/images/logo/logo.png",badge:data.icon||"/images/logo/logo.png",tag:"4fu-notification",renotify:true,data:{url}});
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=event.notification?.data?.url||"/player-dashboard.html";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if("focus" in client && client.url.includes(location.origin))
        return client.navigate(url).then(()=>client.focus());
    }
    return clients.openWindow ? clients.openWindow(url) : undefined;
  }));
});
