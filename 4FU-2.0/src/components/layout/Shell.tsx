import type { ReactNode } from "react";
import { Flame } from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark"><Flame size={18} /></span>
          <span>4FU</span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="/">Home</a>
          <a href="/team">Roster</a>
          <a href="/tournaments">Tournaments</a>
          <a href="/clips">Clips</a>
          <a href="/gallery">Media</a>
        </nav>
        <a className="nav-cta" href="/player-login">PLAYER OS</a>
      </header>
      <main>{children}</main>
    </div>
  );
}
