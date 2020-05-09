// Imports
const fs = require("fs");
const path = require("path");


// Constants
const dataDir = "../data/json";
const output = "../data/stops.geojson";
const chosenFile = "stops.ndjson";

const geojsonTop = `{"type":"FeatureCollection","features":[`;
const geojsonEnd = `]}`;
const geojsonFeature = `{"type":"Feature","geometry":{"type":"Point","coordinates":[{stop_lon},{stop_lat}]},"properties":{"id":{stop_id},"type":"{type}","name":"{stop_name}"}}`;

let written = false;

function getFiles(dir) {
    return new Promise((resolve) => {
        fs.readdir(path.resolve(dir), {withFileTypes: true}, (err, items) => {
            let promises = [];
            let files = [];

            if (err) resolve(files);
            else {
                items.forEach((item) => {
                    let p = path.resolve(dir, item.name);
                    if (item.isDirectory()) promises.push(getFiles(p));
                    else if (item.isFile() && item.name == chosenFile) files.push(p);
                });

                Promise.all(promises).then((f) => {
                    f.forEach((dirFiles) => {
                        files.push(...dirFiles);
                    });
                    resolve(files);
                });
            }
        });
    });
}

function readFile(p) {
    return new Promise((resolve) => {
        let stream = fs.createReadStream(p, {encoding: "utf8"});

        let promises = [];

        let fileType = path.basename(path.dirname(p));

        let lineCount = 0;
        let line = "";
        stream.on("readable", () => {
            while (c = stream.read(1)) {
                if (c == "\n") {
                    promises.push(parseLine(line, fileType));
                    line = "";
                    lineCount++;
                } else line += c;
            }
        });

        stream.on("end", () => {
            Promise.all(promises).then(() => resolve(lineCount));
        });
    });
}

function parseLine(line, type) {
    return new Promise((resolve) => {
        let feature = "";
        if (!written) written = true;
        else feature += ",";

        line = JSON.parse(line);
        feature += geojsonFeature;

        Object.keys(line).forEach((key) => {
            feature = feature.replace(`{${key}}`, line[key]);
        });
        feature = feature.replace("{type}", type);

        outputStream.write(feature, () => {
            resolve();
        });
    });
}

// Initialise the output
let t0 = Date.now();
function ts() {return String(Date.now() - t0).padStart(4, "0")};

console.log(`[${ts()}] Initialising output file at ${path.resolve(output)}`);

let outputStream = fs.createWriteStream(path.resolve(output), {encoding: "utf8"});
outputStream.write(geojsonTop, () => {

    console.log(`[${ts()}] Retrieving files`);

    getFiles(dataDir).then((files) => {

        console.log(`[${ts()}] Retrieved ${files.length} files`);
        let promises = [];
        files.forEach((file) => {
            promises.push(readFile(file));
        });
    
        Promise.all(promises).then((lineCounts) => {
            console.log(`[${ts()}] Read all files`);

            outputStream.write(geojsonEnd, () => {
                outputStream.close();

                let lineCount = lineCounts.reduce((num, n) => num + n, 0);
                console.log(`[${ts()}] Wrote ${lineCount} lines to ${path.resolve(output)}`);

                fs.stat(path.resolve(output), (err, stats) => {
                    console.log(`[${ts()}] Output file is ${stats.size / 1000000}mb`);
                });
            });
        });
    });
});
