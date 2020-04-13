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

setInterval(() => {
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
        console.log(JSON.parse(data));
    }});
}, 10000);

// geo.on("change", () => {
//     map.view.animate({
//         center: geo.getPosition(),
//         zoom: 15,
//         rotation: 0
//     }, 1);

//     let lonLat = ol.proj.toLonLat(geo.getPosition());

//     new APIRequest({endpoint: "/nearby", data: JSON.stringify({
//         "lat": lonLat[1],
//         "lon": lonLat[0]
//     }), callback: (data) => {
//         console.log(JSON.parse(data));
//     }});
// });

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