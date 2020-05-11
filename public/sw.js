const version = "v0.3.4";
const exclude = [
    "/sw.js",
    "/app.webmanifest"
]
const api = /^\/api\/.+$/;
const files = [
    "/",
    "/css/inputs.css",
    "/css/loader.css",
    "/css/login.css",
    "/css/map.css",
    "/css/menu.css",
    "/css/notification.css",
    "/css/page.css",
    "/css/search.css",
    "/css/states.css",
    "/data/bus_metro.geojson",
    "/data/bus_regional.geojson",
    "/data/coach_regional.geojson",
    "/data/interstate.geojson",
    "/data/train_metro.geojson",
    "/data/train_regional.geojson",
    "/data/tram_metro.geojson",
    "/icons/16x16.png",
    "/icons/32x32.png",
    "/icons/48x48.png",
    "/icons/72x72.png",
    "/icons/96x96.png",
    "/icons/144x144.png",
    "/icons/192x192.png",
    "/icons/512x512.png",
    "/js/element.js",
    "/js/geo.js",
    "/js/login.js",
    "/js/map.js",
    "/js/menu.js",
    "/js/report.js",
    "/js/search.js",
    "/favicon.ico",
    "/index.html",
    "/main.css",
    "/main.js"
]
const channel = new BroadcastChannel("inspector");

function sendMessage(data) {
    channel.postMessage(data);
}

function clearCache() {
    return caches.keys().then((names) => {
        return Promise.all(names.map(name =>  caches.delete(name)));
    });
}

channel.addEventListener("message", (e) => {
    if (e.data.get) {
        switch (e.data.get) {
            case "version":
                sendMessage({
                    version
                });
            break;
        }
    }
    if (e.data.do) {
        switch (e.data.do) {
            case "clearCache":
                clearCache().then(() => {
                    sendMessage({success: true});
                });
            break;
        }
    }
});
this.addEventListener("install", (e) => {
    e.waitUntil(caches.open(version).then((cache) => {
        return cache.addAll(files);
    }));
});

this.addEventListener("activate", (e) => {
    e.waitUntil(clearCache());
});

this.addEventListener("fetch", (e) => {
    e.respondWith(caches.match(e.request).then((res) => {
        if (res) return res;
        else return fetch(e.request).then((res) => {
            let path = new URL(e.request.url).pathname;
            if (!res || res.status != 200 || res.type != "basic" || e.request.method != "GET"
                || exclude.indexOf(path) != -1 || api.test(path)) return res;
            else {
                let clone = res.clone();

                caches.open(version).then((cache) => {
                    cache.put(e.request, clone);
                });

                return res;
            }
        });
    }));
});