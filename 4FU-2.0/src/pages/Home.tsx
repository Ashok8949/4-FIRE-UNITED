import { motion } from "framer-motion";
import { ArrowUpRight, ChevronRight, Crosshair, Gamepad2, Globe2, MessageSquare, Radio, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { ComponentType } from "react";

const cards:[string,string,string,ComponentType<any>][]=[["ROSTER","6 ACTIVE PLAYERS","/team",Users],["TOURNAMENTS","15+ EVENTS","/tournaments",Trophy],["COMMS","REALTIME CHANNEL","/comms",MessageSquare]];
export function Home(){
 return <div className="home">
  <section className="hero">
   <div className="hero-noise"/>
   <motion.div className="hero-copy" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.7}}>
    <div className="eyebrow"><span className="live-dot"/>4FU SYSTEM • ONLINE</div>
    <h1>FIRE<br/><span>UNITED</span></h1>
    <p>Competitive gaming. One identity. One command center. <b>4FU 2.0</b> is the new digital home for the squad, players, tournaments and community.</p>
    <div className="hero-actions"><Link className="primary" to="/team">ENTER THE ROSTER <ArrowUpRight size={16}/></Link><Link className="secondary" to="/tournaments">EXPLORE EVENTS <ChevronRight size={16}/></Link></div>
   </motion.div>
   <motion.div className="hero-orbit" initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:.9}}>
    <div className="orbit-ring ring-a"/><div className="orbit-ring ring-b"/><div className="orbit-core">4FU</div>
    <div className="orbit-label label-a">LIVE</div><div className="orbit-label label-b">GLOBAL</div>
   </motion.div>
  </section>
  <div className="status-strip"><div><span className="live-dot"/>LIVE SYSTEMS OPERATIONAL</div><div>NEXT MATCH <b>COMING SOON</b></div><div>GLOBAL COMMAND <b>ONLINE</b></div></div>
  <section className="section"><div className="section-head"><div><span className="kicker">THE ECOSYSTEM</span><h2>ONE PLATFORM.<br/><em>EVERYTHING 4FU.</em></h2></div><p>Built around the real systems already powering 4FU — now unified into one premium experience.</p></div>
   <div className="pillar-grid">{cards.map(([title,sub,to,Icon])=><Link className="pillar" to={to as string} key={title as string}><Icon size={22}/><span>{title}</span><strong>{sub}</strong><ArrowUpRight/></Link>)}</div>
  </section>
  <section className="feature-band"><div><span className="kicker">PLAYER OS</span><h2>Your squad.<br/><em>Your command.</em></h2><p>Profile, stats, content, Game Center, notifications, chat and PRO — designed like an app, built for 4FU.</p><Link className="primary" to="/player-os">OPEN PLAYER OS <ArrowUpRight size={16}/></Link></div><div className="system-card"><div className="system-top"><span><Radio size={14}/> LIVE CORE</span><span>02.0</span></div><div className="system-main"><Crosshair size={48}/><b>4FU COMMAND</b><span>REALTIME DATA NETWORK</span></div><div className="system-metrics"><div><b>24/7</b><span>STATUS</span></div><div><b>FCM</b><span>ALERTS</span></div><div><b>PRO</b><span>READY</span></div></div></div></section>
  <section className="world-strip"><Globe2/><div><span className="kicker">GLOBAL COMMAND</span><h3>4FU WORLD EXPLORER</h3><p>Players, tournaments and community — connected beyond one screen.</p></div><Link to="/world">EXPLORE <ArrowUpRight size={16}/></Link></section>
 </div>
}