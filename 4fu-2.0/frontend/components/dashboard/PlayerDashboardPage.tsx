"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { db, app } from "@/lib/firebase";
import { findPlayerForUser, logoutPlayer, subscribeToAuth } from "@/lib/auth";

const VAPID_KEY = "BKo62PUl4wx45hd5L1f242RudXVdvPK6dxSEZcTHGcQ4Ulv_Ursp-J-ivRB0EIxE0NCj7ueeV1CAE7WWtwnKK34";

type Player = {
  id: string; name?: string; ign?: string; role?: string; guild?: string; uid?: string;
  rank?: string; level?: number | string; kd?: number | string; headshot?: number | string;
  matches?: number | string; booyah?: number | string; country?: string; since?: string;
  photoURL?: string; image?: string; profileImage?: string; avatar?: string;
  weaponName?: string; weaponType?: string; proActive?: boolean;
};

export default function PlayerDashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [push, setPush] = useState("Push setup pending");

  useEffect(() => {
    let stopPlayer: (() => void) | undefined;

    const stopAuth = subscribeToAuth(async (user) => {
      if (!user) { router.replace("/player-login"); return; }
      setEmail(user.email || "");

      try {
        const found = await findPlayerForUser(user);
        if (!found) {
          setError("Your account is not linked with a 4FU player.");
          setLoading(false);
          return;
        }

        stopPlayer = onSnapshot(doc(db, "players", found.id), (snap) => {
          if (!snap.exists()) setError("Player profile no longer exists.");
          else setPlayer({ id: snap.id, ...(snap.data() as Omit<Player, "id">) });
          setLoading(false);
        });

        await registerPush(found.id, user.uid, user.email || "");
      } catch (e) {
        console.error(e);
        setError("Unable to load your 4FU dashboard.");
        setLoading(false);
      }
    });

    return () => { stopAuth(); stopPlayer?.(); };
  }, [router]);

  async function registerPush(playerId: string, authUid: string, loginEmail: string) {
    try {
      if (!(await isSupported()) || !("Notification" in window)) {
        setPush("Push not supported in this browser");
        return;
      }

      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission !== "granted") { setPush("Push permission is off"); return; }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await getToken(getMessaging(app), {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) { setPush("Push token unavailable"); return; }

      await setDoc(doc(db, "fcmTokens", token), {
        token, playerId, authUid, loginEmail, platform: "4fu-2.0-web", updatedAt: serverTimestamp()
      }, { merge: true });

      setPush("Push notifications enabled");
    } catch (e) {
      console.warn("4FU push registration failed:", e);
      setPush("Push setup needs browser permission");
    }
  }

  async function logout() {
    await logoutPlayer();
    localStorage.removeItem("4fuPlayerId");
    localStorage.removeItem("4fuPlayerUid");
    router.replace("/player-login");
  }

  if (loading) {
    return <main className="dashboard-page"><div className="dashboard-loading">Loading your 4FU command center…</div></main>;
  }

  const displayName = player?.ign || player?.name || "4FU Player";
  const image = player?.photoURL || player?.image || player?.profileImage || player?.avatar || "/images/logo/logo.png";

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="brand-mark">
            <div className="brand-badge">4FU</div>
            <div><strong>4 FIRE UNITED</strong><span>PLAYER COMMAND CENTER · 2.0</span></div>
          </div>
          <div className="dashboard-actions">
            <a href="/player-edit-profile.html" className="dashboard-button secondary">Edit Profile</a>
            <button className="dashboard-button" onClick={logout}>Logout</button>
          </div>
        </header>

        {error && <div className="dashboard-error">{error}</div>}

        {player && <>
          <section className="dashboard-hero">
            <div>
              <span className="eyebrow">PLAYER ONLINE</span>
              <h1>Welcome back, <span>{displayName}</span></h1>
              <p>{player.role || "4FU Player"} · {player.guild || "4FU United"} · {email}</p>
            </div>
            <div className="hero-status"><i /> ACTIVE SESSION</div>
          </section>

          <section className="dashboard-grid">
            <article className="panel profile-card">
              <div className="avatar-wrap">
                <img src={image} alt={displayName} onError={(e) => { e.currentTarget.src = "/images/logo/logo.png"; }} />
              </div>
              <h2>{displayName}</h2>
              <p className="muted">{player.role || "Player"}</p>
              <div className="profile-tags">
                {player.rank && <span>{player.rank}</span>}
                {player.country && <span>{player.country}</span>}
                {player.proActive && <span className="pro-tag">PRO</span>}
              </div>
              <div className="profile-meta">
                <div><span>UID</span><strong>{player.uid || "—"}</strong></div>
                <div><span>Level</span><strong>{player.level || "—"}</strong></div>
                <div><span>Since</span><strong>{player.since || "—"}</strong></div>
              </div>
            </article>

            <section className="panel stats-panel">
              <div className="panel-heading">
                <div><span className="eyebrow">BATTLE PROFILE</span><h2>Performance</h2></div>
                <span className="live-chip">LIVE DATA</span>
              </div>
              <div className="stats-grid">
                <Stat label="K/D" value={player.kd ?? "—"} />
                <Stat label="Headshot" value={player.headshot ?? "—"} />
                <Stat label="Matches" value={player.matches ?? "—"} />
                <Stat label="Booyah" value={player.booyah ?? "—"} />
              </div>
              <div className="weapon-row">
                <span>Favourite Weapon</span>
                <strong>{player.weaponName || "Not set"}</strong>
                <small>{player.weaponType || ""}</small>
              </div>
            </section>
          </section>

          <section className="panel quick-panel">
            <div className="panel-heading"><div><span className="eyebrow">YOUR FEATURES</span><h2>Quick Access</h2></div></div>
            <div className="quick-grid">
              <QuickLink href="/player-dashboard.html" icon="💬" title="Live Chat" text="Existing real-time chat and presence system." />
              <QuickLink href="/player-dashboard.html" icon="🎬" title="My Content" text="Existing clip/photo upload and content manager." />
              <QuickLink href="/gallery.html" icon="🖼️" title="Gallery" text="Live Firebase gallery." />
              <QuickLink href="/clips.html" icon="🔥" title="Clips" text="Latest 4FU gameplay clips." />
              <QuickLink href="/tournaments.html" icon="🏆" title="Tournaments" text="Existing tournament center." />
              <QuickLink href="/pro.html" icon="👑" title="4FU PRO" text="Existing premium membership experience." />
            </div>
          </section>

          <section className="panel system-panel">
            <div>
              <span className="eyebrow">SYSTEM STATUS</span>
              <h2>Firebase services connected</h2>
              <p>2.0 uses the existing Firebase Auth and Firestore player data. Existing collections and notification functions are preserved.</p>
            </div>
            <span className="notification-state">● {push}</span>
          </section>
        </>}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="stat-box"><span>{label}</span><strong>{value}</strong></div>;
}

function QuickLink({ href, icon, title, text }: { href: string; icon: string; title: string; text: string }) {
  return <a href={href} className="quick-link"><span className="quick-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><b>→</b></a>;
}
