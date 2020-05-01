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
        }).catch(() => {
            setNotification("Geolocation not available", "gps_off");
            stopLoad();
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
                    "bus_metro", colors["bus_metro"],
                    "bus_night", colors["bus_night"],
                    "bus_regional", colors["bus_regional"],
                    "bus_sky", colors["bus_sky"],
                    "bus_tele", colors["bus_tele"],
                    "coach_regional", colors["coach_regional"],
                    "interstate", colors["interstate"],
                    "train_metro", colors["train_metro"],
                    "train_regional", colors["train_regional"],
                    "tram_metro", colors["tram_metro"],
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
    let point1 = map.project([lon - nearbyOffset, lat - nearbyOffset]);
    let point2 = map.project([lon + nearbyOffset, lat + nearbyOffset]);
    return map.queryRenderedFeatures([point1, point2], {layers: ["stops"]});
}

function searchNearbyStops(query="") {
    let bounds = map.getBounds();

    let filter = query == "" ? undefined : ["in", query, ["get", "name"]];

    let stops = map.queryRenderedFeatures([map.project(bounds._sw), map.project(bounds._ne)], {layers: ["stops"], filter});
    
    return stops;
}

function loadHeatmap() {
    map.addSource("reports", {
        type: "geojson",
        data: "/reports"
    });
    map.addLayer({
        id: "reports",
        type: "heatmap",
        source: "reports",
        paint: {
            "heatmap-weight": ["get", "intensity"],
            "heatmap-radius": [
                "interpolate",
                ["linear"], ["zoom"],
                13, 30,
                15, 50,
                18, 100
            ],
            "heatmap-color": [
                "interpolate",
                ["linear"], ["heatmap-density"],
                0, "rgba(0,0,255,0)",
                0.1, "#ffffb2",
                0.3, "#feb24c",
                0.5, "#fd8d3c",
                0.7, "#fc4e2a",
                1, "#e31a1c"
            ],
            "heatmap-opacity": 0.9
        }
    });
}