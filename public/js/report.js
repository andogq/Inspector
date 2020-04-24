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