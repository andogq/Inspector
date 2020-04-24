function locationInput() {
    // Show the fullscreen input
    let fullScreenEl = controller.e("fullScreenInput");
    fullScreenEl.classList.remove("hidden");

    // Save elements
    let actualInput = fullScreenEl.children[0].children[1];
    let locationInput = controller.e("location");
    let container = fullScreenEl.children[1];
    
    // Clear any suggestions and focus the input
    container.innerHTML = "";
    actualInput.focus();

    // Back button
    fullScreenEl.children[0].children[0].addEventListener("click", () => fullScreenEl.classList.add("hidden"), true);

    // Load the suggestions
    let pos = map.getCenter();
    nearby(pos.lat, pos.lng).forEach((suggestion) => {
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
            locationInput.value = data.name;
            locationInput.stopId = data.id;
            
            // Hide the element
            fullScreenEl.classList.add("hidden");
        });
        
        //  Create and color the dot
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
}