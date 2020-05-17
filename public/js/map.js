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
            notification.set("Geolocation not available. Check your device's permission settings.", "gps_off");
        });
    });
}

// Jumps to the user
function jumpToUser() {
    getCurrentPosition().then(({lat, lon}) => {
        g.map.setZoom(15);
        g.map.setCenter([lon, lat])
    });
}

// Loads the sources from the server
function loadSources() {
    let colors = c.colors;
    let paint = {
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

    g.sources = [];

    return Promise.all(c.map.sources.map((sourceUrl) => {
        return new Promise((resolve) => {
            let sourceName = sourceUrl.replace(/^.+\/(.+)\.geojson$/, "$1");

            g.map.addSource(sourceName, {
                type: "geojson",
                data: sourceUrl
            });
            g.map.addLayer({
                id: sourceName,
                type: "circle",
                source: sourceName,
                paint: {
                    "circle-radius": 5,
                    "circle-color": c.colors[sourceName]
                }
            });

            g.sources.push(sourceName);

            g.map.on("sourcedata", () => {
                if (g.map.getSource(sourceName) && g.map.isSourceLoaded(sourceName)) resolve();
            });
        });
    }));
}

function searchNearbyStops(query="") {
    return getCurrentPosition().then((pos) => {
        let point1 = g.map.project([pos.lon - c.map.nearbyRadius, pos.lat - c.map.nearbyRadius]);
        let point2 = g.map.project([pos.lon + c.map.nearbyRadius, pos.lat + c.map.nearbyRadius]);

        let filter = query == "" ? undefined : ["in", query, ["get", "name"]];

        let stops = g.map.queryRenderedFeatures([point1, point2], {layers: g.sources, filter});

        return stops.sort((a, b) => {
            let dA = Math.hypot((pos.lon - a.geometry.coordinates[0]), (pos.lat - a.geometry.coordinates[1]));
            let dB = Math.hypot((pos.lon - b.geometry.coordinates[0]), (pos.lat - b.geometry.coordinates[1]));
            return dA - dB;
        });
    });
}

function getReports() {
    return new Promise((resolve, reject) => {
        fetch("/api/reports").then((res) => {
            if (res.ok) {
                res.text().then((reports) => {
                    reports = JSON.parse(reports);
                    g.reports = reports;
                    
                    // Generate the geojson
                    let geojson = {
                        type: "FeatureCollection",
                        features: []
                    }
                    
                    Object.keys(reports).forEach((id) => {
                        let report = reports[id];
                        report.lastReport = new Date(report.lastReport);

                        geojson.features.push({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [
                                    report.coordinates.lon,
                                    report.coordinates.lat
                                ]
                            },
                            properties: report
                        });
                    });

                    resolve(geojson);
                });
            } else reject(res.status);
        });
    }).catch((e) => {
        console.error(e);
        notification.set("There was an error retrieving recent reports. Try refresh the page and check your internet connection.");
    });
}

function initHeatmap() {
    return getReports().then((reports) => {
        g.map.addSource("src_reports", {
            type: "geojson",
            data: reports
        });
        g.map.addLayer({
            id: "reports",
            type: "heatmap",
            source: "src_reports",
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
    });
}

function updateHeatmap() {
    if (g.online) getReports().then((reports) => {
        g.map.getSource("src_reports").setData(reports);
    });
}

function reportDetail(e) {
    e = e.changedTouches[0];

    let point1 = [e.clientX - c.map.touchRadius, e.clientY - c.map.touchRadius];
    let point2 = [e.clientX + c.map.touchRadius, e.clientY + c.map.touchRadius];

    let stops = g.map.queryRenderedFeatures([point1, point2], {layers: g.sources});

    let latLonPoint = g.map.unproject([e.clientX, e.clientY]);
    let closest = stops.sort((a, b) => {
        let dA = Math.hypot((latLonPoint[0] - a.geometry.coordinates[0]), (latLonPoint[1] - a.geometry.coordinates[1]));
        let dB = Math.hypot((latLonPoint[0] - b.geometry.coordinates[0]), (latLonPoint[1] - b.geometry.coordinates[1]));
        return dA - dB;
    })[0];

    if (closest && closest.properties.id in g.reports) {
        let report = g.reports[closest.properties.id];
        dom.reportDetails.amount.innerText = report.amount;
        dom.reportDetails.reports.innerText = report.reports;

        let timePassed = Math.round((Date.now() - report.lastReport) / (1000 * 60));
        dom.reportDetails.lastReport.innerText = `${timePassed}mins ago`;

        
        dom.reportDetails.dress.innerText = report.dress[0] > report.dress[1] ? "Uniform" : "Plain Clothes";

        state.el(dom.reportDetails.container, "show");
    } else state.reset(dom.reportDetails.container);
}