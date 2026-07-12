// =====================================
// LOGOUT
// =====================================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        auth.signOut()
        .then(() => {

            window.location.href = "login.html";

        })
        .catch((err) => {

            console.error(err);

            alert(err.message);

        });

    });

}

// =====================================
// COUNT FUNCTION
// =====================================

function loadCount(collection, elementId) {

    db.collection(collection)
    .get()
    .then((snapshot) => {

        const el = document.getElementById(elementId);

        if (el) {

            el.textContent = snapshot.size;

        }

    })
    .catch(console.error);

}

// =====================================
// LIVE COUNTS
// =====================================

loadCount("players","totalPlayers");
loadCount("tournaments","totalTournaments");
loadCount("gallery","totalGallery");
loadCount("contactMessages","totalMessages");
loadCount("joinApplications","totalApplications");

// Visitors

db.collection("stats")
.doc("visitors")
.get()

.then((doc)=>{

    const el=document.getElementById("totalVisitors");

    if(!el) return;

    if(doc.exists){

        el.textContent=doc.data().total || 0;

    }else{

        el.textContent=0;

    }

});

// =====================================
// QUICK ACTIONS
// =====================================

function quickAction(id,page){

    const btn=document.getElementById(id);

    if(!btn) return;

    btn.style.cursor="pointer";

    btn.onclick=()=>{

        window.location.href=page;

    };

}

quickAction("managePlayers","players.html");
quickAction("manageTournament","tournaments.html");
quickAction("manageGallery","gallery.html");
quickAction("manageClips","clips.html");
quickAction("manageNews","announcements.html");
quickAction("manageMessages","messages.html");
quickAction("manageApplications","applications.html");
quickAction("manageSettings","settings.html");

// =====================================
// RECENT PLAYER
// =====================================

db.collection("players")
.limit(1)
.get()

.then((snapshot)=>{

    snapshot.forEach((doc)=>{

        const p=doc.data();

        const el=document.getElementById("latestPlayer");

        if(el){

            el.textContent=p.name+" ("+p.role+")";

        }

    });

});

// =====================================
// RECENT TOURNAMENT
// =====================================

db.collection("tournaments")
.limit(1)
.get()

.then((snapshot)=>{

    snapshot.forEach((doc)=>{

        const t=doc.data();

        const el=document.getElementById("latestTournament");

        if(el){

            el.textContent=t.title;

        }

    });

});

// =====================================
// RECENT MESSAGE
// =====================================

db.collection("contactMessages")
.limit(1)
.get()

.then((snapshot)=>{

    snapshot.forEach((doc)=>{

        const m=doc.data();

        const el=document.getElementById("latestMessage");

        if(el){

            el.textContent=m.name+" • "+m.subject;

        }

    });

});

// =====================================
// RECENT APPLICATION
// =====================================

db.collection("joinApplications")
.limit(1)
.get()

.then((snapshot)=>{

    snapshot.forEach((doc)=>{

        const a=doc.data();

        const el=document.getElementById("latestApplication");

        if(el){

            el.textContent=a.name+" • "+a.rank;

        }

    });

});