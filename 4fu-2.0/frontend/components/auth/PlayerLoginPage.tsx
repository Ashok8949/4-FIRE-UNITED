"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFirebaseAuth, loginPlayer, prepareAuthPersistence, resetPlayerPassword,
  subscribeToAuth, findPlayerForUser, playerLoginError
} from "@/lib/auth";

export default function PlayerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    prepareAuthPersistence().catch(console.error);
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) { setChecking(false); return; }
      try {
        const player = await findPlayerForUser(user);
        if (player) { router.replace("/dashboard"); return; }
        await getFirebaseAuth().signOut();
        setMessage("Your Firebase account is not linked with a 4FU player.");
      } catch (error) {
        console.error("4FU auto-login failed:", error);
      } finally {
        setChecking(false);
      }
    });
    return unsubscribe;
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (!email.trim() || !password) {
      setMessage("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginPlayer(email, password);
      const player = await findPlayerForUser(result.user);
      if (!player) {
        await getFirebaseAuth().signOut();
        throw new Error("PLAYER_ACCOUNT_NOT_LINKED");
      }
      localStorage.setItem("4fuPlayerId", player.id);
      localStorage.setItem("4fuPlayerUid", result.user.uid);
      router.replace("/dashboard");
    } catch (error) {
      setMessage((error as Error)?.message === "PLAYER_ACCOUNT_NOT_LINKED"
        ? "Your account is not linked with a 4FU player."
        : playerLoginError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setMessage("");
    setSuccess(false);
    if (!email.trim()) { setMessage("Enter your email first."); return; }
    try {
      await resetPlayerPassword(email);
      setSuccess(true);
      setMessage("Password reset email sent. Check your inbox.");
    } catch {
      setMessage("Unable to send reset email. Check the email and try again.");
    }
  }

  if (checking) {
    return <main className="auth-page"><div className="auth-card loading-card">Checking 4FU player session…</div></main>;
  }

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">4FU</div>
          <div>
            <div className="auth-title">4 FIRE UNITED</div>
            <div className="auth-subtitle">PLAYER CONTROL PANEL · 2.0</div>
          </div>
        </div>

        <div className="auth-heading">
          <span className="eyebrow">AUTHORIZED ACCESS</span>
          <h1>Player Login</h1>
          <p>Sign in with the same Firebase player account used by the existing 4FU system.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@4fu.gg" autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></label>
          <div className="auth-options">
            <span className="remember">✓ Remember me</span>
            <button type="button" className="text-button" onClick={handleForgotPassword}>Forgot password?</button>
          </div>
          <button className="auth-submit" disabled={loading}>{loading ? "AUTHENTICATING…" : "ENTER 4FU"}</button>
        </form>

        {message && <div className={success ? "auth-message success" : "auth-message"}>{message}</div>}

        <div className="auth-footer"><span>Firebase Auth</span><span>•</span><span>Firestore player verification</span></div>
      </section>
    </main>
  );
}
