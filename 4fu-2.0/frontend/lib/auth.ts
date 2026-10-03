"use client";

import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut, type User
} from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { app, db } from "./firebase";

const auth = getAuth(app);
let persistenceReady: Promise<void> | null = null;

export function getFirebaseAuth() { return auth; }

export async function prepareAuthPersistence() {
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).then(() => undefined);
  }
  return persistenceReady;
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginPlayer(email: string, password: string) {
  await prepareAuthPersistence();
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function resetPlayerPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function logoutPlayer() { return signOut(auth); }

export async function findPlayerForUser(user: User) {
  let snap = await getDocs(query(
    collection(db, "players"), where("authUid", "==", user.uid), limit(1)
  ));

  if (snap.empty && user.email) {
    snap = await getDocs(query(
      collection(db, "players"), where("loginEmail", "==", user.email), limit(1)
    ));
  }

  if (snap.empty) return null;
  const playerDoc = snap.docs[0];
  return { id: playerDoc.id, ...playerDoc.data() };
}

export function playerLoginError(error: unknown) {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/user-disabled":
      return "This player account has been disabled.";
    default:
      return "Login failed. Please try again.";
  }
}
