function locationSearch(query) {
    return new Promise((resolve) => {
        searchNearbyStops(query).then((results) => {
            function makeRow(color, text) {
                let row = document.createElement("div");
                row.classList.add("row");
                
                let dot = document.createElement("div");
                dot.classList.add("dot");
                dot.style.background = color;
                row.appendChild(dot);
    
                let p = document.createElement("p");
                p.innerText = text;
                row.appendChild(p);
    
                return row;
            }
    
            let els = [];
    
            if (results.length > 0) results.forEach((result) => {
                let row = makeRow(result.layer.paint["circle-color"], result.properties.name);
                
                row.stopData = JSON.stringify({id: result.properties.id, name: result.properties.name});
        
                // Add the event listener for when it's clicked
                row.addEventListener("click", (e) => {
                    let target = e.target;
                    // Get to the row element
                    while (!target.classList.contains("row")) target = target.parentElement;
        
                    // Load the data into the location input
                    let data = JSON.parse(target.stopData);
                    dom.input.report.location.value = data.name;
                    dom.input.report.location.stopId = data.id;
                    
                    // Hide the element
                    search.hide();
        
                    validateInput();
                });
        
                els.push(row);
            });
            else {
                let row = makeRow("red", "No nearby places found...");
        
                // Add the row to the container
                els.push(row);
            }
    
            resolve(els);
        });
    });
}

function validateInput() {
    let amount = dom.input.report.amount;
    let location = dom.input.report.location;
    let dress = dom.input.report.dress;
    let time = dom.input.report.time;
    let reportButton = dom.button.submitReport;

    if (amount.value && location.stopId && dress.value && time.value != "") reportButton.disabled = false;
    else reportButton.disabled = true;
}

function sendReport() {
    if (!g.loggedIn) state.set("login");
    else if (g.online) {
        firebase.auth().currentUser.getIdToken().then((token) => {
            let loadId = load.start();
            dom.button.submitReport.disabled = true;

            let amount = Number(dom.input.report.amount.value.replace("+", ""));
            let stopId = Number(dom.input.report.location.stopId);
            let dress = ["Uniformed", "Plain Clothes"].indexOf(dom.input.report.dress.value);
            let d = dom.input.report.time.value.split(":");
            
            let time = new Date();

            time.setHours(d[0]);
            time.setMinutes(d[1]);
            time = time.toISOString();

            if (amount && stopId && dress != undefined && time != "") {
                // Hide the report page
                state.set("map");

                fetch("/api/submit_report", {method: "POST", body: JSON.stringify({amount, stopId, dress, time, token})}).then((response) => {
                    if (response.ok) {
                        // It all went well
                        notification.set("Report submitted!", "done");
                        firebase.analytics().logEvent("report");
                    } else {
                        // Something went wrong
                        throw new Error(`Error with request: ${response.status}`);
                    }
                }).catch((e) => {
                    console.error(e);
                    notification.set("There was an error submitting your report");
                }).finally(() => {
                    // Reset the form
                    dom.input.report.amount.value = undefined;
                    dom.input.report.amount.getElementsByClassName("selected")[0].classList.remove("selected");
                    dom.input.report.dress.value = undefined;
                    dom.input.report.dress.getElementsByClassName("selected")[0].classList.remove("selected");
                    dom.input.report.location.stopId = undefined;
                    dom.input.report.location.value = "";

                    let d = new Date();
                    let hours = String(d.getHours()).padStart(2, "0");
                    let minutes = String(d.getMinutes()).padStart(2, "0");
                    dom.input.report.time.value = `${hours}:${minutes}`;
                    dom.button.submitReport.disabled = true;

                    load.stop(loadId);
                    dom.button.submitReport.disabled = true;

                    // Refresh the heatmap
                    updateHeatmap();
                });
            }
        });
    }
    else notification.set("You are offline, please try again later");
}