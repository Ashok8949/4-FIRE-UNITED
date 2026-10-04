import {motion} from "framer-motion";
import {ArrowUpRight,Globe2,MapPin,Radio,Shield,Users,Wifi} from "lucide-react";
import {useMemo,useState} from "react";

const regions=[
 {code:"IND",name:"INDIA",city:"Rajasthan / Jaipur",players:6,status:"ACTIVE",x:"62%",y:"48%",hot:true},
 {code:"SGP",name:"SINGAPORE",city:"Southeast Asia",players:0,status:"OPEN",x:"67%",y:"62%"},
 {code:"BR",name:"BRAZIL",city:"South America",players:0,status:"OPEN",x:"31%",y:"63%"},
 {code:"AE",name:"UAE",city:"Middle East",players:0,status:"OPEN",x:"55%",y:"48%"},
 {code:"US",name:"UNITED STATES",city:"North America",players:0,status:"OPEN",x:"22%",y:"39%"},
 {code:"EU",name:"EUROPE",city:"Europe",players:0,status:"OPEN",x:"48%",y:"35%"}
];

export function WorldExplorer(){
 const [selected,setSelected]=useState(regions[0]);
 const active=useMemo(()=>regions.filter(r=>r.players>0).length,[regions]);
 return <div className="page world-page">
  <div className="page-hero compact"><span className="kicker">4FU GLOBAL COMMAND / WORLD EXPLORER</span><h1>THE WORLD IS<br/><em>CONNECTED.</em></h1><p>4FU presence, player reach and competitive activity — visualized as one global command layer.</p></div>
  <section className="world-command">
   <div className="world-viewport">
    <div className="world-grid-lines"/>
    <div className="world-globe"><div className="globe-core"/><div className="globe-lat lat-1"/><div className="globe-lat lat-2"/><div className="globe-lat lat-3"/><div className="globe-ring ring-1"/><div className="globe-ring ring-2"/>
      {regions.map(r=><button key={r.code} className={`world-node ${selected.code===r.code?"selected":""} ${r.hot?"hot":""}`} style={{left:r.x,top:r.y}} onClick={()=>setSelected(r)} aria-label={r.name}><i/><span>{r.code}</span></button>)}
    </div>
    <div className="world-telemetry"><span><i/> LIVE NETWORK</span><b>4FU / GLOBAL</b></div>
   </div>
   <aside className="world-panel">
    <div className="world-panel-head"><span>REGION INTELLIGENCE</span><Globe2/></div>
    <div className="world-selected"><small>SELECTED REGION</small><h2>{selected.name}</h2><p><MapPin size={12}/> {selected.city}</p><div className="world-selected-stats"><div><b>{selected.players}</b><span>PLAYERS</span></div><div><b>{selected.status}</b><span>NETWORK</span></div></div></div>
    <div className="world-region-list">{regions.map(r=><button key={r.code} className={selected.code===r.code?"active":""} onClick={()=>setSelected(r)}><span><i className={r.players?"node-live":""}/>{r.name}</span><b>{r.players||"—"}</b></button>)}</div>
   </aside>
  </section>
  <section className="world-metrics"><div><Users/><b>6</b><span>CONNECTED PLAYERS</span></div><div><Radio/><b>{active||1}</b><span>ACTIVE REGIONS</span></div><div><Wifi/><b>24/7</b><span>NETWORK STATUS</span></div><div><Shield/><b>4FU</b><span>IDENTITY CORE</span></div></section>
  <section className="world-command-note"><div><span className="kicker">COMMAND LAYER</span><h2>FROM LOCAL SQUAD<br/><em>TO GLOBAL NETWORK.</em></h2><p>The map is designed as a live 4FU surface. As player, tournament and community location data grows, region intelligence can be connected without changing the visual command layer.</p></div><a className="primary" href="/team">VIEW ROSTER <ArrowUpRight size={16}/></a></section>
 </div>
}