import {ArrowUpRight,Check,Crown,LockKeyhole,ShieldCheck,Sparkles,Zap} from "lucide-react";
import {useEffect,useState} from "react";
import {onAuthStateChanged,type User} from "firebase/auth";
import {auth} from "../services/firebase/client";
import {Link} from "react-router-dom";

const WORKER="https://4fu-freefire-backend.4fu-freefire-backend.workers.dev";
async function readStatus(user:User){const token=await user.getIdToken();const r=await fetch(WORKER+"/pro/status",{headers:{Authorization:"Bearer "+token,Accept:"application/json"},cache:"no-store"});const d=await r.json().catch(()=>({}));if(!r.ok||d?.success===false)throw new Error(d?.error||"PRO status unavailable");return d}
export function Pro(){
 const [user,setUser]=useState<User|null>(null),[active,setActive]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{const off=onAuthStateChanged(auth,async u=>{setUser(u);setLoading(true);setError("");if(!u){setLoading(false);return}try{const d=await readStatus(u);setActive(Boolean(d?.active??d?.proActive??d?.entitlement?.active))}catch(e:any){setError(e?.message||"Unable to read PRO status")}finally{setLoading(false)}});return off},[]);
 return <div className="page pro-page"><div className="page-hero compact"><span className="kicker">4FU PREMIUM / MEMBERSHIP CORE</span><h1>PLAY <em>PRO.</em></h1><p>Premium identity, advanced player intelligence and showcase tools — powered by the existing 4FU PRO + Razorpay system.</p></div>
  <section className="pro-hero"><div className="pro-crown"><Crown/></div><div><span className="kicker">{active?"MEMBERSHIP ACTIVE":"PREMIUM ACCESS"}</span><h2>{active?"4FU PRO IS ONLINE.":"UNLOCK THE 4FU PRO LAYER."}</h2><p>{active?"Your existing PRO entitlement is active. Open the full PRO Hub to manage themes, achievements, effects, share card and premium tools.":"Get the full premium identity layer for ₹49/month through the existing secure Razorpay checkout."}</p><div className="pro-actions">{user?<a className="primary" href="/pro.html">{active?"OPEN PRO HUB":"GET 4FU PRO — ₹49/MONTH"} <ArrowUpRight size={16}/></a>:<Link className="primary" to="/player-login">PLAYER LOGIN <ArrowUpRight size={16}/></Link>}<Link className="secondary" to="/analytics"><Zap size={15}/> VIEW ANALYTICS</Link></div></div><div className="pro-status"><ShieldCheck/><b>{loading?"CHECKING…":active?"PRO ACTIVE":"PRO LOCKED"}</b><span>{user?user.email:"Login required"}</span></div></section>
  {error&&<div className="media-note"><LockKeyhole/> {error}</div>}
  <section className="pro-feature-grid">{[
   ["PRO IDENTITY","Crown badge, premium title, aura and member identity.",Crown],
   ["ADVANCED INTELLIGENCE","Performance lab, stats surfaces and player comparison.",Sparkles],
   ["PREMIUM SHOWCASE","Clips, gallery, Game Center and premium content surfaces.",Check],
   ["DIGITAL PLAYER CARD","Share-ready identity card with QR/profile access.",ShieldCheck],
   ["THEME LAB","Royal, cyber, cinematic and signature premium themes.",Zap],
   ["PRO DROPS","Achievements, missions, XP and rotating premium rewards.",Crown]
  ].map(([title,text,Icon])=><article key={String(title)}><Icon/><span>{title}</span><h3>{text}</h3></article>)}</section>
  <section className="pro-safety"><div><span className="kicker">LEGACY SYSTEM BRIDGE</span><h2>PAYMENT FLOW <em>STAYS INTACT.</em></h2><p>4FU 2.0 reads the same Firebase Auth entitlement and hands checkout/verification to the existing PRO Hub and Razorpay backend. No payment keys or verification logic are duplicated in the new frontend.</p></div><a className="secondary" href="/pro.html">OPEN LEGACY PRO HUB <ArrowUpRight size={15}/></a></section>
 </div>
}