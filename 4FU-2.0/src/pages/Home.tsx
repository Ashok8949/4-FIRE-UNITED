import { ArrowUpRight, Flame, Radio, Trophy, Users } from "lucide-react";

const pillars = [
  { icon: Users, label: "ROSTER", value: "4FU PLAYERS" },
  { icon: Trophy, label: "COMPETE", value: "TOURNAMENT CENTER" },
  { icon: Radio, label: "LIVE", value: "4FU COMMS" },
];

export function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-noise" />
        <div className="hero-copy">
          <div className="eyebrow"><Flame size={14} /> 4 FIRE UNITED / 2.0</div>
          <h1>FORGED<br /><span>IN FIRE.</span></h1>
          <p>A new digital home for 4 FIRE UNITED — roster, competition, media, communication and player identity in one esports platform.</p>
          <div className="hero-actions">
            <a className="primary" href="/team">ENTER 4FU <ArrowUpRight size={17} /></a>
            <a className="secondary" href="/tournaments">MATCH CENTER</a>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-core">4FU</div>
          <div className="orbit-ring ring-a" />
          <div className="orbit-ring ring-b" />
        </div>
      </section>
      <section className="status-strip">
        <div><span className="live-dot" /> SYSTEM ONLINE</div>
        <div>4FU 2.0 / NEXT GENERATION ESPORTS PLATFORM</div>
      </section>
      <section className="pillars">
        {pillars.map(({ icon: Icon, label, value }) => (
          <article className="pillar" key={label}>
            <Icon size={22} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
