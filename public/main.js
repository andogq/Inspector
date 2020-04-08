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

menu.init();


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