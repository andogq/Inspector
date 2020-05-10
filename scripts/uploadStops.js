// Imports
const imports = {
    fs: require("fs"),
    path: require("path"),
    admin: require("firebase-admin")
}

// Constants
const c = {
    input: "../data/parsed",
    types: [
        // "bus_metro",
        // "bus_regional",
        // "coach_regional",
        // "interstate",
        // "train_metro",
        // "train_regional",
        // "tram_metro"
    ],
    database: {
        cred: "../creds/serviceAccountKey.json",
        url: "https://inspector-d21b9.firebaseio.com"
    }
}

// Globals
let g = {};

function uploadFolder(path) {
    return new Promise((resolve, reject) => {
        imports.fs.readdir(path, {withFileTypes: true}, (err, files) => {
            if (err) reject(err);
            else {
                let promises = [];
                let total = 0;

                files.forEach((file) => {
                    if (file.isFile) {
                        file = file.name;
                        let data = JSON.parse(imports.fs.readFileSync(imports.path.resolve(path, file), {encoding: "utf8"}));

                        data.type = imports.path.basename(path, ".json");
                        
                        let id = data.id;

                        promises.push(g.db.collection("stops").doc(String(id)).set(data).then(() => total++));
                    }
                });
                
                Promise.all(promises).then(() => {
                    console.log(`Uploaded ${total} stops from ${path}`);
                    g.total += total;
                    resolve();
                }).catch(reject);
            }
        });
    });
}

function initDatabase() {
    g.serviceAccount = require(imports.path.resolve(c.database.cred));
    imports.admin.initializeApp({
        credential: imports.admin.credential.cert(g.serviceAccount),
        databaseUrl: c.database.url
    });
    g.db = imports.admin.firestore();
}

function init() {
    initDatabase();

    g.total = 0;
    Promise.all(c.types.map(type => uploadFolder(imports.path.resolve(c.input, type)))).then(() => {
        console.log(`Successfully uploaded ${g.total} records`);
    }).catch(console.error);
}

init();