import { ExternalLink, Gamepad2, Smartphone, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase/client";
import { watchPlayerByAuth, type Player } from "../services/data";

type Game = {id:string; name:string; short:string; icon?:string; url?:string; installedUrl?:string; enabled?:boolean; stats?:Record<string,string|number>};

const defaults: Game[] = [
  {id:"free-fire",name:"Free Fire",short:"FF",url:"https://ff.garena.com/"},
  {id:"free-fire-max",name:"Free Fire MAX",short:"FFM",url:"https://ff.garena.com/"},
  {id:"game-3",name:"Coming Soon",short:"4FU",enabled:false}
];

function normalizeGames(p:Player|null):Game[]{
  const raw=p?.games ?? p?.gameCenter ?? p?.selectedGames ?? [];
  if(!Array.isArray(raw)) return defaults;
  const parsed=raw.map((g:any,index:number)=>typeof g==="string"?{id:g.toLowerCase().replace(/\s+/g,"-"),name:g,short:g.slice(0,3).toUpperCase()}:{
    id:g.id||g.slug||"game-"+index,name:g.name||g.title||"4FU Game",short:(g.short||g.name||"GAME").slice(0,3).toUpperCase(),
    icon:g.icon||g.image, url:g.url||g.webUrl, installedUrl:g.installedUrl||g.appUrl, enabled:g.enabled!==false, stats:g.stats
  });
  return parsed.length?parsed:defaults;
}

export function GameCenter(){
 const [p,setP]=useState<Player|null>(null),[user,setUser]=useState<any>(null);
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u); if(u) return watchPlayerByAuth(u.uid,u.email,setP); setP(null)}),[]);
 const games=useMemo(()=>normalizeGames(p),[p]);
 return <div className="page game-center">
  <div className="page-hero"><span className="kicker">PLAYER OS / GAME CENTER</span><h1>YOUR <em>GAMES.</em></h1><p>Sirf selected games yahan show honge. Installed app available ho to direct launch link use karo.</p></div>
  {!user&&<div className="media-note">Login karo to apne personal selected games load honge.</div>}
  <div className="game-center-grid">{games.map(g=><article className={"game-center-card "+(g.enabled===false?"disabled":"")} key={g.id}>
    <div className="game-icon">{g.icon?<img src={g.icon} alt=""/>:<span>{g.short}</span>}</div>
    <div className="game-card-copy"><span>4FU GAME CENTER</span><h2>{g.name}</h2>{g.stats&&<div className="game-stats">{Object.entries(g.stats).slice(0,3).map(([k,v])=><b key={k}>{v}<small>{k}</small></b>)}</div>}</div>
    <div className="game-actions">{g.installedUrl&&<a className="primary" href={g.installedUrl}>OPEN INSTALLED <Smartphone size={14}/></a>}{g.url&&<a className="secondary" href={g.url} target="_blank" rel="noreferrer">GAME PAGE <ExternalLink size={14}/></a>}{g.enabled!==false&&<span className="game-live"><Zap size={12}/> READY</span>}</div>
  </article>)}</div>
  <section className="game-center-note"><Trophy/><div><b>GAME CENTER DATA</b><p>Profile fields supported: 'games', 'gameCenter' or 'selectedGames'. Existing player documents remain compatible.</p></div></section>
 </div>;
}