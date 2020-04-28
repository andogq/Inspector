// Imports
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Constants
const inputs = "./notUploaded.json";
const dataDir = "../data/parsed/stops";

function init() {
    // Initialise the database
    let serviceAccount = require("../creds/serviceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://inspector-d21b9.firebaseio.com"
    });
    db = admin.firestore();

    fs.readFileSync(path.resolve(inputs), {encoding: "utf8"}, (err, data) => {
        data = JSON.parse(data);
        let promises = [];

        if (err) console.error(err);
        else {
            data.forEach((stopId) => {
                promises.push(new Promise((resolve) => {
                    fs.readFile(fs.resolve(dataDir, stopId + ".json"), {encoding: "utf8"}, (err, file) => {
                        if (err) console.error(err);
                        else {
                            file = JSON.parse(file);

                            db.collection("stops").doc(String(stopId)).set(file).then(resolve);
                        }
                    });
                }));

                if (item.isFile()) {
                    let id = path.basename(item.name, ".json");
                    
                    promises.push(new Promise((resolve) => {
                        db.collection("stops").doc(id).get().then((doc) => {
                            if (!doc.exists) {
                                notUploaded.push(id);
                                console.log(`${notUploaded.length}: ${id}`);
                                resolve();
                            }
                        });
                    }));
                }
            });

            Promise.all(promises).then(() => {
                console.log(`Found ${notUploaded.length} to upload`);
                fs.writeFile(output, {encoding: "utf8"}, JSON.stringify(notUploaded), (err) => {
                    if (err) console.error(err);
                    else console.log(`File written to ${output}`);
                });
            });
        }
    });
}

init();