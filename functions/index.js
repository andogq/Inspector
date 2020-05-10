// Imports
const admin = require("firebase-admin");

// Initialise database
admin.initializeApp();

exports.submit_report = require("./submit_report");
exports.reports = require("./reports");