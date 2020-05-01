function locationInput() {
    // Show the fullscreen input
    let fullScreenEl = controller.e("fullScreenInput");
    fullScreenEl.classList.remove("hidden");

    // Save elements
    let actualInput = fullScreenEl.children[0].children[1];
    
    // Clear any suggestions and focus the input
    actualInput.focus();

    // Back button
    fullScreenEl.children[0].children[0].addEventListener("click", () => fullScreenEl.classList.add("hidden"), true);

    actualInput.addEventListener("keyup", () => {
        addSuggestions(searchNearbyStops(actualInput.value));
    });

    // Load the suggestions
    addSuggestions(map.queryRenderedFeatures({layers: ["stops"]}));
}

function addSuggestions(suggestions) {
    let fullScreenEl = controller.e("fullScreenInput");
    let container = fullScreenEl.children[1];
    let input = controller.e("location");
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
            fullScreenEl.classList.add("hidden");

            validateInput();
        });
        
        // Create and color the dot
        let dot = document.createElement("div");
        dot.classList.add("dot");
        dot.style.background = colors[suggestion.properties.type];
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
    let amount = controller.e("amount");
    let location = controller.e("location");
    let time = controller.e("time");
    let reportButton = controller.e("submit");

    if (amount.value != undefined && location.stopId != undefined && time.value != "") reportButton.disabled = false;
    else reportButton.disabled = true;
}

function sendReport() {
    let amount = Number(controller.e("amount").value.replace("+", ""));
    let stopId = Number(controller.e("location").stopId);
    let d = controller.e("time").value.split(":");
    
    let time = new Date();

    time.setHours(d[0]);
    time.setMinutes(d[1]);
    time = time.toISOString();

    if (amount != undefined && stopId != undefined && time != "") {
        // Hide the report page
        controller.state = "map";
        menu.hide();

        startLoad();

        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            stopLoad();

            if (xhr.status == 404) {
                setNotification("There was an error submitting your report", "error");
                setTimeout(hideNotification, 5000);
            }

            // Reset the form
            controller.e("amount").value = undefined;
            controller.e("amount").getElementsByClassName("selected")[0].classList.remove("selected");
            controller.e("location").stopId = undefined;
            controller.e("location").value = "";
            let d = new Date();
            controller.e("time").value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            controller.e("submit").disabled = true;

            // Refresh the heatmap
            updateHeatmap();
        }
        xhr.onerror = (e) => {
            console.error(e);

            stopLoad();
            setNotification("There was an error submitting your report", "error");
        }
        xhr.open("POST", "/report");
        xhr.send(JSON.stringify({amount, stopId, time}));
    }
}