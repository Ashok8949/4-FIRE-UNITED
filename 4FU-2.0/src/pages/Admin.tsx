import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, Database, FileVideo, GalleryHorizontal, LayoutDashboard, Megaphone, MessageSquare, Search, Settings, ShieldCheck, Trophy, Users, ExternalLink } from "lucide-react";
import { watchCollection } from "../services/data"; import { auth } from "../services/firebase/client"; import { signOut } from "firebase/auth";

type AdminCollection = Record<string, any>;
const modules = [
  ["Players", Users, "players.html", "players"], ["Tournaments", Trophy, "tournaments.html", "tournaments"],
  ["Gallery", GalleryHorizontal, "gallery.html", "gallery"], ["Clips", FileVideo, "clips.html", "clips"],
  ["Applications", ShieldCheck, "applications.html", "applications"], ["Messages", MessageSquare, "messages.html", "messages"],
  ["Announcements", Megaphone, "announcements.html", "notifications"], ["Notifications", Bell, "notifications.html", "notifications"],
  ["Analytics", Activity, "dashboard.html", "stats"], ["Settings", Settings, "settings.html", "settings"],
] as const;

export function Admin() {
  const [data, setData] = useState<Record<string, AdminCollection[]>>({});
  const [query, setQuery] = useState("");

  useEffect(() => {
    const unsubs = [
      watchCollection("players", r => setData(d => ({...d, players:r}))),
      watchCollection("tournaments", r => setData(d => ({...d, tournaments:r}))),
      watchCollection("gallery", r => setData(d => ({...d, gallery:r}))),
      watchCollection("clips", r => setData(d => ({...d, clips:r}))),
      watchCollection("joinApplications", r => setData(d => ({...d, applications:r}))),
      watchCollection("contactMessages", r => setData(d => ({...d, messages:r}))),
      watchCollection("notifications", r => setData(d => ({...d, notifications:r}))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const stats = useMemo(() => ({
    players:data.players?.length ?? 0, tournaments:data.tournaments?.length ?? 0, gallery:data.gallery?.length ?? 0,
    clips:data.clips?.length ?? 0, applications:data.applications?.length ?? 0, messages:data.messages?.length ?? 0,
    notifications:data.notifications?.length ?? 0
  }), [data]);

  const filtered = modules.filter(([n]) => n.toLowerCase().includes(query.toLowerCase()));

  return <div className="admin-page">
    <aside className="admin-side">
      <div className="admin-brand"><span>4</span>FU <small>COMMAND CENTER</small></div>
      <a className="active" href="#dashboard"><LayoutDashboard/><span>Dashboard</span></a>
      {filtered.map(([n, Icon, page, key]) => <a href={page} key={n}>
        <Icon/><span>{n}</span>{key !== "stats" && key !== "settings" && <b>{stats[key as keyof typeof stats]}</b>}<ExternalLink size={12}/>
      </a>)}
    </aside>

    <section className="admin-main">
      <header className="admin-head">
        <div><span className="kicker">4FU / ADMIN</span><h1>COMMAND <em>CENTER.</em></h1></div>
        <div className="admin-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search modules…"/><kbd>⌘K</kbd></div>
      </header>

      <div className="admin-security-strip"><ShieldCheck/><span><b>AUTHORIZED ADMIN SESSION</b>{auth.currentUser?.email}</span><button onClick={()=>signOut(auth)}>SIGN OUT</button></div><div className="admin-status">
        <div><Activity/><span>SYSTEM HEALTH<b>OPERATIONAL</b></span></div>
        <div><Database/><span>FIRESTORE<b>LIVE DATA</b></span></div>
        <div><Bell/><span>FCM<b>LEGACY PUSH CORE</b></span></div>
      </div>

      <div className="admin-grid">
        <div className="admin-panel wide">
          <div className="panel-title"><span>LIVE DATA CORE</span><span>REALTIME</span></div>
          <div className="admin-metric-grid">
            {[["PLAYERS",stats.players,"players.html"],["EVENTS",stats.tournaments,"tournaments.html"],["GALLERY",stats.gallery,"gallery.html"],["CLIPS",stats.clips,"clips.html"],["APPLICATIONS",stats.applications,"applications.html"],["MESSAGES",stats.messages,"messages.html"]].map(([label,value,href]) =>
              <a className="admin-metric" href={href as string} key={label as string}><strong>{value as number}</strong><span>{label as string}</span><ExternalLink size={13}/></a>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="panel-title"><span>ADMIN CORE</span></div>
          <strong className="big-number">{stats.notifications}</strong><span>NOTIFICATIONS</span>
          <div className="mini-bar"><i style={{width:stats.notifications ? "100%" : "8%"}}/></div>
          <small>Live notifications collection</small>
          <a className="admin-primary-link" href="notifications.html">OPEN NOTIFICATION CENTER →</a>
        </div>

        <div className="admin-panel wide">
          <div className="panel-title"><span>CMS BRIDGE</span><span>PRODUCTION-SAFE</span></div>
          <p className="admin-copy">4FU 2.0 is reading the same Firestore collections as the existing admin CMS. Management actions continue through the proven legacy CMS until each module is fully migrated, keeping current upload, auth, Cloudinary, FCM and payment workflows intact.</p>
          <div className="admin-actions"><a href="dashboard.html">OPEN LEGACY DASHBOARD</a><a href="notifications.html">SEND PUSH / FCM</a><a href="players.html">MANAGE PLAYERS</a></div>
        </div>
      </div>
    </section>
  </div>;
}