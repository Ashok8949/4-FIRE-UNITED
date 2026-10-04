import {ArrowUpRight,BadgeCheck,Download,Gamepad2,QrCode,Share2,Swords,Trophy,X,Zap} from "lucide-react";
import {useEffect,useState} from "react";
import {useParams,Link} from "react-router-dom";
import QRCode from "qrcode";
import {watchPlayer,type Player} from "../services/data";

export function Profile(){
 const {id}=useParams(); const [p,setP]=useState<Player|null>(null); const [showId,setShowId]=useState(false); const [qr,setQr]=useState("");
 useEffect(()=>id?watchPlayer(id,setP):()=>{},[id]);
 const name=p?.ign||p?.playerName||p?.name||"4FU PLAYER"; const image=p?.image||p?.photo||p?.profileImage;
 const profileUrl=`${window.location.origin}/players/${encodeURIComponent(id||"")}`;
 useEffect(()=>{let live=true; QRCode.toDataURL(profileUrl,{width:220,margin:1,errorCorrectionLevel:"M"},(err,url)=>{if(live&&!err)setQr(url)});return()=>{live=false}},[profileUrl]);
 const shareId=async()=>{try{if(navigator.share)await navigator.share({title:`4FU Digital ID — ${name}`,text:`Verified 4FU player profile: ${name}`,url:profileUrl});else await navigator.clipboard?.writeText(profileUrl)}catch{}};
 return <div className="page">
  <div className="profile-head"><div className="profile-mark">4FU</div><div><span className="kicker">DIGITAL PLAYER ID / {id?.toUpperCase()}</span><h1>{name} <em>PROFILE.</em></h1><p><BadgeCheck/> VERIFIED 4FU PLAYER</p></div><button className="secondary" onClick={shareId}><Share2 size={15}/> SHARE ID</button></div>
  {!p?<div className="media-note">Loading player intelligence from Firestore…</div>:<div className="profile-layout">
   <section className="profile-card"><div className="profile-card-top"><span>4FU DIGITAL ID</span><button className="profile-qr-trigger" aria-label="Open QR" onClick={()=>setShowId(true)}><QrCode/></button></div>
    <div className="profile-big">{image?<img src={image} alt={name}/>:<>04<span>FU</span></>}</div><div className="profile-name"><b>{p.role||"4FU PLAYER"}</b><h2>{name}</h2><span>{p.owner?"TEAM OWNER":"4FU ROSTER"}</span></div>
    <div className="profile-stats"><div><b>{p.booyahs??p.wins??"—"}</b><span>BOOYAHS</span></div><div><b>{p.matches??"—"}</b><span>MATCHES</span></div><div><b>{p.level??"—"}</b><span>LEVEL</span></div></div>
   </section>
   <section className="dashboard-panel"><div className="panel-title"><span>PLAYER INTELLIGENCE</span><Zap/></div><div className="stat-grid"><div><Swords/><b>{p.kd??"—"}</b><span>K/D</span></div><div><Trophy/><b>{p.headshot??"—"}</b><span>HEADSHOT</span></div><div><Gamepad2/><b>{p.game||"FREE FIRE"}</b><span>GAME CENTER</span></div></div>
    <div className="loadout"><span>FAVORITE LOADOUT</span><div><b>{p.favoriteWeapon||p.favWeapon||"M1887"}</b><b>{p.weapon2||"XM8"}</b><b>{p.weapon3||"AC80"}</b></div></div>
    <button className="primary profile-id-button" onClick={()=>setShowId(true)}><QrCode size={16}/> OPEN DIGITAL ID <ArrowUpRight size={16}/></button>
    <Link className="secondary profile-os-link" to="/player-os">OPEN FULL PLAYER OS <ArrowUpRight size={15}/></Link>
   </section>
  </div>}
  {showId&&p&&<div className="id-modal-backdrop" onClick={()=>setShowId(false)}><section className="id-modal" onClick={e=>e.stopPropagation()}>
   <button className="id-close" onClick={()=>setShowId(false)} aria-label="Close"><X/></button>
   <div className="id-card"><div className="id-card-top"><span>4FU / DIGITAL PLAYER ID</span><b>VERIFIED</b></div>
    <div className="id-card-main"><div className="id-avatar">{image?<img src={image} alt={name}/>:<span>04<span>FU</span></span>}</div>
     <div className="id-copy"><small>PLAYER / {id?.toUpperCase()}</small><h2>{name}</h2><p>{p.role||"4FU PLAYER"} · {p.owner?"TEAM OWNER":"4FU ROSTER"}</p><div className="id-stats"><b>{p.booyahs??p.wins??"—"}<small>BOOYAHS</small></b><b>{p.matches??"—"}<small>MATCHES</small></b><b>{p.level??"—"}<small>LEVEL</small></b><b>{p.kd??"—"}<small>K/D</small></b></div></div>
     <div className="id-qr">{qr?<img src={qr} alt="Scan to open 4FU player profile"/>:<span>GENERATING QR…</span>}<small>SCAN TO OPEN PROFILE</small></div></div>
    <div className="id-loadout"><span>LOADOUT</span><b>{p.favoriteWeapon||p.favWeapon||"M1887"}</b><b>{p.weapon2||"XM8"}</b><b>{p.weapon3||"AC80"}</b><span className="id-url">{profileUrl}</span></div>
    <div className="id-footer"><strong>4 FIRE UNITED</strong><span>THE DIGITAL HOME OF 4FU</span></div></div>
   <div className="id-actions"><button className="secondary" onClick={shareId}><Share2 size={15}/> SHARE</button>{qr&&<a className="secondary" href={qr} download={`4FU-${id}-QR.png`}><Download size={15}/> QR PNG</a>}<a className="primary" href={profileUrl} target="_blank" rel="noreferrer">OPEN PROFILE <ArrowUpRight size={15}/></a></div>
  </section></div>}
 </div>
}