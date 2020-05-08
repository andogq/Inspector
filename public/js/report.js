function locationInput() {
    // Show the fullscreen input
    let fullScreenEl = dom.fullScreen.el;
    fullScreenEl.setAttribute("state", "show");

    // Save elements
    let actualInput = dom.input.fullScreen;
    
    // Clear any suggestions and focus the input
    actualInput.focus();

    // Back button
    dom.fullScreen.back.addEventListener("click", () => {
        fullScreenEl.removeAttribute("state");
    }, {once: true});

    actualInput.addEventListener("keyup", () => {
        searchNearbyStops(actualInput.value).then(addSuggestions);
    });

    // Load the suggestions
    searchNearbyStops(actualInput.value).then(addSuggestions);
}

function addSuggestions(suggestions) {
    let fullScreenEl = dom.fullScreen.el;
    let container = dom.fullScreen.suggestions;
    let input = dom.input.report.location;
    container.innerHTML = "";

    if (suggestions.length > 0) suggestions.forEach((suggestion) => {
        // Create the row and save the data for it
        let row = document.createElement("div");
        row.classList.add("row");
        row.stopData = JSON.stringify({id: suggestion.properties.id, name: suggestion.properties.name});

        // Add the event listener for when it's clicked
        row.addEventListener("click", (e) => {
            let target = e.target;
            // Get to the row element
            while (!target.classList.contains("row")) target = target.parentElement;

            // Load the data into the location input
            let data = JSON.parse(target.stopData);
            input.value = data.name;
            input.stopId = data.id;
            
            // Hide the element
            fullScreenEl.removeAttribute("state");

            validateInput();
        });
        
        // Create and color the dot
        let dot = document.createElement("div");
        dot.classList.add("dot");
        dot.style.background = c.colors[suggestion.properties.type];
        row.appendChild(dot);

        // Create and add the name of the stop
        let name = document.createElement("p");
        name.innerText = suggestion.properties.name;
        row.appendChild(name);

        // Add the row to the container
        container.appendChild(row);
    });
    else {
        let row = document.createElement("div");
        row.classList.add("row");
        
        // Create and color the dot
        let dot = document.createElement("div");
        dot.classList.add("dot");
        dot.style.background = "red";
        row.appendChild(dot);

        // Create and add the name of the stop
        let name = document.createElement("p");
        name.innerText = "No nearby places found...";
        row.appendChild(name);

        // Add the row to the container
        container.appendChild(row);
    }
}

function validateInput() {
    let amount = dom.input.report.amount;
    let location = dom.input.report.location;
    let time = dom.input.report.time;
    let reportButton = dom.button.reportSubmit;

    if (amount.value != undefined && location.stopId != undefined && time.value != "") reportButton.disabled = false;
    else reportButton.disabled = true;
}

function sendReport() {
    firebase.auth().currentUser.getIdToken().then((token) => {
        let amount = Number(dom.input.report.amount.value.replace("+", ""));
        let stopId = Number(dom.input.report.location.stopId);
        let d = dom.input.report.time.value.split(":");
        
        let time = new Date();

        time.setHours(d[0]);
        time.setMinutes(d[1]);
        time = time.toISOString();

        if (amount != undefined && stopId != undefined && time != "") {
            // Hide the report page
            document.body.setAttribute("state", "map");

            request({method: "POST", url: "/report", data: {amount, stopId, time, token}}).then(() => {
                notification.set("Report submitted!", "done");
            }).catch(() => {
                notification.set("There was an error submitting your report");
            }).finally(() => {
                // Reset the form
                dom.input.report.amount.value = undefined;
                dom.input.report.amount.getElementsByClassName("selected")[0].classList.remove("selected");
                dom.input.report.location.stopId = undefined;
                dom.input.report.location.value = "";

                let d = new Date();
                let hours = String(d.getHours()).padStart(2, "0");
                let minutes = String(d.getMinutes()).padStart(2, "0");
                dom.input.report.time.value = `${hours}:${minutes}`;
                dom.button.reportSubmit.disabled = true;

                // Refresh the heatmap
                updateHeatmap();
            });
        }
    });
}