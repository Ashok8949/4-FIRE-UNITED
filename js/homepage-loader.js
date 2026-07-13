window.homeData = {};

Promise.all([

    db.collection("players")
      .where("featured","==",true)
      .get(),

    db.collection("clips")
      .orderBy("createdAt","desc")
      .limit(3)
      .get(),

    db.collection("gallery")
      .get(),

    db.collection("announcements")
      .orderBy("date","desc")
      .limit(1)
      .get(),

    db.collection("tournaments")
      .orderBy("date","desc")
      .limit(1)
      .get(),
      db.collection("tournaments")
      .get(),

    db.collection("stats")
      .doc("visitors")
      .get()

]).then(([

    players,
    clips,
    gallery,
    announcement,
    tournament,
    allTournaments,
    visitors

])=>{

    window.homeData = {

       players,
       clips,
       gallery,
       announcement,
       tournament,
       allTournaments,
       visitors

    };

    document.dispatchEvent(

        new Event("homeDataReady")

    );

});