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
                let reports = {};
                let stopPromises = [];

                // Pull all the reports and save the stop ids
                r.forEach((report) => {
                    // Ensure that the date remains in the correct form
                    let r = report.data();
                    r.time = r.time.toDate();

                    let id = String(r.stopId);  
                    if (!reports[id]) {
                        reports[id] = [];
                        stopPromises.push(db.collection("stops").doc(id).get());
                    }
                    reports[id].push(r);
                });
                
                let response = {};
                
                Promise.all(stopPromises).then(stopRefs => stopRefs.forEach((ref) => {
                    let stopData = ref.data();
                    let id = stopData.id;
                    let stopReports = reports[id];
                    
                    let {lastReport, amount, dress} = stopReports.reduce(({lastReport, amount, dress}, report) => {
                        if (report.time > lastReport) lastReport = report.time;
                        amount += report.amount;
                        dress[report.dress]++;
                        return {lastReport, amount, dress};
                    }, {lastReport: 0, amount: 0, dress: [0, 0]});

                    // Average the amount
                    amount /= stopReports.length;

                    // Calculate the intensity of the report
                    let timePassed = 1 - ((Date.now() - lastReport) / (1000 * 60 * 60));
                    let intensity = amount / 4 * timePassed;

                    response[id] = {
                        id,
                        coordinates: {
                            lat: stopData.lat,
                            lon: stopData.lon
                        },
                        reports: stopReports.length,
                        lastReport,
                        amount,
                        dress,
                        intensity
                    };
                })).then(() => resolve(response));
            });
        }
    }).then((body = "") => {
        res.status(200).send(JSON.stringify(body));
    }).catch(() => {
        res.status(404).end();
    });
});