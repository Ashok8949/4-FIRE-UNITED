import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { firebaseApp, auth, db } from "./client";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BKo62PUl4wx45hd5L1f242RudXVdvPK6dxSEZcTHGcQ4Ulv_Ursp-J-ivRB0EIxE0NCj7ueeV1CAE7WWtwnKK34";

let messaging: Messaging | null = null;

export async function request4FUPushPermission() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return { supported:false, permission:"unsupported" as const };
  const supported = await isSupported().catch(() => false);
  if (!supported) return { supported:false, permission:"unsupported" as const };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { supported:true, permission };

  messaging ||= getMessaging(firebaseApp);
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

  const user = auth.currentUser;
  if (user && token) {
    await setDoc(doc(db, "fcmTokens", token), {
      token,
      uid:user.uid,
      email:user.email || "",
      updatedAt:serverTimestamp(),
      platform:"web",
    }, { merge:true });
  }

  return { supported:true, permission, token };
}

export async function listen4FUForegroundMessages(handler:(payload:any)=>void) {
  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};
  messaging ||= getMessaging(firebaseApp);
  return onMessage(messaging, handler);
}
