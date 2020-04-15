// Requests /api
function nearby(lat, lon) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.onload = () => {
            let points = JSON.parse(xhr.responseText);
            resolve(points);
        }
        xhr.onerror = reject;
        xhr.open("POST", "/nearby");
    
        xhr.send(JSON.stringify({lat, lon}));
    });
}