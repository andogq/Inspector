let melbCoords = new Coord(144.9631, -37.8136);

let map = new Map({
    id: "map",
    center: melbCoords,
    zoom: 10,
    showZoom: false
});
let heatmap = new Heatmap(map);
let network = new Network(map, "red", 1);

function getCenter() {
    return ol.proj.toLonLat(map.view.getCenter());
}

let geo = new ol.Geolocation({
    tracking: true,
    trackingOptions: {
        enableHighAccuracy: true
    },
    projection: map.view.getProjection()
});

geo.on("change", () => {
    map.view.animate({
        center: geo.getPosition(),
        zoom: 15,
        rotation: 0
    }, 1);
});

let states = {
    map: 0,
    pointMenu: 1,
    pullUpMenuDrag: 2,
    pullUpMenuExtended: 3
}
let stateClasses = [
    { // Map
        pointMenu: "hidden"
    },
    { // Point menu
        map: "faded",
        pullUpMenu: "peek"
    },
    { // Pull up menu drag
        map: "faded",
        pullUpMenu: "drag"
    },
    { // Pull up menu extended
        map: "faded",
        pullUpMenu: "pop"
    }
];

let ui = new UI(states, stateClasses);

ui.addListener({
    el: "centerPoint",
    event: "touchstart",
    callback: () => {
        ui.state = ui.states.pointMenu;
    }
});
ui.addListener({
    el: "map",
    event: "touchstart",
    callback: () => {
        ui.state = ui.states.map;
    }
});
ui.addListener({
    el: "report",
    event: "touchstart",
    callback: () => {
        ui.state = ui.states.pullUpMenuExtended;
    }
});
ui.addListener({
    el: "amount",
    event: "touchstart",
    callback: (e) => {
        let selected = ui.el("amount").getElementsByClassName("selected");
        if (selected.length > 0) selected[0].classList.remove("selected");
        if (e.path[0] != ui.el("amount")) e.path[0].classList.add("selected");
    }
});

// Set things up for the draggable menu
let y0;
let menuStart;
let threshold = 0.65;
let minTop = 0.3;
ui.addListener({
    el: "pullUpMenu",
    event: "touchstart",
    callback: (e) => {
        y0 = e.changedTouches[0].clientY;
        menuStart = Number(window.getComputedStyle(ui.el("pullUpMenu")).top.replace("px", ""));
    }
});
ui.addListener({
    el: "pullUpMenu",
    event: "touchmove",
    callback: (e) => {
        let y = e.changedTouches[0].clientY;
        let dy = y - y0;

        if (ui.state != ui.states.pullUpMenuDrag && Math.abs(dy) > 10) ui.state = ui.states.pullUpMenuDrag;

        // Recheck because it may change
        if (ui.state == ui.states.pullUpMenuDrag) {
            ui.el("pullUpMenu").style.top = (menuStart + dy) + "px";
        }
    }
});
ui.addListener({
    el: "pullUpMenu",
    event: ["touchend", "touchcancel"],
    callback: (e) => {
        // Current top of the menu
        let menuTop = Number(window.getComputedStyle(ui.el("pullUpMenu")).top.replace("px", ""));

        // If the top of the menu is above the threshold
        if (menuTop < threshold * document.body.clientHeight) {
            // Spring open
            ui.state = ui.states.pullUpMenuExtended;

            //* Set a custom top on the element if the user has dragged it up
            // Minimum for menuTop
            let minTopPx = minTop * document.body.clientHeight;
            // Set to the smallest (closest to the top)
            ui.el("pullUpMenu").style.top = (menuTop > minTopPx ? minTopPx : menuTop) + "px";
        } else {
            // Snap shut, remove any styling put in by the class
            ui.el("pullUpMenu").style.top = ""
            ui.state = ui.states.pointMenu;
        }
    }
});

ui.state = 3;

// let data;
// let xhr = new XMLHttpRequest();
// xhr.onload = () => {
//     data = JSON.parse(xhr.responseText);

//     data.forEach((line) => {
//         network.addLine(line.map(p => new Coord(...p)));
//     });
// }
// xhr.open("GET", "/data.json");
// xhr.send();