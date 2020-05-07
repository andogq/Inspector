// Imports
const admin = require("firebase-admin");

// Initialise database
admin.initializeApp();

exports.report = require("./report");
exports.reports = require("./reports");