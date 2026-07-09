const { onRequest } = require("firebase-functions/v2/https");

exports.testFunction = onRequest((req, res) => {
  res.send("4 FIRE UNITED Functions Working ✅");
});