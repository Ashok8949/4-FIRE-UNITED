import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "../components/layout/Shell";
import { Home } from "../pages/Home";
import { Roster } from "../pages/Roster";
import { Tournaments } from "../pages/Tournaments";
import { Media } from "../pages/Media";
import { PlayerOS } from "../pages/PlayerOS";
import { Admin } from "../pages/Admin";
import { Profile } from "../pages/Profile";
import { Comms } from "../pages/Comms";

export default function App() {
  return <Shell><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/team" element={<Roster/>}/>
    <Route path="/players/:id" element={<Profile/>}/>
    <Route path="/tournaments" element={<Tournaments/>}/>
    <Route path="/media" element={<Media/>}/>
    <Route path="/clips" element={<Media mode="clips"/>}/>
    <Route path="/gallery" element={<Media mode="gallery"/>}/>
    <Route path="/comms" element={<Comms/>}/>
    <Route path="/player-os" element={<PlayerOS/>}/>
    <Route path="/player-login" element={<PlayerOS/>}/>
    <Route path="/admin" element={<Admin/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></Shell>;
}