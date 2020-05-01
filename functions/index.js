// Imports
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialise database
admin.initializeApp();
const db = admin.firestore();

exports.reports = functions.https.onRequest((req, res) => {
    new Promise((resolve) => {
        if (req.method == "GET") {
            // Create new date object for the last hour
            let minTime = new Date(Date.now() - (1000 * 60 * 60));

            // Do the query
            db.collection("reports").where("time", ">=", minTime).get().then((r) => {
                let stopIds = [];
                let reports = [];

                // Pull all the reports and save the stop ids
                r.forEach((report) => {
                    // Ensure that the date remains in the correct form
                    let r = report.data();
                    r.time = r.time.toDate();

                    let id = String(r.stopId);  
                    if (stopIds.indexOf(id) == -1) stopIds.push(id);
                    reports.push(r);
                });

                let stopPromises = [];
                let stops = [];
                stopIds.forEach((id) => {
                    stopPromises.push(db.collection("stops").doc(id).get().then((stop) => {
                        stops[id] = stop.data();
                    }));
                });

                let geojson = {
                    type: "FeatureCollection",
                    features: []
                }

                Promise.all(stopPromises).then(() => {                    
                    reports.forEach((report) => {
                        let timePassed = 1 - ((Date.now() - report.time) / (1000 * 60 * 60));
                        let intensity = (report.amount / 4) * timePassed;

                        geojson.features.push({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    stops[report.stopId].lon,
                                    stops[report.stopId].lat
                                ]
                            },
                            properties: {
                                intensity
                            }
                        });
                    });
                    resolve(geojson);
                });
            });
        }
    }).then((body = "") => {
        res.status(200).send(JSON.stringify(body));
    }).catch(() => {
        res.status(404).end();
    });
});

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
                let timeValid = data.time > min && data.time < max
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
    });
});