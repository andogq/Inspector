// Imports
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Globals
const dataDir = "../data/parsed";
let db;

function uploadFile(collection, file) {
    return new Promise((resolve, reject) => {
        // Open the file
        fs.readFile(file, {encoding: "utf8"}, (err, data) => {
            if (err) reject(err);
            else {
                // Set the doc in the collection with the data from the file
                collection.doc(path.basename(file, ".json")).set(JSON.parse(data)).then(resolve);
            }
        });
    })
}

function uploadDir(dir) {
    return new Promise((resolve, reject) => {
        console.log(`Uploading ${dir}`);

        // Save the collection named after the directory
        let collection = db.collection(dir);

        // Check each file in the directory
        fs.readdir(path.resolve(dataDir, dir), {withFileTypes: true}, (err, items) => {
            if (err) reject(err);
            else {
                let promises = [];

                items.forEach((item) => {
                    if (item.isFile()) {
                        promises.push(uploadFile(collection, path.resolve(dataDir, dir, item.name)));
                    }
                });

                Promise.all(promises).then(() => {
                    console.log(`Finished uploading ${dir}`);
                    resolve();
                }).catch(reject);
            }
        });
    });
}

function init() {
    // Initialise the database
    let serviceAccount = require("../creds/serviceAccountKey.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://inspector-d21b9.firebaseio.com"
    });
    db = admin.firestore();

    // Read the dataDir
    fs.readdir(path.resolve(dataDir), {withFileTypes: true}, (err, items) => {        
        if (err) console.log(err);
        else {
            let promises = [];

            // Upload each directory
            items.forEach((item) => {
                if (item.isDirectory()) promises.push(uploadDir(item.name));
            });

            Promise.all(promises).then(() => {
                // Everything completed
                console.log("Finished upload");
            }).catch((err) => {
                console.error(err);
            });
        }
    });
}

init();