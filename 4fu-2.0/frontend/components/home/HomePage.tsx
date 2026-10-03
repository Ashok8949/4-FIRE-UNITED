"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

type Player = {
  id: string;
  ign?: string;
  name?: string;
  username?: string;
  photo?: string;
  image?: string;
  role?: string;
  level?: string | number;
  featured?: boolean;
};

type Clip = {
  id: string;
  title?: string;
  thumbnail?: string;
  image?: string;
  videoUrl?: string;
  url?: string;
};

type Announcement = {
  id: string;
  title?: string;
  message?: string;
};

type Tournament = {
  id: string;
  title?: string;
  name?: string;
  date?: unknown;
};

function textValue(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  }
  return String(value);
}

export default function HomePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHome() {
      try {
        const [
          playerSnap,
          clipSnap,
          announcementSnap,
          tournamentSnap,
          visitorSnap,
        ] = await Promise.all([
          getDocs(query(
            collection(db, "players"),
            where("featured", "==", true),
            limit(6)
          )),
          getDocs(query(
            collection(db, "clips"),
            orderBy("createdAt", "desc"),
            limit(3)
          )),
          getDocs(query(
            collection(db, "announcements"),
            orderBy("date", "desc"),
            limit(1)
          )),
          getDocs(query(
            collection(db, "tournaments"),
            orderBy("date", "desc"),
            limit(1)
          )),
          getDoc(doc(db, "stats", "visitors")),
        ]);

        if (!active) return;

        setPlayers(playerSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Player[]);

        setClips(clipSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Clip[]);

        setAnnouncement(
          announcementSnap.docs[0]
            ? ({ id: announcementSnap.docs[0].id, ...announcementSnap.docs[0].data() } as Announcement)
            : null
        );

        setTournament(
          tournamentSnap.docs[0]
            ? ({ id: tournamentSnap.docs[0].id, ...tournamentSnap.docs[0].data() } as Tournament)
            : null
        );

        const visitors = visitorSnap.data();
        const count = visitors?.count ?? visitors?.total ?? visitors?.visitors;
        setVisitorCount(typeof count === "number" ? count : null);
      } catch (error) {
        console.error("4FU 2.0 home data error:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHome();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="home">
      <nav className="nav">
        <div className="brand"><span>4</span> FIRE UNITED</div>
        <div className="navLinks">
          <a href="#players">Players</a>
          <a href="#clips">Clips</a>
          <a href="#tournament">Tournament</a>
          <a href="/player-login.html">Player Login</a>
        </div>
      </nav>

      <section className="heroV2">
        <div className="heroGlow" />
        <div className="heroCopy">
          <p className="kicker">EST. 4FU • ESPORTS • INDIA</p>
          <h1>PLAY <em>HARD.</em><br />LEAD <em>LOUD.</em></h1>
          <p className="heroText">
            The 4 FIRE UNITED experience is being rebuilt on a modern TypeScript
            foundation while your existing Firebase platform stays live.
          </p>
          <div className="heroActions">
            <a className="primaryBtn" href="#players">Explore Team</a>
            <a className="ghostBtn" href="/tournaments.html">Tournaments →</a>
          </div>
        </div>
        <div className="heroPanel">
          <div className="panelLabel">LIVE PLATFORM</div>
          <div className="panelNumber">2.0</div>
          <p>Modern frontend<br />Firebase compatible</p>
        </div>
      </section>

      <section className="statsRow">
        <div><strong>{loading ? "—" : players.length}</strong><span>Featured Players</span></div>
        <div><strong>{loading ? "—" : clips.length}</strong><span>Latest Clips</span></div>
        <div><strong>{visitorCount ?? "—"}</strong><span>Visitors</span></div>
        <div><strong>{tournament ? "LIVE" : "—"}</strong><span>Latest Tournament</span></div>
      </section>

      {announcement && (
        <section className="announcement">
          <span>ANNOUNCEMENT</span>
          <div>
            <strong>{announcement.title ?? "4FU Update"}</strong>
            <p>{announcement.message ?? "New update available."}</p>
          </div>
        </section>
      )}

      <section id="players" className="section">
        <div className="sectionHead">
          <div><p className="kicker">THE ROSTER</p><h2>Featured Players</h2></div>
          <a href="/players">View full team →</a>
        </div>
        <div className="playerGrid">
          {players.map((player) => {
            const image = player.photo ?? player.image;
            return (
              <article className="playerCard" key={player.id}>
                {image ? <img src={image} alt={player.ign ?? player.name ?? "4FU Player"} /> : <div className="playerPlaceholder">4FU</div>}
                <div className="playerOverlay">
                  <span>{player.role ?? "PLAYER"}</span>
                  <h3>{player.ign ?? player.username ?? player.name ?? player.id}</h3>
                  {player.level && <small>LEVEL {player.level}</small>}
                </div>
              </article>
            );
          })}
          {!loading && players.length === 0 && <div className="empty">No featured players found.</div>}
        </div>
      </section>

      <section id="clips" className="section">
        <div className="sectionHead">
          <div><p className="kicker">CONTENT</p><h2>Latest Gameplay</h2></div>
          <a href="/clips.html">View all clips →</a>
        </div>
        <div className="clipGrid">
          {clips.map((clip) => {
            const image = clip.thumbnail ?? clip.image;
            return (
              <a className="clipCard" href={clip.videoUrl ?? clip.url ?? "/clips.html"} key={clip.id}>
                {image ? <img src={image} alt={clip.title ?? "4FU gameplay clip"} /> : <div className="clipPlaceholder">4FU CLIP</div>}
                <div><span>GAMEPLAY</span><h3>{clip.title ?? "4FU Gameplay"}</h3></div>
              </a>
            );
          })}
          {!loading && clips.length === 0 && <div className="empty">No clips found.</div>}
        </div>
      </section>

      <section id="tournament" className="tournamentBanner">
        <div>
          <p className="kicker">COMPETE WITH 4FU</p>
          <h2>{tournament?.title ?? tournament?.name ?? "Next Tournament"}</h2>
          <p>{tournament ? textValue(tournament.date) : "Tournament data will appear here automatically from Firestore."}</p>
        </div>
        <a className="primaryBtn" href="/tournaments.html">Open Tournaments</a>
      </section>

      <footer>
        <strong>4 FIRE UNITED</strong>
        <span>4FU 2.0 • Built for the next generation.</span>
      </footer>
    </main>
  );
}
