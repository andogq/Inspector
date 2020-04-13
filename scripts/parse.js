// Imports
let fs = require("fs");
let path = require("path");

// Globals
const jsonDir = "../data/json";
const dataDir = "../data/parsed";
// Which folders to include
const include = ["bus_metro", "bus_regional", "train_metro", "train_regional", "tram_metro"];
// Which files within folders, and the new names for the properties
const propertyMaps = {
    "stops.ndjson": {
        "stop_id": "id",
        "stop_name": "name",
        "stop_lat": "lat",
        "stop_lon": "lon"
    }
};

// Stores the lats and lons and the objects within them
let lat = {};
let lon = {};

// How many decimal places to round to. 3 decimal places ~= 100m
let rounding = 3;
function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * Math.pow(10, rounding)) / Math.pow(10, rounding);
}

function getFiles(dir) {
    return new Promise((resolve) => {
        let files = [];

        // List files in the directory
        fs.readdir(dir, {withFileTypes: true}, (err, items) => {
            if (err) resolve(files);

            let promises = [];

            // If the item is a file, add it to the list or continue to search that directory
            items.forEach((item) => {
                let itemPath = path.resolve(dir, item.name);
                if (item.isDirectory() && include.indexOf(item.name) != -1) promises.push(getFiles(itemPath).then(f => files.push(...f)));
                else if (Object.keys(propertyMaps).indexOf(item.name) != -1) files.push(itemPath);
            });

            // Once all directories are completed, resolve
            Promise.all(promises).then(() => {
                resolve(files);
            });
        });
    });
}

function saveFile(type, l, data) {
    return new Promise((resolve) => {
        // Stringify the data
        data = JSON.stringify(data);

        // Create the path based of the type and the coord 
        l = String(round(l));
        let filePath = path.resolve(dataDir, type, l) + ".json";
        
        // Write the file
        fs.writeFile(filePath, data, {encoding: "utf8"}, resolve);
    });
}

function parseLine(line, filePath) {
    line = JSON.parse(line);
    let fileName = path.basename(filePath);

    let parsed = {};
    let map = propertyMaps[fileName];

    // Map the old property to the new property
    Object.keys(map).forEach((oldProperty) => {
        let newProperty = map[oldProperty];
        parsed[newProperty] = line[oldProperty];
    });

    // Hack to get the type for the stop in the document
    parsed.type = path.basename(path.dirname(filePath));

    // Round lat and lon for use in object
    let rLat = round(parsed.lat);
    let rLon = round(parsed.lon);

    // Create the lat and lon objects if they don't exist
    if (lat[rLat] == undefined) {
        lat[rLat] = {};
        Object.keys(propertyMaps).forEach((key) => {
            lat[rLat][path.basename(key, ".ndjson")] = [];
        });
    }
    if (lon[rLon] == undefined) {
        lon[rLon] = {};
        Object.keys(propertyMaps).forEach((key) => {
            lon[rLon][path.basename(key, ".ndjson")] = [];
        });
    }
    
    // Add the object to the relevent object
    lat[rLat][path.basename(fileName, ".ndjson")].push(parsed.id);
    lon[rLon][path.basename(fileName, ".ndjson")].push(parsed.id);

    return new Promise((resolve) => {
        // Save the object it's own file
        fs.writeFile(path.resolve(dataDir, path.basename(fileName, ".ndjson"), parsed.id + ".json"), JSON.stringify(parsed), (err) => {
            if (err) console.error(err);
            resolve();
        });
    });
}

function parseFile(filePath) {
    return new Promise((resolve) => {
        // Stream the file to reduce memory usage
        let stream = fs.createReadStream(filePath, {encoding: "utf8"});

        let promises = [];

        let line = "";
        // Emits whenever data is added to the buffer
        stream.on("readable", () => {
            // Loop over character by character
            while (c = stream.read(1)) {
                if (c == "\n") {
                    promises.push(parseLine(line, filePath));
                    line = "";
                } else line += c;
            }
        });

        // End of the stream
        stream.on("end", () => {
            Promise.all(promises).then(resolve);
        });
    });
}

function init() {
    console.log("Starting");

    // Create the output directories
    let latDir = path.resolve(dataDir, "lat");
    let lonDir = path.resolve(dataDir, "lon");
    fs.mkdirSync(latDir, {recursive: true});
    fs.mkdirSync(lonDir, {recursive: true});
    Object.keys(propertyMaps).forEach((type) => {
        type = path.basename(type, ".ndjson");
        fs.mkdirSync(path.resolve(dataDir, type), {recursive: true});
    });

    // Parse the files
    getFiles(jsonDir).then((files) => {
        let promises = [];

        files.forEach((filePath) => {
            promises.push(parseFile(filePath));
        });

        Promise.all(promises).then(() => {
            console.log("File parsing completed");

            // Save each lat and lon to a file
            let filePromises = [];
            Object.keys(lat).forEach((l) => {
                filePromises.push(saveFile("lat", l, lat[l]));
            });
            Object.keys(lon).forEach((l) => {
                filePromises.push(saveFile("lon", l, lon[l]));
            });

            // Everything completed
            Promise.all(filePromises).then(() => {
                console.log("Saving lat/lon files completed");
            });
        });
    });
}

init();