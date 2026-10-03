"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type Player = Record<string, unknown> & { id: string };

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "players"))
      .then((snap) => {
        const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Player[];
        rows.sort((a, b) => {
          const owner = (v: unknown) => v === true || String(v ?? "").toLowerCase() === "owner";
          if (owner(a.owner) !== owner(b.owner)) return owner(a.owner) ? -1 : 1;
          return Number(a.displayOrder ?? 9999) - Number(b.displayOrder ?? 9999);
        });
        setPlayers(rows);
      })
      .catch((error) => console.error("4FU players error:", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="playersPage">
      <header className="playersHeader">
        <a href="/" className="backLink">← 4FU 2.0</a>
        <p className="kicker">THE 4FU ROSTER</p>
        <h1>MEET THE <em>TEAM.</em></h1>
        <p>Existing player profiles, IDs and Firestore data are preserved while the new experience is introduced.</p>
      </header>

      <section className="rosterGrid">
        {players.map((player) => {
          const image = String(player.photo ?? player.image ?? player.profileImage ?? "");
          const name = String(player.ign ?? player.username ?? player.name ?? player.id);
          return (
            <a className="rosterCard" href={`/players/${encodeURIComponent(player.id)}`} key={player.id}>
              {image ? <img src={image} alt={name} /> : <div className="rosterPlaceholder">4FU</div>}
              <div className="rosterInfo">
                {player.owner ? <span className="ownerTag">OWNER</span> : <span className="roleTag">{String(player.role ?? "PLAYER")}</span>}
                <h2>{name}</h2>
                <p>{String(player.name ?? player.guild ?? "4 FIRE UNITED")}</p>
              </div>
            </a>
          );
        })}
        {!loading && players.length === 0 && <div className="empty">No players found in Firestore.</div>}
        {loading && <div className="empty">Loading 4FU roster…</div>}
      </section>
    </main>
  );
}
