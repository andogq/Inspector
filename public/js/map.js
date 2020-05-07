// Centers the map on the user's position
function centerOnUser() {
    return new Promise((resolve) => {
        getCurrentPosition().then((pos) => {
            g.map.flyTo({
                center: [
                    pos.lon,
                    pos.lat
                ],
                zoom: 15,
                duration: c.map.animationDuration
            });
            setTimeout(() => {
                resolve();
            }, c.map.animationDuration);
        }).catch(() => {
            notification.set("Geolocation not available", "gps_off");
        });
    });
}

// Loads the stops from the server
function loadStops() {
    return new Promise((resolve) => {
        let colors = c.colors;

        g.map.addSource("stops", {type: "geojson", data: "/data/stops.geojson"});
        g.map.addLayer({
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
        g.map.on("sourcedata", () => {
            if (g.map.getSource("stops") && g.map.isSourceLoaded("stops")) resolve();
        });
    });
}

function searchNearbyStops(query="") {
    return getCurrentPosition().then((pos) => {
        let point1 = g.map.project([pos.lon - c.map.nearbyRadius, pos.lat - c.map.nearbyRadius]);
        let point2 = g.map.project([pos.lon + c.map.nearbyRadius, pos.lat + c.map.nearbyRadius]);

        let filter = query == "" ? undefined : ["in", query, ["get", "name"]];

        let stops = g.map.queryRenderedFeatures([point1, point2], {layers: ["stops"], filter});

        return stops.sort((a, b) => {
            let dA = Math.hypot((pos.lon - a.geometry.coordinates[0]), (pos.lat - a.geometry.coordinates[1]));
            let dB = Math.hypot((pos.lon - b.geometry.coordinates[0]), (pos.lat - b.geometry.coordinates[1]));
            return dA - dB;
        });
    });
}

function loadHeatmap() {
    g.map.addSource("reports", {
        type: "geojson",
        data: "/reports"
    });
    g.map.addLayer({
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

    // Update the heatmap every x minutes
    setInterval(updateHeatmap, 1000 * 60 * c.map.updateInterval);
}

function updateHeatmap() {
    g.map.getSource("reports").setData("/reports");
}