// Imports
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// Globals
const dataDir = "../data/parsed";
let include = ["stops"];
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

function upload(files, start, amount) {
    let collection = db.collection(path.basename(path.dirname(files[0])));
    
    let promises = [];
    for (let i = start; i < start + amount; i++) {
        promises.push(uploadFile(collection, files[i]));
    }

    return Promise.all(promises);
}

function uploadDir(dir) {
    return new Promise((resolve, reject) => {
        console.log(`Uploading ${dir}`);

        // Save the collection named after the directory

        // Check each file in the directory
        fs.readdir(path.resolve(dataDir, dir), {withFileTypes: true}, async (err, items) => {
            if (err) reject(err);
            else {
                let files = [];

                items.forEach((item) => {
                    if (item.isFile()) {
                        files.push(path.resolve(dataDir, dir, item.name));
                    }
                });

                let start = 0;
                let amount = 100;

                while (start + amount < files.length) {
                    await upload(files, start, amount);
                    console.log(`Uploaded ${start} -> ${start + amount}`);
                    start += amount;
                }
                await upload(files, start, files.length - start);
                console.log("Completed");
                resolve();
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
                if (item.isDirectory() && include.indexOf(item.name) != -1) promises.push(uploadDir(item.name));
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