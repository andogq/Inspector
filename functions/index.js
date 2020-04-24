// Imports
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialise database
admin.initializeApp();
const db = admin.firestore();

exports.report = functions.https.onRequest((req, res) => {
    new Promise((resolve, reject) => {
        if (req.method == "POST") {
            let data;
            try {
                data = JSON.parse(req.body);

            } catch {
                reject();
            }
            if (data != undefined && data.stopId != undefined && data.time != undefined && data.amount != undefined) {
                db.collection("reports").add({
                    amount: data.amount,
                    stopId: data.stopId,
                    time: data.time
                }).then(() => {
                    resolve();
                });
            } else reject();
        } else reject();
    }).then((body = "") => {
        res.status(200).send(JSON.stringify(body));
    }).catch(() => {
        res.status(404).end();
    })
});