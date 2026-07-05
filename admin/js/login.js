// Mouse Glow Effect
document.addEventListener("mousemove", (e) => {

    let glow = document.querySelector(".mouse-glow");

    if (!glow) {
        glow = document.createElement("div");
        glow.className = "mouse-glow";
        document.body.appendChild(glow);
    }

    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
});

// Password Show / Hide
const eye = document.getElementById("eye");
const password = document.getElementById("password");

eye.addEventListener("click", () => {

    if (password.type === "password") {
        password.type = "text";
        eye.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        password.type = "password";
        eye.classList.replace("fa-eye-slash", "fa-eye");
    }

});

// Login
document.getElementById("loginBtn").addEventListener("click", () => {

    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const error = document.getElementById("error");
    const box = document.querySelector(".login-box");

    if (user === "admin" && pass === "4fu123") {

        error.style.color = "#00ff99";
        error.innerHTML = "ACCESS GRANTED...";

        document.getElementById("loginBtn").innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

        setTimeout(() => {
            sessionStorage.setItem("adminLoggedIn", "true");

            console.log("Session =", sessionStorage.getItem("adminLoggedIn"));
            
             window.location.href = "dashboard.html";
        }, 1500);

    } else {

        error.style.color = "#ff4444";
        error.innerHTML = "INVALID USERNAME OR PASSWORD";

        box.classList.add("shake");

        setTimeout(() => {
            box.classList.remove("shake");
        }, 500);

    }

});