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

// Loads the stops from the server
function loadStops() {
    return new Promise((resolve) => {
        map.addSource("stops", {type: "geojson", data: "/data/stops.geojson"});
        map.addLayer({
            id: "stops",
            type: "circle",
            source: "stops",
            paint: {
                "circle-radius": 5,
                "circle-color": [
                    "match", ["get", "type"],
                    "bus_metro", "#e67e22",
                    "bus_night", "#e67e22",
                    "bus_regional", "#e67e22",
                    "bus_sky", "#e74c3c",
                    "bus_tele", "#e67e22",
                    "coach_regional", "#8e44ad",
                    "interstate", "#8e44ad",
                    "train_metro", "#2980b9",
                    "train_regional", "#8e44ad",
                    "tram_metro", "#27ae60",
                    "white"
                ]
            }
        });
        map.on("sourcedata", () => {
            if (map.getSource("stops") && map.isSourceLoaded("stops")) resolve();
        });
    });
}

function nearby(lat, lon) {
    
}