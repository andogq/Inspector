// Imports
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialise database
const db = admin.firestore();

module.exports = functions.https.onRequest((req, res) => {
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