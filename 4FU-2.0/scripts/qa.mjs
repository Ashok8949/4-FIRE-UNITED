import {readFileSync,existsSync} from "node:fs";
const root=process.cwd();
const required=[
 "src/main.tsx","src/app/App.tsx","src/services/firebase/client.ts",
 "src/services/firebase/messaging.ts","src/security/AuthGate.tsx",
 "src/pages/Home.tsx","src/pages/Profile.tsx","src/pages/Pro.tsx",
 "src/pages/Admin.tsx","src/pages/Comms.tsx","public/firebase-messaging-sw.js",
 "public/4fu-pwa-sw.js","public/manifest.webmanifest"
];
const missing=required.filter(p=>!existsSync(p));
if(missing.length){console.error("Missing required 4FU 2.0 files:",missing);process.exit(1);}
const app=readFileSync("src/app/App.tsx","utf8");
const routes=["/","/team","/players/:id","/tournaments","/media","/clips","/gallery","/comms","/game-center","/world","/analytics","/player-os","/player-login","/admin","/pro"];
const absent=routes.filter(r=>!app.includes(r));
if(absent.length){console.error("Missing expected routes:",absent);process.exit(1);}
const main=readFileSync("src/main.tsx","utf8");
if(!main.includes('basename="/4fu-2.0"')){console.error("Router basename missing.");process.exit(1);}
const messaging=readFileSync("src/services/firebase/messaging.ts","utf8");
if(!messaging.includes("getToken")||!messaging.includes("fcmTokens")){console.error("FCM token registration wiring missing.");process.exit(1);}
console.log("4FU 2.0 smoke QA passed:",required.length,"critical files,",routes.length,"routes, Firebase/FCM wiring present.");
