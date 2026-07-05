const players = {
  player1: {
    name: "Ashok",
    ign: "4fu-Ashok.",
    uid: "2156033329",
    role: "Primary Rusher",
    level: 70,
    rank: "Heroic",
    guild: "BL!zereXE",
    headshot: "81%",
    kd: "5.82",
    matches: 520,
    booyah: 158,
    language: "English",
    image: "images/players/player1.png"
  },

  player2: {
    name: "Sunny",
    ign: "4fu-Sunny.",
    uid: "3039290510",
    role: "Sniper",
    level: 69,
    rank: "Heroic",
    guild: "BL!zereXE",
    headshot: "79%",
    kd: "4.95",
    matches: 480,
    booyah: 145,
    language: "English",
    image: "images/players/player2.png"
  },

  player3: {
    name: "Durga",
    ign: "Uw♡ Durga",
    uid: "7659339265",
    role: "Secondary Rusher",
    level: 63,
    rank: "Heroic",
    guild: "BL!zereXE",
    headshot: "83%",
    kd: "5.12",
    matches: 450,
    booyah: 132,
    language: "English",
    image: "images/players/player3.png"
  },

  player4: {
    name: "Deepak",
    ign: "Uw♡ Deepak",
    uid: "7640586041",
    role: "Support",
    level: 64,
    rank: "Heroic",
    guild: "BL!zereXE",
    headshot: "75%",
    kd: "4.61",
    matches: 430,
    booyah: 120,
    language: "English",
    image: "images/players/player4.png"
  },

  player5: {
    name: "Rahul S",
    ign: "Uw♡ RahulS",
    uid: "1968282877",
    role: "Assaulter",
    level: 66,
    rank: "Heroic",
    guild: "BL!zereXE",
    headshot: "80%",
    kd: "5.44",
    matches: 500,
    booyah: 150,
    language: "English",
    image: "images/players/player5.png"
  },

  player6: {
    name: "Rahul R",
    ign: "Uw♡ RahulR",
    uid: "2547614286",
    role: "Entry Fragger",
    level: 71,
    rank: "Heroic",
    guild: "BL!zereXE",
    headshot: "78%",
    kd: "5.01",
    matches: 490,
    booyah: 142,
    language: "English",
    image: "images/players/player6.png"
  }
};

document.getElementById("importBtn").onclick = async () => {

    const btn = document.getElementById("importBtn");

    btn.innerHTML = "IMPORTING...";

    try {

        for (const id in players) {

            await db.collection("players")
                .doc(id)
                .set(players[id]);

        }

        btn.innerHTML = "✅ IMPORT SUCCESSFUL";

        alert("All 6 Players Imported Successfully!");

    } catch (err) {

        console.error(err);

        btn.innerHTML = "IMPORT FAILED";

        alert(err.message);

    }

};