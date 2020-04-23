function locationAutoFill() {
    let el = controller.e("fullScreenInput");
    el.classList.remove("hidden");

    el.children[0].focus();

    let input = controller.e("location");

    let container = el.children[1];
    container.innerHTML = "";

    let pos = map.getCenter();
    let suggestions = nearby(pos.lat, pos.lng);

    suggestions.forEach((suggestion) => {
        let row = document.createElement("div");
        row.classList.add("row");
        row.addEventListener("click", (e) => {
            input.value = e.target.innerText;
            el.classList.add("hidden");
        })
        
        let dot = document.createElement("div");
        dot.classList.add("dot");
        dot.style.background = colors[suggestion.properties.type];
        row.appendChild(dot);

        let name = document.createElement("p");
        name.innerText = suggestion.properties.name;
        row.appendChild(name);

        container.appendChild(row);
    });
}