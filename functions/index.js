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

                // Make everything into the write types
                data.stopId = Number(data.stopId);
                data.time = new Date(data.time);
                data.amount = Number(data.amount);

                let stopIdValid = !isNaN(data.stopId);
                let amountValid = !isNaN(data.amount) && data.amount > 0 && data.amount <= 4;

                // Only accept dates for previous hour and next 5 minutes
                let min = new Date(Date.now() - (1000 * 60 * 60)); // 1 hour in the past
                let max = new Date(Date.now() + (1000 * 60 * 5)); // 5 minutes in the future
                let timeValid = data.time > min || data.time < max
                // Error checking
                if (!(stopIdValid && amountValid && timeValid)) throw("Problem with data");
            } catch (e) {
                reject();
            }
            
            db.collection("reports").add({
                amount: data.amount,
                stopId: data.stopId,
                time: data.time
            }).then(() => {
                resolve();
            });
        } else reject();
    }).then((body = "") => {
        res.status(200).send(JSON.stringify(body));
    }).catch(() => {
        res.status(404).end();
    })
});