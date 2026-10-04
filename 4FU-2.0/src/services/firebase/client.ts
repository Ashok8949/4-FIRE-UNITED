import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBS7S43uJdMtXCL1j4CKanXK6W_Fpq9MQg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fire-united.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fire-united",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fire-united.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "643603449722",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:643603449722:web:8a8952c317a3cecffe78c3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JC6K4S3R9C",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://fire-united-default-rtdb.asia-southeast1.firebasedatabase.app",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

enableMultiTabIndexedDbPersistence(db).catch((error) => {
  if (!["failed-precondition", "unimplemented"].includes(error.code)) {
    console.warn("[4FU 2.0] Firestore persistence:", error);
  }
});
