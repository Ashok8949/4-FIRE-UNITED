"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

type Player = Record<string, unknown> & { id: string };

function value(player: Player, ...keys: string[]) {
  for (const key of keys) {
    const item = player[key];
    if (item !== undefined && item !== null && item !== "") return String(item);
  }
  return "";
}

export default function PlayerProfilePage({ id }: { id: string }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "players", id))
      .then((snap) => {
        if (snap.exists()) setPlayer({ id: snap.id, ...snap.data() } as Player);
      })
      .catch((error) => console.error("4FU player profile error:", error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="profilePage"><div className="profileLoading">Loading player…</div></main>;
  if (!player) return <main className="profilePage"><div className="profileLoading">Player not found.</div></main>;

  const image = value(player, "photo", "image", "profileImage");
  const name = value(player, "ign", "username", "name") || id;
  const fullName = value(player, "name");
  const weaponImage = value(player, "weaponImage", "favWeaponImage");
  const weapon = value(player, "weaponName", "favoriteWeapon", "favWeapon");
  const socials = [
    ["Instagram", "instagram"],
    ["YouTube", "youtube"],
    ["Discord", "discord"],
    ["Facebook", "facebook"],
  ] as const;

  const stats = [
    ["LEVEL", value(player, "level")],
    ["RANK", value(player, "rank")],
    ["KD", value(player, "kd")],
    ["HEADSHOT", value(player, "headshot")],
    ["MATCHES", value(player, "matches")],
    ["BOOYAH", value(player, "booyah")],
  ].filter(([, v]) => v);

  return (
    <main className="profilePage">
      <nav className="profileNav">
        <a href="/players">← ALL PLAYERS</a>
        <span>4 FIRE UNITED</span>
      </nav>

      <section className="profileHero">
        <div className="profileVisual">
          {image ? <img src={image} alt={name} /> : <div className="profilePlaceholder">4FU</div>}
        </div>
        <div className="profileIdentity">
          <p className="kicker">{value(player, "role") || "4FU PLAYER"}</p>
          <h1>{name}</h1>
          {fullName && fullName !== name && <p className="realName">{fullName}</p>}
          <div className="identityMeta">
            {value(player, "uid") && <span>UID {value(player, "uid")}</span>}
            {value(player, "guild") && <span>{value(player, "guild")}</span>}
            {value(player, "country") && <span>{value(player, "country")}</span>}
          </div>
          <div className="profileActions">
            <a className="primaryBtn" href="/team.html">Team</a>
            <a className="ghostBtn" href="/clips.html">Gameplay</a>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="profileStats">
          {stats.map(([label, stat]) => <div key={label}><strong>{stat}</strong><span>{label}</span></div>)}
        </section>
      )}

      {weapon && (
        <section className="weaponPanel">
          <div>
            <p className="kicker">FAVOURITE LOADOUT</p>
            <h2>{weapon}</h2>
            <p>{value(player, "weaponType") || "4FU favourite weapon"}</p>
            {value(player, "weaponQuote") && <blockquote>“{value(player, "weaponQuote")}”</blockquote>}
          </div>
          {weaponImage && <img src={weaponImage} alt={weapon} />}
        </section>
      )}

      <section className="profileDetails">
        {value(player, "language") && <div><span>LANGUAGE</span><strong>{value(player, "language")}</strong></div>}
        {value(player, "since") && <div><span>JOINED</span><strong>{value(player, "since")}</strong></div>}
        {value(player, "role") && <div><span>ROLE</span><strong>{value(player, "role")}</strong></div>}
      </section>

      <section className="socialRow">
        {socials.map(([label, key]) => {
          const href = value(player, key);
          return href ? <a href={href} target="_blank" rel="noreferrer" key={key}>{label} ↗</a> : null;
        })}
      </section>
    </main>
  );
}
