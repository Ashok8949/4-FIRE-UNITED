document.getElementById("saveAnnouncement").addEventListener("click", () => {

    const announcement = {

        title: document.getElementById("title").value.trim(),
        category: document.getElementById("category").value.trim(),
        date: document.getElementById("date").value,
        status: document.getElementById("status").value.trim(),
        description: document.getElementById("description").value.trim()

    };

    if (
        !announcement.title ||
        !announcement.category ||
        !announcement.date
    ) {

        alert("Please fill all required fields.");
        return;

    }

    const btn = document.getElementById("saveAnnouncement");

    btn.disabled = true;

    btn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    db.collection("announcements")
    .add(announcement)

    .then(() => {

        alert("✅ Announcement Added Successfully!");

        window.location.href = "announcements.html";

    })

    .catch((err) => {

        console.error(err);

        btn.disabled = false;

        btn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Save Announcement';

        alert("❌ Failed to save announcement.");

    });

});