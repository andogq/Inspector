// Requests and resolves the user's location
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation == undefined) reject();
        else navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0
        });
    }).then((pos) => {
        return {
            lon: pos.coords.longitude,
            lat: pos.coords.latitude
        }
    });
}