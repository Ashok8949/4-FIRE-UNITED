import {lazy,Suspense} from "react";
import {Navigate,Route,Routes} from "react-router-dom";
import {Shell} from "../components/layout/Shell";
import {AuthGate,AdminGate} from "../security/AuthGate";
import {Home} from "../pages/Home";

const Roster=lazy(()=>import("../pages/Roster").then(m=>({default:m.Roster})));
const Profile=lazy(()=>import("../pages/Profile").then(m=>({default:m.Profile})));
const Tournaments=lazy(()=>import("../pages/Tournaments").then(m=>({default:m.Tournaments})));
const Media=lazy(()=>import("../pages/Media").then(m=>({default:m.Media})));
const Comms=lazy(()=>import("../pages/Comms").then(m=>({default:m.Comms})));
const GameCenter=lazy(()=>import("../pages/GameCenter").then(m=>({default:m.GameCenter})));
const WorldExplorer=lazy(()=>import("../pages/WorldExplorer").then(m=>({default:m.WorldExplorer})));
const Analytics=lazy(()=>import("../pages/Analytics").then(m=>({default:m.Analytics})));
const PlayerOS=lazy(()=>import("../pages/PlayerOS").then(m=>({default:m.PlayerOS})));
const Admin=lazy(()=>import("../pages/Admin").then(m=>({default:m.Admin})));
const Pro=lazy(()=>import("../pages/Pro").then(m=>({default:m.Pro})));

function Loading(){return <div className="route-loading"><div className="route-loading-mark">4FU</div><span>LOADING SYSTEM</span><i/></div>}
export default function App(){return <Shell><Suspense fallback={<Loading/>}><Routes>
<Route path="/" element={<Home/>}/><Route path="/team" element={<Roster/>}/><Route path="/players/:id" element={<Profile/>}/><Route path="/tournaments" element={<Tournaments/>}/><Route path="/media" element={<Media/>}/><Route path="/clips" element={<Media mode="clips"/>}/><Route path="/gallery" element={<Media mode="gallery"/>}/><Route path="/comms" element={<AuthGate><Comms/></AuthGate>}/><Route path="/game-center" element={<AuthGate><GameCenter/></AuthGate>}/><Route path="/world" element={<WorldExplorer/>}/><Route path="/analytics" element={<Analytics/>}/><Route path="/player-os" element={<AuthGate><PlayerOS/></AuthGate>}/><Route path="/player-login" element={<PlayerOS/>}/><Route path="/admin" element={<AdminGate><Admin/></AdminGate>}/><Route path="/pro" element={<Pro/>}/><Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></Suspense></Shell>}
