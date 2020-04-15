let melbCoords = new Coord(144.9631, -37.8136);

let map = new Map({
    id: "map",
    source: "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png",
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

    let lonLat = ol.proj.toLonLat(geo.getPosition());

    new APIRequest({endpoint: "/nearby", data: JSON.stringify({
        "lat": lonLat[1],
        "lon": lonLat[0]
    }), callback: (data) => {
        data = JSON.parse(data);
        data.forEach((stop) => {
            drawStop(new Coord(stop.lon, stop.lat), stop.type);
        });
    }});
});

let layers = {};
function newLayer(name, color, icon) {
    let layer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({color: color})
            }),
            text: new ol.style.Text({
                text: icon,
                font: '5vmin Material Icons',
                fill: new ol.style.Fill({color: "white"})
            })
        })
    });
    map.addLayer(layer);
    layers[name] = layer;

    return layer;
}

newLayer("bus_metro", "orange", "directions_bus");
newLayer("bus_regional", "orange", "directions_bus");
newLayer("train_metro", "blue", "train");
newLayer("train_regional", "purple", "train");
newLayer("tram_metro", "green", "tram");

function drawStop(coord, type) {
    let layer = layers[type];
    if (layer != undefined) {
        let feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([coord.lon, coord.lat]))
        });
        layer.getSource().addFeature(feature);
    }
}

let controller = new Controller();
// Map state, for when the user is only on the map
controller.addState("map", [
    {
        target: "pointMenu",
        add: "hidden"
    },
    {
        target: "map",
        remove: "faded"
    }
], {
    trigger: {
        mousemove: "map"
    },
    callback: function() {
        menu.hide();
    }
});
// Menu state, when the menu is peeking and the point menu is showing
controller.addState("menu", [
    {
        target: "pointMenu",
        remove: "hidden"
    },
    {
        target: "map",
        add: "faded"
    }
], {
    trigger: {click: "centerPoint"},
    callback: function() {
        menu.show();
    }
});

// States for the pages
controller.addState("reportPage", ["menu",
    {
        target: "reportPage",
        add: "show"
    }
], {
    trigger: {click: "report"},
    callback: function() {
        menu.moveTo(1);
    }
});
controller.addState("accountPage", ["menu",
    {
        target: "accountPage",
        add: "show"
    }
], {
    trigger: {click: "account"},
    callback: function() {
        menu.moveTo(1);
    }
});

menu.init();