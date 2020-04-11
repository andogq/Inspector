// Imports
const csv = require("csvtojson");
const fs = require("fs");
const path = require("path");

// Globals
let dataDir = "../data/raw/bus_metro";
let outDir = "../data/json";

function getFiles(dir) {
    return new Promise((resolve) => {
        // Read the files in the directory
        fs.readdir(dir, {withFileTypes: true}, (err, items) => {
            let files = {
                dirs: [],
                files: []
            }

            if (err) {
                // Directory doesn't exist
                fs.mkdir(dir, () => {
                    resolve(files);
                });
            } else {
                // Check if each item is a file or directory
                items.forEach((item) => {
                    if (item.isDirectory()) files.dirs.push(item.name);
                    else files.files.push(item.name);
                });
                resolve(files);
            }
        });
    });
}

function convertFile(oldPath) {
    console.log(`Starting ${oldPath}`);
    return new Promise((resolve) => {
        if (path.extname(oldPath) == ".txt") {
            // Generate the new paths
            let oldDir = path.dirname(oldPath);
            let oldName = path.basename(oldPath);

            let pathStub = path.relative(dataDir, oldDir);
            let newDir = path.resolve(outDir, pathStub);
            let newName = oldName.replace(/txt$/, "json");
            let newPath = path.resolve(newDir, newName);
            
            // Create the directory in the output directory, if it doesn't exist
            fs.mkdir(newDir, {recursive: true}, () => {
                // Read the file in
                csv().fromFile(oldPath).then((parsed) => {
                    // Save the parsed json file
                    let output = JSON.stringify(parsed);

                    // Write the actual file
                    fs.writeFile(newPath, output, () => {
                        resolve();
                    });
                }).catch(() => {
                    // Not a CSV file, handle gracefully
                    console.log(`${oldPath} not a CSV file`);
                    resolve();
                });
            });
        } else {
            // Not a txt file, handle gracefully
            console.log(`${oldPath} not a .txt file`);
            resolve();
        }
    }).then(() => {
        console.log(`Ending ${oldPath}`);
    });
}

function convertDir(dir) {
    return new Promise((resolve) => {
        getFiles(dir).then((files) => {
            let promises = [];

            files.files.forEach((f) => {
                promises.push(convertFile(path.resolve(dir, f)));
            });
            
            files.dirs.forEach((d) => {
                promises.push(convertDir(path.resolve(dir, d)));
            });

            Promise.all(promises).then(resolve);
        });
    });
}

function init() {
    // Resolve the paths
    dataDir = path.resolve(dataDir);
    outDir = path.resolve(outDir);

    convertDir(dataDir).then(() => {
        console.log("Finished");
    });
}

init();