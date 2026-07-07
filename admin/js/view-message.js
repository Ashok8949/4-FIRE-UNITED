const params = new URLSearchParams(window.location.search);

const id = params.get("id");

if (!id) {

    alert("Message not found.");

    window.location.href = "messages.html";

}

const docRef = db.collection("contactMessages").doc(id);

docRef.get()

.then((doc) => {

    if (!doc.exists) {

        alert("Message not found.");

        window.location.href = "messages.html";

        return;

    }

    const m = doc.data();

    document.getElementById("subject").textContent = m.subject;
    document.getElementById("name").textContent = m.name;
    document.getElementById("email").textContent = m.email;
    document.getElementById("date").textContent = m.date;
    document.getElementById("status").textContent = "Read";
    document.getElementById("message").textContent = m.message;

    docRef.update({

        status: "Read"

    });

})

.catch((err) => {

    console.error(err);

});