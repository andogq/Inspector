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

let ui = new UI({
    map: document.getElementById("map"),
    centerPoint: document.getElementById("centerPoint"),
    pointMenu: document.getElementById("pointMenu"),
    pullUpMenu: document.getElementById("pullUpMenu"),
    buttonTab: document.getElementById("buttonTab"),
    report: document.getElementById("report"),
    amount: document.getElementById("amount")
}, states, stateClasses);

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
        let selected = ui.el.amount.getElementsByClassName("selected");
        if (selected.length > 0) selected[0].classList.remove("selected");
        if (e.path[0] != ui.el.amount) e.path[0].classList.add("selected");
    }
});

// Set things up for the draggable menu
let y0;
let threshold = 0.3;
ui.addListener({
    el: "buttonTab",
    event: "touchstart",
    callback: (e) => {
        y0 = e.changedTouches[0].clientY;
    }
});
ui.addListener({
    el: "buttonTab",
    event: "touchmove",
    callback: (e) => {
        let y = e.changedTouches[0].clientY;

        if (ui.state != ui.states.pullUpMenuDrag) {
            let dy = Math.abs(y0 - y);

            if (dy > 10) ui.state = ui.states.pullUpMenuDrag;
        }
        // Recheck because it may change
        if (ui.state == ui.states.pullUpMenuDrag) ui.el.pullUpMenu.style.top = y + "px";
    }
});
ui.addListener({
    el: "buttonTab",
    event: ["touchend", "touchcancel"],
    callback: (e) => {
        if (e.changedTouches[0].clientY < ((1 - threshold) * document.body.clientHeight)) ui.state = ui.states.pullUpMenuExtended;
        else ui.state = ui.states.pointMenu;

        // Remove any styling put in by the class
        ui.el.pullUpMenu.style.top = ""
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