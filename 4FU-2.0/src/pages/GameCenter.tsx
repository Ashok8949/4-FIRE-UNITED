import { ExternalLink, Gamepad2, Smartphone, Trophy, Zap } from "lucide-react";
import { useEffect,useMemo,useState } from "react";
import { auth } from "../services/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { watchPlayerByAuth,type Player } from "../services/data";

type Game={id:string;name:string;short?:string;icon?:string;image?:string;url?:string;webUrl?:string;installedUrl?:string;appUrl?:string;enabled?:boolean;stats?:string};
const defaults:Game[]=[
 {id:"free-fire",name:"Free Fire",short:"FF",url:"https://ff.garena.com/",stats:"BATTLE ROYALE"},
 {id:"free-fire-max",name:"Free Fire MAX",short:"MAX",url:"https://ff.garena.com/",stats:"BATTLE ROYALE"},
 {id:"coming-soon",name:"Coming Soon",short:"4FU",stats:"NEXT TITLE"}
];
export function GameCenter(){
 const [player,setPlayer]=useState<Player|null>(null);
 useEffect(()=>onAuthStateChanged(auth,u=>{if(u){return watchPlayerByAuth(u.uid,u.email,setPlayer)}}),[]);
 const games=useMemo<Game[]>(()=>{const raw=player?.games??player?.gameCenter??player?.selectedGames;if(!Array.isArray(raw)||!raw.length)return defaults;return raw.map((g:any,i)=>typeof g==="string"?{id:g,name:g,short:g.slice(0,3).toUpperCase()}:{id:g.id||g.slug||String(i),name:g.name||g.title||"4FU GAME",short:g.short,icon:g.icon,image:g.image,url:g.url||g.webUrl,webUrl:g.webUrl,installedUrl:g.installedUrl||g.appUrl,appUrl:g.appUrl,enabled:g.enabled!==false,stats:g.stats}).filter(g=>g.enabled!==false)},[player]);
 return <div className="page"><div className="page-hero"><span className="kicker">4FU GAME CENTER / PLAYER OS</span><h1>PLAY <em>YOUR WAY.</em></h1><p>Your selected games, launch links and competitive ecosystem in one place.</p></div><div className="game-grid">{games.map(g=><article className="game-card" key={g.id}><div className="game-card-art">{g.image||g.icon?<img src={g.image||g.icon} alt="" />:<Gamepad2 size={38}/>}</div><div className="game-card-copy"><span>{g.stats||"GAME CENTER"}</span><h2>{g.name}</h2><small>{g.short||"4FU"}</small></div><div className="game-card-actions">{g.installedUrl||g.appUrl?<a href={g.installedUrl||g.appUrl} className="game-launch"><Smartphone size={14}/> OPEN INSTALLED</a>:g.url||g.webUrl?<a href={g.url||g.webUrl} target="_blank" rel="noreferrer" className="game-launch"><ExternalLink size={14}/> OPEN GAME</a>:<div className="game-coming"><Trophy size={14}/> COMING SOON</div>}</div></article>)}</div><div className="system-card"><Zap size={16}/><div><b>GAME CENTER READY</b><p>Only games selected on the player profile are shown when configured. Existing profile data remains the source of truth.</p></div></div></div>
}