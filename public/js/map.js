// Adds an array of points to the map
function addStops(s) {
    let features = [];
    
    let ids = [];
    stops.push(...s);
    stops.forEach((stop) => {
        if (ids.indexOf(stop.id) == -1) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [stop.lon, stop.lat]
                },
                properties: {
                    type: stop.type
                }
            });
            ids.push(stop.id);
        }
    });

    let source = map.getSource("stops");

    if (source == undefined) {
        map.addSource("stops", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: []
            }
        });

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

        source = map.getSource("stops");
    }

    source.setData({
        type: "FeatureCollection",
        features
    });
}

// Centers the map on the user's position
function centerOnUser() {
    return new Promise((resolve) => {
        let duration = 1000;
        getCurrentPosition().then((pos) => {
            map.flyTo({
                center: [
                    pos.coords.longitude,
                    pos.coords.latitude
                ],
                zoom: 15,
                duration
            });
            setTimeout(() => {
                resolve();
            }, duration);
        });
    });
}

// Loads nearby stops onto the map from the center of the map
function getSurrounding() {
    let pos = map.getCenter();
    nearby(pos.lat, pos.lng).then(addStops).catch(console.error);
}