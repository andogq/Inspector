// Adds an array of points to the map
function addStops(stops) {
    let geo = {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: []
        }
    };

    stops.forEach((stop) => {
        geo.data.features.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [stop.lon, stop.lat]
            },
            properties: {
                type: stop.type
            }
        });
    });

    map.addSource("stops", geo);

    map.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
            "circle-radius": 5,
            "circle-color": [
                "match", ["get", "type"],
                "bus_metro", "#e67e22",
                "bus_regional", "#e67e22",
                "train_metro", "#2980b9",
                "train_regional", "#8e44ad",
                "tram_metro", "#27ae60",
                "white"
            ]
        }
    });
}

// Centers the map on the user's position
function centerOnUser() {
    getCurrentPosition().then((pos) => {
        map.flyTo({
            center: [
                pos.coords.longitude,
                pos.coords.latitude
            ],
            zoom: 15
        });
    });
}

// Loads nearby stops onto the map
function getSurrounding() {
    getCurrentPosition().then((pos) => {
        nearby(pos.coords.latitude, pos.coords.longitude).then(addStops).catch(console.error);
    });
}