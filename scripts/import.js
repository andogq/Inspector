// Imports
const imports = {
    fs: require("fs"),
    path: require("path")
}

// Constants
const c = {
    input: "../data/raw",
    output: "../data/parsed",
    folders: [
        "bus_metro",
        "bus_night",
        "bus_regional",
        "bus_sky",
        "bus_tele",
        "coach_regional",
        "interstate",
        "train_metro",
        "train_regional",
        "tram_metro"
    ],
    file: "stops.txt",
    geojson: {
        head: `{"type":"FeatureCollection","features":[`,
        tail: `]}`,
        feature: `{"type":"Feature","geometry":{"type":"Point","coordinates":[__lon__,__lat__]},"properties":__properties__}`
    },
    decimalPoints: 6
}

// Globals
let g = {};

function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * Math.pow(10, c.decimalPoints)) / Math.pow(10, c.decimalPoints);
}

class GeojsonFile {
    constructor(path) {
        this.path = path;
        this.stream = imports.fs.createWriteStream(this.path, {encoding: "utf8"});

        this.stream.write(c.geojson.head, (err) => {
            if (err) console.error(err);
        });

        this.features = 0;

        console.log(`Opened write stream at ${this.path}`);
    }

    addFeature(lat, lon, properties) {
        if (lat && lon) {
            let feature = c.geojson.feature;
            feature = feature.replace("__lon__", lon);
            feature = feature.replace("__lat__", lat);
            if (properties) feature = feature.replace("__properties__", JSON.stringify(properties));

            if (this.features > 0) feature = "," + feature;
            this.features++;
            this.stream.write(feature, (err) => {
                if (err) console.error(err);
            });
        }
    }

    close() {
        this.stream.write(c.geojson.tail, (err) => {
            if (err) console.error(err);
        });
        this.stream.close();
        console.log(`Closed write stream at ${this.path}`);
    }
}

// Converts CSV to a JS array
function csvParse(line) {
    line = line.split(",");

    let entries = [];
    let e;

    let regex = {
        both: /^".+"$/,
        start: /^".+$/,
        end: /^.+"$/
    }

    line.forEach((section) => {
        if (regex.start.test(section)) {
            entries.push(section.substr(1, section.length - 2));
        } else if (regex.start.test(section)) {
            e = section.substr(1, section.length - 1);
        } else if (regex.end.test(section) && e) {
            e += section.substr(0, section.length - 1);
            entries.push(e);
            e = undefined;
        }
    });

    return entries.map(el => isNaN(Number(el)) ? el : Number(el));
}

// Reads a file line by line
function readFile(path, lineCallback) {
    return new Promise((resolve) => {
        path = imports.path.resolve(path);
        console.log(`Starting to read ${path}`);

        let stream = imports.fs.createReadStream(path, {encoding: "utf8"});

        let line = "";
        stream.on("readable", () => {
            while (char = stream.read(1)) {
                if (char == "\n" || char == "\r") {
                    if (line.length > 0) lineCallback(line);
                    line = "";
                } else line += char;
            }
        });

        stream.on("end", () => {
            console.log(`Finished reading ${path}`);
            resolve();
        });
    });
}

function saveLine(line, type) {
    return new Promise((resolve) => {
        // Add to the geojson file
        g[type].file.addFeature(line.lat, line.lon, {
            id: line.id,
            name: line.name
        });

        let path = imports.path.resolve(c.output, type, line.id + ".json");
        let data = JSON.stringify(line);

        imports.fs.writeFile(path, data, {encoding: "utf8"}, () => {
            resolve();
        });
    });
}

function checkFolders() {
    // Make all output folders
    let promises = c.folders.map((folder) => {
        return new Promise((res, rej) => {
            imports.fs.mkdir(imports.path.resolve(c.output, folder), {recursive: true}, (err) => {
                if (err) rej(err);
                else res();
            });
        });
    });

    // Check the input folder
    promises.push(new Promise((res, rej) => {
        imports.fs.readdir(imports.path.resolve(c.input), (err) => {
            if (err) rej(err);
            else res();
        });
    }));
    return Promise.all(promises);
}

function unique(line, type) {
    let u = true;

    // Check if the id is unique
    u &= g[type].id.indexOf(line.id) == -1;

    // Check if the name is unique
    u &= g[type].name.indexOf(line.name) ==  -1;

    // Check if the coords are unique
    u &= g[type].latlon.indexOf(`${line.lat},${line.lon}`) == -1;

    if (u) {
        // Add everything to the global objects for future checks
        g[type].id.push(line.id);
        g[type].name.push(line.name);
        g[type].latlon.push(`${line.lat},${line.lon}`);
    }

    return u;
}

function init() {
    checkFolders().then(() => c.folders.forEach((type) => {
        // Construct the paths
        let path = {
            input: imports.path.resolve(c.input, type, c.file),
            output: imports.path.resolve(c.output, type + ".geojson")
        }

        // Create a variable to store info about that type
        g[type] = {
            latlon: [],
            id: [],
            name: [],
            count: {
                duplicate: 0,
                written: 0,
                total: 0
            },
            file: new GeojsonFile(path.output)
        }

        let promises = [];

        readFile(path.input, (line) => {
            g[type].count.total++;
            line = csvParse(line);
            line = {
                lat: round(line[2]),
                lon: round(line[3]),
                id: line[0],
                name: line[1]
            }

            if (unique(line, type)) {
                promises.push(saveLine(line, type));
                g[type].count.written++;
            } else {
                // console.log(`Duplicate found: ${JSON.stringify(line)}`);
                g[type].count.duplicate++;
            }
        }).finally(() => {
            Promise.all(promises).then(() => {
                g[type].file.close();
    
                console.log(`Out of ${g[type].count.total}, ${g[type].count.written} were written and ${g[type].count.duplicate} were duplicates`);
            }).catch((e) => console.error(e));
        });
    })).catch(e => console.error(e));
}

init();