// Imports
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Constants
const dir = "../data/parsed/stops";
const output = "./notUploaded.json";

function init() {
    // Initialise the database
    let serviceAccount = require("../creds/serviceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://inspector-d21b9.firebaseio.com"
    });
    db = admin.firestore();

    fs.readdir(path.resolve(dir), {withFileTypes: true}, (err, items) => {
        let notUploaded = [];
        let promises = [];

        if (err) console.error(err);
        else {
            items.forEach((item) => {
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