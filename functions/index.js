// Imports
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Globals
const radius = 5;
const rounding = 3;

// Initialise the database
admin.initializeApp();
let db = admin.firestore();

// Rounds a number to the correct decimal places
function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * Math.pow(10, rounding)) / Math.pow(10, rounding);
}

function nearby(lat, lon) {
    return new Promise((resolve) => {
        let roundedLat = round(lat);
        let roundedLon = round(lon);
        
        let inc = 1 / Math.pow(10, rounding);

        // Pull the lats and lons from the database
        let firestorePromises = [];
        let lats = {};
        let lons = {};
        for (let i = -radius; i <= radius; i++) {
            let tempLat = round(roundedLat + (i * inc));
            let tempLon = round(roundedLon + (i * inc));

            // Pull lat from the database
            firestorePromises.push(db.collection("lat").doc(String(tempLat)).get().then((v) => {
                if (v.exists) lats[tempLat] = v.data();
            }));
            // Pull lon from the database
            firestorePromises.push(db.collection("lon").doc(String(tempLon)).get().then((v) => {
                if (v.exists) lons[tempLon] = v.data();
            }));
        }

        // When everything is pulled from the database
        Promise.all(firestorePromises).then(() => {
            let close = [];

            // For each offset in lat
            for (let i = -radius; i <= radius; i++) {
                let tempLat = round(roundedLat + (i * inc));

                // For each offset in lon
                for (let j = -radius; j <= radius; j++) {
                    let tempLon = round(roundedLon + (j * inc));

                    // Ensure both exist
                    if (lats[tempLat] != undefined && lons[tempLon] != undefined) {
                        // Will need to change once more things than stops are added
                        lats[tempLat].stops.forEach((latStation) => {
                            lons[tempLon].stops.forEach((lonStation) => {
                                // Check if the IDs match up
                                if (latStation == lonStation) close.push(lonStation);
                            });
                        });
                    }
                }
            }

            resolve(close);
        });
    });
}

exports.nearby = functions.https.onRequest((req, res) => {
    new Promise((resolve, reject) => {
        // Only accept post requests
        if (req.method == "POST") {
            let body;

            // Check that the body is JSON and that it has lat and lon which are numbers
            try {
                body = JSON.parse(req.body);

                if (typeof(body.lat) != "number" || typeof(body.lon) != "number") throw "Error";
            } catch {
                reject();
            }

            // Find nearby based on lat and lon
            nearby(body.lat, body.lon).then((near) => {
                resolve({body: JSON.stringify(near)});
            });
        } else {
            reject();
        }
    }).then((params = {}) => {
        let {status = 200, body = ""} = params;

        res.statusCode = status;
        res.end(body);
    }).catch((params = {}) => {
        let {status = 404} = params;

        res.statusCode = status;
        res.end();
    });
});