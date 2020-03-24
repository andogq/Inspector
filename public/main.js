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
    pointMenu: 1
}
let stateClasses = [
    { // Map
        pointMenu: "hidden"
    },
    { // Point menu
        map: "faded",
        pullUpMenu: "peek"
    }
];

let ui = new UI({
    map: document.getElementById("map"),
    centerPoint: document.getElementById("centerPoint"),
    pointMenu: document.getElementById("pointMenu"),
    pullUpMenu: document.getElementById("pullUpMenu")
}, states, stateClasses);

ui.addListener({
    el: "centerPoint",
    event: "click",
    callback: () => {
        ui.state = ui.states.pointMenu;
    }
});
ui.addListener({
    el: "map",
    event: ["click", "touchstart"],
    callback: () => {
        ui.state = ui.states.map;
    }
});
ui.state = 1;

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