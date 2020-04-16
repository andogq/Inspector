// Rounds a number to a specific number of places
function round(n) {
    return Math.round((Number(n) + Number.EPSILON) * Math.pow(10, rounding)) / Math.pow(10, rounding);
}

// Requests /api
function nearby(lat, lon) {
    lat = round(lat);
    lon = round(lon);

    return new Promise((resolve, reject) => {
        if (loadedCoords.indexOf(`${lat},${lon}`) == -1) {
            let xhr = new XMLHttpRequest();
            xhr.onload = () => {
                let points = JSON.parse(xhr.responseText);
                resolve(points);
            }
            xhr.onerror = reject;
            xhr.open("POST", "/nearby");
        
            xhr.send(JSON.stringify({lat, lon}));

            loadedCoords.push(`${lat},${lon}`);
        } else reject("Coordinates already loaded");
    });
}