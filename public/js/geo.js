// Requests and resolves the user's location
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation == undefined) reject();
        else navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}