import { collection, onSnapshot, orderBy, query, limit, type Unsubscribe } from "firebase/firestore"; import { db } from "./firebase/client";
export type Player={id:string;name?:string;role?:string;level?:string;avatar?:string;status?:string;featured?:boolean;displayOrder?:number;[key:string]:any};
export type Tournament={id:string;name?:string;status?:string;format?:string;prizePool?:string;[key:string]:any};
export function watchPlayers(cb:(rows:Player[])=>void):Unsubscribe{const q=query(collection(db,"players"),orderBy("displayOrder","asc"),limit(50));return onSnapshot(q,s=>cb(s.docs.map(d=>({id:d.id,...d.data()} as Player))),()=>cb([]))}
export function watchTournaments(cb:(rows:Tournament[])=>void):Unsubscribe{const q=query(collection(db,"tournaments"),orderBy("createdAt","desc"),limit(50));return onSnapshot(q,s=>cb(s.docs.map(d=>({id:d.id,...d.data()} as Tournament))),()=>cb([]))}
export function watchCollection<T=any>(name:string,cb:(rows:T[])=>void,count=50):Unsubscribe{const q=query(collection(db,name),limit(count));return onSnapshot(q,s=>cb(s.docs.map(d=>({id:d.id,...d.data()} as T))),()=>cb([]))}
