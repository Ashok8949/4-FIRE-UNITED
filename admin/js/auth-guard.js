const ADMIN_EMAIL = "aks303603@gmail.com";
auth.onAuthStateChanged(async (user) => {
    if (!user) { window.location.replace("login.html"); return; }
    try {
        const token = await user.getIdTokenResult(true);
        if (user.email !== ADMIN_EMAIL || token.claims.email !== ADMIN_EMAIL || token.claims.email_verified !== true) {
            await auth.signOut();
            window.location.replace("login.html");
            return;
        }
        document.body.style.visibility = "visible";
    } catch (error) {
        console.error("Admin authorization check failed:", error);
        try { await auth.signOut(); } catch (_) {}
        window.location.replace("login.html");
    }
});
