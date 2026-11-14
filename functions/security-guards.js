"use strict";

const ADMIN_EMAIL = "aks303603@gmail.com";

function isAuthorizedAdminToken(decodedToken) {
    return Boolean(
        decodedToken &&
        typeof decodedToken.email === "string" &&
        decodedToken.email.trim().toLowerCase() === ADMIN_EMAIL &&
        decodedToken.email_verified === true
    );
}

module.exports = { isAuthorizedAdminToken, ADMIN_EMAIL };
