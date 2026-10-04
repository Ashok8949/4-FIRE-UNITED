import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getMessaging, isSupported } from "firebase/messaging";
import { auth, app } from "./client";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BKo62PUl4wx45hd5L1f242RudXVdvPK6dxSEZcTHGcQ4Ulv_Ursp-J-ivRB0EIxE0NCj7ueeV1CAE7WWtwnKK34";

async function messagingInstance(){
  if(typeof window==="undefined") return null;
  if(!(await isSupported())) return null;
  return getMessaging(app);
}

export async function request4FUPushPermission(){
  if(typeof Notification==="undefined") return {permission:"unsupported"};
  const permission=await Notification.requestPermission();
  if(permission!=="granted") return {permission};
  const messaging=await messagingInstance();
  if(!messaging) return {permission:"unsupported"};
  const registration=await navigator.serviceWorker.register("/4fu-2.0/firebase-messaging-sw.js");
  const token=await getToken(messaging,{vapidKey:VAPID_KEY,serviceWorkerRegistration:registration});
  if(token){
    const user=auth.currentUser;
    await addDoc(collection(db,"fcmTokens"),{
      token,uid:user?.uid||null,email:user?.email||null,platform:"web",updatedAt:serverTimestamp()
    });
  }
  return {permission,token};
}

export async function listen4FUForegroundMessages(handler:(payload:MessagePayload)=>void){
  const messaging=await messagingInstance();
  if(!messaging) return ()=>{};
  return onMessage(messaging,handler);
}
