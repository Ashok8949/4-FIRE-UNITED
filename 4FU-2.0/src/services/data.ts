import {
  collection, doc, onSnapshot, query, where, limit, type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase/client";

export type Player = {
  id: string;
  name?: string; playerName?: string; ign?: string; role?: string;
  level?: string | number; image?: string; photo?: string; profileImage?: string;
  status?: string; featured?: boolean; owner?: boolean; displayOrder?: number;
  kd?: string | number; headshot?: string | number; uid?: string;
  loginEmail?: string; authUid?: string; [key: string]: any;
};
export type Tournament = {
  id: string; title?: string; name?: string; game?: string; mode?: string;
  date?: any; time?: string; prize?: string; prizePool?: string;
  status?: string; registration?: any; liveLink?: string; [key: string]: any;
};
export type MediaItem = {
  id: string; title?: string; image?: string; thumbnail?: string;
  playerName?: string; videoUrl?: string; clipType?: string;
  category?: string; description?: string; featured?: boolean; createdAt?: any;
  [key: string]: any;
};

const normalize = <T>(snap: any): T[] =>
  snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as T[];

const byNewest = (a: any, b: any) => {
  const value = (x: any) => (x?.createdAt?.toMillis?.() ?? new Date(x?.createdAt || 0).getTime() ?? 0);
  return value(b) - value(a);
};

export function watchPlayers(cb: (rows: Player[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, "players"), limit(100)), (s) => {
    const rows = normalize<Player>(s).sort((a, b) =>
      (a.owner ? -1 : 0) - (b.owner ? -1 : 0) ||
      Number(a.displayOrder ?? 9999) - Number(b.displayOrder ?? 9999)
    );
    cb(rows);
  }, (e) => { console.error("[4FU] players:", e); cb([]); });
}

export function watchPlayer(id: string, cb: (row: Player | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "players", id), (s) =>
    cb(s.exists() ? ({ id: s.id, ...s.data() } as Player) : null),
    () => cb(null)
  );
}

export function watchPlayerByAuth(uid: string, email: string | null, cb: (row: Player | null) => void): Unsubscribe {
  let unsub: Unsubscribe = () => {};
  const start = (field: string, value: string) => {
    unsub();
    unsub = onSnapshot(query(collection(db, "players"), where(field, "==", value), limit(1)),
      (s) => cb(s.empty ? null : ({ id: s.docs[0].id, ...s.docs[0].data() } as Player)),
      () => cb(null));
  };
  if (uid) start("authUid", uid);
  else if (email) start("loginEmail", email);
  return () => unsub();
}

export function watchTournaments(cb: (rows: Tournament[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, "tournaments"), limit(100)), (s) => {
    const rows = normalize<Tournament>(s);
    rows.sort((a, b) => {
      const da = new Date(a.date || 0).getTime(), dbb = new Date(b.date || 0).getTime();
      return (Number.isFinite(dbb) ? dbb : 0) - (Number.isFinite(da) ? da : 0);
    });
    cb(rows);
  }, (e) => { console.error("[4FU] tournaments:", e); cb([]); });
}

export function watchMedia(collectionName: "gallery" | "clips", cb: (rows: MediaItem[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, collectionName), limit(100)), (s) => {
    const rows = normalize<MediaItem>(s).sort(byNewest);
    cb(rows);
  }, (e) => { console.error("[4FU] "+collectionName+":", e); cb([]); });
}

export function watchCollection<T = any>(name: string, cb: (rows: T[]) => void, count = 50): Unsubscribe {
  return onSnapshot(query(collection(db, name), limit(count)),
    (s) => cb(normalize<T>(s)), () => cb([]));
}


export type ChatMessage = {
  id: string; text?: string; playerId?: string; playerName?: string; playerImage?: string;
  playerEmail?: string; createdAt?: any; [key: string]: any;
};

export type AppNotification = {
  id: string; title?: string; message?: string; body?: string; type?: string;
  isRead?: boolean; createdAt?: any; link?: string; priority?: string; [key: string]: any;
};

export function watchChat(cb: (rows: ChatMessage[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, "chat"), limit(100)), (s) => {
    const rows = normalize<ChatMessage>(s).sort((a,b) => {
      const at=a.createdAt?.toMillis?.() ?? 0, bt=b.createdAt?.toMillis?.() ?? 0;
      return at-bt;
    });
    cb(rows);
  }, (e) => { console.error("[4FU] chat:", e); cb([]); });
}

export function watchNotifications(cb: (rows: AppNotification[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, "notifications"), limit(50)), (s) => {
    const rows = normalize<AppNotification>(s).sort(byNewest);
    cb(rows);
  }, (e) => { console.error("[4FU] notifications:", e); cb([]); });
}
