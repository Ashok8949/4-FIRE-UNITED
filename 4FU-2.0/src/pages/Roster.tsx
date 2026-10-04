import { ArrowUpRight, CircleDot, Crosshair, Crown, Shield, Swords } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { watchPlayers, type Player } from "../services/data";
const icons:any[]=[Crown,Swords,Crosshair,Shield];
const nameOf=(p:Player)=>p.ign||p.playerName||p.name||"4FU PLAYER";
const imageOf=(p:Player)=>p.image||p.photo||p.profileImage||"";
export function Roster(){
 const [players,setPlayers]=useState<Player[]>([]);
 useEffect(()=>watchPlayers(setPlayers),[]);
 return <div className="page"><div className="page-hero"><span className="kicker">4FU / ROSTER</span><h1>THE <em>SQUAD.</em></h1><p>Digital player identities, live status, stats, loadouts and achievements.</p></div>
 <div className="roster-grid">{players.length?players.map((p,i)=>{const Icon=icons[i%icons.length];return <Link className={"player-card "+(p.owner?"owner":"")} to={"/players/"+p.id} key={p.id}>
 <div className="card-top"><span className="level">{p.level?"LV "+p.level:"4FU"}</span><span className="online"><CircleDot size={11}/> {(p.status||"ONLINE").toUpperCase()}</span></div>
 <div className="player-avatar">{imageOf(p)?<img src={imageOf(p)} alt={nameOf(p)}/>:<Icon size={56}/>}<span>0{i+1}</span></div>
 <div className="player-info"><span>{p.role||"4FU PLAYER"}</span><h2>{nameOf(p)}</h2><p>PROFILE • STATS • LOADOUT</p></div>
 <div className="player-foot"><b>{p.owner?"COMMAND":(p.role||"PLAYER")}</b><ArrowUpRight/></div>
 </Link>}) : <div className="media-note">Loading live roster from Firestore…</div>}</div></div>
}