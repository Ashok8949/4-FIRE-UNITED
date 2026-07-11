document.getElementById("savePlayer").addEventListener("click", async () => {

    const imageName = document.getElementById("image").value.trim();

    const player = {

        name: document.getElementById("name").value.trim(),
        ign: document.getElementById("ign").value.trim(),
        uid: document.getElementById("uid").value.trim(),
        guild: document.getElementById("guild").value.trim(),
        role: document.getElementById("role").value.trim(),
        language: document.getElementById("language").value.trim(),

        level:Number(document.getElementById("level").value),
        rank:document.getElementById("rank").value.trim(),
        kd:document.getElementById("kd").value.trim(),
        headshot:document.getElementById("headshot").value.trim(),
        matches: Number(document.getElementById("matches").value) || 0,
        booyah: Number(document.getElementById("booyah").value) || 0,

        instagram:document.getElementById("instagram").value.trim(),
        youtube:document.getElementById("youtube").value.trim(),
        discord:document.getElementById("discord").value.trim(),
        facebook:document.getElementById("facebook").value.trim(),

        image: imageName
     ? "../images/" + imageName
     : "../images/logo/logo.png",

        createdAt:new Date()

    };

    await db.collection("players").add(player);

    alert("Player Added");

    location.href="players.html";

});