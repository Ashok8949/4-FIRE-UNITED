db.collection("clips")
.orderBy("createdAt", "desc")
.get()
.then((snapshot) => {

    const table = document.getElementById("clipsTable");

    table.innerHTML = "";

    snapshot.forEach((doc) => {

        const clip = doc.data();

        table.innerHTML += `

        <tr>

            <td>

                <img src="${clip.thumbnail}"
                     width="100"
                     style="border-radius:8px;">

            </td>

            <td>${clip.title}</td>

            <td>${clip.playerName}</td>

            <td>${clip.category}</td>

            <td class="action-buttons">

               <a href="edit-clip.html?id=${doc.id}" class="edit-btn">
                  <i class="fa-solid fa-pen"></i> Edit
               </a>

               <button onclick="deleteClip('${doc.id}')" class="delete-btn">
                 <i class="fa-solid fa-trash"></i> Delete
               </button>
 
            </td>

        </tr>

        `;

    });

})
.catch(console.error);

function deleteClip(id) {

    if (!confirm("Delete this clip?")) return;

    db.collection("clips")
    .doc(id)
    .delete()
    .then(() => {

        alert("Clip Deleted");

        location.reload();

    })
    .catch((err) => {

        alert(err.message);

    });

}