import { ArrowUpRight, CalendarDays, Clock3, Trophy } from "lucide-react";
import { useEffect,useState } from "react"; import { Link } from "react-router-dom";
import { watchTournaments,type Tournament } from "../services/data";
export function Tournaments(){
 const [events,setEvents]=useState<Tournament[]>([]); useEffect(()=>watchTournaments(setEvents),[]);
 return <div className="page"><div className="page-hero"><span className="kicker">COMPETITION / CENTER</span><h1>PLAY TO <em>WIN.</em></h1><p>Upcoming, live and completed events — registration and match intelligence in one place.</p></div>
 <div className="event-tabs"><b>ALL EVENTS</b><span>LIVE DATA</span></div><div className="event-list">{events.length?events.map((e,i)=><article className="event-card" key={e.id}><div className="event-index">{String(i+1).padStart(2,"0")}</div><div className="event-icon"><Trophy/></div><div className="event-main"><span>{String(e.status||"UPCOMING").toUpperCase()} • {e.mode||e.game||"4FU EVENT"}</span><h2>{e.title||e.name||"4FU TOURNAMENT"}</h2><p><CalendarDays size={13}/> {e.date||"DATE TBA"} <Clock3 size={13}/> {e.time||"TIME TBA"}</p></div><div className="event-prize"><small>PRIZE</small><b>{e.prize||e.prizePool||"TBA"}</b></div><Link className="round-btn" to="/comms"><ArrowUpRight/></Link></article>):<div className="media-note">Loading tournaments from Firestore…</div>}</div></div>
}