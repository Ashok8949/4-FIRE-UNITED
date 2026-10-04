import {useEffect,useState,type ReactNode} from "react";
import {onAuthStateChanged,type User} from "firebase/auth";
import {Navigate,useLocation} from "react-router-dom";
import {auth} from "../services/firebase/client";

export const ADMIN_EMAILS=["aks303603@gmail.com"];

export function AuthGate({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setReady(true)}),[]);
 if(!ready)return <div className="security-gate"><div className="security-gate-card"><span className="kicker">4FU SECURITY CORE</span><h2>VERIFYING SESSION</h2><p>Checking Firebase authentication…</p></div></div>;
 if(!user)return <Navigate to="/player-login" replace/>;
 return <>{children}</>;
}
export function AdminGate({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false); const location=useLocation();
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setReady(true)}),[]);
 if(!ready)return <div className="security-gate"><div className="security-gate-card"><span className="kicker">4FU ADMIN SECURITY</span><h2>VERIFYING AUTHORITY</h2><p>Checking authorized Firebase admin session…</p></div></div>;
 const allowed=!!user?.email&&ADMIN_EMAILS.includes(user.email.toLowerCase());
 if(!allowed)return <Navigate to="/player-login" state={{from:location.pathname}} replace/>;
 return <>{children}</>;
}
