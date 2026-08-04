// Login with Firebase
document.getElementById("loginBtn").addEventListener("click", () => {

    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const error = document.getElementById("error");
    const box = document.querySelector(".login-box");

    auth.signInWithEmailAndPassword(email, password)

.then((userCredential) => {

    error.style.color = "#00ff99";
    error.innerHTML = "ACCESS GRANTED...";

    document.getElementById("loginBtn").innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    setTimeout(() => {
        window.location.replace("dashboard.html");
    }, 800);

})

.catch((err) => {

    error.style.color = "#ff4444";
    error.innerHTML = "Invalid Email or Password";

    box.classList.add("shake");

    setTimeout(() => {
        box.classList.remove("shake");
    }, 500);

});

});
// ================================
// Forgot Password
// ================================

document.getElementById("forgotPassword").addEventListener("click", async (e) => {

    e.preventDefault();

    const email = document.getElementById("username").value.trim();

    if (!email) {
        alert("Please enter your admin email first.");
        return;
    }

    try {

        await auth.sendPasswordResetEmail(email);

        alert("Password reset link has been sent to your email.");

    } catch (err) {

        switch (err.code) {

            case "auth/user-not-found":
                alert("No account found with this email.");
                break;

            case "auth/invalid-email":
                alert("Please enter a valid email.");
                break;

            default:
                alert(err.message);
        }

    }

});