db.collection("gallery")
.get()
.then((snapshot)=>{

    const gallery=document.getElementById("galleryGrid");

    gallery.innerHTML="";

    snapshot.forEach((doc)=>{

        const g=doc.data();

        gallery.innerHTML+=`

        <div class="gallery-card">

            <img src="../${g.image}" alt="${g.title}">

            <div class="gallery-info">

                <h3>${g.title}</h3>

                <div class="gallery-buttons">

                    <a href="edit-gallery.html?id=${doc.id}" class="edit-btn">

                        Edit

                    </a>

                    <button class="delete-btn" data-id="${doc.id}">

                        Delete

                    </button>

                </div>

            </div>

        </div>

        `;

    });

    document.querySelectorAll(".delete-btn").forEach(btn=>{

        btn.addEventListener("click",()=>{

            const id=btn.dataset.id;

            if(confirm("Delete this image?")){

                db.collection("gallery")
                .doc(id)
                .delete()
                .then(()=>{

                    alert("Image Deleted");

                    location.reload();

                });

            }

        });

    });

});